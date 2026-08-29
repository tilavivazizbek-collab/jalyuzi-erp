/**
 * lib/domain/ombor-harakat.ts — TZ 7.11
 *
 * Ombor harakatining NOMI va MIQDORI — bir joyda (§2.2).
 *
 * ⚠️ Ilgari bu ikkisi `app/(panel)/ombor/[id]/page.tsx` ichida
 *    turardi. «Ombor tarixi» ekrani ham xuddi shuni ko'rsatadi —
 *    nusxa ko'chirilsa, ikki ekran vaqt o'tib boshqa-boshqa nom
 *    ko'rsatib qolardi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1).
 */

/** Bazadagi `ombor_harakat_turi` CHECK ro'yxati bilan bir xil */
export const HARAKAT_TURLARI = [
  'KIRIM',
  'KESIM',
  'OSTATKA',
  'CHIQINDI',
  'BRAK',
  'KOCHIRISH_CHIQDI',
  'KOCHIRISH_KIRDI',
  'INVENTARIZATSIYA',
  'STORNO',
  'BOSHLANGICH',
] as const;

export type HarakatTuri = (typeof HARAKAT_TURLARI)[number];

const NOMLAR: Record<HarakatTuri, string> = {
  KIRIM: 'Kirim',
  KESIM: 'Kesim',
  OSTATKA: 'Qoldiq kesma',
  CHIQINDI: 'Chiqindi',
  BRAK: 'Hisobdan chiqarildi',
  KOCHIRISH_CHIQDI: "Ko'chirish — chiqdi",
  KOCHIRISH_KIRDI: "Ko'chirish — kirdi",
  INVENTARIZATSIYA: 'Inventarizatsiya',
  STORNO: 'Storno',
  BOSHLANGICH: "Boshlang'ich qoldiq",
};

/**
 * ⚠️ Noma'lum tur KODI BILAN ko'rsatiladi.
 *    Bazaga yangi tur qo'shilib bu ro'yxat unutilsa, ekran bo'sh
 *    katak emas, `YANGI_TUR` ko'rsatadi — teshik darrov ko'rinadi.
 */
export function harakatNomi(turi: string): string {
  return NOMLAR[turi as HarakatTuri] ?? turi;
}

export interface HarakatMiqdori {
  readonly miqdorKvM: number | null;
  readonly miqdorSm: number | null;
  readonly miqdorDona: number | null;
}

/**
 * Uchta o'lchovdan qaysi biri to'lgan bo'lsa — o'shanisi.
 *
 * ⚠️ Q-01 — chiziqli material bazada SANTIMETRDA saqlanadi,
 *    ekranda esa METRDA ko'rsatiladi. Omborchi metr bilan
 *    ishlaydi.
 *
 * ⚠️ Ishorasi O'ZGARTIRILMAYDI: chiqim yozuvlari bazaga manfiy
 *    yoziladi (`ish.ts`, `kochirish.ts`) va shu holicha
 *    ko'rsatiladi. «-3.60 m» — ombordan chiqqan degani.
 */
export function miqdorMatni(h: HarakatMiqdori): string {
  if (h.miqdorKvM !== null) return `${h.miqdorKvM.toFixed(4)} kv.m`;
  if (h.miqdorSm !== null) return `${(h.miqdorSm / 100).toFixed(2)} m`;
  if (h.miqdorDona !== null) return `${String(h.miqdorDona)} dona`;
  return '—';
}

export type Yonalish = 'KIRDI' | 'CHIQDI' | 'NOL';

/**
 * Ombor to'ldimi yoki kamaydimi — RANG uchun.
 *
 * ⚠️ Tur nomiga qaralmaydi, RAQAM ishorasiga qaraladi. Chunki
 *    STORNO va INVENTARIZATSIYA ikki tomonga ham ketishi mumkin:
 *    sanoq kamomad ham, ortiqcha ham chiqarishi mumkin.
 */
export function yonalish(h: HarakatMiqdori): Yonalish {
  const q = h.miqdorKvM ?? h.miqdorSm ?? h.miqdorDona ?? 0;
  if (q > 0) return 'KIRDI';
  if (q < 0) return 'CHIQDI';
  return 'NOL';
}
