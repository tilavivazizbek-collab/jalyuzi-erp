/**
 * lib/kirish/sessiya.ts — QISM 1 §8
 *
 * «Sessiya: JWT emas — bazadagi sessiya jadvali (darhol bekor qilish uchun).
 *  Muddati 30 kun, har so'rovda uzayadi.
 *  Bir foydalanuvchi bir necha qurilmada.»
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSIYA_KUN = 30;

const KUN_MS = 86_400_000;
const SOAT_MS = 3_600_000;

/**
 * Muddat qayta yozilishidan oldin o'tishi kerak bo'lgan vaqt.
 *
 * §8 «har so'rovda uzayadi» deydi. So'zma-so'z bajarilsa har sahifa
 * ochilishida bazaga yozuv ketadi. Natija bir xil, xarajat esa bekorga —
 * shuning uchun muddat soatiga bir marta suriladi (QARORLAR-KOD P-11).
 */
const UZAYTIRISH_ORALIGI_MS = SOAT_MS;

export interface YangiSessiya {
  /** Foydalanuvchining cookie siga yoziladigan qiymat. Bazada saqlanmaydi. */
  readonly token: string;
  /** Bazaga yoziladigan qiymat. */
  readonly tokenHash: string;
  readonly amalQiladi: Date;
}

/**
 * Sessiya tokeni — 256 bit tasodifiy.
 *
 * Bazada tokenning O'ZI emas, SHA-256 hashi saqlanadi. Baza nusxasi
 * o'g'irlansa ham undagi qiymat bilan kirib bo'lmaydi.
 *
 * Bu yerda argon2 EMAS, SHA-256 ishlatiladi va bu ataylab: argon2 past
 * entropiyali inson paroli uchun sekin qilib yaratilgan. 256 bit tasodifiy
 * tokenni taxmin qilib bo'lmaydi, sekin hash esa har so'rovni sekinlashtiradi.
 */
export function sessiyaYarat(hozir: Date): YangiSessiya {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: tokenHash(token),
    amalQiladi: new Date(hozir.getTime() + SESSIYA_KUN * KUN_MS),
  };
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Ikki hashni vaqt bo'yicha xavfsiz taqqoslaydi.
 * Oddiy `===` javob berish vaqti bilan tokenni harfma-harf topishga yo'l ochadi.
 */
export function hashTeng(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export interface SessiyaHolati {
  readonly amalQiladi: Date;
  readonly bekorQilindi: Date | null;
}

/** Sessiya hali ishlaydimi. Bekor qilingani darhol o'chadi (§8). */
export function sessiyaYaroqlimi(s: SessiyaHolati, hozir: Date): boolean {
  if (s.bekorQilindi !== null) return false;
  return hozir.getTime() < s.amalQiladi.getTime();
}

/** Muddatni qayta yozish kerakmi — keraksiz baza yozuvining oldini oladi. */
export function uzaytirilsinmi(s: SessiyaHolati, hozir: Date): boolean {
  if (!sessiyaYaroqlimi(s, hozir)) return false;
  const toliqMuddat = hozir.getTime() + SESSIYA_KUN * KUN_MS;
  return toliqMuddat - s.amalQiladi.getTime() >= UZAYTIRISH_ORALIGI_MS;
}

/** Yangi tugash vaqti — hozirdan 30 kun (surilma muddat). */
export function yangiMuddat(hozir: Date): Date {
  return new Date(hozir.getTime() + SESSIYA_KUN * KUN_MS);
}
