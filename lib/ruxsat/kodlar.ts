/**
 * lib/ruxsat/kodlar.ts — TZ 14.6 · 20.12 · Q-04
 *
 * Ruxsat kodlari KODDA belgilanadi, admin qo'lda qo'sha olmaydi.
 * Baza jadvali (`ruxsat`) shu ro'yxatdan urug' bo'lib to'ladi.
 *
 * TZ 14.6: ruxsat **amal darajasida** beriladi, bo'lim darajasida emas.
 *   «Omborchiga kirim qilishga ruxsat berib, hisobdan chiqarishni taqiqlash
 *    kerak bo'lishi mumkin. Bitta "Ombor — ha/yo'q" bayrog'i buni ajratmaydi.»
 *
 * Har bosqich o'z kodlarini qo'shadi. Hozir bu yerda faqat:
 *   · 1-bosqich moduli talab qiladiganlar
 *   · TZ 14.6 va 20.12 da AYNAN yozib qo'yilganlar
 * Qurilmagan modul uchun kod oldindan yozilmaydi.
 */

export const GURUHLAR = [
  'Sozlamalar',
  'Xodimlar',
  'Filiallar',
  'Ombor',
  'Sotuv',
  'Kassa',
  'Narx',
  'Spravochnik',
  'Hisobot',
] as const;
export type Guruh = (typeof GURUHLAR)[number];

interface Tavsif {
  readonly nom: string;
  readonly guruh: Guruh;
  /** TZ bandi — ruxsat qayerdan kelganini keyin topish uchun */
  readonly band: string;
}

export const RUXSATLAR = {
  // ── Sozlamalar — TZ 14 ─────────────────────────────────────────────────
  'sozlama.kor': { nom: "Sozlamalarni ko'rish", guruh: 'Sozlamalar', band: '14.1' },
  'sozlama.ozgartir': {
    nom: "Sozlamalarni o'zgartirish",
    guruh: 'Sozlamalar',
    band: '14.6',
  },
  'ruxsat.kor': { nom: "Ruxsatlar matritsasini ko'rish", guruh: 'Sozlamalar', band: '14.6' },
  'ruxsat.ozgartir': {
    nom: "Ruxsatlarni o'zgartirish",
    guruh: 'Sozlamalar',
    band: '14.6',
  },
  'kurs.kor': { nom: "Kursni ko'rish", guruh: 'Sozlamalar', band: '14.5' },
  'kurs.ozgartir': { nom: "Kursni o'zgartirish", guruh: 'Sozlamalar', band: '14.5' },
  'audit.kor': { nom: "Audit jurnalini ko'rish", guruh: 'Sozlamalar', band: '2.4' },

  // ── Xodimlar — TZ 10 ───────────────────────────────────────────────────
  'xodim.kor': { nom: "Xodimlarni ko'rish", guruh: 'Xodimlar', band: '10.1' },
  'xodim.yarat': { nom: "Xodim qo'shish", guruh: 'Xodimlar', band: '10.2' },
  'xodim.ozgartir': { nom: "Xodimni tahrirlash", guruh: 'Xodimlar', band: '10.2' },

  // ── Filiallar — TZ 20.2 ────────────────────────────────────────────────
  'filial.kor': { nom: "Filiallarni ko'rish", guruh: 'Filiallar', band: '20.2' },
  'filial.yarat': { nom: "Filial ochish", guruh: 'Filiallar', band: '20.2' },
  'filial.ozgartir': { nom: "Filialni tahrirlash", guruh: 'Filiallar', band: '20.2' },

  // ── Ombor — TZ 14.6 va 20.12 da aynan yozilganlar ──────────────────────
  'ombor.qoldiq.kor': { nom: "Ombor qoldig'ini ko'rish", guruh: 'Ombor', band: '20.12' },
  'ombor.kirim.yarat': { nom: 'Kirim hujjati yaratish', guruh: 'Ombor', band: '14.6' },
  'ombor.chiqim': { nom: 'Hisobdan chiqarish', guruh: 'Ombor', band: '14.6' },
  'ombor.storno': { nom: 'Ombor storno', guruh: 'Ombor', band: '14.6' },
  'ombor.narx.ozgartir': {
    nom: "Material narxini o'zgartirish",
    guruh: 'Ombor',
    band: '14.6',
  },
  'ombor.inventarizatsiya': {
    nom: 'Inventarizatsiya',
    guruh: 'Ombor',
    band: '15.1',
  },
  /**
   * ⚠️ FAQAT ADMIN. Qoldiqni to'g'rilash — pulga tegadigan amal:
   *    har o'zgarish tannarx farqini yozadi. Omborchida
   *    inventarizatsiya bor, lekin u varaqa ochib, sanab,
   *    sabab yozib yakunlaydi. Bu esa tezkor yo'l va u
   *    nazoratsiz qolmasligi kerak.
   */
  'ombor.tuzatish': {
    nom: "Qoldiqni to'g'rilash (admin)",
    guruh: 'Ombor',
    band: '15.1',
  },
  'ombor.boshlangich': {
    nom: "Boshlang'ich qoldiq kiritish",
    guruh: 'Ombor',
    band: '7.10',
  },
  'ombor.kochirish.yarat': {
    nom: "Material ko'chirish so'rovi",
    guruh: 'Ombor',
    band: '20.12',
  },
  // 20.7.1 — «so'rovni BERUVCHI filial omborchisi hal qiladi»
  'ombor.kochirish.jonat': {
    nom: "Ko'chirishni jo'natish",
    guruh: 'Ombor',
    band: '20.7',
  },
  'ombor.kochirish.qabul': {
    nom: "Ko'chirishni qabul qilish",
    guruh: 'Ombor',
    band: '20.7',
  },

  // ── Filiallararo hisob — TZ 22 ─────────────────────────────────────────
  'filial.hisob': {
    nom: "Filiallararo balansni ko'rish",
    guruh: 'Filiallar',
    band: '22.6',
  },
  'filial.tolov': {
    nom: "Filial qarzini to'lash",
    guruh: 'Filiallar',
    band: '22.6',
  },
  'filial.tuzatish': {
    nom: "Filial hisobiga qo'lda tuzatish",
    guruh: 'Filiallar',
    band: '22.3',
  },

  // ── Buyurtma va sotuv — TZ 14.6 · 8 ────────────────────────────────────
  'buyurtma.kor': { nom: "Buyurtmalarni ko'rish", guruh: 'Sotuv', band: '8.1' },
  'buyurtma.yarat': { nom: 'Buyurtma yaratish', guruh: 'Sotuv', band: '3.14' },
  'buyurtma.tasdiqla': { nom: 'Buyurtmani tasdiqlash', guruh: 'Sotuv', band: '8.4' },
  'buyurtma.tahrirla': { nom: 'Buyurtmani tahrirlash', guruh: 'Sotuv', band: '8.7' },
  'buyurtma.bekor': { nom: 'Buyurtmani bekor qilish', guruh: 'Sotuv', band: '8.8' },
  // ⚠️ Kod `guruh.amal` ko'rinishida bo'lishi shart (14.6) — pastki
  //    chiziq ishlatilmaydi, shuning uchun `qayta_kesish` emas `brak`.
  /**
   * ⚠️ 2026-08-30: ish oqimi FAQAT BOTDA edi va veb-da buyurtmani
   *    oldinga siljitib bo'lmasdi. Bu ikki kod veb tugmalarini
   *    ochadi — botdagi mantiq bilan bir xil funksiyani chaqiradi.
   */
  'ish.ol': { nom: 'Ishni olish', guruh: 'Sotuv', band: '8.5' },
  'ish.tugat': { nom: "«Tugatdim» — ishni yakunlash", guruh: 'Sotuv', band: '7.6' },
  'buyurtma.brak': {
    nom: 'Ishlab chiqarish brakini hal qilish (8.17)',
    guruh: 'Sotuv',
    band: '8.17',
  },
  'buyurtma.chegirma': {
    nom: 'Chegirma berish',
    guruh: 'Sotuv',
    band: '3.11',
  },

  // ── Kassa — TZ 14.6 ────────────────────────────────────────────────────
  'kassa.tolov': { nom: "To'lov qabul qilish", guruh: 'Kassa', band: '3.12' },
  'kassa.ish.haqi': { nom: "Ish haqi to'lash", guruh: 'Kassa', band: '10.15' },
  'kassa.oz.kor': { nom: "O'z kassasini ko'rish", guruh: 'Kassa', band: '14.6' },
  'kassa.barcha.kor': { nom: "Barcha kassani ko'rish", guruh: 'Kassa', band: '14.6' },
  'kassa.kirim': { nom: 'Kassa kirim', guruh: 'Kassa', band: '14.6' },
  'kassa.chiqim': { nom: 'Kassa chiqim', guruh: 'Kassa', band: '14.6' },
  'kassa.ayirboshlash': { nom: 'Valyuta ayirboshlash', guruh: 'Kassa', band: '14.6' },
  'kassa.storno': { nom: 'Kassa storno', guruh: 'Kassa', band: '14.6' },
  /**
   * ⚠️ TZ 12.2 — kassa ochish. Ilgari bu kod YO'Q edi va kassani
   *    umuman yaratib bo'lmasdi: jadval bo'sh turardi, ya'ni
   *    to'lov ham, kun yopish ham ishlamasdi.
   */
  'kassa.yarat': { nom: 'Kassa ochish', guruh: 'Kassa', band: '12.2' },

  // ── Narx — TZ 20.9, 20.12 ──────────────────────────────────────────────
  'narx.standart.ozgartir': {
    nom: "Standart narxni o'zgartirish",
    guruh: 'Narx',
    band: '20.12',
  },
  'narx.filial.ozgartir': {
    nom: "Filial narxini o'zgartirish",
    guruh: 'Narx',
    band: '20.9.1',
  },

  // ── Hisobotlar — TZ 11.10 ──────────────────────────────────────────────
  /**
   * TZ 11.10 ruxsat jadvali bo'lim darajasida yozilgan, shuning uchun
   * kodlar ham bo'limga qarab ajratilgan — bitta «hisobot.kor» bayrog'i
   * 11.10 ni ifodalay olmaydi:
   *
   *   Admin     — hammasi
   *   Sotuvchi  — sotuv, mijozlar, kassa oqimi. Tannarx va foyda YO'Q
   *   Omborchi  — faqat ombor hisobotlari
   *   Usta      — hech narsa
   *
   * ⚠️ Ombor hisobotlarida TANNARX bor (11.7.1, 11.7.5, 11.7.6). Shuning
   *    uchun `hisobot.ombor.kor` sotuvchiga urug'da BERILMAYDI.
   */
  'hisobot.ombor.kor': { nom: "Ombor hisobotlari", guruh: 'Hisobot', band: '11.7' },
  'hisobot.sotuv.kor': { nom: 'Sotuv hisobotlari', guruh: 'Hisobot', band: '11.5' },
  'hisobot.mijoz.kor': { nom: 'Mijozlar hisobotlari', guruh: 'Hisobot', band: '11.6' },
  'hisobot.moliya.kor': { nom: 'Moliya hisobotlari', guruh: 'Hisobot', band: '11.4' },

  // ── Spravochniklar — TZ 4, 5, 6, 9 ─────────────────────────────────────
  'material.kor': { nom: "Materiallarni ko'rish", guruh: 'Spravochnik', band: '5.1' },
  'material.yarat': { nom: "Material qo'shish", guruh: 'Spravochnik', band: '5.1' },
  'material.ozgartir': { nom: 'Materialni tahrirlash', guruh: 'Spravochnik', band: '5.3' },

  'mahsulot.kor': { nom: "Mahsulot turlarini ko'rish", guruh: 'Spravochnik', band: '4.1' },
  'mahsulot.yarat': { nom: 'Mahsulot turi yaratish', guruh: 'Spravochnik', band: '4.1' },
  'mahsulot.ozgartir': { nom: 'Mahsulot turini tahrirlash', guruh: 'Spravochnik', band: '4.10' },

  'mijoz.kor': { nom: "Mijozlarni ko'rish", guruh: 'Spravochnik', band: '6.1' },
  'mijoz.yarat': { nom: "Mijoz qo'shish", guruh: 'Spravochnik', band: '3.10' },
  'mijoz.ozgartir': { nom: 'Mijozni tahrirlash', guruh: 'Spravochnik', band: '6.2' },
  'mijoz.qarz.hisobdan': {
    nom: 'Qarzni hisobdan chiqarish',
    guruh: 'Spravochnik',
    band: '6.10',
  },

  'yetkazib.kor': { nom: "Yetkazib beruvchilarni ko'rish", guruh: 'Spravochnik', band: '9.1' },
  'yetkazib.yarat': { nom: "Yetkazib beruvchi qo'shish", guruh: 'Spravochnik', band: '9.1' },
  'yetkazib.ozgartir': {
    nom: 'Yetkazib beruvchini tahrirlash',
    guruh: 'Spravochnik',
    band: '9.1',
  },
} as const satisfies Record<string, Tavsif>;

export type RuxsatKod = keyof typeof RUXSATLAR;

export const RUXSAT_KODLARI = Object.keys(RUXSATLAR) as RuxsatKod[];

export function ruxsatKodmi(x: string): x is RuxsatKod {
  return Object.prototype.hasOwnProperty.call(RUXSATLAR, x);
}

/**
 * TZ 14.6: «Bloklanadi — admin o'zining "sozlamalarni o'zgartirish" huquqini
 * olib qo'ya olmaydi. Aks holda tizimga kirish yo'li yopiladi.»
 */
export const OLIB_QOYILMAYDI: RuxsatKod = 'sozlama.ozgartir';

/** Kassa ruxsatlari — 20.12.1 dagi to'rtinchi qattiq qoida shularga tegishli. */
export const KASSA_KODLARI: readonly RuxsatKod[] = RUXSAT_KODLARI.filter(
  (k) => RUXSATLAR[k].guruh === 'Kassa',
);
