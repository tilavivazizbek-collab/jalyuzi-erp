/**
 * app/korinish.ts — KUN / TUN ko'rinishining umumiy tushunchalari.
 *
 * ⚠️ Bu faylda `next/headers` YO'Q va bo'lmaydi ham. Uni ham
 *    server qatlami (`app/layout.tsx`), ham brauzerda ishlaydigan
 *    almashtirgich o'qiydi; `cookies()` shu yerga kirsa butun
 *    server kodi brauzer to'plamiga tortilib kelardi.
 *
 * ⚠️ Cookie `httpOnly` EMAS — sessiya cookie sidan farqi shunda.
 *    Sabab: ko'rinishni brauzerning o'zi darhol yozadi va sahifa
 *    qayta yuklanmaydi. Server amaliga borilsa, masofadagi bazaga
 *    ulanish tufayli tugma bosilgandan keyin 2–3 soniya hech narsa
 *    o'zgarmay turardi. Bu yerda sir yo'q: cookie da faqat
 *    «kun» yoki «tun» so'zi turadi.
 */

/** Cookie nomi — sessiya cookie si bilan bir oilada turishi uchun old qo'shimchali. */
export const KORINISH_COOKIE = 'jalyuzi_korinish';

/**
 * Uchta holat.
 *
 * ⚠️ `tizim` — kompyuterning o'z sozlamasi. U ALOHIDA holat,
 *    «kun» ning sinonimi emas: odam kechqurun kompyuterini tunga
 *    o'tkazsa, ERP ham o'zi tunga o'tishi kerak. Shuning uchun
 *    cookie da «kun» deb yozib qo'yish yaramaydi.
 */
export type Korinish = 'kun' | 'tun' | 'tizim';

export const KORINISHLAR: readonly Korinish[] = ['kun', 'tun', 'tizim'];

/** Ekranda ko'rinadigan nomlar — QISM 1 §19, interfeys o'zbekcha. */
export const KORINISH_NOMI: Record<Korinish, string> = {
  kun: 'Kunduzgi',
  tun: 'Tungi',
  tizim: 'Kompyuter sozlamasi',
};

/**
 * Cookie dagi matnni tekshirib turga aylantiradi.
 *
 * ⚠️ Noma'lum qiymat `tizim` ga tushadi: cookie qo'lda
 *    o'zgartirilgan yoki eskirgan bo'lsa ham ekran ochiladi.
 */
export function korinishTekshir(qiymat: string | undefined | null): Korinish {
  return qiymat === 'kun' || qiymat === 'tun' ? qiymat : 'tizim';
}

/**
 * `<html>` ga qo'yiladigan atribut qiymati.
 *
 * ⚠️ `tizim` da atribut UMUMAN qo'yilmaydi (`null`). CSS da
 *    atributsiz holat `color-scheme: light dark` ni bildiradi,
 *    ya'ni tanlovni brauzer operatsion tizimdan so'raydi.
 */
export function korinishAtributi(korinish: Korinish): 'kun' | 'tun' | undefined {
  return korinish === 'tizim' ? undefined : korinish;
}
