import 'server-only';

/**
 * TZ 20.5.1 · 20.8 — sotgan filialga yo'lda kelayotgan tayyor mahsulot.
 *
 * ⚠️ 20.8 alohida «jo'natma» jadvalini taklif qiladi, lekin o'zi yo'l
 *    qoldiradi: «Qabul qilishda butun jo'natma bir bosishda tasdiqlanadi
 *    **yoki har pozitsiya alohida**.» Bu ekran ikkinchi yo'lni tanlaydi
 *    va guruhlashni KO'RSATISHDA bajaradi — tikkan filial va sana
 *    bo'yicha. Hisobga ta'sir qilmaydi, jadval ham kerak emas (T-10).
 */

import { ulanishOl } from '@/lib/db';

export interface YoldagiPozitsiya {
  readonly pozitsiyaId: number;
  readonly buyurtmaId: number;
  readonly buyurtmaRaqami: string;
  readonly tartib: number;
  readonly mahsulot: string;
  readonly eniSm: string;
  readonly boyiSm: string;
  readonly mijozIsmi: string | null;
  readonly tikuvchiFilialId: number;
  readonly tikuvchiFilialNomi: string;
  /** Qachon «Tugatdim» bosilgan — jo'natma sanasi shundan chiqadi */
  readonly tayyorSana: Date | null;
}

/**
 * Sotgan filialga kelayotgan pozitsiyalar.
 *
 * ⚠️ Q-25 — faqat **shu filial sotgan** buyurtmalar. Tikkan filial
 *    boshqa: shuning uchun `b.sotgan_filial_id` bo'yicha filtrlanadi,
 *    `b.ishlab_chiqaruvchi_filial_id` bo'yicha emas (20.4).
 */
export async function yoldagilar(
  filialId: number,
): Promise<readonly YoldagiPozitsiya[]> {
  const sql = ulanishOl();

  const q = await sql<
    {
      pozitsiya_id: number;
      buyurtma_id: number;
      buyurtma_raqami: string;
      tartib: number;
      mahsulot: string;
      eni_sm: string;
      boyi_sm: string;
      mijoz_ismi: string | null;
      tikuvchi_filial_id: number;
      tikuvchi_filial_nomi: string;
      tayyor_sana: Date | null;
    }[]
  >`
    SELECT p.id            AS pozitsiya_id,
           b.id            AS buyurtma_id,
           b.raqam         AS buyurtma_raqami,
           p.tartib,
           mt.nom          AS mahsulot,
           p.eni_sm::text  AS eni_sm,
           p.boyi_sm::text AS boyi_sm,
           m.ism           AS mijoz_ismi,
           b.ishlab_chiqaruvchi_filial_id AS tikuvchi_filial_id,
           f.nom           AS tikuvchi_filial_nomi,
           (SELECT MAX(a.sana) FROM audit_jurnal a
             WHERE a.obyekt_turi = 'buyurtma_pozitsiya'
               AND a.obyekt_id = p.id
               AND a.amal = 'TUGATDIM') AS tayyor_sana
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b       ON b.id = p.buyurtma_id
    JOIN mahsulot_tur mt  ON mt.id = p.mahsulot_tur_id
    JOIN filial f         ON f.id = b.ishlab_chiqaruvchi_filial_id
    LEFT JOIN mijoz m     ON m.id = b.mijoz_id
    WHERE b.sotgan_filial_id = ${filialId}
      AND p.holat = 'TAYYOR_YOLDA'
    ORDER BY f.nom, b.raqam, p.tartib`;

  return q.map((r) => ({
    pozitsiyaId: r.pozitsiya_id,
    buyurtmaId: r.buyurtma_id,
    buyurtmaRaqami: r.buyurtma_raqami,
    tartib: r.tartib,
    mahsulot: r.mahsulot,
    eniSm: r.eni_sm,
    boyiSm: r.boyi_sm,
    mijozIsmi: r.mijoz_ismi,
    tikuvchiFilialId: r.tikuvchi_filial_id,
    tikuvchiFilialNomi: r.tikuvchi_filial_nomi,
    tayyorSana: r.tayyor_sana,
  }));
}
