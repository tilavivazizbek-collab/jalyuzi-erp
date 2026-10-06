'use server';

/**
 * Kontakt, muloqot, va'da va Telegram eslatmasi — server amallari.
 * Egasi auditi 2026-10-06.
 *
 * ⚠️ RUXSAT: yozish `mijoz.yarat` (sotuvchida bor — u qo'ng'iroqni
 *    yozib boradi), kontaktni o'chirish `mijoz.ozgartir`.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { kontaktOchir, kontaktQosh, muloqotYoz, vadaYop } from '@/lib/amal/mijoz-crm';
import { mijozniOgohlantir } from '@/lib/amal/bildirishnoma';
import { qarzEslatmaMatni } from '@/lib/domain/bildirishnoma';
import { dollar, musbatmi, pulKorsat, som } from '@/lib/domain/pul';
import { MULOQOT_TURLARI, type MuloqotTuri } from '@/lib/db/schema';
import { xatoXabari } from '../../xato-xabari';
import { matnMaydon } from '../../forma-yordamchi';
import { mijozQarzi } from '../qarz-malumot';

export interface CrmHolati {
  readonly xato: string | null;
  /** Har muvaffaqiyatda oshadi — forma `key` bilan tozalanadi */
  readonly saqlandi: number;
  readonly xabar?: string | null;
}

const yangila = (mijozId: number): void => {
  revalidatePath(`/mijoz/${String(mijozId)}`);
  revalidatePath('/mijoz/qarzdorlik');
};

const mijozIdOqi = (forma: FormData): number => {
  const n = Number(matnMaydon(forma, 'mijozId'));
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
};

export async function kontaktQoshAmali(oldingi: CrmHolati, forma: FormData): Promise<CrmHolati> {
  const f = await ruxsatTalab('mijoz.yarat');
  const mijozId = mijozIdOqi(forma);
  try {
    await kontaktQosh(
      ulanishOl(),
      mijozId,
      {
        ism: matnMaydon(forma, 'ism'),
        lavozim: matnMaydon(forma, 'lavozim'),
        telefon: matnMaydon(forma, 'telefon'),
        izoh: matnMaydon(forma, 'izoh'),
      },
      f.xodimId,
    );
  } catch (x) {
    return { ...oldingi, xato: await xatoXabari(x, 'mijoz/crm', "Kontaktni saqlab bo'lmadi") };
  }
  yangila(mijozId);
  return { xato: null, saqlandi: oldingi.saqlandi + 1 };
}

export async function kontaktOchirAmali(forma: FormData): Promise<void> {
  const f = await ruxsatTalab('mijoz.ozgartir');
  const id = Number(matnMaydon(forma, 'kontaktId'));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  await kontaktOchir(ulanishOl(), id, f.xodimId);
  yangila(mijozIdOqi(forma));
}

export async function muloqotYozAmali(oldingi: CrmHolati, forma: FormData): Promise<CrmHolati> {
  const f = await ruxsatTalab('mijoz.yarat');
  const mijozId = mijozIdOqi(forma);
  const turiXom = matnMaydon(forma, 'turi');
  const turi: MuloqotTuri = (MULOQOT_TURLARI as readonly string[]).includes(turiXom)
    ? (turiXom as MuloqotTuri)
    : 'IZOH';
  try {
    await muloqotYoz(
      ulanishOl(),
      mijozId,
      {
        turi,
        matn: matnMaydon(forma, 'matn'),
        vadaSana: matnMaydon(forma, 'vadaSana'),
        vadaSumma: matnMaydon(forma, 'vadaSumma'),
        vadaValyuta: matnMaydon(forma, 'vadaValyuta') === 'USD' ? 'USD' : 'SOM',
      },
      f.xodimId,
    );
  } catch (x) {
    return { ...oldingi, xato: await xatoXabari(x, 'mijoz/crm', "Yozuvni saqlab bo'lmadi") };
  }
  yangila(mijozId);
  return { xato: null, saqlandi: oldingi.saqlandi + 1 };
}

export async function vadaYopAmali(forma: FormData): Promise<void> {
  await ruxsatTalab('mijoz.yarat');
  const id = Number(matnMaydon(forma, 'muloqotId'));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  await vadaYop(ulanishOl(), id);
  yangila(mijozIdOqi(forma));
}

/**
 * TZ 13.6 — qarz eslatmasi Telegram orqali (egasi auditi 2026-10-06).
 *
 * ⚠️ `QARZ_ESLATMA` hodisasi va uning matni (`qarzEslatmaMatni`)
 *    ilgaridan bor edi, lekin uni yuboradigan tugma yo'q edi.
 *
 * ⚠️ Xabar NAVBATGA qo'yiladi — bot yuboradi. Yetib bormasa
 *    buyurtma kartochkasidagi «Eslatmalar» da qizil chiqadi (13.11).
 *    Yuborilgani muloqot tarixiga ham yoziladi.
 */
export async function telegramEslatmaAmali(
  oldingi: CrmHolati,
  forma: FormData,
): Promise<CrmHolati> {
  const f = await ruxsatTalab('mijoz.yarat');
  const mijozId = mijozIdOqi(forma);
  try {
    const qarz = await mijozQarzi(mijozId, 1);
    const qismlar: string[] = [];
    if (musbatmi(som(qarz.som))) qismlar.push(`${pulKorsat(som(qarz.som))} so‘m`);
    if (musbatmi(dollar(qarz.dollar))) qismlar.push(`${pulKorsat(dollar(qarz.dollar))} $`);
    if (qismlar.length === 0) {
      return { ...oldingi, xato: "Mijozda qarz yo'q — eslatma yuborilmadi" };
    }
    const summa = qismlar.join(' va ');

    const n = await mijozniOgohlantir(
      ulanishOl(),
      { mijozId, matn: qarzEslatmaMatni(summa), manbaTuri: 'qarz_eslatma', manbaId: mijozId },
      f.xodimId,
    );
    if (!n.yozildi) {
      return { ...oldingi, xato: 'Mijoz botga ulanmagan — qo‘ng‘iroq qiling' };
    }
    await muloqotYoz(
      ulanishOl(),
      mijozId,
      { turi: 'XABAR', matn: `Telegramda qarz eslatmasi yuborildi: ${summa}` },
      f.xodimId,
    );
    yangila(mijozId);
    return { xato: null, saqlandi: oldingi.saqlandi + 1, xabar: `Eslatma navbatga qo‘yildi: ${summa}` };
  } catch (x) {
    return { ...oldingi, xato: await xatoXabari(x, 'mijoz/crm', "Eslatmani yuborib bo'lmadi") };
  }
}
