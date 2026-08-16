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
import { dona, kvM, m, mToSm, sm, smToM, type Metr, type Santimetr } from '@/lib/domain/birlik';

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

// ─── 5.3-invariant: uzunlik birliklari almashmaydi ───────────────────────

const enism = sm(210);
const boyiMetr = m(2.5);

// @ts-expect-error 5.3-invariant: metrni santimetr kutayotgan joyga berib bo'lmaydi
smToM(boyiMetr);

// @ts-expect-error 5.3-invariant: santimetrni metr kutayotgan joyga berib bo'lmaydi
mToSm(enism);

// @ts-expect-error §4.1: oddiy son santimetr emas
const notogriOlcham: Santimetr = 210;
void notogriOlcham;

// @ts-expect-error §4.1: kvadrat metrni metr o'rniga ishlatib bo'lmaydi
const notogriMetr: Metr = kvM(2.94);
void notogriMetr;

// @ts-expect-error §4.1: donani santimetr o'rniga ishlatib bo'lmaydi
const notogriDona: Santimetr = dona(2);
void notogriDona;

// To'g'ri ishlatish — xato bermasligi kerak
smToM(enism);
mToSm(boyiMetr);
