/**
 * Urug'ni ishga tushiruvchi skript — `npm run db:urug`
 *
 * Boshlang'ich admin paroli EKRANDA BIR MARTA ko'rsatiladi va hech qayerda
 * saqlanmaydi (QISM 1 §16 — parol logga tushmaydi).
 */

import postgres from 'postgres';
import { urugEk } from '@/lib/db/urug';

const url = process.env['DATABASE_URL'];
if (url === undefined || url === '') {
  console.error("DATABASE_URL yo'q — .env faylini tekshiring");
  process.exit(1);
}

const ulanish = postgres(url, { max: 1 });

try {
  const natija = await urugEk(ulanish, {
    filialNomi: process.env['URUG_FILIAL'] ?? 'Bosh filial',
    adminIsmi: process.env['URUG_ADMIN_ISMI'] ?? 'Bosh admin',
    adminTelefoni: process.env['URUG_ADMIN_TELEFON'] ?? '998900000000',
  });

  console.log("\nURUG' EKILDI");
  console.log('  Filial    : ' + natija.filial);
  console.log('  Rollar    : ' + String(natija.rollar));
  console.log('  Ruxsatlar : ' + String(natija.ruxsatlar) + ' ta rol-ruxsat bog\'lanishi');
  console.log('  Admin     : ' + natija.adminTelefoni);

  if (natija.parol === null) {
    console.log('\n  Admin allaqachon bor edi — parol o\'zgartirilmadi.');
  } else {
    console.log('\n  ┌─────────────────────────────────────────────┐');
    console.log('  │ PAROL (bir marta ko\'rsatiladi, saqlab qo\'ying) │');
    console.log('  │   ' + natija.parol.padEnd(42) + '│');
    console.log('  └─────────────────────────────────────────────┘');
    console.log('  Birinchi kirishdan keyin o\'zgartiring.');
  }
} catch (x) {
  console.error("URUG' EKILMADI:", x instanceof Error ? x.message : String(x));
  process.exitCode = 1;
} finally {
  await ulanish.end();
}
