/**
 * `/sotuv` — eski manzil.
 *
 * ⚠️ Bo'lim «Buyurtmalar» ichiga ko'chdi: egasi «buyurtma va savdo
 *    ikkovi bitta narsa, faqat buyurtma bo'limi bo'lsin» dedi.
 *    Yangi manzil — `/buyurtma/yangi`.
 *
 * ⚠️ Sahifa O'CHIRILMAYDI, yo'naltiradi: kimdir manzilni
 *    xatcho'pga qo'ygan yoki brauzer tarixida saqlab qo'ygan
 *    bo'lishi mumkin. Ular «sahifa topilmadi» ko'rmasin.
 */

import { redirect } from 'next/navigation';

export default function SotuvEskiManzil(): never {
  redirect('/buyurtma/yangi');
}
