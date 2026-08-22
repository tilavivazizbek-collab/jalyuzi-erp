/**
 * lib/amal/kassa.ts — TZ 12.1 · 12.3 · 12.4 · 12.5 · 12.6 · 12.7 · 12.15
 *                     2.1 · 2.2-invariant
 *
 * ⚠️ TZ 12.1 — **xarajat ≠ kassa chiqimi.** Bu ikkisi aralashtirilsa
 *    bir xil pul ikki marta hisoblanadi. Shuning uchun bu fayl ikki
 *    jadvalga alohida yozadi va qaysi biri kerakligini
 *    `lib/domain/balans.ts` hal qiladi (§2.2).
 *
 * ⚠️ TZ 12.3 — `(manba_turi, manba_id, qator)` uchligi noyob va bu
 *    BAZADA to'siladi: «hech qanday tasdiqlash, tugmani qayta bosish
 *    yoki sahifani yangilash ikkinchi yozuv yarata olmaydi».
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { pulChiqmaydimi, xarajatgaTushadimi, type XarajatModdasi } from '@/lib/domain/balans';
import {
  pulTopshirishQarziniQaytarTx,
  pulTopshirishQarziTx,
} from './filial-harakat';
import { yozuvKursi } from './kurs';
import { BiznesXato } from '@/lib/xato';

export interface KassaYozuvi {
  readonly kassaId: number;
  /** 'K1','K3','C1','C4',… — TZ 12.5 va 12.6 jadvallari */
  readonly kod: string;
  /** + kirim, − chiqim */
  readonly summa: string;
  readonly valyuta: 'SOM' | 'USD';
  readonly manbaTuri: string;
  readonly manbaId: number;
  readonly qator: number;
  readonly izoh: string | null;
}

/**
 * Kassa yozuvini qo'shadi — CHAQIRUVCHINING tranzaksiyasida (P-23).
 *
 * ⚠️ Takroriy yozuv baza indeksiga urilib xato tashlaydi. Bu ATAYLAB:
 *    jimgina o'tkazib yuborilsa, chaqiruvchi «pul tushdi» deb o'ylab
 *    qolardi. `KASSA_TAKROR` xatosi ochiq javob beradi.
 */
export async function kassaYozuviQoshTx(
  tx: postgres.TransactionSql,
  y: KassaYozuvi,
  xodimId: number,
): Promise<number> {
  if (Number(y.summa) === 0) {
    throw new BiznesXato('KASSA_SUMMA_NOL', y.kod);
  }

  const kassalar = await tx<{ id: number; valyuta: string; faol: boolean }[]>`
    SELECT id, valyuta, faol FROM kassa WHERE id = ${y.kassaId}`;

  const k = kassalar[0];
  if (k === undefined) throw new BiznesXato('KASSA_TOPILMADI', String(y.kassaId));
  if (!k.faol) throw new BiznesXato('KASSA_NOFAOL', String(y.kassaId));

  // 1.3-band — kassa valyutasi va yozuv valyutasi bir xil bo'lishi SHART
  if (k.valyuta !== y.valyuta) {
    throw new BiznesXato('KASSA_VALYUTA_MOS_EMAS', `${k.valyuta} ≠ ${y.valyuta}`);
  }

  const takror = await tx<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_yozuv
    WHERE manba_turi = ${y.manbaTuri} AND manba_id = ${y.manbaId}
      AND qator = ${y.qator}`;

  if ((takror[0]?.n ?? 0) > 0) {
    throw new BiznesXato('KASSA_TAKROR', `${y.manbaTuri}#${String(y.manbaId)}`);
  }

  const yangi = await tx<{ id: number }[]>`
    INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id,
                             qator, izoh, xodim_id)
    VALUES (${y.kassaId}, ${y.kod}, ${y.summa}, ${y.valyuta}, ${y.manbaTuri},
            ${y.manbaId}, ${y.qator}, ${y.izoh}, ${xodimId})
    RETURNING id`;

  const id = yangi[0]?.id;
  if (id === undefined) throw new BiznesXato('KASSA_SAQLANMADI', y.kod);
  return id;
}

export interface XarajatYozuvi {
  readonly sana: string;
  readonly filialId: number;
  readonly modda: XarajatModdasi;
  readonly summa: string;
  readonly valyuta: 'SOM' | 'USD';
  /** NULL = pul chiqmagan xarajat (12.1) */
  readonly kassaYozuvId: number | null;
  readonly manbaTuri: string | null;
  readonly manbaId: number | null;
  readonly izoh: string | null;
}

/**
 * TZ 12.1 — xarajat jurnaliga yozadi.
 *
 * ⚠️ Foyda-zarar SHU JADVALDAN yig'iladi, kassadan emas. Kassadan pul
 *    chiqib xarajat BO'LMAYDIGAN hodisalar (ish haqi to'lovi, yetkazib
 *    beruvchiga to'lov) bu yerga umuman tushmaydi.
 */
export async function xarajatYozTx(
  tx: postgres.TransactionSql,
  x: XarajatYozuvi,
  xodimId: number,
): Promise<number> {
  // 12.1 — pul chiqmaydigan modda kassa yozuviga bog'lanmasligi kerak
  if (pulChiqmaydimi(x.modda) && x.kassaYozuvId !== null) {
    throw new BiznesXato('XARAJAT_KASSA_ZID', x.modda);
  }

  const yangi = await tx<{ id: number }[]>`
    INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta, kassa_yozuv_id,
                         manba_turi, manba_id, izoh, xodim_id)
    VALUES (${x.sana}, ${x.filialId}, ${x.modda}, ${x.summa}, ${x.valyuta},
            ${x.kassaYozuvId}, ${x.manbaTuri}, ${x.manbaId}, ${x.izoh}, ${xodimId})
    RETURNING id`;

  const id = yangi[0]?.id;
  if (id === undefined) throw new BiznesXato('XARAJAT_SAQLANMADI', x.modda);
  return id;
}

/**
 * Kassadan pul chiqimi + kerak bo'lsa xarajat — bitta tranzaksiyada.
 *
 * ⚠️ Xarajat kerak-kerakmasligini `lib/domain/balans.ts` hal qiladi
 *    (§2.2): bu yerda `if (kod === 'C4')` kabi ro'yxat TAKRORLANMAYDI.
 */
export async function chiqimQil(
  ulanish: postgres.Sql,
  kirim: {
    readonly yozuv: KassaYozuvi;
    readonly filialId: number;
    readonly sana: string;
    readonly modda: XarajatModdasi;
  },
  xodimId: number,
): Promise<{ kassaYozuvId: number; xarajatId: number | null }> {
  if (Number(kirim.yozuv.summa) >= 0) {
    throw new BiznesXato('KASSA_CHIQIM_MANFIY', kirim.yozuv.kod);
  }

  return ulanish.begin(async (tx) => {
    const kassaYozuvId = await kassaYozuviQoshTx(tx, kirim.yozuv, xodimId);

    if (!xarajatgaTushadimi(kirim.yozuv.kod)) {
      return { kassaYozuvId, xarajatId: null };
    }

    const xarajatId = await xarajatYozTx(
      tx,
      {
        sana: kirim.sana,
        filialId: kirim.filialId,
        modda: kirim.modda,
        // Xarajat MUSBAT son bo'lib yoziladi
        summa: Math.abs(Number(kirim.yozuv.summa)).toFixed(2),
        valyuta: kirim.yozuv.valyuta,
        kassaYozuvId,
        manbaTuri: kirim.yozuv.manbaTuri,
        manbaId: kirim.yozuv.manbaId,
        izoh: kirim.yozuv.izoh,
      },
      xodimId,
    );

    return { kassaYozuvId, xarajatId };
  });
}

/**
 * TZ 12.1 — pul CHIQMAGAN xarajat (ombor braki, chiqindi, hisoblangan
 * ish haqi, kurs farqi…).
 *
 * Kassaga UMUMAN tegmaydi.
 */
export async function pulsizXarajat(
  ulanish: postgres.Sql,
  x: Omit<XarajatYozuvi, 'kassaYozuvId'>,
  xodimId: number,
): Promise<number> {
  return ulanish.begin(async (tx) =>
    xarajatYozTx(tx, { ...x, kassaYozuvId: null }, xodimId),
  );
}

// ─── TZ 12.15 · Storno ────────────────────────────────────────────────────

/**
 * TZ 12.15 — «Bitta yozuvga BITTA storno, ikkinchisi bloklanadi.»
 *
 * ⚠️ Kassa yozuvi o'zgarmas (§6.5) — storno TESKARI YOZUV, eski yozuv
 *    joyida qoladi.
 */
export async function kassaStorno(
  ulanish: postgres.Sql,
  yozuvId: number,
  sabab: string,
  xodimId: number,
): Promise<{ stornoId: number }> {
  if (sabab.trim() === '') {
    throw new BiznesXato('KASSA_SABAB_KERAK', 'storno sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        kassa_id: number;
        kod: string;
        summa: string;
        valyuta: string;
        manba_turi: string;
        manba_id: number;
      }[]
    >`SELECT id, kassa_id, kod, summa, valyuta, manba_turi, manba_id
      FROM kassa_yozuv WHERE id = ${yozuvId}`;

    const y = q[0];
    if (y === undefined) throw new BiznesXato('KASSA_YOZUV_TOPILMADI', String(yozuvId));

    const bor = await tx<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa_yozuv WHERE storno_id = ${yozuvId}`;
    if ((bor[0]?.n ?? 0) > 0) {
      throw new BiznesXato('KASSA_ALLAQACHON_STORNO', String(yozuvId));
    }

    // Teskari yozuv o'z manbasiga ega — 12.3 uchligi buzilmasin
    const yangi = await tx<{ id: number }[]>`
      INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi, manba_id,
                               qator, storno_id, izoh, xodim_id)
      VALUES (${y.kassa_id}, ${y.kod}, ${(-Number(y.summa)).toFixed(2)}, ${y.valyuta},
              'storno', ${yozuvId}, 1, ${yozuvId},
              ${`Storno — ${sabab.trim()}`}, ${xodimId})
      RETURNING id`;

    const stornoId = yangi[0]?.id;
    if (stornoId === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'storno');

    // Xarajat ham teskari yoziladi — foyda-zarar to'g'ri qolsin
    const xarajatlar = await tx<
      { id: number; sana: string; filial_id: number; modda: string; summa: string }[]
    >`SELECT id, sana::text AS sana, filial_id, modda, summa
      FROM xarajat WHERE kassa_yozuv_id = ${yozuvId}`;

    for (const x of xarajatlar) {
      await tx`
        INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta,
                             kassa_yozuv_id, manba_turi, manba_id, izoh, xodim_id)
        VALUES (${x.sana}, ${x.filial_id}, ${x.modda},
                ${(-Number(x.summa)).toFixed(2)}, ${y.valyuta}, ${stornoId},
                'storno', ${x.id}, ${`Storno — ${sabab.trim()}`}, ${xodimId})`;
    }

    /**
     * EC-FQ-08 — topshiriq storno qilinsa filiallararo qarz ham teskari
     * yoziladi. Aks holda pul qaytdi, qarz esa qolib ketardi (22.5).
     */
    if (y.manba_turi === 'topshiriq') {
      await pulTopshirishQarziniQaytarTx(tx, y.manba_id, xodimId, sabab);
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId},
              (SELECT filial_id FROM kassa WHERE id = ${y.kassa_id}),
              'STORNO', 'kassa_yozuv', ${yozuvId},
              ${tx.json({ summa: y.summa, kod: y.kod })},
              ${tx.json({ storno_id: stornoId })},
              ${sabab.trim()})`;

    return { stornoId };
  });
}

// ─── TZ 12.7 · 12.4 · Topshiriq ───────────────────────────────────────────

/**
 * TZ 12.7 — sotuvchi adminga pul topshiradi.
 *
 * ⚠️ TZ 12.4 — «Tasdiqlash HECH QACHON pul yaratmaydi... Sotuvchi
 *    topshirig'i: pul ADMIN TASDIQLAGANDA ko'chadi.»
 *
 *    Shuning uchun bu funksiya kassa yozuvi YOZMAYDI — faqat so'rov
 *    yaratadi. Aks holda pul yo'lda ikki joyda turardi.
 */
export async function topshiriqYubor(
  ulanish: postgres.Sql,
  kirim: {
    readonly kimdanKassaId: number;
    readonly kimgaKassaId: number;
    readonly summa: string;
    readonly valyuta: 'SOM' | 'USD';
    readonly izoh: string | null;
  },
  xodimId: number,
): Promise<{ topshiriqId: number }> {
  if (Number(kirim.summa) <= 0) {
    throw new BiznesXato('KASSA_SUMMA_NOL', 'topshiriq');
  }

  return ulanish.begin(async (tx) => {
    const kassalar = await tx<{ id: number; valyuta: string }[]>`
      SELECT id, valyuta FROM kassa
      WHERE id IN (${kirim.kimdanKassaId}, ${kirim.kimgaKassaId}) AND faol = true`;

    if (kassalar.length !== 2) throw new BiznesXato('KASSA_TOPILMADI');
    if (kassalar.some((k) => k.valyuta !== kirim.valyuta)) {
      throw new BiznesXato('KASSA_VALYUTA_MOS_EMAS', kirim.valyuta);
    }

    const yangi = await tx<{ id: number }[]>`
      INSERT INTO topshiriq (kimdan_kassa_id, kimga_kassa_id, summa, valyuta,
                             holat, izoh, yaratdi_id)
      VALUES (${kirim.kimdanKassaId}, ${kirim.kimgaKassaId}, ${kirim.summa},
              ${kirim.valyuta}, 'JONATILDI', ${kirim.izoh}, ${xodimId})
      RETURNING id`;

    const topshiriqId = yangi[0]?.id;
    if (topshiriqId === undefined) throw new BiznesXato('KASSA_SAQLANMADI', 'topshiriq');
    return { topshiriqId };
  });
}

/**
 * TZ 12.7 — admin topshiriqni qabul qiladi. **Pul shu payt ko'chadi.**
 *
 * Bitta tranzaksiyada ikki yozuv: jo'natuvchidan chiqim (C9),
 * qabul qiluvchiga kirim (K7). Ikkalasi ham xarajat EMAS (12.1).
 */
export async function topshiriqniQabulQil(
  ulanish: postgres.Sql,
  topshiriqId: number,
  xodimId: number,
): Promise<{ chiqimId: number; kirimId: number }> {
  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        kimdan_kassa_id: number;
        kimga_kassa_id: number;
        summa: string;
        valyuta: string;
        holat: string;
      }[]
    >`SELECT id, kimdan_kassa_id, kimga_kassa_id, summa, valyuta, holat
      FROM topshiriq WHERE id = ${topshiriqId} FOR UPDATE`;

    const t = q[0];
    if (t === undefined) throw new BiznesXato('TOPSHIRIQ_TOPILMADI', String(topshiriqId));
    if (t.holat !== 'JONATILDI') {
      throw new BiznesXato('TOPSHIRIQ_ALLAQACHON_HAL', t.holat);
    }

    const valyuta = t.valyuta as 'SOM' | 'USD';

    const chiqimId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: t.kimdan_kassa_id,
        kod: 'C9',
        summa: (-Number(t.summa)).toFixed(2),
        valyuta,
        manbaTuri: 'topshiriq',
        manbaId: topshiriqId,
        qator: 1,
        izoh: 'Adminga topshiriq (12.7)',
      },
      xodimId,
    );

    const kirimId = await kassaYozuviQoshTx(
      tx,
      {
        kassaId: t.kimga_kassa_id,
        kod: 'K7',
        summa: Number(t.summa).toFixed(2),
        valyuta,
        manbaTuri: 'topshiriq',
        manbaId: topshiriqId,
        // 12.3 — bir manbada ikki qator, uchlik shu bilan noyob qoladi
        qator: 2,
        izoh: 'Sotuvchidan topshiriq (12.7)',
      },
      xodimId,
    );

    await tx`
      UPDATE topshiriq
      SET holat = 'QABUL', qabul_qildi_id = ${xodimId}, qabul_qilindi = now(),
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${topshiriqId}`;

    /**
     * TZ 22.5 (Q-29) — sotuvchi pulni BOSHQA filial adminiga topshirsa,
     * qabul qilgan filial topshirgan filialga qarzdor bo'ladi.
     *
     * Kassalarning filiali shu yerda o'qiladi: `topshiriq` jadvalida
     * filial ustuni yo'q, u kassaga tegishli.
     */
    const filiallar = await tx<{ id: number; filial_id: number }[]>`
      SELECT id, filial_id FROM kassa
      WHERE id IN (${t.kimdan_kassa_id}, ${t.kimga_kassa_id})`;

    const danFilial = filiallar.find((k) => k.id === t.kimdan_kassa_id)?.filial_id;
    const gaFilial = filiallar.find((k) => k.id === t.kimga_kassa_id)?.filial_id;

    if (danFilial !== undefined && gaFilial !== undefined) {
      await pulTopshirishQarziTx(
        tx,
        {
          topshiriqId,
          kimdanFilialId: danFilial,
          kimgaFilialId: gaFilial,
          // §3.2 — pul JS `number` ga o'girilmaydi
          summa: new Decimal(t.summa).toFixed(2),
          valyuta,
          /**
           * 9.6 — dollarli yozuvda kurs MAJBURIY: `filial_harakat` da
           * `valyuta <> 'USD' OR kurs_snapshot IS NOT NULL` cheklovi bor.
           * So'mli yozuvda `null` qaytadi.
           */
          kursSnapshot: await yozuvKursi(tx, valyuta),
        },
        xodimId,
      );
    }

    return { chiqimId, kirimId };
  });
}
