import 'server-only';

/**
 * app/(panel)/boshqaruv/malumot.ts
 *
 * Boshqaruv sahifasi uchun kim va qayerda ishlayotgani.
 *
 * ⚠️ Ilgari sahifa «Filial #1» deb ko'rsatardi. Raqam egasiga hech
 *    narsa aytmaydi — u filialni NOMI bilan biladi. Shuning uchun
 *    nom bazadan olinadi.
 */

import { ulanishOl } from '@/lib/db';

export interface KimIshlamoqda {
  readonly ism: string;
  readonly filialNomi: string;
}

export async function kimIshlamoqda(
  xodimId: number,
  filialId: number,
): Promise<KimIshlamoqda> {
  const q = await ulanishOl()<{ ism: string; filial_nomi: string }[]>`
    SELECT x.ism, f.nom AS filial_nomi
    FROM xodim x
    JOIN filial f ON f.id = x.filial_id
    WHERE x.id = ${xodimId}`;

  return {
    ism: q[0]?.ism ?? '—',
    filialNomi: q[0]?.filial_nomi ?? `#${String(filialId)}`,
  };
}
