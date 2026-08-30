'use server';

/**
 * app/(panel)/material/amal.ts — TZ 5 · QISM 1 §9.4, §11
 *
 * Har amal SERVER tomonda ruxsat tekshiradi (§9.4) — interfeysda tugmani
 * yashirish yetarli emas.
 */

import { xatoXabari } from '../xato-xabari';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { materialTahrirla, materialYarat } from '@/lib/amal/material';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { materialSxema, zahiraSxema, type ZahiraKirimi } from '@/lib/sxema/material';
import { biznesXatosimi } from '@/lib/xato';
import {
  FORMA_XATO_XABARI,
  kirimniQaytar,
  matnMaydon,
  maydonXatolari,
  maydonlarniOqi,
  type MaydonXatolari,
} from '../forma-yordamchi';
import { boshlangichQoldiq } from '@/lib/amal/boshlangich';
import { rulonKvMTannarxi } from '@/lib/domain/boshlangich-narx';
import { som } from '@/lib/domain/pul';
import { kutilmaganXatoniYoz } from '@/lib/xato-jurnal';
import { rasmniOqi } from '@/lib/domain/rasm';
import { xatolarniYig, type FormaHolati } from './holat';
import type { YaratilganYozuv } from '../modal-holat';
import { MATERIAL_MAYDONLARI } from './maydonlar';

const MAYDONLAR = MATERIAL_MAYDONLARI;

const formadanOqi = (forma: FormData): Record<string, string> =>
  maydonlarniOqi(forma, MAYDONLAR);

/**
 * «Omborda hozir bor» bo'limi — TZ 7.10.
 *
 * ⚠️ Bo'sh bo'lsa `null` qaytadi va hech narsa yozilmaydi.
 *    Zahirasi yo'q mahsulot ham bo'ladi.
 */
function zahiraniOqi(forma: FormData): ZahiraKirimi | 'YOQ' | { xatolar: MaydonXatolari } {
  const narx = matnMaydon(forma, 'zahiraNarx');
  const miqdor = matnMaydon(forma, 'zahiraMiqdor');
  const xomBolaklar = matnMaydon(forma, 'zahiraBolaklar');

  let bolaklar: unknown = [];
  if (xomBolaklar !== '') {
    try {
      bolaklar = JSON.parse(xomBolaklar);
    } catch {
      bolaklar = [];
    }
  }

  const bolakBor = Array.isArray(bolaklar) && bolaklar.length > 0;

  /** Hech narsa kiritilmagan — bo'lim ochilmagan */
  if (narx === '' && miqdor === '' && !bolakBor) return 'YOQ';

  const n = zahiraSxema.safeParse({
    bolaklar,
    miqdor: miqdor === '' ? null : Number(miqdor),
    narx,
    asos: matnMaydon(forma, 'kirimNarxAsosi'),
    izoh: matnMaydon(forma, 'zahiraIzoh'),
  });

  if (!n.success) return { xatolar: maydonXatolari(n.error.issues) };

  /**
   * ⚠️ Miqdor ham, o'lcham ham yo'q — «narxni yozdim, miqdorni
   *    unutdim» holati. Jimgina o'tkazib yuborilsa, egasi
   *    zahira kiritdim deb o'ylab qolardi.
   */
  if (n.data.bolaklar.length === 0 && n.data.miqdor === null) {
    return { xatolar: { miqdor: "Miqdorni yoki rulon o'lchamini kiriting" } };
  }

  return n.data;
}

/** ⚠️ Yaratish mantig'i BITTA joyda (§2.2) — sahifa ham, modal ham shuni chaqiradi. */
async function yaratIchki(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<
  | FormaHolati
  | { readonly saqlandi: YaratilganYozuv; readonly boshlangichQilaOladi: boolean }
> {
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

  /** ⚠️ Zahira MAHSULOTDAN OLDIN tekshiriladi — yarim ish qolmasin */
  const zahira = zahiraniOqi(forma);
  if (typeof zahira === 'object' && 'xatolar' in zahira) {
    return kirimniQaytar<FormaHolati>(
      {
        xato: FORMA_XATO_XABARI,
        maydonXatolari: {},
        zahiraXatolari: zahira.xatolar,
      },
      oldingi,
      kirim,
    );
  }

  const rulonmi = tekshiruv.data.hisobTuri === 'RULON';

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
        xato: await xatoXabari(x, 'material/amal', 'Saqlashda xato yuz berdi'),
        maydonXatolari: {},
      },
      oldingi,
      kirim,
    );
  }

  /**
   * ⚠️ Mahsulot SAQLANDI. Zahira esa alohida tranzaksiya —
   *    u yiqilsa mahsulot qolaveradi va egasi zahirani
   *    keyin «Boshlang'ich qoldiq» ekranidan kiritadi.
   *
   *    Shuning uchun tekshiruv MAHSULOTDAN OLDIN qilingan:
   *    noto'g'ri raqam bilan yarim ish qolmasin.
   */
  if (zahira !== 'YOQ') {
    try {
      await boshlangichQoldiq(
        ulanishOl(),
        {
          materialId: id,
          filialId: f.filialId,
          bolaklar: zahira.bolaklar,
          miqdor: zahira.miqdor,
          tannarxBirlik: rulonmi
            ? rulonKvMTannarxi(zahira.asos, som(zahira.narx), zahira.bolaklar)
            : zahira.narx,
          izoh: zahira.izoh ?? null,
        },
        f.xodimId,
      );
    } catch (x) {
      await kutilmaganXatoniYoz(x, 'material-zahira');
      return kirimniQaytar<FormaHolati>(
        {
          xato: biznesXatosimi(x)
            ? `Mahsulot saqlandi, lekin zahira yozilmadi: ${x.message}`
            : "Mahsulot saqlandi, lekin zahira yozilmadi — «Boshlang'ich qoldiq» dan kiriting",
          maydonXatolari: {},
        },
        oldingi,
        kirim,
      );
    }
  }

  revalidatePath('/material');
  revalidatePath('/ombor');
  return {
    saqlandi: { id, nom: tekshiruv.data.nom },
    boshlangichQilaOladi: ruxsatBormi(f, 'ombor.boshlangich'),
  };
}

/**
 * O'z sahifasi — saqlangach BOSHLANG'ICH QOLDIQ ekraniga o'tadi.
 *
 * ⚠️ Ilgari ro'yxatga qaytardi va «omborda hozir nechta bor?»
 *    degan savol berilmasdi. Natijada yangi mahsulot qoldig'i
 *    nol bo'lib turardi: sotuvda «material yetmadi» chiqardi,
 *    omborchi esa mato javonda turganini ko'rib turardi.
 *
 *    Endi savol darhol beriladi. Zahira yo'q bo'lsa o'sha
 *    ekranda «O'tkazib yuborish» bosiladi.
 *
 * ⚠️ Ruxsati yo'q odam (masalan sotuvchi) ro'yxatga qaytadi —
 *    unga bu ekran ochilmaydi (§9.4).
 */
export async function materialYaratAmali(
  oldingi: FormaHolati,
  forma: FormData,
): Promise<FormaHolati> {
  const n = await yaratIchki(oldingi, forma);
  if ('saqlandi' in n) {
    redirect(
      n.boshlangichQilaOladi
        ? `/ombor/boshlangich/${String(n.saqlandi.id)}?yangi=1`
        : '/material',
    );
  }
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
      xato: await xatoXabari(x, 'material/amal', 'Saqlashda xato yuz berdi'),
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
