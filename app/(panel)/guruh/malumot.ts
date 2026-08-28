import 'server-only';

/**
 * app/(panel)/guruh/malumot.ts — TZ 5.6 · almashtirish guruhlari.
 *
 * ⚠️ Guruhning o'z sahifasi ILGARI YO'Q edi: u faqat material
 *    kartochkasidagi modal orqali yaratilardi va keyin uni
 *    tahrirlash ham, o'chirish ham mumkin emasdi. Xato yozilgan
 *    nom ro'yxatda abadiy qolardi.
 */

import { ulanishOl } from '@/lib/db';

export interface GuruhQatori {
  readonly id: number;
  readonly nom: string;
  readonly faol: boolean;
  /** Nechta material shu guruhda — o'chirish mumkinmi, shundan bilinadi */
  readonly materialSoni: number;
  /** Nechta mahsulot turida ishlatilmoqda */
  readonly slotSoni: number;
}

export async function guruhRoyxati(): Promise<GuruhQatori[]> {
  return ulanishOl()<GuruhQatori[]>`
    SELECT g.id, g.nom, g.faol,
           (SELECT COUNT(*)::int FROM material m
             WHERE m.almashtirish_guruh_id = g.id AND m.faol = true) AS "materialSoni",
           (SELECT COUNT(*)::int FROM mahsulot_slot s
             WHERE s.almashtirish_guruh_id = g.id AND s.faol = true) AS "slotSoni"
    FROM almashtirish_guruh g
    ORDER BY g.faol DESC, g.nom`;
}

export async function guruhniOl(id: number): Promise<{ id: number; nom: string } | null> {
  const q = await ulanishOl()<{ id: number; nom: string }[]>`
    SELECT id, nom FROM almashtirish_guruh WHERE id = ${id}`;
  return q[0] ?? null;
}
