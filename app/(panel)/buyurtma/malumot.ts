/**
 * app/(panel)/buyurtma/malumot.ts — TZ 8.14 · 8.15 · 8.16 · Q-25
 *
 * ⚠️ TZ 8.2 — buyurtmaning UMUMIY STATUSI YO'Q. Ro'yxatda pozitsiya
 *    holatlari SANOQ bo'lib ko'rsatiladi («3 tayyor, 1 tikilmoqda»),
 *    bitta status sifatida emas. Aks holda yarim tayyor buyurtma
 *    «tayyor» bo'lib ko'rinardi.
 */

import { ulanishOl } from '@/lib/db';

export interface BuyurtmaQatori {
  readonly id: number;
  readonly raqam: string;
  readonly sana: Date;
  readonly mijozIsmi: string | null;
  readonly manba: string;
  readonly valyuta: string;
  readonly tayyorlikSana: string | null;
  readonly pozitsiyaSoni: number;
  readonly jami: string;
  /** TZ 3.12 — kassa yozuvlaridan yig'iladi (2.2-invariant) */
  readonly tolangan: string;
  /** Holat → soni (8.2) */
  readonly holatlar: Readonly<Record<string, number>>;
}

export type BuyurtmaFiltri =
  | 'HAMMASI'
  | 'BUGUNGI'
  | 'TASDIQ_KUTMOQDA'
  | 'ISHLAB_CHIQARILMOQDA'
  | 'TAYYOR'
  | 'MATERIALGA_KUTMOQDA'
  | 'MUDDATI_OTGAN';

export const FILTR_NOMI: Record<BuyurtmaFiltri, string> = {
  HAMMASI: 'Hammasi',
  BUGUNGI: 'Bugungi',
  TASDIQ_KUTMOQDA: 'Tasdiq kutmoqda',
  ISHLAB_CHIQARILMOQDA: 'Ishlab chiqarilmoqda',
  TAYYOR: 'Tayyor, topshirilmagan',
  MATERIALGA_KUTMOQDA: 'Materialga kutmoqda',
  MUDDATI_OTGAN: "Muddati o'tgan",
};

export async function buyurtmalar(
  filialId: number,
  filtr: BuyurtmaFiltri = 'HAMMASI',
  chegara = 100,
): Promise<BuyurtmaQatori[]> {
  const sql = ulanishOl();

  const holatliFiltr =
    filtr === 'TASDIQ_KUTMOQDA' ||
    filtr === 'ISHLAB_CHIQARILMOQDA' ||
    filtr === 'TAYYOR' ||
    filtr === 'MATERIALGA_KUTMOQDA';

  const qatorlar = await sql<
    {
      id: number;
      raqam: string;
      sana: Date;
      mijoz_ismi: string | null;
      manba: string;
      valyuta: string;
      tayyorlik_sana: string | null;
      pozitsiya_soni: number;
      jami: string | null;
      tolangan: string | null;
    }[]
  >`
    SELECT b.id, b.raqam, b.sana, m.ism AS mijoz_ismi, b.manba, b.valyuta,
           b.tayyorlik_sana::text AS tayyorlik_sana,
           COUNT(p.id)::int AS pozitsiya_soni,
           SUM(p.narx_snapshot - COALESCE(p.chegirma_summa, 0))::text AS jami,
           /*
            * TZ 3.12 — buyurtma qarzga ketishi mumkin. Sotuv
            * tarixida «to'landimi» eng muhim ustun: sotuvchi
            * qaysi mijozdan pul yig'ish kerakligini shu yerdan
            * ko'radi.
            *
            * ⚠️ 2.2-invariant — to'langan summa saqlanmaydi,
            *    kassa yozuvlaridan yig'iladi.
            */
           COALESCE((
             SELECT SUM(y.summa) FROM kassa_yozuv y
             WHERE y.manba_turi = 'buyurtma' AND y.manba_id = b.id
               AND y.summa > 0
           ), 0)::text AS tolangan
    FROM buyurtma b
    LEFT JOIN mijoz m ON m.id = b.mijoz_id
    LEFT JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    WHERE b.sotgan_filial_id = ${filialId}
      ${filtr === 'BUGUNGI' ? sql`AND b.sana::date = current_date` : sql``}
      ${
        holatliFiltr
          ? sql`AND EXISTS (SELECT 1 FROM buyurtma_pozitsiya x
                            WHERE x.buyurtma_id = b.id AND x.holat = ${filtr})`
          : sql``
      }
      ${
        filtr === 'MUDDATI_OTGAN'
          ? // TZ 3.13 — sanasi YO'Q buyurtma kechikkan hisoblanmaydi
            sql`AND b.tayyorlik_sana IS NOT NULL
                AND b.tayyorlik_sana < current_date
                AND EXISTS (SELECT 1 FROM buyurtma_pozitsiya x
                            WHERE x.buyurtma_id = b.id
                              AND x.holat NOT IN ('TOPSHIRILDI','QAYTARILGAN',
                                                  'RAD_ETILGAN','BEKOR'))`
          : sql``
      }
    GROUP BY b.id, m.ism
    ORDER BY b.sana DESC, b.id DESC
    LIMIT ${chegara}`;

  if (qatorlar.length === 0) return [];

  const holatlar = await sql<
    { buyurtma_id: number; holat: string; n: number }[]
  >`
    SELECT buyurtma_id, holat, COUNT(*)::int AS n
    FROM buyurtma_pozitsiya
    WHERE buyurtma_id = ANY(${qatorlar.map((q) => q.id)})
    GROUP BY buyurtma_id, holat`;

  const holatBoyicha = new Map<number, Record<string, number>>();
  for (const h of holatlar) {
    const joriy = holatBoyicha.get(h.buyurtma_id) ?? {};
    joriy[h.holat] = h.n;
    holatBoyicha.set(h.buyurtma_id, joriy);
  }

  return qatorlar.map((q) => ({
    id: q.id,
    raqam: q.raqam,
    sana: q.sana,
    mijozIsmi: q.mijoz_ismi,
    manba: q.manba,
    valyuta: q.valyuta,
    tayyorlikSana: q.tayyorlik_sana,
    pozitsiyaSoni: q.pozitsiya_soni,
    jami: q.jami ?? '0',
    tolangan: q.tolangan ?? '0',
    holatlar: holatBoyicha.get(q.id) ?? {},
  }));
}

// ─── 8.14 · Kartochka ─────────────────────────────────────────────────────

export interface PozitsiyaTafsili {
  readonly id: number;
  readonly tartib: number;
  readonly turNomi: string;
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly soni: number;
  readonly narx: string;
  readonly chegirma: string;
  readonly holat: string;
  readonly ustaIsmi: string | null;
  readonly materiallar: readonly {
    readonly slotNomi: string;
    readonly materialNomi: string;
    readonly hisoblangan: number;
    readonly tuzatilgan: number | null;
    readonly birlik: string;
    /** Band qilingan bo'lak kodlari (7.3) */
    readonly bandKodlari: readonly string[];
  }[];
  readonly aksessuarlar: readonly {
    readonly nom: string;
    readonly soni: number;
    readonly birlik: string;
    readonly qoldaKiritildi: boolean;
  }[];
}

export interface BuyurtmaTafsili {
  readonly id: number;
  readonly raqam: string;
  readonly sana: Date;
  readonly mijozIsmi: string | null;
  readonly mijozTelefon: string | null;
  readonly sotuvchiIsmi: string;
  readonly manba: string;
  readonly valyuta: string;
  readonly kursSnapshot: string | null;
  readonly tayyorlikSana: string | null;
  readonly sotganFilialId: number;
  readonly tikuvchiFilialId: number;
  readonly pozitsiyalar: readonly PozitsiyaTafsili[];
}

export async function buyurtmaTafsili(
  buyurtmaId: number,
  filialId: number,
): Promise<BuyurtmaTafsili | null> {
  const sql = ulanishOl();

  const bosh = await sql<
    {
      id: number;
      raqam: string;
      sana: Date;
      mijoz_ismi: string | null;
      mijoz_telefon: string | null;
      sotuvchi_ismi: string;
      manba: string;
      valyuta: string;
      kurs_snapshot: string | null;
      tayyorlik_sana: string | null;
      sotgan_filial_id: number;
      ishlab_chiqaruvchi_filial_id: number;
    }[]
  >`
    SELECT b.id, b.raqam, b.sana, m.ism AS mijoz_ismi, m.telefon AS mijoz_telefon,
           x.ism AS sotuvchi_ismi, b.manba, b.valyuta, b.kurs_snapshot,
           b.tayyorlik_sana::text AS tayyorlik_sana,
           b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id
    FROM buyurtma b
    JOIN xodim x ON x.id = b.sotuvchi_id
    LEFT JOIN mijoz m ON m.id = b.mijoz_id
    WHERE b.id = ${buyurtmaId}
      AND (b.sotgan_filial_id = ${filialId} OR b.ishlab_chiqaruvchi_filial_id = ${filialId})`;

  const h = bosh[0];
  if (h === undefined) return null;

  const pozitsiyalar = await sql<
    {
      id: number;
      tartib: number;
      tur_nomi: string;
      eni_sm: number;
      boyi_sm: number;
      soni: number;
      narx_snapshot: string;
      chegirma_summa: string | null;
      holat: string;
      usta_ismi: string | null;
    }[]
  >`
    SELECT p.id, p.tartib, t.nom AS tur_nomi, p.eni_sm, p.boyi_sm, p.soni,
           p.narx_snapshot, p.chegirma_summa, p.holat, u.ism AS usta_ismi
    FROM buyurtma_pozitsiya p
    JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
    LEFT JOIN xodim u ON u.id = p.usta_id
    WHERE p.buyurtma_id = ${buyurtmaId}
    ORDER BY p.tartib`;

  if (pozitsiyalar.length === 0) {
    return {
      id: h.id,
      raqam: h.raqam,
      sana: h.sana,
      mijozIsmi: h.mijoz_ismi,
      mijozTelefon: h.mijoz_telefon,
      sotuvchiIsmi: h.sotuvchi_ismi,
      manba: h.manba,
      valyuta: h.valyuta,
      kursSnapshot: h.kurs_snapshot,
      tayyorlikSana: h.tayyorlik_sana,
      sotganFilialId: h.sotgan_filial_id,
      tikuvchiFilialId: h.ishlab_chiqaruvchi_filial_id,
      pozitsiyalar: [],
    };
  }

  const idlar = pozitsiyalar.map((p) => p.id);

  const materiallar = await sql<
    {
      buyurtma_pozitsiya_id: number;
      slot_nomi: string;
      material_nomi: string;
      hisoblangan_miqdor: string;
      tuzatilgan_miqdor: string | null;
      birlik: string;
      band_kodlari: string[] | null;
    }[]
  >`
    SELECT pm.buyurtma_pozitsiya_id, s.nom AS slot_nomi, m.nom AS material_nomi,
           pm.hisoblangan_miqdor, pm.tuzatilgan_miqdor, pm.birlik,
           array_remove(array_agg(bo.kod) FILTER (WHERE bd.holat = 'FAOL'), NULL)
             AS band_kodlari
    FROM pozitsiya_material pm
    JOIN mahsulot_slot s ON s.id = pm.slot_id
    JOIN material m ON m.id = pm.material_id
    LEFT JOIN band bd ON bd.pozitsiya_material_id = pm.id
    LEFT JOIN bolak bo ON bo.id = bd.bolak_id
    WHERE pm.buyurtma_pozitsiya_id = ANY(${idlar})
    GROUP BY pm.id, s.nom, m.nom
    ORDER BY s.nom`;

  const aksessuarlar = await sql<
    {
      buyurtma_pozitsiya_id: number;
      nom: string;
      soni: string;
      birlik: string;
      qolda_kiritildi: boolean;
    }[]
  >`
    SELECT pa.buyurtma_pozitsiya_id, m.nom, pa.soni, pa.birlik, pa.qolda_kiritildi
    FROM pozitsiya_aksessuar pa
    JOIN material m ON m.id = pa.material_id
    WHERE pa.buyurtma_pozitsiya_id = ANY(${idlar})
    ORDER BY m.nom`;

  return {
    id: h.id,
    raqam: h.raqam,
    sana: h.sana,
    mijozIsmi: h.mijoz_ismi,
    mijozTelefon: h.mijoz_telefon,
    sotuvchiIsmi: h.sotuvchi_ismi,
    manba: h.manba,
    valyuta: h.valyuta,
    kursSnapshot: h.kurs_snapshot,
    tayyorlikSana: h.tayyorlik_sana,
    sotganFilialId: h.sotgan_filial_id,
    tikuvchiFilialId: h.ishlab_chiqaruvchi_filial_id,
    pozitsiyalar: pozitsiyalar.map((p) => ({
      id: p.id,
      tartib: p.tartib,
      turNomi: p.tur_nomi,
      eniSm: p.eni_sm,
      boyiSm: p.boyi_sm,
      soni: p.soni,
      narx: p.narx_snapshot,
      chegirma: p.chegirma_summa ?? '0',
      holat: p.holat,
      ustaIsmi: p.usta_ismi,
      materiallar: materiallar
        .filter((m) => m.buyurtma_pozitsiya_id === p.id)
        .map((m) => ({
          slotNomi: m.slot_nomi,
          materialNomi: m.material_nomi,
          hisoblangan: Number(m.hisoblangan_miqdor),
          tuzatilgan:
            m.tuzatilgan_miqdor === null ? null : Number(m.tuzatilgan_miqdor),
          birlik: m.birlik,
          bandKodlari: m.band_kodlari ?? [],
        })),
      aksessuarlar: aksessuarlar
        .filter((a) => a.buyurtma_pozitsiya_id === p.id)
        .map((a) => ({
          nom: a.nom,
          soni: Number(a.soni),
          birlik: a.birlik,
          qoldaKiritildi: a.qolda_kiritildi,
        })),
    })),
  };
}

// ─── 8.17 · Qayta kesish so'rovlari ───────────────────────────────────────

export interface QaytaKesishQatori {
  readonly id: number;
  readonly pozitsiyaId: number;
  readonly buyurtmaId: number;
  readonly buyurtmaRaqam: string;
  readonly tartib: number;
  readonly turNomi: string;
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly ustaIsmi: string;
  readonly sabab: string;
  readonly izoh: string | null;
  readonly sana: Date;
  /** TZ 8.17.8 — adminga jami son ko'rsatiladi (EC-BRK-03) */
  readonly oldingiSoni: number;
  /** Oldingi qayta kesishlarda yo'qotilgan maydon */
  readonly yoqotilganKvM: number;
  readonly yoqotilganSumma: string;
}

/**
 * TZ 8.17.2 — admin hal qiladigan ochiq so'rovlar.
 *
 * ⚠️ 8.17.8 — «Ikkinchi marta so'ralsa admin buni ko'radi: bu pozitsiya
 *    2 marta qayta kesilgan, material yo'qotishi 7.20 kv.m · 631 000
 *    so'm.» Shuning uchun ro'yxat oldingi yo'qotishni ham olib keladi.
 */
export async function ochiqQaytaKesishlar(
  filialId: number,
): Promise<QaytaKesishQatori[]> {
  const q = await ulanishOl()<
    {
      id: number;
      pozitsiya_id: number;
      buyurtma_id: number;
      buyurtma_raqam: string;
      tartib: number;
      tur_nomi: string;
      eni_sm: number;
      boyi_sm: number;
      usta_ismi: string;
      sabab: string;
      izoh: string | null;
      sana: Date;
      oldingi_soni: number;
      yoqotilgan_kv_m: string | null;
      yoqotilgan_summa: string | null;
    }[]
  >`
    SELECT qk.id, p.id AS pozitsiya_id, b.id AS buyurtma_id,
           b.raqam AS buyurtma_raqam, p.tartib, t.nom AS tur_nomi,
           p.eni_sm, p.boyi_sm, x.ism AS usta_ismi, qk.sabab, qk.izoh,
           qk.yaratildi AS sana, p.qayta_kesildi_soni AS oldingi_soni,
           (SELECT SUM(ABS(oh.miqdor_kv_m))
              FROM ombor_harakat oh
              JOIN qayta_kesish e ON e.id = oh.manba_id
             WHERE oh.manba_turi = 'qayta_kesish'
               AND e.buyurtma_pozitsiya_id = p.id)::text AS yoqotilgan_kv_m,
           (SELECT SUM(ABS(oh.tannarx_summa))
              FROM ombor_harakat oh
              JOIN qayta_kesish e ON e.id = oh.manba_id
             WHERE oh.manba_turi = 'qayta_kesish'
               AND e.buyurtma_pozitsiya_id = p.id)::text AS yoqotilgan_summa
    FROM qayta_kesish qk
    JOIN buyurtma_pozitsiya p ON p.id = qk.buyurtma_pozitsiya_id
    JOIN buyurtma b ON b.id = p.buyurtma_id
    JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
    JOIN xodim x ON x.id = qk.soragan_usta_id
    WHERE qk.holat = 'SOROV' AND b.ishlab_chiqaruvchi_filial_id = ${filialId}
    ORDER BY qk.yaratildi`;

  return q.map((r) => ({
    id: r.id,
    pozitsiyaId: r.pozitsiya_id,
    buyurtmaId: r.buyurtma_id,
    buyurtmaRaqam: r.buyurtma_raqam,
    tartib: r.tartib,
    turNomi: r.tur_nomi,
    eniSm: r.eni_sm,
    boyiSm: r.boyi_sm,
    ustaIsmi: r.usta_ismi,
    sabab: r.sabab,
    izoh: r.izoh,
    sana: r.sana,
    oldingiSoni: r.oldingi_soni,
    yoqotilganKvM: Number(r.yoqotilgan_kv_m ?? 0),
    yoqotilganSumma: r.yoqotilgan_summa ?? '0',
  }));
}

// ─── 3.12 · 8.14 · To'lov bloki ───────────────────────────────────────────

export interface TolovHolati {
  readonly buyurtmaId: number;
  readonly valyuta: string;
  readonly jami: string;
  readonly tolangan: string;
  readonly qarz: string;
  readonly mijozId: number | null;
  readonly qatorlar: readonly {
    readonly id: number;
    readonly sana: Date;
    readonly kassaNomi: string;
    readonly summa: string;
    readonly valyuta: string;
    readonly xodimIsmi: string;
    readonly stornoQilinganmi: boolean;
  }[];
}

/**
 * TZ 8.14 — kartochkaning pul bloki.
 *
 * ⚠️ 2.2-invariant — to'langan summa SAQLANMAYDI, kassa yozuvlarining
 *    yig'indisi. Storno qilingan yozuv ham jurnalda qoladi, lekin
 *    yig'indiga teskari yozuvi bilan birga kiradi va o'zini yo'q qiladi.
 */
export async function tolovHolati(
  buyurtmaId: number,
  filialId: number,
): Promise<TolovHolati | null> {
  const sql = ulanishOl();

  const b = await sql<
    { valyuta: string; mijoz_id: number | null; jami: string | null }[]
  >`
    SELECT b.valyuta, b.mijoz_id,
           (SELECT SUM(p.narx_snapshot - COALESCE(p.chegirma_summa, 0))::text
              FROM buyurtma_pozitsiya p
             WHERE p.buyurtma_id = b.id
               AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')) AS jami
    FROM buyurtma b
    WHERE b.id = ${buyurtmaId} AND b.sotgan_filial_id = ${filialId}`;

  const buyurtma = b[0];
  if (buyurtma === undefined) return null;

  const q = await sql<
    {
      id: number;
      sana: Date;
      kassa_nomi: string;
      summa: string;
      valyuta: string;
      xodim_ismi: string;
      storno_qilinganmi: boolean;
    }[]
  >`
    SELECT y.id, y.sana, k.nom AS kassa_nomi, y.summa, y.valyuta,
           x.ism AS xodim_ismi,
           EXISTS (SELECT 1 FROM kassa_yozuv s WHERE s.storno_id = y.id)
             AS storno_qilinganmi
    FROM kassa_yozuv y
    JOIN kassa k ON k.id = y.kassa_id
    JOIN xodim x ON x.id = y.xodim_id
    WHERE y.manba_turi = 'buyurtma' AND y.manba_id = ${buyurtmaId}
    ORDER BY y.qator`;

  const tolangan = q
    .filter((r) => !r.storno_qilinganmi)
    .reduce((y, r) => y + Number(r.summa), 0);

  const jami = Number(buyurtma.jami ?? 0);

  return {
    buyurtmaId,
    valyuta: buyurtma.valyuta,
    jami: jami.toFixed(2),
    tolangan: tolangan.toFixed(2),
    qarz: (jami - tolangan).toFixed(2),
    mijozId: buyurtma.mijoz_id,
    qatorlar: q.map((r) => ({
      id: r.id,
      sana: r.sana,
      kassaNomi: r.kassa_nomi,
      summa: r.summa,
      valyuta: r.valyuta,
      xodimIsmi: r.xodim_ismi,
      stornoQilinganmi: r.storno_qilinganmi,
    })),
  };
}

/** TZ 3.12 — to'lov qabul qilinadigan kassalar. */
export async function tolovKassalari(
  filialId: number,
  xodimId: number,
): Promise<{ id: number; nom: string; turi: string; valyuta: string }[]> {
  const q = await ulanishOl()<
    { id: number; nom: string; turi: string; valyuta: string }[]
  >`
    SELECT id, nom, turi, valyuta FROM kassa
    WHERE filial_id = ${filialId} AND faol = true
      -- TZ 12.2 — sotuvchi faqat O'Z naqd kassasiga oladi,
      -- karta esa TO'G'RIDAN-TO'G'RI admin kassasiga tushadi
      AND (xodim_id = ${xodimId} OR turi = 'KARTA')
    ORDER BY turi, valyuta`;
  return q;
}

// ─── 8.5 · Ish oqimi uchun ───────────────────────────────────────────────

export interface UstaQatori {
  readonly id: number;
  readonly ism: string;
}

/**
 * Ishni ola oladigan xodimlar.
 *
 * ⚠️ Rol bo'yicha emas, RUXSAT bo'yicha tanlanadi: kimda `ish.ol`
 *    bo'lsa, u ishni oladi. Rol nomi o'zgarishi mumkin, ruxsat
 *    esa — tizimning haqiqiy qoidasi (§9.4).
 */
export async function ishOlaOladiganlar(filialId: number): Promise<readonly UstaQatori[]> {
  return await ulanishOl()<UstaQatori[]>`
    SELECT DISTINCT x.id, x.ism
    FROM xodim x
    JOIN xodim_rol xr ON xr.xodim_id = x.id
    JOIN rol_ruxsat rr ON rr.rol_id = xr.rol_id
    WHERE x.faol = true AND x.filial_id = ${filialId}
      AND rr.ruxsat_kod = 'ish.ol'
    ORDER BY x.ism`;
}

export interface BandBolak {
  readonly pozitsiyaId: number;
  readonly kod: string;
  readonly eniM: number | null;
  readonly boyiM: number | null;
}

/**
 * TZ 7.3 — pozitsiyaga band qilingan bo'lak.
 *
 * «Tugatdim» oynasida ko'rsatiladi: usta nimadan kesayotganini
 * va uning o'lchamini ko'rib turishi kerak.
 */
export async function bandBolaklar(
  pozitsiyaIdlar: readonly number[],
): Promise<readonly BandBolak[]> {
  if (pozitsiyaIdlar.length === 0) return [];

  const q = await ulanishOl()<
    { pozitsiya_id: number; kod: string; eni_m: string | null; boyi_m: string | null }[]
  >`
    SELECT bd.buyurtma_pozitsiya_id AS pozitsiya_id, bo.kod,
           bo.eni_m::text, bo.boyi_m::text
    FROM band bd
    JOIN bolak bo ON bo.id = bd.bolak_id
    WHERE bd.buyurtma_pozitsiya_id = ANY(${pozitsiyaIdlar as number[]})
      AND bd.holat = 'FAOL'
    ORDER BY bd.id`;

  return q.map((x) => ({
    pozitsiyaId: x.pozitsiya_id,
    kod: x.kod,
    eniM: x.eni_m === null ? null : Number(x.eni_m),
    boyiM: x.boyi_m === null ? null : Number(x.boyi_m),
  }));
}
