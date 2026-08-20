/**
 * lib/domain/inventarizatsiya.ts — TZ 15.1 · Q-05 · AUDIT Z-05, U-06, A-09
 *
 * Sanash varaqasining sof mantiqi. Bazaga TEGMAYDI (§5.1).
 *
 * ⚠️ AUDIT Z-05 (KRITIK) — varaqada `kv.m` ustuni ostida ikki xil
 *    o'lchov turgan edi: rulonning qolgan BO'YI (28.00 m) va maydoni
 *    (84.00 kv.m). Omborchi o'lchab 28 yozsa, tizim 84 kutardi va
 *    −56 kv.m ≈ 4 900 000 so'm soxta xarajat chiqardi.
 *
 *    Shuning uchun bu yerda kv.m HECH QAYERDA kiritilmaydi. Omborchi
 *    `eni` va `bo'yi` ni metrda yozadi, kv.m ni tizim hisoblaydi.
 */

import Decimal from 'decimal.js';
import { bolakQiymati, type BolakOlchovi } from './tannarx';
import { ayir, manfiymi, nolSom, pulMatn, qosh, type Som } from './pul';
import { BiznesXato } from '@/lib/xato';

/** TZ 15.1 — farq chiqsa sabab MAJBURIY. */
export const INVENTARIZATSIYA_SABABLARI = [
  'HISOBGA_OLINMAGAN_CHIQINDI',
  'OLCHOV_XATOSI',
  'YOQOLGAN',
  'NOTOGRI_KIRIM',
  'BOSHQA',
] as const;

export type InventarizatsiyaSababi = (typeof INVENTARIZATSIYA_SABABLARI)[number];

export const INV_SABAB_NOMI: Record<InventarizatsiyaSababi, string> = {
  HISOBGA_OLINMAGAN_CHIQINDI: 'Hisobga olinmagan chiqindi',
  OLCHOV_XATOSI: "O'lchov xatosi",
  YOQOLGAN: "Yo'qolgan",
  NOTOGRI_KIRIM: "Noto'g'ri kirim",
  BOSHQA: 'Boshqa',
};

/** Varaqadagi bitta qator — sanashdan OLDINGI holat. */
export interface SanashQatori {
  readonly bolakId: number;
  readonly kod: string;
  /** `RULON` · `OSTATKA` · `DONA` */
  readonly turi: string;
  readonly tizimdaEniM: number | null;
  readonly tizimdaBoyiM: number | null;
  readonly tizimdaMiqdor: number | null;
  /** P-20 — sarflash birligi uchun tannarx */
  readonly tannarxBirlik: Som;
  /** AUDIT U-06 — band bo'lsa ham jismonan omborda, SANALADI */
  readonly band: boolean;
  /** AUDIT A-09 — yo'lda bo'lsa jismonan yo'q, SANALMAYDI */
  readonly yolda: boolean;
}

/** Omborchi yozgani. */
export interface SanashNatijasi {
  readonly eniM: number | null;
  readonly boyiM: number | null;
  readonly miqdor: number | null;
  readonly sabab: InventarizatsiyaSababi | null;
  readonly izoh: string | null;
}

export interface QatorFarqi {
  readonly bolakId: number;
  readonly kod: string;
  /** Musbat — ortiqcha chiqdi, manfiy — yetishmadi */
  readonly farqKvM: Decimal;
  /**
   * TZ 15.1 — «Farq tannarx bo'yicha hisoblanadi va foyda-zarar
   * hisobotiga XARAJAT bo'lib tushadi. Ortiqcha chiqsa — daromad emas,
   * XARAJAT KAMAYISHI.»
   *
   * Shuning uchun bitta ishorali son: manfiy = xarajat, musbat =
   * xarajatning kamayishi. Ikkita ustun («daromad» va «xarajat»)
   * qilinmadi — 11.4.1 da inventarizatsiya daromad moddasi yo'q.
   */
  readonly farqSumma: Som;
  readonly ozgardimi: boolean;
}

/** O'lchovni `BolakOlchovi` ga o'giradi — `bolakQiymati` shu turni kutadi. */
function olchov(
  turi: string,
  eniM: number | null,
  boyiM: number | null,
  miqdor: number | null,
  tannarxBirlik: Som,
): BolakOlchovi {
  return { turi, eniM, boyiM, miqdor, tannarxBirlik };
}

/**
 * Bitta qatorning farqi.
 *
 * Sanalmagan qator (hamma maydon `null`) — farq NOL, o'zgarish yo'q.
 * Bu ataylab: qisman inventarizatsiyada omborchi ba'zi qatorlarni
 * bo'sh qoldiradi va ular qoldiqqa TEGMAYDI.
 */
export function qatorFarqi(q: SanashQatori, n: SanashNatijasi): QatorFarqi {
  // AUDIT A-09 — yo'ldagi bo'lak sanalmaydi, faqat ma'lumot uchun turadi
  if (q.yolda) {
    return { bolakId: q.bolakId, kod: q.kod, farqKvM: new Decimal(0), farqSumma: nolSom(), ozgardimi: false };
  }

  const dona = q.turi === 'DONA';
  const sanaldi = dona
    ? n.miqdor !== null
    : n.eniM !== null && n.boyiM !== null;

  if (!sanaldi) {
    return { bolakId: q.bolakId, kod: q.kod, farqKvM: new Decimal(0), farqSumma: nolSom(), ozgardimi: false };
  }

  const tizimda = olchov(q.turi, q.tizimdaEniM, q.tizimdaBoyiM, q.tizimdaMiqdor, q.tannarxBirlik);
  const haqiqatda = olchov(q.turi, n.eniM, n.boyiM, n.miqdor, q.tannarxBirlik);

  // Q-05 — kv.m KIRITILMAYDI, eni × bo'yi dan chiqadi
  const tizimdaKvM = dona
    ? new Decimal(q.tizimdaMiqdor ?? 0)
    : new Decimal(q.tizimdaEniM ?? 0).times(q.tizimdaBoyiM ?? 0);
  const haqiqatdaKvM = dona
    ? new Decimal(n.miqdor ?? 0)
    : new Decimal(n.eniM ?? 0).times(n.boyiM ?? 0);

  const farqKvM = haqiqatdaKvM.minus(tizimdaKvM);
  const farqSumma = ayir(bolakQiymati(haqiqatda), bolakQiymati(tizimda));

  return {
    bolakId: q.bolakId,
    kod: q.kod,
    farqKvM,
    farqSumma,
    ozgardimi: !farqKvM.isZero(),
  };
}

/**
 * TZ 15.1 — «Farq chiqsa sabab MAJBURIY.»
 *
 * Tekshiruv shu yerda turadi, forma ham, tranzaksiya ham shu bitta
 * funksiyani chaqiradi (§2.2).
 */
export function sababniTekshir(f: QatorFarqi, sabab: InventarizatsiyaSababi | null): void {
  if (f.ozgardimi && sabab === null) {
    throw new BiznesXato('INV_SABAB_KERAK', f.kod);
  }
}

export interface VaraqaYakuni {
  readonly qatorlar: readonly QatorFarqi[];
  /** Sanalgan qatorlar soni */
  readonly sanalgan: number;
  /** Farq chiqqan qatorlar soni */
  readonly farqli: number;
  /** Manfiy = xarajat (15.1) */
  readonly jamiFarq: Som;
}

/**
 * Butun varaqaning yakuni.
 *
 * ⚠️ Yig'indi qatorlar YIG'INDISI, alohida hisoblanmaydi — AUDIT Z-05
 *    aynan shu ikkilanishdan («48.00» hech qaysi qatorga bog'lanmaydi)
 *    kelib chiqqan edi.
 */
export function varaqaYakuni(
  juftlar: readonly { readonly qator: SanashQatori; readonly natija: SanashNatijasi }[],
): VaraqaYakuni {
  const qatorlar = juftlar.map((j) => {
    const f = qatorFarqi(j.qator, j.natija);
    sababniTekshir(f, j.natija.sabab);
    return f;
  });

  let jami = nolSom();
  let sanalgan = 0;
  let farqli = 0;

  for (const [i, f] of qatorlar.entries()) {
    const j = juftlar[i];
    if (j === undefined) continue;
    const dona = j.qator.turi === 'DONA';
    const sanaldi =
      !j.qator.yolda &&
      (dona ? j.natija.miqdor !== null : j.natija.eniM !== null && j.natija.boyiM !== null);
    if (sanaldi) sanalgan += 1;
    if (f.ozgardimi) farqli += 1;
    jami = qosh(jami, f.farqSumma);
  }

  return { qatorlar, sanalgan, farqli, jamiFarq: jami };
}

/** Hisobotda ko'rsatish uchun — «−1 840 000 so'm xarajat». */
export function farqXarajatmi(jamiFarq: Som): boolean {
  return manfiymi(jamiFarq);
}

/** Bazaga yozish uchun matn ko'rinishi. */
export const farqMatn = (s: Som): string => pulMatn(s);
