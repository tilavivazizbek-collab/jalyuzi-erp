/**
 * lib/db/schema/tizim.ts — QISM 3 §1.5–1.8 · TZ 2.4, 14, 14.5, 13.10
 *
 * Tizim jadvallari: audit jurnali, sozlamalar, kurs tarixi, idempotentlik.
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { id, izlar } from './ustunlar';
import { filial, xodim } from './asos';

// ─── 1.5 · audit_jurnal — TZ 2.4 + AUDIT U-08 ─────────────────────────────

/**
 * Teskari qoida (U-08): quyidagi turdagi HAR QANDAY amal jurnalga tushadi —
 * storno · qo'lda korrektsiya · chegaradan oshish · hisobdan chiqarish ·
 * sozlama o'zgarishi · ruxsat o'zgarishi.
 *
 * Yozuv o'sha tranzaksiya ichida yoziladi.
 */
export const auditJurnal = pgTable(
  'audit_jurnal',
  {
    id: id(),
    sana: timestamp('sana', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    xodimId: bigint('xodim_id', { mode: 'number' })
      .notNull()
      .references(() => xodim.id),
    filialId: bigint('filial_id', { mode: 'number' }).references(() => filial.id),
    amal: text('amal').notNull(), // 'STORNO','QOLDA_TUZATISH','CHEGARADAN_OSHDI',...
    obyektTuri: text('obyekt_turi').notNull(),
    obyektId: bigint('obyekt_id', { mode: 'number' }).notNull(),
    eskiQiymat: jsonb('eski_qiymat'),
    yangiQiymat: jsonb('yangi_qiymat'),
    izoh: text('izoh'),
    ip: text('ip'),
  },
  (t) => [
    index('audit_obyekt').on(t.obyektTuri, t.obyektId),
    index('audit_sana').on(t.sana),
    index('audit_xodim').on(t.xodimId, t.sana),
  ],
);

// ─── 1.6 · sozlama — TZ 14 ────────────────────────────────────────────────

export const sozlama = pgTable('sozlama', {
  kalit: text('kalit').primaryKey(), // 'kurs', 'kesish_bagrikenglik'
  qiymat: text('qiymat').notNull(),
  turi: text('turi').notNull(), // 'SON','MATN','PUL','FOIZ','MANTIQIY'
  guruh: text('guruh').notNull(), // TZ 14.2 — 'ASOSIY' yoki 'KENGAYTIRILGAN'
  /** TZ 14.4 — «har sozlama yonida qayerda ishlatilishi yozilgan bo'ladi» */
  tzBand: text('tz_band'),
  izoh: text('izoh'),
  ...izlar,
});

// ─── 1.7 · kurs_tarix — TZ 14.5 + AUDIT U-13 ──────────────────────────────

/**
 * «Faqat joriy kurs saqlansa, o'tgan oyning hisobotini qayta ochganda eski
 * kurs yo'qoladi» — 2.3-invariant buziladi.
 *
 * Kursga tayanadigan yettita joy: 6.3 · 6.4 · 8.13 · 9.6 (ikki marta) ·
 * 10.5 · 12.9.
 */
export const kursTarix = pgTable(
  'kurs_tarix',
  {
    id: id(),
    sana: date('sana').notNull(),
    qiymat: numeric('qiymat', { precision: 10, scale: 2 }).notNull(),
    ...izlar,
  },
  (t) => [uniqueIndex('kurs_sana').on(t.sana)],
);

// ─── 1.8 · amal_kaliti — TZ 13.10 ─────────────────────────────────────────

/**
 * Idempotentlik. Bot va tashqi chaqiruvlar takrorlanishi mumkin;
 * bir xil kalit ikkinchi marta kelsa saqlangan natija qaytariladi.
 */
export const amalKaliti = pgTable('amal_kaliti', {
  kalit: text('kalit').primaryKey(),
  natija: jsonb('natija').notNull(),
  yaratildi: timestamp('yaratildi', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── 1.9 · xato_jurnal — serverdagi kutilmagan xatolar ────────────────────

/**
 * Ishlab chiqarishdagi xatolar jurnali.
 *
 * ⚠️ NEGA KERAK
 *
 *    Next.js ishlab chiqarishda xato MATNINI ko'rsatmaydi — faqat
 *    `digest` degan raqam beradi. Egasi menga «xato chiqdi,
 *    raqami 2143683442» deydi va men u raqamdan hech narsa
 *    tushunmayman: matn serverning jurnalida qoladi, unga esa
 *    kirish yo'q.
 *
 *    2026-08-29 da aynan shu bo'ldi: bir xato ikki kun izlandi.
 *
 *    Endi har xato SHU YERGA yoziladi — digest bilan birga.
 *    Raqamni aytish kifoya, xato bir soniyada topiladi.
 *
 * ⚠️ Bu jadval ISH MA'LUMOTI EMAS: unda pul ham, mijoz ham yo'q.
 *    Shuning uchun unda `filial_id` va `xodim_id` majburiy emas —
 *    xato kirishdan oldin ham bo'lishi mumkin.
 */
export const xatoJurnal = pgTable(
  'xato_jurnal',
  {
    id: id(),
    vaqt: timestamp('vaqt', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    /** Next bergan raqam — egasi ekranda shuni ko'radi */
    digest: text('digest'),
    /** Qaysi manzilda */
    yol: text('yol'),
    xabar: text('xabar').notNull(),
    stek: text('stek'),
    xodimId: bigint('xodim_id', { mode: 'number' }),
  },
  (t) => [index('xato_jurnal_digest').on(t.digest), index('xato_jurnal_vaqt').on(t.vaqt)],
);
