/**
 * TZ 8.14 — usta ish varaqasi. 2026-10-15.
 * Kesim o'lchami band qilishdagi kesimOlchami dan, bo'lak bandidan;
 * narx umuman yo'q; bekor pozitsiya chiqmaydi; begona filial ko'rmaydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { ulanishOl } from '@/lib/db';
import { ishVaraqasi } from '@/app/(panel)/buyurtma/[id]/ish-varaqasi/malumot';
import { sinovUlanishi } from './yordamchi';

const XODIM = 1;
const BELGI = `IV-${String(Date.now()).slice(-8)}`;
let sql: Ulanish;
let filialId = 0;
let buyurtmaId = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const f = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id) VALUES (${BELGI}, ${XODIM}) RETURNING id`;
  filialId = f[0]?.id ?? 0;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient, yaratdi_id)
    VALUES (${`${BELGI} mato`}, 'RULON', 'rulon', 'KV_M', '1', ${XODIM}),
           (${`${BELGI} karniz`}, 'DONA', 'dona', 'M', '1', ${XODIM})
    RETURNING id`;
  const mato = m[0]?.id ?? 0;
  const karniz = m[1]?.id ?? 0;
  const tur = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES (${`${BELGI} parda`}, ${XODIM}) RETURNING id`;
  const slot = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, formula, koeffitsient, kesish_turi, yaratdi_id)
    VALUES (${tur[0]?.id ?? 0}, 'Asosiy mato', 'ENI * BOYI * 2', 2, 'BO''YIGA', ${XODIM}) RETURNING id`;
  const mj = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, manzil, yaratdi_id)
    VALUES (${`${BELGI} mijoz`}, ${`99872${String(Date.now()).slice(-7)}`}, 'Chilonzor 5', ${XODIM}) RETURNING id`;
  const b = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id, mijoz_id, manba,
                          tayyorlik_sana, yaratdi_id)
    VALUES (${`B-${BELGI}`}, ${XODIM}, ${filialId}, ${filialId}, ${mj[0]?.id ?? 0}, 'SAYT', '2026-10-20', ${XODIM})
    RETURNING id`;
  buyurtmaId = b[0]?.id ?? 0;
  const p = await sql<{ id: number }[]>`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id, eni_m, boyi_m, soni, narx_snapshot,
                                    formula_snapshot, holat, yorliq, izoh, yaratdi_id)
    VALUES (${buyurtmaId}, 1, ${tur[0]?.id ?? 0}, 1.4, 1.8, 1, 777777, ${sql.json({ sinov: true })}, 'TASDIQLANGAN',
            'Zal', 'Burama tomoni chapda', ${XODIM}),
           (${buyurtmaId}, 2, ${tur[0]?.id ?? 0}, 1, 1, 1, 50000, ${sql.json({ sinov: true })}, 'BEKOR',
            NULL, NULL, ${XODIM})
    RETURNING id`;
  const p1 = p[0]?.id ?? 0;
  // 1.4 × 1.8 × 2 = 5.04 kv.m; BO'YIGA ×2 → kesim 1.40 × 3.60
  const pm = await sql<{ id: number }[]>`
    INSERT INTO pozitsiya_material (buyurtma_pozitsiya_id, slot_id, material_id, hisoblangan_miqdor, birlik, narx_snapshot)
    VALUES (${p1}, ${slot[0]?.id ?? 0}, ${mato}, 5.04, 'KV_M', 120000) RETURNING id`;
  const bo = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m, tannarx_birlik_snapshot, holat, yaratdi_id)
    VALUES (${mato}, ${filialId}, ${`${BELGI}-R`}, 'RULON', 2.8, 30, 1000, 'BAND', ${XODIM}) RETURNING id`;
  await sql`
    INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id, holat, amal_qiladi, yaratdi_id)
    VALUES (${bo[0]?.id ?? 0}, ${p1}, ${pm[0]?.id ?? 0}, 'FAOL', now() + interval '3 days', ${XODIM})`;
  await sql`
    INSERT INTO pozitsiya_aksessuar (buyurtma_pozitsiya_id, material_id, soni, birlik, narx_snapshot)
    VALUES (${p1}, ${karniz}, 1.6, 'M', 35000)`;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
  await ulanishOl().end({ timeout: 5 });
});

describe('TZ 8.14 — ish varaqasi', () => {
  it('EC-IV-01: kesim, bo‘lak, aksessuar, izoh; bekor pozitsiya yo‘q', async () => {
    const v = await ishVaraqasi(buyurtmaId, filialId);
    expect(v?.mijoz).toEqual({ ism: `${BELGI} mijoz`, telefon: expect.any(String) as string, manzil: 'Chilonzor 5' });
    expect(v?.tayyorlikSana).toBe('2026-10-20');
    expect(v?.pozitsiyalar).toHaveLength(1);
    const p = v?.pozitsiyalar[0];
    expect(p).toMatchObject({ tartib: 1, yorliq: 'Zal', izoh: 'Burama tomoni chapda' });
    expect(p?.matolar[0]).toMatchObject({
      material: `${BELGI} mato`,
      birlik: 'KV_M',
      kesim: { eniM: 1.4, boyiM: 3.6 },
      bolak: { kod: `${BELGI}-R`, turi: 'RULON', olcham: { eniM: 2.8, boyiM: 30 } },
    });
    expect(p?.aksessuarlar).toEqual([{ nom: `${BELGI} karniz`, soni: '1.60', birlik: 'M' }]);
  });

  it('EC-IV-02: narx yo‘q; begona filial ko‘rmaydi', async () => {
    const v = await ishVaraqasi(buyurtmaId, filialId);
    const matn = JSON.stringify(v);
    for (const narx of ['777777', '120000', '35000']) expect(matn).not.toContain(narx);
    expect(await ishVaraqasi(buyurtmaId, 0)).toBeNull();
  });
});
