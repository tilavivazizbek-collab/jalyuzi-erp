/**
 * lib/db/schema/ustunlar.ts — QISM 3 §0.1, §0.2 · QISM 1 §6
 *
 * Har jadvalda takrorlanadigan ustunlar. Bir joyda turgani uchun qoida
 * unutilib qolmaydi va keyin bir jadvalda `yaratdi_id` yo'q bo'lib chiqmaydi.
 */

import { sql } from 'drizzle-orm';
import { bigint, bigserial, boolean, timestamp } from 'drizzle-orm/pg-core';

/** `id BIGSERIAL PRIMARY KEY` — QISM 1 §6.1 */
export const id = () => bigserial('id', { mode: 'number' }).primaryKey();

/**
 * Kim va qachon yaratdi/o'zgartirdi — QISM 3 §0.1.
 *
 * `yaratdi_id` NOT NULL. Birinchi xodim va birinchi filial bir-biriga
 * havola qiladi, shuning uchun ularning tashqi kalitlari migratsiyada
 * `DEFERRABLE INITIALLY DEFERRED` qilinadi va urug' bitta tranzaksiyada
 * yoziladi.
 */
export const izlar = {
  yaratildi: timestamp('yaratildi', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  yaratdiId: bigint('yaratdi_id', { mode: 'number' }).notNull(),
  ozgartirildi: timestamp('ozgartirildi', { withTimezone: true }),
  ozgartirdiId: bigint('ozgartirdi_id', { mode: 'number' }),
};

/**
 * Spravochnik jadvallariga qo'shimcha — QISM 3 §0.1, §0.3.
 * `DELETE` yo'q: keraksiz yozuv `faol = false` qilinadi.
 */
export const ochirilmaydi = {
  faol: boolean('faol').notNull().default(true),
  ochirildi: timestamp('ochirildi', { withTimezone: true }),
};
