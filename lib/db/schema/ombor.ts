/**
 * lib/db/schema/ombor.ts — QISM 3 §3 · TZ 7 · Q-02, Q-05, Q-25
 *
 * Ombor jadvallari. `bolak` — tizimning eng muhim jadvali.
 *
 * Q-25 — har filialda O'Z ombori: bo'lak aniq bitta filialga tegishli.
 * Q-05 — o'lcham har doim `eni × bo'yi` METRDA. Kv.m saqlanmaydi,
 *        u `eni_m × boyi_m` dan hisoblanadi.
 *
 * ⚠️ `band` jadvali buyurtma pozitsiyasiga bog'lanadi, u esa 4-bosqichda
 *    yaratiladi. Ustunlar hozirdan turadi, tashqi kalitlar 4-bosqichda
 *    qo'shiladi (QARORLAR-KOD P-18). Baza darajasidagi ASOSIY kafolat —
 *    «bir bo'lakda bir vaqtda bitta faol band» — hozirdan ishlaydi.
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { id, izlar, ochirilmaydi } from './ustunlar';
import { filial } from './asos';
import { material, yetkazibBeruvchi } from './spravochnik';

// ─── 3.3 · kirim va kirim_qator — TZ 7.9 ──────────────────────────────────

export const kirim = pgTable(
  'kirim',
  {
    id: id(),
    raqam: text('raqam').notNull().unique(),
    sana: date('sana').notNull(),
    /** Q-31 — xarid har filial o'zi qiladi */
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    yetkazibBeruvchiId: bigint('yetkazib_beruvchi_id', { mode: 'number' })
      .notNull()
      .references(() => yetkazibBeruvchi.id),
    valyuta: text('valyuta').notNull().default('SOM'),
    /** TZ 9.6 — tannarx kirim kunidagi kursda QOTADI, keyin o'zgarmaydi */
    kursSnapshot: numeric('kurs_snapshot', { precision: 10, scale: 2 }),

    // TZ 7.9 — qo'shimcha xarajatlar, tannarxga taqsimlanadi
    transportSumma: numeric('transport_summa', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),
    bojxonaSumma: numeric('bojxona_summa', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),

    /** TZ 9.3 — yetkazib beruvchi kartochkasidan avtomatik keladi */
    tolovMuddati: date('tolov_muddati'),

    holat: text('holat').notNull().default('FAOL'),
    stornoSabab: text('storno_sabab'),
    ...izlar,
  },
  (t) => [
    check('kirim_holat', sql`${t.holat} IN ('FAOL','STORNO')`),
    check('kirim_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    // TZ 9.6 — dollarli kirimda kurs MAJBURIY, aks holda tannarx qotib qolmaydi
    check(
      'kirim_usd_kurs_kerak',
      sql`${t.valyuta} <> 'USD' OR ${t.kursSnapshot} IS NOT NULL`,
    ),
    check('kirim_storno_sabab', sql`${t.holat} <> 'STORNO' OR ${t.stornoSabab} IS NOT NULL`),
    check('kirim_xarajat_manfiy_emas', sql`${t.transportSumma} >= 0 AND ${t.bojxonaSumma} >= 0`),
    index('kirim_filial_sana').on(t.filialId, t.sana),
    index('kirim_yetkazib').on(t.yetkazibBeruvchiId),
  ],
);

export const kirimQator = pgTable(
  'kirim_qator',
  {
    id: id(),
    kirimId: bigint('kirim_id', { mode: 'number' })
      .notNull()
      .references(() => kirim.id),
    materialId: bigint('material_id', { mode: 'number' })
      .notNull()
      .references(() => material.id),
    /** Kirim birligida (rulon, shtanga, quti) */
    miqdorKirim: numeric('miqdor_kirim', { precision: 12, scale: 2 }).notNull(),
    narxBirlik: numeric('narx_birlik', { precision: 14, scale: 2 }).notNull(),

    // TZ 7.9 — yetkazib beruvchi defekti
    defektMiqdor: numeric('defekt_miqdor', { precision: 12, scale: 2 }).notNull().default('0'),
    defektTuri: text('defekt_turi'),

    /** TZ 7.9 taqsimoti — summa ulushi bo'yicha (QARORLAR-KOD P-16) */
    transportUlush: numeric('transport_ulush', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),

    /**
     * Hisoblangan birlik tannarxi — snapshot (2.3-invariant).
     *
     * ⚠️ Bo'luvchi TO'LIQ miqdor, defekt ayirilmaydi (QARORLAR-KOD P-17):
     *     (narx × miqdor + transport) / miqdor
     */
    tannarxBirlik: numeric('tannarx_birlik', { precision: 14, scale: 4 }).notNull(),
    ...izlar,
  },
  (t) => [
    check('kirim_qator_miqdor', sql`${t.miqdorKirim} > 0`),
    check('kirim_qator_narx', sql`${t.narxBirlik} >= 0`),
    check(
      'kirim_qator_defekt',
      sql`${t.defektMiqdor} >= 0 AND ${t.defektMiqdor} <= ${t.miqdorKirim}`,
    ),
    check(
      'kirim_qator_defekt_turi',
      sql`${t.defektTuri} IS NULL OR ${t.defektTuri} IN ('QAYTARILADI','HISOBDAN_CHIQADI')`,
    ),
    // Defekt bor bo'lsa uni qayerga yuborish AYTILISHI shart (7.9)
    check(
      'kirim_qator_defekt_yonalishi',
      sql`${t.defektMiqdor} = 0 OR ${t.defektTuri} IS NOT NULL`,
    ),
    index('kirim_qator_kirim').on(t.kirimId),
    index('kirim_qator_material').on(t.materialId),
  ],
);

// ─── 3.1 · bolak — tizimning eng muhim jadvali ────────────────────────────

export const BOLAK_TURLARI = ['RULON', 'OSTATKA', 'DONA'] as const;
export const BOLAK_HOLATLARI = [
  'BOSH',
  'BAND',
  'YOLDA',
  'ISHLATILDI',
  'BRAK',
  'CHIQINDI',
] as const;

export const bolak = pgTable(
  'bolak',
  {
    id: id(),
    materialId: bigint('material_id', { mode: 'number' })
      .notNull()
      .references(() => material.id),
    /** Q-25 — bo'lak aniq bitta filialda */
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),

    /**
     * ⚠️ Kod BUTUN TIZIMDA unique, filial ichida emas (QISM 3 §3.1).
     *
     * Bo'lak filiallar orasida ko'chganda kodi O'ZGARMAYDI — u bo'lakning
     * umrbod nomi. Filial ichida unique bo'lsa, Samarqandda ham `O-207`
     * bo'lishi mumkin va ko'chirishda to'qnashuv chiqadi.
     */
    kod: text('kod').notNull().unique(),
    turi: text('turi').notNull(),

    /** Q-05 — METRDA. Kv.m saqlanmaydi, `eni_m × boyi_m` dan hisoblanadi */
    eniM: numeric('eni_m', { precision: 8, scale: 2 }),
    boyiM: numeric('boyi_m', { precision: 8, scale: 2 }),
    /** DONA va CHIZIQLI uchun — sm yoki dona (Q-01) */
    miqdor: numeric('miqdor', { precision: 10, scale: 2 }),

    // Kelib chiqish
    kirimQatorId: bigint('kirim_qator_id', { mode: 'number' }).references(() => kirimQator.id),
    /** Ostatka otasidan meros oladi (EC-OMB-06) */
    otaBolakId: bigint('ota_bolak_id', { mode: 'number' }).references(
      (): AnyPgColumn => bolak.id,
    ),
    /** Qaysi kesimdan chiqqan. FK 4-bosqichda qo'shiladi (P-18) */
    buyurtmaPozitsiyaId: bigint('buyurtma_pozitsiya_id', { mode: 'number' }),

    /** Snapshot — 2.3-invariant, hech qachon qayta hisoblanmaydi */
    tannarxBirlikSnapshot: numeric('tannarx_birlik_snapshot', {
      precision: 14,
      scale: 4,
    }).notNull(),
    tannarxValyutaSnapshot: text('tannarx_valyuta_snapshot').notNull().default('SOM'),

    holat: text('holat').notNull().default('BOSH'),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check('bolak_turi', sql`${t.turi} IN ('RULON','OSTATKA','DONA')`),
    check(
      'bolak_holat',
      sql`${t.holat} IN ('BOSH','BAND','YOLDA','ISHLATILDI','BRAK','CHIQINDI')`,
    ),
    check('bolak_valyuta', sql`${t.tannarxValyutaSnapshot} IN ('SOM','USD')`),
    /**
     * TZ 7.4 — «Har bo'lak `eni × bo'yi` bo'lib saqlanadi.»
     * RULON va OSTATKA da o'lcham MAJBURIY: maydon bo'yicha tanlash
     * noto'g'ri natija beradi (7.4 misoli).
     */
    check(
      'bolak_olcham_kerak',
      sql`(${t.turi} = 'DONA' AND ${t.miqdor} IS NOT NULL)
          OR (${t.turi} <> 'DONA' AND ${t.eniM} IS NOT NULL AND ${t.boyiM} IS NOT NULL)`,
    ),
    check(
      'bolak_olcham_musbat',
      sql`(${t.eniM} IS NULL OR ${t.eniM} > 0) AND (${t.boyiM} IS NULL OR ${t.boyiM} > 0)`,
    ),
    // Bo'lak o'ziga o'zi ota bo'la olmaydi
    check('bolak_ota_ozi_emas', sql`${t.otaBolakId} IS NULL OR ${t.otaBolakId} <> ${t.id}`),

    // TZ 7.6 algoritmi eng ko'p ishlatadigan so'rov (QISM 1 §6.7)
    index('bolak_tanlov')
      .on(t.materialId, t.filialId, t.holat, t.eniM)
      .where(sql`${t.faol} = true AND ${t.holat} = 'BOSH'`),
    index('bolak_kirim').on(t.kirimQatorId),
    index('bolak_ota').on(t.otaBolakId),
  ],
);

// ─── 3.2 · band — TZ 7.3 · Q-02, Q-06 ─────────────────────────────────────

export const BAND_HOLATLARI = ['FAOL', 'ISHLATILDI', 'BOSHATILDI'] as const;
/** Q-06 — usta boshqa bo'lakni tanlasa sabab RO'YXATDAN tanlanadi */
export const BOSHATISH_SABABLARI = ['IFLOS', 'TOPILMADI', 'RANG', 'MUDDAT', 'BEKOR', 'BOSHQA'] as const;

export const band = pgTable(
  'band',
  {
    id: id(),
    bolakId: bigint('bolak_id', { mode: 'number' })
      .notNull()
      .references(() => bolak.id),
    /** FK 4-bosqichda qo'shiladi (P-18) */
    buyurtmaPozitsiyaId: bigint('buyurtma_pozitsiya_id', { mode: 'number' }).notNull(),
    /**
     * QISM 3 §3.2.1 — «Bitta pozitsiyaga BIR NECHTA band».
     *
     * Har slot uchun alohida band qo'yiladi. Faqat pozitsiya bilan
     * bog'lansa, ko'p slotli mahsulotda materialning bir qismi band
     * qilinmay qoladi. FK 4-bosqichda qo'shiladi (P-18).
     */
    pozitsiyaMaterialId: bigint('pozitsiya_material_id', { mode: 'number' }).notNull(),

    holat: text('holat').notNull().default('FAOL'),
    boshatishSabab: text('boshatish_sabab'),
    boshatishIzoh: text('boshatish_izoh'),
    boshatildi: timestamp('boshatildi', { withTimezone: true }),

    /** TZ 7.3 — band muddati 30 kun, keyin avtomatik bo'shaydi */
    amalQiladi: timestamp('amal_qiladi', { withTimezone: true }).notNull(),
    ...izlar,
  },
  (t) => [
    check('band_holat', sql`${t.holat} IN ('FAOL','ISHLATILDI','BOSHATILDI')`),
    check(
      'band_boshatish_sabab',
      sql`${t.boshatishSabab} IS NULL
          OR ${t.boshatishSabab} IN ('IFLOS','TOPILMADI','RANG','MUDDAT','BEKOR','BOSHQA')`,
    ),
    // Q-06 — bo'shatilgan bandda sabab MAJBURIY
    check(
      'band_boshatilganda_sabab',
      sql`${t.holat} <> 'BOSHATILDI' OR ${t.boshatishSabab} IS NOT NULL`,
    ),

    /**
     * ⚠️ TZ 7.3 NING BAZA DARAJASIDAGI KAFOLATI.
     *
     * «Ikki usta bir vaqtda bitta bo'lakka da'vo qilsa — birinchi so'rov
     *  oladi, ikkinchisiga rad javobi qaytariladi.»
     *
     * Bu partial unique indeks buni KOD DARAJASIDA emas, BAZA darajasida
     * yopadi: kod xato yozilsa ham ikkinchi band yozilmaydi.
     */
    uniqueIndex('band_bitta_faol').on(t.bolakId).where(sql`${t.holat} = 'FAOL'`),
    index('band_pozitsiya').on(t.buyurtmaPozitsiyaId),
    index('band_muddat').on(t.amalQiladi).where(sql`${t.holat} = 'FAOL'`),
  ],
);

// ─── 3.4 · ombor_harakat — universal jurnal ───────────────────────────────

export const HARAKAT_TURLARI = [
  'KIRIM',
  'KESIM',
  'OSTATKA',
  'CHIQINDI',
  'BRAK',
  'KOCHIRISH_CHIQDI',
  'KOCHIRISH_KIRDI',
  'INVENTARIZATSIYA',
  'STORNO',
  'BOSHLANGICH',
] as const;

/**
 * Bo'lakning har harakati.
 *
 * ⚠️ `UPDATE` va `DELETE` TAQIQ (QISM 1 §6.5) — trigger bilan
 * himoyalanadi. Tuzatish faqat teskari yozuv (storno) orqali.
 */
export const omborHarakat = pgTable(
  'ombor_harakat',
  {
    id: id(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    bolakId: bigint('bolak_id', { mode: 'number' })
      .notNull()
      .references(() => bolak.id),
    turi: text('turi').notNull(),

    // Uchta o'lchov — materialning turiga qarab biri to'ladi
    miqdorKvM: numeric('miqdor_kv_m', { precision: 10, scale: 4 }),
    miqdorSm: numeric('miqdor_sm', { precision: 12, scale: 2 }),
    miqdorDona: integer('miqdor_dona'),

    tannarxSumma: numeric('tannarx_summa', { precision: 14, scale: 2 }).notNull(),

    manbaTuri: text('manba_turi'),
    manbaId: bigint('manba_id', { mode: 'number' }),
    izoh: text('izoh'),

    xodimId: bigint('xodim_id', { mode: 'number' }).notNull(),
  },
  (t) => [
    check(
      'ombor_harakat_turi',
      sql`${t.turi} IN ('KIRIM','KESIM','OSTATKA','CHIQINDI','BRAK',
                        'KOCHIRISH_CHIQDI','KOCHIRISH_KIRDI',
                        'INVENTARIZATSIYA','STORNO','BOSHLANGICH')`,
    ),
    // Kamida bitta o'lchov to'lishi shart — bo'sh yozuv ma'nosiz
    check(
      'ombor_harakat_olchov',
      sql`${t.miqdorKvM} IS NOT NULL OR ${t.miqdorSm} IS NOT NULL OR ${t.miqdorDona} IS NOT NULL`,
    ),
    index('ombor_harakat_filial_sana').on(t.filialId, t.sana),
    index('ombor_harakat_bolak').on(t.bolakId),
    index('ombor_harakat_manba').on(t.manbaTuri, t.manbaId),
  ],
);

// ─── 3.6 · inventarizatsiya — TZ 15.1 · Q-05 · AUDIT Z-05, U-06, A-09 ─────

export const INVENTARIZATSIYA_HOLATLARI = ['OCHIQ', 'YAKUNLANDI', 'STORNO'] as const;

/**
 * TZ 15.1 — sanash varaqasi.
 *
 * ⚠️ To'liq va QISMAN bo'ladi: butun omborni sanash shart emas.
 *    Shuning uchun qatorlar sanash boshlanganda yoziladi, material
 *    bo'yicha filtr bilan.
 */
export const inventarizatsiya = pgTable(
  'inventarizatsiya',
  {
    id: id(),
    sana: date('sana').notNull(),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    holat: text('holat').notNull().default('OCHIQ'),
    /** Yakunlanganda hisoblanadi — foyda-zararga XARAJAT bo'lib tushadi */
    farqSumma: numeric('farq_summa', { precision: 14, scale: 2 }),
    izoh: text('izoh'),
    ...izlar,
  },
  (t) => [
    check(
      'inventarizatsiya_holat',
      sql`${t.holat} IN ('OCHIQ','YAKUNLANDI','STORNO')`,
    ),
    index('inventarizatsiya_filial_sana').on(t.filialId, t.sana),
  ],
);

/** TZ 15.1 — farq sabablari (majburiy). */
export const INVENTARIZATSIYA_SABABLARI = [
  'HISOBGA_OLINMAGAN_CHIQINDI',
  'OLCHOV_XATOSI',
  'YOQOLGAN',
  'NOTOGRI_KIRIM',
  'BOSHQA',
] as const;

/**
 * Har bo'lak O'Z qatorida — «48 kv.m bor» degan javob hech narsani
 * tekshirmaydi (15.1).
 *
 * ⚠️ AUDIT Z-05 — sanash `eni × bo'yi` METRDA. Kv.m saqlanmaydi,
 *    tizim hisoblaydi. Aks holda omborchi 28 yozadi, tizim 84 kutadi.
 * ⚠️ AUDIT U-06 — `band` ustuni: band bo'lak jismonan omborda, sanaladi,
 *    lekin omborchi nimaga solishtirayotganini bilishi kerak.
 * ⚠️ AUDIT A-09 — `yolda` bo'lak jo'natuvchi filialda ko'rinadi, lekin
 *    SANALMAYDI: u jismonan yo'q.
 */
export const inventarizatsiyaQator = pgTable(
  'inventarizatsiya_qator',
  {
    id: id(),
    // ⚠️ Tashqi kalit quyida ANIQ nom bilan e'lon qilingan: avtomatik nom
    //    63 belgidan oshib ketardi va Postgres uni jimgina qisqartirardi.
    inventarizatsiyaId: bigint('inventarizatsiya_id', { mode: 'number' }).notNull(),
    bolakId: bigint('bolak_id', { mode: 'number' })
      .notNull()
      .references(() => bolak.id),

    // Varaqa chop etilgandagi holat (2.3-invariant — o'zgarmaydi)
    tizimdaEniM: numeric('tizimda_eni_m', { precision: 8, scale: 2 }),
    tizimdaBoyiM: numeric('tizimda_boyi_m', { precision: 8, scale: 2 }),
    tizimdaMiqdor: numeric('tizimda_miqdor', { precision: 10, scale: 2 }),

    // Omborchi yozgani — sanalmaguncha NULL
    haqiqatdaEniM: numeric('haqiqatda_eni_m', { precision: 8, scale: 2 }),
    haqiqatdaBoyiM: numeric('haqiqatda_boyi_m', { precision: 8, scale: 2 }),
    haqiqatdaMiqdor: numeric('haqiqatda_miqdor', { precision: 10, scale: 2 }),

    band: boolean('band').notNull().default(false),
    yolda: boolean('yolda').notNull().default(false),

    farqKvM: numeric('farq_kv_m', { precision: 10, scale: 4 }),
    farqSumma: numeric('farq_summa', { precision: 14, scale: 2 }),
    sabab: text('sabab'),
    izoh: text('izoh'),
  },
  (t) => [
    foreignKey({
      columns: [t.inventarizatsiyaId],
      foreignColumns: [inventarizatsiya.id],
      name: 'inventarizatsiya_qator_hujjat_fk',
    }),
    check(
      'inventarizatsiya_qator_sabab',
      sql`${t.sabab} IS NULL OR ${t.sabab} IN (
            'HISOBGA_OLINMAGAN_CHIQINDI','OLCHOV_XATOSI','YOQOLGAN',
            'NOTOGRI_KIRIM','BOSHQA')`,
    ),
    // Bir bo'lak bir varaqada bir marta
    uniqueIndex('inventarizatsiya_qator_bir_marta').on(t.inventarizatsiyaId, t.bolakId),
    index('inventarizatsiya_qator_bolak').on(t.bolakId),
  ],
);
