/**
 * lib/db/schema/filial-hisob.ts — QISM 3 · TZ 20.7 · 20.8 · 22.9
 *
 * 6-bosqich: filiallararo ko'chirish va hisob-kitob.
 *
 * Uchta jadval:
 *   `kochirish`        20.7.2 — material ko'chirish hujjati
 *   `kochirish_qator`  20.7.2 — aniq bo'lak bilan (Q-02)
 *   `filial_harakat`   22.9.1 — uchinchi qarz turi
 *
 * ⚠️ `filial_harakat` da `UPDATE`/`DELETE` TAQIQ (22.9.1). Balans
 *    saqlanmaydi — `SUM()` bilan (2.2-invariant).
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { id, izlar } from './ustunlar';
import { filial, xodim } from './asos';
import { bolak } from './ombor';

// ─── 20.7 · kochirish ─────────────────────────────────────────────────────

export const KOCHIRISH_HOLATLARI = ['SOROV', 'YOLDA', 'QABUL', 'BEKOR'] as const;

/**
 * TZ 20.7.1 — oqim:
 * ```
 * SOROV → YOLDA → QABUL
 *       ↘ BEKOR
 * ```
 *
 * Tasdiqlash — **beruvchi filial omborchisi**. Admin tasdig'i kerak emas,
 * summa chegarasi yo'q (20.7.1).
 */
export const kochirish = pgTable(
  'kochirish',
  {
    id: id(),
    raqam: text('raqam').notNull().unique(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    kimdanFilialId: bigint('kimdan_filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    kimgaFilialId: bigint('kimga_filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),

    holat: text('holat').notNull().default('SOROV'),

    jonatdiId: bigint('jonatdi_id', { mode: 'number' }).references(() => xodim.id),
    jonatildi: timestamp('jonatildi', { withTimezone: true }),
    qabulQildiId: bigint('qabul_qildi_id', { mode: 'number' }).references(
      () => xodim.id,
    ),
    qabulQilindi: timestamp('qabul_qilindi', { withTimezone: true }),

    /** 22.4.1 — tannarx bo'yicha avtomatik, o'zgartirilishi mumkin */
    qarzSumma: numeric('qarz_summa', { precision: 14, scale: 2 }),
    qarzQolda: boolean('qarz_qolda').notNull().default(false),
    qarzSabab: text('qarz_sabab'),

    bekorSabab: text('bekor_sabab'),
    izoh: text('izoh'),
    ...izlar,
  },
  (t) => [
    check('kochirish_holat', sql`${t.holat} IN ('SOROV','YOLDA','QABUL','BEKOR')`),
    // 20.6.1 — bo'lak bir filialdan ikkinchisiga o'tadi, o'ziga emas
    check('kochirish_filiallar', sql`${t.kimdanFilialId} <> ${t.kimgaFilialId}`),
    // 22.4.1 · EC-FQ-06 — qo'lda o'zgartirilsa sabab MAJBURIY
    check(
      'kochirish_qarz_sabab',
      sql`${t.qarzQolda} = false OR ${t.qarzSabab} IS NOT NULL`,
    ),
    check(
      'kochirish_bekor_sabab',
      sql`${t.holat} <> 'BEKOR' OR ${t.bekorSabab} IS NOT NULL`,
    ),
    // 20.7.1 — jo'natilgan bo'lsa kim jo'natgani yozilgan bo'lishi shart
    check(
      'kochirish_jonatdi',
      sql`${t.holat} IN ('SOROV','BEKOR')
          OR (${t.jonatdiId} IS NOT NULL AND ${t.jonatildi} IS NOT NULL)`,
    ),
    check(
      'kochirish_qabul',
      sql`${t.holat} <> 'QABUL'
          OR (${t.qabulQildiId} IS NOT NULL AND ${t.qabulQilindi} IS NOT NULL)`,
    ),
    check(
      'kochirish_qarz_manfiy_emas',
      sql`${t.qarzSumma} IS NULL OR ${t.qarzSumma} >= 0`,
    ),
    index('kochirish_kimdan').on(t.kimdanFilialId, t.sana),
    index('kochirish_kimga').on(t.kimgaFilialId, t.sana),
    index('kochirish_holat_idx').on(t.holat),
  ],
);

// ─── 20.7.2 · kochirish_qator ─────────────────────────────────────────────

/**
 * Q-02 — aniq bo'lak kuzatiladi, umumiy miqdor emas.
 *
 * ⚠️ 20.7.3 — bo'lakning `tannarx_birlik_snapshot` qiymati ko'chishda
 *    O'ZGARMAYDI. Bu yerdagi `tannarx_summa_snapshot` — jo'natish
 *    paytidagi to'liq qiymat, qarz hisobi uchun (22.4.1).
 */
export const kochirishQator = pgTable(
  'kochirish_qator',
  {
    id: id(),
    kochirishId: bigint('kochirish_id', { mode: 'number' })
      .notNull()
      .references(() => kochirish.id),
    bolakId: bigint('bolak_id', { mode: 'number' })
      .notNull()
      .references(() => bolak.id),

    /** 22.4.1 — qarz shu summadan yig'iladi */
    tannarxSummaSnapshot: numeric('tannarx_summa_snapshot', {
      precision: 14,
      scale: 2,
    }).notNull(),

    /** Jo'natishdagi o'lcham — 2.3-invariant */
    eniMSnapshot: numeric('eni_m_snapshot', { precision: 8, scale: 2 }),
    boyiMSnapshot: numeric('boyi_m_snapshot', { precision: 8, scale: 2 }),
    /** DONA va CHIZIQLI uchun — `bolak.miqdor` bilan bir xil birlik */
    miqdorSnapshot: numeric('miqdor_snapshot', { precision: 10, scale: 2 }),

    /** EC-FQ-03 — qabulda o'lchansa haqiqiy qiymat shu yerga tushadi */
    haqiqiyEniM: numeric('haqiqiy_eni_m', { precision: 8, scale: 2 }),
    haqiqiyBoyiM: numeric('haqiqiy_boyi_m', { precision: 8, scale: 2 }),
    haqiqiyMiqdor: numeric('haqiqiy_miqdor', { precision: 10, scale: 2 }),
    olchovIzoh: text('olchov_izoh'),
  },
  (t) => [
    // Bir hujjatda bir bo'lak bir marta
    uniqueIndex('kochirish_qator_bolak').on(t.kochirishId, t.bolakId),
    index('kochirish_qator_hujjat').on(t.kochirishId),
    index('kochirish_qator_bolak_idx').on(t.bolakId),
    check('kochirish_qator_tannarx', sql`${t.tannarxSummaSnapshot} >= 0`),
  ],
);

// ─── 22.9.1 · filial_harakat ──────────────────────────────────────────────

export const FILIAL_HARAKAT_TURLARI = [
  'TAYYOR_MAHSULOT',
  'MATERIAL_KOCHIRISH',
  'PUL_TOPSHIRISH',
  'TOLOV',
  'QAYTARISH',
  'QOLDA_TUZATISH',
] as const;

/**
 * TZ 22.9.1 — filiallararo qarz jurnali.
 *
 * Yo'nalish `kimdan → kimga` ustunlarida: `kimdan` qarzdor, `kimga`
 * kreditor. Teskari yozuvda (22.3.4) `summa` manfiy bo'ladi.
 *
 * ⚠️ 22.9.4 · 11-invariant — barcha filiallar bo'yicha yig'indi 0.
 */
export const filialHarakat = pgTable(
  'filial_harakat',
  {
    id: id(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    kimdanFilialId: bigint('kimdan_filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    kimgaFilialId: bigint('kimga_filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    turi: text('turi').notNull(),
    summa: numeric('summa', { precision: 14, scale: 2 }).notNull(),
    valyuta: text('valyuta').notNull().default('SOM'),
    kursSnapshot: numeric('kurs_snapshot', { precision: 10, scale: 2 }),

    manbaTuri: text('manba_turi'),
    manbaId: bigint('manba_id', { mode: 'number' }),

    qoldaOzgartirildi: boolean('qolda_ozgartirildi').notNull().default(false),
    ozgartirishSabab: text('ozgartirish_sabab'),
    izoh: text('izoh'),
    xodimId: bigint('xodim_id', { mode: 'number' })
      .notNull()
      .references(() => xodim.id),
  },
  (t) => [
    check(
      'filial_harakat_turi',
      sql`${t.turi} IN ('TAYYOR_MAHSULOT','MATERIAL_KOCHIRISH',
                        'PUL_TOPSHIRISH','TOLOV','QAYTARISH','QOLDA_TUZATISH')`,
    ),
    check('filial_harakat_filiallar', sql`${t.kimdanFilialId} <> ${t.kimgaFilialId}`),
    check('filial_harakat_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    check('filial_harakat_summa', sql`${t.summa} <> 0`),
    // 9.6 — dollarli harakatda kurs majburiy
    check(
      'filial_harakat_usd_kurs',
      sql`${t.valyuta} <> 'USD' OR ${t.kursSnapshot} IS NOT NULL`,
    ),
    check(
      'filial_harakat_qolda_sabab',
      sql`${t.qoldaOzgartirildi} = false OR ${t.ozgartirishSabab} IS NOT NULL`,
    ),
    // 22.9.1 — bir manbadan bir turdagi bitta yozuv
    uniqueIndex('filial_harakat_manba')
      .on(t.manbaTuri, t.manbaId, t.turi)
      .where(sql`${t.manbaTuri} IS NOT NULL`),
    index('filial_harakat_kimdan').on(t.kimdanFilialId, t.sana),
    index('filial_harakat_kimga').on(t.kimgaFilialId, t.sana),
  ],
);
