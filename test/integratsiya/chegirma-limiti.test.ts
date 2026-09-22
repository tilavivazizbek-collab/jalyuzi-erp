/**
 * SOTUVCHINING CHEGIRMA CHEGARASI — TZ 2.4 · 6.4 (2026-09-21)
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    `CHEGIRMA_LIMITIDAN_OSHDI` hodisasi `lib/audit/amallar.ts` da
 *    2026-08 dan beri ta'riflangan va «sotuvchi intizomi»
 *    hisobotida sanaladi — lekin HECH QAYERDA YOZILMAGAN edi.
 *    Hisobot har doim nol ko'rsatardi, egasi esa «hech kim
 *    ortiqcha chegirma bermayapti» degan xato xulosa chiqarardi.
 *    Nol ko'rsatadigan nazorat — nazorat emas, yolg'on tinchlik.
 *
 * ⚠️ BU TEST BLOKLASHNI EMAS, IZNI tekshiradi. TZ 6.4: chegirma ham,
 *    qarz limiti ham sotuvni TO'XTATMAYDI — sotuvchi mustaqil qaror
 *    qabul qiladi. Shuning uchun har testda buyurtma SAQLANGANI ham
 *    tekshiriladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { xodimYarat } from '@/lib/amal/xodim';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let slotId = 0;
let hisoblagich = 0;

const FILIAL = 1;
const EGA = 1;
const belgi = String(Date.now());

/** Har testda o'z sotuvchisi — chegarasi bilan */
async function sotuvchi(limit: string): Promise<number> {
  hisoblagich += 1;
  const r = await sql<{ id: number }[]>`
    SELECT id FROM rol WHERE kod = 'SOTUVCHI'`;

  const n = await xodimYarat(
    sql,
    {
      ism: `CHL-${belgi}-${String(hisoblagich)}`,
      telefon: `9${belgi.slice(-6)}${String(hisoblagich).padStart(2, '0')}`,
      filialId: FILIAL,
      rolIdlar: [r[0]?.id ?? 0],
      parol: undefined,
      ishgaKirdi: undefined,
      chegirmaLimitFoiz: limit,
    },
    EGA,
  );
  return n.id;
}

beforeAll(async () => {
  sql = sinovUlanishi();

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`CHL mato ${belgi}`}, 'RULON', 'rulon', 'KV_M', 0.3, 0.5, ${EGA})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`CHL tur ${belgi}`}, ${EGA}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Mato', 1, ${"ENI * BO'YI"}, ${EGA}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  /** ⚠️ O'chirilmaydi — nofaol qilinadi (2.1-invariant) */
  await sql`UPDATE xodim SET faol = false WHERE ism LIKE ${`CHL-${belgi}%`}`;
  await sql.end({ timeout: 5 });
});

/**
 * Bitta pozitsiyali buyurtma yozadi.
 *
 * `chegirmaFoiz` — sotuv ekrani hisoblab yuboradigan qiymat
 * (`chegirma jami ÷ savat jami × 100`).
 */
async function buyurtma(
  xodimId: number,
  chegirmaFoiz: number | null,
): Promise<number> {
  hisoblagich += 1;
  const nomer = `${belgi}-${String(hisoblagich)}`;

  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL}, ${`CHL-R-${nomer}`}, 'RULON',
            2.0, 20.0, 50000, ${EGA})`;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-CHL-${nomer}`,
    mijozId: null,
    sotganFilialId: FILIAL,
    ishlabChiqaruvchiFilialId: FILIAL,
    manba: 'SAYT',
    valyuta: 'SOM',
    kursSnapshot: null,
    tayyorlikSana: null,
    qarzgaKetadimi: false,
    chegirmaFoiz,
    pozitsiyalar: [
      {
        mahsulotTurId: turId,
        eniM: 1.2,
        boyiM: 2.0,
        soni: 1,
        narxSnapshot: '240000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: { parametrlar: [] },
        slotlar: [
          {
            slotId,
            materialId: matoId,
            hisoblanganMiqdor: '2.4000',
            tuzatilganMiqdor: null,
            birlik: 'KV_M',
            narxSnapshot: '0',
            kerak: { eniM: 1.2, boyiM: 2.0 },
          },
        ],
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, xodimId);
  return n.buyurtmaId;
}

async function ogohlantirish(
  buyurtmaId: number,
): Promise<{ n: number; izoh: string }> {
  const q = await sql<{ n: number; izoh: string | null }[]>`
    SELECT COUNT(*)::int AS n, MAX(izoh) AS izoh
      FROM audit_jurnal
     WHERE amal = 'CHEGIRMA_LIMITIDAN_OSHDI'
       AND obyekt_turi = 'buyurtma' AND obyekt_id = ${buyurtmaId}`;
  return { n: q[0]?.n ?? 0, izoh: q[0]?.izoh ?? '' };
}

describe('TZ 6.4 — chegirma chegarasi o‘lchanadi, bloklanmaydi', () => {
  it('chegaradan OSHSA audit jurnaliga yoziladi', async () => {
    const x = await sotuvchi('10');
    const b = await buyurtma(x, 25);

    const a = await ogohlantirish(b);
    expect(a.n).toBe(1);

    /** Egasi jurnalda ikki raqamni ham ko'radi */
    expect(a.izoh).toContain('10');
    expect(a.izoh).toContain('25');
  }, 120_000);

  it('⚠️ BLOKLAMAYDI — buyurtma baribir saqlanadi', async () => {
    const x = await sotuvchi('5');
    const b = await buyurtma(x, 40);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma WHERE id = ${b}`;
    expect(q[0]?.n).toBe(1);
  }, 120_000);

  it('chegara ichida bo‘lsa yozilmaydi', async () => {
    const x = await sotuvchi('20');
    const b = await buyurtma(x, 15);

    expect((await ogohlantirish(b)).n).toBe(0);
  }, 120_000);

  it('AYNAN chegaraga teng — oshgan emas, yozilmaydi', async () => {
    const x = await sotuvchi('10');
    const b = await buyurtma(x, 10);

    expect((await ogohlantirish(b)).n).toBe(0);
  }, 120_000);

  it('chegara QO‘YILMAGAN sotuvchi tekshirilmaydi ham', async () => {
    /**
     * ⚠️ Bo'sh — «chegara yo'q» (standart holat). Nol esa
     *    «umuman chegirma berolmaydi» degani, bu boshqa ma'no.
     */
    const x = await sotuvchi('');
    const b = await buyurtma(x, 90);

    expect((await ogohlantirish(b)).n).toBe(0);
  }, 120_000);

  it('chegarasi NOL sotuvchi har qanday chegirmada yoziladi', async () => {
    const x = await sotuvchi('0');
    const b = await buyurtma(x, 1);

    expect((await ogohlantirish(b)).n).toBe(1);
  }, 120_000);

  it('chegirma umuman berilmagan bo‘lsa (null) yozilmaydi', async () => {
    const x = await sotuvchi('0');
    const b = await buyurtma(x, null);

    expect((await ogohlantirish(b)).n).toBe(0);
  }, 120_000);
});
