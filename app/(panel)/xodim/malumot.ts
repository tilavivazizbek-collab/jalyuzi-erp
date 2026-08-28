import 'server-only';

/** app/(panel)/xodim/malumot.ts — TZ 10.1 · 10.3 */

import { ulanishOl } from '@/lib/db';

export interface XodimQatori {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string;
  readonly filialNomi: string;
  readonly rollar: string;
  readonly faol: boolean;
  /** Parol yo'q → saytga kira olmaydi (usta botdan ishlaydi) */
  readonly parolBormi: boolean;
}

export async function xodimRoyxati(
  /** ⚠️ `true` — faqat O'CHIRILGANLARI (qaytarish uchun) */
  ochirilganlar = false,
): Promise<XodimQatori[]> {
  return ulanishOl()<XodimQatori[]>`
    SELECT x.id, x.ism, x.telefon, f.nom AS "filialNomi", x.faol,
           (x.parol_hash IS NOT NULL) AS "parolBormi",
           COALESCE(
             (SELECT string_agg(r.nom, ' · ' ORDER BY r.nom)
              FROM xodim_rol xr JOIN rol r ON r.id = xr.rol_id
              WHERE xr.xodim_id = x.id),
             ''
           ) AS rollar
    FROM xodim x
    JOIN filial f ON f.id = x.filial_id
    WHERE x.faol = ${!ochirilganlar}
    ORDER BY x.ism`;
}

export interface XodimTafsili {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string;
  readonly filialId: number;
  readonly ishgaKirdi: string | null;
  readonly rolIdlar: readonly number[];
}

export async function xodimniOl(id: number): Promise<XodimTafsili | null> {
  const sql = ulanishOl();

  const q = await sql<
    {
      id: number;
      ism: string;
      telefon: string;
      filialId: number;
      ishgaKirdi: string | null;
    }[]
  >`
    SELECT id, ism, telefon, filial_id AS "filialId",
           to_char(ishga_kirdi, 'YYYY-MM-DD') AS "ishgaKirdi"
    FROM xodim WHERE id = ${id}`;

  const x = q[0];
  if (x === undefined) return null;

  const r = await sql<{ rol_id: number }[]>`
    SELECT rol_id FROM xodim_rol WHERE xodim_id = ${id}`;

  return { ...x, rolIdlar: r.map((y) => y.rol_id) };
}

export interface RolTanlovi {
  readonly id: number;
  readonly nom: string;
  readonly kod: string;
}

export async function rolRoyxati(): Promise<RolTanlovi[]> {
  return ulanishOl()<RolTanlovi[]>`
    SELECT id, nom, kod FROM rol ORDER BY nom`;
}

export interface FilialTanlovi {
  readonly id: number;
  readonly nom: string;
}

export async function xodimFiliallari(): Promise<FilialTanlovi[]> {
  return ulanishOl()<FilialTanlovi[]>`
    SELECT id, nom FROM filial WHERE faol = true ORDER BY bosh DESC, nom`;
}

/** O'chirilganlar soni — havolada ko'rsatiladi */
export async function xodimOchirilganSoni(): Promise<number> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM xodim WHERE faol = false`;
  return q[0]?.n ?? 0;
}
