/**
 * P-24 · TZ 3.5 · 3.6 · 7.6 — KESIM SLOT SARFLASHIDAN CHIQADI
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    Dikke 180 × 220 da CHET sloti atigi 0.30 × 2.20 = 0.66 kv.m.
 *    Agar butun mahsulot eni ishlatilsa, mahsulotga 1.80 × 2.20 =
 *    3.96 kv.m yoziladi va ~3.3 kv.m mato hujjatda jimgina
 *    yo'qoladi.
 *
 * ⚠️ UCH QATOR INVARIANTI BUNI USHLAMAYDI.
 *
 *    `kesimBalansi` faqat «chiqqan = ostatka + chiqindi +
 *    mahsulotga» ni tekshiradi. Noto'g'ri `kerak` da ham yig'indi
 *    nolga teng chiqadi — shunchaki mato mahsulot tomonga
 *    surilgan bo'ladi. Shuning uchun qoida ALOHIDA sinaladi.
 *
 * ⚠️ Ikkala yo'l ham tekshiriladi: veb sotuvi (`kerak` chaqiruvchidan
 *    keladi) va bot yo'li (`pozitsiyaniTasdiqla` o'zi hisoblaydi).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, pozitsiyaniTasdiqla, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { ishniOl, tugatdim } from '@/lib/amal/ish';
import { kesimOlchami } from '@/lib/domain/kesish';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let hisoblagich = 0;
let turId = 0;
let slotId = 0;

const FILIAL = 1;
const XODIM = 1;

/** Dikke misoli: mahsulot 180 × 220, CHET sloti 0.30 × 2.20 */
const ENI_SM = 180;
const BOYI_SM = 220;
const SLOT_KV_M = '0.6600';

async function matoYarat(): Promise<number> {
  hisoblagich += 1;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`P24 sinov matosi ${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 'rulon', 'KV_M', 0.5, 1.0, ${XODIM})
    RETURNING id`;
  return m[0]?.id ?? 0;
}

async function rulonYarat(matoId: number): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-P24-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 3.0, 30.0, 20000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`P24 sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    -- ⚠️ TZ 5.3 — barcha uzunlik SMDA: 30 × 220 = 6 600 kv.sm =
    --    0.66 kv.m. 0.30 deb yozilsa natija 100 barobar kichik
    --    chiqadi — serverdagi tekshiruv buni topdi.
    VALUES (${turId}, 'Chet', 1, ${"30 * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

function kirimYasa(matoId: number, kerakBer: boolean): BuyurtmaKirimi {
  hisoblagich += 1;
  return {
    raqam: `B-P24-${String(Date.now())}-${String(hisoblagich)}`,
    mijozId: null,
    sotganFilialId: FILIAL,
    ishlabChiqaruvchiFilialId: FILIAL,
    manba: kerakBer ? 'SAYT' : 'BOT',
    valyuta: 'SOM',
    kursSnapshot: null,
    tayyorlikSana: null,
    qarzgaKetadimi: false,
    pozitsiyalar: [
      {
        mahsulotTurId: turId,
        eniSm: ENI_SM,
        boyiSm: BOYI_SM,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { sinov: true },
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: SLOT_KV_M,
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '120000',
            // Veb yo'lida `kerak` chaqiruvchidan keladi, botda esa yo'q
            kerak: kerakBer ? kesimOlchami(SLOT_KV_M, BOYI_SM) : null,
          },
        ],
        aksessuarlar: [],
      },
    ],
  };
}

async function bandOlchami(
  pozitsiyaId: number,
): Promise<{ eni: number; boyi: number } | null> {
  const q = await sql<{ eni_m: string; boyi_m: string }[]>`
    SELECT bo.eni_m::text, bo.boyi_m::text
    FROM band bd JOIN bolak bo ON bo.id = bd.bolak_id
    WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId} AND bd.holat = 'FAOL'`;
  const b = q[0];
  return b === undefined ? null : { eni: Number(b.eni_m), boyi: Number(b.boyi_m) };
}

// ─── Domen: o'lcham to'g'ri chiqadimi ─────────────────────────────────────

describe('P-24 — kesim to\'rtburchagi maydondan chiqadi', () => {
  it('0.66 kv.m · bo\'yi 220 sm → 0.30 × 2.20', () => {
    expect(kesimOlchami(SLOT_KV_M, BOYI_SM)).toEqual({ eniM: 0.3, boyiM: 2.2 });
  });
});

// ─── «Tugatdim» — asosiy xato shu yerda edi ───────────────────────────────

describe('P-24 · «Tugatdim» mahsulotga SLOT kesimini yozadi', () => {
  it('0.66 kv.m yoziladi, 3.96 emas', async () => {
    const matoId = await matoYarat();
    const rulonId = await rulonYarat(matoId);

    const n = await buyurtmaYarat(sql, kirimYasa(matoId, true), XODIM);
    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

    await ishniOl(sql, pozitsiyaId, XODIM, '25000');

    const b = await sql<{ id: number }[]>`
      SELECT id FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;

    // `qoldiqlar` berilmaydi — tizim o'zi hisoblaydi (egasining qarori)
    const natija = await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: b.map((x) => ({ bandId: x.id, manba: 'RULON' as const })),
        ogohTasdiqlandi: true,
        izoh: null,
      },
      XODIM,
    );

    // ⚠️ ENG MUHIM RAQAM: 0.66, 3.96 EMAS
    expect(natija.mahsulotgaKvM).toBeCloseTo(0.66, 3);

    const bolalar = await sql<{ turi: string; eni: string; boyi: string }[]>`
      SELECT turi, eni_m::text AS eni, boyi_m::text AS boyi
      FROM bolak WHERE ota_bolak_id = ${rulonId} ORDER BY id`;

    const rulon = bolalar.find((x) => x.turi === 'RULON');
    const kesma = bolalar.find((x) => x.turi === 'OSTATKA');

    // Rulon: bo'yi 30 − 2.20 = 27.80, eni o'zgarmaydi (7.4)
    expect(Number(rulon?.eni)).toBeCloseTo(3.0, 2);
    expect(Number(rulon?.boyi)).toBeCloseTo(27.8, 2);
    // Yon kesma: 3.00 − 0.30 = 2.70 enli
    expect(Number(kesma?.eni)).toBeCloseTo(2.7, 2);
    expect(Number(kesma?.boyi)).toBeCloseTo(2.2, 2);
  });

  /**
   * ⚠️ Mato YO'QOLMASLIGI kerak: jurnal bo'yicha ombordan chiqqan
   *    sof miqdor mahsulotga ketganiga TENG.
   */
  it('ombordan chiqqan sof miqdor 0.66 kv.m', async () => {
    const matoId = await matoYarat();
    const rulonId = await rulonYarat(matoId);

    const n = await buyurtmaYarat(sql, kirimYasa(matoId, true), XODIM);
    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    await ishniOl(sql, pozitsiyaId, XODIM, '25000');

    const b = await sql<{ id: number }[]>`
      SELECT id FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: b.map((x) => ({ bandId: x.id, manba: 'RULON' as const })),
        ogohTasdiqlandi: true,
        izoh: null,
      },
      XODIM,
    );

    const j = await sql<{ jami: string | null }[]>`
      SELECT SUM(miqdor_kv_m)::text AS jami FROM ombor_harakat
      WHERE bolak_id = ${rulonId}
         OR bolak_id IN (SELECT id FROM bolak WHERE ota_bolak_id = ${rulonId})`;

    expect(Number(j[0]?.jami ?? 0)).toBeCloseTo(-0.66, 3);
  });
});

// ─── Bot yo'li — pozitsiyaniTasdiqla ──────────────────────────────────────

describe('P-24 · bot yo\'li ham SLOT kesimini band qiladi', () => {
  /**
   * ⚠️ Bot buyurtmasi TASDIQLANMAGAN holda tug'iladi va band
   *    `pozitsiyaniTasdiqla` da qo'yiladi. U `kerak` ni chaqiruvchidan
   *    OLMAYDI — o'zi hisoblashi kerak.
   */
  it('30 smlik slotga 180 smlik bo\'lak band QILINMAYDI', async () => {
    const matoId = await matoYarat();
    await rulonYarat(matoId);

    const n = await buyurtmaYarat(sql, kirimYasa(matoId, false), XODIM);
    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

    // Bot buyurtmasi hali band qilinmagan
    expect(await bandOlchami(pozitsiyaId)).toBeNull();

    await pozitsiyaniTasdiqla(sql, pozitsiyaId, XODIM);

    const olcham = await bandOlchami(pozitsiyaId);
    expect(olcham).not.toBeNull();

    /**
     * Omborda 3.00 × 30.00 rulon bor. 0.30 × 2.20 kesimga u sig'adi.
     * Xato bo'lsa `kerak` 1.80 × 2.20 bo'lardi — u ham sig'adi,
     * shuning uchun BAND BORLIGI yetarli dalil emas. Kesim
     * o'lchamining o'zi tekshiriladi.
     */
    const kerak = kesimOlchami(SLOT_KV_M, BOYI_SM);
    expect(kerak.eniM).toBeCloseTo(0.3, 2);

    // Tasdiqlangach pozitsiya ishga tayyor bo'ladi
    const p = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.holat).toBe('TASDIQLANGAN');
  });
});
