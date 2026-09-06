/**
 * TZ 7.4 · 7.6 · Q-05 — OCHILGAN RULON, bazadan boshdan-oxir.
 *
 * ⚠️ Egasining misoli (2026-09-05): 3 × 35 rulondan 1.5 × 5 parda
 *    kesilsa — rulon 3 × 30 bo'lib QOLADI va yonidan 1.5 × 5 kesma
 *    ortadi. Keyingi buyurtma esa yangi rulonni ochmasdan AVVAL
 *    o'sha ochilganini tugatadi.
 *
 * ⚠️ Bu yerda aynan shu zanjir tekshiriladi: domain testlari
 *    geometriyani, bu test esa bazaga NIMA YOZILGANINI ko'radi.
 *    Ilgari `ochilgan` belgisi hech qachon yozilmagani uchun
 *    TZ 7.6 ning o'rta bosqichi jimgina o'lik turgan edi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { ishniOl, tugatdim } from '@/lib/amal/ish';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let hisoblagich = 0;
let turId = 0;
let slotId = 0;

const FILIAL = 1;
const XODIM = 1;

/**
 * ⚠️ HAR TEST O'Z MATOSINI OLADI.
 *
 *    Aks holda testlar bir-birini buzadi — va aynan TO'G'RI ishlagani
 *    uchun: birinchi test ochilgan rulon qoldiradi, ikkinchisi esa
 *    7.6 bo'yicha o'sha ochilganini oladi va o'zi yaratgan yangi
 *    rulonga tegmaydi. Bu kodning xatosi emas, testniki.
 */
async function matoYarat(): Promise<number> {
  hisoblagich += 1;
  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`Ochilgan rulon matosi ${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 'rulon', 'KV_M', 0.5, 1.0, ${XODIM})
    RETURNING id`;
  return m[0]?.id ?? 0;
}

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Ochilgan rulon turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

async function rulonYarat(matoId: number, eniM: number, boyiM: number): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-OCH-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', ${eniM}, ${boyiM}, 20000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

/** Buyurtma yaratadi, ustaga beradi va «Tugatdim» ni bosadi. */
async function kesimQil(matoId: number, eniM: number, boyiM: number): Promise<void> {
  hisoblagich += 1;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-OCH-${String(Date.now())}-${String(hisoblagich)}`,
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
        eniSm: Math.round(eniM * 100),
        boyiSm: Math.round(boyiM * 100),
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { sinov: true },
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: (eniM * boyiM).toFixed(4),
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '120000',
            kerak: { eniM, boyiM },
          },
        ],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

  await ishniOl(sql, pozitsiyaId, XODIM, '25000');

  const b = await sql<{ id: number }[]>`
    SELECT id FROM band
    WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL' ORDER BY id`;

  /**
   * ⚠️ `qoldiqlar` BERILMAYDI — tizim o'zi hisoblasin. Aynan shu
   *    yo'l ekranda ham, botda ham ishlatiladi (egasining qarori).
   */
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
}

async function bolaklar(otaId: number): Promise<
  { kod: string; turi: string; ochilgan: boolean; eni: string; boyi: string }[]
> {
  return sql<{ kod: string; turi: string; ochilgan: boolean; eni: string; boyi: string }[]>`
    SELECT kod, turi, ochilgan, eni_m::text AS eni, boyi_m::text AS boyi
    FROM bolak WHERE ota_bolak_id = ${otaId} ORDER BY id`;
}

// ─── Egasining misoli ─────────────────────────────────────────────────────

describe("TZ 7.4 — 3 × 35 rulondan 1.5 × 5 kesilsa", () => {
  it('rulon 3 × 30 bo\'lib QOLADI, yonidan 1.5 × 5 kesma ortadi', async () => {
    const matoId = await matoYarat();
    const rulonId = await rulonYarat(matoId, 3.0, 35.0);
    await kesimQil(matoId, 1.5, 5.0);

    const bolalar = await bolaklar(rulonId);
    expect(bolalar).toHaveLength(2);

    const rulon = bolalar.find((b) => b.turi === 'RULON');
    const kesma = bolalar.find((b) => b.turi === 'OSTATKA');

    // ⚠️ Rulonning ENISI o'zgarmaydi (7.4)
    expect(Number(rulon?.eni)).toBeCloseTo(3.0, 2);
    expect(Number(rulon?.boyi)).toBeCloseTo(30.0, 2);
    // ⚠️ Va u OCHILGAN deb belgilanadi — 7.6 tanlovi shunga qaraydi
    expect(rulon?.ochilgan).toBe(true);
    expect(rulon?.kod.startsWith('R-')).toBe(true);

    // Yon kesma: eni 3 − 1.5, bo'yi buyurtmaniki
    expect(Number(kesma?.eni)).toBeCloseTo(1.5, 2);
    expect(Number(kesma?.boyi)).toBeCloseTo(5.0, 2);
    expect(kesma?.ochilgan).toBe(false);
  });

  it('manba rulon ombordan chiqadi — ikki marta sanalmaydi (2.2)', async () => {
    const matoId = await matoYarat();
    const rulonId = await rulonYarat(matoId, 3.0, 35.0);
    await kesimQil(matoId, 1.5, 5.0);

    const m = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${rulonId}`;
    expect(m[0]?.holat).toBe('ISHLATILDI');
  });

  /**
   * ⚠️ Eski kodda mahsulotga BUTUN rulon (105 kv.m) yozilardi:
   *    ortgan mato hech qayerda hisobga olinmasdi va tannarx
   *    ikki barobar chiqardi.
   */
  it('mahsulotga faqat 7.5 kv.m yoziladi, 105 emas', async () => {
    const matoId = await matoYarat();
    const rulonId = await rulonYarat(matoId, 3.0, 35.0);
    await kesimQil(matoId, 1.5, 5.0);

    const j = await sql<{ jami: string | null }[]>`
      SELECT SUM(miqdor_kv_m)::text AS jami FROM ombor_harakat
      WHERE bolak_id = ${rulonId}
         OR bolak_id IN (SELECT id FROM bolak WHERE ota_bolak_id = ${rulonId})`;

    // Chiqqan − qaytgan = mahsulotga ketgan, ishorasi manfiy
    expect(Number(j[0]?.jami ?? 0)).toBeCloseTo(-7.5, 3);
  });
});

// ─── 7.6 · Boshlang'ich zahiradagi ochiq rulon ───────────────────────────

describe("TZ 7.6 — qo'lda kiritilgan ochiq rulon ham tanilishi kerak", () => {
  /**
   * ⚠️ Boshlang'ich zahirada kiritilgan ochiq rulonning OTASI YO'Q —
   *    u tizimdan oldin ochilgan.
   *
   *    Nomzod so'rovi ilgari «ochilganmi» degan savolga
   *    `ota_bolak_id IS NOT NULL` deb javob berardi. Ya'ni egasi
   *    qo'lda kiritgan ochiq rulonlar UMUMAN tanilmasdi va tizim
   *    ular turgan holda yangi rulon ochardi.
   */
  it("otasi yo'q ochiq rulon yangi rulondan OLDIN olinadi", async () => {
    const matoId = await matoYarat();

    // Yangi, ochilmagan rulon — tegilmasligi kerak
    const yangiId = await rulonYarat(matoId, 3.0, 35.0);

    // Egasi qo'lda kiritgan OCHIQ rulon: otasi yo'q, belgisi bor
    hisoblagich += 1;
    const ochiq = await sql<{ id: number }[]>`
      INSERT INTO bolak (material_id, filial_id, kod, turi, ochilgan,
                         eni_m, boyi_m, tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${matoId}, ${FILIAL},
              ${`R-QOL-${String(Date.now())}-${String(hisoblagich)}`},
              'RULON', true, 3.0, 20.0, 20000, ${XODIM})
      RETURNING id`;
    const ochiqId = ochiq[0]?.id ?? 0;

    await kesimQil(matoId, 1.5, 5.0);

    const y = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE id = ${yangiId}`;
    const o = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE id = ${ochiqId}`;

    // Ochiq rulon ishlatildi, yangisiga tegilmadi
    expect(o[0]?.holat).toBe('ISHLATILDI');
    expect(y[0]?.holat).toBe('BOSH');
  });
});

// ─── 7.6 · Ochilganini avval tugat ────────────────────────────────────────

describe('TZ 7.6 — ochiq rulon yangi rulondan OLDIN ishlatiladi', () => {
  it('ikkinchi buyurtma ochilgan ruloni oladi', async () => {
    const matoId = await matoYarat();
    const birinchi = await rulonYarat(matoId, 3.0, 35.0);
    await kesimQil(matoId, 1.5, 5.0);

    const bolalar = await bolaklar(birinchi);
    const ochiqKod = bolalar.find((b) => b.turi === 'RULON')?.kod ?? '';
    expect(ochiqKod).not.toBe('');

    // Yangi, ochilmagan rulon ham turibdi — u tegilmasligi kerak
    const yangiRulonId = await rulonYarat(matoId, 3.0, 35.0);

    /**
     * ⚠️ Ikkinchi buyurtma o'lchami BOSHQACHA (2.0 × 4.0).
     *
     *    Agar yana 1.5 × 5.0 so'ralsa, birinchi kesimdan qolgan
     *    1.5 × 5.0 parcha AYNAN mos tushardi va tanlov qoidasi
     *    bo'yicha o'sha birinchi bo'lardi — ochiq rulon emas.
     *    Bu test esa aynan ochiq rulon navbatini tekshiradi.
     */
    await kesimQil(matoId, 2.0, 4.0);

    const yangi = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE id = ${yangiRulonId}`;
    // ⚠️ Yangi rulon HALI OCHILMAGAN: ochilgani birinchi ishlatildi
    expect(yangi[0]?.holat).toBe('BOSH');

    const ochiq = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE kod = ${ochiqKod}`;
    expect(ochiq[0]?.holat).toBe('ISHLATILDI');
  });

  /**
   * ⚠️ AYNAN mos kesma ochiq rulondan ham OLDIN turadi.
   *
   *    Sabab: u butunlay ishlatiladi — na yon parcha, na chiqindi
   *    qoladi. Ochiq rulonni ochish esa yana bir parcha tug'diradi.
   */
  it('aynan mos kesma ochiq rulondan ham oldin ishlatiladi', async () => {
    const matoId = await matoYarat();
    const birinchi = await rulonYarat(matoId, 3.0, 35.0);
    await kesimQil(matoId, 1.5, 5.0);

    const bolalar = await bolaklar(birinchi);
    const ochiqKod = bolalar.find((b) => b.turi === 'RULON')?.kod ?? '';
    const kesmaKod = bolalar.find((b) => b.turi === 'OSTATKA')?.kod ?? '';
    expect(kesmaKod).not.toBe('');

    // Xuddi shu o'lcham yana so'raladi — kesma AYNAN mos tushadi
    await kesimQil(matoId, 1.5, 5.0);

    const k = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE kod = ${kesmaKod}`;
    expect(k[0]?.holat).toBe('ISHLATILDI');

    // Ochiq rulon esa TEGILMAGAN
    const o = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE kod = ${ochiqKod}`;
    expect(o[0]?.holat).toBe('BOSH');
  });
});
