/**
 * app/(panel)/yetkazib/malumot.ts — TZ 9.7 · 9.8 · 9.9 · 9.10
 *
 * Yetkazib beruvchi kartochkasining so'rovlari.
 *
 * ⚠️ Kartochka MIJOZ kartochkasi (6.7) bilan bir xil naqshda:
 *    tepada ikki blok, pastda tablar. Tarkib boshqacha.
 *
 * ⚠️ 2.2-invariant — qarz HECH QAYERDA saqlanmaydi:
 *    `yetkazib_beruvchi_harakat` yig'indisidan chiqadi.
 *
 * ⚠️ 1.3-invariant — so'm va dollar ALOHIDA. Hech bir joyda bitta
 *    songa qo'shilmaydi.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { narxOzgarishi, type NarxNuqtasi as SolishtirmaNuqta } from '@/lib/domain/hisobot/narx-dinamika';
import type { YetkazibHolati } from './taqsimot';

// ─── 9.7 · Sarlavha: ikki blok ────────────────────────────────────────────

export interface QarzBloki {
  /** Valyuta bo'yicha qarz — faqat noldan farqlilari */
  readonly qarzlar: readonly { valyuta: string; summa: string }[];
  /** 9.9 — hal qilinmagan da'volar soni */
  readonly ochiqDavo: number;
  /** Eng yaqin to'lov muddati — o'tib ketgani ham ko'rinadi */
  readonly yaqinMuddat: string | null;
  readonly muddatOtdimi: boolean;
}

export interface HamkorlikBloki {
  readonly hamkorSana: string | null;
  /** Jami kirim — valyuta bo'yicha alohida (1.3) */
  readonly jamiKirim: readonly { valyuta: string; summa: string }[];
  readonly hujjatSoni: number;
  /** Brak ulushi — foizda */
  readonly brakUlushi: number;
  readonly oxirgiKirim: string | null;
}

/**
 * TZ 9.9 — da'vo OCHIQ: kirim qatorida «qaytariladi» defekti bor va shu
 * qator bo'yicha `DAVO` harakati hali yozilmagan. `kq` (kirim_qator) va
 * `k` (kirim) aliaslari kerak. Kartochka va dashboard — bitta shart.
 */
export function ochiqDavoSharti(sql: ReturnType<typeof ulanishOl>) {
  return sql`(k.holat = 'FAOL'
        AND kq.defekt_miqdor > 0
        AND kq.defekt_turi = 'QAYTARILADI'
        AND NOT EXISTS (
          SELECT 1 FROM yetkazib_beruvchi_harakat h
          WHERE h.turi = 'DAVO' AND h.manba_turi = 'kirim_qator'
            AND h.manba_id = kq.id
        ))`;
}

/**
 * TZ 9.7 — «Yuqorida ikki blok: qarzimiz va hamkorlik.»
 *
 * ⚠️ Da'vo OCHIQ deb hisoblanadi, agar kirim qatorida
 *    `defekt_turi = 'QAYTARILADI'` bo'lsa va shu kirim bo'yicha
 *    `DAVO` harakati hali yozilmagan bo'lsa (9.9).
 */
export async function sarlavhaBloklari(
  yetkazibBeruvchiId: number,
  /** 2026-10-07 — muddat FIFO taqsimotdan: faqat TO'LANMAGAN hujjatlar */
  holat: YetkazibHolati,
): Promise<{ qarz: QarzBloki; hamkorlik: HamkorlikBloki }> {
  const sql = ulanishOl();

  const [qarzlar, davo, hamkor, jami] = await Promise.all([
    sql<{ valyuta: string; summa: string }[]>`
      SELECT valyuta, SUM(summa)::text AS summa
      FROM yetkazib_beruvchi_harakat
      WHERE yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
      GROUP BY valyuta
      HAVING SUM(summa) <> 0
      ORDER BY valyuta`,

    sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n
      FROM kirim_qator kq
      JOIN kirim k ON k.id = kq.kirim_id
      WHERE k.yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
        AND ${ochiqDavoSharti(sql)}`,

    sql<{
      hamkor: string | null;
      oxirgi: string | null;
      hujjat: number;
      brak: string | null;
    }[]>`
      SELECT MIN(k.sana)::text AS hamkor,
             MAX(k.sana)::text AS oxirgi,
             COUNT(DISTINCT k.id)::int AS hujjat,
             (100.0 * COALESCE(SUM(kq.defekt_miqdor), 0)
              / NULLIF(SUM(kq.miqdor_kirim), 0))::numeric(6,2)::text AS brak
      FROM kirim k
      LEFT JOIN kirim_qator kq ON kq.kirim_id = k.id
      WHERE k.yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
        AND k.holat = 'FAOL'`,

    /**
     * 1.3 — jami kirim valyuta bo'yicha alohida.
     *
     * ⚠️ JURNALDAGI `XARID` dan (storno teskari yozuvi bilan): ilgari
     *    `miqdor × narx` edi — metrga narxlangan rulonda rulon SONIGA
     *    ko'paytirilardi (P-46).
     */
    sql<{ valyuta: string; summa: string }[]>`
      SELECT valyuta, SUM(summa)::numeric(14,2)::text AS summa
      FROM yetkazib_beruvchi_harakat
      WHERE yetkazib_beruvchi_id = ${yetkazibBeruvchiId} AND turi = 'XARID'
      GROUP BY valyuta
      HAVING SUM(summa) <> 0
      ORDER BY valyuta`,
  ]);

  const h = hamkor[0];

  return {
    qarz: {
      qarzlar,
      ochiqDavo: davo[0]?.n ?? 0,
      yaqinMuddat: holat.muddat.yaqinMuddat,
      muddatOtdimi: holat.muddat.muddatOtganSoni > 0,
    },
    hamkorlik: {
      hamkorSana: h?.hamkor ?? null,
      jamiKirim: jami,
      hujjatSoni: h?.hujjat ?? 0,
      brakUlushi: Number(h?.brak ?? 0),
      oxirgiKirim: h?.oxirgi ?? null,
    },
  };
}

// ─── 9.7 · 1-tab · Qarz harakati ──────────────────────────────────────────

export interface QarzQatori {
  readonly id: number;
  readonly sana: Date;
  readonly turi: string;
  readonly izoh: string | null;
  readonly summa: string;
  readonly valyuta: string;
  /** Shu qatorgacha bo'lgan balans */
  readonly oldingi: string;
  /** Shu qatordan keyingi balans */
  readonly keyingi: string;
  readonly kim: string;
}

/**
 * TZ 9.7 — «oldingi va keyingi balans» ustunlari bilan.
 *
 * ⚠️ Balans har valyuta ICHIDA o'sadi (1.3): so'm va dollar bitta
 *    ustunda qo'shilmaydi.
 */
export async function qarzHarakati(
  yetkazibBeruvchiId: number,
  chegara = 100,
): Promise<readonly QarzQatori[]> {
  /**
   * ⚠️ OXIRGI `chegara` ta — 2026-10-07 gacha ENG ESKI 100 ta chiqardi:
   *    uzoq hamkorda bugungi to'lov va kirim jadvalda umuman ko'rinmasdi.
   *    Balans HAMMA qatorlar ustida hisoblanadi, keyin kesiladi.
   */
  return ulanishOl()<QarzQatori[]>`
    SELECT * FROM (
      SELECT h.id, h.sana, h.turi, h.izoh, h.summa::text, h.valyuta,
             (SUM(h.summa) OVER (
                PARTITION BY h.valyuta ORDER BY h.sana, h.id
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
              ) - h.summa)::text AS oldingi,
             SUM(h.summa) OVER (
               PARTITION BY h.valyuta ORDER BY h.sana, h.id
               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
             )::text AS keyingi,
             COALESCE(x.ism, '—') AS kim
      FROM yetkazib_beruvchi_harakat h
      LEFT JOIN xodim x ON x.id = h.xodim_id
      WHERE h.yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
      ORDER BY h.sana DESC, h.id DESC
      LIMIT ${chegara}
    ) t
    ORDER BY t.sana, t.id`;
}

// ─── 9.7 · 2-tab · Kirimlar ───────────────────────────────────────────────

export interface KirimQatori {
  readonly id: number;
  readonly raqam: string;
  readonly sana: string;
  readonly tarkib: string;
  readonly summa: string;
  readonly valyuta: string;
  readonly tolangan: string;
  readonly qoldi: string;
  readonly muddat: string | null;
  readonly holat: string;
}

/**
 * TZ 9.7 — hujjatlar ro'yxati.
 *
 * ⚠️ 2026-10-07 — summa, to'langan va qoldi FIFO TAQSIMOTDAN
 *    (`./taqsimot.ts`). Ilgari: summa `miqdor × narx` (metrga narxda
 *    xato, P-46), «to'langan» faqat SHU hujjatga bog'langan kassa
 *    chiqimi — kartochkadan to'langan qarz hujjatni hech qachon yopmasdi.
 */
export async function kirimlar(
  yetkazibBeruvchiId: number,
  holat: YetkazibHolati,
  chegara = 50,
): Promise<readonly KirimQatori[]> {
  const q = await ulanishOl()<
    {
      id: number;
      raqam: string;
      sana: string;
      valyuta: string;
      holat: string;
      muddat: string | null;
      tarkib: string;
      yozilgan: string | null;
    }[]
  >`
    SELECT k.id, k.raqam, k.sana::text, k.valyuta, k.holat,
           k.tolov_muddati::text AS muddat,
           COALESCE(string_agg(DISTINCT m.nom, ', '), '—') AS tarkib,
           (SELECT SUM(h.summa) FROM yetkazib_beruvchi_harakat h
             WHERE h.manba_turi = 'kirim' AND h.manba_id = k.id
               AND h.turi = 'XARID')::text AS yozilgan
    FROM kirim k
    LEFT JOIN kirim_qator kq ON kq.kirim_id = k.id
    LEFT JOIN material m ON m.id = kq.material_id
    WHERE k.yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
    GROUP BY k.id
    ORDER BY k.sana DESC, k.id DESC
    LIMIT ${chegara}`;
  const bandlar = new Map(
    holat.taqsimot.bandlar.filter((b) => b.buyurtmaId !== null).map((b) => [b.buyurtmaId, b]),
  );
  return q.map((k) => {
    const b = bandlar.get(k.id);
    return {
      id: k.id,
      raqam: k.raqam,
      sana: k.sana,
      tarkib: k.tarkib,
      valyuta: k.valyuta,
      muddat: k.muddat,
      holat: k.holat,
      summa: b?.summa ?? new Decimal(k.yozilgan ?? 0).toFixed(2),
      // Storno qilingan hujjat qarz bandi emas — to'lov ham, qoldiq ham yo'q
      tolangan: b?.tolangan ?? '0.00',
      qoldi: b?.qolgan ?? '0.00',
    };
  });
}

// ─── 9.7 · 3-tab · To'lovlar ──────────────────────────────────────────────

export interface TolovQatori {
  readonly id: number;
  readonly sana: Date;
  readonly usul: string;
  readonly summa: string;
  readonly valyuta: string;
  readonly kurs: string | null;
  readonly hujjat: string | null;
  readonly kim: string;
}

/** TZ 9.7 — kassadan chiqqan to'lovlar (C1). */
export async function tolovlar(
  yetkazibBeruvchiId: number,
  chegara = 50,
): Promise<readonly TolovQatori[]> {
  return ulanishOl()<TolovQatori[]>`
    SELECT y.id, y.sana, ka.nom AS usul, ABS(y.summa)::text AS summa,
           y.valyuta, h.kurs_snapshot::text AS kurs,
           k.raqam AS hujjat, COALESCE(x.ism, '—') AS kim
    FROM kassa_yozuv y
    JOIN kassa ka ON ka.id = y.kassa_id
    LEFT JOIN xodim x ON x.id = y.xodim_id
    LEFT JOIN kirim k ON k.id = y.manba_id AND y.manba_turi = 'kirim'
    LEFT JOIN yetkazib_beruvchi_harakat h
           ON h.manba_turi = y.manba_turi AND h.manba_id = y.manba_id
          AND h.turi = 'TOLOV'
    WHERE y.kod = 'C1'
      AND (
        (y.manba_turi = 'yetkazib_beruvchi' AND y.manba_id = ${yetkazibBeruvchiId})
        OR (y.manba_turi = 'kirim' AND k.yetkazib_beruvchi_id = ${yetkazibBeruvchiId})
      )
    ORDER BY y.sana DESC, y.id DESC
    LIMIT ${chegara}`;
}

// ─── 9.8 · 4-tab · Materiallar va NARX TARIXI ─────────────────────────────

export interface NarxNuqtasi {
  readonly sana: string;
  readonly narx: string;
}

export interface MaterialQatori {
  readonly materialId: number;
  readonly nom: string;
  readonly valyuta: string;
  /** Oxirgi uchta kirim narxi — eskisidan yangisiga */
  readonly narxlar: readonly NarxNuqtasi[];
  /** Birinchi va oxirgi narx orasidagi o'zgarish, foizda */
  readonly ozgarish: number | null;
  /** Necha oyda — o'zgarish qanchalik tez ekanini ko'rsatadi */
  readonly oylar: number | null;
}

/**
 * TZ 9.8 — «har material yonida OXIRGI UCHTA kirim narxi va o'zgarish
 * foizi».
 *
 * > Ko'k mato: 1 872 000 → 1 950 000 → 2 100 000, 8 oyda +12.2%
 *
 * ⚠️ «Bu ma'lumot boshqa hech qayerdan chiqmaydi. Qaysi material
 *    qimmatlashayotgani va qaysi yetkazib beruvchi narxni ko'targani
 *    faqat shu yerda ko'rinadi.»
 */
export async function materialNarxTarixi(
  yetkazibBeruvchiId: number,
): Promise<readonly MaterialQatori[]> {
  const qatorlar = await ulanishOl()<
    {
      material_id: number;
      nom: string;
      valyuta: string;
      asos: string;
      sana: string;
      narx: string;
      tartib: number;
    }[]
  >`
    SELECT * FROM (
      SELECT kq.material_id, m.nom, k.valyuta, kq.narx_asosi AS asos,
             k.sana::text AS sana, kq.narx_birlik::text AS narx,
             ROW_NUMBER() OVER (
               PARTITION BY kq.material_id ORDER BY k.sana DESC, k.id DESC
             )::int AS tartib
      FROM kirim_qator kq
      JOIN kirim k ON k.id = kq.kirim_id
      JOIN material m ON m.id = kq.material_id
      WHERE k.yetkazib_beruvchi_id = ${yetkazibBeruvchiId} AND k.holat = 'FAOL'
    ) t
    WHERE t.tartib <= 3
    ORDER BY t.nom, t.tartib DESC`;

  const xarita = new Map<number, { nom: string; valyuta: string; nuqtalar: SolishtirmaNuqta[] }>();
  for (const q of qatorlar) {
    const m = xarita.get(q.material_id) ?? { nom: q.nom, valyuta: q.valyuta, nuqtalar: [] };
    // ⚠️ Kalit — asos va valyuta: rulon narxi metr narxi bilan solishtirilmaydi
    m.nuqtalar.push({ sana: q.sana, narx: q.narx, kalit: `${q.asos}:${q.valyuta}` });
    xarita.set(q.material_id, m);
  }

  return [...xarita.entries()].map(([materialId, m]) => {
    const o = narxOzgarishi(m.nuqtalar);
    return {
      materialId,
      nom: m.nom,
      // Oxirgi kirim valyutasi — ekranda narxlar shu bilan yoziladi
      valyuta: m.nuqtalar[m.nuqtalar.length - 1]?.kalit.split(':')[1] ?? m.valyuta,
      narxlar: m.nuqtalar.map((n) => ({ sana: n.sana, narx: n.narx })),
      ozgarish: o.foiz,
      oylar: o.oylar,
    };
  });
}

// ─── 9.9 · 5-tab · Brak va da'volar ───────────────────────────────────────

export interface DavoQatori {
  /** ⚠️ Tugma SHU qatorga bog'lanadi (9.9) */
  readonly qatorId: number;
  readonly kirimId: number;
  readonly kirimRaqam: string;
  readonly sana: string;
  readonly materialNom: string;
  readonly miqdor: string;
  readonly turi: string;
  readonly summa: string;
  readonly valyuta: string;
  /** Hal qilinganmi — `DAVO` harakati yozilganmi */
  readonly yopilgan: boolean;
}

/**
 * TZ 9.9 — «Kirimda "qaytariladi" deb belgilangan defekt hal
 * qilinmaguncha shu tabda turadi.»
 *
 * ⚠️ `HISOBDAN_CHIQADI` turidagi defekt ham ko'rinadi, lekin u
 *    da'vo emas — zarar bizda. Ular tarix sifatida qoladi.
 */
export async function davolar(
  yetkazibBeruvchiId: number,
): Promise<readonly DavoQatori[]> {
  return ulanishOl()<DavoQatori[]>`
    SELECT kq.id AS "qatorId", k.id AS "kirimId", k.raqam AS "kirimRaqam",
           k.sana::text AS sana,
           m.nom AS "materialNom", kq.defekt_miqdor::text AS miqdor,
           kq.defekt_turi AS turi, k.valyuta,
           (kq.defekt_miqdor * kq.narx_birlik)::numeric(14,2)::text AS summa,
           EXISTS (
             SELECT 1 FROM yetkazib_beruvchi_harakat h
             WHERE h.turi = 'DAVO' AND h.manba_turi = 'kirim_qator'
               AND h.manba_id = kq.id
           ) AS yopilgan
    FROM kirim_qator kq
    JOIN kirim k ON k.id = kq.kirim_id
    JOIN material m ON m.id = kq.material_id
    WHERE k.yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
      AND k.holat = 'FAOL' AND kq.defekt_miqdor > 0
    ORDER BY k.sana DESC, kq.id`;
}

// ─── 9.7 · 6-tab · Izohlar ────────────────────────────────────────────────

export interface IzohQatori {
  readonly id: number;
  readonly matn: string;
  readonly sana: Date;
  readonly kim: string;
}

/**
 * TZ 9.7 — «erkin matn, xodim va sana bilan».
 *
 * ⚠️ O'chirilgan izoh ko'rsatilmaydi, lekin bazada qoladi (2.1):
 *    kim nima deganini keyin inkor qilib bo'lmasin.
 */
export async function izohlar(
  yetkazibBeruvchiId: number,
  chegara = 50,
): Promise<readonly IzohQatori[]> {
  return ulanishOl()<IzohQatori[]>`
    SELECT i.id, i.matn, i.yaratildi AS sana, COALESCE(x.ism, '—') AS kim
    FROM yetkazib_beruvchi_izoh i
    LEFT JOIN xodim x ON x.id = i.yaratdi_id
    WHERE i.yetkazib_beruvchi_id = ${yetkazibBeruvchiId} AND i.faol = true
    ORDER BY i.yaratildi DESC, i.id DESC
    LIMIT ${chegara}`;
}
