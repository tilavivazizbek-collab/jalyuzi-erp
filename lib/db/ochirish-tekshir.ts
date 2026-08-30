/**
 * `npm run db:ochirish-tekshir` — har turning «band emasmi»
 * so'rovi haqiqiy bazada ishlaydimi.
 *
 * ⚠️ NEGA KERAK
 *
 *    Bu so'rovlar FAQAT odam «o'chirish» bosganda ishga tushadi.
 *    Shuning uchun ulardagi SQL xatosi na `tsc`, na `npm test`,
 *    na `npm run build` da ko'rinadi — u faqat egasi tugmani
 *    bosganda chiqadi.
 *
 *    2026-08-29 da aynan shu bo'ldi: `buyurtma.holat` degan
 *    ustun yo'q edi va mijozni umuman o'chirib bo'lmasdi.
 *
 * ⚠️ FAQAT O'QIYDI. Hech narsa o'zgartirmaydi (§15).
 */

import { ulanishOl } from '@/lib/db';
import { OCHIRILADIGAN_TURLAR, TUR_TAVSIFI } from '@/lib/amal/nofaol';
import { YAGONA_USTUNLAR, ochirilganEgasi } from '@/lib/amal/ochirilgan-tekshir';

const sql = ulanishOl();
let xato = 0;

try {
  for (const tur of OCHIRILADIGAN_TURLAR) {
    const t = TUR_TAVSIFI[tur];
    try {
      /** `id = 1` — yozuv bo'lmasa ham so'rov o'zi ishlashi kerak */
      const sabab = await t.bandmi(sql as never, 1);
      console.log(`  ok    ${tur.padEnd(12)} ${sabab ?? ''}`);
    } catch (x) {
      xato += 1;
      console.log(`  XATO  ${tur.padEnd(12)} ${x instanceof Error ? x.message : String(x)}`);
    }
  }

  /**
   * ⚠️ «O'chirilgan yozuvda band» so'rovi ham SHU YERDA
   *    tekshiriladi: u faqat odam yangi yozuv qo'shganda ishga
   *    tushadi va ustun nomi xato bo'lsa hech qayerda ko'rinmaydi
   *    (2026-08-30 da aynan shunday bo'ldi).
   */
  console.log('\nO‘chirilgan yozuv tekshiruvi:');
  for (const jadval of Object.keys(YAGONA_USTUNLAR) as (keyof typeof YAGONA_USTUNLAR)[]) {
    try {
      await ochirilganEgasi(sql as never, jadval, 'sinov-qiymat');
      console.log(`  ok    ${jadval}`);
    } catch (x) {
      xato += 1;
      console.log(`  XATO  ${jadval} ${x instanceof Error ? x.message : String(x)}`);
    }
  }

  console.log(
    xato === 0
      ? `\nHammasi joyida — ${String(OCHIRILADIGAN_TURLAR.length)} ta tur.`
      : `\n${String(xato)} ta turda SQL xatosi bor.`,
  );
} finally {
  await sql.end();
}

if (xato > 0) process.exit(1);
