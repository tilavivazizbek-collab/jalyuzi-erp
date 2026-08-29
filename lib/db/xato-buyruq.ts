/**
 * `npm run db:xato` — serverdagi oxirgi xatolar.
 *
 * Egasi ekranda ko'rgan raqam bilan qidirish:
 *   npm run db:xato 2143683442
 *
 * Raqamsiz — oxirgi 10 ta xato.
 */

import { ulanishOl } from '@/lib/db';

const sql = ulanishOl();
const qidiruv = process.argv[2] ?? null;

interface Qator {
  id: number;
  vaqt: Date;
  digest: string | null;
  yol: string | null;
  xabar: string;
  stek: string | null;
}

try {
  const qatorlar =
    qidiruv === null
      ? await sql<Qator[]>`
          SELECT id, vaqt, digest, yol, xabar, stek FROM xato_jurnal
          ORDER BY id DESC LIMIT 10`
      : await sql<Qator[]>`
          SELECT id, vaqt, digest, yol, xabar, stek FROM xato_jurnal
          WHERE digest = ${qidiruv} ORDER BY id DESC LIMIT 10`;

  if (qatorlar.length === 0) {
    console.log(qidiruv === null ? 'Xato jurnali bo‘sh.' : `«${qidiruv}» topilmadi.`);
  }

  for (const q of qatorlar) {
    console.log('─'.repeat(70));
    console.log(`#${String(q.id)}  ${q.vaqt.toISOString()}  digest=${q.digest ?? '—'}`);
    console.log(`yo'l:  ${q.yol ?? '—'}`);
    console.log(`xato:  ${q.xabar}`);
    if (q.stek !== null) console.log(q.stek.split('\n').slice(0, 12).join('\n'));
  }
} finally {
  await sql.end();
}
