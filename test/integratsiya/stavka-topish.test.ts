/**
 * TZ 10.9 · 10.12 · 2.3-invariant — stavkani BAZADAN topish.
 *
 * Tanlash mantiqi `test/domain/stavka.test.ts` da sinalgan. Bu yerda
 * SQL shartlari tekshiriladi: `NULL = barchaga` qoidasi, sana bo'yicha
 * kesish va stavkasiz turda ish to'xtamasligi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ustaStavkasi } from '@/lib/amal/stavka';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let turId = 0;
let filialA = 0;
let filialB = 0;
let ustaId = 0;

const XODIM = 1;
const SANA = '2026-06-15';

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();

  const f = await sql<{ id: number }[]>`
    SELECT id FROM filial WHERE faol = true ORDER BY bosh DESC LIMIT 1`;
  filialA = f[0]?.id ?? 1;

  const b = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id)
    VALUES (${`Stavka filiali ${belgi()}`}, ${XODIM}) RETURNING id`;
  filialB = b[0]?.id ?? 0;

  const x = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
    VALUES (${filialA}, ${`Stavka ustasi ${belgi()}`},
            ${`9987${String(Date.now()).slice(-6)}`}, ${XODIM})
    RETURNING id`;
  ustaId = x[0]?.id ?? 0;

  // Har yurishda YANGI tur — eski stavkalar aralashmasin (QOIDALAR §6)
  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Stavka turi ${belgi()}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

async function stavkaQosh(
  filialId: number | null,
  xodimId: number | null,
  qiymat: string,
  dan = '2026-01-01',
  birlik = 'DONA',
): Promise<void> {
  await sql`
    INSERT INTO stavka (mahsulot_tur_id, filial_id, xodim_id, qiymat, birlik,
                        amal_qiladi_dan, yaratdi_id)
    VALUES (${turId}, ${filialId}, ${xodimId}, ${qiymat}, ${birlik},
            ${dan}, ${XODIM})`;
}

describe('TZ 10.12 — stavkasiz tur ishni TO\'XTATMAYDI', () => {
  it("stavka yo'q bo'lsa nol qaytadi, xato bermaydi", async () => {
    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
    });

    expect(s.topildimi).toBe(false);
    expect(Number(s.qiymat)).toBe(0);
  });
});

describe('TZ 10.9 — xodim > filial > standart', () => {
  it('standart stavka barcha filial va xodimga tegishli', async () => {
    await stavkaQosh(null, null, '30000');

    const a = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
    });
    expect(Number(a.qiymat)).toBe(30_000);

    // Boshqa filialda ham o'sha standart
    const b = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialB,
      xodimId: ustaId,
      sana: SANA,
    });
    expect(Number(b.qiymat)).toBe(30_000);
  });

  it('filial stavkasi standartdan ustun', async () => {
    await stavkaQosh(filialA, null, '35000');

    const a = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
    });
    expect(Number(a.qiymat)).toBe(35_000);

    // Filial B ga tegmadi — u standartda qoldi
    const b = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialB,
      xodimId: ustaId,
      sana: SANA,
    });
    expect(Number(b.qiymat)).toBe(30_000);
  });

  it('xodim stavkasi HAMMASIDAN ustun', async () => {
    await stavkaQosh(filialA, ustaId, '45000');

    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
    });
    expect(Number(s.qiymat)).toBe(45_000);
    expect(s.topildimi).toBe(true);
  });

  it("boshqa xodimga shaxsiy stavka TEGMAYDI", async () => {
    const boshqa = await sql<{ id: number }[]>`
      INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
      VALUES (${filialA}, ${`Boshqa usta ${belgi()}`},
              ${`9986${String(Date.now()).slice(-6)}`}, ${XODIM})
      RETURNING id`;

    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: boshqa[0]?.id ?? 0,
      sana: SANA,
    });
    // Filial stavkasiga tushadi, shaxsiyga emas
    expect(Number(s.qiymat)).toBe(35_000);
  });
});

describe('2.3-invariant — eski ish eski stavkada qoladi', () => {
  it('kelajakdagi stavka bugungi ishga QO\'LLANMAYDI', async () => {
    await stavkaQosh(filialA, ustaId, '60000', '2026-09-01');

    // Iyun ishida hali eski stavka
    const iyun = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: '2026-06-15',
    });
    expect(Number(iyun.qiymat)).toBe(45_000);

    // Sentabrda yangisi
    const sentabr = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: '2026-09-20',
    });
    expect(Number(sentabr.qiymat)).toBe(60_000);
  });

  it('stavka boshlanishidan OLDINGI ish uni ko\'rmaydi', async () => {
    const s = await ustaStavkasi(sql, {
      mahsulotTurId: turId,
      filialId: filialA,
      xodimId: ustaId,
      sana: '2025-12-31',
    });
    expect(s.topildimi).toBe(false);
  });
});

describe('10.8 — birlik ham stavka bilan keladi', () => {
  it('KV_M birligi saqlanadi', async () => {
    const t = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`Kv.m turi ${belgi()}`}, ${XODIM}) RETURNING id`;
    const kvTurId = t[0]?.id ?? 0;

    await sql`
      INSERT INTO stavka (mahsulot_tur_id, qiymat, birlik, amal_qiladi_dan,
                          yaratdi_id)
      VALUES (${kvTurId}, 12000, 'KV_M', '2026-01-01', ${XODIM})`;

    const s = await ustaStavkasi(sql, {
      mahsulotTurId: kvTurId,
      filialId: filialA,
      xodimId: ustaId,
      sana: SANA,
    });
    expect(s.birlik).toBe('KV_M');
    expect(Number(s.qiymat)).toBe(12_000);
  });
});
