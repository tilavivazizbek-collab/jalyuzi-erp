/**
 * lib/db/tozala.ts — bazani noldan tiklash · `npm run db:tozala`
 *
 * ⚠️ BARCHA JADVALNI O'CHIRADI. Faqat ishlab chiqish bazasida.
 *
 * Ishlab chiqarish bazasida ishlamasligi uchun `URUG_TOZALASHGA_RUXSAT=ha`
 * majburiy. QISM 1 §17: ishlab chiqarish bazasiga zaxirasiz tegilmaydi.
 */

import postgres from 'postgres';

const url = process.env['DATABASE_URL'];
const ruxsat = process.env['URUG_TOZALASHGA_RUXSAT'];

if (url === undefined || url === '') {
  console.error("DATABASE_URL yo'q");
  process.exit(1);
}

if (ruxsat !== 'ha') {
  console.error('Bu buyruq butun bazani o\'chiradi.');
  console.error('Rozi bo\'lsangiz:  URUG_TOZALASHGA_RUXSAT=ha npm run db:tozala');
  process.exit(1);
}

const ulanish = postgres(url, { max: 1 });

try {
  await ulanish.unsafe(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
  `);
  console.log("Baza tozalandi. Endi:  npm run db:migrate  va  npm run db:urug");
} catch (x) {
  console.error('Tozalanmadi:', x instanceof Error ? x.message : String(x));
  process.exitCode = 1;
} finally {
  await ulanish.end();
}
