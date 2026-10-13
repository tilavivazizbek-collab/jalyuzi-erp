'use server';

/**
 * Xarajat turlari — 0066 · QISM 1 §9.4. 2026-10-13
 *
 * ⚠️ Yaratish va nomlash `lib/amal/xarajat-turi.ts` da (§2.2) — kassa
 *    formasidagi modal ham, ro'yxat sahifasi ham AYNAN shuni chaqiradi.
 * ⚠️ Ruxsat — `sozlama.ozgartir`: tur foyda-zarar tuzilmasini o'zgartiradi,
 *    uni xarajat yozuvchi har kim emas, egasi (admin) belgilaydi.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { xarajatTuriNominiOzgartir, xarajatTuriYarat } from '@/lib/amal/xarajat-turi';
import { xatoXabari } from '../xato-xabari';
import type { XarajatTuriHolati } from './holat';

export async function xarajatTuriYaratAmali(
  _oldingi: XarajatTuriHolati,
  forma: FormData,
): Promise<XarajatTuriHolati> {
  const f = await ruxsatTalab('sozlama.ozgartir');
  const nom = forma.get('nom');
  if (typeof nom !== 'string') return { xato: 'Nom kiritilmagan', yaratildi: null };
  try {
    const y = await xarajatTuriYarat(ulanishOl(), nom, f.xodimId);
    revalidatePath('/xarajat-turi');
    revalidatePath('/kassa');
    return { xato: null, yaratildi: { id: y.id, nom: y.nom } };
  } catch (x) {
    return { xato: await xatoXabari(x, 'xarajat-turi/amal', "Xarajat turi qo'shilmadi"), yaratildi: null };
  }
}

export async function xarajatTuriNominiOzgartirAmali(id: number, nom: string): Promise<{ xato: string | null }> {
  const f = await ruxsatTalab('sozlama.ozgartir');
  try {
    await xarajatTuriNominiOzgartir(ulanishOl(), id, nom, f.xodimId);
    revalidatePath('/xarajat-turi');
    return { xato: null };
  } catch (x) {
    return { xato: await xatoXabari(x, 'xarajat-turi/amal', "O'zgartirib bo'lmadi") };
  }
}
