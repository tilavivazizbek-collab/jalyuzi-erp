/**
 * lib/domain/hisobot/abc.ts — TZ 11.6.2 · HISOBOTLAR-ISH §9 (ikkinchi naqsh)
 *
 * ABC (Pareto) tahlili ikki joyda kerak va mantig'i bir xil:
 *
 *   Mijozlar (11.6.2)   — tushumning 80% i qaysi mijozlardan
 *   Ombor    (§3.1 №17) — qoldiq qiymatining 80% i qaysi materialda
 *
 * Qoida: qiymat bo'yicha kamayish tartibida saralanadi, kumulyativ ulush
 * yig'iladi. 80% gacha bo'lganlar — **A**, 95% gacha — **B**, qolgani — **C**.
 *
 * ⚠️ Chegarani KESIB O'TGAN element yuqori toifada qoladi. Aks holda 79.8%
 * da turgan mijoz A ga, undan kattaroq keyingi mijoz C ga tushib qolishi
 * mumkin edi — ro'yxat mantiqsiz ko'rinadi.
 *
 * ⚠️ Manfiy va nol qiymat kumulyativ bazaga KIRMAYDI. Mijozning davr tushumi
 * qaytarishlardan keyin manfiy chiqishi mumkin (8.10); u 80% ni hisoblashda
 * ishtirok etsa foizlar 100 dan oshib ketadi. Bunday qatorlar ro'yxat
 * oxirida C bo'lib turadi — ataylab: ular ko'rinmay qolmasligi kerak.
 */

import Decimal from 'decimal.js';
import { type Pul, dollar, pulMatn, som, taqqosla, valyutasi } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

export type AbcToifa = 'A' | 'B' | 'C';

export interface AbcChegarasi {
  /** A toifasining yuqori chegarasi, foizda */
  readonly a: number;
  /** B toifasining yuqori chegarasi, foizda */
  readonly b: number;
}

export const ABC_STANDART: AbcChegarasi = { a: 80, b: 95 };

export interface AbcKirish<K> {
  readonly kalit: K;
  readonly nom: string;
  readonly qiymat: Pul;
}

export interface AbcQator<K> {
  readonly kalit: K;
  readonly nom: string;
  readonly qiymat: Pul;
  /** Tartib raqami, 1 dan */
  readonly orin: number;
  /** Shu elementning jamidagi ulushi, foizda */
  readonly ulushFoiz: number;
  /** Shu elementgacha (o'zi bilan) yig'ilgan ulush, foizda */
  readonly kumulyativFoiz: number;
  readonly toifa: AbcToifa;
}

export interface AbcNatija<K> {
  readonly qatorlar: readonly AbcQator<K>[];
  /** Musbat qiymatlar yig'indisi — foiz shundan hisoblanadi */
  readonly jami: Pul;
  /** Har toifada nechta element */
  readonly soni: Readonly<Record<AbcToifa, number>>;
}

const son = (p: Pul): Decimal => new Decimal(pulMatn(p));

const foizga = (ulush: Decimal): number => ulush.times(100).toDecimalPlaces(2).toNumber();

/** Namunadagi valyutada pul yasaydi — 1.3-invariant buzilmaydi. */
function birValyutada(namuna: Pul, qiymat: Decimal): Pul {
  const matn = qiymat.toFixed(2);
  return valyutasi(namuna) === 'SOM' ? som(matn) : dollar(matn);
}

/**
 * ABC tahlili.
 *
 * Barcha qiymat bitta valyutada bo'lishi shart (1.3-invariant): so'm va
 * dollar tushum bitta ro'yxatda taqqoslanmaydi — ikkita alohida hisobot
 * bo'ladi.
 */
export function abcTahlil<K>(
  kirish: readonly AbcKirish<K>[],
  chegara: AbcChegarasi = ABC_STANDART,
): AbcNatija<K> {
  if (chegara.a <= 0 || chegara.b <= chegara.a || chegara.b > 100) {
    throw new BiznesXato('ABC_CHEGARA_NOTOGRI', `A=${String(chegara.a)} B=${String(chegara.b)}`);
  }

  const birinchi = kirish[0];
  if (birinchi === undefined) {
    return { qatorlar: [], jami: som(0), soni: { A: 0, B: 0, C: 0 } };
  }

  const valyuta = valyutasi(birinchi.qiymat);
  for (const k of kirish) {
    if (valyutasi(k.qiymat) !== valyuta) {
      throw new BiznesXato('ABC_VALYUTA_ARALASH', `${k.nom}: ${valyutasi(k.qiymat)} ≠ ${valyuta}`);
    }
  }

  // Kamayish tartibida. Teng qiymatlarda nom bo'yicha — natija barqaror
  // bo'lishi kerak, aks holda har ochilishda qatorlar joyini almashtiradi.
  const saralangan = [...kirish].sort((x, y) => {
    const farq = taqqosla(y.qiymat, x.qiymat);
    return farq !== 0 ? farq : x.nom.localeCompare(y.nom, 'uz');
  });

  const jamiD = saralangan.reduce((y, q) => {
    const d = son(q.qiymat);
    return d.greaterThan(0) ? y.plus(d) : y;
  }, new Decimal(0));

  const qatorlar: AbcQator<K>[] = [];
  const soni: Record<AbcToifa, number> = { A: 0, B: 0, C: 0 };
  let yigilgan = new Decimal(0);

  saralangan.forEach((q, i) => {
    const d = son(q.qiymat);
    const hisobga = d.greaterThan(0) && jamiD.greaterThan(0);

    const ulush = hisobga ? d.div(jamiD) : new Decimal(0);
    // Toifa OLDINGI yig'indi bo'yicha aniqlanadi — chegarani kesib o'tgan
    // element yuqori toifada qoladi.
    const oldingiFoiz = foizga(yigilgan);
    if (hisobga) yigilgan = yigilgan.plus(ulush);

    const toifa: AbcToifa = !hisobga
      ? 'C'
      : oldingiFoiz < chegara.a
        ? 'A'
        : oldingiFoiz < chegara.b
          ? 'B'
          : 'C';

    soni[toifa] += 1;
    qatorlar.push({
      kalit: q.kalit,
      nom: q.nom,
      qiymat: q.qiymat,
      orin: i + 1,
      ulushFoiz: foizga(ulush),
      kumulyativFoiz: hisobga ? foizga(yigilgan) : 100,
      toifa,
    });
  });

  return { qatorlar, jami: birValyutada(birinchi.qiymat, jamiD), soni };
}

/**
 * Pareto chartining kumulyativ chizig'i uchun nuqtalar (HISOBOTLAR-ISH §2).
 * Chart kutubxonasi tanlanmagan, shuning uchun bu yerda faqat sonlar.
 */
export function paretoNuqtalari<K>(natija: AbcNatija<K>): readonly { x: string; y: number }[] {
  return natija.qatorlar.map((q) => ({ x: q.nom, y: q.kumulyativFoiz }));
}
