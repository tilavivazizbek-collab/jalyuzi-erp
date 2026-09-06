/**
 * TZ 9.11 · 2.3-invariant · §2.2
 *
 * Kirim hujjatini tahrirlash — transport hisobi keyin kelganda.
 *
 * ⚠️ ENG MUHIM QOIDA: yangi tannarx FAQAT omborda qolgan bo'laklarga
 *    qo'llanadi. Sotilgan mahsulot o'z tannarxi bilan qoladi, ya'ni
 *    o'tgan oyning foydasi O'ZGARMAYDI (2.3-invariant). Aks holda
 *    yopilgan hisobot orqaga qarab o'zgarib ketardi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { kirimYarat, type KirimKirimi } from '@/lib/amal/kirim';
import { kirimniTahrirla } from '@/lib/amal/kirim-tahrir';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let yetkazibId = 0;
let matoId = 0;

const FILIAL = 1;
const XODIM = 1;

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${`Kirim tahrir yetkazuvchisi ${belgi}`}, ${XODIM}) RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, sotuv_narx, yaratdi_id)
    VALUES (${`Kirim tahrir matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', '1',
            '120000', ${XODIM}) RETURNING id`;
  matoId = m[0]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

let hisoblagich = 0;

/**
 * Ikki rulonlik kirim: 1.00 × 10.00 va 1.00 × 10.00 = 20 kv.m.
 * Narx 2 000 000, transport boshida NOL.
 */
async function kirimYoz(): Promise<{ kirimId: number }> {
  hisoblagich += 1;

  const kirim: KirimKirimi = {
    raqam: `K-TAHRIR-${String(Date.now())}-${String(hisoblagich)}`,
    sana: '2026-09-01',
    filialId: FILIAL,
    yetkazibBeruvchiId: yetkazibId,
    valyuta: 'SOM',
    kursSnapshot: null,
    transportSumma: '0',
    bojxonaSumma: '0',
    tolovMuddati: null,
    qatorlar: [
      {
        materialId: matoId,
        miqdorKirim: 2,
        narxBirlik: '1000000',
        defektMiqdor: 0,
        defektTuri: null,
        bolaklar: [
          { eniM: 1.0, boyiM: 10.0 },
          { eniM: 1.0, boyiM: 10.0 },
        ],
      },
    ],
  };

  const n = await kirimYarat(sql, kirim, XODIM);
  return { kirimId: n.kirimId };
}

async function bolaklar(
  kirimId: number,
): Promise<{ id: number; holat: string; tannarx: string }[]> {
  return sql<{ id: number; holat: string; tannarx: string }[]>`
    SELECT b.id, b.holat, b.tannarx_birlik_snapshot::text AS tannarx
    FROM bolak b
    JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
    WHERE kq.kirim_id = ${kirimId}
    ORDER BY b.id`;
}

// ─── Asosiy yo'l ──────────────────────────────────────────────────────────

describe('TZ 9.11 — keyin kelgan transport tannarxga qo\'shiladi', () => {
  it('transport 400 000 qo\'shilsa tannarx 100 000 dan 120 000 ga chiqadi', async () => {
    const { kirimId } = await kirimYoz();

    // 2 000 000 / 20 kv.m = 100 000
    const oldin = await bolaklar(kirimId);
    expect(oldin).toHaveLength(2);
    expect(Number(oldin[0]?.tannarx)).toBeCloseTo(100_000, 0);

    const n = await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '400000', bojxonaSumma: '0', izoh: 'Transport hisobi keldi' },
      XODIM,
    );

    expect(n.yangilanganBolak).toBe(2);
    expect(n.tegilmagan).toBe(0);

    // (2 000 000 + 400 000) / 20 = 120 000
    const keyin = await bolaklar(kirimId);
    expect(Number(keyin[0]?.tannarx)).toBeCloseTo(120_000, 0);
    expect(Number(keyin[1]?.tannarx)).toBeCloseTo(120_000, 0);
  });

  it('bojxona ham qo\'shiladi — ikkalasi birga taqsimlanadi', async () => {
    const { kirimId } = await kirimYoz();

    await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '200000', bojxonaSumma: '200000', izoh: null },
      XODIM,
    );

    const keyin = await bolaklar(kirimId);
    expect(Number(keyin[0]?.tannarx)).toBeCloseTo(120_000, 0);
  });

  it('hujjatdagi summa yangilanadi', async () => {
    const { kirimId } = await kirimYoz();

    await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '400000', bojxonaSumma: '50000', izoh: null },
      XODIM,
    );

    const k = await sql<{ transport: string; bojxona: string }[]>`
      SELECT transport_summa::text AS transport, bojxona_summa::text AS bojxona
      FROM kirim WHERE id = ${kirimId}`;
    expect(Number(k[0]?.transport)).toBeCloseTo(400_000, 0);
    expect(Number(k[0]?.bojxona)).toBeCloseTo(50_000, 0);
  });

  it('audit jurnaliga tushadi (2.4)', async () => {
    const { kirimId } = await kirimYoz();
    await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '400000', bojxonaSumma: '0', izoh: 'Yuk xati keldi' },
      XODIM,
    );

    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'kirim' AND obyekt_id = ${kirimId} AND amal <> 'YARAT'`;
    expect(a[0]?.n ?? 0).toBeGreaterThan(0);
  });
});

// ─── 2.3-invariant: o'tmish o'zgarmaydi ───────────────────────────────────

describe('TZ 9.11 · 2.3 — ISHLATILGAN bo\'lak tannarxi QOTGAN', () => {
  it('sotilgan bo\'lak eski tannarxda qoladi, omborda qolgani yangilanadi', async () => {
    const { kirimId } = await kirimYoz();

    const oldin = await bolaklar(kirimId);
    const sotilgan = oldin[0]?.id ?? 0;
    const eskiTannarx = Number(oldin[0]?.tannarx);

    // Birinchi bo'lak ishlatilgan deb belgilanadi — u endi o'tmish
    await sql`
      UPDATE bolak SET holat = 'ISHLATILDI', ozgartirdi_id = ${XODIM}
      WHERE id = ${sotilgan}`;

    const n = await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '400000', bojxonaSumma: '0', izoh: null },
      XODIM,
    );

    expect(n.yangilanganBolak).toBe(1);
    expect(n.tegilmagan).toBe(1);

    const keyin = await bolaklar(kirimId);
    const s = keyin.find((b) => b.id === sotilgan);
    const q = keyin.find((b) => b.id !== sotilgan);

    // ⚠️ O'tgan oyning foydasi O'ZGARMAYDI
    expect(Number(s?.tannarx)).toBeCloseTo(eskiTannarx, 0);
    // Omborda qolgani esa yangi raqamni oladi
    expect(Number(q?.tannarx)).toBeGreaterThan(eskiTannarx);
  });

  it('BAND qilingan bo\'lak ham yangilanadi — u hali kesilmagan (7.3)', async () => {
    const { kirimId } = await kirimYoz();

    const oldin = await bolaklar(kirimId);
    const bandId = oldin[0]?.id ?? 0;
    await sql`UPDATE bolak SET holat = 'BAND', ozgartirdi_id = ${XODIM} WHERE id = ${bandId}`;

    const n = await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '400000', bojxonaSumma: '0', izoh: null },
      XODIM,
    );

    expect(n.yangilanganBolak).toBe(2);
    expect(n.tegilmagan).toBe(0);
  });
});

// ─── Kesimdan tug'ilgan bo'laklar ─────────────────────────────────────────

describe("TZ 9.11 — kesimdan tug'ilgan bo'lak ham yangilanadi", () => {
  /**
   * ⚠️ Kesimda tug'ilgan bo'lakda `kirim_qator_id` BO'SH bo'ladi,
   *    faqat `ota_bolak_id` bor (`ish.ts`). Shu sababli u kirim
   *    qatoriga tegishli bo'laklar ro'yxatiga TUSHMAYDI.
   *
   *    Aynan ular «omborda qolgan material» ning o'zi: 1 × 10
   *    rulondan kesilgach qolgan 1 × 8 rulon. Ularsiz TZ 9.11
   *    yarim bajarilardi.
   */
  it("ota kesilgan bo'lsa ham, bolasi yangi tannarxni oladi", async () => {
    const { kirimId } = await kirimYoz();
    const oldin = await bolaklar(kirimId);
    const ota = oldin[0]?.id ?? 0;
    const eskiTannarx = Number(oldin[0]?.tannarx);

    // Ota kesilgan: o'zi ISHLATILDI, o'rniga bola tug'ilgan
    await sql`
      UPDATE bolak SET holat = 'ISHLATILDI', ozgartirdi_id = ${XODIM}
      WHERE id = ${ota}`;

    const bola = await sql<{ id: number }[]>`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         ota_bolak_id, tannarx_birlik_snapshot, holat, yaratdi_id)
      VALUES (${matoId}, ${FILIAL},
              ${`O-TAHRIR-${String(Date.now())}`}, 'OSTATKA', 1.0, 8.0,
              ${ota}, ${eskiTannarx}, 'BOSH', ${XODIM})
      RETURNING id`;
    const bolaId = bola[0]?.id ?? 0;

    await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '400000', bojxonaSumma: '0', izoh: null },
      XODIM,
    );

    const k = await sql<{ tannarx: string }[]>`
      SELECT tannarx_birlik_snapshot::text AS tannarx FROM bolak WHERE id = ${bolaId}`;

    // Bola OTASIDAN meros oladi (EC-OMB-06) — ya'ni yangi raqam
    expect(Number(k[0]?.tannarx)).toBeCloseTo(120_000, 0);
    expect(Number(k[0]?.tannarx)).toBeGreaterThan(eskiTannarx);
  });

  /**
   * ⚠️ 2.3 — ISHLATILGAN bolaga tegilmaydi: u sotilgan mahsulotning
   *    tannarxiga kirgan.
   */
  it('ishlatilgan bolaga TEGILMAYDI (2.3)', async () => {
    const { kirimId } = await kirimYoz();
    const oldin = await bolaklar(kirimId);
    const ota = oldin[0]?.id ?? 0;
    const eskiTannarx = Number(oldin[0]?.tannarx);

    await sql`
      UPDATE bolak SET holat = 'ISHLATILDI', ozgartirdi_id = ${XODIM}
      WHERE id = ${ota}`;

    const bola = await sql<{ id: number }[]>`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         ota_bolak_id, tannarx_birlik_snapshot, holat, yaratdi_id)
      VALUES (${matoId}, ${FILIAL},
              ${`O-TAHRIR-ISH-${String(Date.now())}`}, 'OSTATKA', 1.0, 8.0,
              ${ota}, ${eskiTannarx}, 'ISHLATILDI', ${XODIM})
      RETURNING id`;
    const bolaId = bola[0]?.id ?? 0;

    await kirimniTahrirla(
      sql,
      { kirimId, transportSumma: '400000', bojxonaSumma: '0', izoh: null },
      XODIM,
    );

    const k = await sql<{ tannarx: string }[]>`
      SELECT tannarx_birlik_snapshot::text AS tannarx FROM bolak WHERE id = ${bolaId}`;
    expect(Number(k[0]?.tannarx)).toBeCloseTo(eskiTannarx, 0);
  });
});

// ─── To'siqlar ────────────────────────────────────────────────────────────

describe('TZ 9.11 — to\'siqlar', () => {
  it('manfiy transport RAD ETILADI', async () => {
    const { kirimId } = await kirimYoz();
    await expect(
      kirimniTahrirla(
        sql,
        { kirimId, transportSumma: '-1', bojxonaSumma: '0', izoh: null },
        XODIM,
      ),
    ).rejects.toThrow(BiznesXato);
  });

  it('manfiy bojxona RAD ETILADI', async () => {
    const { kirimId } = await kirimYoz();
    await expect(
      kirimniTahrirla(
        sql,
        { kirimId, transportSumma: '0', bojxonaSumma: '-5000', izoh: null },
        XODIM,
      ),
    ).rejects.toThrow(BiznesXato);
  });

  it('topilmagan hujjat — aniq xato', async () => {
    await expect(
      kirimniTahrirla(
        sql,
        { kirimId: 999_999_999, transportSumma: '0', bojxonaSumma: '0', izoh: null },
        XODIM,
      ),
    ).rejects.toThrow(BiznesXato);
  });
});
