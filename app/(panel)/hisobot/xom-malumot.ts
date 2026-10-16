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
