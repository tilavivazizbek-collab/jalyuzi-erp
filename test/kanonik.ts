/**
 * test/kanonik.ts — QISM 1 §14.1 · CLAUDE.md §6
 *
 * TZ dagi 11 ta kanonik raqam. Ular SHU YERDA MUZLATILADI — kod raqamga
 * moslanadi, raqam kodga emas.
 *
 * Har bandning `holat` maydoni testi qaysi bosqichda yozilishini ko'rsatadi.
 * `TAYYOR` — test bor va o'tadi. `KUTILMOQDA` — moduli hali qurilmagan;
 * o'sha modul qurilganda test shu yerdagi raqam bilan yoziladi.
 *
 * ⚠️ Bu faylni o'zgartirish uchun TZ o'zgarishi kerak. Kod chiqmayotgani
 *    uchun raqamni tuzatish TAQIQLANADI.
 */

export type KanonikHolat = 'TAYYOR' | 'KUTILMOQDA';

export interface Kanonik {
  readonly kod: string;
  readonly nom: string;
  readonly band: string;
  readonly kutilgan: string;
  readonly bosqich: number;
  readonly holat: KanonikHolat;
}

export const KANONIK: readonly Kanonik[] = [
  {
    kod: 'K-01',
    nom: 'Karniz narxi — 210 sm → 4.20 m × 35 000',
    band: 'Q-01',
    kutilgan: '147 000',
    bosqich: 0,
    holat: 'TAYYOR',
  },
  {
    kod: 'K-02',
    nom: 'Slot formulalari — Dikke 180 × 220, CHET = 30',
    band: 'TZ 3.5',
    kutilgan: '0.66 + 0.66 + 2.64 = 3.96',
    bosqich: 0,
    holat: 'TAYYOR',
  },
  {
    kod: 'K-03',
    nom: 'Kanonik buyurtma — Rollo 210 × 140',
    band: 'TZ 3.8',
    kutilgan: '678 400',
    bosqich: 4,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-04',
    nom: 'Transport taqsimoti',
    band: 'TZ 7.9',
    kutilgan: '1 504 000 + 238 000 + 258 000 = 2 000 000',
    bosqich: 3,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-05',
    nom: 'FIFO brak bilan',
    band: 'TZ 7.9',
    kutilgan: '660 000 / 10 = 66 000',
    bosqich: 3,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-06',
    nom: 'Kesim uch qatori',
    band: 'TZ 7.6',
    kutilgan: '3.60 = 1.20 + 2.40 + 0',
    bosqich: 3,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-07',
    nom: 'Kurs farqi',
    band: 'TZ 9.6',
    kutilgan: '39 600 000 − 37 950 000 = 1 650 000',
    bosqich: 2,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-08',
    nom: 'Ustama eroziyasi',
    band: 'TZ 11.7.5',
    kutilgan: '(120 000 − 87 333) / 87 333 = 37.4%',
    bosqich: 8,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-09',
    nom: 'Kun yopish',
    band: 'TZ 12.17',
    kutilgan: '850 000 + 4 200 000 − 1 850 000 = 3 200 000',
    bosqich: 5,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-10',
    nom: 'Usta balansi',
    band: 'TZ 13.8 (Z-12)',
    kutilgan: '2 180 000 − 940 000 − 100 000 = 1 140 000',
    bosqich: 7,
    holat: 'KUTILMOQDA',
  },
  {
    kod: 'K-11',
    nom: 'Filiallararo qarz',
    band: 'TZ 22.3.1',
    kutilgan: '312 000 + 57 600 + 154 400 = 524 000',
    bosqich: 6,
    holat: 'KUTILMOQDA',
  },
] as const;

// ─── 0-bosqichda tekshiriladigan aniq qiymatlar ───────────────────────────

/** K-01 · Q-01 — karniz: eni 210 sm, formula `ENI × 2`, narx 35 000 so'm/metr */
export const K01 = {
  eni: 210,
  formula: 'ENI × 2',
  sarflashSm: 420,
  sarflashMetr: 4.2,
  narxMetrUchun: '35000',
  jami: '147000.00',
} as const;

/** K-02 · TZ 3.5 — Dikke 180 × 220, CHET = 30 sm */
export const K02 = {
  eni: 180,
  boyi: 220,
  chet: 30,
  slotlar: [
    { nom: 'Oq mato (chet)', formula: "CHET × BO'YI", kutilgan: 0.66 },
    { nom: "Ko'k mato (chet)", formula: "CHET × BO'YI", kutilgan: 0.66 },
    { nom: "Ko'k mato (o'rta)", formula: "(ENI − 2×CHET) × BO'YI", kutilgan: 2.64 },
  ],
  jami: 3.96,
} as const;

/** K-03 · TZ 3.8 — Rollo 210 × 140. Narx moduli 4-bosqichda quriladi. */
export const K03 = {
  eni: 210,
  boyi: 140,
  maydonKvM: 2.94,
  qatorlar: [
    { nom: 'old mato', narx: '120000', miqdor: '2.94', jami: '352800.00' },
    { nom: 'orqa mato', narx: '90000', miqdor: '2.94', jami: '264600.00' },
    { nom: 'mexanizm', narx: '45000', miqdor: '1', jami: '45000.00' },
    { nom: 'kronshteyn', narx: '5000', miqdor: '2', jami: '10000.00' },
    { nom: 'brelok', narx: '3000', miqdor: '2', jami: '6000.00' },
  ],
  jami: '678400.00',
} as const;
