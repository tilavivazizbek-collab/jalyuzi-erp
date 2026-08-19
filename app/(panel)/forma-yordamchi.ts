/**
 * app/(panel)/forma-yordamchi.ts
 *
 * Barcha forma uchun umumiy yordamchilar.
 *
 * QISM 1 §2.2 — «Bir mantiq bir joyda, nusxa ko'chirish taqiqlanadi.»
 * Bu funksiyalar uch modulda (material, mijoz, yetkazib) bayt-bayt bir xil
 * bo'lib takrorlangan edi.
 *
 * ⚠️ `'use server'` faylidan ALOHIDA turadi — u faqat async funksiya
 * eksport qila oladi.
 */

export type MaydonXatolari = Readonly<Record<string, string>>;

/**
 * `FormData.get()` matn ham, FAYL ham qaytaradi. To'g'ridan-to'g'ri
 * `String()` qilinsa fayl `[object Object]` bo'lib ketadi va u qiymat
 * o'rniga tekshiruvga tushadi.
 */
export function matnMaydon(forma: FormData, nom: string): string {
  const q = forma.get(nom);
  return typeof q === 'string' ? q : '';
}

export function maydonlarniOqi(
  forma: FormData,
  nomlar: readonly string[],
): Record<string, string> {
  const natija: Record<string, string> = {};
  for (const n of nomlar) natija[n] = matnMaydon(forma, n);
  return natija;
}

/**
 * Zod xatolarini maydon nomiga bog'laydi.
 * Bir maydonda bir nechta xato bo'lsa BIRINCHISI ko'rsatiladi — qolgani
 * odatda o'shaning oqibati.
 */
export function maydonXatolari(
  xatolar: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): MaydonXatolari {
  const natija: Record<string, string> = {};
  for (const x of xatolar) {
    const kalit = x.path[0];
    if (typeof kalit === 'string' && natija[kalit] === undefined) {
      natija[kalit] = x.message;
    }
  }
  return natija;
}

export const FORMA_XATO_XABARI = 'Formada xato bor — qizil maydonlarni tekshiring';
