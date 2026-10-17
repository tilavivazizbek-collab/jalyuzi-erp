/**
 * app/(panel)/mijoz/malumot.ts — mijozlar RO'YXATI so'rovlari · TZ 6.1 · 11.6
 *
 * ⚠️ EGASI AUDITI 2026-10-06. Ilgari ro'yxat:
 *    - hamma mijozni bitta sahifaga yuklardi (qidiruvsiz, sahifasiz)
 *    - QARZNI ko'rsatmasdi — limit bor edi, qarzning o'zi yo'q
 *    Kimdan pul olish kerakligini bilish uchun har kartochkani ochish
 *    kerak edi.
 *
 * ⚠️ So'rov SHU YERDA, sahifada emas — sahifa ichidagi SQL ni hech
 *    qanday test ko'rmaydi (2026-08-29 xatosi).
 *
 * ⚠️ 2.2-invariant — qarz saqlanmaydi, `mijoz_harakat` dan SUM().
 *    Valyutalar alohida (1.3); ikkalasini qo'shadigan yagona joy —
 *    limit va saralash, JORIY kursda.
 */

import { ulanishOl } from '@/lib/db';
import { muddatOtganQarz, qarzniTaqsimla } from '@/lib/domain/qarz-taqsimot';
import { qarzdorlarJurnali } from './qarz-malumot';

export const SAHIFA_HAJMI = 50;

export const HOLAT_FILTRLARI = {
  qarzdor: 'Qarzdorlar',
  limit: 'Limitdan oshgan',
  muddat: "To'lov muddati o'tgan",
  avans: 'Avansi bor',
  uxlagan: 'Uzoq vaqt olmagan',
  xaridsiz: 'Hali xarid qilmagan',
  /** 11.11 — bot orqali eslatma va chek borolmaydi (2026-10-17) */
  telegramsiz: 'Telegramsiz',
} as const;
export type HolatFiltri = keyof typeof HOLAT_FILTRLARI;

/**
 * Segment — mijozning HOZIRGI holati (egasi auditi, 4-bosqich).
 *
 * ⚠️ Saqlanmaydi — har safar sotuv tarixidan hisoblanadi:
 *    YANGI     — birinchi xaridi 30 kun ichida
 *    TOP       — sotuvi bo'yicha eng yuqori 20% (kamida 3 xarid)
 *    FAOL      — odatiy ritmida olyapti
 *    UXLAGAN   — oxirgi xariddan odatdagi oraliqning 2 barobaridan
 *                (kamida 60 kun) ko'p o'tdi — qo'ng'iroq kerak
 *    YOQOTILGAN — 180 kundan ko'p olmagan
 *    XARIDSIZ  — hali xarid qilmagan
 */
export const SEGMENT_NOMI = {
  TOP: 'Eng yaxshi',
  YANGI: 'Yangi',
  FAOL: 'Faol',
  UXLAGAN: 'Uxlab qolgan',
  YOQOTILGAN: "Yo'qotilgan",
  XARIDSIZ: 'Xaridsiz',
} as const;
export type Segment = keyof typeof SEGMENT_NOMI;

export const SARALASHLAR = {
  ism: 'Ism bo‘yicha',
  qarz: 'Qarzi ko‘p',
  oxirgi: 'Yaqinda olgan',
  sotuv: 'Ko‘p olgan',
} as const;
export type Saralash = keyof typeof SARALASHLAR;

export interface RoyxatFiltri {
  readonly qidiruv: string;
  readonly holat: HolatFiltri | null;
  readonly segment: Segment | null;
  readonly guruhId: number | null;
  readonly turiId: number | null;
  readonly masulId: number | null;
  readonly saralash: Saralash;
  readonly ochirilganlar: boolean;
  /** 1 dan boshlanadi */
  readonly sahifa: number;
}

export interface RoyxatQatori {
  readonly id: number;
  readonly ism: string;
  readonly tashkilot_nomi: string | null;
  readonly telefon: string | null;
  readonly telegram_id: number | null;
  readonly shaxs_turi: string;
  readonly turi_nomi: string | null;
  readonly guruh_nomi: string | null;
  readonly masul_ismi: string | null;
  readonly qarz_limiti: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly qarz_som: string;
  readonly qarz_usd: string;
  readonly sotuv_som: string;
  readonly sotuv_usd: string;
  readonly oxirgi: Date | null;
  readonly limit_oshgan: boolean;
  readonly segment: Segment;
  readonly faol: boolean;
}

export interface RoyxatNatijasi {
  readonly qatorlar: readonly RoyxatQatori[];
  readonly jamiSoni: number;
  /** Filtrdagi BARCHA mijozlarning qarzi — faqat shu sahifaniki emas */
  readonly jamiQarzSom: string;
  readonly jamiQarzUsd: string;
}

/** `%` va `_` foydalanuvchi matnida maxsus belgi bo'lib qolmasin */
const likeXavfsiz = (x: string): string => x.replace(/[\\%_]/g, (b) => `\\${b}`);

export type Parametrlar = Record<string, string | string[] | undefined>;

const bir = (sp: Parametrlar, k: string): string => {
  const v = sp[k];
  return typeof v === 'string' ? v : '';
};
const id = (x: string): number | null => {
  const n = Number(x);
  return x !== '' && Number.isSafeInteger(n) && n > 0 ? n : null;
};
const kalitmi = <T extends string>(x: string, r: Record<T, string>): x is T =>
  Object.prototype.hasOwnProperty.call(r, x);

/** Filtrni URL dan o'qiydi — noto'g'ri qiymat jimgina tashlanadi */
export function filtrniOqi(sp: Parametrlar): RoyxatFiltri {
  const holat = bir(sp, 'holat');
  const segment = bir(sp, 'segment');
  const saralash = bir(sp, 'saralash');
  const sahifa = Number(bir(sp, 'sahifa'));
  return {
    qidiruv: bir(sp, 'q').slice(0, 100),
    holat: kalitmi<HolatFiltri>(holat, HOLAT_FILTRLARI) ? holat : null,
    segment: kalitmi<Segment>(segment, SEGMENT_NOMI) ? segment : null,
    guruhId: id(bir(sp, 'guruh')),
    turiId: id(bir(sp, 'tur')),
    masulId: id(bir(sp, 'masul')),
    saralash: kalitmi<Saralash>(saralash, SARALASHLAR) ? saralash : 'ism',
    ochirilganlar: bir(sp, 'ochirilgan') === '1',
    sahifa: Number.isSafeInteger(sahifa) && sahifa > 0 ? sahifa : 1,
  };
}

export async function mijozlarRoyxati(
  f: RoyxatFiltri,
  kurs: string | null,
  /** Eksportda — hammasi, sahifasiz */
  chegara: number = SAHIFA_HAJMI,
): Promise<RoyxatNatijasi> {
  const sql = ulanishOl();
  const q = f.qidiruv.trim();
  const matn = `%${likeXavfsiz(q)}%`;
  /**
   * ⚠️ TELEFON RAQAMLARI BO'YICHA. Bazada `998901234567` turadi;
   *    «90 123 45» yoki «+998 90» deb yozilsa ham topilsin.
   */
  const raqamlar = q.replace(/\D/g, '');
  const telefonBilan = raqamlar.length >= 3 ? `%${raqamlar}%` : null;
  /** Kurs yo'q — dollar qarzi limit va saralashda 0 deb olinadi */
  const k = kurs ?? '0';
  /**
   * ⚠️ «Muddati o'tgan» SQL da hisoblanMAYDI — kartochka bilan bir xil
   *    bo'lishi uchun TAQSIMOTDAN (`muddatiOtganlar`). Faqat shu filtr
   *    tanlanganda hisoblanadi.
   */
  const muddatIdlar = f.holat === 'muddat' ? [...(await muddatiOtganlar()).keys()] : [];

  const filtr = sql`
    WHERE r.faol = ${!f.ochirilganlar}
    ${
      q === ''
        ? sql``
        : sql`AND (r.ism ILIKE ${matn} OR r.tashkilot_nomi ILIKE ${matn}
                   OR r.inn ILIKE ${matn}
                   ${telefonBilan === null ? sql`` : sql`OR r.telefon LIKE ${telefonBilan}`})`
    }
    ${f.guruhId === null ? sql`` : sql`AND r.mijoz_guruh_id = ${f.guruhId}`}
    ${f.turiId === null ? sql`` : sql`AND r.mijoz_turi_id = ${f.turiId}`}
    ${f.masulId === null ? sql`` : sql`AND r.masul_xodim_id = ${f.masulId}`}
    ${f.segment === null ? sql`` : sql`AND r.segment = ${f.segment}`}
    ${
      f.holat === 'qarzdor'
        ? sql`AND (r.qarz_som > 0 OR r.qarz_usd > 0)`
        : f.holat === 'limit'
          ? sql`AND r.limit_oshgan`
          : f.holat === 'muddat'
            ? sql`AND r.id = ANY(${muddatIdlar})`
            : f.holat === 'avans'
              ? sql`AND (r.qarz_som < 0 OR r.qarz_usd < 0)`
              : f.holat === 'uxlagan'
                ? sql`AND r.segment IN ('UXLAGAN', 'YOQOTILGAN')`
                : f.holat === 'xaridsiz'
                  ? sql`AND r.oxirgi IS NULL`
                  : f.holat === 'telegramsiz'
                    ? sql`AND r.telegram_id IS NULL`
                    : sql``
    }`;

  const tartib =
    f.saralash === 'qarz'
      ? sql`ORDER BY r.qarz_somda DESC, r.ism`
      : f.saralash === 'oxirgi'
        ? sql`ORDER BY r.oxirgi DESC NULLS LAST, r.ism`
        : f.saralash === 'sotuv'
          ? sql`ORDER BY r.sotuv_somda DESC, r.ism`
          : sql`ORDER BY r.ism`;

  const qatorlar = await sql<(RoyxatQatori & { jami_soni: number; jami_som: string; jami_usd: string })[]>`
    WITH h AS (
      SELECT mijoz_id,
             COALESCE(SUM(summa) FILTER (WHERE valyuta = 'SOM'), 0) AS qarz_som,
             COALESCE(SUM(summa) FILTER (WHERE valyuta = 'USD'), 0) AS qarz_usd,
             COALESCE(SUM(summa) FILTER (WHERE turi = 'SOTUV' AND valyuta = 'SOM'), 0) AS sotuv_som,
             COALESCE(SUM(summa) FILTER (WHERE turi = 'SOTUV' AND valyuta = 'USD'), 0) AS sotuv_usd,
             MIN(sana) FILTER (WHERE turi = 'SOTUV' AND summa > 0) AS birinchi,
             MAX(sana) FILTER (WHERE turi = 'SOTUV' AND summa > 0) AS oxirgi,
             COUNT(*) FILTER (WHERE turi = 'SOTUV' AND summa > 0) AS xarid_soni
      FROM mijoz_harakat
      GROUP BY mijoz_id
    ),
    r AS (
      SELECT m.id, m.ism, m.tashkilot_nomi, m.inn, m.telefon, m.telegram_id, m.shaxs_turi,
             m.mijoz_guruh_id, m.mijoz_turi_id, m.masul_xodim_id, m.faol,
             m.qarz_limiti::text AS qarz_limiti, m.tolov_muddati_kun,
             g.nom AS guruh_nomi, t.nom AS turi_nomi, x.ism AS masul_ismi,
             COALESCE(h.qarz_som, 0) AS qarz_som,
             COALESCE(h.qarz_usd, 0) AS qarz_usd,
             COALESCE(h.sotuv_som, 0) AS sotuv_som,
             COALESCE(h.sotuv_usd, 0) AS sotuv_usd,
             h.oxirgi,
             COALESCE(h.qarz_som, 0) + COALESCE(h.qarz_usd, 0) * ${k}::numeric AS qarz_somda,
             COALESCE(h.sotuv_som, 0) + COALESCE(h.sotuv_usd, 0) * ${k}::numeric AS sotuv_somda,
             (m.qarz_limiti IS NOT NULL
               AND COALESCE(h.qarz_som, 0) + COALESCE(h.qarz_usd, 0) * ${k}::numeric
                   > m.qarz_limiti) AS limit_oshgan,
             CASE
               WHEN h.oxirgi IS NULL THEN 'XARIDSIZ'
               WHEN h.oxirgi < now() - interval '180 days' THEN 'YOQOTILGAN'
               WHEN h.oxirgi < now() - make_interval(days => GREATEST(60,
                      CASE WHEN h.xarid_soni > 1
                           THEN (2 * EXTRACT(EPOCH FROM (h.oxirgi - h.birinchi)) / 86400
                                 / (h.xarid_soni - 1))::int
                           ELSE 0 END)) THEN 'UXLAGAN'
               WHEN h.birinchi > now() - interval '30 days' THEN 'YANGI'
               WHEN h.xarid_soni >= 3 AND PERCENT_RANK() OVER (
                      ORDER BY COALESCE(h.sotuv_som, 0) + COALESCE(h.sotuv_usd, 0) * ${k}::numeric
                    ) >= 0.8 THEN 'TOP'
               ELSE 'FAOL'
             END AS segment
      FROM mijoz m
      LEFT JOIN h ON h.mijoz_id = m.id
      LEFT JOIN mijoz_guruh g ON g.id = m.mijoz_guruh_id AND g.faol = true
      LEFT JOIN mijoz_turi t ON t.id = m.mijoz_turi_id
      LEFT JOIN xodim x ON x.id = m.masul_xodim_id
    )
    SELECT r.id, r.ism, r.tashkilot_nomi, r.telefon, r.telegram_id, r.shaxs_turi,
           r.turi_nomi, r.guruh_nomi, r.masul_ismi, r.qarz_limiti, r.tolov_muddati_kun,
           r.qarz_som::text, r.qarz_usd::text, r.sotuv_som::text, r.sotuv_usd::text,
           r.oxirgi, r.limit_oshgan, r.segment, r.faol,
           COUNT(*) OVER ()::int AS jami_soni,
           (SUM(GREATEST(r.qarz_som, 0)) OVER ())::text AS jami_som,
           (SUM(GREATEST(r.qarz_usd, 0)) OVER ())::text AS jami_usd
    FROM r
    ${filtr}
    ${tartib}
    LIMIT ${chegara} OFFSET ${(Math.max(1, f.sahifa) - 1) * chegara}`;

  const birinchi = qatorlar[0];
  return {
    qatorlar,
    jamiSoni: birinchi?.jami_soni ?? 0,
    jamiQarzSom: birinchi?.jami_som ?? '0',
    jamiQarzUsd: birinchi?.jami_usd ?? '0',
  };
}

export interface MuddatOtgani {
  readonly som: string;
  readonly usd: string;
  readonly engEskiKun: number;
}

/**
 * To'lov muddati o'tgan mijozlar — TAQSIMOTDAN, kartochka bilan bir xil.
 * Muddat qo'yilmagan mijoz bu yerga tushmaydi.
 */
export async function muddatiOtganlar(
  bugun: Date = new Date(),
): Promise<Map<number, MuddatOtgani>> {
  const natija = new Map<number, MuddatOtgani>();
  for (const m of await qarzdorlarJurnali()) {
    if (m.tolovMuddatiKun === null) continue;
    const t = qarzniTaqsimla(m.jurnal);
    const s = muddatOtganQarz(t.bandlar, 'SOM', m.tolovMuddatiKun, bugun);
    const u = muddatOtganQarz(t.bandlar, 'USD', m.tolovMuddatiKun, bugun);
    if (s.engEskiKun === null && u.engEskiKun === null) continue;
    natija.set(m.mijozId, {
      som: s.summa,
      usd: u.summa,
      engEskiKun: Math.max(s.engEskiKun ?? 0, u.engEskiKun ?? 0),
    });
  }
  return natija;
}

export async function ochirilganSoni(): Promise<number> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM mijoz WHERE faol = false`;
  return q[0]?.n ?? 0;
}

/** Filtr ro'yxatlari uchun — guruh, tur, mas'ul xodim */
export async function filtrTanlovlari(): Promise<{
  guruhlar: { id: number; nom: string }[];
  turlar: { id: number; nom: string }[];
  xodimlar: { id: number; nom: string }[];
}> {
  const sql = ulanishOl();
  const [guruhlar, turlar, xodimlar] = await Promise.all([
    sql<{ id: number; nom: string }[]>`
      SELECT id, nom FROM mijoz_guruh WHERE faol = true ORDER BY nom`,
    sql<{ id: number; nom: string }[]>`
      SELECT id, nom FROM mijoz_turi WHERE faol = true ORDER BY tartib, nom`,
    sql<{ id: number; nom: string }[]>`
      SELECT id, ism AS nom FROM xodim WHERE faol = true ORDER BY ism`,
  ]);
  return { guruhlar, turlar, xodimlar };
}
