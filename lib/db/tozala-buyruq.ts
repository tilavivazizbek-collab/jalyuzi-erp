/**
 * `npm run db:tozala` — ish ma'lumotlarini tozalash.
 *
 * ⚠️ QAYTARIB BO'LMAYDI. Shuning uchun `URUG_TOZALASHGA_RUXSAT=ha`
 *    talab qilinadi: tasodifan ishga tushib ketmasin.
 */

import { ulanishOl } from '@/lib/db';
import { SAQLANADIGAN, ishMalumotlariniTozala } from './tozala';

if (process.env['URUG_TOZALASHGA_RUXSAT'] !== 'ha') {
  console.error(
    "Tozalash bloklandi. Ishga tushirish uchun: URUG_TOZALASHGA_RUXSAT=ha npm run db:tozala",
  );
  process.exit(1);
}

const sql = ulanishOl();

try {
  const natija = await ishMalumotlariniTozala(sql);

  if (natija.length === 0) {
    console.log('Baza allaqachon toza.');
  } else {
    console.log("O'chirildi:");
    for (const n of natija) {
      console.log(`  ${n.jadval.padEnd(28)} ${String(n.oldin)}`);
    }
  }

  console.log(`\nSaqlandi: ${SAQLANADIGAN.join(', ')}`);
} finally {
  await sql.end();
}
