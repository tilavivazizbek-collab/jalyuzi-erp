/**
 * QISM 1 §19 — baza sessiyasi Toshkent vaqtida (2026-10-06).
 *
 * ⚠️ Render bazasi UTC da ishlaydi. Bu test bazaning O'Z sozlamasiga
 *    qaramaydi: ulanish `TimeZone` ni o'zi beradi. Lokal sinov bazasi
 *    ataylab UTC ga qo'yilgan bo'lsa ham o'tishi kerak.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { ulanishYarat } from '@/lib/db/ulanish';
import { toshkentKuni } from '@/lib/domain/sana';
import { SINOV_BAZA_URL } from './yordamchi';

const sql = ulanishYarat(SINOV_BAZA_URL, { max: 1 });

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe('§19 — baza sessiyasi', () => {
  it('EC-SANA-10: sessiya Asia/Tashkent, current_date Toshkent kuni', async () => {
    const q = await sql<{ tz: string; kun: string }[]>`
      SELECT current_setting('TimeZone') AS tz, current_date::text AS kun`;
    expect(q[0]?.tz).toBe('Asia/Tashkent');
    expect(q[0]?.kun).toBe(toshkentKuni());
  });

  it('EC-SANA-11: yarim tundan keyingi vaqt Toshkent kuniga tushadi', async () => {
    const q = await sql<{ kun: string }[]>`
      SELECT ('2026-10-05T20:30:00Z'::timestamptz)::date::text AS kun`;
    expect(q[0]?.kun).toBe('2026-10-06');
  });
});
