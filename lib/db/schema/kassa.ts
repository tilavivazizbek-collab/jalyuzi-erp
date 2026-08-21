/**
 * lib/db/schema/kassa.ts — QISM 3 §5, §6, §7 · TZ 10, 12, 20.10
 *
 * ⚠️ TZ 12.1 — ASOSIY PRINSIP: **xarajat ≠ kassa chiqimi.**
 *
 *    «Usta 70 000 ishlab topdi → xarajat yozildi. Bir hafta o'tib pul
 *     berildi → kassadan 70 000 chiqdi. Ikkalasi xarajat deb sanalsa
 *     140 000 chiqadi, aslida 70 000.»
 *
 *    Shuning uchun `xarajat` va `kassa_yozuv` — IKKI ALOHIDA jadval.
 *    Foyda-zarar xarajat jurnalidan yig'iladi, kassadan emas.
 *
 * ⚠️ 2.2-invariant — balans HECH QAYERDA saqlanmaydi. Xodim balansi
 *    `xodim_harakat` dan, kassa qoldig'i `kassa_yozuv` dan `SUM()`
 *    bilan chiqadi.
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { id, izlar, ochirilmaydi } from './ustunlar';
import { filial, xodim } from './asos';
import { mahsulotTur } from './spravochnik';

// ─── 5.1 · stavka — TZ 10.8 · 10.9 · 20.11.3 ──────────────────────────────

/**
 * TZ 10.9 — ustunlik tartibi: `xodim` > `filial` > `standart`.
 *
 * ⚠️ `xodim_id IS NULL` va `filial_id IS NULL` — standart stavka.
 *    Tanlash mantiqi `lib/domain/stavka.ts` da (§2.2).
 */
export const stavka = pgTable(
  'stavka',
  {
    id: id(),
    mahsulotTurId: bigint('mahsulot_tur_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotTur.id),
    /** NULL = barcha filialga */
    filialId: bigint('filial_id', { mode: 'number' }).references(() => filial.id),
    /** NULL = barcha xodimga (10.9) */
    xodimId: bigint('xodim_id', { mode: 'number' }).references(() => xodim.id),
    qiymat: numeric('qiymat', { precision: 14, scale: 2 }).notNull(),
    birlik: text('birlik').notNull(),
    /** 2.3-invariant — eski buyurtma eski stavkada qoladi */
    amalQiladiDan: date('amal_qiladi_dan').notNull(),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check('stavka_birlik', sql`${t.birlik} IN ('KV_M','DONA')`),
    check('stavka_qiymat', sql`${t.qiymat} >= 0`),
    index('stavka_tur').on(t.mahsulotTurId, t.amalQiladiDan),
  ],
);

// ─── 5.2 · xodim_harakat — TZ 10.3 · 10.4 · AUDIT Z-12 ────────────────────

/**
 * TZ 10.4 · AUDIT Z-12 — balans = `hisoblangan − olingan − ushlangan`.
 *
 * ⚠️ `UPDATE` va `DELETE` TAQIQ (§6.5) — trigger bilan himoyalanadi.
 *    Tuzatish faqat yangi yozuv (`QOLDA_TUZATISH`) bilan.
 */
export const XODIM_HARAKAT_TURLARI = [
  'HAQ',
  'AVANS',
  'TOLOV',
  'USHLANMA',
  'JARIMA',
  'QOLDA_TUZATISH',
  'HAQ_BEKOR',
  'HISOBDAN_CHIQARISH',
] as const;

export const xodimHarakat = pgTable(
  'xodim_harakat',
  {
    id: id(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    xodimId: bigint('xodim_id', { mode: 'number' })
      .notNull()
      .references(() => xodim.id),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    turi: text('turi').notNull(),
    /** + hisoblandi, − olindi (10.4) */
    summa: numeric('summa', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull().default('SOM'),
    kursSnapshot: numeric('kurs_snapshot', { precision: 10, scale: 2 }),
    manbaTuri: text('manba_turi'),
    manbaId: bigint('manba_id', { mode: 'number' }),
    izoh: text('izoh'),
    xodimYozdiId: bigint('xodim_yozdi_id', { mode: 'number' }).notNull(),
  },
  (t) => [
    check(
      'xodim_harakat_turi',
      sql`${t.turi} IN ('HAQ','AVANS','TOLOV','USHLANMA','JARIMA',
                        'QOLDA_TUZATISH','HAQ_BEKOR','HISOBDAN_CHIQARISH')`,
    ),
    check('xodim_harakat_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    // AUDIT B-04 — dollarli harakatda kurs majburiy
    check(
      'xodim_harakat_usd_kurs',
      sql`${t.valyuta} <> 'USD' OR ${t.kursSnapshot} IS NOT NULL`,
    ),
    index('xodim_harakat_xodim').on(t.xodimId, t.sana),
    index('xodim_harakat_manba').on(t.manbaTuri, t.manbaId),
  ],
);

// ─── 6.1 · kassa — TZ 12.2 · 20.10 ────────────────────────────────────────

/**
 * TZ 12.2 — «Kassa bitta emas: har sotuvchining o'z kassasi bor va
 * asosiy admin kassasi.»
 *
 * ⚠️ So'm va dollar HECH QACHON bitta summaga qo'shilmaydi (1.3-band),
 *    shuning uchun valyuta kassaning O'ZIDA turadi — har valyuta uchun
 *    alohida kassa yozuvi.
 */
export const KASSA_TURLARI = ['NAQD', 'KARTA', 'BANK'] as const;

export const kassa = pgTable(
  'kassa',
  {
    id: id(),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    /** NULL = filial (admin) kassasi */
    xodimId: bigint('xodim_id', { mode: 'number' }).references(() => xodim.id),
    turi: text('turi').notNull(),
    valyuta: text('valyuta').notNull(),
    nom: text('nom').notNull(),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check('kassa_turi', sql`${t.turi} IN ('NAQD','KARTA','BANK')`),
    check('kassa_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    // TZ 12.2 — «Karta to'lovi TO'G'RIDAN-TO'G'RI admin kassasiga tushadi»
    check('kassa_karta_admin', sql`${t.turi} <> 'KARTA' OR ${t.xodimId} IS NULL`),
    // Bir xodimda bir turdagi bir valyutali bitta kassa
    uniqueIndex('kassa_bitta')
      .on(t.filialId, t.xodimId, t.turi, t.valyuta)
      .where(sql`${t.xodimId} IS NOT NULL`),
    uniqueIndex('kassa_filial_bitta')
      .on(t.filialId, t.turi, t.valyuta)
      .where(sql`${t.xodimId} IS NULL`),
  ],
);

// ─── 6.2 · kassa_yozuv — TZ 12.3 ──────────────────────────────────────────

/**
 * TZ 12.3 — «FAQAT QO'SHILADI.»
 *
 * ⚠️ `(manba_turi, manba_id, qator)` uchligi TAKRORLANMAYDI va bu
 *    BAZADA bloklanadi: «Shunda hech qanday tasdiqlash, tugmani qayta
 *    bosish yoki sahifani yangilash ikkinchi yozuv yarata olmaydi.»
 *
 *    Bu idempotentlikning eng muhim joyi — sotuvchi tugmani ikki marta
 *    bossa pul ikki marta tushmaydi.
 */
export const kassaYozuv = pgTable(
  'kassa_yozuv',
  {
    id: id(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    kassaId: bigint('kassa_id', { mode: 'number' })
      .notNull()
      .references(() => kassa.id),
    /** 'K1','K3','C1','C4',… — 12.5 va 12.6 jadvallari */
    kod: text('kod').notNull(),
    /** + kirim, − chiqim */
    summa: numeric('summa', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull(),
    manbaTuri: text('manba_turi').notNull(),
    manbaId: bigint('manba_id', { mode: 'number' }).notNull(),
    /** 12.3 — bir manbadan bir nechta qator bo'lishi mumkin */
    qator: bigint('qator', { mode: 'number' }).notNull().default(1),
    /** 12.15 — bitta yozuvga BITTA storno */
    stornoId: bigint('storno_id', { mode: 'number' }).references(
      (): AnyPgColumn => kassaYozuv.id,
    ),
    izoh: text('izoh'),
    xodimId: bigint('xodim_id', { mode: 'number' }).notNull(),
  },
  (t) => [
    check('kassa_yozuv_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    check('kassa_yozuv_summa', sql`${t.summa} <> 0`),
    // TZ 12.3 — takrorlanish BAZADA to'siladi
    uniqueIndex('kassa_yozuv_manba').on(t.manbaTuri, t.manbaId, t.qator),
    // TZ 12.15 — bitta yozuvga bitta storno
    uniqueIndex('kassa_yozuv_storno')
      .on(t.stornoId)
      .where(sql`${t.stornoId} IS NOT NULL`),
    index('kassa_yozuv_kassa_sana').on(t.kassaId, t.sana),
  ],
);

// ─── 6.3 · kassa_kun — TZ 12.17 · Q-17 · AUDIT B-06 ───────────────────────

export const kassaKun = pgTable(
  'kassa_kun',
  {
    id: id(),
    kassaId: bigint('kassa_id', { mode: 'number' })
      .notNull()
      .references(() => kassa.id),
    sana: date('sana').notNull(),
    boshlangich: numeric('boshlangich', { precision: 14, scale: 2 }).notNull(),
    kirim: numeric('kirim', { precision: 14, scale: 2 }).notNull(),
    chiqim: numeric('chiqim', { precision: 14, scale: 2 }).notNull(),
    hisoblangan: numeric('hisoblangan', { precision: 14, scale: 2 }).notNull(),
    /** Sotuvchi sanab kiritgani — yopilmaguncha NULL */
    sanaldi: numeric('sanaldi', { precision: 14, scale: 2 }),
    farq: numeric('farq', { precision: 14, scale: 2 }),
    yopildi: timestamp('yopildi', { withTimezone: true }),
    yopdiId: bigint('yopdi_id', { mode: 'number' }).references(() => xodim.id),
    qaytaOchildi: timestamp('qayta_ochildi', { withTimezone: true }),
    izoh: text('izoh'),
    ...izlar,
  },
  // AUDIT B-06 — har valyuta uchun alohida qator (kassa valyutasi bilan)
  (t) => [uniqueIndex('kassa_kun_bitta').on(t.kassaId, t.sana)],
);

// ─── 6.4 · topshiriq — TZ 12.7 · 20.10.2 ──────────────────────────────────

/**
 * TZ 12.4 — «Tasdiqlash HECH QACHON pul yaratmaydi.»
 *
 * Topshiriqda pul **admin tasdiqlaganda** ko'chadi: jo'natish paytida
 * kassa yozuvi YOZILMAYDI. Aks holda pul yo'lda ikki joyda turardi.
 */
export const topshiriq = pgTable(
  'topshiriq',
  {
    id: id(),
    kimdanKassaId: bigint('kimdan_kassa_id', { mode: 'number' })
      .notNull()
      .references(() => kassa.id),
    kimgaKassaId: bigint('kimga_kassa_id', { mode: 'number' })
      .notNull()
      .references(() => kassa.id),
    summa: numeric('summa', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull(),
    holat: text('holat').notNull().default('JONATILDI'),
    qabulQildiId: bigint('qabul_qildi_id', { mode: 'number' }).references(
      () => xodim.id,
    ),
    qabulQilindi: timestamp('qabul_qilindi', { withTimezone: true }),
    izoh: text('izoh'),
    ...izlar,
  },
  (t) => [
    check('topshiriq_holat', sql`${t.holat} IN ('JONATILDI','QABUL','BEKOR')`),
    check('topshiriq_summa', sql`${t.summa} > 0`),
    check('topshiriq_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    // O'ziga o'zi topshirib bo'lmaydi
    check('topshiriq_ozgacha', sql`${t.kimdanKassaId} <> ${t.kimgaKassaId}`),
    index('topshiriq_holat_idx').on(t.holat),
  ],
);

// ─── 6.5 · xarajat — TZ 12.1 · AUDIT U-07 ─────────────────────────────────

/**
 * ⚠️ Bu jadval 12.1-invariantning ASOSI: xarajat kassadan ALOHIDA
 *    yuritiladi.
 *
 *    `kassa_yozuv_id IS NULL` → **pul chiqmagan xarajat** (ombor braki,
 *    hisoblangan ish haqi, chiqindi, kurs farqi…).
 *
 *    Kassadan pul chiqib, xarajat BO'LMAYDIGAN hodisalar esa bu
 *    jadvalga umuman tushmaydi (yetkazib beruvchiga to'lov, ish haqi
 *    to'lovi, ayirboshlash).
 */
export const XARAJAT_MODDALARI = [
  'ISH_HAQI',
  'TRANSPORT_BOJXONA',
  'OMBOR_BRAKI',
  'ISHLAB_CHIQARISH_BRAKI',
  'CHIQINDI',
  'KURS_FARQI',
  'YETKAZIB_BERUVCHI_DEFEKTI',
  'UMIDSIZ_QARZ',
  'BANK_KOMISSIYASI',
  'OPERATSION',
  'INVENTARIZATSIYA_FARQI',
  'YAXLITLASH',
  'XODIM_BALANSI_HISOBDAN',
  'FILIALLARARO_TRANSPORT',
  'BOSHQA',
] as const;

export const xarajat = pgTable(
  'xarajat',
  {
    id: id(),
    sana: date('sana').notNull(),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    modda: text('modda').notNull(),
    summa: numeric('summa', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull().default('SOM'),
    /** NULL = pul chiqmagan xarajat (12.1) */
    kassaYozuvId: bigint('kassa_yozuv_id', { mode: 'number' }).references(
      () => kassaYozuv.id,
    ),
    manbaTuri: text('manba_turi'),
    manbaId: bigint('manba_id', { mode: 'number' }),
    izoh: text('izoh'),
    xodimId: bigint('xodim_id', { mode: 'number' }).notNull(),
    yaratildi: timestamp('yaratildi', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    check(
      'xarajat_modda',
      sql`${t.modda} IN ('ISH_HAQI','TRANSPORT_BOJXONA','OMBOR_BRAKI',
                         'ISHLAB_CHIQARISH_BRAKI','CHIQINDI','KURS_FARQI',
                         'YETKAZIB_BERUVCHI_DEFEKTI','UMIDSIZ_QARZ',
                         'BANK_KOMISSIYASI','OPERATSION',
                         'INVENTARIZATSIYA_FARQI','YAXLITLASH',
                         'XODIM_BALANSI_HISOBDAN','FILIALLARARO_TRANSPORT',
                         'BOSHQA')`,
    ),
    check('xarajat_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    index('xarajat_filial_sana').on(t.filialId, t.sana),
    index('xarajat_modda_idx').on(t.modda),
  ],
);

// ─── 7.1 · mijoz_harakat — TZ 6.8 · 20.3.1 ────────────────────────────────

/**
 * TZ 6.8 — mijoz qarzi **UMUMIY**, lekin har harakat o'z filiali bilan
 * yoziladi (20.3.1).
 *
 * 2.2-invariant — qarz saqlanmaydi, `SUM()` bilan chiqadi.
 */
export const MIJOZ_HARAKAT_TURLARI = [
  'SOTUV',
  'TOLOV',
  'QAYTARISH',
  'AVANS',
  'UMIDSIZ_QARZ',
  'BOSHLANGICH',
] as const;

export const mijozHarakat = pgTable(
  'mijoz_harakat',
  {
    id: id(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    mijozId: bigint('mijoz_id', { mode: 'number' }).notNull(),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    turi: text('turi').notNull(),
    /** + qarz oshdi, − qarz kamaydi */
    summa: numeric('summa', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull().default('SOM'),
    kursSnapshot: numeric('kurs_snapshot', { precision: 10, scale: 2 }),
    manbaTuri: text('manba_turi'),
    manbaId: bigint('manba_id', { mode: 'number' }),
    izoh: text('izoh'),
    xodimId: bigint('xodim_id', { mode: 'number' }).notNull(),
  },
  (t) => [
    check(
      'mijoz_harakat_turi',
      sql`${t.turi} IN ('SOTUV','TOLOV','QAYTARISH','AVANS','UMIDSIZ_QARZ',
                        'BOSHLANGICH')`,
    ),
    check('mijoz_harakat_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    check(
      'mijoz_harakat_usd_kurs',
      sql`${t.valyuta} <> 'USD' OR ${t.kursSnapshot} IS NOT NULL`,
    ),
    index('mijoz_harakat_mijoz').on(t.mijozId, t.sana),
  ],
);

// ─── 7.2 · yetkazib_beruvchi_harakat — TZ 9 ───────────────────────────────

export const YETKAZIB_HARAKAT_TURLARI = [
  'XARID',
  'TOLOV',
  'AVANS',
  'DAVO',
  'BOSHLANGICH',
] as const;

export const yetkazibHarakat = pgTable(
  'yetkazib_beruvchi_harakat',
  {
    id: id(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    yetkazibBeruvchiId: bigint('yetkazib_beruvchi_id', { mode: 'number' }).notNull(),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    turi: text('turi').notNull(),
    /** + qarz oshdi (xarid), − qarz kamaydi (to'lov) */
    summa: numeric('summa', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull().default('SOM'),
    kursSnapshot: numeric('kurs_snapshot', { precision: 10, scale: 2 }),
    manbaTuri: text('manba_turi'),
    manbaId: bigint('manba_id', { mode: 'number' }),
    izoh: text('izoh'),
    xodimId: bigint('xodim_id', { mode: 'number' }).notNull(),
  },
  (t) => [
    check(
      'yetkazib_harakat_turi',
      sql`${t.turi} IN ('XARID','TOLOV','AVANS','DAVO','BOSHLANGICH')`,
    ),
    check('yetkazib_harakat_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    check(
      'yetkazib_harakat_usd_kurs',
      sql`${t.valyuta} <> 'USD' OR ${t.kursSnapshot} IS NOT NULL`,
    ),
    index('yetkazib_harakat_kim').on(t.yetkazibBeruvchiId, t.sana),
  ],
);
