/**
 * lib/amal/foydalanuvchi.ts — TZ 10.3 · 14.6 · 20.12
 *
 * Xodimni rollari va ruxsatlari bilan bazadan yig'ish.
 *
 * Ruxsatlar YIG'INDI bo'lgani uchun (10.3) barcha rol bitta so'rovda olinadi —
 * aks holda har rol uchun alohida so'rov ketardi.
 */

import { sql } from 'drizzle-orm';
import type postgres from 'postgres';
import { ruxsatKodmi, type RuxsatKod } from '@/lib/ruxsat/kodlar';
import type { Foydalanuvchi, Qamrov, Rol, TizimliRol } from '@/lib/ruxsat/tekshir';

interface Qator {
  readonly xodim_id: number;
  readonly filial_id: number;
  readonly bosh: boolean;
  readonly rol_id: number | null;
  readonly rol_kod: string | null;
  readonly rol_nom: string | null;
  readonly ruxsat_kod: string | null;
  readonly qamrov: string | null;
}

function qatorlardanYig(qatorlar: readonly Qator[]): Foydalanuvchi | null {
  const birinchi = qatorlar[0];
  if (birinchi === undefined) return null;

  const rollar = new Map<number, { kod: TizimliRol | null; nom: string; r: Map<RuxsatKod, Qamrov> }>();

  for (const q of qatorlar) {
    if (q.rol_id === null) continue;

    let rol = rollar.get(q.rol_id);
    if (rol === undefined) {
      rol = {
        kod: q.rol_kod === null ? null : (q.rol_kod as TizimliRol),
        nom: q.rol_nom ?? '',
        r: new Map(),
      };
      rollar.set(q.rol_id, rol);
    }

    // Kodda yo'q ruxsat e'tiborsiz qoldiriladi: bazada eski kod qolib ketishi
    // mumkin, lekin u hech qachon jimgina ruxsat bermasligi kerak.
    if (q.ruxsat_kod !== null && q.qamrov !== null && ruxsatKodmi(q.ruxsat_kod)) {
      rol.r.set(q.ruxsat_kod, q.qamrov === 'BARCHA' ? 'BARCHA' : 'OZ_FILIALI');
    }
  }

  const royxat: Rol[] = [...rollar.values()].map((x) => ({
    kod: x.kod,
    nom: x.nom,
    ruxsatlar: x.r,
  }));

  return {
    xodimId: birinchi.xodim_id,
    filialId: birinchi.filial_id,
    boshFilialda: birinchi.bosh,
    rollar: royxat,
  };
}

const SOROV = sql`
  SELECT x.id AS xodim_id, x.filial_id, f.bosh,
         r.id AS rol_id, r.kod AS rol_kod, r.nom AS rol_nom,
         rr.ruxsat_kod, rr.qamrov
  FROM xodim x
  JOIN filial f ON f.id = x.filial_id
  LEFT JOIN xodim_rol xr ON xr.xodim_id = x.id
  LEFT JOIN rol r ON r.id = xr.rol_id AND r.faol = true
  LEFT JOIN rol_ruxsat rr ON rr.rol_id = r.id
`;

export async function foydalanuvchiniOl(
  ulanish: postgres.Sql,
  xodimId: number,
): Promise<Foydalanuvchi | null> {
  const qatorlar = await ulanish<Qator[]>`
    SELECT x.id AS xodim_id, x.filial_id, f.bosh,
           r.id AS rol_id, r.kod AS rol_kod, r.nom AS rol_nom,
           rr.ruxsat_kod, rr.qamrov
    FROM xodim x
    JOIN filial f ON f.id = x.filial_id
    LEFT JOIN xodim_rol xr ON xr.xodim_id = x.id
    LEFT JOIN rol r ON r.id = xr.rol_id AND r.faol = true
    LEFT JOIN rol_ruxsat rr ON rr.rol_id = r.id
    WHERE x.id = ${xodimId} AND x.faol = true`;
  return qatorlardanYig(qatorlar);
}

export { SOROV as FOYDALANUVCHI_SOROVI, qatorlardanYig };
