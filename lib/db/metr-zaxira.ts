/**
 * lib/db/metr-zaxira.ts — 0043 (metrga o'tish) OLDIDAN ishlatiladi
 *
 * ⚠️ NEGA KERAK: 0043 migratsiyasi qiymatlarni JOYIDA o'zgartiradi
 *    (`÷100`, `×100`) va ustun nomlarini almashtiradi. Qaytarish
 *    uchun eski qiymat kerak — u esa o'zgargandan keyin yo'q bo'ladi.
 *
 * ⚠️ NEGA `pg_dump` EMAS: bu mashinada u o'rnatilmagan. Buning
 *    o'rniga migratsiya TEGADIGAN aynan ustunlar bazaning o'zida
 *    `zaxira_0043_*` jadvallariga ko'chiriladi. Bu to'liq zaxira
 *    emas va shunday deb ham atalmaydi — bu SHU migratsiyaning
 *    qaytarish nuqtasi.
 *
 * ⚠️ Jadvallar O'CHIRILMAYDI. Ular kichik va ularning turishi
 *    hech kimga xalaqit qilmaydi; yo'qolishi esa qaytish yo'lini
 *    yopardi.
 *
 * Ishga tushirish:  npm run db:metr-zaxira
 * Tekshirish:       npm run db:metr-zaxira -- --tekshir
 */

import postgres from 'postgres';

const JADVALLAR = [
  'zaxira_0043_pozitsiya',
  'zaxira_0043_ombor_harakat',
  'zaxira_0043_material',
  'zaxira_0043_bolak',
] as const;

async function zaxiraOl(sql: postgres.Sql): Promise<void> {
  /**
   * ⚠️ `IF NOT EXISTS` emas, ATAYLAB: jadval allaqachon bo'lsa,
   *    demak zaxira olingan va migratsiya ham o'tgan bo'lishi
   *    mumkin. Ustiga yozish eski (to'g'ri) qiymatni yangisi
   *    bilan almashtirib, qaytish yo'lini YO'Q qilardi.
   */
  const bor = await sql<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY(${JADVALLAR})`;

  if (bor.length > 0) {
    console.log('\n⚠️  Zaxira ALLAQACHON olingan:');
    for (const b of bor) console.log(`      ${b.table_name}`);
    console.log('\n   Ustiga yozilmaydi. Qaytadan olish kerak bo\'lsa,');
    console.log('   avval bu jadvallarni qo\'lda o\'chiring.\n');
    return;
  }

  await sql`
    CREATE TABLE zaxira_0043_pozitsiya AS
    SELECT id, eni_sm, boyi_sm FROM buyurtma_pozitsiya`;

  await sql`
    CREATE TABLE zaxira_0043_ombor_harakat AS
    SELECT id, miqdor_sm FROM ombor_harakat WHERE miqdor_sm IS NOT NULL`;

  await sql`
    CREATE TABLE zaxira_0043_material AS
    SELECT id, sarflash_birligi, koeffitsient FROM material`;

  await sql`
    CREATE TABLE zaxira_0043_bolak AS
    SELECT id, miqdor, tannarx_birlik_snapshot FROM bolak`;

  for (const j of JADVALLAR) {
    const q = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM ${sql(j)}`;
    console.log(`   ${j}: ${String(q[0]?.n ?? 0)} qator`);
  }
  console.log('\n✅ Zaxira olindi. Endi migratsiya qilsa bo\'ladi.\n');
}

async function tekshir(sql: postgres.Sql): Promise<void> {
  /**
   * Migratsiyadan KEYIN chaqiriladi: eski qiymat × 100 yangisiga
   * tengmi. Teng bo'lmasa o'girish biror joyda tushib qolgan.
   */
  const p = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n
      FROM buyurtma_pozitsiya bp
      JOIN zaxira_0043_pozitsiya z ON z.id = bp.id
     WHERE round(bp.eni_m * 100) <> z.eni_sm
        OR round(bp.boyi_m * 100) <> z.boyi_sm`;

  const o = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n
      FROM ombor_harakat oh
      JOIN zaxira_0043_ombor_harakat z ON z.id = oh.id
     WHERE round(oh.miqdor_m * 100, 2) <> round(z.miqdor_sm, 2)`;

  const m = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n
      FROM material mt
      JOIN zaxira_0043_material z ON z.id = mt.id
     WHERE z.sarflash_birligi = 'SM'
       AND round(mt.koeffitsient * 100, 2) <> round(z.koeffitsient, 2)`;

  console.log('\nMigratsiyadan keyingi tekshiruv — mos kelmagan qatorlar:');
  console.log(`   buyurtma_pozitsiya : ${String(p[0]?.n ?? 0)}`);
  console.log(`   ombor_harakat      : ${String(o[0]?.n ?? 0)}`);
  console.log(`   material           : ${String(m[0]?.n ?? 0)}`);

  const jami = (p[0]?.n ?? 0) + (o[0]?.n ?? 0) + (m[0]?.n ?? 0);
  console.log(
    jami === 0
      ? "\n✅ Hammasi joyida — har qiymat aynan 100 ga bo'lingan.\n"
      : '\n❌ MOS KELMADI. Migratsiya qaytarilishi kerak.\n',
  );
}

async function asosiy(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (url === undefined || url === '') {
    console.error("DATABASE_URL yo'q");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, ssl: 'require' });
  try {
    if (process.argv.includes('--tekshir')) {
      await tekshir(sql);
    } else {
      await zaxiraOl(sql);
    }
  } finally {
    await sql.end();
  }
}

void asosiy();
