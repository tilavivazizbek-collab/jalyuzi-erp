/**
 * app/(panel)/ombor/[id]/malumot.ts — TZ 7.11 · 11.7 · 15.3
 *
 * Material kartochkasining QARORGA YORDAM BERADIGAN raqamlari.
 *
 * ⚠️ Kartochkada allaqachon «qancha bor» bor edi. Bu yerdagilar
 *    boshqa savolga javob beradi: «NIMA QILISH KERAK».
 *
 *    · necha kunga yetadi        → qachon xarid qilish
 *    · kim kutyapti              → nimani birinchi olish
 *    · tannarx qanday o'zgargan  → sotuv narxini ko'tarish kerakmi
 *    · ustama                    → bu matoda ishlayapmizmi
 *
 * ⚠️ HISOB DOMENDA (§2.2). Tezlik va bashorat
 *    `lib/domain/hisobot/bashorat.ts` da — ombor hisoboti ham
 *    o'shani ishlatadi. Bu yerda nusxa yo'q.
 */

import { ulanishOl } from '@/lib/db';
import {
  CHEGARA_OMBOR,
  ortachaTezlik,
  qanchaKunQoldi,
  type Bashorat,
} from '@/lib/domain/hisobot/bashorat';

/** Tezlik shu oraliqdagi harakatdan chiqadi — bir chorak vakillik qiladi */
const TEZLIK_KUNI = 90;

// ─── 1 · Necha kunga yetadi ───────────────────────────────────────────────

export interface MaterialTezligi {
  readonly qoldiq: number;
  /** `TEZLIK_KUNI` ichida sarflangan */
  readonly sarf: number;
  readonly kunlikTezlik: number;
  readonly bashorat: Bashorat;
  readonly sarflashBirligi: string;
  /** Kartochkada belgilangan chegara — `null` bo'lsa faqat nol qoldiq */
  readonly kamQoldiqChegaraM: number | null;
}

export async function materialTezligi(
  materialId: number,
  filialId: number,
): Promise<MaterialTezligi | null> {
  const q = await ulanishOl()<
    {
      sarflash_birligi: string;
      kam_qoldiq_chegara_m: string | null;
      qoldiq: string | null;
      sarf: string | null;
    }[]
  >`
    SELECT m.sarflash_birligi, m.kam_qoldiq_chegara_m::text,
           (SELECT SUM(CASE WHEN b.turi = 'DONA'
                            THEN COALESCE(b.miqdor, 0)
                            ELSE COALESCE(b.eni_m, 0) * COALESCE(b.boyi_m, 0) END)
              FROM bolak b
             WHERE b.material_id = m.id AND b.filial_id = ${filialId}
               AND b.faol = true AND b.holat IN ('BOSH','BAND'))::text AS qoldiq,
           /*
            * ⚠️ Ombor hisobotidagi BILAN BIR XIL ifoda (11.7):
            *    chiqim manfiy yotadi, shuning uchun yig'indi
            *    teskarisiga olinadi; OSTATKA qo'shiladi, chunki
            *    kesimda butun bo'lak chiqib qoldig'i qaytib keladi.
            *    CHIQINDI alohida qo'shilmaydi — u shu farqda bor.
            */
           GREATEST((SELECT -SUM(COALESCE(oh.miqdor_kv_m, 0)
                                 + COALESCE(oh.miqdor_sm, 0)
                                 + COALESCE(oh.miqdor_dona, 0))
              FROM ombor_harakat oh
              JOIN bolak b2 ON b2.id = oh.bolak_id
             WHERE b2.material_id = m.id AND oh.filial_id = ${filialId}
               AND oh.turi IN ('KESIM','OSTATKA','BRAK')
               AND oh.sana >= now() - make_interval(days => ${TEZLIK_KUNI})), 0)::text
             AS sarf
    FROM material m
    WHERE m.id = ${materialId}`;

  const r = q[0];
  if (r === undefined) return null;

  const qoldiq = Number(r.qoldiq ?? 0);
  const sarf = Number(r.sarf ?? 0);
  const tezlik = ortachaTezlik(sarf, TEZLIK_KUNI);

  return {
    qoldiq,
    sarf,
    kunlikTezlik: tezlik.kunlik.toDecimalPlaces(2).toNumber(),
    bashorat: qanchaKunQoldi(qoldiq, tezlik, new Date(), CHEGARA_OMBOR),
    sarflashBirligi: r.sarflash_birligi,
    kamQoldiqChegaraM:
      r.kam_qoldiq_chegara_m === null ? null : Number(r.kam_qoldiq_chegara_m),
  };
}

// ─── 2 · Bu matoni kutayotgan buyurtmalar ─────────────────────────────────

export interface KutayotganPozitsiya {
  readonly pozitsiyaId: number;
  readonly buyurtmaId: number;
  readonly buyurtmaRaqam: string;
  readonly tartib: number;
  readonly mijozIsmi: string | null;
  readonly sana: Date;
  readonly kerakMiqdor: string;
  readonly birlik: string;
  /** Necha kundan beri kutmoqda */
  readonly kutmoqdaKun: number;
}

/**
 * ⚠️ XARID USTUVORLIGINI SHU BELGILAYDI.
 *
 *    «Qoldiq kam» degani hali shoshilinch degani emas. Shoshilinch
 *    — MIJOZ KUTAYOTGANI. Bu ro'yxat aynan shuni ko'rsatadi:
 *    mato kelishi bilan qaysi buyurtmalar ochiladi.
 */
export async function kutayotganBuyurtmalar(
  materialId: number,
  filialId: number,
  chegara = 20,
): Promise<KutayotganPozitsiya[]> {
  const q = await ulanishOl()<
    {
      pozitsiya_id: number;
      buyurtma_id: number;
      raqam: string;
      tartib: number;
      mijoz_ismi: string | null;
      sana: Date;
      kerak: string;
      birlik: string;
      kun: string;
    }[]
  >`
    SELECT p.id AS pozitsiya_id, b.id AS buyurtma_id, b.raqam, p.tartib,
           m.ism AS mijoz_ismi, b.sana,
           pm.hisoblangan_miqdor::text AS kerak, pm.birlik,
           (EXTRACT(EPOCH FROM (now() - b.sana)) / 86400)::text AS kun
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b            ON b.id = p.buyurtma_id
    JOIN pozitsiya_material pm ON pm.buyurtma_pozitsiya_id = p.id
    LEFT JOIN mijoz m          ON m.id = b.mijoz_id
    WHERE pm.material_id = ${materialId}
      AND b.ishlab_chiqaruvchi_filial_id = ${filialId}
      AND p.holat = 'MATERIALGA_KUTMOQDA'
      AND b.storno_sana IS NULL
    ORDER BY b.sana
    LIMIT ${chegara}`;

  return q.map((r) => ({
    pozitsiyaId: r.pozitsiya_id,
    buyurtmaId: r.buyurtma_id,
    buyurtmaRaqam: r.raqam,
    tartib: r.tartib,
    mijozIsmi: r.mijoz_ismi,
    sana: r.sana,
    kerakMiqdor: r.kerak,
    birlik: r.birlik,
    kutmoqdaKun: Math.round(Number(r.kun)),
  }));
}

// ─── 3 · Tannarx dinamikasi ───────────────────────────────────────────────

export interface TannarxNuqtasi {
  readonly sana: string;
  readonly kirimRaqam: string;
  readonly yetkazuvchi: string;
  /** Sarflash birligidagi tannarx — so'mda (0031 dan keyin doim so'm) */
  readonly tannarx: string;
  readonly valyuta: string;
}

/**
 * ⚠️ Mato dollarga olinadi, kurs esa o'zgaradi. «Sotuv narxini
 *    ko'tarish kerakmi» degan savolga javob shu qatorda.
 */
export async function tannarxDinamikasi(
  materialId: number,
  chegara = 12,
): Promise<TannarxNuqtasi[]> {
  const q = await ulanishOl()<
    {
      sana: string;
      raqam: string;
      yetkazuvchi: string;
      tannarx: string;
      valyuta: string;
    }[]
  >`
    SELECT k.sana::text, k.raqam, y.nom AS yetkazuvchi,
           kq.tannarx_birlik::text AS tannarx, k.valyuta
    FROM kirim_qator kq
    JOIN kirim k              ON k.id = kq.kirim_id
    JOIN yetkazib_beruvchi y  ON y.id = k.yetkazib_beruvchi_id
    WHERE kq.material_id = ${materialId}
      AND k.holat = 'FAOL'
    ORDER BY k.sana DESC, k.id DESC
    LIMIT ${chegara}`;

  // Eskisidan yangisiga — grafik va o'sish shu tartibda o'qiladi
  return q
    .map((r) => ({
      sana: r.sana,
      kirimRaqam: r.raqam,
      yetkazuvchi: r.yetkazuvchi,
      tannarx: r.tannarx,
      valyuta: r.valyuta,
    }))
    .reverse();
}

// ─── 4 · Ustama — faqat egaga ─────────────────────────────────────────────

export interface MaterialUstamasi {
  readonly sotuvNarx: string | null;
  /** Omborda turgan bo'laklarning o'rtacha tannarxi */
  readonly ortachaTannarx: string | null;
  /** Foizda — `null` bo'lsa hisoblab bo'lmaydi */
  readonly ustamaFoiz: number | null;
}

/**
 * ⚠️ TZ 11.10 — sotuvchiga TANNARX VA FOYDA KO'RSATILMAYDI.
 *    Chaqiruvchi ruxsatni tekshiradi; bu funksiya faqat hisoblaydi.
 */
export async function materialUstamasi(
  materialId: number,
  filialId: number,
): Promise<MaterialUstamasi> {
  const q = await ulanishOl()<
    { sotuv_narx: string | null; ortacha: string | null }[]
  >`
    SELECT m.sotuv_narx::text,
           (SELECT AVG(b.tannarx_birlik_snapshot)
              FROM bolak b
             WHERE b.material_id = m.id AND b.filial_id = ${filialId}
               AND b.faol = true AND b.holat IN ('BOSH','BAND')
               AND b.tannarx_valyuta_snapshot = 'SOM')::text AS ortacha
    FROM material m
    WHERE m.id = ${materialId}`;

  const r = q[0];
  const narx = r?.sotuv_narx ?? null;
  const tannarx = r?.ortacha ?? null;

  const foiz =
    narx !== null && tannarx !== null && Number(tannarx) > 0
      ? Math.round(((Number(narx) - Number(tannarx)) / Number(tannarx)) * 100)
      : null;

  return { sotuvNarx: narx, ortachaTannarx: tannarx, ustamaFoiz: foiz };
}

// ─── 5 · Yetkazib beruvchilar ─────────────────────────────────────────────

export interface MaterialYetkazuvchisi {
  readonly id: number;
  readonly nom: string;
  readonly kirimSoni: number;
  readonly oxirgiSana: string;
  readonly oxirgiNarx: string;
  readonly valyuta: string;
}

export async function materialYetkazuvchilari(
  materialId: number,
): Promise<MaterialYetkazuvchisi[]> {
  const q = await ulanishOl()<
    {
      id: number;
      nom: string;
      kirim_soni: number;
      oxirgi_sana: string;
      oxirgi_narx: string;
      valyuta: string;
    }[]
  >`
    SELECT DISTINCT ON (y.id)
           y.id, y.nom,
           (SELECT COUNT(*)::int FROM kirim_qator kq2
              JOIN kirim k2 ON k2.id = kq2.kirim_id
             WHERE kq2.material_id = ${materialId}
               AND k2.yetkazib_beruvchi_id = y.id
               AND k2.holat = 'FAOL') AS kirim_soni,
           k.sana::text        AS oxirgi_sana,
           kq.narx_birlik::text AS oxirgi_narx,
           k.valyuta
    FROM kirim_qator kq
    JOIN kirim k             ON k.id = kq.kirim_id
    JOIN yetkazib_beruvchi y ON y.id = k.yetkazib_beruvchi_id
    WHERE kq.material_id = ${materialId} AND k.holat = 'FAOL'
    ORDER BY y.id, k.sana DESC, k.id DESC`;

  return q.map((r) => ({
    id: r.id,
    nom: r.nom,
    kirimSoni: r.kirim_soni,
    oxirgiSana: r.oxirgi_sana,
    oxirgiNarx: r.oxirgi_narx,
    valyuta: r.valyuta,
  }));
}

// ─── 6 · Yo'ldagi miqdor ──────────────────────────────────────────────────

/**
 * TZ 20.7.4 — boshqa filialdan jo'natilgan, hali qabul qilinmagan.
 * Qoldiqqa QO'SHILMAYDI, lekin xarid qarorida bilinishi kerak.
 */
export async function yoldaMiqdori(
  materialId: number,
  filialId: number,
): Promise<{ miqdor: number; bolakSoni: number }> {
  const q = await ulanishOl()<{ miqdor: string | null; soni: number }[]>`
    SELECT SUM(CASE WHEN turi = 'DONA'
                    THEN COALESCE(miqdor, 0)
                    ELSE COALESCE(eni_m, 0) * COALESCE(boyi_m, 0) END)::text AS miqdor,
           COUNT(*)::int AS soni
    FROM bolak
    WHERE material_id = ${materialId} AND filial_id = ${filialId}
      AND faol = true AND holat = 'YOLDA'`;

  return { miqdor: Number(q[0]?.miqdor ?? 0), bolakSoni: q[0]?.soni ?? 0 };
}
