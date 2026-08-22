'use server';

/**
 * app/(panel)/kassa/amal.ts — TZ 12.7 · 12.15 · QISM 1 §9.4 · Q-25
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import {
  kassaStorno,
  topshiriqniQabulQil,
  topshiriqYubor,
} from '@/lib/amal/kassa';
import { kunniQaytaOch, kunniYop } from '@/lib/amal/kun-yopish';
import { ayirboshlash } from '@/lib/amal/ayirboshlash';
import { boshqaHodisa, eganingPuli, operatsionXarajat } from '@/lib/amal/xarajat';
import { XARAJAT_MODDALARI } from '@/lib/db/schema/kassa';
import type { XarajatModdasi } from '@/lib/domain/balans';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { matnMaydon } from '../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
import type {
  AyirboshlashHolati,
  KassaAmalHolati,
  KunHolatiForma,
} from './holat';

/** TZ 12.15 — storno, sabab MAJBURIY. */
export async function stornoAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.storno');

  const yozuvId = Number(matnMaydon(forma, 'yozuvId'));
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(yozuvId) || yozuvId <= 0) {
    return { xato: 'Yozuv tanlanmagan', bajarildi: false };
  }

  // Q-25 — boshqa filial kassasiga tegib bo'lmaydi
  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_yozuv y
    JOIN kassa k ON k.id = y.kassa_id
    WHERE y.id = ${yozuvId} AND k.filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Kassa yozuvi topilmadi', bajarildi: false };
  }

  try {
    await kassaStorno(sql, yozuvId, sabab, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Storno qilishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 12.7 — admin topshiriqni qabul qiladi.
 *
 * ⚠️ TZ 12.4 — pul AYNAN SHU PAYTDA ko'chadi, jo'natilganda emas.
 */
export async function topshiriqQabulAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.barcha.kor');

  const topshiriqId = Number(matnMaydon(forma, 'topshiriqId'));
  if (!Number.isSafeInteger(topshiriqId) || topshiriqId <= 0) {
    return { xato: 'Topshiriq tanlanmagan', bajarildi: false };
  }

  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM topshiriq t
    JOIN kassa k ON k.id = t.kimga_kassa_id
    WHERE t.id = ${topshiriqId} AND k.filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Topshiriq topilmadi', bajarildi: false };
  }

  try {
    await topshiriqniQabulQil(sql, topshiriqId, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Qabul qilishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 12.14 · Q-25 — kassaga tegish huquqi.
 *
 * «Sotuvchi FAQAT O'Z KASSASINI ko'radi.» Shuning uchun o'z kassasi
 * bo'lmagan kassani yopish uchun `kassa.barcha.kor` ruxsati kerak.
 */
async function kassagaRuxsatmi(
  kassaId: number,
  filialId: number,
  xodimId: number,
  barchaniKoradi: boolean,
): Promise<boolean> {
  const q = await ulanishOl()<{ xodim_id: number | null }[]>`
    SELECT xodim_id FROM kassa
    WHERE id = ${kassaId} AND filial_id = ${filialId} AND faol = true`;

  const k = q[0];
  if (k === undefined) return false;
  return barchaniKoradi || k.xodim_id === xodimId;
}

/**
 * TZ 12.17 — kunni yopish.
 *
 * ⚠️ Farq bo'lsa izoh MAJBURIY, lekin yopish BLOKLANMAYDI — «sotuvchini
 *    uyiga qo'ymay turib bo'lmaydi».
 */
export async function kunniYopAmali(
  _oldingi: KunHolatiForma,
  forma: FormData,
): Promise<KunHolatiForma> {
  const f = await ruxsatTalab('kassa.oz.kor');

  const kassaId = Number(matnMaydon(forma, 'kassaId'));
  const sana = matnMaydon(forma, 'sana');
  const sanaldi = matnMaydon(forma, 'sanaldi').trim();
  const izoh = matnMaydon(forma, 'izoh').trim();

  if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
    return { xato: 'Kassa tanlanmagan', farq: null, yopildi: false };
  }
  if (!/^-?\d+(\.\d{1,2})?$/.test(sanaldi)) {
    return { xato: "Sanalgan summani kiriting", farq: null, yopildi: false };
  }

  const barchaniKoradi = ruxsatBormi(f, 'kassa.barcha.kor');
  if (!(await kassagaRuxsatmi(kassaId, f.filialId, f.xodimId, barchaniKoradi))) {
    return { xato: 'Kassa topilmadi', farq: null, yopildi: false };
  }

  try {
    const n = await kunniYop(
      ulanishOl(),
      { kassaId, sana, sanaldi, izoh: izoh === '' ? null : izoh },
      f.xodimId,
    );

    revalidatePath('/kassa');
    return { xato: null, farq: n.farq, yopildi: true };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Kunni yopishda xato yuz berdi',
      farq: null,
      yopildi: false,
    };
  }
}

/** TZ 12.17 — admin kunni qayta ochadi, sabab MAJBURIY. */
export async function kunniQaytaOchAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.storno');

  const kunId = Number(matnMaydon(forma, 'kunId'));
  const sabab = matnMaydon(forma, 'sabab');

  if (!Number.isSafeInteger(kunId) || kunId <= 0) {
    return { xato: 'Kun tanlanmagan', bajarildi: false };
  }

  const sql = ulanishOl();
  const tegishli = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_kun k
    JOIN kassa ks ON ks.id = k.kassa_id
    WHERE k.id = ${kunId} AND ks.filial_id = ${f.filialId}`;

  if ((tegishli[0]?.n ?? 0) === 0) {
    return { xato: 'Kun yozuvi topilmadi', bajarildi: false };
  }

  try {
    await kunniQaytaOch(sql, kunId, sabab, f.xodimId);
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Qayta ochishda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

/** Pul summasi shakli — brauzerdan kelgan qiymatga ishonilmaydi. */
const PUL = /^\d+(\.\d{1,2})?$/;

/**
 * TZ 12.9 — ayirboshlash. FAQAT ADMIN.
 *
 * ⚠️ Ruxsat `kassa.barcha.kor` — 12.9 «faqat admin qila oladi».
 */
export async function ayirboshlashAmali(
  _oldingi: AyirboshlashHolati,
  forma: FormData,
): Promise<AyirboshlashHolati> {
  const f = await ruxsatTalab('kassa.barcha.kor');

  const kimdan = Number(matnMaydon(forma, 'kimdanKassaId'));
  const kimga = Number(matnMaydon(forma, 'kimgaKassaId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const kurs = matnMaydon(forma, 'kurs').trim();
  const komissiya = matnMaydon(forma, 'komissiya').trim();
  const izoh = matnMaydon(forma, 'izoh');

  if (!Number.isSafeInteger(kimdan) || !Number.isSafeInteger(kimga)) {
    return { xato: 'Kassalarni tanlang', kirgan: null, bajarildi: false };
  }
  if (!PUL.test(summa)) {
    return { xato: "Summani kiriting", kirgan: null, bajarildi: false };
  }
  if (!PUL.test(kurs)) {
    return { xato: 'Kursni kiriting', kirgan: null, bajarildi: false };
  }
  if (komissiya !== '' && !PUL.test(komissiya)) {
    return { xato: "Komissiya noto'g'ri", kirgan: null, bajarildi: false };
  }

  try {
    const n = await ayirboshlash(
      ulanishOl(),
      {
        kimdanKassaId: kimdan,
        kimgaKassaId: kimga,
        summa,
        kurs,
        komissiya: komissiya === '' ? '0' : komissiya,
        izoh,
      },
      f.filialId,
      f.xodimId,
    );

    revalidatePath('/kassa');
    return { xato: null, kirgan: n.kirgan, bajarildi: true };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Ayirboshlashda xato yuz berdi',
      kirgan: null,
      bajarildi: false,
    };
  }
}

/** TZ 12.10 — operatsion xarajat. Izoh MAJBURIY. */
export async function xarajatAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.oz.kor');

  const kassaId = Number(matnMaydon(forma, 'kassaId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const moddaMatn = matnMaydon(forma, 'modda');
  const izoh = matnMaydon(forma, 'izoh');

  if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
    return { xato: 'Kassa tanlanmagan', bajarildi: false };
  }
  if (!PUL.test(summa)) {
    return { xato: 'Summani kiriting', bajarildi: false };
  }
  if (!(XARAJAT_MODDALARI as readonly string[]).includes(moddaMatn)) {
    return { xato: 'Moddani tanlang', bajarildi: false };
  }

  try {
    await operatsionXarajat(
      ulanishOl(),
      {
        kassaId,
        summa,
        valyuta: matnMaydon(forma, 'valyuta') === 'USD' ? 'USD' : 'SOM',
        modda: moddaMatn as XarajatModdasi,
        izoh,
      },
      f.filialId,
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Xarajatni saqlashda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

/**
 * TZ 12.11 (egasi) va 12.5/12.6 (boshqa kirim/chiqim).
 *
 * ⚠️ Egasining puli XARAJAT EMAS, boshqa chiqim esa xarajat — farqni
 *    `lib/amal/xarajat.ts` hal qiladi.
 */
export async function qolMaHodisaAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.oz.kor');

  const kassaId = Number(matnMaydon(forma, 'kassaId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const turi = matnMaydon(forma, 'turi');
  const izoh = matnMaydon(forma, 'izoh');
  const valyuta = matnMaydon(forma, 'valyuta') === 'USD' ? 'USD' : 'SOM';

  if (!Number.isSafeInteger(kassaId) || kassaId <= 0) {
    return { xato: 'Kassa tanlanmagan', bajarildi: false };
  }
  if (!PUL.test(summa)) {
    return { xato: 'Summani kiriting', bajarildi: false };
  }

  try {
    if (turi === 'EGASI_QOSHDI' || turi === 'EGASI_OLDI') {
      await eganingPuli(
        ulanishOl(),
        { kassaId, summa, valyuta, qoshdimi: turi === 'EGASI_QOSHDI', izoh },
        f.xodimId,
      );
    } else {
      await boshqaHodisa(
        ulanishOl(),
        { kassaId, summa, valyuta, kirimmi: turi === 'BOSHQA_KIRIM', izoh },
        f.filialId,
        f.xodimId,
      );
    }
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Saqlashda xato yuz berdi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}

// ─── TZ 12.7 · 22.5 · Sotuvchi pulni topshiradi ───────────────────────────

/**
 * TZ 12.7 — «Sotuvchi "Topshirdim" belgilaydi → yozuv yaratiladi,
 * holati "kutilmoqda".»
 *
 * ⚠️ Pul BU YERDA ko'chmaydi. U admin tasdiqlaganda ko'chadi —
 *    `topshiriqQabulAmali`. Shu sababli bu amalda kassa yozuvi yo'q.
 *
 * ⚠️ Q-29 — nishon BOSHQA filial kassasi bo'lishi mumkin (22.5).
 *    Manba esa faqat o'z kassasi: begonasidan topshirib bo'lmaydi.
 */
export async function topshiriqYuborAmali(
  _oldingi: KassaAmalHolati,
  forma: FormData,
): Promise<KassaAmalHolati> {
  const f = await ruxsatTalab('kassa.chiqim');

  const kimdanKassaId = Number(matnMaydon(forma, 'kimdanKassaId'));
  const kimgaKassaId = Number(matnMaydon(forma, 'kimgaKassaId'));
  const summa = matnMaydon(forma, 'summa').trim();
  const izoh = matnMaydon(forma, 'izoh').trim();

  if (!Number.isSafeInteger(kimdanKassaId) || kimdanKassaId <= 0) {
    return { xato: 'Kassa tanlanmagan', bajarildi: false };
  }
  if (!Number.isSafeInteger(kimgaKassaId) || kimgaKassaId <= 0) {
    return { xato: 'Qaysi kassaga topshirilishi tanlanmagan', bajarildi: false };
  }
  if (!PUL.test(summa)) {
    return { xato: "Summa noto'g'ri", bajarildi: false };
  }

  const sql = ulanishOl();

  /**
   * §9.4 — brauzerdan kelgan `kimdanKassaId` ga ishonilmaydi: u
   * AYNAN shu xodimning kassasi bo'lishi shart.
   */
  const oziniki = await sql<{ valyuta: string }[]>`
    SELECT valyuta FROM kassa
    WHERE id = ${kimdanKassaId} AND xodim_id = ${f.xodimId} AND faol = true`;

  const valyuta = oziniki[0]?.valyuta;
  if (valyuta === undefined) {
    return { xato: 'Bu kassa sizniki emas', bajarildi: false };
  }

  try {
    await topshiriqYubor(
      sql,
      {
        kimdanKassaId,
        kimgaKassaId,
        summa,
        valyuta: valyuta === 'USD' ? 'USD' : 'SOM',
        izoh: izoh === '' ? null : izoh,
      },
      f.xodimId,
    );
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Topshiriq yuborilmadi',
      bajarildi: false,
    };
  }

  revalidatePath('/kassa');
  return { xato: null, bajarildi: true };
}
