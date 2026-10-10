/**
 * Buyurtma to'landimi — ro'yxat va kartochka FIFO taqsimotdan. Audit 2026-10-10.
 *
 * ⚠️ Avval: mijoz kartochkadan qarzini to'lasa ham buyurtma ro'yxatda
 *    «To'lanmagan» qolardi; ro'yxat «jami»si bekor pozitsiyani ham qo'shardi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaTolovi, qarzniTola } from '@/lib/amal/tolov';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { buyurtmalar, tolovHolati } from '@/app/(panel)/buyurtma/malumot';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let slotId = 0;
let naqdKassa = 0;
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
    VALUES (${`BT sinov matosi ${b}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`BT sinov turi ${b}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  const mij = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, yaratdi_id)
    VALUES (${`BT sinov mijozi ${b}`}, ${`9988${String(Date.now()).slice(-5)}`},
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
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

async function rulonYarat(): Promise<void> {
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL}, ${`R-BT-${belgi()}`}, 'RULON', 3.0, 30.0,
            78000, ${XODIM})`;
}

/** Berilgan summali buyurtma yaratadi. */
async function buyurtmaYaratSinov(
  narx: string,
  mijozBilan: boolean,
): Promise<number> {
  await rulonYarat();

  const kirim: BuyurtmaKirimi = {
    raqam: `B-BT-${belgi()}`,
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
        eniM: 1.2,
        boyiM: 2,
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
  raqamlar.set(n.buyurtmaId, kirim.raqam);
  return n.buyurtmaId;
}

const raqamlar = new Map<number, string>();

async function qator(id: number) {
  const r = await buyurtmalar(FILIAL, 'HAMMASI', 100, raqamlar.get(id) ?? '');
  return r.find((x) => x.id === id);
}

describe('buyurtma to‘landimi — FIFO', () => {
  it('EC-BT-01: kartochkadan to‘lov eng eski buyurtmani yopadi (ro‘yxat va kartochka)', async () => {
    const b1 = await buyurtmaYaratSinov('300000', true);
    const b2 = await buyurtmaYaratSinov('200000', true);
    await qarzniTola(
      sql,
      { mijozId, kassaId: naqdKassa, summa: '400000', valyuta: 'SOM', izoh: null },
      FILIAL,
      XODIM,
    );
    const q1 = await qator(b1);
    const q2 = await qator(b2);
    expect(q1?.tolovDaraja).toBe('TOLANDI');
    expect(q2?.tolovDaraja).toBe('QISMAN');
    expect(q2?.qolgan).toBe('100000.00');

    const k2 = await tolovHolati(b2, FILIAL);
    expect(k2?.qarz).toBe('100000.00');
    expect(k2?.umumiyTolovdan).toBe('100000.00');
  });

  it('EC-BT-02: mijozsiz buyurtma — faqat o‘ziga bog‘langan to‘lov', async () => {
    const b = await buyurtmaYaratSinov('150000', false);
    expect((await qator(b))?.tolovDaraja).toBe('TOLANMAGAN');
    await buyurtmaTolovi(
      sql,
      {
        kalit: belgi(),
        buyurtmaId: b,
        izoh: null,
        qatorlar: [{ kassaId: naqdKassa, summa: '150000', valyuta: 'SOM' }],
      },
      XODIM,
    );
    expect((await qator(b))?.tolovDaraja).toBe('TOLANDI');
  });

  it('EC-BT-03: ro‘yxat jamisi bekor pozitsiyasiz — kartochka bilan teng', async () => {
    const b = await buyurtmaYaratSinov('250000', false);
    await sql`UPDATE buyurtma_pozitsiya SET holat = 'BEKOR' WHERE buyurtma_id = ${b}`;
    const ikkinchi = await buyurtmaYaratSinov('90000', false);
    // ikkinchi buyurtmaning pozitsiyasini birinchisiga ko'chiramiz — bitta buyurtmada faol + bekor
    await sql`UPDATE buyurtma_pozitsiya SET buyurtma_id = ${b}, tartib = 99 WHERE buyurtma_id = ${ikkinchi}`;
    const q = await qator(b);
    expect(q?.jami).toBe('90000.00');
    expect((await tolovHolati(b, FILIAL))?.jami).toBe('90000.00');
  });

  it('EC-BT-04: qidiruv — raqam va mijoz telefoni bo‘yicha', async () => {
    const b = await buyurtmaYaratSinov('10000', true);
    const tel = (await sql<{ t: string }[]>`SELECT telefon AS t FROM mijoz WHERE id = ${mijozId}`)[0]?.t ?? '';
    const r = await buyurtmalar(FILIAL, 'HAMMASI', 100, tel.slice(-5));
    expect(r.some((x) => x.id === b)).toBe(true);
    expect(await buyurtmalar(FILIAL, 'HAMMASI', 100, 'HECH-QACHON-BOLMAYDI-XYZ')).toEqual([]);
  });
});
