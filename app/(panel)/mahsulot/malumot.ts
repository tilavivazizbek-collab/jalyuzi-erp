/**
 * Konstruktor ekranlari uchun umumiy so'rovlar.
 *
 * Bir necha sahifa bir xil ma'lumotni o'qiydi — so'rov bitta joyda turadi.
 */

import { ulanishOl } from '@/lib/db';
import type { GuruhMalumoti } from './kalkulyator';
import type { MaterialTanlovi } from './forma';
import type { SarflashBirligi } from '@/lib/domain/birlik';

interface GuruhQatori {
  readonly id: number;
  readonly nom: string;
  readonly sarflash_birligi: string | null;
  readonly namuna_narx: string | null;
  readonly namuna_nom: string | null;
}

/**
 * Almashtirish guruhlari va ularning NAMUNA materiali.
 *
 * Test kalkulyatori (4.8) sarflash birligini bilishi kerak: natija kv.m mi,
 * sm mi, dona mi — bu materialga bog'liq (AUDIT B-01). Guruh ichidagi
 * materiallar bir-birini almashtiradi, ya'ni birligi bir xil bo'lishi kerak.
 */
export async function guruhlarniOl(): Promise<GuruhMalumoti[]> {
  const qatorlar = await ulanishOl()<GuruhQatori[]>`
    SELECT g.id, g.nom,
           n.sarflash_birligi, n.sotuv_narx AS namuna_narx, n.nom AS namuna_nom
    FROM almashtirish_guruh g
    LEFT JOIN LATERAL (
      SELECT m.sarflash_birligi, m.sotuv_narx, m.nom
      FROM material m
      WHERE m.almashtirish_guruh_id = g.id AND m.faol = true
      ORDER BY (m.sotuv_narx IS NULL), m.nom
      LIMIT 1
    ) n ON true
    WHERE g.faol = true
    ORDER BY g.nom`;

  return qatorlar.map((g) => ({
    id: g.id,
    nom: g.nom,
    sarflashBirligi: (g.sarflash_birligi ?? 'KV_M') as SarflashBirligi,
    namunaNarx: g.namuna_narx,
    namunaNom: g.namuna_nom,
  }));
}

/** Aksessuar komplektiga qo'shiladigan materiallar (4.6). */
export async function materiallarniOl(): Promise<MaterialTanlovi[]> {
  return ulanishOl()<MaterialTanlovi[]>`
    SELECT id, nom FROM material WHERE faol = true ORDER BY nom`;
}
