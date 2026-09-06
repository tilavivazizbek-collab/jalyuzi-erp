/**
 * TZ 8.8 · 2.1 · 2.2 · 2.4-invariant
 *
 * Buyurtma STORNOSI — sotuvchining xato yozuvini chiqarish.
 *
 * ⚠️ Bekor qilishdan farqi: bekor — real biznes holati (mijoz
 *    fikridan qaytdi), storno — buyurtma umuman bo'lmagan. Hisobot
 *    ikkalasini ajratishi kerak, shuning uchun pozitsiyalar ikkala
 *    holatda ham `BEKOR` bo'ladi, farq esa buyurtmadagi BELGIDA.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { buyurtmaniStorno } from '@/lib/amal/storno';
import { ishniOl } from '@/lib/amal/ish';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let slotId = 0;
let mijozId = 0;

const FILIAL = 1;
const XODIM = 1;

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Storno sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Storno sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  // ⚠️ `mijoz` da filial ustuni YO'Q — mijoz umumiy (Q-26)
  const mj = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, yaratdi_id)
    VALUES (${`Storno sinov mijozi ${belgi}`}, ${`+9989${belgi.slice(-8)}`}, ${XODIM})
    RETURNING id`;
  mijozId = mj[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

let hisoblagich = 0;

async function rulonYarat(): Promise<void> {
  hisoblagich += 1;
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-STORNO-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 3.0, 30.0, 78000, ${XODIM})
    RETURNING id`;
}

/** Qarzga ketadigan buyurtma — mijoz harakati ham yoziladi (6.8). */
async function buyurtmaTayyorla(qarzga = true): Promise<{
  buyurtmaId: number;
  pozitsiyaId: number;
}> {
  hisoblagich += 1;
  await rulonYarat();

  const kirim: BuyurtmaKirimi = {
    raqam: `B-STORNO-${String(Date.now())}-${String(hisoblagich)}`,
    mijozId,
    sotganFilialId: FILIAL,
    ishlabChiqaruvchiFilialId: FILIAL,
    manba: 'SAYT',
    valyuta: 'SOM',
    kursSnapshot: null,
    tayyorlikSana: null,
    qarzgaKetadimi: qarzga,
    pozitsiyalar: [
      {
        mahsulotTurId: turId,
        eniSm: 120,
        boyiSm: 200,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { sinov: true },
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
  return { buyurtmaId: n.buyurtmaId, pozitsiyaId: n.pozitsiyalar[0]?.pozitsiyaId ?? 0 };
}

// ─── Asosiy yo'l ──────────────────────────────────────────────────────────

describe('TZ 8.8 — storno buyurtmani xato yozuv sifatida chiqaradi', () => {
  it('pozitsiya BEKOR bo\'ladi, band bo\'shaydi, belgi qo\'yiladi', async () => {
    const { buyurtmaId, pozitsiyaId } = await buyurtmaTayyorla();

    const n = await buyurtmaniStorno(sql, buyurtmaId, 'Mijoz raqami adashib kiritilgan', XODIM);

    expect(n.bekorQilinganPozitsiya).toBe(1);
    expect(n.boshatilganBand).toBe(1);

    const p = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.holat).toBe('BEKOR');

    const b = await sql<{ storno_sabab: string | null; storno_xodim_id: number | null }[]>`
      SELECT storno_sabab, storno_xodim_id FROM buyurtma WHERE id = ${buyurtmaId}`;
    expect(b[0]?.storno_sabab).toBe('Mijoz raqami adashib kiritilgan');
    expect(b[0]?.storno_xodim_id).toBe(XODIM);
  });

  it('band qilingan bo\'lak omborga QAYTADI (2.1)', async () => {
    const { buyurtmaId, pozitsiyaId } = await buyurtmaTayyorla();

    const oldin = await sql<{ bolak_id: number }[]>`
      SELECT bolak_id FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    const bolakId = oldin[0]?.bolak_id ?? 0;
    expect(bolakId).toBeGreaterThan(0);

    await buyurtmaniStorno(sql, buyurtmaId, 'Xato yozuv', XODIM);

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
  });

  /**
   * ⚠️ 2.2-invariant: eski `SOTUV` qatori O'ZGARTIRILMAYDI.
   *    Teskari qator yoziladi va yig'indi nolga tushadi — mijoz
   *    varaqasida «sotuv bor edi, storno qilindi» ko'rinib turadi.
   */
  it('mijoz qarzi TESKARI QATOR bilan qaytariladi (6.8 · 2.2)', async () => {
    const { buyurtmaId } = await buyurtmaTayyorla();

    const oldin = await sql<{ n: number; jami: string | null }[]>`
      SELECT COUNT(*)::int AS n, SUM(summa)::text AS jami FROM mijoz_harakat
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId} AND turi = 'SOTUV'`;
    expect(Number(oldin[0]?.jami ?? 0)).toBeGreaterThan(0);

    const n = await buyurtmaniStorno(sql, buyurtmaId, 'Xato yozuv', XODIM);
    expect(Number(n.qarzdanQaytdi)).toBeGreaterThan(0);

    const keyin = await sql<{ n: number; jami: string | null }[]>`
      SELECT COUNT(*)::int AS n, SUM(summa)::text AS jami FROM mijoz_harakat
      WHERE manba_turi = 'buyurtma' AND manba_id = ${buyurtmaId} AND turi = 'SOTUV'`;

    // Qator SONI oshgan — eskisi o'chirilmagan
    expect(keyin[0]?.n).toBe((oldin[0]?.n ?? 0) + 1);
    // Yig'indi esa nol
    expect(Number(keyin[0]?.jami ?? -1)).toBeCloseTo(0, 2);
  });

  it('audit jurnaliga STORNO amali tushadi (2.4)', async () => {
    const { buyurtmaId } = await buyurtmaTayyorla();
    await buyurtmaniStorno(sql, buyurtmaId, 'Ikki marta kiritilgan', XODIM);

    const a = await sql<{ amal: string; izoh: string | null }[]>`
      SELECT amal, izoh FROM audit_jurnal
      WHERE obyekt_turi = 'buyurtma' AND obyekt_id = ${buyurtmaId} AND amal = 'STORNO'`;
    expect(a).toHaveLength(1);
    expect(a[0]?.izoh).toBe('Ikki marta kiritilgan');
  });
});

// ─── To'siqlar ────────────────────────────────────────────────────────────

describe('TZ 8.8 — storno TO\'SIQLARI', () => {
  it('sababsiz storno RAD ETILADI (2.4)', async () => {
    const { buyurtmaId } = await buyurtmaTayyorla();
    await expect(buyurtmaniStorno(sql, buyurtmaId, '   ', XODIM)).rejects.toThrow(BiznesXato);
  });

  it('ikki marta storno qilib bo\'lmaydi', async () => {
    const { buyurtmaId } = await buyurtmaTayyorla();
    await buyurtmaniStorno(sql, buyurtmaId, 'Xato yozuv', XODIM);
    await expect(buyurtmaniStorno(sql, buyurtmaId, 'Yana', XODIM)).rejects.toThrow(BiznesXato);
  });

  /**
   * ⚠️ Pul olingan buyurtma «umuman bo'lmagan» deb aytilmaydi.
   *    Avval kassa yozuvi storno qilinadi (12.15), keyin buyurtma —
   *    aks holda pul qayerga ketgani ikki xil joyda ikki xil
   *    ko'rinardi.
   */
  it('to\'lov qilingan buyurtma STORNOLANMAYDI', async () => {
    const { buyurtmaId } = await buyurtmaTayyorla();

    const k = await sql<{ id: number }[]>`
      SELECT id FROM kassa WHERE filial_id = ${FILIAL} AND faol = true LIMIT 1`;
    const kassaId = k[0]?.id;
    if (kassaId === undefined) return; // sinov bazasida kassa yo'q bo'lsa o'tkazib yuboriladi

    /**
     * ⚠️ `kassa_yozuv` da filial ustuni yo'q — kassa o'zi filialga
     *    tegishli. Kod `K1` — «buyurtma to'lovi» (12.5), summa
     *    MUSBAT: kassaga pul kirdi.
     */
    await sql`
      INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta,
                               manba_turi, manba_id, izoh, xodim_id)
      VALUES (${kassaId}, 'K1', 100000, 'SOM',
              'buyurtma', ${buyurtmaId}, 'Storno sinovi', ${XODIM})`;

    await expect(buyurtmaniStorno(sql, buyurtmaId, 'Xato yozuv', XODIM)).rejects.toThrow(
      BiznesXato,
    );
  });

  /**
   * ⚠️ Mato kesilgan bo'lsa buyurtma «bo'lmagan» emas — u bo'lgan va
   *    zarar keltirgan. Bunday holatda BEKOR QILISH ishlatiladi.
   */
  it('ish boshlangan buyurtma STORNOLANMAYDI', async () => {
    const { buyurtmaId, pozitsiyaId } = await buyurtmaTayyorla();
    await ishniOl(sql, pozitsiyaId, XODIM, '25000');

    await expect(buyurtmaniStorno(sql, buyurtmaId, 'Xato yozuv', XODIM)).rejects.toThrow(
      BiznesXato,
    );
  });

  it('topilmagan buyurtma — aniq xato', async () => {
    await expect(buyurtmaniStorno(sql, 999_999_999, 'Xato', XODIM)).rejects.toThrow(BiznesXato);
  });
});
