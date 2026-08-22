import 'server-only';

/**
 * TZ 20.7 — ko'chirish ekranlari uchun o'qish.
 *
 * ⚠️ Q-25 — filial faqat O'ZI qatnashgan hujjatlarni ko'radi.
 */

import { ulanishOl } from '@/lib/db';

export interface KochirishQatoriKorinishi {
  readonly id: number;
  readonly raqam: string;
  readonly sana: Date;
  readonly kimdanFilialId: number;
  readonly kimdanNom: string;
  readonly kimgaFilialId: number;
  readonly kimgaNom: string;
  readonly holat: string;
  readonly qarzSumma: string | null;
  readonly qarzQolda: boolean;
  readonly bolakSoni: number;
}

export async function kochirishlar(
  filialId: number,
): Promise<readonly KochirishQatoriKorinishi[]> {
  const sql = ulanishOl();

  const q = await sql<
    {
      id: number;
      raqam: string;
      sana: Date;
      kimdan_filial_id: number;
      kimdan_nom: string;
      kimga_filial_id: number;
      kimga_nom: string;
      holat: string;
      qarz_summa: string | null;
      qarz_qolda: boolean;
      bolak_soni: number;
    }[]
  >`
    SELECT k.id, k.raqam, k.sana, k.kimdan_filial_id, fd.nom AS kimdan_nom,
           k.kimga_filial_id, fg.nom AS kimga_nom, k.holat,
           k.qarz_summa, k.qarz_qolda,
           (SELECT COUNT(*)::int FROM kochirish_qator kq
            WHERE kq.kochirish_id = k.id) AS bolak_soni
    FROM kochirish k
    JOIN filial fd ON fd.id = k.kimdan_filial_id
    JOIN filial fg ON fg.id = k.kimga_filial_id
    WHERE k.kimdan_filial_id = ${filialId} OR k.kimga_filial_id = ${filialId}
    ORDER BY k.sana DESC, k.id DESC
    LIMIT 100`;

  return q.map((r) => ({
    id: r.id,
    raqam: r.raqam,
    sana: r.sana,
    kimdanFilialId: r.kimdan_filial_id,
    kimdanNom: r.kimdan_nom,
    kimgaFilialId: r.kimga_filial_id,
    kimgaNom: r.kimga_nom,
    holat: r.holat,
    qarzSumma: r.qarz_summa,
    qarzQolda: r.qarz_qolda,
    bolakSoni: r.bolak_soni,
  }));
}

export interface KochirishBolagi {
  readonly bolakId: number;
  readonly kod: string;
  readonly materialNomi: string;
  readonly turi: string;
  readonly eniM: string | null;
  readonly boyiM: string | null;
  readonly miqdor: string | null;
  readonly tannarxSumma: string;
  readonly haqiqiyEniM: string | null;
  readonly haqiqiyBoyiM: string | null;
  readonly olchovIzoh: string | null;
}

export interface KochirishKorinishi {
  readonly id: number;
  readonly raqam: string;
  readonly sana: Date;
  readonly kimdanFilialId: number;
  readonly kimdanNom: string;
  readonly kimgaFilialId: number;
  readonly kimgaNom: string;
  readonly holat: string;
  readonly qarzSumma: string | null;
  readonly qarzQolda: boolean;
  readonly qarzSabab: string | null;
  readonly bekorSabab: string | null;
  readonly izoh: string | null;
  readonly qatorlar: readonly KochirishBolagi[];
}

export async function kochirishOl(id: number): Promise<KochirishKorinishi | null> {
  const sql = ulanishOl();

  const q = await sql<
    {
      id: number;
      raqam: string;
      sana: Date;
      kimdan_filial_id: number;
      kimdan_nom: string;
      kimga_filial_id: number;
      kimga_nom: string;
      holat: string;
      qarz_summa: string | null;
      qarz_qolda: boolean;
      qarz_sabab: string | null;
      bekor_sabab: string | null;
      izoh: string | null;
    }[]
  >`
    SELECT k.id, k.raqam, k.sana, k.kimdan_filial_id, fd.nom AS kimdan_nom,
           k.kimga_filial_id, fg.nom AS kimga_nom, k.holat, k.qarz_summa,
           k.qarz_qolda, k.qarz_sabab, k.bekor_sabab, k.izoh
    FROM kochirish k
    JOIN filial fd ON fd.id = k.kimdan_filial_id
    JOIN filial fg ON fg.id = k.kimga_filial_id
    WHERE k.id = ${id}`;

  const h = q[0];
  if (h === undefined) return null;

  const qatorlar = await sql<
    {
      bolak_id: number;
      kod: string;
      material_nomi: string;
      turi: string;
      eni_m_snapshot: string | null;
      boyi_m_snapshot: string | null;
      miqdor_snapshot: string | null;
      tannarx_summa_snapshot: string;
      haqiqiy_eni_m: string | null;
      haqiqiy_boyi_m: string | null;
      olchov_izoh: string | null;
    }[]
  >`
    SELECT kq.bolak_id, b.kod, m.nom AS material_nomi, b.turi,
           kq.eni_m_snapshot, kq.boyi_m_snapshot, kq.miqdor_snapshot,
           kq.tannarx_summa_snapshot, kq.haqiqiy_eni_m, kq.haqiqiy_boyi_m,
           kq.olchov_izoh
    FROM kochirish_qator kq
    JOIN bolak b ON b.id = kq.bolak_id
    JOIN material m ON m.id = b.material_id
    WHERE kq.kochirish_id = ${id}
    ORDER BY kq.id`;

  return {
    id: h.id,
    raqam: h.raqam,
    sana: h.sana,
    kimdanFilialId: h.kimdan_filial_id,
    kimdanNom: h.kimdan_nom,
    kimgaFilialId: h.kimga_filial_id,
    kimgaNom: h.kimga_nom,
    holat: h.holat,
    qarzSumma: h.qarz_summa,
    qarzQolda: h.qarz_qolda,
    qarzSabab: h.qarz_sabab,
    bekorSabab: h.bekor_sabab,
    izoh: h.izoh,
    qatorlar: qatorlar.map((r) => ({
      bolakId: r.bolak_id,
      kod: r.kod,
      materialNomi: r.material_nomi,
      turi: r.turi,
      eniM: r.eni_m_snapshot,
      boyiM: r.boyi_m_snapshot,
      miqdor: r.miqdor_snapshot,
      tannarxSumma: r.tannarx_summa_snapshot,
      haqiqiyEniM: r.haqiqiy_eni_m,
      haqiqiyBoyiM: r.haqiqiy_boyi_m,
      olchovIzoh: r.olchov_izoh,
    })),
  };
}

export interface TanlanadiganBolak {
  readonly id: number;
  readonly kod: string;
  readonly materialNomi: string;
  readonly turi: string;
  readonly olcham: string;
  readonly tannarxSumma: string;
}

/** 20.7.1 — jo'natishda tanlanadigan bo'laklar: faqat BOSH va o'z filialida. */
export async function tanlanadiganBolaklar(
  filialId: number,
): Promise<readonly TanlanadiganBolak[]> {
  const sql = ulanishOl();

  const q = await sql<
    {
      id: number;
      kod: string;
      material_nomi: string;
      turi: string;
      eni_m: string | null;
      boyi_m: string | null;
      miqdor: string | null;
      sarflash_birligi: string;
      tannarx_summa: string;
    }[]
  >`
    SELECT b.id, b.kod, m.nom AS material_nomi, b.turi, b.eni_m, b.boyi_m,
           b.miqdor, m.sarflash_birligi,
           (CASE
              WHEN b.turi = 'DONA' THEN COALESCE(b.miqdor, 0)
              ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0)
            END * b.tannarx_birlik_snapshot)::numeric(14,2)::text AS tannarx_summa
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    WHERE b.filial_id = ${filialId} AND b.faol = true AND b.holat = 'BOSH'
    ORDER BY m.nom, b.kod
    LIMIT 300`;

  return q.map((r) => ({
    id: r.id,
    kod: r.kod,
    materialNomi: r.material_nomi,
    turi: r.turi,
    olcham:
      r.turi === 'DONA'
        ? `${r.miqdor ?? '0'} ${r.sarflash_birligi === 'SM' ? 'sm' : 'dona'}`
        : `${r.eni_m ?? '0'} × ${r.boyi_m ?? '0'} m`,
    tannarxSumma: r.tannarx_summa,
  }));
}

export interface FilialTanlovi {
  readonly id: number;
  readonly nom: string;
}

export async function boshqaFiliallar(
  filialId: number,
): Promise<readonly FilialTanlovi[]> {
  const sql = ulanishOl();
  const q = await sql<{ id: number; nom: string }[]>`
    SELECT id, nom FROM filial
    WHERE id <> ${filialId} AND faol = true
    ORDER BY nom`;
  return q.map((r): FilialTanlovi => ({ id: r.id, nom: r.nom }));
}
