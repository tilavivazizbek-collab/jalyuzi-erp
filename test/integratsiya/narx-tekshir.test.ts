/**
 * NARX SERVERDA QAYTA HISOBLANADI — §9.4 · TZ 3.8 · 3.11 · 2.4
 *
 * ⚠️ Ombor sarflashi 2026-09 dan beri serverda qayta hisoblanadi:
 *    sotuvchining brauzerida ochiq turgan ESKI sahifa eski formulani
 *    ushlab qolmasin deb. Narxga esa tegilmasdi — izohda sabab ham
 *    yozilgan edi: «narxni sotuvchi qo'lda qo'yadi, u kelishilgan».
 *
 *    O'sha sabab 2026-09-20 gacha to'g'ri edi. Endi narx EGASINING
 *    JADVALIDAN keladi va egasi narxni o'zgartirsa, ochiq turgan
 *    sahifa eski narxni JIMGINA yozardi.
 *
 * ⚠️ Bu testlar BLOKLASHNI emas, IZNI tekshiradi: narx baribir
 *    saqlanadi (TZ 3.8 — kelishiladi), lekin `qolda_narx` belgisi
 *    va `NARX_QOLDA` audit yozuvi qoladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let slotId = 0;
let darajaId = 0;
let hisoblagich = 0;

const FILIAL = 1;
const XODIM = 1;

/** Bosqich: 1 kv.m dan kattasiga 100 000 so'm/kv.m */
const NARX_KV_M = 100_000;

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const g = await sql<{ id: number }[]>`
    INSERT INTO narx_guruh (nom, yaratdi_id)
    VALUES (${`NT daraja ${belgi}`}, ${XODIM}) RETURNING id`;
  darajaId = g[0]?.id ?? 0;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          narx_guruh_id, yaroqsiz_chegara_m,
                          kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`NT mato ${belgi}`}, 'RULON', 'rulon', 'KV_M',
            ${darajaId}, 0.3, 0.5, ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`NT tur ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  /** Narx qoidasi: hamma mijoz, hamma filial, maydon bo'yicha */
  const n = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_narx (mahsulot_tur_id, narx_guruh_id, hisoblash_usuli,
                               yaratdi_id)
    VALUES (${turId}, ${darajaId}, 'MAYDON', ${XODIM}) RETURNING id`;
  const narxId = n[0]?.id ?? 0;

  await sql`
    INSERT INTO mahsulot_narx_bosqich (mahsulot_narx_id, dan, gacha, narx,
                                       valyuta, tartib, yaratdi_id)
    VALUES (${narxId}, 0, NULL, ${NARX_KV_M}, 'SOM', 0, ${XODIM})`;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

async function rulonYarat(): Promise<void> {
  hisoblagich += 1;
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`NT-R-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', 2.0, 20.0, 50000, ${XODIM})`;
}

/**
 * Buyurtma yozadi. `narx` — sotuvchining brauzeri yuborgan summa.
 *
 * ⚠️ 1.20 × 2.00 = 2.40 kv.m → 2.40 × 100 000 = 240 000 so'm
 */
async function buyurtma(narx: string): Promise<number> {
  hisoblagich += 1;
  await rulonYarat();

  const kirim: BuyurtmaKirimi = {
    raqam: `B-NT-${String(Date.now())}-${String(hisoblagich)}`,
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
        eniM: 1.2,
        boyiM: 2.0,
        soni: 1,
        narxSnapshot: narx,
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

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  return n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
}

async function holat(poz: number): Promise<{ qolda: boolean; narx: string }> {
  const q = await sql<{ qolda_narx: boolean; narx_snapshot: string }[]>`
    SELECT qolda_narx, narx_snapshot::text
      FROM buyurtma_pozitsiya WHERE id = ${poz}`;
  return { qolda: q[0]?.qolda_narx ?? false, narx: q[0]?.narx_snapshot ?? '' };
}

async function auditSoni(poz: number): Promise<number> {
  const q = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM audit_jurnal
     WHERE amal = 'NARX_QOLDA' AND obyekt_turi = 'buyurtma_pozitsiya'
       AND obyekt_id = ${poz}`;
  return q[0]?.n ?? 0;
}

describe('narx serverda qayta hisoblanadi', () => {
  it('jadval narxi bilan kelsa — `qolda_narx` YO‘Q, audit ham yo‘q', async () => {
    const poz = await buyurtma('240000');

    const h = await holat(poz);
    expect(h.qolda).toBe(false);
    expect(await auditSoni(poz)).toBe(0);
  }, 120_000);

  it('ARZONROQ yozilsa — belgi qo‘yiladi va auditga tushadi', async () => {
    /** Sotuvchi 200 000 deb yozdi, jadval 240 000 deydi */
    const poz = await buyurtma('200000');

    const h = await holat(poz);
    expect(h.qolda).toBe(true);

    /** ⚠️ BLOKLAMAYDI — narx baribir sotuvchi yozganicha saqlanadi */
    expect(h.narx).toBe('200000.00');
    expect(await auditSoni(poz)).toBe(1);
  }, 120_000);

  it('QIMMATROQ yozilsa ham belgilanadi — ikki tomon ham iz qoldiradi', async () => {
    const poz = await buyurtma('300000');

    expect((await holat(poz)).qolda).toBe(true);
    expect(await auditSoni(poz)).toBe(1);
  }, 120_000);

  it('audit yozuvida ESKI va YANGI narx ikkalasi ham bor', async () => {
    const poz = await buyurtma('200000');

    const a = await sql<{ eski: unknown; yangi: unknown }[]>`
      SELECT eski_qiymat AS eski, yangi_qiymat AS yangi FROM audit_jurnal
       WHERE amal = 'NARX_QOLDA' AND obyekt_id = ${poz}`;

    /** Jadval bo'yicha qancha bo'lishi kerakligi — egasi shuni ko'radi */
    expect(JSON.stringify(a[0]?.eski)).toContain('240000');
    expect(JSON.stringify(a[0]?.yangi)).toContain('200000');
  }, 120_000);

  it('100 so‘mgacha farq E’TIBORGA OLINMAYDI — yaxlitlash shovqini', async () => {
    /**
     * ⚠️ Brauzer va server bir xil `Decimal` bilan hisoblaydi, lekin
     *    yaxlitlash qadami bir tiyin farq berishi mumkin. Har tiyinni
     *    «qo'lda qo'yilgan» deb belgilash ro'yxatni shovqinga
     *    aylantirardi va egasi uni o'qimay qo'yardi.
     */
    const poz = await buyurtma('240050');

    expect((await holat(poz)).qolda).toBe(false);
    expect(await auditSoni(poz)).toBe(0);
  }, 120_000);

  it('narx qoidasi YO‘Q bo‘lsa belgilanmaydi — taqqoslaydigan narsa yo‘q', async () => {
    hisoblagich += 1;
    const belgi = `${String(Date.now())}-${String(hisoblagich)}`;

    /** Darajasi boshqa mato — bu turga qoida qo'yilmagan */
    const g = await sql<{ id: number }[]>`
      INSERT INTO narx_guruh (nom, yaratdi_id)
      VALUES (${`NT bosh daraja ${belgi}`}, ${XODIM}) RETURNING id`;

    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                            narx_guruh_id, yaroqsiz_chegara_m,
                            kam_ishlatiladigan_m, yaratdi_id)
      VALUES (${`NT mato2 ${belgi}`}, 'RULON', 'rulon', 'KV_M',
              ${g[0]?.id ?? 0}, 0.3, 0.5, ${XODIM})
      RETURNING id`;
    const mato2 = m[0]?.id ?? 0;

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${mato2}, ${FILIAL}, ${`NT-R2-${belgi}`},
              'RULON', 2.0, 20.0, 50000, ${XODIM})`;

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-NT2-${belgi}`,
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
            eniM: 1.2,
            boyiM: 2.0,
            soni: 1,
            narxSnapshot: '999999',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { parametrlar: [] },
            slotlar: [
              {
                slotId,
                materialId: mato2,
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
      },
      XODIM,
    );

    const poz = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    expect((await holat(poz)).qolda).toBe(false);
  }, 120_000);
});
