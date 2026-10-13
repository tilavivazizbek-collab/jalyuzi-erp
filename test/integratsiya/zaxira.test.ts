/**
 * TZ §17 — zaxira. 2026-10-13.
 *
 * ⚠️ Haqiqiy pg_dump SINOV bazasida ishlaydi; Telegramga hech narsa
 *    ketmaydi — yuborish funksiyasi ushlab qolinadi.
 * ⚠️ pg_dump topilmasa (masalan, CI) — test o'tkaziladi.
 */
import { existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { parolniYashir, zaxiraNomi, zaxiraOl, ZAXIRA_MIN_BAYT } from '@/lib/amal/zaxira';

const LOKAL = 'C:\\Users\\tilav\\pgsql16\\bin\\pg_dump.exe';
const PG_DUMP = process.env['PG_DUMP'] ?? (existsSync(LOKAL) ? LOKAL : null);
const SINOV = process.env['TEST_DATABASE_URL'] ?? '';

describe('TZ §17 — zaxira', () => {
  it('parol xabarga chiqmaydi', () => {
    expect(parolniYashir('ulanmadi: postgres://jalyuzi:Mahfiy-123@host:5432/db xato')).toBe(
      'ulanmadi: postgres://jalyuzi:***@host:5432/db xato',
    );
    expect(zaxiraNomi(new Date('2026-10-13T20:00:00Z'))).toBe('erp-2026-10-14.sql.gz');
  });

  it.skipIf(PG_DUMP === null)('EC-ZAX-01: sinov bazasidan gzip nusxa olinadi va yuboriladi', async () => {
    let olindi: { fayl: Buffer; nom: string } | null = null;
    const xatolar: string[] = [];
    const r = await zaxiraOl({
      databaseUrl: SINOV,
      pgDump: PG_DUMP ?? 'pg_dump',
      yubor: (fayl, nom) => {
        olindi = { fayl, nom };
        return Promise.resolve();
      },
      xatoYubor: (m) => {
        xatolar.push(m);
        return Promise.resolve();
      },
    });
    expect(xatolar).toEqual([]);
    expect(r.hajm).toBeGreaterThan(ZAXIRA_MIN_BAYT);
    const o = olindi as { fayl: Buffer; nom: string } | null;
    expect(o?.nom).toMatch(/^erp-\d{4}-\d{2}-\d{2}\.sql\.gz$/);
    const sql = gunzipSync(o?.fayl ?? Buffer.alloc(0)).toString('utf8');
    expect(sql).toContain('PostgreSQL database dump');
    expect(sql).toContain('CREATE TABLE public.reja');
  }, 300_000);

  it.skipIf(PG_DUMP === null)('EC-ZAX-02: ulanib bo‘lmasa — adminga xabar, parolsiz; yuborilmaydi', async () => {
    const xatolar: string[] = [];
    let yuborildi = false;
    await expect(
      zaxiraOl({
        databaseUrl: 'postgres://jalyuzi:Mahfiy-PAROL@127.0.0.1:1/yoq',
        pgDump: PG_DUMP ?? 'pg_dump',
        yubor: () => {
          yuborildi = true;
          return Promise.resolve();
        },
        xatoYubor: (m) => {
          xatolar.push(m);
          return Promise.resolve();
        },
      }),
    ).rejects.toThrow();
    expect(yuborildi).toBe(false);
    expect(xatolar).toHaveLength(1);
    expect(xatolar[0]).toContain('ZAXIRA OLINMADI');
    expect(xatolar[0]).not.toContain('Mahfiy-PAROL');
  }, 120_000);
});
