/**
 * Cron chaqiruvi himoyasi — LOYIHA §13: «har chaqiruv `CRON_SECRET`
 * sarlavhasi bilan keladi». 2026-10-12.
 *
 * ⚠️ Taqqoslash vaqt bo'yicha xavfsiz va HASH ustida: uzunlik ham
 *    javob vaqtidan bilinmasin.
 */
import { createHash } from 'node:crypto';
import { hashTeng } from './sessiya';

export const CRON_SARLAVHA = 'x-cron-secret';

const h = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

export function cronKalitiTogrimi(kelgan: string | null, kalit: string): boolean {
  if (kelgan === null || kelgan === '') return false;
  return hashTeng(h(kelgan), h(kalit));
}
