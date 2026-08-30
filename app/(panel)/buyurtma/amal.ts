'use server';

/**
 * app/(panel)/buyurtma/amal.ts — TZ 8.4 · QISM 1 §9.4 · Q-25
 */

import { xatoXabari } from '../xato-xabari';
import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { xabarniQaytaYubor } from '@/lib/amal/bildirishnoma';
import { pozitsiyaniTasdiqla } from '@/lib/amal/buyurtma';
import {
  ishniQaytaribOl,
  pozitsiyaniBekorQil,
  pozitsiyaniRadEt,
  pozitsiyaniTopshir,
  pozitsiyaYetibKeldi,
} from '@/lib/amal/ish';
import { pozitsiyaniQaytar, type OrtiqchaYol } from '@/lib/amal/qaytarish';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { matnMaydon } from '../forma-yordamchi';
import type { AmalHolati, TasdiqHolati } from './holat';

export async function tasdiqlashAmali(
  _oldingi: TasdiqHolati,
  forma: FormData,
): Promise<TasdiqHolati> {
  const f = await ruxsatTalab('buyurtma.tasdiqla');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', materialgaKutmoqda: false };
  }

  // Q-25 — boshqa filial buyurtmasini tasdiqlab bo'lmaydi
  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE p.id = ${pozitsiyaId} AND b.sotgan_filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', materialgaKutmoqda: false };
  }

  try {
    const n = await pozitsiyaniTasdiqla(sql, pozitsiyaId, f.xodimId);

    revalidatePath('/buyurtma');
    revalidatePath('/ombor');

    return {
      xato: null,
      materialgaKutmoqda: n.holat === 'MATERIALGA_KUTMOQDA',
    };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Tasdiqlashda xato yuz berdi'),
      materialgaKutmoqda: false,
    };
  }
}

/** O'z filialidagi pozitsiyani topadi — Q-25. */
async function ozFilialidami(pozitsiyaId: number, filialId: number): Promise<boolean> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE p.id = ${pozitsiyaId}
      AND (b.sotgan_filial_id = ${filialId} OR b.ishlab_chiqaruvchi_filial_id = ${filialId})`;
  return (q[0]?.n ?? 0) > 0;
}

/**
 * TZ 8.8 — pozitsiyani bekor qilish.
 *
 * Band bo'shaydi va material omborga qaytadi (Q-06). Ish boshlangach
 * tugma ko'rinmaydi, lekin tekshiruv SERVERDA ham bor (§9.4).
 */
export async function bekorAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.bekor');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }
  if (!(await ozFilialidami(pozitsiyaId, f.filialId))) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', bajarildi: false };
  }

  try {
    await pozitsiyaniBekorQil(ulanishOl(), pozitsiyaId, sabab, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Bekor qilishda xato yuz berdi'),
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  revalidatePath('/ombor');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 8.6 — admin ishni ustadan qaytarib oladi.
 *
 * ⚠️ Stavkani ADMIN QO'LDA kiritadi: usta ishning bir qismini bajargan
 *    bo'lishi mumkin. Sabab majburiy.
 */
export async function qaytaribOlishAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.tahrirla');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  const stavka = matnMaydon(forma, 'stavka');
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(stavka.trim())) {
    return { xato: "To'lanadigan stavkani kiriting", bajarildi: false };
  }
  if (!(await ozFilialidami(pozitsiyaId, f.filialId))) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', bajarildi: false };
  }

  try {
    await ishniQaytaribOl(ulanishOl(), pozitsiyaId, stavka.trim(), sabab, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Qaytarib olishda xato yuz berdi'),
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 8.9 — topshirish. Qisman topshirish MUMKIN: uchtadan bittasi
 * tayyor bo'lsa mijoz shuni olib keta oladi.
 *
 * ⚠️ Topshirish pulga TEGMAYDI — to'lov alohida hodisa (12.4). Mijoz
 *    qarzga olib ketishi mumkin.
 */
/**
 * TZ 20.5.1 — «Yetib keldi» — tayyor mahsulot sotgan filialga keldi.
 *
 * ⚠️ Bosilmaguncha mahsulot YO'LDA hisoblanadi. Shu sababli u qo'lda
 *    bosiladi: avtomatik qo'yilsa hech kim ko'rmagan mahsulot
 *    «kelgan» bo'lib qolardi.
 */
export async function yetibKeldiAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.tahrirla');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }

  try {
    await pozitsiyaYetibKeldi(ulanishOl(), pozitsiyaId, f.filialId, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Qabul qilinmadi'),
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  return { xato: null, bajarildi: true };
}

export async function topshirishAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.tahrirla');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }
  if (!(await ozFilialidami(pozitsiyaId, f.filialId))) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', bajarildi: false };
  }

  try {
    await pozitsiyaniTopshir(ulanishOl(), pozitsiyaId, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Topshirishda xato yuz berdi'),
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 8.8 · 8.10 — rad etish: mahsulot tayyor, mijoz olmadi.
 *
 * ⚠️ Bu QAYTARISH EMAS. Pozitsiya «sotilmagan tayyor mahsulot»
 *    ro'yxatiga tushadi (7.13).
 */
export async function radEtishAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.bekor');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }
  if (!(await ozFilialidami(pozitsiyaId, f.filialId))) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', bajarildi: false };
  }

  try {
    await pozitsiyaniRadEt(ulanishOl(), pozitsiyaId, sabab, f.xodimId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Rad etishda xato yuz berdi'),
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 8.10 — qaytarish.
 *
 * ⚠️ Summani SOTUVCHI kiritadi, chegara yo'q, izoh majburiy.
 */
export async function qaytarishAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('kassa.tolov');

  const pozitsiyaId = Number(matnMaydon(forma, 'pozitsiyaId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const kassaMatn = matnMaydon(forma, 'kassaId').trim();
  const ortiqchaYoli: OrtiqchaYol =
    matnMaydon(forma, 'ortiqchaYoli') === 'AVANS' ? 'AVANS' : 'NAQD';
  const izoh = matnMaydon(forma, 'izoh');

  if (!Number.isSafeInteger(pozitsiyaId) || pozitsiyaId <= 0) {
    return { xato: 'Pozitsiya tanlanmagan', bajarildi: false };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(summa)) {
    return { xato: "Qaytariladigan summani kiriting", bajarildi: false };
  }
  if (!(await ozFilialidami(pozitsiyaId, f.filialId))) {
    return { xato: 'Buyurtma pozitsiyasi topilmadi', bajarildi: false };
  }

  try {
    await pozitsiyaniQaytar(
      ulanishOl(),
      {
        pozitsiyaId,
        summa,
        kassaId: kassaMatn === '' ? null : Number(kassaMatn),
        ortiqchaYoli,
        izoh,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Qaytarishda xato yuz berdi'),
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

// ─── TZ 13.11 · 6.7 · Xabarni qayta yuborish ──────────────────────────────

/**
 * TZ 13.11 — «qayta yuborish tugmasi».
 *
 * ⚠️ Xabar bu yerda YUBORILMAYDI, faqat navbatga qaytariladi:
 *    yuborish bot jarayonida (§2.1). Sayt Telegramni kutib
 *    turmasligi kerak.
 */
export async function xabarniQaytaYuborAmali(
  _oldingi: AmalHolati,
  forma: FormData,
): Promise<AmalHolati> {
  const f = await ruxsatTalab('buyurtma.tahrirla');

  const xabarId = Number(matnMaydon(forma, 'xabarId'));
  if (!Number.isSafeInteger(xabarId) || xabarId <= 0) {
    return { xato: 'Xabar tanlanmagan', bajarildi: false };
  }

  const sql = ulanishOl();

  /**
   * §9.4 — brauzerdan kelgan raqamga ishonilmaydi: xabar SHU
   * filialning buyurtmasiga tegishli bo'lishi shart.
   */
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM bot_xabar x
    JOIN buyurtma_pozitsiya p ON p.id = x.manba_id
    JOIN buyurtma b           ON b.id = p.buyurtma_id
    WHERE x.id = ${xabarId}
      AND x.manba_turi = 'buyurtma_pozitsiya'
      AND b.sotgan_filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Xabar topilmadi', bajarildi: false };
  }

  try {
    await xabarniQaytaYubor(sql, xabarId);
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/amal', 'Qayta yuborilmadi'),
      bajarildi: false,
    };
  }

  revalidatePath('/buyurtma');
  return { xato: null, bajarildi: true };
}
