/**
 * lib/amal/yetkazib-tolov.ts — TZ 9 · 12.1 · 12.6
 *
 * Yetkazib beruvchiga to'lov (C1).
 *
 * ⚠️ NEGA KERAK EDI
 *
 *    2026-08-30 gacha yetkazib beruvchiga to'lov yozadigan kod
 *    UMUMAN YO'Q edi. Kirim faqat QARZ yozardi va u yildan-yilga
 *    o'sib borardi: kassadan pul chiqmasdi, balans esa yolg'on
 *    ko'rsatardi. Egasi: «mahsulot kirim qilgan paytim men to'lov
 *    qilishim kerak, u uchun input yo'q».
 *
 * ⚠️ 12.1 — bu XARAJAT EMAS (`C1` kodi `XARAJAT_EMAS` ro'yxatida).
 *    Mol tannarxga allaqachon kirgan; to'lovni ikkinchi marta
 *    xarajat qilib yozish foydani ikki barobar kamaytirardi.
 *
 * ⚠️ Balans SAQLANMAYDI (2.2-invariant): qarz — `SUM(summa)`.
 *    Shuning uchun XARID musbat, TO'LOV MANFIY yoziladi.
 */

import type postgres from 'postgres';
import { kassaYozuviQoshTx } from './kassa';
import { BiznesXato } from '@/lib/xato';

export interface YetkazibTolovKirimi {
  readonly yetkazibBeruvchiId: number;
  readonly filialId: number;
  readonly kassaId: number;
  /** Musbat summa — manfiyga tizim o'zi aylantiradi */
  readonly summa: string;
  readonly valyuta: 'SOM' | 'USD';
  /** 9.6 — dollarli to'lovda kurs QOTADI */
  readonly kursSnapshot: string | null;
  readonly izoh: string | null;
  /** Qaysi kirim uchun to'lanmoqda — bo'lsa manba shu bo'ladi */
  readonly kirimId: number | null;
}

/**
 * To'lovni CHAQIRUVCHINING tranzaksiyasida yozadi (P-23).
 *
 * Kirim hujjati bilan birga to'lansa — bitta tranzaksiya: mol
 * kirdi va pul chiqdi, yarmi qolib ketmaydi (2.1-invariant).
 */
export async function yetkazibToloviTx(
  tx: postgres.TransactionSql,
  kirim: YetkazibTolovKirimi,
  xodimId: number,
): Promise<{ kassaYozuvId: number }> {
  const summa = Number(kirim.summa);
  if (!Number.isFinite(summa) || summa <= 0) {
    throw new BiznesXato('KASSA_SUMMA_NOL', `summa: ${kirim.summa}`);
  }

  if (kirim.valyuta === 'USD' && kirim.kursSnapshot === null) {
    throw new BiznesXato('KURS_KERAK', "dollarli to'lovda kurs kerak (9.6)");
  }

  /**
   * ⚠️ Kassaning valyutasi to'lov valyutasiga MOS bo'lishi shart
   *    (1.3-invariant): so'm kassasidan dollar chiqib ketsa,
   *    qoldiq ma'nosini yo'qotardi.
   */
  const k = await tx<{ valyuta: string; filial_id: number }[]>`
    SELECT valyuta, filial_id FROM kassa WHERE id = ${kirim.kassaId} AND faol = true`;

  const kassa = k[0];
  if (kassa === undefined) {
    throw new BiznesXato('KASSA_TOPILMADI', String(kirim.kassaId));
  }
  if (kassa.valyuta !== kirim.valyuta) {
    throw new BiznesXato(
      'KASSA_VALYUTA_MOS_EMAS',
      `kassa ${kassa.valyuta} da, to'lov ${kirim.valyuta} da`,
    );
  }

  const manbaTuri = kirim.kirimId === null ? 'yetkazib_beruvchi' : 'kirim';
  const manbaId = kirim.kirimId ?? kirim.yetkazibBeruvchiId;

  const oxirgi = await tx<{ n: number }[]>`
    SELECT COALESCE(MAX(qator), 0)::int AS n FROM kassa_yozuv
    WHERE manba_turi = ${manbaTuri} AND manba_id = ${manbaId}`;

  const kassaYozuvId = await kassaYozuviQoshTx(
    tx,
    {
      kassaId: kirim.kassaId,
      /** 12.6 — C1: yetkazib beruvchiga to'lov */
      kod: 'C1',
      summa: (-summa).toFixed(2),
      valyuta: kirim.valyuta,
      manbaTuri,
      manbaId,
      qator: (oxirgi[0]?.n ?? 0) + 1,
      izoh: kirim.izoh,
    },
    xodimId,
  );

  await tx`
    INSERT INTO yetkazib_beruvchi_harakat
      (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta, kurs_snapshot,
       manba_turi, manba_id, izoh, xodim_id)
    VALUES (${kirim.yetkazibBeruvchiId}, ${kirim.filialId}, 'TOLOV',
            ${(-summa).toFixed(2)}, ${kirim.valyuta}, ${kirim.kursSnapshot},
            ${manbaTuri}, ${manbaId}, ${kirim.izoh}, ${xodimId})`;

  return { kassaYozuvId };
}

/** Alohida to'lov — o'z tranzaksiyasini ochadi */
export async function yetkazibTolovi(
  ulanish: postgres.Sql,
  kirim: YetkazibTolovKirimi,
  xodimId: number,
): Promise<{ kassaYozuvId: number }> {
  return ulanish.begin(async (tx) => yetkazibToloviTx(tx, kirim, xodimId));
}

export interface YetkazibBalansi {
  readonly valyuta: string;
  readonly qarz: string;
}

/**
 * Yetkazib beruvchiga qarz — valyuta bo'yicha alohida.
 *
 * ⚠️ 9.1 — «IKKALA valyutada qarz bo'lishi mumkin». Ularni
 *    qo'shib bitta raqam qilish 1.3-invariantni buzardi.
 */
export async function yetkazibBalansi(
  soruvchi: postgres.Sql,
  yetkazibBeruvchiId: number,
): Promise<readonly YetkazibBalansi[]> {
  const q = await soruvchi<{ valyuta: string; qarz: string }[]>`
    SELECT valyuta, SUM(summa)::text AS qarz
    FROM yetkazib_beruvchi_harakat
    WHERE yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
    GROUP BY valyuta
    HAVING SUM(summa) <> 0
    ORDER BY valyuta`;

  return q.map((x) => ({ valyuta: x.valyuta, qarz: x.qarz }));
}

export interface YetkazibHarakati {
  readonly id: number;
  readonly sana: Date;
  readonly turi: string;
  readonly summa: string;
  readonly valyuta: string;
  readonly izoh: string | null;
  readonly kim: string;
}

/**
 * Yetkazib beruvchi bilan HAMMA hisob-kitob.
 *
 * ⚠️ Xarid MUSBAT, to'lov MANFIY — ekranda ham shu ko'rinishda
 *    turadi. «Qarz oshdi / kamaydi» degan ustun qo'shish emas,
 *    raqamning o'zi gapiradi.
 */
export async function yetkazibHarakatlari(
  soruvchi: postgres.Sql,
  yetkazibBeruvchiId: number,
  chegara = 50,
): Promise<readonly YetkazibHarakati[]> {
  const q = await soruvchi<
    {
      id: number;
      sana: Date;
      turi: string;
      summa: string;
      valyuta: string;
      izoh: string | null;
      kim: string;
    }[]
  >`
    SELECT h.id, h.sana, h.turi, h.summa::text, h.valyuta, h.izoh,
           COALESCE(x.ism, '—') AS kim
    FROM yetkazib_beruvchi_harakat h
    LEFT JOIN xodim x ON x.id = h.xodim_id
    WHERE h.yetkazib_beruvchi_id = ${yetkazibBeruvchiId}
    ORDER BY h.sana DESC, h.id DESC
    LIMIT ${chegara}`;

  return q;
}
