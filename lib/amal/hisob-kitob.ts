/**
 * lib/amal/hisob-kitob.ts — TZ 8.9 · 6.7
 *
 * Mijozning HISOB-KITOB VARAQASI: butun xarid tarixi va balansi.
 *
 * ⚠️ NEGA KERAK
 *
 *    Chek bitta buyurtma haqida gapiradi. Mijoz esa «menda umuman
 *    qancha qarz?» deb so'raydi — chekni ko'rsatib bo'lmaydi.
 *    Bu varaqa aynan shu savolga javob: har buyurtma, har to'lov
 *    va oxirida qoldiq.
 *
 * ⚠️ Qoldiq SAQLANMAYDI — `mijoz_harakat` yig'indisi
 *    (2.2-invariant). Shuning uchun varaqa har ochilganda joriy
 *    holatni ko'rsatadi va eski nusxa bilan farq qilishi mumkin.
 */

import type postgres from 'postgres';

export interface HisobQatori {
  readonly sana: Date;
  readonly turi: string;
  readonly izoh: string | null;
  readonly summa: string;
  readonly valyuta: string;
  /** Shu qatordan keyingi qoldiq — o'sib boruvchi yig'indi */
  readonly qoldiq: string;
}

export interface HisobKitob {
  readonly mijozId: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly korxonaNom: string | null;
  readonly korxonaTelefon: string | null;
  readonly qatorlar: readonly HisobQatori[];
  /** Valyuta bo'yicha yakuniy qoldiq — faqat noldan farqlilari */
  readonly qoldiqlar: readonly { valyuta: string; summa: string }[];
}

/**
 * ⚠️ Ishora qoidasi: MUSBAT — mijoz qarzdor, MANFIY — biz
 *    qarzdormiz (avans bergan). `mijoz_harakat` shu qoidada
 *    yoziladi va varaqa uni O'ZGARTIRMAYDI: ustun sarlavhasi
 *    tushuntiradi, raqam esa bazadagidek qoladi.
 */
export async function hisobKitobVaraqasi(
  ulanish: postgres.Sql,
  mijozId: number,
): Promise<HisobKitob | null> {
  const m = await ulanish<{ id: number; ism: string; telefon: string | null }[]>`
    SELECT id, ism, telefon FROM mijoz WHERE id = ${mijozId}`;

  const mijoz = m[0];
  if (mijoz === undefined) return null;

  const [qatorlar, sozlama] = await Promise.all([
    ulanish<
      {
        sana: Date;
        turi: string;
        izoh: string | null;
        summa: string;
        valyuta: string;
        qoldiq: string;
      }[]
    >`
      SELECT h.sana, h.turi, h.izoh, h.summa::text, h.valyuta,
             /*
              * O'suvchi yig'indi — har valyuta O'Z ichida sanaladi
              * (1.3-invariant): so'm va dollar bitta ustunda
              * qo'shilmaydi.
              */
             SUM(h.summa) OVER (
               PARTITION BY h.valyuta
               ORDER BY h.sana, h.id
               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
             )::text AS qoldiq
      FROM mijoz_harakat h
      WHERE h.mijoz_id = ${mijozId}
      ORDER BY h.sana, h.id`,

    ulanish<{ kalit: string; qiymat: string }[]>`
      SELECT kalit, qiymat FROM sozlama
      WHERE kalit IN ('korxona_nom', 'korxona_telefon')`,
  ]);

  const s = new Map(sozlama.map((x) => [x.kalit, x.qiymat]));

  /** Oxirgi qator har valyutada — yakuniy qoldiq */
  const oxirgi = new Map<string, string>();
  for (const q of qatorlar) oxirgi.set(q.valyuta, q.qoldiq);

  return {
    mijozId,
    ism: mijoz.ism,
    telefon: mijoz.telefon,
    korxonaNom: s.get('korxona_nom') ?? null,
    korxonaTelefon: s.get('korxona_telefon') ?? null,
    qatorlar,
    qoldiqlar: [...oxirgi.entries()]
      .filter(([, summa]) => Number(summa) !== 0)
      .map(([valyuta, summa]) => ({ valyuta, summa })),
  };
}
