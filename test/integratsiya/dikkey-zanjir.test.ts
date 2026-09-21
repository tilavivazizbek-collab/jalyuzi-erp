/**
 * DIKKEY — uchdan-uchgacha, egasi tasdig'i 2026-09-21.
 *
 * «mato eni 40 sm, u 40 smlik enli narsa 10 sm joyni egallaydi.
 *  Mato 1 m enli bo'lsa 10 ta ketadi va bo'yiga nechta ketsa
 *  shunday bo'ladi — bo'yi × 10 bo'lib ombordan ayrilishi kerak.»
 *
 * ⚠️ Bu test bazadagi qiymatni EMAS, formulaning AYNAN nusxasini
 *    sinaydi. Sabab: bazadagini egasi istalgan payt o'zgartira
 *    oladi va o'shanda test kod buzilmagan holda qizil bo'lardi.
 *    Bu yerda tekshirilayotgani — ZANJIR: formula → sarf → kesim →
 *    OMBORDAN BO'LAK TANLASH.
 *
 * ⚠️ Zanjirning oxirgi bo'g'ini eng muhimi. Qat'iy kesim enisiz
 *    hisob «4.00 × 2.00» beradi va 4 metr enli lamel ruloni
 *    dunyoda yo'q — pozitsiya abadiy «Materialga kutmoqda» da
 *    qolardi. Quyidagi testlardan biri aynan shuni isbotlaydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type postgres from 'postgres';
import { sinovUlanishi } from './yordamchi';
import { m } from '@/lib/domain/birlik';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { kesimOlchami } from '@/lib/domain/kesish';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';

const FILIAL = 1;
const XODIM = 1;

/** Bazadagi «dikkey» bilan bir xil — bu testning sinov predmeti */
const QADAM = 0.1;
const LAMEL_ENI = 0.4;
const MATO_FORMULA = `CEIL(ENI / ${String(QADAM)}) * BO'YI * ${String(LAMEL_ENI)}`;
const BIGUNOK_FORMULA = `CEIL(ENI / ${String(QADAM)})`;

let sql: postgres.Sql;
let matoId = 0;
let turId = 0;
let slotId = 0;
let hisoblagich = 0;

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const mt = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`Dikkey lamel ${belgi}`}, 'RULON', 'rulon', 'KV_M',
            0.1, 0.2, ${XODIM})
    RETURNING id`;
  matoId = mt[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Dikkey sinov ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula,
                               kesim_eni_m, yaratdi_id)
    VALUES (${turId}, 'Lamel', 1, ${MATO_FORMULA}, ${LAMEL_ENI}, ${XODIM})
    RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

/** Egasi aytgan haqiqiy rulon: eni 0.40 m, bo'yi 100 m */
async function rulonYarat(eni = 0.4, boyi = 100.0): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-DIK-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', ${eni}, ${boyi}, 20000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

function buyurtma(kerak: { eniM: number; boyiM: number }, kvM: string): BuyurtmaKirimi {
  hisoblagich += 1;
  return {
    raqam: `B-DIK-${String(Date.now())}-${String(hisoblagich)}`,
    mijozId: null,
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
        qoshimchaMaterialId: null,
        eniM: 1.0,
        boyiM: 2.0,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { slot: MATO_FORMULA },
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: kvM,
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '120000',
            kerak,
          },
        ],
        aksessuarlar: [],
      },
    ],
  };
}

describe('dikkey — 1.00 × 2.00 m buyurtmasi', () => {
  it('formula 10 ta lamel va 8 kv.m beradi', () => {
    const q = standartQiymatlar(m(1), m(2), 1, {});
    expect(sarflashHisobla(BIGUNOK_FORMULA, q, 'DONA')).toBe(10);
    expect(sarflashHisobla(MATO_FORMULA, q, 'KV_M')).toBe(8);
  });

  it("kesim 0.40 × 20.00 — rulon eni O'ZGARMAYDI", () => {
    const q = standartQiymatlar(m(1), m(2), 1, {});
    const kvM = Number(sarflashHisobla(MATO_FORMULA, q, 'KV_M'));

    expect(kesimOlchami(kvM, 2, { kesimEniM: LAMEL_ENI })).toEqual({
      eniM: 0.4,
      boyiM: 20,
    });

    /** Qat'iy enisiz — 4 metr enli rulon so'raladi, bunday rulon yo'q */
    expect(kesimOlchami(kvM, 2).eniM).toBe(4);
  });

  it('OMBORDAN haqiqiy 0.40 × 100 rulon BAND qilinadi', async () => {
    await rulonYarat();

    const q = standartQiymatlar(m(1), m(2), 1, {});
    const kvM = String(sarflashHisobla(MATO_FORMULA, q, 'KV_M'));
    const kerak = kesimOlchami(kvM, 2, { kesimEniM: LAMEL_ENI });

    const n = await buyurtmaYarat(sql, buyurtma(kerak, kvM), XODIM);
    const poz = n.pozitsiyalar[0];

    expect(poz?.holat).toBe('TASDIQLANGAN');

    const band = await sql<{ n: number; eni_m: string; boyi_m: string }[]>`
      SELECT count(*)::int AS n,
             max(bo.eni_m)::text AS eni_m, max(bo.boyi_m)::text AS boyi_m
        FROM band bd
        JOIN bolak bo ON bo.id = bd.bolak_id
       WHERE bd.buyurtma_pozitsiya_id = ${poz?.pozitsiyaId ?? 0}
         AND bd.holat = 'FAOL'`;

    expect(band[0]?.n).toBe(1);
    expect(band[0]?.eni_m).toBe('0.40');
    expect(band[0]?.boyi_m).toBe('100.00');
  }, 120_000);

  it("qat'iy enisiz o'sha rulon TOPILMAYDI — teshikning isboti", async () => {
    await rulonYarat();

    const q = standartQiymatlar(m(1), m(2), 1, {});
    const kvM = String(sarflashHisobla(MATO_FORMULA, q, 'KV_M'));
    /** ⚠️ Ataylab qat'iy ENISIZ — eski xulq */
    const notogri = kesimOlchami(kvM, 2);

    const n = await buyurtmaYarat(sql, buyurtma(notogri, kvM), XODIM);

    /**
     * 4.00 m enli bo'lak yo'q, shuning uchun band qilinmaydi va
     * pozitsiya materialga kutadi. Aynan shu holat egasini
     * qiynagan edi.
     */
    expect(n.pozitsiyalar[0]?.holat).toBe('MATERIALGA_KUTMOQDA');
  }, 120_000);

  it('eski formula KAM yozardi — 2 kv.m, kerakligi 8', () => {
    const q = standartQiymatlar(m(1), m(2), 1, {});
    expect(sarflashHisobla('MAYDON * 1', q, 'KV_M')).toBe(2);
    expect(sarflashHisobla(MATO_FORMULA, q, 'KV_M')).toBe(8);
  });

  it("eski begunok formulasi enidan qat'i nazar 1 ta berardi", () => {
    for (const eni of [1, 2, 3]) {
      const q = standartQiymatlar(m(eni), m(2), 1, {});
      expect(sarflashHisobla('ENI * 0.001', q, 'DONA')).toBe(1);
      expect(sarflashHisobla(BIGUNOK_FORMULA, q, 'DONA')).toBe(eni * 10);
    }
  });
});
