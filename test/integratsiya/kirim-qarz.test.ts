/**
 * TZ 9.2 · 7.9 — yetkazib beruvchi qarzi narx USULIGA qarab yoziladi.
 *
 * ⚠️ 2026-10-07 (ombor auditi, 8-band) topildi: narx metrga yoki kv.m ga
 *    berilsa, qarz `narx × rulon soni` deb yozilardi. 4 $/m dan 50 metrlik
 *    3 rulon — qarz 600 $ o'rniga 12 $. Tannarx to'g'ri edi (u
 *    `qatorQiymati` dan), qarz esa alohida, sodda formula bilan.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { kirimniStorno, kirimYarat, type QatorKirimi } from '@/lib/amal/kirim';
import { ulanishOl } from '@/lib/db';
import { kirimHujjatlari, kirimTafsiloti } from '@/app/(panel)/ombor/malumot';
import { sinovUlanishi } from './yordamchi';

const FILIAL = 1;
const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let yetkazibId = 0;
let matoId = 0;
let hisob = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${`Qarz sinovi ${BELGI}`}, ${XODIM}) RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
                          sotuv_narx, yaratdi_id)
    VALUES (${`Qarz matosi ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', '120000', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

async function qarz(q: Omit<QatorKirimi, 'materialId' | 'defektMiqdor' | 'defektTuri'>): Promise<{
  kirimId: number;
  summa: string;
}> {
  hisob += 1;
  const { kirimId } = await kirimYarat(
    sql,
    {
      raqam: `K-QARZ-${BELGI}-${String(hisob)}`,
      sana: '2026-10-07',
      filialId: FILIAL,
      yetkazibBeruvchiId: yetkazibId,
      valyuta: 'USD',
      kursSnapshot: '12800',
      transportSumma: '0',
      bojxonaSumma: '0',
      tolovMuddati: null,
      qatorlar: [{ ...q, materialId: matoId, defektMiqdor: 0, defektTuri: null }],
    },
    XODIM,
  );
  const r = await sql<{ summa: string }[]>`
    SELECT summa::text FROM yetkazib_beruvchi_harakat
    WHERE manba_turi = 'kirim' AND manba_id = ${kirimId} AND turi = 'XARID'`;
  return { kirimId, summa: r[0]?.summa ?? '' };
}

const uchRulon = [
  { eniM: 3, boyiM: 50 },
  { eniM: 3, boyiM: 50 },
  { eniM: 3, boyiM: 50 },
];

describe('yetkazib beruvchi qarzi — narx usuli', () => {
  it('EC-KQ-01: metrga — narx × bo‘ylar yig‘indisi', async () => {
    const { summa } = await qarz({ miqdorKirim: 3, narxBirlik: '4', narxAsosi: 'METR', bolaklar: uchRulon });
    expect(summa).toBe('600.00');
  });

  it('EC-KQ-02: kv.m ga — narx × maydonlar yig‘indisi', async () => {
    const { summa } = await qarz({ miqdorKirim: 3, narxBirlik: '2', narxAsosi: 'KV_M', bolaklar: uchRulon });
    expect(summa).toBe('900.00');
  });

  it('EC-KQ-03: rulonga — narx × rulon soni (avvalgidek)', async () => {
    const { summa } = await qarz({ miqdorKirim: 3, narxBirlik: '150', narxAsosi: 'BIRLIK', bolaklar: uchRulon });
    expect(summa).toBe('450.00');
  });

  it('EC-KQ-04: storno — qarz to‘liq qaytadi', async () => {
    const { kirimId } = await qarz({ miqdorKirim: 3, narxBirlik: '4', narxAsosi: 'METR', bolaklar: uchRulon });
    await kirimniStorno(sql, kirimId, 'sinov', XODIM);
    const r = await sql<{ jami: string }[]>`
      SELECT SUM(CASE WHEN turi = 'XARID' THEN summa ELSE -summa END)::text AS jami
      FROM yetkazib_beruvchi_harakat
      WHERE manba_id = ${kirimId} AND manba_turi IN ('kirim', 'kirim_storno')`;
    expect(Number(r[0]?.jami ?? 'NaN')).toBe(0);
  });

  it('EC-KQ-05: kirimlar ro‘yxati va kartochka summasi ham narx usulidan (P-46 oilasi)', async () => {
    const { kirimId } = await qarz({ miqdorKirim: 3, narxBirlik: '4', narxAsosi: 'METR', bolaklar: uchRulon });
    const r = await kirimHujjatlari(FILIAL, 500);
    expect(r.find((x) => x.id === kirimId)?.jamiSumma).toBe('600.00');
    expect((await kirimTafsiloti(kirimId, FILIAL))?.summa).toBe('600.00');
  });
});

