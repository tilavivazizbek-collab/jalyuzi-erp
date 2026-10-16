/**
 * TZ 11.8 — ishlab chiqarish hisobotlari. 2026-10-15.
 * O'z filiali — boshqa testlar aralashmasin.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { davrYasa } from '@/lib/domain/hisobot/davr';
import {
  ishlabChiqarishBraki,
  ishlabXom,
  kechikkanBuyurtmalar,
  navbatHolati,
  ustaUnumdorligi,
} from '@/app/(panel)/hisobot/ishlab-malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `IH-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;
let usta = 0;
let buyurtmaId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const u = await sql<{ id: number }[]>`
    INSERT INTO xodim (filial_id, ism, telefon, yaratdi_id)
    VALUES (${filialId}, ${`${BELGI} usta`}, ${`99873${String(Date.now()).slice(-7)}`}, ${XODIM}) RETURNING id`;
  usta = u[0]?.id ?? 0;
  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`${BELGI} rulonli`}, ${XODIM}), (${`${BELGI} vertikal`}, ${XODIM})
    RETURNING id`;
  const rulonli = t[0]?.id ?? 0;
  const vertikal = t[1]?.id ?? 0;
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id, manba,
                          tayyorlik_sana, yaratdi_id)
    VALUES (${`B-${BELGI}`}, ${XODIM}, ${filialId}, ${filialId}, 'SAYT', CURRENT_DATE - 3, ${XODIM})
    RETURNING id`;
  buyurtmaId = b[0]?.id ?? 0;
  const j = sql.json({ sinov: true });
  const p = await sql<{ id: number }[]>`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m, soni, narx_snapshot,
                                    formula_snapshot, holat, usta_id, tugatildi, yaratildi, yaratdi_id)
    VALUES (${buyurtmaId}, 1, ${rulonli}, 1.5, 2, 2, 100000, ${j}, 'TAYYOR', ${usta}, now(), now() - interval '4 days', ${XODIM}),
           (${buyurtmaId}, 2, ${vertikal}, 1, 1, 1, 50000, ${j}, 'TASDIQLANGAN', NULL, NULL, now() - interval '5 days', ${XODIM}),
           (${buyurtmaId}, 3, ${rulonli}, 1, 1, 1, 50000, ${j}, 'ISHLAB_CHIQARILMOQDA', ${usta}, NULL, now() - interval '6 days', ${XODIM}),
           (${buyurtmaId}, 4, ${rulonli}, 1, 1, 1, 50000, ${j}, 'MATERIALGA_KUTMOQDA', NULL, NULL, now(), ${XODIM})
    RETURNING id`;
  const p1 = p[0]?.id ?? 0;
  const p3 = p[2]?.id ?? 0;

  // Haq — 30 000 hisoblandi
  await sql`
    INSERT INTO xodim_harakat (xodim_id, filial_id, turi, summa, valyuta, manba_turi, manba_id, izoh, xodim_yozdi_id)
    VALUES (${usta}, ${filialId}, 'HAQ', 30000, 'SOM', 'buyurtma_pozitsiya', ${p1}, 'sinov', ${XODIM})`;
  // p3: tasdiqlandi 2 kun oldin, bugun olindi → 2 kun kutgan
  await sql`
    INSERT INTO audit_jurnal (sana, xodim_id, filial_id, amal, obyekt_turi, obyekt_id, izoh)
    VALUES (now() - interval '2 days', ${XODIM}, ${filialId}, 'TASDIQLASH', 'buyurtma_pozitsiya', ${p3}, 'sinov'),
           (now(), ${usta}, ${filialId}, 'ISH_OLINDI', 'buyurtma_pozitsiya', ${p3}, 'sinov')`;
  // Brak: p1 qayta kesildi — 4 000 material, 10 000 ushlandi
  const qk = await sql<{ id: number }[]>`
    INSERT INTO qayta_kesish (buyurtma_pozitsiya_id, soragan_usta_id, sabab, holat, hal_qilindi, ushlanma_summa, yaratdi_id)
    VALUES (${p1}, ${usta}, 'OLCHAM_XATO', 'TASDIQLANDI', now(), 10000, ${XODIM}) RETURNING id`;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
    VALUES (${`${BELGI} mato`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}) RETURNING id`;
  const bo = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m, tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${m[0]?.id ?? 0}, ${filialId}, ${`${BELGI}-R`}, 'RULON', 3, 30, 1000, ${XODIM}) RETURNING id`;
  await sql`
    INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, tannarx_summa, manba_turi, manba_id, xodim_id)
    VALUES (${filialId}, ${bo[0]?.id ?? 0}, 'KESIM', -4, -4000, 'qayta_kesish', ${qk[0]?.id ?? 0}, ${XODIM})`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 11.8 — ishlab chiqarish', () => {
  const davr = (): ReturnType<typeof davrYasa> => davrYasa('OY', new Date());

  it('EC-IH-01: usta unumdorligi — dona, kv.m, tur kesimi, hisoblangan haq', async () => {
    const r = await ustaUnumdorligi(filialId, davr());
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ ustaId: usta, soni: 2, kvM: '6.00', haq: '30000.00' });
    expect(r[0]?.turlar).toEqual([{ tur: `${BELGI} rulonli`, soni: 2, kvM: '6.00' }]);
  });

  it('EC-IH-02: brak — zarar (material tannarxi), ushlangan, sabab', async () => {
    const r = await ishlabChiqarishBraki(filialId, davr());
    expect(r).toEqual([
      {
        ustaId: usta,
        ism: `${BELGI} usta`,
        soni: 1,
        zarar: '4000.00',
        ushlangan: '10000.00',
        sabablar: [{ sabab: 'OLCHAM_XATO', soni: 1 }],
      },
    ]);
  });

  it('EC-IH-03: kechikkan — tayyorlik sanasidan 3 kun, 4 ochiq pozitsiya', async () => {
    const r = await kechikkanBuyurtmalar(filialId);
    expect(r).toEqual([
      expect.objectContaining({ buyurtmaId, kechikishKun: 3, ochiqPozitsiya: 4 }) as unknown,
    ]);
  });

  it('EC-IH-05: xom — davrda tugatilgan pozitsiya, usta va kv.m bilan (TZ 11.2)', async () => {
    const x = await ishlabXom(filialId, davr());
    expect(x).toHaveLength(1);
    expect(x[0]).toMatchObject({ raqam: `B-${BELGI}`, soni: 2, kvM: '6.00', usta: `${BELGI} usta`, olindi: null });
    // Xom kv.m yig'indisi = unumdorlik jadvalidagi kv.m
    const u = await ustaUnumdorligi(filialId, davr());
    expect(x.reduce((y, q) => y + Number(q.kvM), 0).toFixed(2)).toBe(u[0]?.kvM);
  });

  it('EC-IH-04: navbat — hozir 1 (5 kunlik), material kutmoqda 1, olingan ish 2 kun kutgan', async () => {
    const n = await navbatHolati(filialId, davr());
    expect(n.hozir).toBe(1);
    expect(n.materialKutmoqda).toBe(1);
    expect(n.engEskiKun).toBeCloseTo(5, 0);
    expect(n.ortachaKutishKun).toBeCloseTo(2, 0);
    expect(n.turlar[0]).toMatchObject({ tur: `${BELGI} vertikal`, hozir: 1, olingan: 0 });
    expect(n.turlar.find((t) => t.tur === `${BELGI} rulonli`)).toMatchObject({ hozir: 0, olingan: 1 });
  });
});
