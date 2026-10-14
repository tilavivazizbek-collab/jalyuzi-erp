/**
 * T-07 — buyurtma kartochkasidagi material bloki. 2026-10-14.
 * Pozitsiyaning o'z yechimi va qayta kesish yechimi birga chiqadi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { kirimYarat } from '@/lib/amal/kirim';
import { toshkentKuni } from '@/lib/domain/sana';
import { pozitsiyaMateriallari } from '@/app/(panel)/buyurtma/[id]/material-blok';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = String(Date.now()).slice(-7);
let sql: Ulanish;
let pozitsiya = 0;
let boshqa = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
    VALUES (${`BM ${BELGI}`}, true, true, false, ${XODIM}) RETURNING id`;
  const filialId = f[0]?.id ?? 0;
  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id) VALUES (${`BM yetkazuvchi ${BELGI}`}, ${XODIM}) RETURNING id`;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
    VALUES (${`BM mato ${BELGI}`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
  const { kirimId } = await kirimYarat(
    sql,
    {
      raqam: `K-BM-${BELGI}`,
      sana: toshkentKuni(),
      filialId,
      yetkazibBeruvchiId: y[0]?.id ?? 0,
      valyuta: 'SOM',
      kursSnapshot: null,
      transportSumma: '0',
      bojxonaSumma: '0',
      tolovMuddati: null,
      qatorlar: [
        {
          materialId: m[0]?.id ?? 0,
          miqdorKirim: 1,
          narxBirlik: '1000',
          narxAsosi: 'METR',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3, boyiM: 50 }],
        },
      ],
    },
    XODIM,
  );
  const bo = await sql<{ id: number }[]>`
    SELECT b.id FROM bolak b JOIN kirim_qator kq ON kq.id = b.kirim_qator_id WHERE kq.kirim_id = ${kirimId} LIMIT 1`;
  const bolakId = bo[0]?.id ?? 0;

  const tur = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`BM tur ${BELGI}`}, ${XODIM}) RETURNING id`;
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id, manba, yaratdi_id)
    VALUES (${`B-BM-${BELGI}`}, ${XODIM}, ${filialId}, ${filialId}, 'SAYT', ${XODIM}) RETURNING id`;
  const p = await sql<{ id: number }[]>`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m, narx_snapshot,
                                    formula_snapshot, holat, yaratdi_id)
    VALUES (${b[0]?.id ?? 0}, 1, ${tur[0]?.id ?? 0}, 2, 1.5, 100000, ${sql.json({ sinov: true })}, 'TAYYOR', ${XODIM}),
           (${b[0]?.id ?? 0}, 2, ${tur[0]?.id ?? 0}, 1, 1, 50000, ${sql.json({ sinov: true })}, 'TAYYOR', ${XODIM})
    RETURNING id`;
  pozitsiya = p[0]?.id ?? 0;
  boshqa = p[1]?.id ?? 0;

  // O'z yechimi — 3.0 kv.m, va qayta kesishda yana 3.0 kv.m
  await sql`
    INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, tannarx_summa, manba_turi, manba_id, xodim_id)
    VALUES (${filialId}, ${bolakId}, 'KESIM', -3, -2000, 'buyurtma_pozitsiya', ${pozitsiya}, ${XODIM})`;
  const qk = await sql<{ id: number }[]>`
    INSERT INTO qayta_kesish (buyurtma_pozitsiya_id, soragan_usta_id, sabab, holat, yaratdi_id)
    VALUES (${pozitsiya}, ${XODIM}, 'MATO_YIRTILDI', 'TASDIQLANDI', ${XODIM}) RETURNING id`;
  await sql`
    INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, tannarx_summa, manba_turi, manba_id, xodim_id)
    VALUES (${filialId}, ${bolakId}, 'KESIM', -3, -2000, 'qayta_kesish', ${qk[0]?.id ?? 0}, ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('T-07 — buyurtma material bloki', () => {
  it('EC-BM-01: o‘z yechimi va qayta kesish birga, bo‘lak kodi va tannarx bilan', async () => {
    const r = await pozitsiyaMateriallari([pozitsiya, boshqa]);
    expect(r).toHaveLength(2);
    expect(r.every((x) => x.pozitsiyaId === pozitsiya)).toBe(true);
    expect(r.map((x) => x.qaytaKesish)).toEqual([false, true]);
    expect(r[0]).toMatchObject({ turi: 'KESIM', miqdorKvM: -3, tannarx: '-2000.00', material: `BM mato ${BELGI}` });
    expect(r[0]?.bolakKod.length).toBeGreaterThan(0);
  });

  it('material yechilmagan pozitsiya — bo‘sh', async () => {
    expect(await pozitsiyaMateriallari([boshqa])).toEqual([]);
    expect(await pozitsiyaMateriallari([])).toEqual([]);
  });
});
