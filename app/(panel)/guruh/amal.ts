'use server';

/**
 * app/(panel)/guruh/amal.ts — TZ 5.6 · QISM 1 §9.4
 *
 * ⚠️ Yaratish `lib/amal/tez-qosh.ts` da (§2.2) — modal oyna ham,
 *    bu sahifa ham AYNAN shuni chaqiradi. Nusxa ko'chirilsa
 *    dublikat tekshiruvi bir joyda qolib ketardi.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { guruhTezYarat } from '@/lib/amal/tez-qosh';
import { biznesXatosimi } from '@/lib/xato';
import type { GuruhHolati } from '../guruh-holat';

/** Ro'yxat sahifasidan yangi guruh qo'shish. */
export async function guruhYaratAmali(
  _oldingi: GuruhHolati,
  forma: FormData,
): Promise<GuruhHolati> {
  const f = await ruxsatTalab('material.ozgartir');

  const nom = forma.get('nom');
  if (typeof nom !== 'string') return { xato: 'Nom kiritilmagan', yaratildi: null };

  try {
    const y = await guruhTezYarat(nom, f.xodimId);
    revalidatePath('/guruh');
    revalidatePath('/material');
    return { xato: null, yaratildi: { id: y.id, nom: y.nom } };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : "Guruh qo'shilmadi",
      yaratildi: null,
    };
  }
}

/**
 * Nomini o'zgartirish.
 *
 * ⚠️ Nom SOTUVDA ko'rinadi — slot sarlavhasi bo'lib chiqadi.
 *    Shuning uchun bo'sh nom qabul qilinmaydi.
 */
export async function guruhNominiOzgartir(
  id: number,
  yangiNom: string,
): Promise<{ xato: string | null }> {
  const f = await ruxsatTalab('material.ozgartir');

  const t = yangiNom.trim();
  if (t === '') return { xato: 'Nom kiritilmagan' };
  if (t.length > 120) return { xato: 'Nom juda uzun' };

  const sql = ulanishOl();

  /**
   * ⚠️ Bir xil nomli ikkita guruh bo'lmasligi kerak: sotuvda
   *    ikkita «To'rli matolar» chiqsa sotuvchi qaysi birini
   *    tanlashni bilmaydi.
   */
  const bor = await sql<{ id: number }[]>`
    SELECT id FROM almashtirish_guruh
    WHERE lower(nom) = lower(${t}) AND faol = true AND id <> ${id}`;

  if (bor[0] !== undefined) return { xato: 'Bunday nomli guruh allaqachon bor' };

  try {
    await sql`
      UPDATE almashtirish_guruh
      SET nom = ${t}, ozgartirdi_id = ${f.xodimId}, ozgartirildi = now()
      WHERE id = ${id}`;

    revalidatePath('/guruh');
    revalidatePath('/material');
    return { xato: null };
  } catch (x) {
    return { xato: biznesXatosimi(x) ? x.message : "O'zgartirib bo'lmadi" };
  }
}
