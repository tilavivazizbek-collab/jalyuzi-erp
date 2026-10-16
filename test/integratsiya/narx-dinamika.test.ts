/**
 * TZ 11.9.1 · 9.8 — narx dinamikasi bazada. 2026-10-15.
 *
 * Bir yetkazib beruvchidan ikki kirim: birinchisi METR narxida, ikkinchisi
 * RULON narxida. Hisobot ikkalasini kv.m ga keltirib solishtiradi; 9.8 esa
 * kirim narxini ko'rsatadi va asos boshqa bo'lgani uchun foiz BERMAYDI
 * (ilgari «rulon narxi ÷ metr narxi» foiz chiqardi).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kirimYarat } from '@/lib/amal/kirim';
import { toshkentKuni } from '@/lib/domain/sana';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import { kelishNuqtalari, narxDinamikasi } from '@/app/(panel)/hisobot/taminot-malumot';
import { materialNarxTarixi } from '@/app/(panel)/yetkazib/malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `ND-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;
let yetkazibId = 0;
let materialId = 0;

async function kirim(raqam: string, narx: string, asos: 'METR' | 'BIRLIK'): Promise<void> {
  await kirimYarat(
    sql,
    {
      raqam,
      sana: toshkentKuni(),
      filialId,
      yetkazibBeruvchiId: yetkazibId,
      valyuta: 'SOM',
      kursSnapshot: null,
      transportSumma: '0',
      bojxonaSumma: '0',
      tolovMuddati: null,
      qatorlar: [
        {
          materialId,
          miqdorKirim: 1,
          narxBirlik: narx,
          narxAsosi: asos,
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 2, boyiM: 50 }],
        },
      ],
    },
    XODIM,
  );
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id) VALUES (${`${BELGI} yetkazuvchi`}, ${XODIM}) RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
    VALUES (${`${BELGI} mato`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
  materialId = m[0]?.id ?? 0;
  // 1) 4 000 so'm / metr × 50 m = 200 000 → 100 kv.m → 2 000 so'm/kv.m
  await kirim(`K-${BELGI}-1`, '4000', 'METR');
  // 2) rulon 230 000 → 2 300 so'm/kv.m (+15%)
  await kirim(`K-${BELGI}-2`, '230000', 'BIRLIK');
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.9.1 — narx dinamikasi', () => {
  it('EC-ND-04: material kv.m ga keltirilib solishtiriladi — +15%', async () => {
    const d = await narxDinamikasi(filialId, davrYasa('YIL', new Date()));
    expect(d.materiallar).toEqual([
      expect.objectContaining({
        materialId,
        foiz: 15,
        narxlar: [
          { sana: toshkentKuni(), narx: '2000.00', yetkazib: `${BELGI} yetkazuvchi` },
          { sana: toshkentKuni(), narx: '2300.00', yetkazib: `${BELGI} yetkazuvchi` },
        ],
      }) as unknown,
    ]);
    expect(d.yetkazibBeruvchilar).toEqual([
      expect.objectContaining({ yetkazibId, solishtirildi: 1, kotardi: 1, tushirdi: 0, ortachaFoiz: 15 }) as unknown,
    ]);
  });

  it('EC-ND-06: xom manba — har kelish kirim raqami bilan (TZ 11.2)', async () => {
    const n = await kelishNuqtalari(filialId, davrYasa('YIL', new Date()));
    expect(n.map((x) => [x.kirimRaqam, x.narx])).toEqual([
      [`K-${BELGI}-1`, '2000.00'],
      [`K-${BELGI}-2`, '2300.00'],
    ]);
  });

  it('EC-ND-05: 9.8 — asos boshqa (metr va rulon), foiz yo‘q', async () => {
    const t = await materialNarxTarixi(yetkazibId);
    expect(t).toHaveLength(1);
    expect(t[0]?.narxlar.map((n) => n.narx)).toEqual(['4000.00', '230000.00']);
    expect(t[0]?.ozgarish).toBeNull();
  });
});
