/**
 * ishga-tushir.ts — sayt va botni BIR buyruq bilan ishga tushiradi.
 *
 * `npm run hammasi`
 *
 * ⚠️ TZ 13.11 — «Bot butunlay ishlamay qolsa ishlab chiqarish
 *    to'xtamasligi kerak.» Shuning uchun ikkalasi ALOHIDA jarayon
 *    bo'lib turadi va biri yiqilsa ikkinchisi o'ldirilmaydi.
 *
 * ⚠️ Yangi kutubxona qo'shilmadi (`concurrently` va shu kabilar):
 *    Node ning o'zi yetarli, stek kengaymasin (CLAUDE.md §12).
 */

import { spawn, type ChildProcess } from 'node:child_process';
import type { Readable } from 'node:stream';

/** Terminalda qaysi jarayon gapirayotgani ko'rinib tursin. */
const RANG = {
  sayt: '\x1b[36m',
  bot: '\x1b[35m',
  tugadi: '\x1b[33m',
  yopiq: '\x1b[0m',
} as const;

type Nom = 'sayt' | 'bot';

const jarayonlar: ChildProcess[] = [];

function oqimniChiqar(oqim: Readable | null, belgi: string): void {
  if (oqim === null) return;

  oqim.setEncoding('utf8');
  let qoldiq = '';

  oqim.on('data', (bolak: string) => {
    const qatorlar = (qoldiq + bolak).split('\n');
    qoldiq = qatorlar.pop() ?? '';
    for (const q of qatorlar) {
      if (q.trim() !== '') console.log(`${belgi} ${q}`);
    }
  });
}

/**
 * ⚠️ `npm` CHAQIRILMAYDI. Windowsda u `npm.cmd` bo'ladi va yangi
 *    Node uni `shell: true` siz ishga tushirmaydi (EINVAL,
 *    CVE-2024-27980 tuzatmasi), `shell: true` bilan esa
 *    ogohlantirish beradi (DEP0190).
 *
 *    Shuning uchun to'g'ridan-to'g'ri NODE chaqiriladi va unga
 *    kutubxonaning haqiqiy kirish fayli beriladi. Bu Windowsda ham,
 *    Linuxda ham bir xil ishlaydi.
 */
const NEXT = 'node_modules/next/dist/bin/next';
const TSX = 'node_modules/tsx/dist/cli.mjs';

function boshla(nom: Nom, argumentlar: readonly string[]): void {
  const j = spawn(process.execPath, [...argumentlar], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const belgi = `${RANG[nom]}[${nom}]${RANG.yopiq}`;
  oqimniChiqar(j.stdout, belgi);
  oqimniChiqar(j.stderr, belgi);

  j.on('exit', (kod) => {
    console.log(
      `${RANG.tugadi}[${nom}] to‘xtadi (kod ${String(kod ?? 0)})${RANG.yopiq}`,
    );
    /**
     * ⚠️ Ataylab BOSHQASI o'ldirilmaydi: bot yiqilsa sayt ishlaydi,
     *    sayt qayta yuklansa bot uzilmaydi (13.11).
     */
  });

  jarayonlar.push(j);
}

console.log('Sayt va bot ishga tushmoqda…\n');

boshla('sayt', [NEXT, 'dev']);
boshla('bot', [TSX, '--env-file=.env', 'bot/ishga-tushir.ts']);

/** Ctrl+C bosilganda ikkalasi ham to'xtaydi. */
function toxtat(): void {
  console.log(`\n${RANG.tugadi}To‘xtatilmoqda…${RANG.yopiq}`);
  for (const j of jarayonlar) j.kill();
  process.exit(0);
}

process.on('SIGINT', toxtat);
process.on('SIGTERM', toxtat);
