'use server';

/**
 * app/kirish/amal.ts — kirish formasi server amali
 *
 * QISM 1 §11: server mijoz tomonidagi tekshiruvga ishonmaydi — Zod
 * shu yerda qayta ishlaydi.
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ulanishOl } from '@/lib/db';
import { kir } from '@/lib/amal/kirish';
import { telefonKanonik } from '@/lib/domain/telefon';
import { kirishSxema } from '@/lib/sxema/kirish';
import { sessiyaCookieQoy } from '@/lib/kirish/cookie';
import type { KirishHolati } from './holat';


/**
 * `FormData.get()` matn ham, FAYL ham qaytaradi. To'g'ridan-to'g'ri
 * `String()` qilinsa fayl `[object Object]` bo'lib ketadi va u parol
 * o'rniga tekshiruvga tushadi — shuning uchun turi aniq tekshiriladi.
 */
function matnMaydon(forma: FormData, nom: string): string {
  const qiymat = forma.get(nom);
  return typeof qiymat === 'string' ? qiymat : '';
}

export async function kirishAmali(
  _oldingi: KirishHolati,
  forma: FormData,
): Promise<KirishHolati> {
  const telefonXom = matnMaydon(forma, 'telefon');
  const parol = matnMaydon(forma, 'parol');

  const tekshiruv = kirishSxema.safeParse({ telefon: telefonXom, parol });
  if (!tekshiruv.success) {
    const birinchi = tekshiruv.error.issues[0];
    return { xato: birinchi?.message ?? "Ma'lumot noto'g'ri", telefon: telefonXom };
  }

  const sarlavha = await headers();
  const natija = await kir(ulanishOl(), {
    telefon: telefonKanonik(tekshiruv.data.telefon),
    parol: tekshiruv.data.parol,
    ip: sarlavha.get('x-forwarded-for') ?? sarlavha.get('x-real-ip'),
    qurilma: sarlavha.get('user-agent'),
  });

  switch (natija.holat) {
    case 'OK':
      await sessiyaCookieQoy(natija.token);
      break;

    case 'BLOKLANGAN':
      return {
        xato: `Hisob vaqtincha bloklangan. ${String(natija.qolganDaqiqa)} daqiqadan keyin urinib ko'ring.`,
        telefon: telefonXom,
      };

    case 'USTA_SAYTGA_KIRMAYDI':
      return {
        xato: "Usta saytga kirmaydi — Telegram botdan foydalaning.",
        telefon: telefonXom,
      };

    case 'NOTOGRI':
      // Telefon topilmadimi yoki parol xatomi — ayrilmaydi (§16)
      return { xato: "Telefon raqami yoki parol noto'g'ri.", telefon: telefonXom };
  }

  redirect('/boshqaruv');
}
