'use server';

/**
 * app/(panel)/material/amal.ts — TZ 5 · QISM 1 §9.4, §11
 *
 * Har amal SERVER tomonda ruxsat tekshiradi (§9.4) — interfeysda tugmani
 * yashirish yetarli emas.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { materialTahrirla, materialYarat } from '@/lib/amal/material';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { materialSxema } from '@/lib/sxema/material';
import { biznesXatosimi } from '@/lib/xato';
import { kirimniQaytar, maydonlarniOqi } from '../forma-yordamchi';
import { rasmniOqi } from '@/lib/domain/rasm';
import { xatolarniYig, type FormaHolati } from './holat';
import type { YaratilganYozuv } from '../modal-holat';
import { MATERIAL_MAYDONLARI } from './maydonlar';

const MAYDONLAR = MATERIAL_MAYDONLARI;

const formadanOqi = (forma: FormData): Record<string, string> =>
  maydonlarniOqi(forma, MAYDONLAR);

/** ⚠️ Yaratish mantig'i BITTA joyda (§2.2) — sahifa ham, modal ham shuni chaqiradi. */
async function yaratIchki(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati | { readonly saqlandi: YaratilganYozuv }> {
  const f = await ruxsatTalab('material.yarat');

  /**
   * ⚠️ Xom qiymatlar saqlanadi — React 19 formani amaldan keyin
   *    o'zi tozalaydi va xato bo'lganda yozilgan hammasi
   *    yo'qolardi.
   */
  const kirim = formadanOqi(forma);

  const tekshiruv = materialSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(xatolarniYig(tekshiruv.error.issues), oldingi, kirim);
  }

  let id: number;
  try {
    id = await materialYarat(
      ulanishOl(),
      tekshiruv.data,
      f.xodimId,
      rasmniOqi(kirim['rasm'] ?? ''),
    );
  } catch (x) {
    return kirimniQaytar<FormaHolati>(
      {
        xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
        maydonXatolari: {},
      },
      oldingi,
      kirim,
    );
  }

  revalidatePath('/material');
  return { saqlandi: { id, nom: tekshiruv.data.nom } };
}

/** O'z sahifasi — saqlangach ro'yxatga qaytadi. */
export async function materialYaratAmali(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const n = await yaratIchki(oldingi, forma);
  if ('saqlandi' in n) redirect('/material');
  return n;
}

/**
 * Modal oyna — yo'naltirmaydi.
 *
 * ⚠️ `redirect()` modalda chaqirilsa butun sahifa almashib
 *    ketardi va yarim yozilgan kirim hujjati yo'qolardi.
 */
export async function materialModalYaratAmali(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const n = await yaratIchki(oldingi, forma);
  if ('saqlandi' in n) {
    return { xato: null, maydonXatolari: {}, yaratildi: n.saqlandi };
  }
  return n;
}

export async function materialTahrirlaAmali(
  materialId: number,
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const f = await ruxsatTalab('material.ozgartir');

  const kirim = formadanOqi(forma);

  const tekshiruv = materialSxema.safeParse(kirim);
  if (!tekshiruv.success) {
    return kirimniQaytar(xatolarniYig(tekshiruv.error.issues), oldingi, kirim);
  }

  let natija;
  try {
    natija = await materialTahrirla(
      ulanishOl(),
      materialId,
      tekshiruv.data,
      f.xodimId,
      f.filialId,
      rasmniOqi(kirim['rasm'] ?? ''),
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      maydonXatolari: {},
    };
  }

  // TZ 5.3 — qoldiq bor ekan birlik o'zgartirilmaydi, sabab ko'rsatiladi
  if (natija.holat === 'BIRLIK_OZGARMAYDI') {
    return {
      xato:
        `Omborda ${String(natija.qoldiq)} ta bo'lak bor — hisob turi va birliklarni ` +
        "o'zgartirib bo'lmaydi. Qoldiq boshqa birlikda yozilgan va raqam ma'nosini yo'qotadi.",
      maydonXatolari: {},
    };
  }

  revalidatePath('/material');
  redirect('/material');
}
