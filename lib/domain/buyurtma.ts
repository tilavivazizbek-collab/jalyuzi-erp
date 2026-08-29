/**
 * lib/domain/buyurtma.ts — TZ 8.2 · 8.3 · 8.4 · 8.7 · 8.8 · 8.12 · 20.5 · Q-12
 *
 * Pozitsiya holatlarining sof qoidalari. Bazaga TEGMAYDI (§5.1).
 *
 * ⚠️ TZ 8.2 — «Buyurtmaning UMUMIY STATUSI YO'Q.» Holat har
 *    POZITSIYADA turadi. Bitta buyurtmada bir pozitsiya topshirilgan,
 *    ikkinchisi hali tikilayotgan bo'lishi mumkin. Shuning uchun bu
 *    faylda «buyurtma holati» degan tushuncha umuman yo'q.
 *
 * ⚠️ Filial tanlash bu yerda EMAS — u `lib/domain/filial.ts` da
 *    (`ishlabChiqaruvchiniTanla`). §2.2: bir mantiq bir joyda.
 */

import { BiznesXato } from '@/lib/xato';

export const POZITSIYA_HOLATLARI = [
  'TASDIQ_KUTMOQDA',
  'TASDIQLANGAN',
  'MATERIALGA_KUTMOQDA',
  'FILIALGA_YUBORILDI',
  'ISHLAB_CHIQARILMOQDA',
  'TAYYOR',
  'TAYYOR_YOLDA',
  'YETIB_KELDI',
  'TOPSHIRILDI',
  'QAYTARILGAN',
  'RAD_ETILGAN',
  'BEKOR',
] as const;

export type PozitsiyaHolati = (typeof POZITSIYA_HOLATLARI)[number];

export const HOLAT_NOMI: Record<PozitsiyaHolati, string> = {
  TASDIQ_KUTMOQDA: 'Tasdiq kutmoqda',
  TASDIQLANGAN: 'Tasdiqlangan',
  MATERIALGA_KUTMOQDA: 'Materialga kutmoqda',
  FILIALGA_YUBORILDI: 'Filialga yuborildi',
  ISHLAB_CHIQARILMOQDA: 'Ishlab chiqarilmoqda',
  TAYYOR: 'Tayyor',
  TAYYOR_YOLDA: "Tayyor — yo'lda",
  YETIB_KELDI: 'Yetib keldi',
  TOPSHIRILDI: 'Topshirildi',
  QAYTARILGAN: 'Qaytarilgan',
  RAD_ETILGAN: 'Rad etilgan',
  BEKOR: 'Bekor qilingan',
};

export type Manba = 'SAYT' | 'BOT';

/**
 * Q-12 · TZ 8.4 — buyurtma qaysi holatda tug'iladi.
 *
 * | Manba | Tasdiqlash |
 * |---|---|
 * | Sayt (sotuvchi kiritdi) | kerak emas — darhol tasdiqlangan |
 * | Bot (mijoz berdi) | sotuvchi tasdiqlaydi |
 */
export function boshHolat(manba: Manba): PozitsiyaHolati {
  return manba === 'SAYT' ? 'TASDIQLANGAN' : 'TASDIQ_KUTMOQDA';
}

/**
 * TZ 20.5 — tasdiqlangandan keyingi holat filialga bog'liq.
 *
 * Bir filial ichida tikilsa uchta status o'tkazib yuboriladi.
 */
export function tasdiqdanKeyin(sotganId: number, tikuvchiId: number): PozitsiyaHolati {
  return sotganId === tikuvchiId ? 'TASDIQLANGAN' : 'FILIALGA_YUBORILDI';
}

/** Ish tugallangach — sotgan filial boshqa bo'lsa mahsulot yo'lga chiqadi (20.5). */
export function tugatilgandan(sotganId: number, tikuvchiId: number): PozitsiyaHolati {
  return sotganId === tikuvchiId ? 'TAYYOR' : 'TAYYOR_YOLDA';
}

/**
 * Ish oxirlangan — endi hech narsa o'zgarmaydi.
 *
 * ⚠️ SQL so'rovlarida ham SHU RO'YXAT ishlatiladi (§2.2). Ilgari
 *    `lib/amal/nofaol.ts` da qo'lda `('TOPSHIRILDI','BEKOR')` deb
 *    yozilgan edi — qaytarilgan va rad etilgan buyurtma «ochiq»
 *    bo'lib hisoblanardi va mijozni o'chirishga to'sqinlik
 *    qilardi.
 */
export const YOPIQ_HOLATLAR: readonly PozitsiyaHolati[] = [
  'TOPSHIRILDI',
  'QAYTARILGAN',
  'RAD_ETILGAN',
  'BEKOR',
];

export const yopiqmi = (h: PozitsiyaHolati): boolean => YOPIQ_HOLATLAR.includes(h);

/**
 * TZ 8.7 — «Pozitsiya "Ishlab chiqarilmoqda" ga O'TMAGUNCHA tahrirlanadi.»
 *
 * O'tgandan keyin tahrir yo'q: usta allaqachon materialni ochgan
 * bo'lishi mumkin. Tuzatish kerak bo'lsa pozitsiya bekor qilinadi va
 * yangisi qo'shiladi.
 */
export function tahrirlanadimi(h: PozitsiyaHolati): boolean {
  return (
    h === 'TASDIQ_KUTMOQDA' ||
    h === 'TASDIQLANGAN' ||
    h === 'MATERIALGA_KUTMOQDA' ||
    h === 'FILIALGA_YUBORILDI'
  );
}

/**
 * TZ 8.8 — «Bekor qilish — FAQAT KESISHDAN OLDIN.»
 *
 * Material tegilmagan, zarar yo'q, to'langan pul to'liq qaytariladi.
 * «Ishlab chiqarilmoqda» ga o'tgach tugma o'chadi.
 *
 * ⚠️ Bekor qilish va RAD ETISH ikki alohida amal. Rad etish tayyor
 *    mahsulotni mijoz olmaganda bo'ladi (8.10) va u ombor qoldig'iga
 *    tegmaydi — mato allaqachon kesilgan.
 */
export function bekorQilinadimi(h: PozitsiyaHolati): boolean {
  return tahrirlanadimi(h);
}

/** Usta ishni faqat shu holatlardan ola oladi (8.5). */
export function navbatdami(h: PozitsiyaHolati): boolean {
  return h === 'TASDIQLANGAN' || h === 'FILIALGA_YUBORILDI';
}

/**
 * TZ 8.6 — «Admin ishni qaytarib ola oladi... FAQAT "Ishlab
 * chiqarilmoqda" holatida. "Tugatdim" bosilgach mumkin emas.»
 */
export function qaytaribOlinadimi(h: PozitsiyaHolati): boolean {
  return h === 'ISHLAB_CHIQARILMOQDA';
}

/** TZ 8.4 — tasdiqlash faqat botdan kelgan pozitsiyaga tegishli. */
export function tasdiqlanadimi(h: PozitsiyaHolati): boolean {
  return h === 'TASDIQ_KUTMOQDA';
}

/**
 * TZ 8.3 · 8.12 · 20.5 — ruxsat etilgan o'tishlar.
 *
 * ⚠️ Ro'yxat OQ RO'YXAT: yozilmagan o'tish taqiqlangan. Qora ro'yxat
 *    bo'lganda yangi status qo'shilganda u jimgina hamma joyga ruxsat
 *    olib qolardi.
 */
const OTISHLAR: Readonly<Record<PozitsiyaHolati, readonly PozitsiyaHolati[]>> = {
  TASDIQ_KUTMOQDA: ['TASDIQLANGAN', 'FILIALGA_YUBORILDI', 'BEKOR'],
  // 8.12 — material yetmasa kutishga, kirim bo'lgach qaytadi
  TASDIQLANGAN: ['MATERIALGA_KUTMOQDA', 'ISHLAB_CHIQARILMOQDA', 'BEKOR'],
  MATERIALGA_KUTMOQDA: ['TASDIQLANGAN', 'FILIALGA_YUBORILDI', 'BEKOR'],
  FILIALGA_YUBORILDI: ['MATERIALGA_KUTMOQDA', 'ISHLAB_CHIQARILMOQDA', 'BEKOR'],
  // 8.17 — qayta kesish ishni yana ishlab chiqarishga qaytaradi
  ISHLAB_CHIQARILMOQDA: ['TAYYOR', 'TAYYOR_YOLDA', 'ISHLAB_CHIQARILMOQDA'],
  TAYYOR: ['TOPSHIRILDI', 'RAD_ETILGAN'],
  TAYYOR_YOLDA: ['YETIB_KELDI'],
  YETIB_KELDI: ['TOPSHIRILDI', 'RAD_ETILGAN'],
  // 8.10 — topshirilgandan keyin faqat qaytarish
  TOPSHIRILDI: ['QAYTARILGAN'],
  QAYTARILGAN: [],
  RAD_ETILGAN: [],
  BEKOR: [],
};

export function otishMumkinmi(dan: PozitsiyaHolati, ga: PozitsiyaHolati): boolean {
  return OTISHLAR[dan].includes(ga);
}

/** O'tish noto'g'ri bo'lsa to'xtatadi — tranzaksiya ham, forma ham shuni chaqiradi. */
export function otishniTekshir(dan: PozitsiyaHolati, ga: PozitsiyaHolati): void {
  if (!otishMumkinmi(dan, ga)) {
    throw new BiznesXato('POZITSIYA_OTISH_MUMKIN_EMAS', `${dan} → ${ga}`);
  }
}

/**
 * TZ 8.4 — «Tasdiqlanmagan buyurtma AVTOMATIK BEKOR BO'LMAYDI.
 * 24 soatdan oshgani ro'yxatda qizil bo'lib ko'rinadi.»
 */
export const TASDIQ_OGOHLANTIRISH_SOAT = 24;

export function tasdiqKechikdimi(
  holat: PozitsiyaHolati,
  yaratilgan: Date,
  hozir: Date,
): boolean {
  if (holat !== 'TASDIQ_KUTMOQDA') return false;
  const soat = (hozir.getTime() - yaratilgan.getTime()) / 3_600_000;
  return soat >= TASDIQ_OGOHLANTIRISH_SOAT;
}

/**
 * TZ 3.13 — tayyorlik sanasi IXTIYORIY.
 *
 * ⚠️ Sanasi yo'q pozitsiya «kechikkan» hisoblanMAYDI — u kechikish
 *    hisobotiga ham, qizil belgiga ham tushmaydi (11.8.3). Hisobotda
 *    alohida ustun bo'ladi: «sanasi kiritilmagan — 14 ta».
 */
export function kechikdimi(
  holat: PozitsiyaHolati,
  tayyorlikSana: Date | null,
  hozir: Date,
): boolean {
  if (tayyorlikSana === null) return false;
  if (yopiqmi(holat)) return false;
  return hozir.getTime() > tayyorlikSana.getTime();
}
