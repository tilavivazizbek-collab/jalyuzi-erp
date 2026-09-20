/**
 * TUR TESTI — 1.3 va 5.3 invariantlarining isboti.
 *
 * Bu fayl `npm test` da emas, `npm run typecheck` da tekshiriladi.
 *
 * Har `@ts-expect-error` quyidagi qatorda XATO BO'LISHINI talab qiladi.
 * Agar bir kun kelib himoya buzilsa va qator xatosiz kompilyatsiya qilinsa,
 * TypeScript aynan shu `@ts-expect-error` ga «ishlatilmagan» deb xato beradi
 * va `npm run typecheck` yiqiladi.
 *
 * Ya'ni: bu fayl invariant buzilganini AVTOMATIK aytadi.
 */

import { dollar, ogir, qosh, som, teng, yaxlitlaKassa, type Som } from '@/lib/domain/pul';
import {
  dona,
  kvM,
  m,
  maydon,
  metrKorsat,
  type KvadratMetr,
  type Metr,
} from '@/lib/domain/birlik';

// ─── 1.3-invariant: so'm va dollar qo'shilmaydi ───────────────────────────

const somSumma = som(120_000);
const dollarSumma = dollar(50);

// @ts-expect-error 1.3-invariant: dollarni so'mga qo'shib bo'lmaydi
qosh(somSumma, dollarSumma);

// @ts-expect-error 1.3-invariant: so'mni dollarga qo'shib bo'lmaydi
qosh(dollarSumma, somSumma);

// @ts-expect-error 1.3-invariant: turli valyutalarni taqqoslab bo'lmaydi
teng(somSumma, dollarSumma);

// @ts-expect-error 1.3-invariant: kassa yaxlitlashi faqat so'mda (12.19)
yaxlitlaKassa(dollarSumma);

// @ts-expect-error 1.3-invariant: ogir() faqat dollarni qabul qiladi
ogir(somSumma, { qiymat: null, sana: new Date(), manba: 'JORIY' });

// @ts-expect-error §3.1: oddiy son pul emas
const notogriPul: Som = 120_000;
void notogriPul;

// @ts-expect-error §3: Som ustida to'g'ridan-to'g'ri Decimal amali yo'q
somSumma.plus(dollarSumma);

// To'g'ri ishlatish — xato bermasligi kerak
qosh(somSumma, som(30_000));
qosh(dollarSumma, dollar(10));

// ─── 5.3-invariant: o'lchov turlari almashmaydi ─────────────────────
//
// ⚠️ 2026-09-20 — `Santimetr` turi O'CHIRILDI, tizim metrga o'tdi.
//    Ilgari bu yerda `smToM(boyiMetr)` kabi ALMASHTIRISHLAR
//    tekshirilardi. Endi almashadigan ikkinchi uzunlik birligi yo'q,
//    shuning uchun himoya BOSHQA nuqtaga ko'chdi: metr, kvadrat metr
//    va dona bir-birining o'rniga TUSHMASLIGI kerak.
//
//    Tekshiruvlar kamaymadi — aksincha, endi ular haqiqiy xavfni
//    qo'riqlaydi: metrni kv.m deb olish eng qimmat xatolar turkumi.

const eniMetr = m(2.1);
const boyiMetr = m(2.5);

// @ts-expect-error §4.1: oddiy son metr emas
const notogriOlcham: Metr = 2.1;
void notogriOlcham;

// @ts-expect-error §4.1: kvadrat metrni metr o'rniga ishlatib bo'lmaydi
const notogriMetr: Metr = kvM(2.94);
void notogriMetr;

// @ts-expect-error §4.1: donani metr o'rniga ishlatib bo'lmaydi
const notogriDona: Metr = dona(2);
void notogriDona;

// @ts-expect-error §4.3: maydon metr emas — kv.m ni metr deb olish taqiq
const notogriMaydon: Metr = maydon(eniMetr, boyiMetr);
void notogriMaydon;

// @ts-expect-error §4.3: metrni kv.m kutayotgan joyga berib bo'lmaydi
const notogriKvM: KvadratMetr = eniMetr;
void notogriKvM;

// @ts-expect-error §4.2: kv.m ni metr ko'rinishida chiqarib bo'lmaydi
metrKorsat(kvM(2.94));

// To'g'ri ishlatish — xato bermasligi kerak
metrKorsat(eniMetr);
maydon(eniMetr, boyiMetr);
