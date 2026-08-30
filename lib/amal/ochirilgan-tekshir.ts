/**
 * lib/amal/ochirilgan-tekshir.ts
 *
 * «Bu qiymat O'CHIRILGAN yozuvda turibdi» — tushunarli xabar.
 *
 * ⚠️ NEGA KERAK (2026-08-30)
 *
 *    Egasi Aziz ismli mijozni o'chirdi, keyin uni qaytadan
 *    qo'shmoqchi bo'ldi. Ekranda «Saqlashda xato yuz berdi»
 *    chiqdi va sabab hech qayerda aytilmadi.
 *
 *    Sabab: telefon raqami bazada YAGONA bo'lishi shart va bu
 *    o'chirilgan yozuvga ham tegishli. Dublikat tekshiruvi esa
 *    faqat FAOL mijozlarni qaraydi — o'chirilganini ko'rmaydi.
 *    Natijada tekshiruv «dublikat yo'q» dedi, baza esa rad etdi.
 *
 * ⚠️ YAGONALIK O'CHIRILMAYDI. Uni faqat faol yozuvlarga
 *    cheklash mumkin edi, lekin unda bitta telefon o'nta
 *    o'chirilgan mijozda takrorlanib, tarix chalkashardi.
 *    To'g'ri yechim — ODAMGA AYTISH: yozuv o'chirilgan, uni
 *    qaytaring.
 */

import type postgres from 'postgres';

/** Qaysi jadvalda qaysi ustun yagona — shu yerda ro'yxatga olingan */
export const YAGONA_USTUNLAR = {
  mijoz: 'telefon',
  xodim: 'telefon',
  mijoz_guruh: 'nom',
} as const;

export type YagonaJadval = keyof typeof YAGONA_USTUNLAR;

/**
 * Yozuvning nomi qaysi ustunda.
 *
 * ⚠️ `COALESCE(ism, nom)` ISHLAMAYDI: Postgres ustun nomlarini
 *    so'rovni o'qish paytida tekshiradi va yo'q ustun uchun
 *    darhol xato beradi — qiymat bor-yo'qligidan qat'i nazar.
 */
const NOM_USTUNI: Record<YagonaJadval, string> = {
  mijoz: 'ism',
  xodim: 'ism',
  mijoz_guruh: 'nom',
};

/**
 * Shu qiymat O'CHIRILGAN yozuvda turibdimi.
 *
 * Qaytaradi: o'chirilgan yozuvning nomi, yoki `null`.
 */
export async function ochirilganEgasi(
  tx: postgres.TransactionSql,
  jadval: YagonaJadval,
  qiymat: string | null,
): Promise<string | null> {
  if (qiymat === null || qiymat === '') return null;

  const ustun = YAGONA_USTUNLAR[jadval];

  const q = await tx<{ nomi: string }[]>`
    SELECT ${tx(NOM_USTUNI[jadval])} AS nomi
    FROM ${tx(jadval)}
    WHERE ${tx(ustun)} = ${qiymat} AND faol = false
    LIMIT 1`;

  return q[0]?.nomi ?? null;
}
