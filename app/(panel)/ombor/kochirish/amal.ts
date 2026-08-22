'use server';

/**
 * app/(panel)/ombor/kochirish/amal.ts — TZ 20.7 · 22.4
 *
 * Ruxsat SERVER tomonda tekshiriladi (§20.2). Har amal filialga
 * bog'langan: jo'natishni beruvchi, qabulni qabul qiluvchi filial
 * bajaradi (20.7.1).
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import {
  kochirishBekorQil,
  kochirishJonat,
  kochirishQabulQil,
  kochirishSora,
} from '@/lib/amal/kochirish';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import {
  kochirishBekorSxema,
  kochirishJonatSxema,
  kochirishQabulSxema,
  kochirishSoraSxema,
} from '@/lib/sxema/kochirish';
import { matnMaydon, maydonXatolari, FORMA_XATO_XABARI } from '../../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type { KochirishHolati } from './holat';

function jsonOqi(forma: FormData, nom: string): unknown {
  const matn = matnMaydon(forma, nom);
  if (matn === '') return [];
  try {
    return JSON.parse(matn);
  } catch {
    return [];
  }
}

/** Bo'sh matn — «kiritilmagan». Zod `optional` shu bilan ishlaydi. */
function ixtiyoriy(forma: FormData, nom: string): string | undefined {
  const q = matnMaydon(forma, nom).trim();
  return q === '' ? undefined : q;
}

/** TZ 20.7.1 — 1-qadam: qabul qiluvchi filial so'rov ochadi. */
export async function kochirishSoraAmali(
  _oldingi: KochirishHolati,
  forma: FormData,
): Promise<KochirishHolati> {
  const f = await ruxsatTalab('ombor.kochirish.yarat');

  const tekshiruv = kochirishSoraSxema.safeParse({
    kimgaFilialId: matnMaydon(forma, 'kimgaFilialId'),
    izoh: ixtiyoriy(forma, 'izoh'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  let id: number;
  try {
    /**
     * ⚠️ So'rovni QABUL QILUVCHI ochadi (20.7.1), shuning uchun
     *    `kimdan` — formada tanlangan filial, `kimga` — o'zimiz.
     */
    const n = await kochirishSora(
      ulanishOl(),
      {
        kimdanFilialId: tekshiruv.data.kimgaFilialId,
        kimgaFilialId: f.filialId,
        izoh: tekshiruv.data.izoh ?? null,
      },
      f.xodimId,
    );
    id = n.id;
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : "So'rov yaratilmadi",
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/ombor/kochirish');
  redirect(`/ombor/kochirish/${String(id)}`);
}

/** TZ 20.7.1 — 2-qadam: beruvchi filial omborchisi bo'laklarni jo'natadi. */
export async function kochirishJonatAmali(
  _oldingi: KochirishHolati,
  forma: FormData,
): Promise<KochirishHolati> {
  const f = await ruxsatTalab('ombor.kochirish.jonat');

  const tekshiruv = kochirishJonatSxema.safeParse({
    kochirishId: matnMaydon(forma, 'kochirishId'),
    bolakIdlar: jsonOqi(forma, 'bolakIdlar'),
    qarzSumma: ixtiyoriy(forma, 'qarzSumma'),
    qarzSabab: ixtiyoriy(forma, 'qarzSabab'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  try {
    await kochirishJonat(
      ulanishOl(),
      {
        kochirishId: tekshiruv.data.kochirishId,
        bolakIdlar: tekshiruv.data.bolakIdlar,
        qarzSumma: tekshiruv.data.qarzSumma ?? null,
        qarzSabab: tekshiruv.data.qarzSabab ?? null,
      },
      f.filialId,
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : "Jo'natilmadi",
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/ombor');
  revalidatePath('/ombor/kochirish');
  revalidatePath(`/ombor/kochirish/${String(tekshiruv.data.kochirishId)}`);
  return { xato: null, maydonlar: {}, bajarildi: true };
}

/** TZ 20.7.1 — 3-qadam: qabul qiluvchi filial tasdiqlaydi. */
export async function kochirishQabulAmali(
  _oldingi: KochirishHolati,
  forma: FormData,
): Promise<KochirishHolati> {
  const f = await ruxsatTalab('ombor.kochirish.qabul');

  const tekshiruv = kochirishQabulSxema.safeParse({
    kochirishId: matnMaydon(forma, 'kochirishId'),
    tuzatishlar: jsonOqi(forma, 'tuzatishlar'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  try {
    await kochirishQabulQil(
      ulanishOl(),
      {
        kochirishId: tekshiruv.data.kochirishId,
        tuzatishlar: tekshiruv.data.tuzatishlar,
      },
      f.filialId,
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Qabul qilinmadi',
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/ombor');
  revalidatePath('/ombor/kochirish');
  revalidatePath('/filial/hisob');
  revalidatePath(`/ombor/kochirish/${String(tekshiruv.data.kochirishId)}`);
  return { xato: null, maydonlar: {}, bajarildi: true };
}

/** EC-FQ-02 — bekor qilish: qarz yozilmaydi, bo'laklar qaytadi. */
export async function kochirishBekorAmali(
  _oldingi: KochirishHolati,
  forma: FormData,
): Promise<KochirishHolati> {
  const f = await ruxsatTalab('ombor.kochirish.jonat');

  const tekshiruv = kochirishBekorSxema.safeParse({
    kochirishId: matnMaydon(forma, 'kochirishId'),
    sabab: matnMaydon(forma, 'sabab'),
  });

  if (!tekshiruv.success) {
    return {
      xato: FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      bajarildi: false,
    };
  }

  try {
    await kochirishBekorQil(
      ulanishOl(),
      { kochirishId: tekshiruv.data.kochirishId, sabab: tekshiruv.data.sabab },
      f.filialId,
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Bekor qilinmadi',
      maydonlar: {},
      bajarildi: false,
    };
  }

  revalidatePath('/ombor');
  revalidatePath('/ombor/kochirish');
  revalidatePath(`/ombor/kochirish/${String(tekshiruv.data.kochirishId)}`);
  return { xato: null, maydonlar: {}, bajarildi: true };
}
