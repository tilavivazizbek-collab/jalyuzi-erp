/**
 * lib/db/formula-metr-tekshir.ts — 2026-09-20 metrga o'tish
 *
 * Bazadagi sarf formulalarini o'qiydi va METRGA O'TISHDAN KEYIN
 * ma'nosi buzilganlarini ko'rsatadi. HECH NARSA O'ZGARTIRMAYDI —
 * faqat o'qiydi va ro'yxat chiqaradi.
 *
 * ⚠️ NEGA KERAK: formula matni migratsiyada avtomatik o'girilmaydi
 *    va o'girilmasligi ham KERAK. Sabab — sondan uning MA'NOSINI
 *    bilib bo'lmaydi:
 *
 *      `MAYDON * 1.12`      → 1.12 zaxira koeffitsienti  → TEGILMAYDI
 *      `ENI - 2`            → 2 santimetr edi            → 0.02 bo'lishi kerak
 *      `MAX(2, CEIL(...))`  → 2 dona kronshteyn          → TEGILMAYDI
 *
 *    Uchalasi ham «2». Farqni faqat odam biladi. Shuning uchun
 *    tizim TAXMIN QILMAYDI — shubhali joyni KO'RSATADI, qarorni
 *    egasi qabul qiladi.
 *
 * Ishga tushirish:  npm run db:formula-tekshir
 */

import postgres from 'postgres';

interface Qator {
  readonly id: number;
  readonly tur_nomi: string;
  readonly slot_nomi: string;
  readonly formula: string;
  readonly sarflash_birligi: string | null;
}

/**
 * Formulada UZUNLIK ma'nosidagi son bormi.
 *
 * Shubhali shakllar:
 *   `ENI - 2`, `BO'YI + 30`   — qo'shish/ayirish: son uzunlik
 *   `ENI / 125`               — bo'lish: bo'luvchi uzunlik
 *
 * Xavfsiz shakllar (ko'rsatilmaydi):
 *   `MAYDON * 1.12`           — ko'paytiruvchi, birliksiz
 *   `ROUND(x, 2)`             — kasr xonasi
 */
function shubhaliJoylar(formula: string): string[] {
  const topilgan: string[] = [];

  // ENI / BO'YI / MAYDON / parametr dan keyin + yoki - va SON
  const qoshish = /([A-Z_'][A-Z0-9_']*|\))\s*([+\-])\s*(\d+(?:\.\d+)?)/g;
  for (const m of formula.matchAll(qoshish)) {
    topilgan.push(`${m[1] ?? ''} ${m[2] ?? ''} ${m[3] ?? ''}`);
  }

  // O'zgaruvchi / SON — bo'luvchi uzunlik bo'lishi mumkin
  const bolish = /([A-Z_'][A-Z0-9_']*)\s*\/\s*(\d+(?:\.\d+)?)/g;
  for (const m of formula.matchAll(bolish)) {
    topilgan.push(`${m[1] ?? ''} / ${m[2] ?? ''}`);
  }

  return topilgan;
}

async function asosiy(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (url === undefined || url === '') {
    console.error("DATABASE_URL yo'q");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, ssl: 'require' });
  try {
    const qatorlar = await sql<Qator[]>`
      SELECT s.id, t.nom AS tur_nomi, s.nom AS slot_nomi, s.formula,
             NULL::text AS sarflash_birligi
        FROM mahsulot_slot s
        JOIN mahsulot_tur t ON t.id = s.mahsulot_tur_id
       WHERE s.faol = true AND t.faol = true
       ORDER BY t.nom, s.tartib`;

    console.log(`\nBazada ${String(qatorlar.length)} ta faol slot formulasi\n`);

    let shubhali = 0;
    for (const q of qatorlar) {
      const joylar = shubhaliJoylar(q.formula);
      const belgi = joylar.length > 0 ? '⚠️ ' : '   ';
      console.log(`${belgi}${q.tur_nomi} · ${q.slot_nomi}`);
      console.log(`     ${q.formula}`);
      if (joylar.length > 0) {
        shubhali += 1;
        console.log(`     ↑ TEKSHIRING: ${joylar.join(' · ')}`);
        console.log(`       Bu sonlar SANTIMETRDA yozilgan bo'lsa ÷100 qiling.`);
      }
      console.log('');
    }

    if (shubhali === 0) {
      console.log("Shubhali formula YO'Q — hammasi metrda to'g'ri ishlaydi.\n");
    } else {
      console.log(
        `${String(shubhali)} ta formulani KO'ZDAN KECHIRING. ` +
          `Qolgan ${String(qatorlar.length - shubhali)} tasi metrda ham to'g'ri.\n`,
      );
    }
  } finally {
    await sql.end();
  }
}

void asosiy();
