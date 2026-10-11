/**
 * Moliya — foyda-zarar (TZ 11.4.1). Hisobotlar auditi 2026-10-11.
 *
 * ⚠️ Asosiy filialda boshqa testlar ma'lumoti bor — shuning uchun aniq
 *    summa emas, OLDIN va KEYIN farqi tekshiriladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { operatsionXarajat } from '@/lib/amal/xarajat';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import { foydaZarar } from '@/lib/domain/hisobot/foyda-zarar';
import { toshkentKuni } from '@/lib/domain/sana';
import { foydaZararMalumoti, turBoyichaFoyda } from '@/app/(panel)/hisobot/malumot';
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
    VALUES (${`FZ sinov matosi ${b}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`FZ sinov turi ${b}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  const mij = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, yaratdi_id)
    VALUES (${`FZ sinov mijozi ${b}`}, ${`9988${String(Date.now()).slice(-5)}`},
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
    VALUES (${matoId}, ${FILIAL}, ${`R-FZ-${belgi()}`}, 'RULON', 3.0, 30.0,
            78000, ${XODIM})`;
}

/** Berilgan summali buyurtma yaratadi. */
async function buyurtmaYaratSinov(
  narx: string,
  mijozBilan: boolean,
): Promise<number> {
  await rulonYarat();

  const kirim: BuyurtmaKirimi = {
    raqam: `B-FZ-${belgi()}`,
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
  return n.buyurtmaId;
}


const D = (a: string, b: string): string => (Number(a) - Number(b)).toFixed(2);

describe('foyda-zarar — 11.4.1', () => {
  it('EC-FZ-01: tushum, usta haqi (tannarxda), xarajat, kurs farqi alohida; qaytarilgan tushumda yo‘q', async () => {
    const davr = davrYasa('OY', new Date());
    const oldin = await foydaZararMalumoti(FILIAL, davr);
    const turOldin = await turBoyichaFoyda(FILIAL, davr);

    const b1 = await buyurtmaYaratSinov('300000', false);
    const b2 = await buyurtmaYaratSinov('100000', false);
    await sql`UPDATE buyurtma_pozitsiya SET holat = 'QAYTARILGAN' WHERE buyurtma_id = ${b2}`;
    const p1 = (await sql<{ id: number }[]>`SELECT id FROM buyurtma_pozitsiya WHERE buyurtma_id = ${b1}`)[0]?.id ?? 0;
    const bugun = toshkentKuni();
    await sql`
      INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta, manba_turi, manba_id, izoh, xodim_id)
      VALUES (${bugun}, ${FILIAL}, 'ISH_HAQI', 20000, 'SOM', 'buyurtma_pozitsiya', ${p1}, 'sinov', ${XODIM}),
             (${bugun}, ${FILIAL}, 'KURS_FARQI', 5000, 'SOM', 'sinov', 1, 'sinov', ${XODIM}),
             (${bugun}, ${FILIAL}, 'KURS_FARQI', -3000, 'SOM', 'sinov', 2, 'sinov', ${XODIM})`;
    await operatsionXarajat(
      sql,
      { kassaId: naqdKassa, summa: '150000', valyuta: 'SOM', modda: 'OPERATSION', izoh: 'sinov ijara' },
      FILIAL,
      XODIM,
    );

    const keyin = await foydaZararMalumoti(FILIAL, davr);
    expect(D(keyin.tushum, oldin.tushum)).toBe('300000.00'); // qaytarilgan 100 000 kirmadi
    expect(D(keyin.ishHaqi, oldin.ishHaqi)).toBe('20000.00');
    expect(D(keyin.kursZarar, oldin.kursZarar)).toBe('5000.00');
    expect(D(keyin.kursDaromad, oldin.kursDaromad)).toBe('3000.00');
    const op = (x: typeof oldin) => x.xarajatlar.find((y) => y.modda === 'OPERATSION')?.summa ?? '0';
    expect(D(op(keyin), op(oldin))).toBe('150000.00');
    // Pozitsiya usta haqi xarajatlar ro'yxatida IKKINCHI marta sanalmaydi
    const ih = (x: typeof oldin) => x.xarajatlar.find((y) => y.modda === 'ISH_HAQI')?.summa ?? '0';
    expect(D(ih(keyin), ih(oldin))).toBe('0.00');

    // Sof foyda farqi: +300 000 − 20 000 − 150 000 − 5 000 + 3 000
    expect(D(foydaZarar(keyin).sofFoyda, foydaZarar(oldin).sofFoyda)).toBe('128000.00');

    // 11.5.2 ham qaytarilganni tushumga qo'shmaydi
    const turKeyin = await turBoyichaFoyda(FILIAL, davr);
    const t = (r: typeof turKeyin) => r.find((x) => x.turId === turId)?.tushum ?? '0';
    expect(D(t(turKeyin), t(turOldin))).toBe('300000.00');
  });
});
