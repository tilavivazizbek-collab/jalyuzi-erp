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
import { kassaYozuviQoshTx, xarajatYozTx } from './kassa';
import {
  ochiqXaridlar,
  somToloviniTaqsimla,
  type OchiqXarid,
} from '@/lib/domain/kurs-farqi';
import { dollar, kurs, pulMatn, som } from '@/lib/domain/pul';
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
  /**
   * TZ 9.5 — QAYSI VALYUTADAGI QARZ yopilmoqda.
   *
   * ⚠️ «Dollar qarzini so'mda to'lash mumkin. To'lov oynasida valyuta
   *    "so'm" tanlanadi, kurs kiritiladi. Qarz `so'm ÷ kurs` bo'yicha
   *    kamayadi.»
   *
   * ⚠️ Berilmasa — to'lov valyutasi (eski xatti-harakat).
   */
  readonly qarzValyutasi?: 'SOM' | 'USD';
}

/**
 * To'lovni CHAQIRUVCHINING tranzaksiyasida yozadi (P-23).
 *
 * Kirim hujjati bilan birga to'lansa — bitta tranzaksiya: mol
 * kirdi va pul chiqdi, yarmi qolib ketmaydi (2.1-invariant).
 */
export interface YetkazibTolovNatijasi {
  readonly kassaYozuvId: number;
  /** 9.5 — qarz qancha kamaydi (qarz valyutasida) */
  readonly qarzKamaydi: string;
  /** 9.6 — kurs farqi; musbat: xarajat, manfiy: daromad */
  readonly kursFarqi: string;
}

export async function yetkazibToloviTx(
  tx: postgres.TransactionSql,
  kirim: YetkazibTolovKirimi,
  xodimId: number,
): Promise<YetkazibTolovNatijasi> {
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

  const qarzValyutasi = kirim.qarzValyutasi ?? kirim.valyuta;

  /**
   * ── ODATIY YO'L: to'lov va qarz BIR XIL valyutada ──
   */
  if (qarzValyutasi === kirim.valyuta) {
    await tx`
      INSERT INTO yetkazib_beruvchi_harakat
        (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta, kurs_snapshot,
         manba_turi, manba_id, izoh, xodim_id)
      VALUES (${kirim.yetkazibBeruvchiId}, ${kirim.filialId}, 'TOLOV',
              ${(-summa).toFixed(2)}, ${kirim.valyuta}, ${kirim.kursSnapshot},
              ${manbaTuri}, ${manbaId}, ${kirim.izoh}, ${xodimId})`;

    return { kassaYozuvId, qarzKamaydi: summa.toFixed(2), kursFarqi: '0.00' };
  }

  /**
   * ── TZ 9.5 · 9.6 — DOLLAR QARZINI SO'MDA TO'LASH ──
   *
   * ⚠️ Faqat shu yo'nalish: so'm kassasidan dollarli qarz yopiladi.
   *    Teskarisi (dollar bilan so'm qarzini yopish) TZ da yo'q va
   *    o'ylab topilmaydi — rad etiladi.
   */
  if (!(kirim.valyuta === 'SOM' && qarzValyutasi === 'USD')) {
    throw new BiznesXato(
      'KASSA_VALYUTA_MOS_EMAS',
      `${kirim.valyuta} to'lov bilan ${qarzValyutasi} qarzini yopib bo'lmaydi`,
    );
  }

  if (kirim.kursSnapshot === null) {
    throw new BiznesXato('KURS_KERAK', "dollar qarzini so'mda to'lashda kurs kerak (9.5)");
  }

  /**
   * ⚠️ Xaridlar ENG ESKISIDAN boshlab olinadi (9.5) va har birining
   *    O'Z qotgan kursi bilan (2.3 · 9.6).
   */
  const xaridlar = await tx<{ summa: string; kurs: string | null }[]>`
    SELECT summa::text, kurs_snapshot::text AS kurs
    FROM yetkazib_beruvchi_harakat
    WHERE yetkazib_beruvchi_id = ${kirim.yetkazibBeruvchiId}
      AND valyuta = 'USD' AND turi IN ('XARID', 'BOSHLANGICH')
      AND summa > 0
    ORDER BY sana, id`;

  const tolanganQatori = await tx<{ jami: string }[]>`
    SELECT COALESCE(-SUM(summa), 0)::text AS jami
    FROM yetkazib_beruvchi_harakat
    WHERE yetkazib_beruvchi_id = ${kirim.yetkazibBeruvchiId}
      AND valyuta = 'USD' AND summa < 0`;

  const tolovKursi = kurs(kirim.kursSnapshot, new Date(), 'SNAPSHOT');

  /**
   * ⚠️ Kursi yozilmagan eski xarid bo'lsa — to'lov kursi olinadi:
   *    farq nol chiqadi. Taxminiy kurs qo'yish yolg'on farq yasardi.
   */
  const hammasi: OchiqXarid[] = xaridlar.map((x) => ({
    qoldiq: dollar(x.summa),
    kirimKursi: x.kurs === null ? tolovKursi : kurs(x.kurs, new Date(), 'SNAPSHOT'),
  }));

  // §2.2 — FIFO va farq qoidasi DOMAINDA
  const ochiq = ochiqXaridlar(hammasi, dollar(tolanganQatori[0]?.jami ?? '0'));
  const n = somToloviniTaqsimla(ochiq, som(kirim.summa), tolovKursi);

  const qarzKamaydi = pulMatn(n.yopilgan);
  const avans = pulMatn(n.avans);

  // Qarz DOLLARDA kamayadi — aks holda balans yopilmasdi (9.5)
  await tx`
    INSERT INTO yetkazib_beruvchi_harakat
      (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta, kurs_snapshot,
       manba_turi, manba_id, izoh, xodim_id)
    VALUES (${kirim.yetkazibBeruvchiId}, ${kirim.filialId}, 'TOLOV',
            ${`-${qarzKamaydi}`}, 'USD', ${kirim.kursSnapshot},
            ${manbaTuri}, ${manbaId},
            ${`${kirim.izoh ?? "So'mda to'landi"} — ${summa.toFixed(2)} so'm, kurs ${kirim.kursSnapshot}`},
            ${xodimId})`;

  /** 9.5 — qarzdan ortig'i AVANS bo'lib qoladi */
  if (Number(avans) > 0) {
    await tx`
      INSERT INTO yetkazib_beruvchi_harakat
        (yetkazib_beruvchi_id, filial_id, turi, summa, valyuta, kurs_snapshot,
         manba_turi, manba_id, izoh, xodim_id)
      VALUES (${kirim.yetkazibBeruvchiId}, ${kirim.filialId}, 'AVANS',
              ${`-${avans}`}, 'USD', ${kirim.kursSnapshot},
              ${manbaTuri}, ${manbaId}, ${'Qarzdan ortiq to\'landi (9.5)'},
              ${xodimId})`;
  }

  /**
   * TZ 9.6 — KURS FARQI ALOHIDA XARAJAT MODDASI.
   *
   * ⚠️ Tannarxga TEGMAYDI: mahsulot allaqachon o'sha narxda sotilgan
   *    bo'lishi mumkin, o'tgan oyning foydasi o'zgarmaydi (2.3).
   *
   * ⚠️ Kassaga ham BOG'LANMAYDI: pul allaqachon C1 yozuvi bilan
   *    chiqdi. Bog'lansa bir xil pul ikki marta sanalardi (12.1).
   *
   * ⚠️ Kurs TUSHSA — daromad. Uni musbat xarajat qilib yozib
   *    bo'lmaydi, shuning uchun MANFIY yoziladi: xarajatni
   *    kamaytiradi (qaytarish ushlanmasi bilan bir xil naqsh, 8.10).
   */
  const farq = pulMatn(n.farq);
  if (n.turi !== 'YOQ') {
    await xarajatYozTx(
      tx,
      {
        sana: new Date().toISOString().slice(0, 10),
        filialId: kirim.filialId,
        modda: 'KURS_FARQI',
        summa: n.turi === 'DAROMAD' ? `-${farq}` : farq,
        valyuta: 'SOM',
        kassaYozuvId: null,
        manbaTuri,
        manbaId,
        izoh: `Kurs farqi (9.6) — ${qarzKamaydi} $, to'lov kursi ${kirim.kursSnapshot}`,
      },
      xodimId,
    );
  }

  return {
    kassaYozuvId,
    qarzKamaydi,
    kursFarqi: n.turi === 'DAROMAD' ? `-${farq}` : farq,
  };
}

/** Alohida to'lov — o'z tranzaksiyasini ochadi */
export async function yetkazibTolovi(
  ulanish: postgres.Sql,
  kirim: YetkazibTolovKirimi,
  xodimId: number,
): Promise<YetkazibTolovNatijasi> {
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
