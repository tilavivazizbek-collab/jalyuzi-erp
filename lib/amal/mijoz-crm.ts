/**
 * lib/amal/mijoz-crm.ts — kontakt shaxslar va muloqot tarixi (0061)
 *
 * Egasi auditi 2026-10-06 — «sotuvchi ishini yengillashtiradi».
 *
 * ⚠️ PUL YO'Q. Va'da summasi qarzga tegmaydi — qarzni faqat
 *    `mijoz_harakat` o'zgartiradi (2.2-invariant). Shuning uchun bu
 *    yerdagi amallar kassa kuniga ham, kursga ham bog'lanmaydi.
 */

import type postgres from 'postgres';
import { telefonKanonik } from '@/lib/domain/telefon';
import { BiznesXato } from '@/lib/xato';
import { MULOQOT_TURLARI, type MuloqotTuri } from '@/lib/db/schema';

const bosmi = (x: string | null | undefined): x is null | undefined =>
  x === null || x === undefined || x.trim() === '';
const yoNull = (x: string | null | undefined): string | null => (bosmi(x) ? null : x.trim());

async function mijozBormi(tx: postgres.TransactionSql, mijozId: number): Promise<void> {
  const q = await tx<{ id: number }[]>`SELECT id FROM mijoz WHERE id = ${mijozId}`;
  if (q[0] === undefined) throw new BiznesXato('MIJOZ_TOPILMADI', String(mijozId));
}

// ─── Kontakt shaxslar ─────────────────────────────────────────────────────

export interface KontaktKirimi {
  readonly ism: string;
  readonly lavozim?: string | null;
  readonly telefon?: string | null;
  readonly izoh?: string | null;
}

export async function kontaktQosh(
  ulanish: postgres.Sql,
  mijozId: number,
  k: KontaktKirimi,
  xodimId: number,
): Promise<number> {
  if (bosmi(k.ism)) throw new BiznesXato('KONTAKT_ISMSIZ', 'Ismni kiriting');
  /** Telefon bot bilan bog'liq emas, lekin bir xil shaklda saqlansin — qidiruv uchun */
  const telefon = bosmi(k.telefon) ? null : telefonKanonik(k.telefon);

  return ulanish.begin(async (tx) => {
    await mijozBormi(tx, mijozId);
    const q = await tx<{ id: number }[]>`
      INSERT INTO mijoz_kontakt (mijoz_id, ism, lavozim, telefon, izoh, yaratdi_id)
      VALUES (${mijozId}, ${k.ism.trim()}, ${yoNull(k.lavozim)}, ${telefon},
              ${yoNull(k.izoh)}, ${xodimId})
      RETURNING id`;
    const id = q[0]?.id;
    if (id === undefined) throw new BiznesXato('KONTAKT_SAQLANMADI');
    return id;
  });
}

/** `DELETE` yo'q (§3) — nofaol qilinadi */
export async function kontaktOchir(
  ulanish: postgres.Sql,
  kontaktId: number,
  xodimId: number,
): Promise<void> {
  const q = await ulanish<{ id: number }[]>`
    UPDATE mijoz_kontakt
       SET faol = false, ochirildi = now(), ozgartirildi = now(), ozgartirdi_id = ${xodimId}
     WHERE id = ${kontaktId} AND faol = true
    RETURNING id`;
  if (q[0] === undefined) throw new BiznesXato('KONTAKT_TOPILMADI', String(kontaktId));
}

// ─── Muloqot va va'dalar ──────────────────────────────────────────────────

export interface MuloqotKirimi {
  readonly turi: MuloqotTuri;
  readonly matn: string;
  /** `YYYY-MM-DD` — faqat `VADA` da majburiy */
  readonly vadaSana?: string | null;
  /** MATN — pul `number` bo'lmaydi (§3) */
  readonly vadaSumma?: string | null;
  readonly vadaValyuta?: 'SOM' | 'USD' | null;
}

const SANA = /^\d{4}-\d{2}-\d{2}$/;
const PUL = /^\d{1,12}(\.\d{1,2})?$/;

export async function muloqotYoz(
  ulanish: postgres.Sql,
  mijozId: number,
  m: MuloqotKirimi,
  xodimId: number,
): Promise<number> {
  if (!(MULOQOT_TURLARI as readonly string[]).includes(m.turi)) {
    throw new BiznesXato('MULOQOT_TURI', m.turi);
  }
  if (bosmi(m.matn)) throw new BiznesXato('MULOQOT_BOSH', 'Nima gaplashilganini yozing');

  const vadami = m.turi === 'VADA';
  const sana = yoNull(m.vadaSana);
  if (vadami && (sana === null || !SANA.test(sana))) {
    throw new BiznesXato('VADA_SANASIZ', "Va'da sanasini kiriting");
  }
  const summa = yoNull(m.vadaSumma)?.replace(/\s/g, '') ?? null;
  if (summa !== null && (!PUL.test(summa) || /^0+(\.0+)?$/.test(summa))) {
    throw new BiznesXato('VADA_SUMMA', "Summa musbat son bo'lishi kerak");
  }

  return ulanish.begin(async (tx) => {
    await mijozBormi(tx, mijozId);
    const q = await tx<{ id: number }[]>`
      INSERT INTO mijoz_muloqot (mijoz_id, turi, matn, vada_sana, vada_summa, vada_valyuta,
                                 xodim_id)
      VALUES (${mijozId}, ${m.turi}, ${m.matn.trim()},
              ${vadami ? sana : null},
              ${vadami ? summa : null},
              ${vadami && summa !== null ? (m.vadaValyuta ?? 'SOM') : null},
              ${xodimId})
      RETURNING id`;
    const id = q[0]?.id;
    if (id === undefined) throw new BiznesXato('MULOQOT_SAQLANMADI');
    return id;
  });
}

/**
 * Va'da bajarildi (yoki bekor) — belgilanadi.
 *
 * ⚠️ To'lovni o'zi YOZMAYDI. Pul kelgan bo'lsa u kassadan «Qarzni
 *    to'lash» bilan kiritiladi — bu yerda faqat eslatma yopiladi.
 */
export async function vadaYop(
  ulanish: postgres.Sql,
  muloqotId: number,
): Promise<void> {
  const q = await ulanish<{ id: number }[]>`
    UPDATE mijoz_muloqot SET bajarildi = true, bajarildi_sana = now()
     WHERE id = ${muloqotId} AND turi = 'VADA' AND NOT bajarildi
    RETURNING id`;
  if (q[0] === undefined) throw new BiznesXato('VADA_TOPILMADI', String(muloqotId));
}
