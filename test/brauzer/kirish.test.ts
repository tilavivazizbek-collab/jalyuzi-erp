/**
 * T-01 · QISM 1 §8 · §14.2 — kirish oqimi BRAUZERDA. 2026-10-18
 *
 * `test/integratsiya/kirish.test.ts` `kir()` ni to'g'ridan-to'g'ri sinaydi.
 * Bu yerda — Next.js qatlami: forma → server amali → cookie → redirect,
 * chiqish sessiyani o'ldirishi, blok va usta xabarlari foydalanuvchiga
 * yetib borishi. Ilgari faqat qo'lda tekshirilardi va saqlanmasdi.
 *
 * ⚠️ Sayt sinov bazasiga ulangan bo'lishi shart — vitest.brauzer.config.ts.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright-core';
import type { Ulanish } from '@/lib/db/ulanish';
import { parolHash } from '@/lib/kirish/parol';
import { MAX_URINISH } from '@/lib/kirish/blok';
import {
  SINOV_PAROL,
  SINOV_TELEFON,
  SINOV_USTA_TELEFON,
  SINOV_XODIM_ID,
  sinovHolatiniTozala,
  sinovUlanishi,
  sinovXodimlariniTayyorla,
} from '../integratsiya/yordamchi';

const URL_ = process.env['BRAUZER_URL'] ?? '';
let sql: Ulanish;
let brauzer: Browser;

beforeAll(async () => {
  if (URL_ === '') {
    throw new Error(
      "BRAUZER_URL yo'q — avval saytni sinov bazasi bilan ishga tushiring (vitest.brauzer.config.ts).",
    );
  }
  sql = sinovUlanishi();
  await sinovXodimlariniTayyorla(sql, await parolHash(SINOV_PAROL));
  brauzer = await chromium.launch({ channel: 'chrome', headless: true });
});

beforeEach(async () => {
  await sinovHolatiniTozala(sql);
});

afterAll(async () => {
  await sinovHolatiniTozala(sql);
  await brauzer.close();
  await sql.end({ timeout: 5 });
});

async function yangiSahifa(): Promise<Page> {
  const p = await (await brauzer.newContext()).newPage();
  p.setDefaultTimeout(120_000);
  return p;
}

async function kirishgaUrin(p: Page, telefon: string, parol: string): Promise<void> {
  await p.goto(`${URL_}/kirish`);
  await p.fill('input[name=telefon]', telefon);
  await p.fill('input[name=parol]', parol);
  await p.click('button[type=submit]');
}

/**
 * ⚠️ Forma ICHIDAGI xato — Next.js ning route announcer ham role="alert",
 *    sahifa bo'ylab qidirilsa bo'sh o'sha topilardi.
 */
const xatoQutisi = (p: Page) => p.locator('form [role=alert]');

/** Forma xatosi chiqquncha yoki sahifa /kirish dan ketguncha kutadi */
async function natijani(p: Page): Promise<void> {
  await Promise.race([
    xatoQutisi(p).waitFor(),
    p.waitForURL((u) => !u.pathname.startsWith('/kirish')),
  ]);
}

const yol = (p: Page): string => new URL(p.url()).pathname;

describe('T-01 — kirish oqimi brauzerda', () => {
  it('EC-BRZ-01: kirmagan odam ichki sahifadan /kirish ga qaytariladi', async () => {
    const p = await yangiSahifa();
    await p.goto(`${URL_}/boshqaruv`);
    expect(yol(p)).toBe('/kirish');
    await p.context().close();
  });

  it('EC-BRZ-02: to‘g‘ri parol — panel ochiladi, sessiya sinov bazasida', async () => {
    const p = await yangiSahifa();
    await kirishgaUrin(p, SINOV_TELEFON, SINOV_PAROL);
    await p.waitForURL((u) => u.pathname === '/boshqaruv');
    const s = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM sessiya WHERE xodim_id = ${SINOV_XODIM_ID} AND bekor_qilindi IS NULL`;
    expect(s[0]?.n).toBe(1);
    await p.context().close();
  });

  it('EC-BRZ-03: «Chiqish» sessiyani o‘ldiradi — eski cookie bilan ham kirib bo‘lmaydi', async () => {
    const p = await yangiSahifa();
    await kirishgaUrin(p, SINOV_TELEFON, SINOV_PAROL);
    await p.waitForURL((u) => u.pathname === '/boshqaruv');
    const cookie = await p.context().cookies();

    await p.getByRole('button', { name: 'Chiqish' }).click();
    await p.waitForURL((u) => u.pathname === '/kirish');

    const q = await yangiSahifa();
    await q.context().addCookies(cookie);
    await q.goto(`${URL_}/boshqaruv`);
    expect(yol(q)).toBe('/kirish');
    await p.context().close();
    await q.context().close();
  });

  it('EC-BRZ-04: xato parol — umumiy xabar, telefon bormi-yo‘qligi aytilmaydi', async () => {
    const p = await yangiSahifa();
    await kirishgaUrin(p, SINOV_TELEFON, 'yolgon-parol-123');
    await natijani(p);
    const xato = await xatoQutisi(p).innerText();
    await kirishgaUrin(p, '998900000999', 'yolgon-parol-123');
    await natijani(p);
    expect(await xatoQutisi(p).innerText()).toBe(xato);
    expect(xato).toContain("noto'g'ri");
    await p.context().close();
  });

  it(`EC-BRZ-05: ${String(MAX_URINISH)} xatodan keyin to‘g‘ri parol ham blok xabarini oladi`, async () => {
    const p = await yangiSahifa();
    for (let i = 0; i < MAX_URINISH; i += 1) {
      await kirishgaUrin(p, SINOV_TELEFON, 'yolgon-parol-123');
      await natijani(p);
    }
    await kirishgaUrin(p, SINOV_TELEFON, SINOV_PAROL);
    await natijani(p);
    expect(yol(p)).toBe('/kirish');
    expect(await xatoQutisi(p).innerText()).toContain('bloklangan');
    await p.context().close();
  });

  it('EC-BRZ-06: usta to‘g‘ri parol bilan ham saytga kirmaydi — botga yo‘naltiriladi', async () => {
    const p = await yangiSahifa();
    await kirishgaUrin(p, SINOV_USTA_TELEFON, SINOV_PAROL);
    await natijani(p);
    expect(yol(p)).toBe('/kirish');
    expect(await xatoQutisi(p).innerText()).toContain('Telegram');
    await p.context().close();
  });
});
