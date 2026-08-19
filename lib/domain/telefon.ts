/**
 * lib/domain/telefon.ts — TZ 6.5 · 10.2 · 13.2 · QISM 1 §8
 *
 * Telefon raqami tizimda **shaxsni belgilovchi** qiymat: xodim shu bilan
 * kiradi (§8), mijozni bot shu bilan taniydi (13.2), dublikat shu bo'yicha
 * tekshiriladi (6.5).
 *
 * Shuning uchun u bir joyda va bir xil ko'rinishga keltiriladi — aks holda
 * `90 123 45 67` va `+998901234567` ikki xil odam bo'lib qoladi.
 */

import { BiznesXato } from '@/lib/xato';

/** O'zbekiston kodi. Bazada raqam shu ko'rinishda saqlanadi: `998901234567`. */
export const MAMLAKAT_KODI = '998';
const MILLIY_UZUNLIK = 9;

/**
 * Har xil yozilgan raqamni bitta ko'rinishga keltiradi.
 *
 * ```
 * '+998 90 123 45 67'  →  '998901234567'
 * '90 123 45 67'       →  '998901234567'
 * '998901234567'       →  '998901234567'
 * ```
 */
export function telefonKanonik(xom: string): string {
  const raqamlar = xom.replace(/\D/g, '');

  if (raqamlar.length === MILLIY_UZUNLIK) {
    return MAMLAKAT_KODI + raqamlar;
  }
  if (raqamlar.length === MAMLAKAT_KODI.length + MILLIY_UZUNLIK && raqamlar.startsWith(MAMLAKAT_KODI)) {
    return raqamlar;
  }
  // 8 bilan boshlanadigan eski yozuv: 8 90 123 45 67
  if (raqamlar.length === MILLIY_UZUNLIK + 1 && raqamlar.startsWith('8')) {
    return MAMLAKAT_KODI + raqamlar.slice(1);
  }

  throw new BiznesXato('TELEFON_NOTOGRI', xom);
}

export function telefonYaroqlimi(xom: string): boolean {
  try {
    telefonKanonik(xom);
    return true;
  } catch {
    return false;
  }
}

/** Interfeys uchun: `998901234567` → `+998 90 123 45 67` */
export function telefonKorsat(kanonik: string): string {
  if (!/^998\d{9}$/.test(kanonik)) return kanonik;
  const m = kanonik.slice(3);
  return `+${MAMLAKAT_KODI} ${m.slice(0, 2)} ${m.slice(2, 5)} ${m.slice(5, 7)} ${m.slice(7, 9)}`;
}

/** Ikki raqam bir xil odamnikimi — TZ 6.5 dublikat nazorati. */
export function telefonTeng(a: string, b: string): boolean {
  try {
    return telefonKanonik(a) === telefonKanonik(b);
  } catch {
    return false;
  }
}
