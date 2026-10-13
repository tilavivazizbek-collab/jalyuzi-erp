/**
 * lib/db/zaxira-tekshir.ts — TZ §17.3 · «Tekshirilmagan zaxira — zaxira emas».
 * 2026-10-13
 *
 * Ishlatish:
 *   npx tsx lib/db/zaxira-tekshir.ts erp-2026-10-14.sql.gz
 *   npx tsx lib/db/zaxira-tekshir.ts fayl.sql.gz --server postgres://u:p@localhost:5432/postgres --psql C:\...\psql.exe
 *
 * Zaxirani VAQTINCHALIK bazaga tiklaydi, tekshiradi va bazani o'chiradi.
 *
 * ⚠️ FAQAT LOKAL SERVER: `.env` ga tayanilmaydi (u ishchi bazaga qarab
 *    turishi mumkin) va localhost dan boshqa host rad etiladi — ishchi
 *    serverda baza yaratilmasin (CLAUDE.md «Ruxsat majburiy»).
 * ⚠️ Tekshiruvlar: asosiy jadvallar bor, migratsiyalar soni koddagi
 *    jurnal bilan teng, jadvallar bo'sh emas, bo'lak/band holati mos.
 */

import { spawn } from 'node:child_process';
import { createReadStream, readFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import path from 'node:path';
import postgres from 'postgres';

export const ASOSIY_JADVALLAR = [
  'filial',
  'xodim',
  'mijoz',
  'material',
  'bolak',
  'buyurtma',
  'buyurtma_pozitsiya',
  'kassa',
  'kassa_yozuv',
  'mijoz_harakat',
  'yetkazib_beruvchi_harakat',
  'audit_jurnal',
] as const;

export interface TiklashHisoboti {
  readonly baza: string;
  readonly jadvallar: number;
  readonly yetishmagan: readonly string[];
  readonly migratsiya: { readonly bazada: number; readonly kodda: number };
  readonly qatorlar: Readonly<Record<string, number>>;
  /** BAND holatidagi, lekin FAOL bandi yo'q bo'laklar (yoki teskari) */
  readonly bandNomuvofiq: number;
  readonly xatolar: readonly string[];
}

export function localmi(url: string): boolean {
  const host = new URL(url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function koddagiMigratsiyalar(): number {
  const j = JSON.parse(
    readFileSync(path.join(process.cwd(), 'lib/db/migratsiya/meta/_journal.json'), 'utf8'),
  ) as { entries: unknown[] };
  return j.entries.length;
}

/** gzip SQL → psql (ON_ERROR_STOP — yarim tiklangan baza «yaxshi» ko'rinmasin) */
function tikla(fayl: string, bazaUrl: string, psql: string): Promise<void> {
  return new Promise((hal, rad) => {
    const j = spawn(psql, ['-q', '-v', 'ON_ERROR_STOP=1', `--dbname=${bazaUrl}`], {
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    let xato = '';
    j.stderr.on('data', (b: Buffer) => {
      xato = (xato + b.toString('utf8')).slice(-2000);
    });
    j.on('error', (x) => {
      rad(new Error(`psql ishga tushmadi: ${x.message}`));
    });
    j.on('close', (kod) => {
      if (kod === 0) hal();
      else rad(new Error(`tiklash xato (kod ${String(kod)}): ${xato.trim()}`));
    });
    createReadStream(fayl).pipe(createGunzip()).on('error', rad).pipe(j.stdin);
  });
}

export async function zaxiraniTekshir(k: {
  readonly fayl: string;
  /** Lokal server, istalgan bazasi (masalan …/postgres) — vaqtinchalik baza shu serverda */
  readonly server: string;
  readonly psql: string;
}): Promise<TiklashHisoboti> {
  if (!localmi(k.server)) {
    throw new Error('faqat lokal serverda tiklanadi (localhost) — ishchi serverda baza yaratilmaydi');
  }
  const nom = `zaxira_tekshir_${String(Date.now())}`;
  const admin = postgres(k.server, { max: 1, onnotice: () => undefined });
  const bazaUrl = (() => {
    const u = new URL(k.server);
    u.pathname = `/${nom}`;
    return u.toString();
  })();

  await admin.unsafe(`CREATE DATABASE ${nom}`);
  try {
    await tikla(k.fayl, bazaUrl, k.psql);
    const b = postgres(bazaUrl, { max: 1, onnotice: () => undefined });
    try {
      const jadvallar = await b<{ t: string }[]>`
        SELECT table_name AS t FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
      const bor = new Set(jadvallar.map((x) => x.t));
      const yetishmagan = ASOSIY_JADVALLAR.filter((t) => !bor.has(t));

      const m = await b<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations`.catch(
        () => [{ n: 0 }],
      );
      const qatorlar: Record<string, number> = {};
      for (const t of ASOSIY_JADVALLAR.filter((x) => bor.has(x))) {
        const q = await b.unsafe<{ n: number }[]>(`SELECT COUNT(*)::int AS n FROM public."${t}"`);
        qatorlar[t] = q[0]?.n ?? 0;
      }
      const band = bor.has('band')
        ? await b<{ n: number }[]>`
            SELECT COUNT(*)::int AS n FROM bolak bo
            WHERE (bo.holat = 'BAND') <> EXISTS (
              SELECT 1 FROM band x WHERE x.bolak_id = bo.id AND x.holat = 'FAOL')`
        : [{ n: 0 }];

      const kodda = koddagiMigratsiyalar();
      const bazada = m[0]?.n ?? 0;
      const xatolar: string[] = [];
      if (yetishmagan.length > 0) xatolar.push(`jadval yo'q: ${yetishmagan.join(', ')}`);
      if (bazada === 0) xatolar.push('migratsiya jurnali yo‘q yoki bo‘sh');
      if ((qatorlar['filial'] ?? 0) === 0 || (qatorlar['xodim'] ?? 0) === 0) {
        xatolar.push('filial yoki xodim jadvali bo‘sh — nusxa yaroqsiz');
      }

      return {
        baza: nom,
        jadvallar: bor.size,
        yetishmagan,
        migratsiya: { bazada, kodda },
        qatorlar,
        bandNomuvofiq: band[0]?.n ?? 0,
        xatolar,
      };
    } finally {
      await b.end({ timeout: 5 });
    }
  } finally {
    await admin.unsafe(`DROP DATABASE IF EXISTS ${nom} WITH (FORCE)`);
    await admin.end({ timeout: 5 });
  }
}

// ─── Buyruq qatori ────────────────────────────────────────────────────────

async function ishga(): Promise<void> {
  const args = process.argv.slice(2);
  const fayl = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
  const qiymat = (nom: string): string | undefined => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (fayl === undefined) {
    console.error('Ishlatish: npx tsx lib/db/zaxira-tekshir.ts <fayl.sql.gz> [--server URL] [--psql yo‘l]');
    process.exitCode = 2;
    return;
  }
  const h = await zaxiraniTekshir({
    fayl,
    server: qiymat('--server') ?? 'postgres://jalyuzi:jalyuzi@localhost:5432/postgres',
    psql: qiymat('--psql') ?? 'psql',
  });
  console.log(`Jadvallar: ${String(h.jadvallar)} · migratsiya: bazada ${String(h.migratsiya.bazada)}, kodda ${String(h.migratsiya.kodda)}`);
  for (const [t, n] of Object.entries(h.qatorlar)) console.log(`  ${t.padEnd(28)} ${String(n)}`);
  if (h.migratsiya.bazada < h.migratsiya.kodda) {
    console.log(`⚠️ Nusxa ${String(h.migratsiya.kodda - h.migratsiya.bazada)} ta migratsiyadan orqada — tiklagach db:migrate kerak`);
  }
  if (h.bandNomuvofiq > 0) console.log(`⚠️ Bo'lak/band holati mos emas: ${String(h.bandNomuvofiq)} ta`);
  if (h.xatolar.length > 0) {
    console.error(`🔴 ZAXIRA YAROQSIZ:\n  ${h.xatolar.join('\n  ')}`);
    process.exitCode = 1;
  } else {
    console.log('✅ Zaxira tiklandi va tekshiruvdan o‘tdi (vaqtinchalik baza o‘chirildi)');
  }
}

if (process.argv[1]?.endsWith('zaxira-tekshir.ts') === true) {
  ishga().catch((x: unknown) => {
    console.error('🔴', x instanceof Error ? x.message : String(x));
    process.exitCode = 1;
  });
}
