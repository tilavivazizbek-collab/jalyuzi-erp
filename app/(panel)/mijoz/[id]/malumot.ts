/**
 * app/(panel)/mijoz/[id]/malumot.ts — TZ 6.x · 11.6 · 1.3-invariant
 *
 * Mijoz kartochkasining so'rovlari.
 *
 * ⚠️ MIJOZLAR B2B — ular uyiga emas, QAYTA SOTISH uchun oladi
 *    (egasi, 2026-09-05). Shuning uchun bu yerda «qaysi derazasi»
 *    emas, «qanday to'laydi», «qanday ritmda oladi» va «nimani
 *    qayta sotadi» hisoblanadi. Qayta sotuvchida o'lcham har safar
 *    boshqa — u o'z mijozining derazasi uchun oladi.
 *
 * ⚠️ VALYUTALAR ARALASHTIRILMAYDI (1.3). Aylanma ham, qarz ham
 *    so'm va dollar bo'yicha ALOHIDA qaytadi. Ularni qo'shadigan
 *    yagona joy — qarz limiti tekshiruvi (6.4), u ham JORIY kursda
 *    va «taxminiy» deb belgilanadi.
 *
 * ⚠️ Bekor qilingan pozitsiya hech qayerda sanalmaydi.
 */

import { ulanishOl } from '@/lib/db';

/** Hisobga olinmaydigan pozitsiyalar — sotuv bo'lmagan */
const SANALMAYDI = ['BEKOR', 'RAD_ETILGAN', 'QAYTARILGAN'] as const;

// ─── Umumiy ko'rsatkichlar ────────────────────────────────────────────────

export interface MijozXulosasi {
  readonly buyurtmaSoni: number;
  /** 1.3 — valyutalar alohida */
  readonly aylanmaSom: string;
  readonly aylanmaDollar: string;
  readonly ortachaChekSom: string;
  readonly birinchiXarid: Date | null;
  readonly oxirgiXarid: Date | null;
  /**
   * Ikki xarid orasidagi o'rtacha kun — B2B da eng gapiradigan raqam.
   * Bitta buyurtma bo'lsa `null`: ritm haqida gapirib bo'lmaydi.
   */
  readonly ortachaOraliqKun: number | null;
  /** Oxirgi xariddan beri o'tgan kun */
  readonly oxirgidanBeriKun: number | null;
}

export async function mijozXulosasi(mijozId: number): Promise<MijozXulosasi> {
  const q = await ulanishOl()<
    {
      soni: number;
      aylanma_som: string | null;
      aylanma_dollar: string | null;
      birinchi: Date | null;
      oxirgi: Date | null;
    }[]
  >`
    SELECT COUNT(DISTINCT b.id)::int AS soni,
           SUM((p.narx_snapshot - COALESCE(p.chegirma_summa, 0))
               + COALESCE(p.xizmat_haqi, 0))
             FILTER (WHERE b.valyuta = 'SOM')::text AS aylanma_som,
           SUM((p.narx_snapshot - COALESCE(p.chegirma_summa, 0))
               + COALESCE(p.xizmat_haqi, 0))
             FILTER (WHERE b.valyuta = 'USD')::text AS aylanma_dollar,
           MIN(b.sana) AS birinchi,
           MAX(b.sana) AS oxirgi
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    WHERE b.mijoz_id = ${mijozId}
      AND b.storno_sana IS NULL
      AND p.holat <> ALL(${SANALMAYDI})`;

  const r = q[0];
  const soni = r?.soni ?? 0;
  const birinchi = r?.birinchi ?? null;
  const oxirgi = r?.oxirgi ?? null;

  const kun = (a: Date, b: Date): number =>
    Math.round((b.getTime() - a.getTime()) / 86_400_000);

  /**
   * ⚠️ O'rtacha oraliq = butun davr ÷ (buyurtma − 1).
   *    Bitta buyurtmada bo'luvchi nol bo'lardi — shuning uchun `null`.
   */
  const oraliq =
    birinchi !== null && oxirgi !== null && soni > 1
      ? Math.round(kun(birinchi, oxirgi) / (soni - 1))
      : null;

  const aylanmaSom = r?.aylanma_som ?? '0';

  return {
    buyurtmaSoni: soni,
    aylanmaSom,
    aylanmaDollar: r?.aylanma_dollar ?? '0',
    ortachaChekSom: soni > 0 ? (Number(aylanmaSom) / soni).toFixed(2) : '0',
    birinchiXarid: birinchi,
    oxirgiXarid: oxirgi,
    ortachaOraliqKun: oraliq,
    oxirgidanBeriKun: oxirgi === null ? null : kun(oxirgi, new Date()),
  };
}

// ─── To'lov intizomi — B2B da eng muhim raqam ────────────────────────────

export interface TolovIntizomi {
  /** To'liq to'langan buyurtmalar bo'yicha o'rtacha kun */
  readonly ortachaKun: number | null;
  /** Eng uzoq to'langan buyurtma — necha kun */
  readonly engUzunKun: number | null;
  /** To'liq to'langan buyurtmalar soni — o'rtacha shundan chiqqan */
  readonly tolanganSoni: number;
  /** Hozir to'lanmagan eng eski buyurtma necha kunlik */
  readonly ochiqQarzKun: number | null;
}

/**
 * ⚠️ NEGA BU KERAK
 *
 *    Qayta sotuvchi deyarli doim QARZGA oladi. «Qancha qarz berish
 *    mumkin» degan savolga javob summada emas — TO'LOV TARIXIDA.
 *
 * ⚠️ 2.2-invariant — to'langan summa saqlanmaydi, kassa
 *    yozuvlaridan yig'iladi.
 */
export async function tolovIntizomi(mijozId: number): Promise<TolovIntizomi> {
  const q = await ulanishOl()<
    {
      ortacha: string | null;
      eng_uzun: string | null;
      tolangan_soni: number;
      ochiq_kun: string | null;
    }[]
  >`
    WITH buyurtmalar AS (
      SELECT b.id, b.sana,
             SUM((p.narx_snapshot - COALESCE(p.chegirma_summa, 0))
                 + COALESCE(p.xizmat_haqi, 0)) AS jami
      FROM buyurtma b
      JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
      WHERE b.mijoz_id = ${mijozId}
        AND b.storno_sana IS NULL
        AND p.holat <> ALL(${SANALMAYDI})
      GROUP BY b.id, b.sana
    ),
    tolovlar AS (
      SELECT bu.id, bu.sana, bu.jami,
             COALESCE(SUM(y.summa), 0) AS tolangan,
             MAX(y.sana)               AS oxirgi_tolov
      FROM buyurtmalar bu
      LEFT JOIN kassa_yozuv y
             ON y.manba_turi = 'buyurtma' AND y.manba_id = bu.id AND y.summa > 0
      GROUP BY bu.id, bu.sana, bu.jami
    )
    SELECT
      AVG(EXTRACT(EPOCH FROM (oxirgi_tolov - sana)) / 86400)
        FILTER (WHERE tolangan >= jami AND jami > 0)::text AS ortacha,
      MAX(EXTRACT(EPOCH FROM (oxirgi_tolov - sana)) / 86400)
        FILTER (WHERE tolangan >= jami AND jami > 0)::text AS eng_uzun,
      COUNT(*) FILTER (WHERE tolangan >= jami AND jami > 0)::int AS tolangan_soni,
      MAX(EXTRACT(EPOCH FROM (now() - sana)) / 86400)
        FILTER (WHERE tolangan < jami)::text AS ochiq_kun
    FROM tolovlar`;

  const r = q[0];
  const son = (x: string | null | undefined): number | null =>
    x === null || x === undefined ? null : Math.round(Number(x));

  return {
    ortachaKun: son(r?.ortacha),
    engUzunKun: son(r?.eng_uzun),
    tolanganSoni: r?.tolangan_soni ?? 0,
    ochiqQarzKun: son(r?.ochiq_kun),
  };
}

// ─── Nima sotadi ──────────────────────────────────────────────────────────

export interface SotilganQator {
  readonly nom: string;
  readonly soni: number;
}

export interface SotilganMaterial {
  readonly nom: string;
  readonly miqdor: string;
  readonly birlik: string;
}

/**
 * ⚠️ Qayta sotuvchi «o'sha kulrangdan yana» deb qo'ng'iroq qiladi.
 *    Shuning uchun mahsulot TURI ham, MATO ham kerak.
 */
export async function nimaSotadi(
  mijozId: number,
  chegara = 5,
): Promise<{ turlar: SotilganQator[]; materiallar: SotilganMaterial[] }> {
  const sql = ulanishOl();

  const turlar = await sql<{ nom: string; soni: number }[]>`
    SELECT mt.nom, SUM(p.soni)::int AS soni
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    JOIN mahsulot_tur mt      ON mt.id = p.mahsulot_tur_id
    WHERE b.mijoz_id = ${mijozId}
      AND b.storno_sana IS NULL
      AND p.holat <> ALL(${SANALMAYDI})
    GROUP BY mt.nom
    ORDER BY 2 DESC
    LIMIT ${chegara}`;

  const materiallar = await sql<{ nom: string; miqdor: string; birlik: string }[]>`
    SELECT m.nom, SUM(pm.hisoblangan_miqdor)::text AS miqdor, pm.birlik
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p  ON p.buyurtma_id = b.id
    JOIN pozitsiya_material pm ON pm.buyurtma_pozitsiya_id = p.id
    JOIN material m            ON m.id = pm.material_id
    WHERE b.mijoz_id = ${mijozId}
      AND b.storno_sana IS NULL
      AND p.holat <> ALL(${SANALMAYDI})
    GROUP BY m.nom, pm.birlik
    ORDER BY 2 DESC
    LIMIT ${chegara}`;

  return {
    turlar: turlar.map((t) => ({ nom: t.nom, soni: t.soni })),
    materiallar: materiallar.map((m) => ({
      nom: m.nom,
      miqdor: m.miqdor,
      birlik: m.birlik,
    })),
  };
}

// ─── Oylik aylanma ────────────────────────────────────────────────────────

export interface OylikAylanma {
  /** `2026-09` ko'rinishida */
  readonly oy: string;
  readonly som: string;
  readonly dollar: string;
}

export async function oylikAylanma(mijozId: number, oySoni = 6): Promise<OylikAylanma[]> {
  const q = await ulanishOl()<{ oy: string; som: string | null; dollar: string | null }[]>`
    SELECT to_char(date_trunc('month', b.sana), 'YYYY-MM') AS oy,
           SUM((p.narx_snapshot - COALESCE(p.chegirma_summa, 0))
               + COALESCE(p.xizmat_haqi, 0))
             FILTER (WHERE b.valyuta = 'SOM')::text AS som,
           SUM((p.narx_snapshot - COALESCE(p.chegirma_summa, 0))
               + COALESCE(p.xizmat_haqi, 0))
             FILTER (WHERE b.valyuta = 'USD')::text AS dollar
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    WHERE b.mijoz_id = ${mijozId}
      AND b.storno_sana IS NULL
      AND p.holat <> ALL(${SANALMAYDI})
      AND b.sana >= date_trunc('month', now()) - make_interval(months => ${oySoni - 1})
    GROUP BY 1
    ORDER BY 1`;

  return q.map((r) => ({ oy: r.oy, som: r.som ?? '0', dollar: r.dollar ?? '0' }));
}

// ─── Buyurtmalar tarixi ───────────────────────────────────────────────────

export interface MijozBuyurtmasi {
  readonly id: number;
  readonly raqam: string;
  readonly sana: Date;
  readonly valyuta: string;
  readonly jami: string;
  readonly tolangan: string;
  readonly pozitsiyaSoni: number;
  readonly stornomi: boolean;
  /** Holat sanoqlari: `{ TAYYOR: 2, TOPSHIRILDI: 1 }` */
  readonly holatlar: Record<string, number>;
}

export async function mijozBuyurtmalari(
  mijozId: number,
  chegara = 20,
): Promise<MijozBuyurtmasi[]> {
  const sql = ulanishOl();

  const qatorlar = await sql<
    {
      id: number;
      raqam: string;
      sana: Date;
      valyuta: string;
      jami: string | null;
      tolangan: string | null;
      pozitsiya_soni: number;
      stornomi: boolean;
    }[]
  >`
    SELECT b.id, b.raqam, b.sana, b.valyuta,
           (b.storno_sana IS NOT NULL) AS stornomi,
           COUNT(p.id)::int AS pozitsiya_soni,
           SUM((p.narx_snapshot - COALESCE(p.chegirma_summa, 0))
               + COALESCE(p.xizmat_haqi, 0))::text AS jami,
           COALESCE((
             SELECT SUM(y.summa) FROM kassa_yozuv y
             WHERE y.manba_turi = 'buyurtma' AND y.manba_id = b.id AND y.summa > 0
           ), 0)::text AS tolangan
    FROM buyurtma b
    LEFT JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    WHERE b.mijoz_id = ${mijozId}
    GROUP BY b.id
    ORDER BY b.sana DESC, b.id DESC
    LIMIT ${chegara}`;

  if (qatorlar.length === 0) return [];

  const holatlar = await sql<{ buyurtma_id: number; holat: string; n: number }[]>`
    SELECT buyurtma_id, holat, COUNT(*)::int AS n
    FROM buyurtma_pozitsiya
    WHERE buyurtma_id = ANY(${qatorlar.map((q) => q.id)})
    GROUP BY buyurtma_id, holat`;

  const boyicha = new Map<number, Record<string, number>>();
  for (const h of holatlar) {
    const joriy = boyicha.get(h.buyurtma_id) ?? {};
    joriy[h.holat] = h.n;
    boyicha.set(h.buyurtma_id, joriy);
  }

  return qatorlar.map((q) => ({
    id: q.id,
    raqam: q.raqam,
    sana: q.sana,
    valyuta: q.valyuta,
    jami: q.jami ?? '0',
    tolangan: q.tolangan ?? '0',
    pozitsiyaSoni: q.pozitsiya_soni,
    stornomi: q.stornomi,
    holatlar: boyicha.get(q.id) ?? {},
  }));
}
