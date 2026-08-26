import 'server-only';

/**
 * app/(panel)/boshqaruv/malumot.ts — TZ 11 (dastlabki ko'rsatkichlar)
 *
 * ⚠️ Bu to'liq dashboard EMAS — u 8-bosqichda quriladi (TZ 11).
 *    Hozircha egasi ertalab ochganda ko'radigan to'rt raqam.
 *
 * ⚠️ 2.2-invariant — hech qaysi qiymat SAQLANMAYDI, hammasi
 *    `SUM()` bilan hisoblanadi.
 *
 * ⚠️ Q-25 — faqat O'Z filiali. Barcha filial kesimi 20.6.2 da.
 */

import { ulanishOl } from '@/lib/db';

export interface KimIshlamoqda {
  readonly ism: string;
  readonly filialNomi: string;
}

export async function kimIshlamoqda(
  xodimId: number,
  filialId: number,
): Promise<KimIshlamoqda> {
  const q = await ulanishOl()<{ ism: string; filial_nomi: string }[]>`
    SELECT x.ism, f.nom AS filial_nomi
    FROM xodim x
    JOIN filial f ON f.id = x.filial_id
    WHERE x.id = ${xodimId}`;

  return {
    ism: q[0]?.ism ?? '—',
    filialNomi: q[0]?.filial_nomi ?? `#${String(filialId)}`,
  };
}

export interface KunKorsatkichlari {
  /** Bugun kassaga tushgan pul (12.4) */
  readonly bugungiTushum: string;
  /** Hozir kassalarda turgan pul */
  readonly kassaQoldigi: string;
  /** Yopilmagan buyurtmalar soni (8.3) */
  readonly ochiqBuyurtma: number;
  /** Mijozlarning jami qarzi (6.8) */
  readonly mijozQarzi: string;
}

/**
 * Ertalabki to'rt raqam.
 *
 * ⚠️ To'rttasi ham BITTA so'rovda olinadi. Alohida so'ralsa
 *    to'rt marta tarmoqqa chiqilardi va sahifa sekinlashardi —
 *    masofadagi bazada bu sezilarli (T-08).
 */
export async function kunKorsatkichlari(
  filialId: number,
): Promise<KunKorsatkichlari> {
  const q = await ulanishOl()<
    {
      bugungi_tushum: string;
      kassa_qoldigi: string;
      ochiq_buyurtma: number;
      mijoz_qarzi: string;
    }[]
  >`
    SELECT
      COALESCE((
        SELECT SUM(y.summa) FROM kassa_yozuv y
        JOIN kassa k ON k.id = y.kassa_id
        WHERE k.filial_id = ${filialId}
          AND y.valyuta = 'SOM' AND y.summa > 0
          AND y.sana::date = CURRENT_DATE
      ), 0)::text AS bugungi_tushum,

      COALESCE((
        SELECT SUM(y.summa) FROM kassa_yozuv y
        JOIN kassa k ON k.id = y.kassa_id
        WHERE k.filial_id = ${filialId} AND y.valyuta = 'SOM'
          AND k.faol = true
      ), 0)::text AS kassa_qoldigi,

      COALESCE((
        SELECT COUNT(DISTINCT b.id)::int
        FROM buyurtma b
        JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
        WHERE b.sotgan_filial_id = ${filialId}
          AND p.holat NOT IN ('TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR')
      ), 0) AS ochiq_buyurtma,

      COALESCE((
        SELECT SUM(h.summa) FROM mijoz_harakat h
        WHERE h.filial_id = ${filialId} AND h.valyuta = 'SOM'
      ), 0)::text AS mijoz_qarzi`;

  const r = q[0];

  return {
    bugungiTushum: r?.bugungi_tushum ?? '0',
    kassaQoldigi: r?.kassa_qoldigi ?? '0',
    ochiqBuyurtma: r?.ochiq_buyurtma ?? 0,
    mijozQarzi: r?.mijoz_qarzi ?? '0',
  };
}
