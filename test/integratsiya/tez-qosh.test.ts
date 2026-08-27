/**
 * QISM 1 §14.2 — «lib/amal/ — har biri kamida 1 test»
 *
 * TZ 5.6 · 6.5 · 9.1 — ro'yxat ichidan tez qo'shish.
 *
 * ⚠️ Eng muhim tekshiruv: DUBLIKAT YARATILMASLIGI. Ikkita bir xil
 *    nomli mijoz bo'lsa qarz kimga yozilgani chalkashadi (6.5),
 *    ikkita bir xil guruh bo'lsa sotuvchi qaysi birini tanlashni
 *    bilmaydi (5.6).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  guruhTezYarat,
  mijozTezYarat,
  tezNomTozala,
  yetkazibTezYarat,
} from '@/lib/amal/tez-qosh';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
const XODIM = 1;

/** Har ishga tushirishda nom takrorlanmasin. */
const belgi = `TZQ-${String(Date.now()).slice(-8)}`;

beforeAll(() => {
  sql = sinovUlanishi();
});

afterAll(async () => {
  await sql.end();
});

describe('tezNomTozala', () => {
  it("bo'sh nom qabul qilinmaydi", () => {
    expect(tezNomTozala('   ')).toBeNull();
    expect(tezNomTozala('')).toBeNull();
  });

  it('120 belgidan uzun nom qabul qilinmaydi', () => {
    expect(tezNomTozala('a'.repeat(120))).not.toBeNull();
    expect(tezNomTozala('a'.repeat(121))).toBeNull();
  });

  it("chetdagi bo'shliqlar olib tashlanadi", () => {
    expect(tezNomTozala('  Chet mato  ')).toBe('Chet mato');
  });
});

describe("TZ 5.6 — guruhni ro'yxat ichidan qo'shish", () => {
  it('yangi guruh yaratiladi', async () => {
    const g = await guruhTezYarat(`${belgi} guruh`, XODIM);
    expect(g.id).toBeGreaterThan(0);
    expect(g.nom).toBe(`${belgi} guruh`);
  });

  it('bir xil nom ikkinchi marta YANGI guruh yaratmaydi', async () => {
    const a = await guruhTezYarat(`${belgi} takror`, XODIM);
    const b = await guruhTezYarat(`${belgi} takror`, XODIM);
    expect(b.id).toBe(a.id);
  });

  it('katta-kichik harf farqi dublikat hisoblanmaydi', async () => {
    const a = await guruhTezYarat(`${belgi} Harf`, XODIM);
    const b = await guruhTezYarat(`${belgi} HARF`, XODIM);
    expect(b.id).toBe(a.id);
  });

  it("bo'sh nom rad etiladi", async () => {
    await expect(guruhTezYarat('  ', XODIM)).rejects.toBeInstanceOf(BiznesXato);
  });
});

describe("TZ 9.1 — yetkazib beruvchini ro'yxat ichidan qo'shish", () => {
  it('yangi yetkazib beruvchi yaratiladi', async () => {
    const y = await yetkazibTezYarat(`${belgi} yetkazuvchi`, XODIM);
    expect(y.id).toBeGreaterThan(0);
  });

  it('bir xil nom dublikat yaratmaydi', async () => {
    const a = await yetkazibTezYarat(`${belgi} y-takror`, XODIM);
    const b = await yetkazibTezYarat(`  ${belgi} Y-TAKROR  `, XODIM);
    expect(b.id).toBe(a.id);
  });
});

describe("TZ 6.5 — mijozni ro'yxat ichidan qo'shish", () => {
  it('yangi mijoz yaratiladi', async () => {
    const m = await mijozTezYarat(`${belgi} mijoz`, XODIM);
    expect(m.id).toBeGreaterThan(0);
    expect(m.nom).toBe(`${belgi} mijoz`);
  });

  it('bir xil ism dublikat yaratmaydi — qarz chalkashmasin', async () => {
    const a = await mijozTezYarat(`${belgi} Aziz`, XODIM);
    const b = await mijozTezYarat(`${belgi} aziz`, XODIM);
    expect(b.id).toBe(a.id);

    const soni = await sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM mijoz
      WHERE lower(ism) = lower(${`${belgi} Aziz`})`;
    expect(soni[0]?.n).toBe('1');
  });

  it("yangi mijozda offset ham, qarz limiti ham yo'q", async () => {
    const m = await mijozTezYarat(`${belgi} yalang`, XODIM);
    const q = await sql<
      { offset_turi: string | null; qarz_limiti: string | null }[]
    >`SELECT offset_turi, qarz_limiti FROM mijoz WHERE id = ${m.id}`;
    expect(q[0]?.offset_turi).toBeNull();
    expect(q[0]?.qarz_limiti).toBeNull();
  });
});
