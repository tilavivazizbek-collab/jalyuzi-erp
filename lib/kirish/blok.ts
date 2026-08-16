/**
 * lib/kirish/blok.ts — QISM 1 §8
 *
 * «Muvaffaqiyatsiz urinish: 5 martadan keyin 15 daqiqa bloklanadi.»
 *
 * Sof mantiq — vaqt ham, holat ham parametr bo'lib keladi. Shuning uchun
 * testda soatni kutib o'tirish shart emas.
 */

export const MAX_URINISH = 5;
export const BLOK_DAQIQA = 15;

const DAQIQA_MS = 60_000;

export interface BlokHolati {
  readonly xatoUrinish: number;
  readonly bloklangan: Date | null;
}

export const BOSHLANGICH: BlokHolati = { xatoUrinish: 0, bloklangan: null };

/** Hozir bloklanganmi. Muddati o'tgan blok blok emas. */
export function bloklanganmi(holat: BlokHolati, hozir: Date): boolean {
  const b = holat.bloklangan;
  if (b === null) return false;
  return hozir.getTime() < b.getTime() + BLOK_DAQIQA * DAQIQA_MS;
}

/** Blok tugashiga necha daqiqa qolgani — foydalanuvchiga aytish uchun. */
export function blokQoldiqDaqiqa(holat: BlokHolati, hozir: Date): number {
  if (!bloklanganmi(holat, hozir)) return 0;
  const b = holat.bloklangan;
  if (b === null) return 0;
  const qolgan = b.getTime() + BLOK_DAQIQA * DAQIQA_MS - hozir.getTime();
  return Math.ceil(qolgan / DAQIQA_MS);
}

/**
 * Parol noto'g'ri kiritilgandan keyingi yangi holat.
 *
 * Blok muddati o'tgan bo'lsa hisoblagich noldan boshlanadi — aks holda
 * bir marta bloklangan xodim keyin har xatosida darhol bloklanaverardi.
 */
export function xatodanKeyin(holat: BlokHolati, hozir: Date): BlokHolati {
  // Bloklangan paytdagi urinish hech narsani o'zgartirmaydi. Aks holda har
  // urinish blokni qaytadan boshlab, xodim abadiy qulflanib qolardi —
  // §8 esa qat'iy 15 daqiqa deydi.
  if (bloklanganmi(holat, hozir)) {
    return holat;
  }

  const oldingi = eskirganmi(holat, hozir) ? 0 : holat.xatoUrinish;
  const urinish = oldingi + 1;

  return {
    xatoUrinish: urinish,
    bloklangan: urinish >= MAX_URINISH ? hozir : null,
  };
}

function eskirganmi(holat: BlokHolati, hozir: Date): boolean {
  return holat.bloklangan !== null && !bloklanganmi(holat, hozir);
}

/** Muvaffaqiyatli kirishdan keyin hisoblagich tozalanadi. */
export function muvaffaqiyatdanKeyin(): BlokHolati {
  return BOSHLANGICH;
}

/** Qolgan urinishlar soni — ogohlantirish ko'rsatish uchun. */
export function qolganUrinish(holat: BlokHolati, hozir: Date): number {
  if (bloklanganmi(holat, hozir)) return 0;
  if (eskirganmi(holat, hozir)) return MAX_URINISH;
  return Math.max(0, MAX_URINISH - holat.xatoUrinish);
}
