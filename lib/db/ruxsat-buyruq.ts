/**
 * `npm run db:ruxsat` — ruxsat kodlarini baza bilan moslaydi.
 *
 * ⚠️ Yangi ruxsat kodi qo'shilganda ishga tushiriladi. Migratsiya
 *    emas: kodlar TypeScript da yozilgan va SQL fayl ularni
 *    ko'ra olmaydi.
 */

import { ulanishOl } from '@/lib/db';
import { ruxsatlarniSinxronla } from './ruxsat-sinxron';

const sql = ulanishOl();

try {
  const n = await ruxsatlarniSinxronla(sql);
  console.log(`Ruxsat kodlari moslandi. Adminga qo'shildi: ${String(n.adminga)}`);
} finally {
  await sql.end();
}
