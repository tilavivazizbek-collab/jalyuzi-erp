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

// ─── React 19 — forma o'zi tozalanishi ────────────────────────────────────

/**
 * ⚠️ REACT 19 FORMANI SAQLASHDAN KEYIN O'ZI TOZALAYDI.
 *
 *    Bu React 19 ning yangi xatti-harakati: `<form action={...}>`
 *    amali tugagach barcha maydonlar bo'shatiladi. React amal
 *    muvaffaqiyatli tugadimi yoki xato qaytardimi — BILMAYDI,
 *    shuning uchun ikkala holatda ham tozalaydi.
 *
 *    Natijada odam formani to'ldirib «Saqlash» bosardi, tizim
 *    «formada xato bor» derdi va SHU PAYTDA hamma yozgani
 *    yo'qolardi. Xato qaysi maydonda ekani ko'rsatilardi, lekin
 *    maydon endi bo'sh bo'lgani uchun odam nima noto'g'ri ekanini
 *    tushunmasdi.
 *
 *    Yechim: xato bo'lganda kiritilgan qiymatlar holat bilan
 *    QAYTARILADI va forma ularni qayta ko'rsatadi.
 */
export type KiritilganQiymatlar = Readonly<Record<string, string>>;

export interface QaytarilganKirim {
  /** Odam kiritgan xom qiymatlar — xato bo'lganda qaytariladi */
  readonly kiritilgan?: KiritilganQiymatlar | null;
  /**
   * Urinish raqami.
   *
   * ⚠️ Maydonlar `key` sifatida shuni oladi: React ularni QAYTA
   *    yaratadi va `defaultValue` yangidan qo'llanadi. Busiz
   *    tozalangan maydon bo'sh bo'lib qolardi.
   */
  readonly urinish?: number;
}

/** Xato holatiga kiritilgan qiymatlarni biriktiradi. */
export function kirimniQaytar<H extends QaytarilganKirim>(
  holat: H,
  oldingi: QaytarilganKirim,
  kiritilgan: KiritilganQiymatlar,
): H {
  return { ...holat, kiritilgan, urinish: (oldingi.urinish ?? 0) + 1 };
}

/**
 * Enter bosilganda forma YUBORILMASIN.
 *
 * ⚠️ NEGA KERAK (egasi, 2026-08-30): «kirim qilish payti mahsulot
 *    tanlab, donasini kiritmoqchi bo'lsam sahifa o'zidan-o'zi
 *    yangilanib ketayapti, birinchi qandaydir alert chiqib».
 *
 *    Sabab: HTML da bitta katakda Enter bosilsa forma yuboriladi.
 *    Ko'p qatorli formada (kirim, sotuv, inventarizatsiya) odam
 *    Enter ni «keyingi katakka o'tish» deb bosadi — forma esa
 *    yuborilib, brauzer to'ldirilmagan maydon ustida ogohlantirish
 *    oynachasini chiqaradi va terilgan qatorlar yo'qoladi.
 *
 * ⚠️ `textarea` va tugmalar TEGILMAYDI: u yerda Enter o'z ishini
 *    qilishi kerak (yangi qator, tugmani bosish).
 *
 * ⚠️ Saqlash faqat «Saqlash» tugmasi bilan bo'ladi — bu ataylab:
 *    hujjat pulga tegadi, tasodifan yuborilmasligi kerak.
 */
export function enterYuborilmasin(hodisa: React.KeyboardEvent<HTMLFormElement>): void {
  if (hodisa.key !== 'Enter') return;

  const nishon = hodisa.target;
  if (!(nishon instanceof HTMLElement)) return;

  const nomi = nishon.tagName;
  if (nomi === 'TEXTAREA' || nomi === 'BUTTON') return;

  hodisa.preventDefault();
}
