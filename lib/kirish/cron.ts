/**
 * Cron chaqiruvi himoyasi — LOYIHA §13: «har chaqiruv `CRON_SECRET`
 * sarlavhasi bilan keladi». 2026-10-12.
 *
 * ⚠️ Taqqoslash vaqt bo'yicha xavfsiz va HASH ustida: uzunlik ham
 *    javob vaqtidan bilinmasin.
 * ⚠️ Har `/api/cron/*` yo'li `cronYoli` bilan yoziladi — himoya bitta joyda.
 */
import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { muhitOqi } from '@/lib/muhit';
import { hashTeng } from './sessiya';

export const CRON_SARLAVHA = 'x-cron-secret';

const h = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

export function cronKalitiTogrimi(kelgan: string | null, kalit: string): boolean {
  if (kelgan === null || kelgan === '') return false;
  return hashTeng(h(kelgan), h(kalit));
}

/** GET va POST uchun handler — chaqiruvchi (cron-job.org, crontab) qaysi birini tanlasa ham */
export function cronYoli(ish: () => Promise<unknown>): (so: NextRequest) => Promise<NextResponse> {
  return async (so) => {
    if (!cronKalitiTogrimi(so.headers.get(CRON_SARLAVHA), muhitOqi().CRON_SECRET)) {
      return NextResponse.json({ xato: 'ruxsat yo‘q' }, { status: 401 });
    }
    return NextResponse.json(await ish());
  };
}
