/**
 * lib/db/index.ts — QISM 1 §1.3, §2.3
 *
 * Oddiy `postgres` (postgres.js) drayveri. Neon serverless drayveri, Vercel
 * saqlash xizmatlari va boshqa platforma SDK lari TAQIQLANGAN (§2.3) —
 * loyiha `docker compose up` bilan loqal to'liq ishlashi shart.
 *
 * Ulanish DANGASA yasaladi: modul import qilinganda emas, birinchi so'rovda.
 * Aks holda `next build` paytida ham `.env` talab qilinardi.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import type postgres from 'postgres';
import { ulanishYarat } from '@/lib/db/ulanish';
import { muhitOqi } from '@/lib/muhit';

type Ulanish = ReturnType<typeof postgres>;
type Baza = ReturnType<typeof drizzle>;

// Next.js dev rejimida modul qayta yuklanadi; hovuz bir marta yasaladi.
const global_ = globalThis as typeof globalThis & {
  __jalyuziUlanish?: Ulanish;
  __jalyuziBaza?: Baza;
};

export function ulanishOl(): Ulanish {
  if (global_.__jalyuziUlanish === undefined) {
    global_.__jalyuziUlanish = ulanishYarat(muhitOqi().DATABASE_URL);
  }
  return global_.__jalyuziUlanish;
}

export function bazaOl(): Baza {
  if (global_.__jalyuziBaza === undefined) {
    global_.__jalyuziBaza = drizzle(ulanishOl());
  }
  return global_.__jalyuziBaza;
}

/** Baza javob berayotganini tekshiradi — / va /api/salomatlik uchun. */
export async function bazaTirikmi(): Promise<boolean> {
  try {
    await ulanishOl()`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
