'use server';

/**
 * app/(panel)/daraja/amal.ts — mato darajasi · QISM 1 §9.4
 *
 * ⚠️ Yaratish `lib/amal/narx-qoida.ts` da (§2.2) — modal oyna ham,
 *    bu sahifa ham AYNAN shuni chaqiradi. Nusxa ko'chirilsa dublikat
 *    tekshiruvi bir joyda qolib ketardi.
 */

import { revalidatePath } from 'next/cache';
import { xatoXabari } from '../xato-xabari';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';

/**
 * Nomini o'zgartirish.
 *
 * ⚠️ Nom NARX JADVALIDA sarlavha bo'lib chiqadi va material
 *    kartochkasidagi ro'yxatda turadi. Bo'sh nom qabul qilinmaydi.
 */
export async function darajaNominiOzgartir(
  id: number,
  yangiNom: string,
): Promise<{ xato: string | null }> {
  const f = await ruxsatTalab('narx.standart.ozgartir');

  const t = yangiNom.trim();
  if (t === '') return { xato: 'Nom kiritilmagan' };
  if (t.length > 120) return { xato: 'Nom juda uzun' };

  const sql = ulanishOl();

  /**
   * ⚠️ Bir xil nomli ikkita daraja bo'lmasligi kerak: narx jadvalida
   *    ikkita «Premium» chiqsa admin qaysi biriga narx qo'yganini
   *    bilmaydi. Bazada ham `lower(btrim(nom))` noyob indeksi bor —
   *    bu tekshiruv tushunarli xabar berish uchun.
   */
  const bor = await sql<{ id: number }[]>`
    SELECT id FROM narx_guruh
    WHERE lower(btrim(nom)) = lower(btrim(${t})) AND id <> ${id}`;

  if (bor[0] !== undefined) return { xato: 'Bunday nomli daraja allaqachon bor' };

  try {
    await sql`
      UPDATE narx_guruh
      SET nom = ${t}, ozgartirdi_id = ${f.xodimId}, ozgartirildi = now()
      WHERE id = ${id}`;

    revalidatePath('/daraja');
    revalidatePath('/narx');
    revalidatePath('/material');
    return { xato: null };
  } catch (x) {
    return { xato: await xatoXabari(x, 'daraja/amal', "O'zgartirib bo'lmadi") };
  }
}
