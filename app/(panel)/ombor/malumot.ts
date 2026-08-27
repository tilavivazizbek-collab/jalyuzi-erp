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
import { pulMatn, som } from '@/lib/domain/pul';
import { bolakQiymati } from '@/lib/domain/tannarx';
import type { MaterialTanlovi, YetkazibTanlovi } from './kirim/forma';

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
  /** TZ 20.7.4 — boshqa filialga jo'natilgan, hali qabul qilinmagan */
  readonly yoldaKvM: number;
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
  readonly yolda_kv_m: string | null;
  readonly bolak_soni: number;
  readonly miqdor: string | null;
  readonly kam_qoldiq_chegara_m: string | null;
}

/**
 * Filial qoldig'i — Q-25 bo'yicha har filialda o'z ombori.
 *
 * `ISHLATILDI`, `BRAK`, `CHIQINDI` holatidagi bo'laklar qoldiqqa
 * kirmaydi — ular tarixda qoladi (2.1-invariant), lekin omborda yo'q.
 *
 * ⚠️ TZ 20.7.4 — `YOLDA` bo'lak «beruvchi filial qoldig'idan
 *    CHIQARILGAN». Shuning uchun u «jami» ga KIRMAYDI va alohida
 *    ustunda ko'rsatiladi: mol jismonan yo'lda, lekin omborda yo'q.
 *    Qatorning o'zi qoladi — omborchi uni yo'qotib qo'ymasin.
 */
export async function filialQoldigi(filialId: number): Promise<MaterialQoldigi[]> {
  const qatorlar = await ulanishOl()<QoldiqQatori[]>`
    SELECT m.id AS material_id, m.nom, m.hisob_turi, m.sarflash_birligi,
           m.kam_qoldiq_chegara_m,
           SUM(b.eni_m * b.boyi_m) FILTER (WHERE b.holat <> 'YOLDA')    AS jami_kv_m,
           SUM(b.eni_m * b.boyi_m) FILTER (WHERE b.holat = 'BOSH')      AS bosh_kv_m,
           SUM(b.eni_m * b.boyi_m) FILTER (WHERE b.holat = 'BAND')      AS band_kv_m,
           SUM(b.eni_m * b.boyi_m) FILTER (WHERE b.holat = 'YOLDA')     AS yolda_kv_m,
           COUNT(b.id) FILTER (WHERE b.holat <> 'YOLDA')::int           AS bolak_soni,
           SUM(b.miqdor) FILTER (WHERE b.holat <> 'YOLDA')              AS miqdor
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
    yoldaKvM: Number(q.yolda_kv_m ?? 0),
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
  /** TZ 7.10 — BRAK yozuvi teskari yozuv bilan bekor qilinganmi */
  readonly bekorQilingan: boolean;
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
      bekor_qilingan: boolean;
    }[]
  >`
    SELECT oh.id, oh.sana, oh.turi, b.kod AS bolak_kod,
           oh.miqdor_kv_m, oh.miqdor_sm, oh.miqdor_dona,
           oh.tannarx_summa, oh.izoh, x.ism AS xodim_ismi,
           EXISTS (
             SELECT 1 FROM ombor_harakat t
             WHERE t.turi = 'STORNO' AND t.manba_turi = 'ombor_harakat'
               AND t.manba_id = oh.id
           ) AS bekor_qilingan
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
    bekorQilingan: q.bekor_qilingan,
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

// ─── 7.10 · Hisobdan chiqariladigan bo'lak ────────────────────────────────

export interface ChiqimBolagi {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly holat: string;
  readonly eniM: number | null;
  readonly boyiM: number | null;
  readonly miqdor: number | null;
  readonly materialId: number;
  readonly materialNomi: string;
  readonly sarflashBirligi: string;
  /** Sarflash birligi uchun tannarx (P-20) */
  readonly tannarx: string;
  readonly kirimId: number | null;
  readonly kirimRaqam: string | null;
  /** Ombordagi qiymati — chiqarilsa shuncha zarar bo'ladi (7.10) */
  readonly zarar: string;
}

/**
 * TZ 7.10 — chiqarishdan oldin omborchiga ko'rsatiladigan ma'lumot.
 *
 * Filial bo'yicha ham filtrlanadi: boshqa filial omboriga tegib
 * bo'lmaydi (Q-25).
 */
export async function chiqimBolagi(
  bolakId: number,
  filialId: number,
): Promise<ChiqimBolagi | null> {
  const q = await ulanishOl()<
    {
      id: number;
      kod: string;
      turi: string;
      holat: string;
      eni_m: string | null;
      boyi_m: string | null;
      miqdor: string | null;
      material_id: number;
      material_nomi: string;
      sarflash_birligi: string;
      tannarx_birlik_snapshot: string;
      kirim_id: number | null;
      kirim_raqam: string | null;
    }[]
  >`
    SELECT b.id, b.kod, b.turi, b.holat, b.eni_m, b.boyi_m, b.miqdor,
           b.material_id, m.nom AS material_nomi, m.sarflash_birligi,
           b.tannarx_birlik_snapshot,
           k.id AS kirim_id, k.raqam AS kirim_raqam
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    LEFT JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    LEFT JOIN kirim k ON k.id = kq.kirim_id
    WHERE b.id = ${bolakId} AND b.filial_id = ${filialId} AND b.faol = true`;

  const b = q[0];
  if (b === undefined) return null;

  return {
    id: b.id,
    kod: b.kod,
    turi: b.turi,
    holat: b.holat,
    eniM: b.eni_m === null ? null : Number(b.eni_m),
    boyiM: b.boyi_m === null ? null : Number(b.boyi_m),
    miqdor: b.miqdor === null ? null : Number(b.miqdor),
    materialId: b.material_id,
    materialNomi: b.material_nomi,
    sarflashBirligi: b.sarflash_birligi,
    tannarx: b.tannarx_birlik_snapshot,
    kirimId: b.kirim_id,
    kirimRaqam: b.kirim_raqam,
    // §2.2 — zarar formulasi SQL da takrorlanmaydi, domainda bir joyda
    zarar: pulMatn(
      bolakQiymati({
        turi: b.turi,
        eniM: b.eni_m,
        boyiM: b.boyi_m,
        miqdor: b.miqdor,
        tannarxBirlik: som(b.tannarx_birlik_snapshot),
      }),
    ),
  };
}

// ─── 7.12 · Kirim hujjatlari ──────────────────────────────────────────────

export interface KirimQatoriRoyxat {
  readonly id: number;
  readonly raqam: string;
  readonly sana: string;
  readonly yetkazibNomi: string;
  readonly valyuta: string;
  readonly holat: string;
  readonly jamiSumma: string;
  readonly qatorSoni: number;
}

export async function kirimHujjatlari(
  filialId: number,
  chegara = 50,
): Promise<KirimQatoriRoyxat[]> {
  const qatorlar = await ulanishOl()<
    {
      id: number;
      raqam: string;
      sana: string;
      yetkazib_nomi: string;
      valyuta: string;
      holat: string;
      jami_summa: string | null;
      qator_soni: number;
    }[]
  >`
    SELECT k.id, k.raqam, k.sana::text AS sana, y.nom AS yetkazib_nomi,
           k.valyuta, k.holat,
           SUM(kq.miqdor_kirim * kq.narx_birlik)::text AS jami_summa,
           COUNT(kq.id)::int AS qator_soni
    FROM kirim k
    JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
    LEFT JOIN kirim_qator kq ON kq.kirim_id = k.id
    WHERE k.filial_id = ${filialId}
    GROUP BY k.id, y.nom
    ORDER BY k.sana DESC, k.id DESC
    LIMIT ${chegara}`;

  return qatorlar.map((q) => ({
    id: q.id,
    raqam: q.raqam,
    sana: q.sana,
    yetkazibNomi: q.yetkazib_nomi,
    valyuta: q.valyuta,
    holat: q.holat,
    jamiSumma: q.jami_summa ?? '0',
    qatorSoni: q.qator_soni,
  }));
}

export interface KirimTafsiloti {
  readonly id: number;
  readonly raqam: string;
  readonly sana: string;
  readonly yetkazibNomi: string;
  readonly valyuta: string;
  readonly holat: string;
  readonly stornoSabab: string | null;
  readonly transportSumma: string;
  readonly bojxonaSumma: string;
  readonly qatorlar: readonly {
    readonly id: number;
    readonly materialNomi: string;
    readonly miqdorKirim: number;
    readonly narxBirlik: string;
    readonly transportUlush: string;
    readonly tannarxBirlik: string;
    readonly defektMiqdor: number;
  }[];
  /** Kirimdan tushgan bo'laklardan hozir omborda turganlari (7.12 ogohi) */
  readonly omborda: number;
  readonly ishlatilgan: number;
}

export async function kirimTafsiloti(
  kirimId: number,
  filialId: number,
): Promise<KirimTafsiloti | null> {
  const sql = ulanishOl();

  const bosh = await sql<
    {
      id: number;
      raqam: string;
      sana: string;
      yetkazib_nomi: string;
      valyuta: string;
      holat: string;
      storno_sabab: string | null;
      transport_summa: string;
      bojxona_summa: string;
    }[]
  >`
    SELECT k.id, k.raqam, k.sana::text AS sana, y.nom AS yetkazib_nomi,
           k.valyuta, k.holat, k.storno_sabab, k.transport_summa, k.bojxona_summa
    FROM kirim k
    JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
    WHERE k.id = ${kirimId} AND k.filial_id = ${filialId}`;

  const h = bosh[0];
  if (h === undefined) return null;

  const qatorlar = await sql<
    {
      id: number;
      material_nomi: string;
      miqdor_kirim: string;
      narx_birlik: string;
      transport_ulush: string;
      tannarx_birlik: string;
      defekt_miqdor: string;
    }[]
  >`
    SELECT kq.id, m.nom AS material_nomi, kq.miqdor_kirim, kq.narx_birlik,
           kq.transport_ulush, kq.tannarx_birlik, kq.defekt_miqdor
    FROM kirim_qator kq
    JOIN material m ON m.id = kq.material_id
    WHERE kq.kirim_id = ${kirimId}
    ORDER BY kq.id`;

  const holatlar = await sql<{ omborda: number; ishlatilgan: number }[]>`
    SELECT COUNT(*) FILTER (WHERE b.holat IN ('BOSH', 'BAND'))::int AS omborda,
           COUNT(*) FILTER (WHERE b.holat NOT IN ('BOSH', 'BAND'))::int AS ishlatilgan
    FROM bolak b
    JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    WHERE kq.kirim_id = ${kirimId} AND b.faol = true`;

  return {
    id: h.id,
    raqam: h.raqam,
    sana: h.sana,
    yetkazibNomi: h.yetkazib_nomi,
    valyuta: h.valyuta,
    holat: h.holat,
    stornoSabab: h.storno_sabab,
    transportSumma: h.transport_summa,
    bojxonaSumma: h.bojxona_summa,
    qatorlar: qatorlar.map((q) => ({
      id: q.id,
      materialNomi: q.material_nomi,
      miqdorKirim: Number(q.miqdor_kirim),
      narxBirlik: q.narx_birlik,
      transportUlush: q.transport_ulush,
      tannarxBirlik: q.tannarx_birlik,
      defektMiqdor: Number(q.defekt_miqdor),
    })),
    omborda: holatlar[0]?.omborda ?? 0,
    ishlatilgan: holatlar[0]?.ishlatilgan ?? 0,
  };
}

/**
 * Q-25 — bekor qilinayotgan yozuv shu filialnikimi.
 *
 * ⚠️ Bu tekshiruvsiz 2-filial omborchisi `harakat_id` ni taxmin qilib
 *    1-filial yozuvini bekor qila olardi: ruxsat kodi bor, lekin
 *    boshqa filial ustida.
 */
export async function harakatFilialda(
  harakatId: number,
  filialId: number,
): Promise<{ materialId: number } | null> {
  const q = await ulanishOl()<{ material_id: number }[]>`
    SELECT b.material_id
    FROM ombor_harakat oh
    JOIN bolak b ON b.id = oh.bolak_id
    WHERE oh.id = ${harakatId} AND oh.filial_id = ${filialId}`;

  const r = q[0];
  return r === undefined ? null : { materialId: r.material_id };
}

// ─── 15.1 · Inventarizatsiya ──────────────────────────────────────────────

export interface VaraqaRoyxati {
  readonly id: number;
  readonly sana: string;
  readonly holat: string;
  readonly farqSumma: string | null;
  readonly qatorSoni: number;
  readonly farqli: number;
  readonly kim: string;
}

export async function varaqalar(
  filialId: number,
  chegara = 50,
): Promise<VaraqaRoyxati[]> {
  const q = await ulanishOl()<
    {
      id: number;
      sana: string;
      holat: string;
      farq_summa: string | null;
      qator_soni: number;
      farqli: number;
      kim: string;
    }[]
  >`
    SELECT i.id, i.sana::text AS sana, i.holat, i.farq_summa,
           COUNT(iq.id)::int AS qator_soni,
           COUNT(iq.id) FILTER (WHERE iq.farq_kv_m IS NOT NULL
                                  AND iq.farq_kv_m <> 0)::int AS farqli,
           x.ism AS kim
    FROM inventarizatsiya i
    JOIN xodim x ON x.id = i.yaratdi_id
    LEFT JOIN inventarizatsiya_qator iq ON iq.inventarizatsiya_id = i.id
    WHERE i.filial_id = ${filialId}
    GROUP BY i.id, x.ism
    ORDER BY i.sana DESC, i.id DESC
    LIMIT ${chegara}`;

  return q.map((r) => ({
    id: r.id,
    sana: r.sana,
    holat: r.holat,
    farqSumma: r.farq_summa,
    qatorSoni: r.qator_soni,
    farqli: r.farqli,
    kim: r.kim,
  }));
}

export interface VaraqaSatri {
  readonly qatorId: number;
  readonly bolakId: number;
  readonly kod: string;
  readonly turi: string;
  readonly materialNomi: string;
  readonly sarflashBirligi: string;
  readonly tizimdaEniM: number | null;
  readonly tizimdaBoyiM: number | null;
  readonly tizimdaMiqdor: number | null;
  readonly haqiqatdaEniM: number | null;
  readonly haqiqatdaBoyiM: number | null;
  readonly haqiqatdaMiqdor: number | null;
  readonly band: boolean;
  readonly yolda: boolean;
  readonly farqKvM: number | null;
  readonly farqSumma: string | null;
  readonly sabab: string | null;
  readonly izoh: string | null;
}

export interface VaraqaTafsiloti {
  readonly id: number;
  readonly sana: string;
  readonly holat: string;
  readonly farqSumma: string | null;
  readonly izoh: string | null;
  readonly kim: string;
  readonly satrlar: readonly VaraqaSatri[];
}

export async function varaqaTafsiloti(
  varaqaId: number,
  filialId: number,
): Promise<VaraqaTafsiloti | null> {
  const sql = ulanishOl();

  const bosh = await sql<
    {
      id: number;
      sana: string;
      holat: string;
      farq_summa: string | null;
      izoh: string | null;
      kim: string;
    }[]
  >`
    SELECT i.id, i.sana::text AS sana, i.holat, i.farq_summa, i.izoh, x.ism AS kim
    FROM inventarizatsiya i
    JOIN xodim x ON x.id = i.yaratdi_id
    WHERE i.id = ${varaqaId} AND i.filial_id = ${filialId}`;

  const h = bosh[0];
  if (h === undefined) return null;

  const satrlar = await sql<
    {
      id: number;
      bolak_id: number;
      kod: string;
      turi: string;
      material_nomi: string;
      sarflash_birligi: string;
      tizimda_eni_m: string | null;
      tizimda_boyi_m: string | null;
      tizimda_miqdor: string | null;
      haqiqatda_eni_m: string | null;
      haqiqatda_boyi_m: string | null;
      haqiqatda_miqdor: string | null;
      band: boolean;
      yolda: boolean;
      farq_kv_m: string | null;
      farq_summa: string | null;
      sabab: string | null;
      izoh: string | null;
    }[]
  >`
    SELECT iq.id, iq.bolak_id, b.kod, b.turi, m.nom AS material_nomi,
           m.sarflash_birligi,
           iq.tizimda_eni_m, iq.tizimda_boyi_m, iq.tizimda_miqdor,
           iq.haqiqatda_eni_m, iq.haqiqatda_boyi_m, iq.haqiqatda_miqdor,
           iq.band, iq.yolda, iq.farq_kv_m, iq.farq_summa, iq.sabab, iq.izoh
    FROM inventarizatsiya_qator iq
    JOIN bolak b ON b.id = iq.bolak_id
    JOIN material m ON m.id = b.material_id
    WHERE iq.inventarizatsiya_id = ${varaqaId}
    ORDER BY m.nom, b.kod`;

  const son = (x: string | null): number | null => (x === null ? null : Number(x));

  return {
    id: h.id,
    sana: h.sana,
    holat: h.holat,
    farqSumma: h.farq_summa,
    izoh: h.izoh,
    kim: h.kim,
    satrlar: satrlar.map((s) => ({
      qatorId: s.id,
      bolakId: s.bolak_id,
      kod: s.kod,
      turi: s.turi,
      materialNomi: s.material_nomi,
      sarflashBirligi: s.sarflash_birligi,
      tizimdaEniM: son(s.tizimda_eni_m),
      tizimdaBoyiM: son(s.tizimda_boyi_m),
      tizimdaMiqdor: son(s.tizimda_miqdor),
      haqiqatdaEniM: son(s.haqiqatda_eni_m),
      haqiqatdaBoyiM: son(s.haqiqatda_boyi_m),
      haqiqatdaMiqdor: son(s.haqiqatda_miqdor),
      band: s.band,
      yolda: s.yolda,
      farqKvM: son(s.farq_kv_m),
      farqSumma: s.farq_summa,
      sabab: s.sabab,
      izoh: s.izoh,
    })),
  };
}

/** Varaqa ochish formasida tanlanadigan materiallar. */
export async function omborMateriallari(
  filialId: number,
): Promise<{ id: number; nom: string; bolakSoni: number }[]> {
  const q = await ulanishOl()<
    { id: number; nom: string; bolak_soni: number }[]
  >`
    SELECT m.id, m.nom, COUNT(b.id)::int AS bolak_soni
    FROM material m
    JOIN bolak b ON b.material_id = m.id
    WHERE b.filial_id = ${filialId} AND b.faol = true
      AND b.holat IN ('BOSH', 'BAND', 'YOLDA')
    GROUP BY m.id
    ORDER BY m.nom`;

  return q.map((r) => ({ id: r.id, nom: r.nom, bolakSoni: r.bolak_soni }));
}

/** TZ 7.10 — material uchun boshlang'ich qoldiq allaqachon kiritilganmi. */
export async function boshlangichBormi(
  materialId: number,
  filialId: number,
): Promise<boolean> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM ombor_harakat oh
    JOIN bolak b ON b.id = oh.bolak_id
    WHERE oh.turi = 'BOSHLANGICH' AND oh.filial_id = ${filialId}
      AND b.material_id = ${materialId}`;
  return (q[0]?.n ?? 0) > 0;
}

/**
 * TZ 15.1 — «Oxirgi inventarizatsiya sanasi material kartochkasida
 * ko'rinadi. Uzoq sanalmagan materiallar alohida filtrda chiqadi.»
 */
export async function oxirgiSanoq(
  materialId: number,
  filialId: number,
): Promise<{ sana: string; kim: string } | null> {
  const q = await ulanishOl()<{ sana: string; kim: string }[]>`
    SELECT i.sana::text AS sana, x.ism AS kim
    FROM inventarizatsiya i
    JOIN xodim x ON x.id = i.yaratdi_id
    JOIN inventarizatsiya_qator iq ON iq.inventarizatsiya_id = i.id
    JOIN bolak b ON b.id = iq.bolak_id
    WHERE i.filial_id = ${filialId} AND i.holat = 'YAKUNLANDI'
      AND b.material_id = ${materialId}
    ORDER BY i.sana DESC, i.id DESC
    LIMIT 1`;

  const r = q[0];
  return r === undefined ? null : { sana: r.sana, kim: r.kim };
}

// ─── 20.6.2 · Barcha filiallar kesimi ─────────────────────────────────────

export interface FilialQoldigi {
  readonly filialId: number;
  readonly filialNomi: string;
  readonly materiallar: readonly MaterialQoldigi[];
}

/**
 * TZ 20.6.2 — «Bosh filial admini BARCHA filiallarni bir jadvalda
 * ko'ra oladi.»
 *
 * ⚠️ Ruxsat qamrovi (`BARCHA`) sahifada tekshiriladi — bu funksiya
 *    faqat ma'lumot beradi (§9.4 naqshi).
 */
export async function barchaFilialQoldigi(): Promise<readonly FilialQoldigi[]> {
  const filiallar = await ulanishOl()<{ id: number; nom: string }[]>`
    SELECT id, nom FROM filial WHERE faol = true ORDER BY bosh DESC, nom`;

  const natija: FilialQoldigi[] = [];
  for (const f of filiallar) {
    natija.push({
      filialId: f.id,
      filialNomi: f.nom,
      materiallar: await filialQoldigi(f.id),
    });
  }
  return natija;
}

/** Sarlavhada `#1` emas, filial NOMI ko'rinsin. */
export async function filialNomi(filialId: number): Promise<string> {
  const q = await ulanishOl()<{ nom: string }[]>`
    SELECT nom FROM filial WHERE id = ${filialId}`;
  return q[0]?.nom ?? `#${String(filialId)}`;
}

// ─── TZ 7.9 · Kirim hujjati formasi ───────────────────────────────────────

/**
 * ⚠️ Bu ikki so'rov ilgari `kirim/yangi/page.tsx` ichida turardi.
 *    Shu sababli `ekran-sorovlari.test.ts` ularni ko'rmasdi — ustun
 *    nomidagi xato faqat ekranni ochgan odamga bilinardi (T-01).
 */
export async function kirimMateriallari(): Promise<MaterialTanlovi[]> {
  const qatorlar = await ulanishOl()<
    {
      id: number;
      nom: string;
      hisob_turi: string;
      kirim_birligi: string;
      standart_rulon_eni_m: string | null;
      odatdagi_rulon_boyi_m: string | null;
      kutilayotgan_kelish_narx: string | null;
      kutilayotgan_kelish_valyuta: string;
    }[]
  >`SELECT id, nom, hisob_turi, kirim_birligi,
           standart_rulon_eni_m::text, odatdagi_rulon_boyi_m::text,
           kutilayotgan_kelish_narx::text, kutilayotgan_kelish_valyuta
    FROM material WHERE faol = true ORDER BY nom`;

  return qatorlar.map((x) => ({
    id: x.id,
    nom: x.nom,
    hisobTuri: x.hisob_turi,
    kirimBirligi: x.kirim_birligi,
    /**
     * Kirim qatorlari shu o'lchamlar bilan ochiladi (Q-14).
     *
     * ⚠️ HISOBGA TEGMAYDI: qoldiq baribir omborchi kiritgan haqiqiy
     *    o'lchamdan hisoblanadi. Bu faqat terishni qisqartiradi.
     */
    odatdagiEniM: x.standart_rulon_eni_m,
    odatdagiBoyiM: x.odatdagi_rulon_boyi_m,
    kutilayotganNarx: x.kutilayotgan_kelish_narx,
    kutilayotganValyuta: x.kutilayotgan_kelish_valyuta,
  }));
}

export async function kirimYetkazuvchilari(): Promise<YetkazibTanlovi[]> {
  const qatorlar = await ulanishOl()<
    { id: number; nom: string; tolov_muddati_kun: number | null; valyuta: string }[]
  >`SELECT id, nom, tolov_muddati_kun, valyuta FROM yetkazib_beruvchi
    WHERE faol = true ORDER BY nom`;

  return qatorlar.map((x) => ({
    id: x.id,
    nom: x.nom,
    tolovMuddatiKun: x.tolov_muddati_kun,
    valyuta: x.valyuta,
  }));
}
