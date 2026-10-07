/**
 * app/(panel)/yetkazib/[id]/malumot.ts — TZ 9.2 · 9.3 · 9.6 · 9.9 · 11.7.6
 *
 * Yetkazib beruvchi kartochkasining QARORGA YORDAM BERADIGAN raqamlari.
 *
 * ⚠️ Mavjud `../malumot.ts` da «qancha qarzimiz» va «qancha olganmiz»
 *    bor. Bu yerdagilar boshqa savolga javob beradi:
 *
 *      · biz qanday to'laymiz   → hamkorlik shartlari nima bo'ladi
 *      · nima to'lanmagan       → bugun kimga pul o'tkazish kerak
 *      · boshqada arzonroqmi    → keyingi safar kimdan olish
 *      · kurs farqi             → dollarli yetkazuvchi qimmatga tushdimi
 *      · omborda qancha yotibdi → keyingi partiya qanchalik bo'lsin
 *      · da'volarga javob beradimi → yaxshi hamkormi
 *
 * ⚠️ VALYUTALAR ARALASHTIRILMAYDI (1.3-invariant).
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { toshkentKuni } from '@/lib/domain/sana';
import type { YetkazibHolati } from '../taqsimot';

// ─── 1 · Biz qanday to'laymiz ─────────────────────────────────────────────

export interface TolovIntizomimiz {
  /** To'liq to'langan hujjatlar bo'yicha o'rtacha kun */
  readonly ortachaKun: number | null;
  readonly engUzunKun: number | null;
  readonly tolanganSoni: number;
  /** Muddati o'tgan, hali to'lanmagan hujjatlar */
  readonly kechikkanSoni: number;
  /** To'langan, lekin muddatidan keyin */
  readonly kechikibTolangan: number;
}

/**
 * ⚠️ Mijozdagi «u qanday to'laydi» ning TESKARISI.
 *
 *    Yetkazuvchi keyingi shartlarni shunga qarab beradi: muntazam
 *    kechiksak oldindan to'lov talab qilinadi.
 *
 * ⚠️ 2026-10-07 — FIFO taqsimotdan (`yetkazibHolati`). Ilgari faqat
 *    kirimga BOG'LANGAN to'lov sanalardi va hujjat summasi
 *    `narx × miqdor + transport` edi: kartochkadan to'langan qarz
 *    «to'lanmagan» bo'lib qolardi (P-46).
 */
export function tolovIntizomimiz(h: YetkazibHolati): TolovIntizomimiz {
  return { ...h.intizom, kechikkanSoni: h.muddat.muddatOtganSoni };
}

// ─── 2 · Kutilayotgan to'lovlar ───────────────────────────────────────────

export interface KutilayotganTolov {
  readonly kirimId: number;
  readonly raqam: string;
  readonly sana: string;
  readonly muddat: string | null;
  readonly valyuta: string;
  readonly jami: string;
  readonly tolangan: string;
  readonly qoldiq: string;
  /** Muddatgacha necha kun — manfiy bo'lsa o'tib ketgan */
  readonly kunQoldi: number | null;
}

/** Ochiq hujjatlar — muddati yaqini (o'tgani) birinchi */
export function kutilayotganTolovlar(h: YetkazibHolati, chegara = 20): KutilayotganTolov[] {
  const bugun = new Date(`${toshkentKuni()}T00:00:00Z`).getTime();
  const r: KutilayotganTolov[] = [];
  for (const b of h.taqsimot.bandlar) {
    if (b.buyurtmaId === null || !new Decimal(b.qolgan).gt(0)) continue;
    const k = h.kirimlar.get(b.buyurtmaId);
    if (k === undefined) continue;
    r.push({
      kirimId: b.buyurtmaId,
      raqam: k.raqam,
      sana: k.sana,
      muddat: k.muddat,
      valyuta: b.valyuta,
      jami: b.summa,
      tolangan: b.tolangan,
      qoldiq: b.qolgan,
      kunQoldi:
        k.muddat === null
          ? null
          : Math.round((new Date(`${k.muddat}T00:00:00Z`).getTime() - bugun) / 86_400_000),
    });
  }
  return r
    .sort(
      (a, b) =>
        (a.muddat ?? '9999').localeCompare(b.muddat ?? '9999') || a.sana.localeCompare(b.sana),
    )
    .slice(0, chegara);
}

// ─── 3 · Narx solishtirish ────────────────────────────────────────────────

export interface NarxSolishtirish {
  readonly materialId: number;
  readonly materialNom: string;
  readonly bizNarx: string;
  readonly bizSana: string;
  readonly arzonNarx: string;
  readonly arzonYetkazuvchi: string;
  readonly arzonSana: string;
  readonly farqFoiz: number;
}

/**
 * ⚠️ Bu yetkazuvchi beradigan matolar BOSHQADA arzonroqmi.
 *
 * ⚠️ Faqat BIR XIL VALYUTADAGI narxlar solishtiriladi (1.3):
 *    dollardagi 4 va so'mdagi 50 000 ni taqqoslash ma'nosiz.
 *
 * ⚠️ Har yetkazuvchidan OXIRGI narx olinadi — eski narx bilan
 *    solishtirish noto'g'ri xulosa berardi.
 */
export async function narxSolishtirish(
  yetkazibId: number,
  chegara = 10,
): Promise<NarxSolishtirish[]> {
  const q = await ulanishOl()<
    {
      material_id: number;
      material_nom: string;
      biz_narx: string;
      biz_sana: string;
      arzon_narx: string;
      arzon_yetkazuvchi: string;
      arzon_sana: string;
    }[]
  >`
    WITH oxirgi AS (
      SELECT DISTINCT ON (kq.material_id, k.yetkazib_beruvchi_id)
             kq.material_id, k.yetkazib_beruvchi_id, y.nom AS yetkazuvchi,
             kq.narx_birlik, kq.narx_asosi, k.valyuta, k.sana
      FROM kirim_qator kq
      JOIN kirim k             ON k.id = kq.kirim_id
      JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
      WHERE k.holat = 'FAOL'
      ORDER BY kq.material_id, k.yetkazib_beruvchi_id, k.sana DESC, k.id DESC
    ),
    biz AS (
      SELECT * FROM oxirgi WHERE yetkazib_beruvchi_id = ${yetkazibId}
    )
    SELECT b.material_id, m.nom AS material_nom,
           b.narx_birlik::text AS biz_narx, b.sana::text AS biz_sana,
           o.narx_birlik::text AS arzon_narx,
           o.yetkazuvchi        AS arzon_yetkazuvchi,
           o.sana::text         AS arzon_sana
    FROM biz b
    JOIN material m ON m.id = b.material_id
    JOIN LATERAL (
      SELECT * FROM oxirgi x
      WHERE x.material_id = b.material_id
        AND x.yetkazib_beruvchi_id <> ${yetkazibId}
        -- Bir xil valyuta va bir xil asosda solishtiriladi (1.3)
        AND x.valyuta = b.valyuta
        AND x.narx_asosi = b.narx_asosi
        AND x.narx_birlik < b.narx_birlik
      ORDER BY x.narx_birlik
      LIMIT 1
    ) o ON true
    ORDER BY (b.narx_birlik - o.narx_birlik) / NULLIF(b.narx_birlik, 0) DESC
    LIMIT ${chegara}`;

  return q.map((r) => ({
    materialId: r.material_id,
    materialNom: r.material_nom,
    bizNarx: r.biz_narx,
    bizSana: r.biz_sana,
    arzonNarx: r.arzon_narx,
    arzonYetkazuvchi: r.arzon_yetkazuvchi,
    arzonSana: r.arzon_sana,
    farqFoiz: Math.round(
      ((Number(r.biz_narx) - Number(r.arzon_narx)) / Number(r.biz_narx)) * 100,
    ),
  }));
}

// ─── 4 · Kurs farqi ───────────────────────────────────────────────────────

export interface KursFarqiJami {
  /** Musbat — bizga zarar, manfiy — daromad (xarajat ishorasi bo'yicha) */
  readonly summa: string;
  readonly hodisaSoni: number;
}

/**
 * TZ 9.6 — «Kurs tushsa bu DAROMAD bo'ladi.»
 *
 * ⚠️ Yozuv allaqachon bor (`xarajat`, modda `KURS_FARQI`), lekin
 *    hech qayerda yetkazuvchi kesimida ko'rsatilmasdi. Dollarda
 *    oladigan yetkazuvchi arzon ko'rinib, kurs o'zgarishi bilan
 *    qimmatga tushishi mumkin.
 */
export async function kursFarqiJami(yetkazibId: number): Promise<KursFarqiJami> {
  const q = await ulanishOl()<{ summa: string | null; soni: number }[]>`
    SELECT SUM(x.summa)::text AS summa, COUNT(*)::int AS soni
    FROM xarajat x
    WHERE x.modda = 'KURS_FARQI'
      AND (
        (x.manba_turi = 'yetkazib_beruvchi' AND x.manba_id = ${yetkazibId})
        OR (x.manba_turi = 'kirim' AND x.manba_id IN (
              SELECT id FROM kirim WHERE yetkazib_beruvchi_id = ${yetkazibId}))
      )`;

  return { summa: q[0]?.summa ?? '0', hodisaSoni: q[0]?.soni ?? 0 };
}

// ─── 5 · Omborda qolgan moli ──────────────────────────────────────────────

export interface OmbordaQolgan {
  /** Undan olingan jami qiymat — so'mda */
  readonly jamiQiymat: string;
  /** Shundan hali omborda turgani */
  readonly qoldiqQiymat: string;
  readonly qoldiqBolak: number;
}

/**
 * TZ 11.7.6 — muzlab qolgan pul, yetkazuvchi kesimida.
 *
 * ⚠️ Katta partiya olib yarmi yotib qolgan bo'lsa, keyingi safar
 *    kamroq olish kerakligi shu raqamdan ko'rinadi.
 */
export async function ombordaQolgan(yetkazibId: number): Promise<OmbordaQolgan> {
  const q = await ulanishOl()<
    { jami: string | null; qoldiq: string | null; soni: number }[]
  >`
    SELECT
      SUM(b.tannarx_birlik_snapshot
          * CASE WHEN b.turi = 'DONA'
                 THEN COALESCE(b.miqdor, 0)
                 ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END)::text AS jami,
      SUM(b.tannarx_birlik_snapshot
          * CASE WHEN b.turi = 'DONA'
                 THEN COALESCE(b.miqdor, 0)
                 ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END)
        FILTER (WHERE b.holat IN ('BOSH','BAND'))::text AS qoldiq,
      COUNT(*) FILTER (WHERE b.holat IN ('BOSH','BAND'))::int AS soni
    FROM bolak b
    JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    JOIN kirim k        ON k.id = kq.kirim_id
    WHERE k.yetkazib_beruvchi_id = ${yetkazibId}
      AND b.faol = true
      AND b.tannarx_valyuta_snapshot = 'SOM'`;

  return {
    jamiQiymat: q[0]?.jami ?? '0',
    qoldiqQiymat: q[0]?.qoldiq ?? '0',
    qoldiqBolak: q[0]?.soni ?? 0,
  };
}

// ─── 6 · Da'volar natijasi ────────────────────────────────────────────────

export interface DavolarNatijasi {
  readonly jami: number;
  readonly qabulQilingan: number;
  readonly ozimizga: number;
  readonly ochiq: number;
  /** Qabul qilinganlar bo'yicha qaytarilgan summa */
  readonly qaytarilgan: string;
}

/**
 * TZ 9.9 — brak FOIZI yetarli emas: muhimi yetkazuvchi JAVOB
 * BERADIMI. Uch marta brak chiqib uchalasini qabul qilgan
 * yetkazuvchi — yaxshi hamkor.
 */
export async function davolarNatijasi(yetkazibId: number): Promise<DavolarNatijasi> {
  const q = await ulanishOl()<
    {
      jami: number;
      qabul: number;
      ozimizga: number;
      qaytarilgan: string | null;
    }[]
  >`
    SELECT
      COUNT(*) FILTER (WHERE kq.defekt_turi IS NOT NULL)::int AS jami,
      COUNT(*) FILTER (WHERE kq.defekt_turi = 'QAYTARILADI'
                         AND EXISTS (SELECT 1 FROM yetkazib_beruvchi_harakat h
                                      WHERE h.manba_turi = 'kirim_qator'
                                        AND h.manba_id = kq.id))::int AS qabul,
      COUNT(*) FILTER (WHERE kq.defekt_turi = 'HISOBDAN_CHIQADI')::int AS ozimizga,
      COALESCE(ABS(SUM((SELECT SUM(h.summa) FROM yetkazib_beruvchi_harakat h
                         WHERE h.manba_turi = 'kirim_qator'
                           AND h.manba_id = kq.id))), 0)::text AS qaytarilgan
    FROM kirim_qator kq
    JOIN kirim k ON k.id = kq.kirim_id
    WHERE k.yetkazib_beruvchi_id = ${yetkazibId} AND k.holat = 'FAOL'`;

  const r = q[0];
  const jami = r?.jami ?? 0;
  const qabul = r?.qabul ?? 0;
  const ozimizga = r?.ozimizga ?? 0;

  return {
    jami,
    qabulQilingan: qabul,
    ozimizga,
    ochiq: Math.max(0, jami - qabul - ozimizga),
    qaytarilgan: r?.qaytarilgan ?? '0',
  };
}
