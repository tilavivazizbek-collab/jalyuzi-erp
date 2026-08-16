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
  'Kassa',
  'Narx',
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
  'ombor.kochirish.yarat': {
    nom: "Material ko'chirish so'rovi",
    guruh: 'Ombor',
    band: '20.12',
  },

  // ── Kassa — TZ 14.6 ────────────────────────────────────────────────────
  'kassa.oz.kor': { nom: "O'z kassasini ko'rish", guruh: 'Kassa', band: '14.6' },
  'kassa.barcha.kor': { nom: "Barcha kassani ko'rish", guruh: 'Kassa', band: '14.6' },
  'kassa.kirim': { nom: 'Kassa kirim', guruh: 'Kassa', band: '14.6' },
  'kassa.chiqim': { nom: 'Kassa chiqim', guruh: 'Kassa', band: '14.6' },
  'kassa.ayirboshlash': { nom: 'Valyuta ayirboshlash', guruh: 'Kassa', band: '14.6' },
  'kassa.storno': { nom: 'Kassa storno', guruh: 'Kassa', band: '14.6' },

  // ── Narx — TZ 20.9, 20.12 ──────────────────────────────────────────────
  'narx.standart.ozgartir': {
    nom: "Standart narxni o'zgartirish",
    guruh: 'Narx',
    band: '20.12',
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
