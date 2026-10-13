/**
 * Rejalar ekrani ma'lumoti — TZ 21.3. 2026-10-13.
 *
 * ⚠️ QAMROV BITTA JOYDA (`rejaQamrovi`) — sahifa ham, server amali ham
 *    shundan oladi (§9.4): korxona va hamma filial rejasini faqat bosh
 *    filialdagi BARCHA qamrovli odam qo'yadi (21.7 — «bosh admin —
 *    korxona rejasi»). Qolganlar — o'z filiali va uning sotuvchilari.
 */

import { ulanishOl } from '@/lib/db';
import { rejaKaliti, type RejaTuri } from '@/lib/domain/reja';
import { yigindiQamrov, type Foydalanuvchi } from '@/lib/ruxsat/tekshir';

export interface RejaQamrovi {
  readonly korxona: boolean;
  /** `null` — hamma filial */
  readonly filialIdlar: readonly number[] | null;
}

export function rejaQamrovi(f: Foydalanuvchi): RejaQamrovi {
  const hammasi = f.boshFilialda && yigindiQamrov(f, 'reja.boshqar') === 'BARCHA';
  return hammasi ? { korxona: true, filialIdlar: null } : { korxona: false, filialIdlar: [f.filialId] };
}

/** Kalit shu qamrovga kiradimi — server amali begona qatorni tashlab yuboradi */
export function qamrovdami(q: RejaQamrovi, turi: RejaTuri, filialId: number | null): boolean {
  if (turi === 'KORXONA') return q.korxona;
  return filialId !== null && (q.filialIdlar === null || q.filialIdlar.includes(filialId));
}

export interface RejaEkrani {
  readonly filiallar: readonly { readonly id: number; readonly nom: string }[];
  readonly sotuvchilar: readonly { readonly id: number; readonly ism: string; readonly filialId: number }[];
  /** `rejaKaliti` → saqlangan reja */
  readonly rejalar: ReadonlyMap<
    string,
    { readonly tushum: string | null; readonly foyda: string | null; readonly oyIchidaOzgardi: boolean }
  >;
  readonly otganOydaBor: boolean;
}

export async function rejaEkrani(oy: string, oldingiOy: string, q: RejaQamrovi): Promise<RejaEkrani> {
  const sql = ulanishOl();
  const filtr = q.filialIdlar === null ? sql`` : sql`AND f.id = ANY(${q.filialIdlar as number[]})`;
  const [filiallar, sotuvchilar, rejalar, otgan] = await Promise.all([
    sql<{ id: number; nom: string }[]>`
      SELECT f.id, f.nom FROM filial f
      WHERE f.faol AND f.ochirildi IS NULL AND f.sotadi ${filtr}
      ORDER BY f.bosh DESC, f.nom`,
    // Faqat SOTUVCHI roli bor faol xodimlar — usta va omborchiga reja yo'q (21.2)
    sql<{ id: number; ism: string; filial_id: number }[]>`
      SELECT DISTINCT x.id, x.ism, x.filial_id
      FROM xodim x
      JOIN filial f ON f.id = x.filial_id
      JOIN xodim_rol xr ON xr.xodim_id = x.id
      JOIN rol r ON r.id = xr.rol_id AND r.kod = 'SOTUVCHI'
      WHERE x.faol ${filtr}
      ORDER BY x.ism`,
    sql<
      {
        turi: RejaTuri;
        filial_id: number | null;
        xodim_id: number | null;
        tushum: string | null;
        foyda: string | null;
        oy_ichida_ozgardi: boolean;
      }[]
    >`
      SELECT turi, filial_id, xodim_id, tushum::text, foyda::text, oy_ichida_ozgardi
      FROM reja WHERE oy = ${oy}`,
    sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM reja WHERE oy = ${oldingiOy}`,
  ]);

  return {
    filiallar,
    sotuvchilar: sotuvchilar.map((s) => ({ id: s.id, ism: s.ism, filialId: s.filial_id })),
    rejalar: new Map(
      rejalar
        .filter((r) => qamrovdami(q, r.turi, r.filial_id))
        .map((r) => [
          rejaKaliti(r.turi, r.filial_id, r.xodim_id),
          { tushum: r.tushum, foyda: r.foyda, oyIchidaOzgardi: r.oy_ichida_ozgardi },
        ]),
    ),
    otganOydaBor: (otgan[0]?.n ?? 0) > 0,
  };
}
