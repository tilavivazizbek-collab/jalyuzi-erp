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
  KURS_KERAK: "Dollarli hujjatda kurs kiritilishi shart",
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
  TELEFON_NOTOGRI: "Telefon raqami noto'g'ri",
  MATERIAL_SAQLANMADI: "Materialni saqlab bo'lmadi",
  MATERIAL_TOPILMADI: "Material topilmadi",
  MIJOZ_SAQLANMADI: "Mijozni saqlab bo'lmadi",
  MIJOZ_TOPILMADI: "Mijoz topilmadi",
  MIJOZ_DUBLIKAT: "Bunday mijoz allaqachon bor",
  MAHSULOT_SAQLANMADI: "Mahsulot turini saqlab bo'lmadi",
  MAHSULOT_TOPILMADI: "Mahsulot turi topilmadi",
  YETKAZIB_SAQLANMADI: "Yetkazib beruvchini saqlab bo'lmadi",
  YETKAZIB_TOPILMADI: "Yetkazib beruvchi topilmadi",
  TANNARX_NOTOGRI: "Tannarx hisobida noto'g'ri qiymat",
  KESIM_NOTOGRI: "Kesim ma'lumoti noto'g'ri",
  KIRIM_BOSH: "Kirim hujjatida bironta qator yo'q",
  KIRIM_SAQLANMADI: "Kirim hujjatini saqlab bo'lmadi",
  KIRIM_BOLAK_YETISHMAYDI: "Har rulon uchun eni va bo'yi kiritilishi kerak",
  KIRIM_ALLAQACHON_STORNO: "Bu hujjat allaqachon storno qilingan",
  KIRIM_TOPILMADI: "Kirim hujjati topilmadi",
  HARAKAT_BRAK_EMAS: "Bu yozuv hisobdan chiqarish emas",
  HARAKAT_TOPILMADI: "Ombor yozuvi topilmadi",
  BOLAK_ALLAQACHON_CHIQARILGAN: "Bu bo'lak allaqachon hisobdan chiqarilgan",
  BOLAK_TOPILMADI: "Bo'lak topilmadi",
  CHIQARISH_SAQLANMADI: "Hisobdan chiqarib bo'lmadi",
  CHIQARISH_SABAB_KERAK: "Sabab kiritilishi shart",
  CHIQARISH_ALLAQACHON_BEKOR: "Bu yozuv allaqachon bekor qilingan",
  INV_SABAB_KERAK: "Farq chiqdi — sababni tanlang",
  POZITSIYA_OTISH_MUMKIN_EMAS: "Pozitsiyani bu holatga o'tkazib bo'lmaydi",
  POZITSIYA_TOPILMADI: "Buyurtma pozitsiyasi topilmadi",
  POZITSIYA_TAHRIRLANMAYDI: "Ish boshlangan — pozitsiya tahrirlanmaydi",
  BUYURTMA_TOPILMADI: "Buyurtma topilmadi",
  BUYURTMA_BOSH: "Savatda bironta pozitsiya yo'q",
  BUYURTMA_MIJOZ_KERAK: "Qarzga sotishda mijoz tanlanishi shart",
  BUYURTMA_FILIAL_KERAK: "Ishlab chiqaruvchi filialni tanlang",
  INV_TOPILMADI: "Inventarizatsiya topilmadi",
  INV_YAKUNLANGAN: "Bu inventarizatsiya allaqachon yakunlangan",
  INV_BOSH: "Sanash varaqasida bironta qator yo'q",
  BOSHLANGICH_TAKROR: "Bu material uchun boshlang'ich qoldiq allaqachon kiritilgan",
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
