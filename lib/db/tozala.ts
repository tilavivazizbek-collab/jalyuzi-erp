/**
 * lib/db/tozala.ts — ish ma'lumotlarini tozalash.
 *
 * ⚠️ QAYTARIB BO'LMAYDI. Faqat egasi so'raganda ishlatiladi va
 *    `URUG_TOZALASHGA_RUXSAT=ha` talab qiladi.
 *
 * ⚠️ NIMA QOLADI: filial, rol, ruxsat, xodim, sozlama, kurs.
 *    Ular tozalansa tizimga KIRIB BO'LMASDI va hamma sozlamani
 *    qaytadan qilish kerak bo'lardi.
 *
 * ⚠️ `TRUNCATE` ishlatiladi, `DELETE` emas: pul va ombor
 *    jadvallarida o'chirishni to'sadigan trigger bor (§6.5).
 *    U `DELETE` ni to'sadi — bu to'g'ri himoya. `TRUNCATE` esa
 *    ataylab qilinadigan, alohida ruxsat talab qiladigan amal.
 */

import type postgres from 'postgres';

/**
 * Ish ma'lumoti — tozalanadi.
 *
 * ⚠️ Tartib muhim emas: `CASCADE` bog'liqlarni o'zi hal qiladi.
 */
export const TOZALANADIGAN = [
  // Buyurtma va ishlab chiqarish
  'qayta_kesish',
  'pozitsiya_aksessuar',
  'pozitsiya_material',
  'band',
  'buyurtma_pozitsiya',
  'buyurtma',
  // Ombor
  'ombor_harakat',
  'inventarizatsiya_qator',
  'inventarizatsiya',
  'kochirish_qator',
  'kochirish',
  'bolak',
  'kirim_qator',
  'kirim',
  // Pul
  'kassa_kun',
  'kassa_yozuv',
  'kassa',
  'topshiriq',
  'xarajat',
  'filial_harakat',
  'mijoz_harakat',
  'yetkazib_beruvchi_harakat',
  'xodim_harakat',
  // Ma'lumotnomalar
  'material_filial_narx',
  'mahsulot_aksessuar',
  'mahsulot_parametr',
  'mahsulot_slot',
  'mahsulot_tur',
  'material',
  'almashtirish_guruh',
  'mijoz',
  'yetkazib_beruvchi',
  'stavka',
  // Bot va jurnal
  'bot_xabar',
  'bot_sessiya',
  'audit_jurnal',
  'amal_kaliti',
] as const;

/**
 * Tegilmaydi — bularsiz tizim ishlamaydi.
 *
 *   filial · rol · ruxsat · rol_ruxsat · xodim · xodim_rol
 *   sessiya · sozlama · kurs_tarix
 */
export const SAQLANADIGAN = [
  'filial',
  'rol',
  'ruxsat',
  'rol_ruxsat',
  'xodim',
  'xodim_rol',
  'sessiya',
  'sozlama',
  'kurs_tarix',
] as const;

export interface TozalashNatijasi {
  readonly jadval: string;
  readonly oldin: number;
}

export async function ishMalumotlariniTozala(
  ulanish: postgres.Sql,
): Promise<TozalashNatijasi[]> {
  const natija: TozalashNatijasi[] = [];

  for (const jadval of TOZALANADIGAN) {
    const q = await ulanish.unsafe(`SELECT count(*)::int AS n FROM ${jadval}`);
    natija.push({ jadval, oldin: (q[0] as { n: number } | undefined)?.n ?? 0 });
  }

  /**
   * ⚠️ Bitta buyruqda: jadvallar bir-biriga bog'langan va
   *    alohida-alohida tozalash chala holat qoldirardi.
   */
  await ulanish.unsafe(
    `TRUNCATE TABLE ${TOZALANADIGAN.join(', ')} RESTART IDENTITY CASCADE`,
  );

  return natija.filter((n) => n.oldin > 0);
}
