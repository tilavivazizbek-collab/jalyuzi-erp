'use server';

/**
 * app/(panel)/narx/amal.ts — «Narxlar va turlar» · TZ 3.8 · QISM 1 §9.4
 *
 * Narx jadvali dinamik: bosqich va qo'shimcha qatorlari qo'shiladi va
 * o'chiriladi. Ular formaga JSON bo'lib keladi — `mahsulot/amal.ts`
 * dagi kabi, chunki qatorlar tartibi ham muhim.
 */

import { revalidatePath } from 'next/cache';
import { xatoXabari } from '../xato-xabari';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { turNarxiniSaqla } from '@/lib/amal/narx-qoida';
import { turNarxiSxema } from '@/lib/sxema/narx-qoida';
import { turQoidalariniOl, type QoidaQatori } from './malumot';
import type { NarxHolati } from './holat';

function xom(forma: FormData, nom: string): string {
  const q = forma.get(nom);
  return typeof q === 'string' ? q : '';
}

function jsonOqi(forma: FormData, nom: string): unknown {
  const matn = xom(forma, nom);
  if (matn === '') return [];
  try {
    return JSON.parse(matn);
  } catch {
    return [];
  }
}

/** Tanlangan turning butun narx sozlamasini saqlaydi. */
export async function narxSaqlaAmali(
  _oldingi: NarxHolati,
  forma: FormData,
): Promise<NarxHolati> {
  const f = await ruxsatTalab('narx.standart.ozgartir');

  /** ⚠️ Bo'sh — «materialni o'zi sotish», mahsulot turi yo'q */
  const turMatni = xom(forma, 'mahsulotTurId').trim();
  /** ⚠️ Bo'sh — UMUMIY jadval, ya'ni alohida jadvali yo'q hammaga (0059) */
  const materialMatni = xom(forma, 'materialId').trim();

  const tekshiruv = turNarxiSxema.safeParse({
    mahsulotTurId: turMatni === '' ? null : Number(turMatni),
    /**
     * ⚠️ 0059 — `hammaTurga` bilan BIR XIL TUZOQ. Ro'yxatga
     *    qo'shilmasa forma yuborar, sxema qabul qilar, server esa
     *    jimgina tashlab yuborardi: karniz uchun ochilgan jadval
     *    UMUMIY bo'lib saqlanib, hamma materialning narxini
     *    o'zgartirib yuborardi.
     */
    materialId: materialMatni === '' ? null : Number(materialMatni),
    /**
     * ⚠️ 0055 — bu maydon SHU RO'YXATGA qo'shilmasa, forma
     *    yuborar, sxema qabul qilar, server esa jimgina tashlab
     *    yuborardi va standart narx «materialni o'zi sotish»
     *    qatori bo'lib yozilardi. Shu xato 0049 da bo'lgan.
     */
    hammaTurga: forma.get('hammaTurga') === '1',
    qoidalar: jsonOqi(forma, 'qoidalar'),
    qoshimchalar: jsonOqi(forma, 'qoshimchalar'),
  });

  if (!tekshiruv.success) {
    return {
      xato: 'Formada xato bor',
      saqlandi: false,
      nuqsonlar: tekshiruv.error.issues.map((x) => {
        const joy = x.path.map((p) => String(p)).join('.');
        return joy === '' ? x.message : `${joy}: ${x.message}`;
      }),
    };
  }

  try {
    const natija = await ulanishOl().begin(async (tx) =>
      turNarxiniSaqla(tx, tekshiruv.data, f.xodimId),
    );

    if (natija.holat === 'NUQSON') {
      return {
        xato: 'Saqlanmadi — quyidagilarni tuzating',
        nuqsonlar: natija.xabarlar,
        saqlandi: false,
      };
    }
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'narx/amal', 'Saqlashda xato yuz berdi'),
      nuqsonlar: [],
      saqlandi: false,
    };
  }

  revalidatePath('/narx');
  revalidatePath('/sotuv');
  return { xato: null, nuqsonlar: [], saqlandi: true };
}

export async function turNarxlariniNusxalaAmali(
  manbaTurId: number,
): Promise<{ readonly xato: string | null; readonly qoidalar: readonly QoidaQatori[] }> {
  await ruxsatTalab('narx.standart.ozgartir');

  try {
    const qoidalar = await turQoidalariniOl(manbaTurId);
    return { xato: null, qoidalar };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'narx/nusxa', "Narx jadvalini o'qib bo'lmadi"),
      qoidalar: [],
    };
  }
}
