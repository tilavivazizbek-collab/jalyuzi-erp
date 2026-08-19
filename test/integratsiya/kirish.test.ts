/**
 * QISM 1 §8 · §14.2 («lib/amal/ — har tranzaksiya kamida 1 test») · Q-04
 *
 * Kirish tranzaksiyasi HAQIQIY bazada.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { chiq, hammaSessiyaniBekorQil, kir, sessiyaniTekshir } from '@/lib/amal/kirish';
import { foydalanuvchiniOl } from '@/lib/amal/foydalanuvchi';
import { parolHash } from '@/lib/kirish/parol';
import { MAX_URINISH } from '@/lib/kirish/blok';
import { ruxsatBormi, saytgaKiraOladimi } from '@/lib/ruxsat/tekshir';
import { RUXSAT_KODLARI } from '@/lib/ruxsat/kodlar';
import type { Ulanish } from '@/lib/db/ulanish';
import {
  SINOV_PAROL,
  SINOV_TELEFON,
  SINOV_USTA_TELEFON,
  SINOV_XODIM_ID,
  T0,
  daqiqa,
  sinovHolatiniTozala,
  sinovUlanishi,
  sinovXodimlariniTayyorla,
} from './yordamchi';

let sql: Ulanish;

beforeAll(async () => {
  sql = sinovUlanishi();
  await sinovXodimlariniTayyorla(sql, await parolHash(SINOV_PAROL));
}, 60_000);

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sinovHolatiniTozala(sql);
});

const kirish = (parol: string, hozir = T0) =>
  kir(sql, { telefon: SINOV_TELEFON, parol }, hozir);

describe("to'g'ri parol", () => {
  it('kiradi va token beradi', async () => {
    const r = await kirish(SINOV_PAROL);
    expect(r.holat).toBe('OK');
    if (r.holat !== 'OK') return;
    expect(r.token.length).toBeGreaterThan(30);
    expect(r.xodimId).toBe(SINOV_XODIM_ID);
  });

  it("bazada sessiya yozuvi paydo bo'ladi", async () => {
    await kirish(SINOV_PAROL);
    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM sessiya
      WHERE xodim_id = ${SINOV_XODIM_ID} AND bekor_qilindi IS NULL`;
    expect(n[0]?.n).toBe(1);
  });
});

describe("noto'g'ri kirish", () => {
  it("parol xato — NOTOGRI", async () => {
    expect((await kirish('yolgon-parol')).holat).toBe('NOTOGRI');
  });

  it("mavjud bo'lmagan telefon ham NOTOGRI — raqam oshkor bo'lmaydi (§16)", async () => {
    const r = await kir(sql, { telefon: '998000000000', parol: 'x' }, T0);
    expect(r.holat).toBe('NOTOGRI');
  });
});

describe('P-13 — hisoblagich haqiqiy son', () => {
  // Bu test aynan topilgan xatoni qo'riqlaydi: `BIGINT` matn bo'lib kelsa
  // "1" + 1 = "11" bo'lib, xodim ikkinchi urinishdayoq bloklanardi.
  it("har xatodan keyin bittaga o'sadi, sakramaydi", async () => {
    for (let i = 1; i <= 4; i += 1) {
      await kirish('yolgon-parol');
      const q = await sql<{ xato_urinish: number }[]>`
        SELECT xato_urinish FROM xodim WHERE id = ${SINOV_XODIM_ID}`;
      expect(q[0]?.xato_urinish, `${String(i)}-xatodan keyin`).toBe(i);
      expect(typeof q[0]?.xato_urinish).toBe('number');
    }
  });

  it("4 xatodan keyin to'g'ri parol hali o'tadi", async () => {
    for (let i = 0; i < 4; i += 1) await kirish('yolgon-parol');
    expect((await kirish(SINOV_PAROL)).holat).toBe('OK');
  });
});

describe('§8 — 5 urinish, 15 daqiqa blok', () => {
  const beshMartaXato = async () => {
    for (let i = 0; i < MAX_URINISH; i += 1) await kirish('yolgon-parol');
  };

  it("5-xatodan keyin to'g'ri parol ham o'tmaydi", async () => {
    await beshMartaXato();
    const r = await kirish(SINOV_PAROL);
    expect(r.holat).toBe('BLOKLANGAN');
    if (r.holat === 'BLOKLANGAN') expect(r.qolganDaqiqa).toBe(15);
  });

  it('14 daqiqada yopiq, 15 daqiqada ochiladi', async () => {
    await beshMartaXato();
    expect((await kirish(SINOV_PAROL, daqiqa(14))).holat).toBe('BLOKLANGAN');
    expect((await kirish(SINOV_PAROL, daqiqa(15))).holat).toBe('OK');
  });

  it('blok audit jurnaliga tushadi (TZ 2.4)', async () => {
    const oldin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE amal = 'KIRISH_BLOKLANDI' AND obyekt_id = ${SINOV_XODIM_ID}`;
    await beshMartaXato();
    const keyin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE amal = 'KIRISH_BLOKLANDI' AND obyekt_id = ${SINOV_XODIM_ID}`;
    expect((keyin[0]?.n ?? 0) - (oldin[0]?.n ?? 0)).toBe(1);
  });

  it("muvaffaqiyatli kirish hisoblagichni tozalaydi", async () => {
    for (let i = 0; i < 3; i += 1) await kirish('yolgon-parol');
    await kirish(SINOV_PAROL);
    const q = await sql<{ xato_urinish: number }[]>`
      SELECT xato_urinish FROM xodim WHERE id = ${SINOV_XODIM_ID}`;
    expect(q[0]?.xato_urinish).toBe(0);
  });
});

describe('Q-04 — usta saytga kirmaydi', () => {
  it("parol to'g'ri bo'lsa ham rad etiladi", async () => {
    const r = await kir(sql, { telefon: SINOV_USTA_TELEFON, parol: SINOV_PAROL }, T0);
    expect(r.holat).toBe('USTA_SAYTGA_KIRMAYDI');
  });

  it('ruxsat qatlami ham shuni aytadi', async () => {
    const usta = await foydalanuvchiniOl(sql, 9002);
    expect(usta).not.toBeNull();
    if (usta !== null) expect(saytgaKiraOladimi(usta)).toBe(false);
  });
});

describe('sessiya', () => {
  const yangiToken = async (): Promise<string> => {
    const r = await kirish(SINOV_PAROL);
    if (r.holat !== 'OK') throw new Error('kirish bo\'lmadi');
    return r.token;
  };

  it('yaroqli sessiya foydalanuvchini rollari bilan qaytaradi', async () => {
    const s = await sessiyaniTekshir(sql, await yangiToken(), daqiqa(1));
    expect(s).not.toBeNull();
    expect(s?.foydalanuvchi.rollar.some((r) => r.kod === 'ADMIN')).toBe(true);
  });

  it('admin barcha ruxsatga ega — baza va domen mos keladi', async () => {
    const s = await sessiyaniTekshir(sql, await yangiToken(), daqiqa(1));
    expect(s).not.toBeNull();
    if (s === null) return;
    for (const kod of RUXSAT_KODLARI) {
      expect(ruxsatBormi(s.foydalanuvchi, kod), kod).toBe(true);
    }
  });

  it('P-11 — darhol uzaytirilmaydi, bir soatdan keyin uzayadi', async () => {
    const token = await yangiToken();
    expect((await sessiyaniTekshir(sql, token, daqiqa(1)))?.yangiMuddat).toBeNull();
    expect((await sessiyaniTekshir(sql, token, daqiqa(90)))?.yangiMuddat).not.toBeNull();
  });

  it('§8 — bir foydalanuvchi bir necha qurilmada', async () => {
    const a = await yangiToken();
    const b = await yangiToken();
    expect(await sessiyaniTekshir(sql, a, daqiqa(1))).not.toBeNull();
    expect(await sessiyaniTekshir(sql, b, daqiqa(1))).not.toBeNull();
  });

  it('§8 — chiqish DARHOL o\'ldiradi, boshqa qurilmaga tegmaydi', async () => {
    const a = await yangiToken();
    const b = await yangiToken();
    await chiq(sql, a, daqiqa(2));
    expect(await sessiyaniTekshir(sql, a, daqiqa(3))).toBeNull();
    expect(await sessiyaniTekshir(sql, b, daqiqa(3))).not.toBeNull();
  });

  it('parol o\'zgarganda hamma sessiya bekor bo\'ladi', async () => {
    const token = await yangiToken();
    await hammaSessiyaniBekorQil(sql, SINOV_XODIM_ID, daqiqa(2));
    expect(await sessiyaniTekshir(sql, token, daqiqa(3))).toBeNull();
  });

  it('soxta va buzilgan token rad etiladi', async () => {
    const token = await yangiToken();
    expect(await sessiyaniTekshir(sql, 'soxta-token', T0)).toBeNull();
    expect(await sessiyaniTekshir(sql, `${token}xxx`, daqiqa(1))).toBeNull();
  });

  it("muddati tugagan sessiya yaroqsiz", async () => {
    const token = await yangiToken();
    expect(await sessiyaniTekshir(sql, token, daqiqa(31 * 24 * 60))).toBeNull();
  });
});
