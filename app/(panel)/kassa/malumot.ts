/**
 * app/(panel)/kassa/malumot.ts — TZ 12.2 · 12.14 · 12.16 · 12.18 · Q-25
 *
 * ⚠️ TZ 12.14 — «Sotuvchi FAQAT O'Z KASSASINI ko'radi. Sotuvchi boshqa
 *    sotuvchining kassasini KO'RMAYDI.»
 *
 *    Shuning uchun bu yerdagi har so'rov `barchaniKoradi` bayrog'ini
 *    oladi va u yolg'on bo'lsa `xodim_id` bo'yicha qattiq filtrlaydi.
 *    Bayroq `ruxsatBormi(f, 'kassa.barcha.kor')` dan keladi.
 *
 * ⚠️ 2.2-invariant — qoldiq HECH QAYERDA saqlanmaydi, `SUM()` bilan
 *    chiqadi.
 */

import { ulanishOl } from '@/lib/db';

export interface KassaQoldigi {
  readonly id: number;
  readonly nom: string;
  readonly turi: string;
  readonly valyuta: string;
  readonly xodimId: number | null;
  readonly xodimIsmi: string | null;
  readonly qoldiq: string;
}

/**
 * TZ 12.16 — «Qator 1: hozir kassada nima bor.»
 */
export async function kassaQoldiqlari(
  filialId: number,
  xodimId: number,
  barchaniKoradi: boolean,
): Promise<KassaQoldigi[]> {
  const sql = ulanishOl();

  const q = await sql<
    {
      id: number;
      nom: string;
      turi: string;
      valyuta: string;
      xodim_id: number | null;
      xodim_ismi: string | null;
      qoldiq: string | null;
    }[]
  >`
    SELECT k.id, k.nom, k.turi, k.valyuta, k.xodim_id, x.ism AS xodim_ismi,
           COALESCE(SUM(y.summa), 0)::text AS qoldiq
    FROM kassa k
    LEFT JOIN xodim x ON x.id = k.xodim_id
    LEFT JOIN kassa_yozuv y ON y.kassa_id = k.id
    WHERE k.filial_id = ${filialId} AND k.faol = true
      ${barchaniKoradi ? sql`` : sql`AND k.xodim_id = ${xodimId}`}
    GROUP BY k.id, x.ism
    ORDER BY k.xodim_id NULLS FIRST, k.turi, k.valyuta`;

  return q.map((r) => ({
    id: r.id,
    nom: r.nom,
    turi: r.turi,
    valyuta: r.valyuta,
    xodimId: r.xodim_id,
    xodimIsmi: r.xodim_ismi,
    qoldiq: r.qoldiq ?? '0',
  }));
}

export interface KassaSatri {
  readonly id: number;
  readonly sana: Date;
  readonly kassaNomi: string;
  readonly kod: string;
  readonly summa: string;
  readonly valyuta: string;
  readonly manbaTuri: string;
  readonly manbaId: number;
  readonly izoh: string | null;
  readonly xodimIsmi: string;
  readonly stornoQilinganmi: boolean;
  readonly stornoMi: boolean;
}

/**
 * TZ 12.18 — kassa kitobi.
 *
 * ⚠️ Storno qilingan yozuv RO'YXATDA QOLADI (§6.5) — u belgi bilan
 *    ko'rsatiladi, yashirilmaydi.
 */
export async function kassaKitobi(
  filialId: number,
  xodimId: number,
  barchaniKoradi: boolean,
  chegara = 200,
): Promise<KassaSatri[]> {
  const sql = ulanishOl();

  const q = await sql<
    {
      id: number;
      sana: Date;
      kassa_nomi: string;
      kod: string;
      summa: string;
      valyuta: string;
      manba_turi: string;
      manba_id: number;
      izoh: string | null;
      xodim_ismi: string;
      storno_id: number | null;
      storno_qilinganmi: boolean;
    }[]
  >`
    SELECT y.id, y.sana, k.nom AS kassa_nomi, y.kod, y.summa, y.valyuta,
           y.manba_turi, y.manba_id, y.izoh, x.ism AS xodim_ismi, y.storno_id,
           EXISTS (SELECT 1 FROM kassa_yozuv s WHERE s.storno_id = y.id)
             AS storno_qilinganmi
    FROM kassa_yozuv y
    JOIN kassa k ON k.id = y.kassa_id
    JOIN xodim x ON x.id = y.xodim_id
    WHERE k.filial_id = ${filialId}
      ${barchaniKoradi ? sql`` : sql`AND k.xodim_id = ${xodimId}`}
    ORDER BY y.sana DESC, y.id DESC
    LIMIT ${chegara}`;

  return q.map((r) => ({
    id: r.id,
    sana: r.sana,
    kassaNomi: r.kassa_nomi,
    kod: r.kod,
    summa: r.summa,
    valyuta: r.valyuta,
    manbaTuri: r.manba_turi,
    manbaId: r.manba_id,
    izoh: r.izoh,
    xodimIsmi: r.xodim_ismi,
    stornoQilinganmi: r.storno_qilinganmi,
    stornoMi: r.storno_id !== null,
  }));
}

// ─── 12.7 · Topshiriqlar ──────────────────────────────────────────────────

export interface TopshiriqQatori {
  readonly id: number;
  readonly kimdan: string;
  readonly kimga: string;
  readonly summa: string;
  readonly valyuta: string;
  readonly holat: string;
  readonly sana: Date;
  readonly izoh: string | null;
}

export async function ochiqTopshiriqlar(filialId: number): Promise<TopshiriqQatori[]> {
  const q = await ulanishOl()<
    {
      id: number;
      kimdan: string;
      kimga: string;
      summa: string;
      valyuta: string;
      holat: string;
      sana: Date;
      izoh: string | null;
    }[]
  >`
    SELECT t.id, kd.nom AS kimdan, kg.nom AS kimga, t.summa, t.valyuta,
           t.holat, t.yaratildi AS sana, t.izoh
    FROM topshiriq t
    JOIN kassa kd ON kd.id = t.kimdan_kassa_id
    JOIN kassa kg ON kg.id = t.kimga_kassa_id
    WHERE t.holat = 'JONATILDI' AND kg.filial_id = ${filialId}
    ORDER BY t.yaratildi`;

  return q;
}

// ─── 10.16 · Xodim kartochkasi ────────────────────────────────────────────

export interface XodimBalansQatori {
  readonly xodimId: number;
  readonly ism: string;
  readonly somBalans: string;
  readonly dollarBalans: string;
}

/**
 * TZ 10.4 · AUDIT Z-12 — balans = hisoblangan − olingan − ushlangan.
 *
 * ⚠️ Ishorani jadvaldagi `summa` olib yuradi, shuning uchun bu oddiy
 *    `SUM()`. So'm va dollar ALOHIDA (1.3-band).
 */
export async function xodimBalanslari(filialId: number): Promise<XodimBalansQatori[]> {
  const q = await ulanishOl()<
    { xodim_id: number; ism: string; som: string | null; dollar: string | null }[]
  >`
    SELECT x.id AS xodim_id, x.ism,
           SUM(h.summa) FILTER (WHERE h.valyuta = 'SOM')::text AS som,
           SUM(h.summa) FILTER (WHERE h.valyuta = 'USD')::text AS dollar
    FROM xodim x
    LEFT JOIN xodim_harakat h ON h.xodim_id = x.id
    WHERE x.filial_id = ${filialId} AND x.faol = true
    GROUP BY x.id
    HAVING COUNT(h.id) > 0
    ORDER BY x.ism`;

  return q.map((r) => ({
    xodimId: r.xodim_id,
    ism: r.ism,
    somBalans: r.som ?? '0',
    dollarBalans: r.dollar ?? '0',
  }));
}

// ─── 11.4.1 · Xarajat moddalari ───────────────────────────────────────────

export interface XarajatQatori {
  readonly modda: string;
  readonly summa: string;
  readonly pulChiqdi: string;
  readonly pulChiqmadi: string;
}

/**
 * TZ 12.1 — xarajat jurnalining modda kesimi.
 *
 * ⚠️ `kassa_yozuv_id IS NULL` — pul chiqmagan xarajat. Ikkalasi alohida
 *    ko'rsatiladi, chunki bu ikki xil narsa: foyda-zararga ikkalasi
 *    ham kiradi, kassa oqimiga esa faqat birinchisi (11.4.2).
 */
export async function xarajatModdalari(
  filialId: number,
  danSana: string,
  gaSana: string,
): Promise<XarajatQatori[]> {
  const q = await ulanishOl()<
    { modda: string; jami: string; pul_chiqdi: string | null; pul_chiqmadi: string | null }[]
  >`
    SELECT modda,
           SUM(summa)::text AS jami,
           SUM(summa) FILTER (WHERE kassa_yozuv_id IS NOT NULL)::text AS pul_chiqdi,
           SUM(summa) FILTER (WHERE kassa_yozuv_id IS NULL)::text AS pul_chiqmadi
    FROM xarajat
    WHERE filial_id = ${filialId} AND sana BETWEEN ${danSana} AND ${gaSana}
      AND valyuta = 'SOM'
    GROUP BY modda
    ORDER BY SUM(summa) DESC`;

  return q.map((r) => ({
    modda: r.modda,
    summa: r.jami,
    pulChiqdi: r.pul_chiqdi ?? '0',
    pulChiqmadi: r.pul_chiqmadi ?? '0',
  }));
}

// ─── 10.16 · Xodim kartochkasi ────────────────────────────────────────────

export interface XodimKartochkasi {
  readonly xodimId: number;
  readonly ism: string;
  readonly somBalans: string;
  readonly dollarBalans: string;
  /** TZ 10.16 — «jami ishlagan» va «jami olgan» alohida ko'rsatiladi */
  readonly jamiIshlagan: string;
  readonly jamiOlgan: string;
  readonly harakatlar: readonly {
    readonly id: number;
    readonly sana: Date;
    readonly turi: string;
    readonly summa: string;
    readonly valyuta: string;
    readonly izoh: string | null;
  }[];
}

export const XODIM_HARAKAT_NOMI: Record<string, string> = {
  HAQ: 'Hisoblangan haq',
  AVANS: 'Avans',
  TOLOV: "To'lov",
  USHLANMA: 'Ushlanma',
  JARIMA: 'Jarima',
  QOLDA_TUZATISH: "Qo'lda tuzatish",
  HAQ_BEKOR: 'Haq bekor qilindi',
  HISOBDAN_CHIQARISH: 'Hisobdan chiqarildi',
};

export async function xodimKartochkasi(
  xodimId: number,
  filialId: number,
): Promise<XodimKartochkasi | null> {
  const sql = ulanishOl();

  const x = await sql<{ id: number; ism: string }[]>`
    SELECT id, ism FROM xodim WHERE id = ${xodimId} AND filial_id = ${filialId}`;

  const xodim = x[0];
  if (xodim === undefined) return null;

  const b = await sql<
    {
      som: string | null;
      dollar: string | null;
      ishlagan: string | null;
      olgan: string | null;
    }[]
  >`
    SELECT SUM(summa) FILTER (WHERE valyuta = 'SOM')::text AS som,
           SUM(summa) FILTER (WHERE valyuta = 'USD')::text AS dollar,
           SUM(summa) FILTER (WHERE summa > 0 AND valyuta = 'SOM')::text AS ishlagan,
           ABS(SUM(summa) FILTER (WHERE summa < 0 AND valyuta = 'SOM'))::text AS olgan
    FROM xodim_harakat WHERE xodim_id = ${xodimId}`;

  const h = await sql<
    {
      id: number;
      sana: Date;
      turi: string;
      summa: string;
      valyuta: string;
      izoh: string | null;
    }[]
  >`
    SELECT id, sana, turi, summa, valyuta, izoh FROM xodim_harakat
    WHERE xodim_id = ${xodimId}
    ORDER BY sana DESC, id DESC LIMIT 50`;

  return {
    xodimId,
    ism: xodim.ism,
    somBalans: b[0]?.som ?? '0',
    dollarBalans: b[0]?.dollar ?? '0',
    jamiIshlagan: b[0]?.ishlagan ?? '0',
    jamiOlgan: b[0]?.olgan ?? '0',
    harakatlar: h,
  };
}

// ─── 12.7 · 22.5 · Topshirish uchun kassalar ──────────────────────────────

export interface TopshirishManbasi {
  readonly id: number;
  readonly nom: string;
  readonly valyuta: string;
  readonly qoldiq: string;
}

export interface TopshirishNishoni {
  readonly id: number;
  readonly nom: string;
  readonly valyuta: string;
  readonly filialId: number;
  readonly filialNomi: string;
  /** Q-29 — boshqa filial admini bo'lsa ogohlantirish chiqadi (22.5.2) */
  readonly ozFilialimi: boolean;
}

/** 12.7 — sotuvchi O'Z kassasidan topshiradi. */
export async function topshirishManbalari(
  xodimId: number,
): Promise<readonly TopshirishManbasi[]> {
  const sql = ulanishOl();
  const q = await sql<
    { id: number; nom: string; valyuta: string; qoldiq: string }[]
  >`
    SELECT k.id, k.nom, k.valyuta,
           COALESCE((SELECT SUM(summa) FROM kassa_yozuv y
                     WHERE y.kassa_id = k.id), 0)::text AS qoldiq
    FROM kassa k
    WHERE k.xodim_id = ${xodimId} AND k.faol = true
    ORDER BY k.valyuta, k.nom`;

  return q.map((r) => ({
    id: r.id,
    nom: r.nom,
    valyuta: r.valyuta,
    qoldiq: r.qoldiq,
  }));
}

/**
 * TZ 22.5 (Q-29) — «sotuvchi pulni ISTALGAN FILIAL adminiga topshirishi
 * mumkin». Shuning uchun ro'yxat barcha filiallarning admin kassasidan
 * yig'iladi, o'z filiali birinchi turadi.
 */
export async function topshirishNishonlari(
  filialId: number,
): Promise<readonly TopshirishNishoni[]> {
  const sql = ulanishOl();
  const q = await sql<
    {
      id: number;
      nom: string;
      valyuta: string;
      filial_id: number;
      filial_nomi: string;
    }[]
  >`
    SELECT k.id, k.nom, k.valyuta, k.filial_id, f.nom AS filial_nomi
    FROM kassa k
    JOIN filial f ON f.id = k.filial_id
    WHERE k.xodim_id IS NULL AND k.faol = true AND f.faol = true
    ORDER BY (k.filial_id = ${filialId}) DESC, f.nom, k.nom`;

  return q.map((r) => ({
    id: r.id,
    nom: r.nom,
    valyuta: r.valyuta,
    filialId: r.filial_id,
    filialNomi: r.filial_nomi,
    ozFilialimi: r.filial_id === filialId,
  }));
}
