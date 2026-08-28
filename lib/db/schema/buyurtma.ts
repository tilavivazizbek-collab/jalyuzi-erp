/**
 * lib/db/schema/buyurtma.ts — QISM 3 §4 · TZ 3, 8, 8.17, 20.4, 20.5
 *
 * Buyurtma jadvallari.
 *
 * ⚠️ TZ 8.2 — «Buyurtmaning UMUMIY STATUSI YO'Q.» Status har
 *    POZITSIYADA turadi: bitta buyurtmada bir pozitsiya topshirilgan,
 *    ikkinchisi hali ishlab chiqarilayotgan bo'lishi mumkin.
 *
 * ⚠️ TZ 3.6 — ombordan `hisoblangan_miqdor` yechiladi, sotuvchi
 *    tuzatgan son EMAS. Tuzatilgani faqat narxga tegadi.
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { id, izlar } from './ustunlar';
import { filial, xodim } from './asos';
import { mahsulotSlot, mahsulotTur, material, mijoz } from './spravochnik';

// ─── 4.1 · buyurtma — TZ 8 · 20.4 · Q-12 · Q-23 ───────────────────────────

export const BUYURTMA_MANBALARI = ['SAYT', 'BOT'] as const;

/**
 * ⚠️ Q-12 — sayt buyurtmasi DARHOL tasdiqlangan, admin tasdig'i yo'q.
 *    Bot buyurtmasi «Tasdiq kutmoqda» bo'lib tushadi.
 */
export const buyurtma = pgTable(
  'buyurtma',
  {
    id: id(),
    raqam: text('raqam').notNull().unique(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    /** TZ 3.10 — mijoz MAJBURIY EMAS: ko'chadagi tasodifiy xaridor */
    mijozId: bigint('mijoz_id', { mode: 'number' }).references(() => mijoz.id),
    sotuvchiId: bigint('sotuvchi_id', { mode: 'number' })
      .notNull()
      .references(() => xodim.id),

    /** TZ 20.4 — sotgan va ishlab chiqargan filial har xil bo'lishi mumkin */
    sotganFilialId: bigint('sotgan_filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    ishlabChiqaruvchiFilialId: bigint('ishlab_chiqaruvchi_filial_id', {
      mode: 'number',
    })
      .notNull()
      .references(() => filial.id),

    manba: text('manba').notNull(),

    /** AUDIT B-04 — buyurtma valyutasi BITTA */
    valyuta: text('valyuta').notNull().default('SOM'),
    /** TZ 8.13 — dollarli buyurtmada kurs qotadi */
    kursSnapshot: numeric('kurs_snapshot', { precision: 10, scale: 2 }),

    /** TZ 3.13 — IXTIYORIY. Eski 5.4 «majburiy» qoidasi bekor qilingan. */
    tayyorlikSana: date('tayyorlik_sana'),

    yopildi: timestamp('yopildi', { withTimezone: true }),

    // Soliq — Q-23
    ndsStavka: numeric('nds_stavka', { precision: 5, scale: 2 }).default('0'),
    ndsSumma: numeric('nds_summa', { precision: 14, scale: 2 }).default('0'),
    summaNdssiz: numeric('summa_ndssiz', { precision: 14, scale: 2 }),

    ...izlar,
  },
  (t) => [
    check('buyurtma_manba', sql`${t.manba} IN ('SAYT','BOT')`),
    check('buyurtma_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    // AUDIT B-04 · TZ 9.6 — dollarli buyurtmada kurs MAJBURIY,
    // aks holda summa qaysi kursda qotgani noma'lum bo'lib qoladi
    check(
      'buyurtma_usd_kurs',
      sql`${t.valyuta} <> 'USD' OR ${t.kursSnapshot} IS NOT NULL`,
    ),
    index('buyurtma_filial_sana').on(t.sotganFilialId, t.sana),
    index('buyurtma_mijoz').on(t.mijozId),
  ],
);

// ─── 4.2 · buyurtma_pozitsiya — TZ 8.3 · 20.5 · 8.17 ──────────────────────

/**
 * TZ 8.3 — pozitsiya statuslari.
 *
 * Uchtasi (`FILIALGA_YUBORILDI`, `TAYYOR_YOLDA`, `YETIB_KELDI`) faqat
 * sotgan va ishlab chiqargan filial HAR XIL bo'lganda ishlatiladi (20.5).
 */
export const POZITSIYA_HOLATLARI = [
  'TASDIQ_KUTMOQDA',
  'TASDIQLANGAN',
  'MATERIALGA_KUTMOQDA',
  'FILIALGA_YUBORILDI',
  'ISHLAB_CHIQARILMOQDA',
  'TAYYOR',
  'TAYYOR_YOLDA',
  'YETIB_KELDI',
  'TOPSHIRILDI',
  'QAYTARILGAN',
  'RAD_ETILGAN',
  'BEKOR',
] as const;

export const buyurtmaPozitsiya = pgTable(
  'buyurtma_pozitsiya',
  {
    id: id(),
    buyurtmaId: bigint('buyurtma_id', { mode: 'number' })
      .notNull()
      .references(() => buyurtma.id),
    tartib: integer('tartib').notNull(),

    /**
     * ⚠️ IXTIYORIY — `NULL` bo'lsa bu QO'SHIMCHA MAHSULOT.
     *
     *    Mijoz «uydagi mexanizm buzilgan, bittasini alohida olay»
     *    desa, u tayyorlanmaydi: jalyuzi tikilmaydi, o'lchov
     *    olinmaydi, usta ishlamaydi. Shunchaki ombordan olinib
     *    beriladi.
     *
     *    Bunday qatorda tur ham, o'lcham ham, formula ham yo'q —
     *    faqat material va soni.
     */
    mahsulotTurId: bigint('mahsulot_tur_id', { mode: 'number' }).references(
      () => mahsulotTur.id,
    ),

    /**
     * Qo'shimcha mahsulotning materiali.
     *
     * ⚠️ `mahsulot_tur_id` bilan BIRGA to'lmaydi: qator yo tayyor
     *    mahsulot, yo qo'shimcha buyum. Bazadagi CHECK shuni
     *    ta'minlaydi.
     */
    qoshimchaMaterialId: bigint('qoshimcha_material_id', { mode: 'number' }).references(
      () => material.id,
    ),

    /** TZ 3.4 — o'lcham SANTIMETRDA: mijoz va usta shunday gapiradi */
    eniSm: integer('eni_sm').notNull(),
    boyiSm: integer('boyi_sm').notNull(),
    soni: integer('soni').notNull().default(1),

    /** TZ 3.9 — kelishilgan narx qotadi (2.3-invariant) */
    narxSnapshot: numeric('narx_snapshot', { precision: 14, scale: 2 }).notNull(),
    chegirmaSumma: numeric('chegirma_summa', { precision: 14, scale: 2 }).default('0'),
    xizmatHaqi: numeric('xizmat_haqi', { precision: 14, scale: 2 }).default('0'),

    /**
     * TZ 4.10 — formulalar SHU PAYTDAGI holatda qotadi.
     * Admin keyin konstruktorni o'zgartirsa, eski buyurtma o'zgarmaydi.
     */
    formulaSnapshot: jsonb('formula_snapshot').notNull(),

    ustaId: bigint('usta_id', { mode: 'number' }).references(() => xodim.id),
    /** TZ 10.10 — stavka ish berilgan paytda qotadi */
    stavkaSnapshot: numeric('stavka_snapshot', { precision: 14, scale: 2 }),
    /**
     * ⚠️ Birlik ham QOTADI: `DONA` bo'lsa qat'iy summa, `KV_M` bo'lsa
     *    maydonga ko'paytiriladi (10.8). Faqat qiymatni saqlash yetmaydi —
     *    keyin uni qanday talqin qilishni bilib bo'lmaydi.
     */
    stavkaBirlikSnapshot: text('stavka_birlik_snapshot'),
    tugatildi: timestamp('tugatildi', { withTimezone: true }),

    holat: text('holat').notNull(),

    /** TZ 8.17.8 — qayta kesish soni */
    qaytaKesildiSoni: integer('qayta_kesildi_soni').notNull().default(0),
    /** TZ 3.15.4 — tayyor mahsulot sotilganda kerak bo'ladi */
    tannarxSnapshot: numeric('tannarx_snapshot', { precision: 14, scale: 2 }),
    /** TZ 7.13 — «sotilmagan tayyor mahsulot» ro'yxatidami */
    tayyorMahsulot: boolean('tayyor_mahsulot').notNull().default(false),

    ...izlar,
  },
  (t) => [
    /**
     * ⚠️ Qator YO tayyor mahsulot, YO qo'shimcha buyum.
     *
     *    Ikkalasi ham to'lsa — qaysi biri sotilgani noaniq bo'lardi.
     *    Ikkalasi ham bo'sh bo'lsa — nima sotilgani umuman bilinmasdi.
     */
    check(
      'pozitsiya_turi_yoki_material',
      sql`(${t.mahsulotTurId} IS NOT NULL AND ${t.qoshimchaMaterialId} IS NULL)
           OR (${t.mahsulotTurId} IS NULL AND ${t.qoshimchaMaterialId} IS NOT NULL)`,
    ),
    /**
     * ⚠️ Qo'shimcha buyumda O'LCHAM YO'Q — u tayyorlanmaydi,
     *    kesilmaydi. Nol qo'yiladi va shu tekshiriladi.
     */
    check(
      'pozitsiya_qoshimcha_olchamsiz',
      sql`${t.qoshimchaMaterialId} IS NULL
           OR (${t.eniSm} = 0 AND ${t.boyiSm} = 0)`,
    ),

    check(
      'buyurtma_pozitsiya_holat',
      sql`${t.holat} IN ('TASDIQ_KUTMOQDA','TASDIQLANGAN','MATERIALGA_KUTMOQDA',
                         'FILIALGA_YUBORILDI','ISHLAB_CHIQARILMOQDA',
                         'TAYYOR','TAYYOR_YOLDA','YETIB_KELDI',
                         'TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR')`,
    ),
    // TZ 3.4 — o'lcham musbat bo'lishi shart, aks holda formula ma'nosiz
    check('buyurtma_pozitsiya_olcham', sql`${t.eniSm} > 0 AND ${t.boyiSm} > 0`),
    check('buyurtma_pozitsiya_soni', sql`${t.soni} > 0`),
    uniqueIndex('buyurtma_pozitsiya_tartib').on(t.buyurtmaId, t.tartib),
    index('buyurtma_pozitsiya_holat_idx').on(t.holat),
    index('buyurtma_pozitsiya_usta').on(t.ustaId),
  ],
);

// ─── 4.3 · pozitsiya_material — TZ 3.5 · 3.6 ──────────────────────────────

/**
 * Slot bo'yicha tanlangan material.
 *
 * ⚠️ TZ 3.6 — ikkita miqdor ATAYLAB alohida turadi:
 *
 *    | Nimaga | Qaysi raqam |
 *    |---|---|
 *    | Narx | `tuzatilgan_miqdor` (sotuvchi kiritgan) |
 *    | Ombordan yechish | `hisoblangan_miqdor` (formula) |
 *
 *    Bittasini ikkinchisining ustiga yozish — pul yo'qotish: sotuvchi
 *    mijoz bilan 1.00 kv.m ga kelishadi, ombordan esa haqiqiy 0.66
 *    yechiladi.
 */
export const pozitsiyaMaterial = pgTable(
  'pozitsiya_material',
  {
    id: id(),
    buyurtmaPozitsiyaId: bigint('buyurtma_pozitsiya_id', { mode: 'number' })
      .notNull()
      .references(() => buyurtmaPozitsiya.id),
    slotId: bigint('slot_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotSlot.id),
    materialId: bigint('material_id', { mode: 'number' })
      .notNull()
      .references(() => material.id),

    /** Formula hisoblagani — OMBORDAN SHU yechiladi */
    hisoblanganMiqdor: numeric('hisoblangan_miqdor', {
      precision: 10,
      scale: 4,
    }).notNull(),
    /** Sotuvchi tuzatgani — faqat NARXGA tegadi (3.5, 3.6) */
    tuzatilganMiqdor: numeric('tuzatilgan_miqdor', { precision: 10, scale: 4 }),

    birlik: text('birlik').notNull(),
    narxSnapshot: numeric('narx_snapshot', { precision: 14, scale: 2 }).notNull(),
  },
  (t) => [
    check('pozitsiya_material_birlik', sql`${t.birlik} IN ('KV_M','SM','DONA')`),
    check('pozitsiya_material_miqdor', sql`${t.hisoblanganMiqdor} > 0`),
    check(
      'pozitsiya_material_tuzatilgan',
      sql`${t.tuzatilganMiqdor} IS NULL OR ${t.tuzatilganMiqdor} > 0`,
    ),
    uniqueIndex('pozitsiya_material_slot').on(t.buyurtmaPozitsiyaId, t.slotId),
  ],
);

// ─── 4.3b · pozitsiya_aksessuar — TZ 3.7 ──────────────────────────────────

/**
 * TZ 3.7 — komplekt avtomatik tushadi, sotuvchi erkin o'zgartiradi.
 *
 * ⚠️ `qolda_kiritildi` bayrog'i bor: «Sotuvchi sonini qo'lda tuzatgan
 *    bo'lsa — FORMULA UNI USTIDAN YOZMAYDI. O'lcham keyin o'zgartirilsa
 *    ham qo'lda kiritilgan son saqlanadi.»
 */
export const pozitsiyaAksessuar = pgTable(
  'pozitsiya_aksessuar',
  {
    id: id(),
    buyurtmaPozitsiyaId: bigint('buyurtma_pozitsiya_id', { mode: 'number' })
      .notNull()
      .references(() => buyurtmaPozitsiya.id),
    materialId: bigint('material_id', { mode: 'number' })
      .notNull()
      .references(() => material.id),

    soni: numeric('soni', { precision: 10, scale: 2 }).notNull(),
    birlik: text('birlik').notNull(),
    narxSnapshot: numeric('narx_snapshot', { precision: 14, scale: 2 }).notNull(),
    qoldaKiritildi: boolean('qolda_kiritildi').notNull().default(false),
  },
  (t) => [
    check('pozitsiya_aksessuar_birlik', sql`${t.birlik} IN ('KV_M','SM','DONA')`),
    check('pozitsiya_aksessuar_soni', sql`${t.soni} > 0`),
    index('pozitsiya_aksessuar_pozitsiya').on(t.buyurtmaPozitsiyaId),
  ],
);

// ─── 4.4 · qayta_kesish — TZ 8.17 ─────────────────────────────────────────

export const QAYTA_KESISH_SABABLARI = [
  'OLCHAM_XATO',
  'MATO_YIRTILDI',
  'TIKUV_BUZILDI',
  'MEXANIZM_NOSOZ',
  'BOSHQA',
] as const;

export const qaytaKesish = pgTable(
  'qayta_kesish',
  {
    id: id(),
    buyurtmaPozitsiyaId: bigint('buyurtma_pozitsiya_id', { mode: 'number' })
      .notNull()
      .references(() => buyurtmaPozitsiya.id),
    soraganUstaId: bigint('soragan_usta_id', { mode: 'number' })
      .notNull()
      .references(() => xodim.id),
    sabab: text('sabab').notNull(),
    izoh: text('izoh'),
    rasmYol: text('rasm_yol'),
    holat: text('holat').notNull().default('SOROV'),
    halQildiId: bigint('hal_qildi_id', { mode: 'number' }).references(() => xodim.id),
    halQilindi: timestamp('hal_qilindi', { withTimezone: true }),
    /** TZ 10.13 — ushlanma */
    ushlanmaSumma: numeric('ushlanma_summa', { precision: 14, scale: 2 }).default('0'),
    /** Q-15 — standart holatda haq BEKOR qilinadi (8.17.5.1 istisnosi) */
    haqSaqlandi: boolean('haq_saqlandi').notNull().default(false),
    ...izlar,
  },
  (t) => [
    check(
      'qayta_kesish_sabab',
      sql`${t.sabab} IN ('OLCHAM_XATO','MATO_YIRTILDI','TIKUV_BUZILDI',
                         'MEXANIZM_NOSOZ','BOSHQA')`,
    ),
    check('qayta_kesish_holat', sql`${t.holat} IN ('SOROV','TASDIQLANDI','RAD_ETILDI')`),
    index('qayta_kesish_pozitsiya').on(t.buyurtmaPozitsiyaId),
  ],
);
