/**
 * lib/domain/narx.ts — TZ 3.8 · 5.4 · 6.3 · 20.9 · Q-01 · Q-28
 *
 * Narx hisobining YAGONA joyi (QISM 1 §2.2). Sotuv ekrani, bot va hisobotlar
 * shu fayldan foydalanadi — nusxa ko'chirish taqiqlanadi.
 *
 * Tartib (20.9.3):  filial narxi → mijoz offseti → yaxlitlash
 */

import {
  ayir,
  kopaytir,
  manfiy,
  musbatmi,
  nisbat,
  nolSom,
  nolmi,
  ogir,
  qosh,
  yaxlitlaNarx,
  type Dollar,
  type Kurs,
  type Som,
} from '@/lib/domain/pul';
import { smToM, type Dona, type KvadratMetr, type Santimetr, type SarflashBirligi } from '@/lib/domain/birlik';
import { BiznesXato } from '@/lib/xato';

// ─── 20.9 · Filial narxi (Q-28) ───────────────────────────────────────────

/**
 * «Filial narxi bo'sh bo'lsa — standart ishlaydi. Bosh filialda standart
 * o'zgarsa, o'z narxini qo'ymagan filiallarga avtomatik tarqaladi.» (20.9.1)
 */
export function amaldagiNarx(standart: Som, filialNarxi: Som | null): Som {
  return filialNarxi ?? standart;
}

export const istisnomi = (filialNarxi: Som | null): boolean => filialNarxi !== null;

// ─── 6.3 · Mijoz offseti ──────────────────────────────────────────────────

/**
 * Mijozga beriladigan narx farqi. **Barcha matolarga bir xil qo'llanadi** —
 * har materialga alohida narx belgilanmaydi (6.3).
 */
export type Offset =
  | { readonly turi: 'SOM'; readonly summa: Som }
  | { readonly turi: 'FOIZ'; readonly foiz: number }
  | { readonly turi: 'DOLLAR'; readonly summa: Dollar };

/**
 * Offsetni qo'llaydi. YAXLITLAMAYDI — yaxlitlash zanjirning oxirida,
 * bir marta bajariladi (20.9.3).
 *
 * `DOLLAR` turida kurs MAJBURIY va parametr bo'lib keladi (QISM 1 §3.2) —
 * funksiya ichida sozlamadan o'qilsa snapshot buziladi.
 */
export function offsetQolla(baza: Som, offset: Offset | null, kurs: Kurs | null): Som {
  if (offset === null) return baza;

  switch (offset.turi) {
    case 'SOM':
      return qosh(baza, offset.summa);

    case 'FOIZ':
      if (!Number.isFinite(offset.foiz)) {
        throw new BiznesXato('NARX_NOTOGRI', `offset foizi: ${String(offset.foiz)}`);
      }
      // −3 → × 0.97
      return kopaytir(baza, 1 + offset.foiz / 100);

    case 'DOLLAR':
      if (kurs === null) {
        throw new BiznesXato('KURS_NOTOGRI', "dollarli offset uchun kurs kerak");
      }
      return qosh(baza, ogir(offset.summa, kurs));
  }
}

export interface MatoNarxiKirishi {
  readonly standart: Som;
  readonly filialNarxi: Som | null;
  readonly offset: Offset | null;
  readonly kurs: Kurs | null;
}

/**
 * Mato narxi — 20.9.3 ning to'liq zanjiri.
 *
 *   Standart          120 000
 *   Samarqand         114 000
 *   Offset −3%        110 580
 *   Yaxlitlash        110 600
 */
export function matoNarxi(k: MatoNarxiKirishi): Som {
  const baza = amaldagiNarx(k.standart, k.filialNarxi);
  return yaxlitlaNarx(offsetQolla(baza, k.offset, k.kurs));
}

/**
 * Aksessuar va karniz narxi — offset **qo'llanmaydi**.
 * «Offset faqat matoga qo'llanadi, aksessuarga tegmaydi.» (6.3)
 */
export function aksessuarNarxi(standart: Som, filialNarxi: Som | null): Som {
  return yaxlitlaNarx(amaldagiNarx(standart, filialNarxi));
}

// ─── 3.8 · Pozitsiya narxi ────────────────────────────────────────────────

export interface Qator {
  readonly nom: string;
  /** Materialning sarflash birligi — miqdorni qanday talqin qilishni belgilaydi */
  readonly sarflashBirligi: SarflashBirligi;
  readonly miqdor: KvadratMetr | Santimetr | Dona;
  /** 5.4 — mato uchun 1 kv.m, karniz uchun 1 METR, aksessuar uchun 1 dona */
  readonly narx: Som;
}

/**
 * Bitta qator summasi. Q-01 ning yagona joyi.
 *
 * ⚠️ Chiziqli material **smda** sarflanadi, narxi esa **1 metr uchun**.
 * Shuning uchun bu yerda ÷100 bajariladi. AUDIT Z-01 (100 barobar xato)
 * aynan shu o'girish tushib qolganidan chiqqan edi.
 */
export function qatorSummasi(q: Qator): Som {
  switch (q.sarflashBirligi) {
    case 'KV_M':
      return kopaytir(q.narx, q.miqdor);
    case 'SM':
      // narx 1 metr uchun → sm ni metrga o'giramiz (Q-01)
      return kopaytir(q.narx, smToM(q.miqdor as Santimetr));
    case 'DONA':
      return kopaytir(q.narx, q.miqdor);
  }
}

/**
 * TZ 3.8:
 *
 *   pozitsiya = Σ(slot sarflashi × o'sha slot matosining narxi)
 *             + Σ(aksessuar soni × narxi)
 *             + xizmat haqi
 *
 * «Har slot o'z narxi bilan hisoblanadi. Umumiy maydonni bitta mato narxiga
 *  ko'paytirish noto'g'ri — Dikke'da uch xil mato uch xil narxda.»
 */
export function pozitsiyaNarxi(qatorlar: readonly Qator[], xizmatHaqi: Som | null): Som {
  const jami = qatorlar.reduce<Som>((yigindi, q) => qosh(yigindi, qatorSummasi(q)), nolSom());
  return xizmatHaqi === null ? jami : qosh(jami, xizmatHaqi);
}

/** Buyurtma narxi — savatdagi pozitsiyalar yig'indisi (3.9). */
export function buyurtmaNarxi(pozitsiyalar: readonly Som[]): Som {
  return pozitsiyalar.reduce<Som>((y, p) => qosh(y, p), nolSom());
}

// ─── 3.11 · Chegirma ──────────────────────────────────────────────────────

export type ChegirmaTuri = 'CHEGIRMA' | 'QOSHIMCHA' | 'YOQ';

export interface ChegirmaNatijasi {
  readonly turi: ChegirmaTuri;
  readonly summa: Som;
  readonly limitdanOshdi: boolean;
}

/**
 * TZ 3.11 — «Jami summa erkin o'zgartiriladi, tizim farqni o'zi hisoblab
 * izoh yozadi.» Chegirma limitidan oshsa ogohlantirish chiqadi, lekin
 * sotuvchi davom eta oladi; harakat jurnalga tushadi.
 */
export function chegirmaHisobla(
  hisoblangan: Som,
  kelishilgan: Som,
  limitFoiz: number | null,
): ChegirmaNatijasi {
  const farq = ayir(hisoblangan, kelishilgan);

  if (nolmi(farq)) {
    return { turi: 'YOQ', summa: nolSom(), limitdanOshdi: false };
  }

  // Kelishilgan summa kamroq → chegirma. Ko'proq → qo'shimcha haq.
  const chegirmami = musbatmi(farq);
  const summa = chegirmami ? farq : manfiy(farq);

  const limitdanOshdi =
    chegirmami && limitFoiz !== null && !nolmi(hisoblangan)
      ? nisbat(summa, hisoblangan).times(100).greaterThan(limitFoiz)
      : false;

  return { turi: chegirmami ? 'CHEGIRMA' : 'QOSHIMCHA', summa, limitdanOshdi };
}

// ─── 5.4 · Ustama ─────────────────────────────────────────────────────────

/**
 * Ustama = `(sotuv narxi − tannarx) ÷ tannarx` (5.4).
 * Natija foizda qaytadi.
 */
export function ustamaFoizi(sotuv: Som, tannarx: Som): number {
  return nisbat(ayir(sotuv, tannarx), tannarx).times(100).toNumber();
}

/**
 * Minimal ustama chegarasi (5.4).
 * «Material kartochkasida maydon bo'sh qolsa standart ishlaydi.»
 */
export function ustamaChegarasi(materialChegarasi: number | null, standart: number): number {
  return materialChegarasi ?? standart;
}

export function ustamaPastmi(sotuv: Som, tannarx: Som, chegaraFoiz: number): boolean {
  return ustamaFoizi(sotuv, tannarx) < chegaraFoiz;
}
