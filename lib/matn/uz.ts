/**
 * lib/matn/uz.ts — QISM 1 §19
 *
 * Foydalanuvchiga ko'rinadigan barcha matn shu yerda. Kodga yozilmaydi —
 * shunda ikkinchi til kerak bo'lsa faqat shu faylning nusxasi olinadi.
 */

import type { XatoKod } from '@/lib/xato';

export const XATO_MATNI: Record<XatoKod, string> = {
  MATERIAL_YOQ: "Bu materialdan mos bo'lak topilmadi",
  LIMIT_OSHDI: "Mijozning qarz limiti oshib ketdi",
  CHEGIRMA_LIMITI: "Chegirma belgilangan chegaradan oshdi",
  STAVKA_YOQ: "Bu mahsulot turiga stavka belgilanmagan",
  KUN_YOPILGAN: "Kun yopilgan — bu sanaga yozuv kiritib bo'lmaydi",
  BOLAK_BAND: "Bo'lak boshqa pozitsiyaga band qilingan",

  PUL_NOTOGRI: "Pul qiymati noto'g'ri",
  KURS_NOTOGRI: "Valyuta kursi noto'g'ri",
  YAXLITLASH_NOTOGRI: "Yaxlitlash qadami noto'g'ri",
  NOLGA_BOLINDI: "Nolga bo'lish mumkin emas",
  OLCHOV_NOTOGRI: "O'lchov qiymati noto'g'ri",
  FORMULA_XATO: "Formulada xato bor",
  FORMULA_NOMALUM_OZGARUVCHI: "Formulada noma'lum o'zgaruvchi ishlatilgan",
  MUHIT_NOTOGRI: "Muhit o'zgaruvchilari to'liq emas",

  PAROL_QISQA: "Parol juda qisqa",
  KIRISH_NOTOGRI: "Telefon raqami yoki parol noto'g'ri",
  HISOB_BLOKLANGAN: "Hisob vaqtincha bloklangan",
  USTA_SAYTGA_KIRMAYDI: "Usta saytga kirmaydi — Telegram botdan foydalaning",
  SESSIYA_TUGAGAN: "Sessiya muddati tugagan, qayta kiring",
  RUXSAT_YOQ: "Bu amalga ruxsatingiz yo'q",

  FILIAL_TIKMAYDI: "Bu filialda ishlab chiqarish yo'q",
  FILIAL_NOFAOL: "Filial nofaol",

  NARX_NOTOGRI: "Narx qiymati noto'g'ri",
  KOEFFITSIENT_NOTOGRI: "Konversiya koeffitsienti noto'g'ri",
  BIRLIK_OZGARMAYDI: "Qoldiq bor ekan, birlikni o'zgartirib bo'lmaydi",
  KONSTRUKTOR_XATO: "Mahsulot turi sozlamasida xato bor",
};

export const BIRLIK_MATNI = {
  SM: 'sm',
  M: 'm',
  KV_M: 'kv.m',
  DONA: 'dona',
} as const;

export const VALYUTA_MATNI = {
  SOM: "so'm",
  USD: 'dollar',
} as const;
