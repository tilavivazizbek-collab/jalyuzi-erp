/**
 * lib/db/schema/narx.ts — TZ 3.8 · 6.2 · 20.9 · Egasi qarori 2026-09-20
 *
 * ⚠️ NEGA BU JADVALLAR BOR
 *
 * Ilgari mijoz narxi MATERIALLARDAN yig'ilardi:
 *
 *     Σ(slot miqdori × o'sha matoning narxi) + Σ(aksessuar × narxi)
 *
 * Egasi buni RAD ETDI (2026-09-20): «endi men belgilab qo'yaman
 * mijozga narx qanday hisoblanishini».
 *
 * Endi narx MAHSULOT TURI va MATO DARAJASI juftligiga qo'yiladi,
 * maydon bo'yicha bosqichli:
 *
 *     Rulon + Oddiy mato    0 – 0.5 kv.m    8 $
 *                           0.5 – 1        5 $
 *                           1 dan katta    3 $
 *
 * ⚠️ MATERIAL NARXLARI O'CHIRILMAYDI. `material.sotuv_narx`,
 *    `material_tur_narx` va `material_filial_narx` joyida qoladi:
 *    ular tayyor mahsulotni TO'G'RIDAN-TO'G'RI sotishda hamon
 *    ishlatiladi (slotsiz pozitsiya) va tannarx/ustama hisobida
 *    kerak. Faqat JALYUZI narxi endi ulardan kelmaydi.
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { id, izlar, ochirilmaydi } from './ustunlar';
import { filial } from './asos';
import {
  almashtirishGuruh,
  mahsulotTur,
  material,
  mijozTuri,
  narxGuruh,
} from './spravochnik';
import { buyurtmaPozitsiya } from './buyurtma';

/** Narx nimadan hisoblanadi */
export const HISOBLASH_USULLARI = ['MAYDON', 'ENI', "BO'YI", 'DONA'] as const;

/** Qo'shimcha narxi nimadan hisoblanadi — `QATIY` o'lchamdan bog'liq emas */
export const QOSHIMCHA_USULLARI = ['QATIY', 'MAYDON', 'ENI', "BO'YI"] as const;

// ─── Narx qoidasi — tur × daraja ──────────────────────────────────────────

/**
 * Bitta mahsulot turi va bitta mato darajasi uchun narx qoidasi.
 *
 * ⚠️ `mijoz_turi_id` va `filial_id` IXTIYORIY — bu loyihadagi mavjud
 *    naqsh (`material_tur_narx`, `material_filial_narx`):
 *
 *        yozuv bo'lsa — shu narx, bo'lmasa umumiysi
 *
 *    Bo'sh qolsa qoida HAMMAGA tegishli. To'ldirilsa faqat o'sha
 *    mijoz turiga yoki filialga. Shu tufayli TZ 6.2 va 20.9
 *    imkoniyatlari saqlanadi, lekin jadval shishmaydi: farq
 *    bo'lmagan joyga qator yozilmaydi.
 */
export const mahsulotNarx = pgTable(
  'mahsulot_narx',
  {
    id: id(),
    mahsulotTurId: bigint('mahsulot_tur_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotTur.id),
    narxGuruhId: bigint('narx_guruh_id', { mode: 'number' })
      .notNull()
      .references(() => narxGuruh.id),

    /** TZ 6.2 — bo'sh bo'lsa hamma mijoz turiga */
    mijozTuriId: bigint('mijoz_turi_id', { mode: 'number' }).references(() => mijozTuri.id),
    /** TZ 20.9 — bo'sh bo'lsa hamma filialga */
    filialId: bigint('filial_id', { mode: 'number' }).references(() => filial.id),

    /** `MAYDON` · `ENI` · `BO'YI` · `DONA` */
    hisoblashUsuli: text('hisoblash_usuli').notNull().default('MAYDON'),

    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    /**
     * ⚠️ `coalesce` bilan: Postgresda NULL lar bir-biriga TENG EMAS,
     *    shuning uchun oddiy unique index ikkita «hammaga» qatorini
     *    o'tkazib yuborardi.
     */
    uniqueIndex('mahsulot_narx_bitta').on(
      t.mahsulotTurId,
      t.narxGuruhId,
      sql`coalesce(${t.mijozTuriId}, 0)`,
      sql`coalesce(${t.filialId}, 0)`,
    ),
    check('mahsulot_narx_usul', sql`${t.hisoblashUsuli} IN ('MAYDON','ENI','BO''YI','DONA')`),
    index('mahsulot_narx_tur').on(t.mahsulotTurId, t.faol),
  ],
);

// ─── Bosqichlar ───────────────────────────────────────────────────────────

/**
 * Narx bosqichi: «0.5 kv.m gacha 8 $, keyin 5 $, 1 dan katta 3 $».
 *
 * ⚠️ `dan` va `gacha` ning BIRLIGI qoidaning `hisoblash_usuli` iga
 *    bog'liq: `MAYDON` da kv.m, `ENI`/`BO'YI` da metr, `DONA` da dona.
 *    Bitta ustun ikki xil birlikda bo'lmaydi — chunki bitta qoidada
 *    bitta usul bo'ladi.
 *
 * ⚠️ `gacha` bo'sh = CHEKSIZ. Oxirgi bosqich doim shunday bo'ladi,
 *    aks holda katta buyurtmaga narx topilmasdi.
 */
export const mahsulotNarxBosqich = pgTable(
  'mahsulot_narx_bosqich',
  {
    id: id(),
    mahsulotNarxId: bigint('mahsulot_narx_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotNarx.id),

    dan: numeric('dan', { precision: 10, scale: 2 }).notNull().default('0'),
    /** Bo'sh = cheksiz */
    gacha: numeric('gacha', { precision: 10, scale: 2 }),

    narx: numeric('narx', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull().default('SOM'),

    tartib: integer('tartib').notNull().default(0),
    faol: boolean('faol').notNull().default(true),
    ...izlar,
  },
  (t) => [
    check('narx_bosqich_dan', sql`${t.dan} >= 0`),
    check('narx_bosqich_gacha', sql`${t.gacha} IS NULL OR ${t.gacha} > ${t.dan}`),
    check('narx_bosqich_narx', sql`${t.narx} >= 0`),
    check('narx_bosqich_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    index('narx_bosqich_qoida').on(t.mahsulotNarxId, t.dan),
  ],
);

// ─── Qo'shimchalar ────────────────────────────────────────────────────────

/**
 * Mijoz tanlashi mumkin bo'lgan qo'shimcha: «usti shabalik», «o'rnatish».
 *
 * ⚠️ Ikki xil qo'shimcha bor va farqi MUHIM:
 *
 *     material_id TO'LDIRILGAN  — material yeydi. Ombordan yechiladi,
 *                                 ro'yxatda miqdori ko'rinadi.
 *                                 Sarfi `formula` bilan hisoblanadi.
 *     material_id BO'SH         — faqat pul qo'shadi. Ombordan hech
 *                                 narsa yechilmaydi (o'rnatish haqi).
 *
 *    Shuning uchun `formula` ham ixtiyoriy — lekin material bo'lsa
 *    u SHART, aks holda nechta yechishni hech kim bilmaydi.
 */
export const mahsulotQoshimcha = pgTable(
  'mahsulot_qoshimcha',
  {
    id: id(),
    mahsulotTurId: bigint('mahsulot_tur_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotTur.id),
    nom: text('nom').notNull(),

    /** `QATIY` · `MAYDON` · `ENI` · `BO'YI` */
    hisoblashUsuli: text('hisoblash_usuli').notNull().default('QATIY'),
    narx: numeric('narx', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull().default('SOM'),

    /** Bo'sh bo'lsa ombordan hech narsa yechilmaydi */
    materialId: bigint('material_id', { mode: 'number' }).references(() => material.id),
    /** `material_id` bo'lsa SHART — sarf formulasi */
    formula: text('formula'),

    /** Almashtirish guruhi berilsa sotuvchi material tanlaydi (mato rangi) */
    almashtirishGuruhId: bigint('almashtirish_guruh_id', { mode: 'number' }).references(
      () => almashtirishGuruh.id,
    ),

    tartib: integer('tartib').notNull().default(0),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check('qoshimcha_nom', sql`length(btrim(${t.nom})) > 0`),
    check('qoshimcha_usul', sql`${t.hisoblashUsuli} IN ('QATIY','MAYDON','ENI','BO''YI')`),
    check('qoshimcha_narx', sql`${t.narx} >= 0`),
    check('qoshimcha_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    /**
     * ⚠️ Material bor, formula yo'q — bu jim xato bo'lardi: ombordan
     *    nechta yechishni hech kim bilmaydi va qo'shimcha «bepul»
     *    material yeb ketardi.
     */
    check(
      'qoshimcha_material_formula',
      sql`(${t.materialId} IS NULL AND ${t.almashtirishGuruhId} IS NULL)
          OR (${t.formula} IS NOT NULL AND length(btrim(${t.formula})) > 0)`,
    ),
    index('qoshimcha_tur').on(t.mahsulotTurId, t.faol),
  ],
);

// ─── Buyurtmada tanlangan qo'shimcha ──────────────────────────────────────

/**
 * Pozitsiyaga qo'shilgan qo'shimcha — SNAPSHOT bilan.
 *
 * ⚠️ Nom va narx NUSXA bo'lib yoziladi (2.3-invariant). Keyin
 *    qo'shimchaning narxi o'zgarsa yoki o'chirilsa, eski buyurtma
 *    o'zgarmaydi va chekda o'sha kungi nom turadi.
 */
export const pozitsiyaQoshimcha = pgTable(
  'pozitsiya_qoshimcha',
  {
    id: id(),
    buyurtmaPozitsiyaId: bigint('buyurtma_pozitsiya_id', { mode: 'number' })
      .notNull()
      .references(() => buyurtmaPozitsiya.id),
    mahsulotQoshimchaId: bigint('mahsulot_qoshimcha_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotQoshimcha.id),

    nomSnapshot: text('nom_snapshot').notNull(),
    /** So'mga o'girilgan holda — kurs o'zgarsa buyurtma o'zgarmaydi */
    narxSnapshot: numeric('narx_snapshot', { precision: 14, scale: 2 }).notNull(),

    /** Material yeyadigan qo'shimcha bo'lsa — nima va qancha */
    materialId: bigint('material_id', { mode: 'number' }).references(() => material.id),
    miqdor: numeric('miqdor', { precision: 10, scale: 4 }),
    birlik: text('birlik'),

    ...izlar,
  },
  (t) => [
    check('pozitsiya_qoshimcha_narx', sql`${t.narxSnapshot} >= 0`),
    check(
      'pozitsiya_qoshimcha_miqdor',
      sql`(${t.materialId} IS NULL AND ${t.miqdor} IS NULL)
          OR (${t.miqdor} IS NOT NULL AND ${t.miqdor} > 0 AND ${t.birlik} IS NOT NULL)`,
    ),
    index('pozitsiya_qoshimcha_poz').on(t.buyurtmaPozitsiyaId),
  ],
);
