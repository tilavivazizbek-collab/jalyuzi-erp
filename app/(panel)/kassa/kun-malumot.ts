/**
 * Kun yopish nazorati — tarix va yopilmagan kunlar. Kassa auditi 2026-10-10.
 *
 * ⚠️ NEGA: kun yopilganda farq (kamomad / ortiqcha) `kassa_kun` ga
 *    yozilardi, lekin uni hech qayerda ro'yxat qilib ko'rib bo'lmasdi —
 *    faqat bitta sanani tanlab, bitta kassani ochib. «Qaysi kassir oy
 *    davomida qancha kam topshirdi» degan savolga javob yo'q edi.
 *    Yopilmay qolgan kun ham sezilmasdi.
 *
 * ⚠️ Faqat NAQD kassa (12.17 — kartadagi pul bank hisobidan tekshiriladi).
 */

import { ulanishOl } from '@/lib/db';
import { VAQT_ZONASI } from '@/lib/domain/sana';

export interface YopilganKun {
  readonly id: number;
  readonly sana: string;
  readonly kassaId: number;
  readonly kassaNomi: string;
  readonly valyuta: string;
  readonly hisoblangan: string;
  readonly sanaldi: string | null;
  /** sanaldi − hisoblangan: manfiy — kamomad, musbat — ortiqcha */
  readonly farq: string | null;
  readonly kim: string | null;
  readonly izoh: string | null;
  readonly yopiqmi: boolean;
  readonly qaytaOchilgan: boolean;
}

export async function yopilishTarixi(
  kassaIdlar: readonly number[],
  dan: string,
  gacha: string,
): Promise<YopilganKun[]> {
  if (kassaIdlar.length === 0) return [];
  return ulanishOl()<YopilganKun[]>`
    SELECT kk.id, kk.sana::text, kk.kassa_id AS "kassaId", k.nom AS "kassaNomi", k.valyuta,
           kk.hisoblangan::text, kk.sanaldi::text, kk.farq::text,
           x.ism AS kim, kk.izoh,
           (kk.yopildi IS NOT NULL) AS "yopiqmi",
           (kk.qayta_ochildi IS NOT NULL) AS "qaytaOchilgan"
    FROM kassa_kun kk
    JOIN kassa k ON k.id = kk.kassa_id
    LEFT JOIN xodim x ON x.id = kk.yopdi_id
    WHERE kk.kassa_id = ANY(${kassaIdlar as number[]})
      AND kk.sana BETWEEN ${dan}::date AND ${gacha}::date
    ORDER BY kk.sana DESC, k.nom`;
}

export interface YopilmaganKun {
  readonly sana: string;
  readonly kassaId: number;
  readonly kassaNomi: string;
  readonly yozuvSoni: number;
}

/**
 * Harakat bo'lgan, lekin yopilmagan kunlar.
 *
 * ⚠️ BUGUN kirmaydi — kun hali tugamagan. Harakatsiz kun ham kirmaydi:
 *    yopiladigan narsa yo'q (12.17 — kun yopish majburiy emas, bu faqat
 *    nazorat ogohi).
 */
export async function yopilmaganKunlar(
  kassaIdlar: readonly number[],
  dan: string,
  bugun: string,
): Promise<YopilmaganKun[]> {
  if (kassaIdlar.length === 0) return [];
  return ulanishOl()<YopilmaganKun[]>`
    SELECT t.sana::text, t.kassa_id AS "kassaId", k.nom AS "kassaNomi", t.n AS "yozuvSoni"
    FROM (
      SELECT y.kassa_id, (y.sana AT TIME ZONE ${VAQT_ZONASI})::date AS sana, COUNT(*)::int AS n
      FROM kassa_yozuv y
      WHERE y.kassa_id = ANY(${kassaIdlar as number[]})
        AND (y.sana AT TIME ZONE ${VAQT_ZONASI})::date >= ${dan}::date
        AND (y.sana AT TIME ZONE ${VAQT_ZONASI})::date < ${bugun}::date
      GROUP BY 1, 2
    ) t
    JOIN kassa k ON k.id = t.kassa_id
    WHERE NOT EXISTS (
      SELECT 1 FROM kassa_kun kk
      WHERE kk.kassa_id = t.kassa_id AND kk.sana = t.sana AND kk.yopildi IS NOT NULL
    )
    ORDER BY t.sana DESC, k.nom`;
}
