/**
 * lib/domain/tannarx.ts — TZ 7.8 · 7.9 · QISM 3 §3.3 · AUDIT
 *
 * Tannarx hisobining YAGONA joyi (QISM 1 §2.2).
 *
 * Ikki qoida bu yerda uchrashadi va ular bir-biriga o'xshamaydi:
 *
 *   TRANSPORT tannarxga QO'SHILADI    — u haqiqiy tannarx (7.9)
 *   BRAK      tannarxga QO'SHILMAYDI  — u ko'rinishi kerak bo'lgan yo'qotish
 *
 * «Aks holda qaysi yetkazib beruvchi ko'p brak berayotgani hech qayerda
 *  ko'rinmaydi, tannarx esa sekin-asta o'sib boraveradi.» (7.9)
 */

import Decimal from 'decimal.js';
import {
  ayir,
  bol,
  kopaytir,
  nisbat,
  nolSom,
  nolmi,
  pulMatn,
  qosh,
  som,
  taqqosla,
  type Som,
} from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

// ─── 7.9 · Qo'shimcha xarajat taqsimoti ───────────────────────────────────

export interface KirimQatori {
  readonly id: number;
  /** Kirim birligidagi miqdor (rulon, shtanga, dona) */
  readonly miqdor: number;
  readonly narxBirlik: Som;
  /** Yetkazib beruvchi defekti (7.9) */
  readonly defektMiqdor: number;
}

export interface Ulush {
  readonly id: number;
  /** Qatorning o'z qiymati — `narx × miqdor` */
  readonly qiymat: Som;
  /** Shu qatorga tushgan qo'shimcha xarajat */
  readonly ulush: Som;
}

/** Qator qiymati — `narx × miqdor` (defekt bilan birga, u ham sotib olingan). */
export const qatorQiymati = (q: KirimQatori): Som => kopaytir(q.narxBirlik, q.miqdor);

/**
 * TZ 7.9 — «Xarajat qatorlarga SUMMA ULUSHI bo'yicha taqsimlanadi.»
 *
 * ⚠️ ENG MUHIM SHART: ulushlar yig'indisi umumiy summaga AYNAN teng
 * bo'lishi kerak. Har ulush alohida yaxlitlansa bir-ikki so'm yo'qoladi
 * yoki paydo bo'ladi — bu pul yo'qdan bor bo'lishi degani.
 *
 * Shuning uchun eng katta qoldiqli qatorga farq qaytariladi
 * («largest remainder»): yig'indi har doim to'g'ri chiqadi.
 */
export function xarajatniTaqsimla(
  qatorlar: readonly KirimQatori[],
  xarajat: Som,
): Ulush[] {
  const qiymatlar = qatorlar.map((q) => ({ id: q.id, qiymat: qatorQiymati(q) }));
  const jami = qiymatlar.reduce<Som>((y, q) => qosh(y, q.qiymat), nolSom());

  if (nolmi(xarajat) || nolmi(jami)) {
    return qiymatlar.map((q) => ({ id: q.id, qiymat: q.qiymat, ulush: nolSom() }));
  }

  // Har ulush pastga yaxlitlanadi, qoldiq keyin taqsimlanadi
  const xom = qiymatlar.map((q) => {
    const aniq = nisbat(q.qiymat, jami).times(new Decimal(pulMatn(xarajat)));
    const pastga = aniq.toDecimalPlaces(2, Decimal.ROUND_DOWN);
    return { ...q, pastga, qoldiq: aniq.minus(pastga) };
  });

  const tarqatilgan = xom.reduce<Som>((y, q) => qosh(y, som(q.pastga.toFixed(2))), nolSom());
  let farq = ayir(xarajat, tarqatilgan);

  // Qoldig'i kattaroq qatorlarga bir tiyindan qo'shib chiqiladi
  const tartib = [...xom].sort((a, b) => b.qoldiq.comparedTo(a.qoldiq));
  const qoshimcha = new Map<number, Som>();
  const bir = som('0.01');

  for (const q of tartib) {
    if (taqqosla(farq, bir) < 0) break;
    qoshimcha.set(q.id, bir);
    farq = ayir(farq, bir);
  }

  return xom.map((q) => ({
    id: q.id,
    qiymat: q.qiymat,
    ulush: qosh(som(q.pastga.toFixed(2)), qoshimcha.get(q.id) ?? nolSom()),
  }));
}

// ─── 7.9 · Bir birlik tannarxi ────────────────────────────────────────────

export interface TannarxNatijasi {
  /** Bir kirim birligi uchun tannarx */
  readonly birlikTannarx: Som;
  /** Omborga kiradigan miqdor (defekt qaytarilsa kamayadi) */
  readonly kirimMiqdor: number;
  /** «Yetkazib beruvchi defekti» xarajatiga tushadigan summa */
  readonly defektZarari: Som;
}

export type DefektTuri = 'QAYTARILADI' | 'HISOBDAN_CHIQADI' | null;

/**
 * TZ 7.9 — «10 shtanga 660 000 so'm, 1 tasi brak bo'lsa tannarx
 * 66 000 bo'lib QOLAVERADI (73 333 emas), 66 000 so'm esa "yetkazib
 * beruvchi defekti" xarajati bo'lib hisobotga tushadi.»
 *
 * ⚠️ QISM 3 §3.3 dagi formula bunga ZID:
 *     `(narx × miqdor + transport) / (miqdor − defekt)`
 * u 660 000 / 9 = 73 333 beradi.
 *
 * Shu bandning O'Z ogohlantirishi to'g'ri: «brak bo'lgan qism BO'LUVCHIGA
 * KIRMAYDI». Bo'luvchi — to'liq miqdor. Batafsil: QARORLAR-KOD P-17.
 */
export function birlikTannarxi(
  qator: KirimQatori,
  xarajatUlushi: Som,
  defektTuri: DefektTuri,
): TannarxNatijasi {
  if (qator.miqdor <= 0) {
    throw new BiznesXato('TANNARX_NOTOGRI', "miqdor noldan katta bo'lishi kerak");
  }
  if (qator.defektMiqdor < 0 || qator.defektMiqdor > qator.miqdor) {
    throw new BiznesXato('TANNARX_NOTOGRI', `defekt miqdori: ${String(qator.defektMiqdor)}`);
  }

  const jami = qosh(qatorQiymati(qator), xarajatUlushi);
  // Bo'luvchi — TO'LIQ miqdor, defekt ayirilmaydi
  const birlikTannarx = bol(jami, qator.miqdor);

  // Qaytariladigan defekt bizga zarar bermaydi — qarzdan chegiriladi (7.9)
  const zararlimi = defektTuri === 'HISOBDAN_CHIQADI';
  const defektZarari = zararlimi ? kopaytir(birlikTannarx, qator.defektMiqdor) : nolSom();

  // Qaytarilgan defekt omborga umuman kirmaydi
  const kirimMiqdor =
    defektTuri === 'QAYTARILADI' ? qator.miqdor - qator.defektMiqdor : qator.miqdor;

  return { birlikTannarx, kirimMiqdor, defektZarari };
}

// ─── 7.8 · FIFO — dona material uchun ─────────────────────────────────────

export interface FifoQatlami {
  readonly kirimQatorId: number;
  readonly qoldiq: number;
  readonly birlikTannarx: Som;
}

export interface FifoYechim {
  readonly kirimQatorId: number;
  readonly miqdor: number;
  readonly summa: Som;
}

export interface FifoNatijasi {
  readonly yechimlar: readonly FifoYechim[];
  readonly jamiSumma: Som;
  /** Qoldiq yetmasa — qancha yetishmagani */
  readonly yetishmadi: number;
}

/**
 * TZ 7.8 — «Dona materialda bo'lak yo'q — 380 ta kronshteyn o'nta kirimdan
 * aralashgan. Shuning uchun FIFO: eng eski kirimdan boshlab yechiladi.»
 *
 * Qatlamlar KELISH TARTIBIDA berilishi shart.
 */
export function fifoYech(qatlamlar: readonly FifoQatlami[], kerak: number): FifoNatijasi {
  if (kerak < 0) {
    throw new BiznesXato('TANNARX_NOTOGRI', `manfiy miqdor: ${String(kerak)}`);
  }

  const yechimlar: FifoYechim[] = [];
  let qolgan = kerak;
  let jamiSumma = nolSom();

  for (const q of qatlamlar) {
    if (qolgan <= 0) break;
    if (q.qoldiq <= 0) continue;

    const olinadi = Math.min(qolgan, q.qoldiq);
    const summa = kopaytir(q.birlikTannarx, olinadi);

    yechimlar.push({ kirimQatorId: q.kirimQatorId, miqdor: olinadi, summa });
    jamiSumma = qosh(jamiSumma, summa);
    qolgan -= olinadi;
  }

  return { yechimlar, jamiSumma, yetishmadi: qolgan };
}

// ─── 5.4 · Ustama nazorati (kirimda) ──────────────────────────────────────

export interface UstamaTekshiruvi {
  readonly ustamaFoiz: number;
  readonly chegara: number;
  readonly pastmi: boolean;
}

/**
 * TZ 7.9 — «Kirim saqlanganda har material uchun yangi tannarx bo'yicha
 * ustama hisoblanadi va chegara bilan solishtiriladi. Chegaradan past
 * bo'lsa qizil ogohlantirish chiqadi. BLOKLAMAYDI — mol allaqachon kelgan.»
 */
export function ustamaniTekshir(
  sotuvNarx: Som | null,
  birlikTannarx: Som,
  chegaraFoiz: number,
): UstamaTekshiruvi | null {
  if (sotuvNarx === null || nolmi(birlikTannarx)) return null;

  const ustamaFoiz = nisbat(ayir(sotuvNarx, birlikTannarx), birlikTannarx)
    .times(100)
    .toNumber();

  return { ustamaFoiz, chegara: chegaraFoiz, pastmi: ustamaFoiz < chegaraFoiz };
}

// ─── 7.10 · Bo'lakning ombordagi qiymati ──────────────────────────────────

export interface BolakOlchovi {
  /** `RULON` · `OSTATKA` · `DONA` */
  readonly turi: string;
  readonly eniM: string | number | null;
  readonly boyiM: string | number | null;
  readonly miqdor: string | number | null;
  /** P-20 — SARFLASH birligi uchun tannarx (so'm/kv.m, so'm/sm, so'm/dona) */
  readonly tannarxBirlik: Som;
}

/**
 * TZ 7.10 — bo'lak hisobdan chiqarilsa qancha zarar bo'ladi.
 *
 * Shu bitta funksiya uch joyda ishlatiladi: hisobdan chiqarish
 * tranzaksiyasi, storno va ekrandagi ogohlantirish (§2.2). SQL da
 * `CASE ... END` bo'lib takrorlanmaydi — aks holda P-20 kabi birlik
 * xatosi bir joyda tuzalib, ikkinchisida qolib ketardi.
 *
 * ⚠️ Kv.m KIRITILMAYDI — `eni × bo'yi` dan hisoblanadi (Q-05).
 */
export function bolakQiymati(b: BolakOlchovi): Som {
  if (b.turi === 'DONA') {
    return kopaytir(b.tannarxBirlik, b.miqdor ?? 0);
  }
  // RULON va OSTATKA — tannarx 1 kv.m uchun
  const kvM = new Decimal(b.eniM ?? 0).times(b.boyiM ?? 0);
  return kopaytir(b.tannarxBirlik, kvM.toString());
}
