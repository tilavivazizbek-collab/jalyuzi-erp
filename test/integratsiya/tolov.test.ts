/**
 * TZ 3.12 · 6.8 · 6.9 · 10.15 · 12.1 · 12.17 · 2.1 · 2.2-invariant
 *
 * To'lovlar: buyurtma, mijoz qarzi, ish haqi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaTolovi, ishHaqiTola, qarzniTola } from '@/lib/amal/tolov';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let slotId = 0;
let naqdKassa = 0;
let kartaKassa = 0;
let mijozId = 0;

const FILIAL = 1;
const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const b = belgi();

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Tolov sinov matosi ${b}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Tolov sinov turi ${b}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  const mij = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, yaratdi_id)
    VALUES (${`Tolov sinov mijozi ${b}`}, ${`9988${String(Date.now()).slice(-5)}`},
            ${XODIM})
    RETURNING id`;
  mijozId = mij[0]?.id ?? 0;

  const kassaOl = async (turi: string, xodim: number | null): Promise<number> => {
    const bor = await sql<{ id: number }[]>`
      SELECT id FROM kassa
      WHERE filial_id = ${FILIAL} AND turi = ${turi} AND valyuta = 'SOM'
        AND xodim_id IS NOT DISTINCT FROM ${xodim}`;
    if (bor[0] !== undefined) return bor[0].id;

    const y = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${FILIAL}, ${xodim}, ${turi}, 'SOM',
              ${`${turi} kassa ${b}`}, ${XODIM})
      RETURNING id`;
    return y[0]?.id ?? 0;
  };

  naqdKassa = await kassaOl('NAQD', XODIM);
  kartaKassa = await kassaOl('KARTA', null);
}, 120_000);

afterAll(async () => {
  await sql.end();
});

async function rulonYarat(): Promise<void> {
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL}, ${`R-TOL-${belgi()}`}, 'RULON', 3.0, 30.0,
            78000, ${XODIM})`;
}

/** Berilgan summali buyurtma yaratadi. */
async function buyurtmaYaratSinov(
  narx: string,
  mijozBilan: boolean,
): Promise<number> {
  await rulonYarat();

  const kirim: BuyurtmaKirimi = {
    raqam: `B-TOL-${belgi()}`,
    mijozId: mijozBilan ? mijozId : null,
    sotganFilialId: FILIAL,
    ishlabChiqaruvchiFilialId: FILIAL,
    manba: 'SAYT',
    valyuta: 'SOM',
    kursSnapshot: null,
    tayyorlikSana: null,
    qarzgaKetadimi: false,
    pozitsiyalar: [
      {
        mahsulotTurId: turId,
        eniSm: 120,
        boyiSm: 200,
        soni: 1,
        narxSnapshot: narx,
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: {},
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: '2.4000',
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '120000',
            kerak: { eniM: 1.2, boyiM: 2.0 },
          },
        ],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  return n.buyurtmaId;
}

// ─── TZ 6.8 · Sotuv qarzi ─────────────────────────────────────────────────

describe('TZ 6.8 — sotuv qarzni oshiradi', () => {
  it('buyurtma yaratilganda SOTUV qatori tushadi', async () => {
    const buyurtmaId = await buyurtmaYaratSinov('800000', true);

    const q = await sql<{ turi: string; summa: string }[]>`
      SELECT turi, summa FROM mijoz_harakat
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId}`;
    expect(q).toHaveLength(1);
    expect(q[0]?.turi).toBe('SOTUV');
    expect(Number(q[0]?.summa)).toBe(800_000);
  });

  it("mijozsiz buyurtmada qarz YOZILMAYDI (3.10)", async () => {
    const buyurtmaId = await buyurtmaYaratSinov('500000', false);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mijoz_harakat
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId}`;
    expect(q[0]?.n).toBe(0);
  });
});

// ─── TZ 3.12 · Buyurtma to'lovi ───────────────────────────────────────────

describe("TZ 3.12 — buyurtma to'lovi", () => {
  it("bir nechta usul birga: naqd + karta", async () => {
    const buyurtmaId = await buyurtmaYaratSinov('800000', true);

    const n = await buyurtmaTolovi(
      sql,
      {
        buyurtmaId,
        qatorlar: [
          { kassaId: naqdKassa, summa: '500000', valyuta: 'SOM' },
          { kassaId: kartaKassa, summa: '300000', valyuta: 'SOM' },
        ],
        izoh: null,
      },
      XODIM,
    );

    expect(n.kassaYozuvlari).toHaveLength(2);
    expect(Number(n.qarzgaYozildi)).toBe(0);

    const y = await sql<{ kod: string; summa: string; kassa_id: number }[]>`
      SELECT kod, summa, kassa_id FROM kassa_yozuv
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId} ORDER BY qator`;

    expect(y[0]?.kod).toBe('K1');
    expect(Number(y[0]?.summa)).toBe(500_000);
    expect(y[0]?.kassa_id).toBe(naqdKassa);
    // TZ 12.2 — karta to'lovi ADMIN kassasiga tushadi
    expect(y[1]?.kassa_id).toBe(kartaKassa);
  });

  it("to'lov to'liq bo'lmasa qolgani QARZDA qoladi", async () => {
    const buyurtmaId = await buyurtmaYaratSinov('800000', true);

    const n = await buyurtmaTolovi(
      sql,
      {
        buyurtmaId,
        qatorlar: [{ kassaId: naqdKassa, summa: '300000', valyuta: 'SOM' }],
        izoh: null,
      },
      XODIM,
    );

    expect(Number(n.qarzgaYozildi)).toBe(500_000);

    // 2.2-invariant — qarz jurnal yig'indisi
    const q = await sql<{ qarz: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS qarz FROM mijoz_harakat
      WHERE manba_id = ${buyurtmaId} AND manba_turi IN ('buyurtma','buyurtma_tolov')`;
    expect(Number(q[0]?.qarz)).toBe(500_000);
  });

  it("mijozsiz buyurtmada to'liq to'lanmasa RAD ETILADI (3.10)", async () => {
    const buyurtmaId = await buyurtmaYaratSinov('800000', false);

    await expect(
      buyurtmaTolovi(
        sql,
        {
          buyurtmaId,
          qatorlar: [{ kassaId: naqdKassa, summa: '300000', valyuta: 'SOM' }],
          izoh: null,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('TZ 12.3 — ikki marta to\'lab bo\'lmaydi', async () => {
    const buyurtmaId = await buyurtmaYaratSinov('400000', true);
    const tolov = {
      buyurtmaId,
      qatorlar: [{ kassaId: naqdKassa, summa: '400000', valyuta: 'SOM' as const }],
      izoh: null,
    };

    await buyurtmaTolovi(sql, tolov, XODIM);
    await expect(buyurtmaTolovi(sql, tolov, XODIM)).rejects.toThrow();

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa_yozuv
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId}`;
    expect(q[0]?.n).toBe(1);
  });

  it("nol yoki manfiy to'lov rad etiladi", async () => {
    const buyurtmaId = await buyurtmaYaratSinov('400000', true);

    await expect(
      buyurtmaTolovi(
        sql,
        {
          buyurtmaId,
          qatorlar: [{ kassaId: naqdKassa, summa: '0', valyuta: 'SOM' }],
          izoh: null,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('TZ 12.1 — buyurtma to\'lovi XARAJAT EMAS', async () => {
    const buyurtmaId = await buyurtmaYaratSinov('400000', true);

    const n = await buyurtmaTolovi(
      sql,
      {
        buyurtmaId,
        qatorlar: [{ kassaId: naqdKassa, summa: '400000', valyuta: 'SOM' }],
        izoh: null,
      },
      XODIM,
    );

    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat
      WHERE kassa_yozuv_id = ANY(${[...n.kassaYozuvlari]})`;
    expect(x[0]?.n).toBe(0);
  });
});

// ─── TZ 6.9 · Mijoz qarzini to'lash ───────────────────────────────────────

describe("TZ 6.9 — mijoz qarzini to'lash", () => {
  it('kassaga kirim va qarz harakatiga qator tushadi', async () => {
    const oldin = await sql<{ q: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS q FROM mijoz_harakat
      WHERE mijoz_id = ${mijozId} AND valyuta = 'SOM'`;

    const n = await qarzniTola(
      sql,
      {
        mijozId,
        kassaId: naqdKassa,
        summa: '200000',
        valyuta: 'SOM',
        izoh: 'Qarzning bir qismi',
      },
      FILIAL,
      XODIM,
    );

    expect(Number(n.qolganQarz)).toBe(Number(oldin[0]?.q) - 200_000);

    const y = await sql<{ kod: string; summa: string }[]>`
      SELECT kod, summa FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('K3');
    expect(Number(y[0]?.summa)).toBe(200_000);
  });

  it("bir mijoz bir necha marta to'lay oladi (12.3 qator)", async () => {
    const a = await qarzniTola(
      sql,
      { mijozId, kassaId: naqdKassa, summa: '50000', valyuta: 'SOM', izoh: null },
      FILIAL,
      XODIM,
    );
    const b = await qarzniTola(
      sql,
      { mijozId, kassaId: naqdKassa, summa: '70000', valyuta: 'SOM', izoh: null },
      FILIAL,
      XODIM,
    );

    expect(a.kassaYozuvId).not.toBe(b.kassaYozuvId);
  });

  it('nol summa rad etiladi', async () => {
    await expect(
      qarzniTola(
        sql,
        { mijozId, kassaId: naqdKassa, summa: '0', valyuta: 'SOM', izoh: null },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

// ─── TZ 10.15 · Ish haqi to'lovi ──────────────────────────────────────────

describe("TZ 10.15 — ish haqi to'lovi", () => {
  it("kassadan chiqim va balansdan yechim — XARAJAT YOZILMAYDI (12.1)", async () => {
    const n = await ishHaqiTola(
      sql,
      {
        xodimId: XODIM,
        kassaId: naqdKassa,
        summa: '940000',
        valyuta: 'SOM',
        balansValyutasi: 'SOM',
        kurs: null,
        avansmi: false,
        izoh: null,
      },
      FILIAL,
      XODIM,
    );

    const y = await sql<{ kod: string; summa: string }[]>`
      SELECT kod, summa FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('C4');
    expect(Number(y[0]?.summa)).toBe(-940_000);

    const h = await sql<{ turi: string; summa: string }[]>`
      SELECT turi, summa FROM xodim_harakat
      WHERE manba_turi = 'kassa_yozuv' AND manba_id = ${n.kassaYozuvId}`;
    expect(h[0]?.turi).toBe('TOLOV');
    expect(Number(h[0]?.summa)).toBe(-940_000);

    // ⚠️ 12.1 — haq allaqachon «Tugatdim» da xarajat bo'lgan
    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat WHERE kassa_yozuv_id = ${n.kassaYozuvId}`;
    expect(x[0]?.n).toBe(0);
  });

  it('avans C5 kodi bilan yoziladi va balans manfiyga tushishi mumkin', async () => {
    const n = await ishHaqiTola(
      sql,
      {
        xodimId: XODIM,
        kassaId: naqdKassa,
        summa: '300000',
        valyuta: 'SOM',
        balansValyutasi: 'SOM',
        kurs: null,
        avansmi: true,
        izoh: 'Oy o\'rtasida',
      },
      FILIAL,
      XODIM,
    );

    const y = await sql<{ kod: string }[]>`
      SELECT kod FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('C5');

    const h = await sql<{ turi: string }[]>`
      SELECT turi FROM xodim_harakat
      WHERE manba_turi = 'kassa_yozuv' AND manba_id = ${n.kassaYozuvId}`;
    expect(h[0]?.turi).toBe('AVANS');
  });

  it("TZ 10.5 — 660 000 so'm ÷ 13 200 = 50 $ balansdan yechiladi", async () => {
    const n = await ishHaqiTola(
      sql,
      {
        xodimId: XODIM,
        kassaId: naqdKassa,
        summa: '660000',
        valyuta: 'SOM',
        // Balans DOLLARDA yuritiladi
        balansValyutasi: 'USD',
        kurs: '13200',
        avansmi: false,
        izoh: null,
      },
      FILIAL,
      XODIM,
    );

    expect(Number(n.balansdanYechildi)).toBe(50);

    const h = await sql<{ summa: string; valyuta: string }[]>`
      SELECT summa, valyuta FROM xodim_harakat
      WHERE manba_turi = 'kassa_yozuv' AND manba_id = ${n.kassaYozuvId}`;
    expect(Number(h[0]?.summa)).toBe(-50);
    expect(h[0]?.valyuta).toBe('USD');
  });

  it("valyuta boshqa, kurs yo'q — RAD ETILADI", async () => {
    await expect(
      ishHaqiTola(
        sql,
        {
          xodimId: XODIM,
          kassaId: naqdKassa,
          summa: '660000',
          valyuta: 'SOM',
          balansValyutasi: 'USD',
          kurs: null,
          avansmi: false,
          izoh: null,
        },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });
});
