/**
 * lib/domain/sahifa.ts — ro'yxatni sahifalarga bo'lish. 2026-10-14
 *
 * ⚠️ NEGA: katta omborda `/ombor` 4 678 qatorni (16 MB HTML) bir
 *    sahifada chizardi va 56 soniyada ochilardi — SQL esa 60 ms edi.
 *    Jami, sanoq va filtrlar BUTUN ro'yxat bo'yicha hisoblanaveradi,
 *    faqat CHIZILADIGAN qatorlar cheklanadi.
 */

export interface SahifaKesimi<T> {
  readonly qatorlar: readonly T[];
  /** 1 dan boshlanadi; chegaradan tashqari so'ralsa eng yaqiniga tushadi */
  readonly joriy: number;
  readonly jami: number;
}

/** URL dagi `sahifa` qiymatini o'qiydi: noto'g'ri bo'lsa 1. */
export function sahifaRaqami(x: string | string[] | undefined): number {
  const n = typeof x === 'string' ? Number(x) : NaN;
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

export function sahifaKesimi<T>(royxat: readonly T[], sahifa: number, hajm: number): SahifaKesimi<T> {
  const jami = Math.max(1, Math.ceil(royxat.length / hajm));
  const joriy = Math.min(Math.max(1, Math.floor(sahifa)), jami);
  return { qatorlar: royxat.slice((joriy - 1) * hajm, joriy * hajm), joriy, jami };
}
