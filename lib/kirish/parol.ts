/**
 * lib/kirish/parol.ts — QISM 1 §8, §16
 *
 * «Parol saqlash: argon2id. Hech qachon logga tushmaydi.»
 *
 * Parol hech qayerda ochiq saqlanmaydi va bu fayldan tashqariga chiqmaydi.
 * Xato xabarlarida ham parol matni bo'lmaydi.
 */

import { hash, verify } from '@node-rs/argon2';
import { BiznesXato } from '@/lib/xato';
import {
  PAROL_ENG_KAM,
  PAROL_ENG_KOP,
  parolYaroqlimi,
} from '@/lib/domain/parol-qoida';

/**
 * `@node-rs/argon2` dagi `Algorithm.Argon2id`.
 *
 * Raqam bilan yozilgan, chunki u `const enum` — `isolatedModules` rejimida
 * import qilib bo'lmaydi. Qiymat to'g'riligini test tekshiradi: hash
 * `$argon2id$` bilan boshlanishi shart.
 */
const ARGON2ID = 2;

/**
 * OWASP tavsiyasidagi argon2id parametrlari (2024 minimal to'plami).
 * Xotira 19 MiB, uch o'tish — oddiy serverda ~50 ms.
 */
const SOZLAMA = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 3,
  parallelism: 1,
} as const;

/**
 * Parolning eng kam uzunligi.
 *
 * ⚠️ TZ da yozilmagan — QARORLAR-KOD P-10. 8 belgi tanlandi: bundan kamida
 * parol taxmin qilinadi, ko'pi esa xodimlarni qog'ozga yozishga majbur qiladi.
 */
/**
 * ⚠️ Qoidaning O'ZI `lib/domain/parol-qoida.ts` da — u ekranda
 *    ham kerak, bu fayl esa argon2 (native modul) olib keladi va
 *    brauzerga tushmaydi. Bu yerda faqat qayta eksport.
 */
export { PAROL_ENG_KAM, PAROL_ENG_KOP, parolYaroqlimi };

export async function parolHash(parol: string): Promise<string> {
  if (!parolYaroqlimi(parol)) {
    // Parol matni xatoga QO'SHILMAYDI — faqat uzunlik talabi aytiladi
    throw new BiznesXato('PAROL_QISQA', `kamida ${String(PAROL_ENG_KAM)} belgi`);
  }
  return hash(parol, SOZLAMA);
}

/**
 * Parolni tekshiradi. Hash buzuq bo'lsa ham `false` qaytaradi — xato otmaydi,
 * aks holda buzuq yozuv kirish ekranini yiqitardi.
 */
export async function parolTogrimi(hashQiymati: string, parol: string): Promise<boolean> {
  try {
    return await verify(hashQiymati, parol, SOZLAMA);
  } catch {
    return false;
  }
}
