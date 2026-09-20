import 'server-only';

/**
 * app/(panel)/daraja/malumot.ts — mato darajalari (egasi qarori 2026-09-20).
 *
 * ⚠️ NEGA ALOHIDA SAHIFA
 *
 *    Daraja «Narxlar va turlar» dagi modaldan yaratilardi, lekin uni
 *    keyin TAHRIRLASH ham, O'CHIRISH ham mumkin emasdi. Xato yozilgan
 *    nom ro'yxatda abadiy qolardi — almashtirish guruhida ham aynan
 *    shu muammo bo'lgan va shu tarzda yechilgan (`/guruh`).
 */

import { ulanishOl } from '@/lib/db';

export interface DarajaQatori {
  readonly id: number;
  readonly nom: string;
  readonly faol: boolean;
  /** Nechta materialga shu daraja qo'yilgan */
  readonly materialSoni: number;
  /** Nechta mahsulot turida narx qo'yilgan */
  readonly qoidaSoni: number;
}

export async function darajaRoyxati(
  /** ⚠️ `true` — faqat O'CHIRILGANLARI (qaytarish uchun) */
  ochirilganlar = false,
): Promise<DarajaQatori[]> {
  return ulanishOl()<DarajaQatori[]>`
    SELECT g.id, g.nom, g.faol,
           (SELECT COUNT(*)::int FROM material m
             WHERE m.narx_guruh_id = g.id AND m.faol = true) AS "materialSoni",
           (SELECT COUNT(*)::int FROM mahsulot_narx mn
             WHERE mn.narx_guruh_id = g.id AND mn.faol = true) AS "qoidaSoni"
    FROM narx_guruh g
    WHERE g.faol = ${!ochirilganlar}
    ORDER BY g.tartib, g.nom`;
}

/** O'chirilganlar soni — havolada ko'rsatiladi */
export async function darajaOchirilganSoni(): Promise<number> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM narx_guruh WHERE faol = false`;
  return q[0]?.n ?? 0;
}
