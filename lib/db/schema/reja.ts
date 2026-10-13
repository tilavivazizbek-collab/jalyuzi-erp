/**
 * lib/db/schema/reja.ts — TZ 21 · Rejalar (0065, 2026-10-13)
 *
 * ⚠️ Korxona va filial — tushum + foyda, sotuvchi — faqat tushum.
 *    Ustaga reja yo'q (21.2). Hozircha oylik.
 * ⚠️ O'zgarish auditga sabab bilan tushadi (`lib/amal/reja.ts`, 21.4).
 */

import { sql } from 'drizzle-orm';
import { bigint, boolean, check, date, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { id, izlar } from './ustunlar';
import { filial, xodim } from './asos';

export const reja = pgTable(
  'reja',
  {
    id: id(),
    /** Oyning birinchi kuni */
    oy: date('oy').notNull(),
    turi: text('turi').notNull(),
    filialId: bigint('filial_id', { mode: 'number' }).references(() => filial.id),
    xodimId: bigint('xodim_id', { mode: 'number' }).references(() => xodim.id),
    /** So'mda. NULL yoki 0 — «reja yo'q» (EC-REJ-01, EC-REJ-06) */
    tushum: numeric('tushum', { precision: 14, scale: 2 }),
    foyda: numeric('foyda', { precision: 14, scale: 2 }),
    oyIchidaOzgardi: boolean('oy_ichida_ozgardi').notNull().default(false),
    ...izlar,
  },
  (t) => [
    check('reja_turi', sql`${t.turi} IN ('KORXONA', 'FILIAL', 'SOTUVCHI')`),
    check('reja_oy_boshi', sql`EXTRACT(DAY FROM ${t.oy}) = 1`),
    check(
      'reja_musbat',
      sql`(${t.tushum} IS NULL OR ${t.tushum} >= 0) AND (${t.foyda} IS NULL OR ${t.foyda} >= 0)`,
    ),
    check(
      'reja_kimga',
      sql`(${t.turi} = 'KORXONA' AND ${t.filialId} IS NULL AND ${t.xodimId} IS NULL)
        OR (${t.turi} = 'FILIAL' AND ${t.filialId} IS NOT NULL AND ${t.xodimId} IS NULL)
        OR (${t.turi} = 'SOTUVCHI' AND ${t.filialId} IS NOT NULL AND ${t.xodimId} IS NOT NULL)`,
    ),
    check('reja_sotuvchi_foydasiz', sql`${t.turi} <> 'SOTUVCHI' OR ${t.foyda} IS NULL`),
    uniqueIndex('reja_bitta').on(
      t.oy,
      t.turi,
      sql`COALESCE(${t.filialId}, 0)`,
      sql`COALESCE(${t.xodimId}, 0)`,
    ),
  ],
);
