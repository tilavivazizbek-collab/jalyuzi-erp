/**
 * app/(panel)/ombor/malumot.ts — TZ 7.3 · 7.5 · 7.11 · Q-05 · Q-25
 *
 * Ombor so'rovlari.
 *
 * Q-05 — qoldiq HAR DOIM `eni × bo'yi` metrda saqlanadi. Kv.m bu yerda
 * hisoblanadi va faqat KO'RSATISH uchun ishlatiladi: sanashda, chegarada
 * va xaridda ishlatilmaydi.
 */

import { ulanishOl } from '@/lib/db';

export interface MaterialQoldigi {
  readonly materialId: number;
  readonly nom: string;
  readonly hisobTuri: string;
  readonly sarflashBirligi: string;
  /** TZ 7.3 — «jami» */
  readonly jamiKvM: number;
  /** TZ 7.3 — «bo'sh» */
  readonly boshKvM: number;
  /** TZ 7.3 — «band» */
  readonly bandKvM: number;
  readonly bolakSoni: number;
  /** DONA va CHIZIQLI uchun */
  readonly miqdor: number;
  /** Q-10 — kam qoldiq chegarasi, metrda */
  readonly kamQoldiqChegaraM: number | null;
}

interface QoldiqQatori {
  readonly material_id: number;
  readonly nom: string;
  readonly hisob_turi: string;
  readonly sarflash_birligi: string;
  readonly jami_kv_m: string | null;
  readonly bosh_kv_m: string | null;
  readonly band_kv_m: string | null;
  readonly bolak_soni: number;
  readonly miqdor: string | null;
  readonly kam_qoldiq_chegara_m: string | null;
}

/**
 * Filial qoldig'i — Q-25 bo'yicha har filialda o'z ombori.
 *
 * `ISHLATILDI`, `BRAK`, `CHIQINDI` holatidagi bo'laklar qoldiqqa
 * kirmaydi — ular tarixda qoladi (2.1-invariant), lekin omborda yo'q.
 */
export async function filialQoldigi(filialId: number): Promise<MaterialQoldigi[]> {
  const qatorlar = await ulanishOl()<QoldiqQatori[]>`
    SELECT m.id AS material_id, m.nom, m.hisob_turi, m.sarflash_birligi,
           m.kam_qoldiq_chegara_m,
           SUM(b.eni_m * b.boyi_m)                                      AS jami_kv_m,
           SUM(b.eni_m * b.boyi_m) FILTER (WHERE b.holat = 'BOSH')      AS bosh_kv_m,
           SUM(b.eni_m * b.boyi_m) FILTER (WHERE b.holat = 'BAND')      AS band_kv_m,
           COUNT(b.id)::int                                             AS bolak_soni,
           SUM(b.miqdor)                                                AS miqdor
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    WHERE b.filial_id = ${filialId}
      AND b.faol = true
      AND b.holat IN ('BOSH', 'BAND', 'YOLDA')
    GROUP BY m.id
    ORDER BY m.nom`;

  return qatorlar.map((q) => ({
    materialId: q.material_id,
    nom: q.nom,
    hisobTuri: q.hisob_turi,
    sarflashBirligi: q.sarflash_birligi,
    jamiKvM: Number(q.jami_kv_m ?? 0),
    boshKvM: Number(q.bosh_kv_m ?? 0),
    bandKvM: Number(q.band_kv_m ?? 0),
    bolakSoni: q.bolak_soni,
    miqdor: Number(q.miqdor ?? 0),
    kamQoldiqChegaraM:
      q.kam_qoldiq_chegara_m === null ? null : Number(q.kam_qoldiq_chegara_m),
  }));
}

// ─── 7.11 · Material kartochkasi ──────────────────────────────────────────

export interface BolakQatori {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly eniM: number | null;
  readonly boyiM: number | null;
  readonly miqdor: number | null;
  readonly holat: string;
  readonly tannarx: string;
  readonly kirimRaqam: string | null;
}

export async function materialBolaklari(
  materialId: number,
  filialId: number,
): Promise<BolakQatori[]> {
  const qatorlar = await ulanishOl()<
    {
      id: number;
      kod: string;
      turi: string;
      eni_m: string | null;
      boyi_m: string | null;
      miqdor: string | null;
      holat: string;
      tannarx_birlik_snapshot: string;
      kirim_raqam: string | null;
    }[]
  >`
    SELECT b.id, b.kod, b.turi, b.eni_m, b.boyi_m, b.miqdor, b.holat,
           b.tannarx_birlik_snapshot, k.raqam AS kirim_raqam
    FROM bolak b
    LEFT JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    LEFT JOIN kirim k ON k.id = kq.kirim_id
    WHERE b.material_id = ${materialId} AND b.filial_id = ${filialId} AND b.faol = true
    ORDER BY
      CASE b.holat WHEN 'BOSH' THEN 0 WHEN 'BAND' THEN 1 ELSE 2 END,
      b.eni_m DESC NULLS LAST, b.id`;

  return qatorlar.map((q) => ({
    id: q.id,
    kod: q.kod,
    turi: q.turi,
    eniM: q.eni_m === null ? null : Number(q.eni_m),
    boyiM: q.boyi_m === null ? null : Number(q.boyi_m),
    miqdor: q.miqdor === null ? null : Number(q.miqdor),
    holat: q.holat,
    tannarx: q.tannarx_birlik_snapshot,
    kirimRaqam: q.kirim_raqam,
  }));
}

export interface HarakatQatori {
  readonly id: number;
  readonly sana: Date;
  readonly turi: string;
  readonly bolakKod: string;
  readonly miqdorKvM: number | null;
  readonly miqdorSm: number | null;
  readonly miqdorDona: number | null;
  readonly tannarxSumma: string;
  readonly izoh: string | null;
  readonly xodimIsmi: string;
}

/**
 * TZ 7.11 — harakatlar tarixi.
 *
 * «Qoldiq alohida saqlanmaydi — shu jadvalning yig'indisi» (2.2-invariant).
 */
export async function materialHarakatlari(
  materialId: number,
  filialId: number,
  chegara = 100,
): Promise<HarakatQatori[]> {
  const qatorlar = await ulanishOl()<
    {
      id: number;
      sana: Date;
      turi: string;
      bolak_kod: string;
      miqdor_kv_m: string | null;
      miqdor_sm: string | null;
      miqdor_dona: number | null;
      tannarx_summa: string;
      izoh: string | null;
      xodim_ismi: string;
    }[]
  >`
    SELECT oh.id, oh.sana, oh.turi, b.kod AS bolak_kod,
           oh.miqdor_kv_m, oh.miqdor_sm, oh.miqdor_dona,
           oh.tannarx_summa, oh.izoh, x.ism AS xodim_ismi
    FROM ombor_harakat oh
    JOIN bolak b ON b.id = oh.bolak_id
    JOIN xodim x ON x.id = oh.xodim_id
    WHERE b.material_id = ${materialId} AND oh.filial_id = ${filialId}
    ORDER BY oh.sana DESC, oh.id DESC
    LIMIT ${chegara}`;

  return qatorlar.map((q) => ({
    id: q.id,
    sana: q.sana,
    turi: q.turi,
    bolakKod: q.bolak_kod,
    miqdorKvM: q.miqdor_kv_m === null ? null : Number(q.miqdor_kv_m),
    miqdorSm: q.miqdor_sm === null ? null : Number(q.miqdor_sm),
    miqdorDona: q.miqdor_dona,
    tannarxSumma: q.tannarx_summa,
    izoh: q.izoh,
    xodimIsmi: q.xodim_ismi,
  }));
}

export async function materialSarlavhasi(
  materialId: number,
): Promise<{ nom: string; hisobTuri: string; sarflashBirligi: string } | null> {
  const q = await ulanishOl()<
    { nom: string; hisob_turi: string; sarflash_birligi: string }[]
  >`SELECT nom, hisob_turi, sarflash_birligi FROM material WHERE id = ${materialId}`;

  const m = q[0];
  return m === undefined
    ? null
    : { nom: m.nom, hisobTuri: m.hisob_turi, sarflashBirligi: m.sarflash_birligi };
}
