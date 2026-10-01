/**
 * lib/db/narx-migratsiya-tekshir.ts — `npm run db:narx-tekshir`
 *
 * 0057 · 0059 · 0060 IKKALA BAZAGA qo'llanganini tekshiradi.
 *
 * ⚠️ NEGA ALOHIDA SKRIPT
 *
 *    Bu uchta migratsiya QAT'IY TARTIBDA qo'llanadi va oralarida
 *    deploy turadi (`docs/QAMROV.md` §6f):
 *
 *        0057 → 0059 → push → deploy tugasin → 0060
 *
 *    Yarmi qo'llangan holat ko'zga KO'RINMAYDI: sayt ochiladi,
 *    testlar esa «tarmoq uzildi» degan xato beradi. 2026-09-22 da
 *    aynan shu tufayli 130 ta test yiqilib, sabab bir soat
 *    izlangan. Shuning uchun javob bir buyruqda beriladi.
 *
 * ⚠️ O'Z SOATI BOR — 2026-09-29.
 *
 *    Egasining tarmog'idagi to'siq ulanishni XATO BERMASDAN qotirib
 *    qo'yadi: DNS yechadi, TCP ochiladi, TLS tushmaydi va
 *    `connect_timeout` UMUMAN ishlamaydi. Usiz bu skript ham
 *    cheksiz aylanardi va hech narsa aytmasdi.
 *
 * ⚠️ FAQAT O'QIYDI. Hech narsa yozmaydi, hech narsa qo'llamaydi —
 *    migratsiya qo'llash egasining qarori (CLAUDE.md «Ruxsat
 *    majburiy»).
 */
import postgres from 'postgres';

/** Har baza uchun chegara — qotib qolsa ham javob beriladi */
const KUTISH_MS = 25_000;

interface Holat {
  readonly ulandi: boolean;
  readonly xato?: string;
  readonly migratsiyaSoni?: number;
  readonly narxGuruhBor?: boolean;
  readonly narxGuruhNullBoladi?: boolean;
  readonly materialIdBor?: boolean;
  readonly narxBelgilaydiBor?: boolean;
  readonly indeks?: string;
}

async function holatniOl(url: string): Promise<Holat> {
  const sql = postgres(url, { max: 1, ssl: 'require', connect_timeout: 15 });

  /*
   * ⚠️ `Promise.race` — kutubxonaning o'z chegarasiga ISHONILMAYDI.
   *    Yuqoridagi izohda yozilgan sabab: u to'siq ostida ishlamaydi.
   */
  const soat = new Promise<Holat>((yech) => {
    setTimeout(() => {
      yech({
        ulandi: false,
        xato:
          'qotib qoldi — TLS o‘tadi, Postgres startup javobsiz. ' +
          'Tarmoq emas: Render panelida bazani tekshir',
      });
    }, KUTISH_MS);
  });

  const ish = (async (): Promise<Holat> => {
    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations`;

    const ustunlar = await sql<{ jadval: string; ustun: string; nullable: string }[]>`
      SELECT table_name AS jadval, column_name AS ustun, is_nullable AS nullable
        FROM information_schema.columns
       WHERE (table_name = 'mahsulot_narx'
              AND column_name IN ('narx_guruh_id', 'material_id'))
          OR (table_name = 'mahsulot_slot' AND column_name = 'narx_belgilaydi')`;

    const idx = await sql<{ d: string }[]>`
      SELECT indexdef AS d FROM pg_indexes
       WHERE tablename = 'mahsulot_narx' AND indexname = 'mahsulot_narx_bitta'`;

    const top = (jadval: string, ustun: string) =>
      ustunlar.find((x) => x.jadval === jadval && x.ustun === ustun);

    return {
      ulandi: true,
      migratsiyaSoni: n[0]?.n ?? 0,
      narxGuruhBor: top('mahsulot_narx', 'narx_guruh_id') !== undefined,
      narxGuruhNullBoladi: top('mahsulot_narx', 'narx_guruh_id')?.nullable === 'YES',
      materialIdBor: top('mahsulot_narx', 'material_id') !== undefined,
      narxBelgilaydiBor: top('mahsulot_slot', 'narx_belgilaydi') !== undefined,
      indeks: idx[0]?.d ?? '(indeks yo‘q)',
    };
  })().catch((x: unknown) => ({
    ulandi: false,
    xato: x instanceof Error ? x.message : String(x),
  }));

  const natija = await Promise.race([ish, soat]);
  /** ⚠️ `end` KUTILMAYDI — qotgan ulanishda u ham qotadi */
  void sql.end({ timeout: 1 }).catch(() => undefined);
  return natija;
}

function chizib(nom: string, h: Holat): void {
  console.log(`\n── ${nom} ──`);
  if (!h.ulandi) {
    console.log(`  ULANMADI: ${h.xato ?? 'nomaʼlum'}`);
    return;
  }

  console.log(`  Qo‘llangan migratsiya: ${String(h.migratsiyaSoni ?? 0)}`);

  const belgi = (bajarildimi: boolean): string => (bajarildimi ? '✓' : '—');

  /** 0057 — ustun ixtiyoriy bo'lishi kerak (yoki umuman yo'q) */
  const q57 = h.narxGuruhBor !== true || h.narxGuruhNullBoladi === true;
  /** 0059 — material_id qo'shilgan */
  const q59 = h.materialIdBor === true;
  /** 0060 — daraja ustunlari tashlangan */
  const q60 = h.narxGuruhBor !== true && h.narxBelgilaydiBor !== true;

  console.log(`  ${belgi(q57)} 0057 — narx_guruh_id ixtiyoriy`);
  console.log(`  ${belgi(q59)} 0059 — material_id qo‘shilgan`);
  console.log(`  ${belgi(q60)} 0060 — daraja ustunlari tashlangan`);
  console.log(`  indeks: ${h.indeks ?? '—'}`);

  if (!q57 || !q59) {
    console.log('  ⚠️ KOD BU BAZADA ISHLAMAYDI — 0057 va 0059 shart');
  } else if (!q60) {
    console.log('  ℹ️ 0060 hali qo‘llanmagan — deploydan KEYIN qo‘llanadi');
  }
}

async function bosh(): Promise<void> {
  const ish = process.env['DATABASE_URL'];
  const sinov = process.env['TEST_DATABASE_URL'];

  if (ish === undefined || ish === '') {
    console.error('DATABASE_URL yo‘q');
    process.exit(1);
  }

  chizib('ISH BAZASI', await holatniOl(ish));

  if (sinov === undefined || sinov === '') {
    console.log('\n── SINOV BAZASI ──\n  TEST_DATABASE_URL yo‘q');
  } else {
    chizib('SINOV BAZASI', await holatniOl(sinov));
  }

  console.log('\nTartib: 0057 → 0059 → push → deploy tugasin → 0060');
  /** ⚠️ Ochiq ulanish qolgan bo'lsa ham chiqamiz — aks holda osilib qoladi */
  process.exit(0);
}

void bosh();
