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
import postgres from 'postgres';
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
    global_.__jalyuziUlanish = postgres(muhitOqi().DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      // NUMERIC matn bo'lib qaytadi — pul aniqligi uchun to'g'ri xatti-harakat (§1.3).
      // Bu postgres.js ning standart holati; o'zgartirilmaydi.
    });
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
