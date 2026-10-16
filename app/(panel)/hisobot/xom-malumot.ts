/**
 * TZ 11.2 — eksportning «Xom ma'lumot» varaqlari. 2026-10-16
 *
 * «Har qator alohida, guruhlanmagan, filtrsiz» — foydalanuvchi Excel'da
 * o'zicha kesadi.
 *
 * ⚠️ Pul ustunlari BITTA JOYDAN — pozitsiyaNatijasiUstunlari (ekrandagi
 *    hisobot bilan bir xil raqam chiqsin).
 */

import { ulanishOl } from '@/lib/db';
import type { Davr } from '@/lib/domain/hisobot/davr';
import { pozitsiyaNatijasiUstunlari } from '@/lib/amal/filial-harakat';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { pozitsiyaIshHaqimi, xarajatKursJoin, xarajatSomda } from './malumot';
import { bolakQiymatiIfodasi } from '../ombor/malumot';

export interface SotuvXomQatori {
  readonly raqam: string;
  readonly sana: Date;
  readonly sotuvchi: string | null;
  readonly mijoz: string | null;
  readonly tur: string | null;
  readonly soni: number;
  readonly holat: string;
  readonly valyuta: string;
  readonly tushum: string;
  readonly tannarx: string;
  readonly ishHaqi: string;
}

/** Sotgan filialdagi davr buyurtmalarining HAR pozitsiyasi (bekor va rad etilgandan tashqari) */
export async function sotuvXom(filialId: number, davr: Davr): Promise<SotuvXomQatori[]> {
  const sql = ulanishOl();
  const q = await sql<
    {
      raqam: string;
      sana: Date;
      sotuvchi: string | null;
      mijoz: string | null;
      tur: string | null;
      soni: number;
      holat: string;
      valyuta: string;
      tushum: string;
      tannarx: string;
      ish_haqi: string;
    }[]
  >`
    SELECT b.raqam, b.sana, x.ism AS sotuvchi, m.ism AS mijoz, t.nom AS tur,
           p.soni, p.holat, b.valyuta,
           ${pozitsiyaNatijasiUstunlari(sql)}
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    LEFT JOIN xodim x ON x.id = b.sotuvchi_id
    LEFT JOIN mijoz m ON m.id = b.mijoz_id
    LEFT JOIN mahsulot_tur t ON t.id = p.mahsulot_tur_id
    WHERE b.sotgan_filial_id = ${filialId}
      AND b.sana >= ${davr.boshi} AND b.sana < ${davr.oxiri}
      AND p.holat NOT IN ('BEKOR','RAD_ETILGAN')
    ORDER BY b.sana, b.id, p.tartib
    LIMIT 50000`;
  return q.map((r) => ({
    raqam: r.raqam,
    sana: r.sana,
    sotuvchi: r.sotuvchi,
    mijoz: r.mijoz,
    tur: r.tur,
    soni: r.soni,
    holat: r.holat,
    valyuta: r.valyuta,
    tushum: r.tushum,
    tannarx: r.tannarx,
    ishHaqi: r.ish_haqi,
  }));
}

export interface XarajatXomQatori {
  readonly sana: string;
  readonly modda: string;
  readonly turi: string | null;
  readonly summa: string;
  readonly valyuta: string;
  /** Dollarda — qo'llangan kurs; so'mda `null` */
  readonly kurs: string | null;
  /** So'mdagi summa; dollarda kursi yo'q bo'lsa `null` (hisobotga kirmagan) */
  readonly somda: string | null;
  readonly kassadan: boolean;
  /**
   * Pozitsiya ish haqi foyda-zararda TANNARX qatorida (sotilgan davrda),
   * xarajatlar ro'yxatida emas — ikki marta sanalmasin (11.4.1).
   */
  readonly tannarxda: boolean;
  readonly xodim: string | null;
  readonly izoh: string | null;
}

/** TZ 11.4 — davrdagi HAR xarajat yozuvi (storno juftlari ham — ular nolga chiqadi). */
export async function xarajatXom(filialId: number, davr: Davr): Promise<XarajatXomQatori[]> {
  const sql = ulanishOl();
  const q = await sql<
    {
      sana: string;
      modda: string;
      turi: string | null;
      summa: string;
      valyuta: string;
      kurs: string | null;
      somda: string | null;
      kassadan: boolean;
      tannarxda: boolean;
      xodim: string | null;
      izoh: string | null;
    }[]
  >`
    SELECT x.sana::text, x.modda, t.nom AS turi, x.summa::text, x.valyuta,
           k.qiymat::text AS kurs,
           ${xarajatSomda(sql)}::numeric(14,2)::text AS somda,
           (x.kassa_yozuv_id IS NOT NULL) AS kassadan,
           ${pozitsiyaIshHaqimi(sql)} AS tannarxda,
           xd.ism AS xodim, x.izoh
    FROM xarajat x
    ${xarajatKursJoin(sql)}
    LEFT JOIN xarajat_turi t ON t.id = x.xarajat_turi_id
    LEFT JOIN xodim xd ON xd.id = x.xodim_id
    WHERE x.filial_id = ${filialId}
      AND x.sana >= (${davr.boshi}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
      AND x.sana < (${davr.oxiri}::timestamptz AT TIME ZONE ${VAQT_ZONASI})::date
    ORDER BY x.sana, x.id
    LIMIT 50000`;
  return q;
}

export interface BolakXomQatori {
  readonly kod: string;
  readonly material: string;
  readonly birlik: string;
  readonly turi: string;
  readonly ochilgan: boolean;
  readonly eniM: string | null;
  readonly boyiM: string | null;
  readonly miqdor: string | null;
  readonly holat: string;
  /** So'mda — ekrandagi bilan bir ifoda (bolakQiymatiIfodasi); dollarda qotgani `null` */
  readonly qiymat: string | null;
  readonly valyuta: string;
  readonly yoshKun: number;
  readonly joy: string | null;
  readonly kirim: string | null;
}

/** TZ 11.7 — omborda turgan HAR bo'lak (bo'sh, band, yo'lda). */
export async function omborXom(filialId: number): Promise<BolakXomQatori[]> {
  const sql = ulanishOl();
  return sql<BolakXomQatori[]>`
    SELECT b.kod, m.nom AS material, m.sarflash_birligi AS birlik, b.turi, b.ochilgan,
           b.eni_m::text AS "eniM", b.boyi_m::text AS "boyiM", b.miqdor::text AS miqdor, b.holat,
           CASE WHEN b.tannarx_valyuta_snapshot = 'SOM'
                THEN ${bolakQiymatiIfodasi(sql)}::numeric(14,2)::text END AS qiymat,
           b.tannarx_valyuta_snapshot AS valyuta,
           EXTRACT(DAY FROM now() - b.yaratildi)::int AS "yoshKun",
           j.nom AS joy, k.raqam AS kirim
    FROM bolak b
    JOIN material m ON m.id = b.material_id
    LEFT JOIN ombor_joy j ON j.id = b.joy_id
    LEFT JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    LEFT JOIN kirim k ON k.id = kq.kirim_id
    WHERE b.filial_id = ${filialId} AND b.faol = true AND b.holat IN ('BOSH','BAND','YOLDA')
    ORDER BY m.nom, b.turi, b.id
    LIMIT 100000`;
}
