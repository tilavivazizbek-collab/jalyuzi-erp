/**
 * TZ 7.3 · 7.4 · QISM 1 §6.5 · QISM 3 §3
 *
 * Ombor jadvallarining baza darajasidagi kafolatlari.
 * Eng muhimi: «ikki usta bir vaqtda bitta bo'lakka da'vo qilsa —
 * birinchi so'rov oladi, ikkinchisiga rad javobi» (7.3).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let materialId: number;
let bolakId: number;

const FILIAL = 1;
const XODIM = 1;

beforeAll(async () => {
  sql = sinovUlanishi();

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES ('Ombor sinov matosi', 'RULON', 'rulon', 'KV_M', ${XODIM}) RETURNING id`;
  const mid = m[0]?.id;
  if (mid === undefined) throw new Error('material yaratilmadi');
  materialId = mid;
}, 60_000);

afterAll(async () => {
  await sql.end();
});

/**
 * ⚠️ Bo'lak kodi va kirim raqami BAZADA NOYOB. Qat'iy yozilsa test
 *    birinchi yurishdan keyin o'zini o'zi buzadi: ikkinchi safar
 *    `duplicate key` chiqadi va bu «kod buzildi» bo'lib ko'rinadi.
 *
 *    Belgi HAR YURISHDA yangi, lekin yurish ICHIDA bir xil — shuning
 *    uchun «kod takrorlanmasin» degan test ham ishlayveradi.
 */
const BELGI = String(Date.now()).slice(-8);

async function radEtilsin(ish: () => Promise<unknown>): Promise<void> {
  await expect(ish()).rejects.toThrow();
}

/** Har testga toza bo'lak — kodi noyob bo'lishi shart. */
async function bolakYarat(kod: string, eni = 3.0, boyi = 30.0): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${`${kod}-${BELGI}`}, 'RULON', ${eni}, ${boyi},
            78000, ${XODIM})
    RETURNING id`;
  const id = q[0]?.id;
  if (id === undefined) throw new Error("bo'lak yaratilmadi");
  return id;
}

// ─── TZ 7.4 · O'lcham majburiy ────────────────────────────────────────────

describe("TZ 7.4 — bo'lak `eni × bo'yi` bilan saqlanadi", () => {
  it("rulon o'lchamsiz saqlanmaydi — maydon bo'yicha tanlash xato beradi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO bolak (material_id, filial_id, kod, turi,
                           tannarx_birlik_snapshot, yaratdi_id)
        VALUES (${materialId}, ${FILIAL}, 'R-OLCHAMSIZ', 'RULON', 78000, ${XODIM})`,
    );
  });

  it('DONA turida miqdor talab qilinadi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO bolak (material_id, filial_id, kod, turi,
                           tannarx_birlik_snapshot, yaratdi_id)
        VALUES (${materialId}, ${FILIAL}, 'D-BOSH', 'DONA', 5000, ${XODIM})`,
    );
  });

  it("manfiy o'lcham rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                           tannarx_birlik_snapshot, yaratdi_id)
        VALUES (${materialId}, ${FILIAL}, 'R-MANFIY', 'RULON', -1, 10, 78000, ${XODIM})`,
    );
  });

  it("noma'lum holat rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                           holat, tannarx_birlik_snapshot, yaratdi_id)
        VALUES (${materialId}, ${FILIAL}, 'R-HOLAT', 'RULON', 3, 30, 'YOMON', 78000, ${XODIM})`,
    );
  });

  it("bo'lak o'ziga o'zi ota bo'la olmaydi", async () => {
    const id = await bolakYarat('R-OTA-SINOV');
    await radEtilsin(() => sql`UPDATE bolak SET ota_bolak_id = ${id} WHERE id = ${id}`);
  });
});

describe('QISM 3 §3.1 — kod BUTUN TIZIMDA noyob', () => {
  it("bir kod ikki marta yozilmaydi — filial boshqa bo'lsa ham", async () => {
    await bolakYarat('R-NOYOB-1');
    await radEtilsin(() => bolakYarat('R-NOYOB-1'));
  });
});

// ─── TZ 7.3 · Band qilish — eng muhim kafolat ─────────────────────────────

describe('TZ 7.3 — bir bo\'lakda bir vaqtda BITTA faol band', () => {
  beforeAll(async () => {
    bolakId = await bolakYarat('R-BAND-SINOV');
  });

  const bandQoy = (pozitsiya: number, material: number) => sql`
    INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                      amal_qiladi, yaratdi_id)
    VALUES (${bolakId}, ${pozitsiya}, ${material}, now() + interval '30 days', ${XODIM})`;

  it('birinchi band qo\'yiladi', async () => {
    await bandQoy(1001, 2001);
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band WHERE bolak_id = ${bolakId} AND holat = 'FAOL'`;
    expect(q[0]?.n).toBe(1);
  });

  it("IKKINCHI band RAD ETILADI — «ikkinchi ustaga rad javobi»", async () => {
    await radEtilsin(() => bandQoy(1002, 2002));
  });

  it("band bo'shatilgach yangisini qo'ysa bo'ladi (Q-06)", async () => {
    await sql`
      UPDATE band SET holat = 'BOSHATILDI', boshatish_sabab = 'IFLOS',
                      boshatildi = now()
      WHERE bolak_id = ${bolakId} AND holat = 'FAOL'`;
    await bandQoy(1003, 2003);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band WHERE bolak_id = ${bolakId} AND holat = 'FAOL'`;
    expect(q[0]?.n).toBe(1);
  });

  it("Q-06 — bo'shatishda sabab MAJBURIY", async () => {
    const boshqa = await bolakYarat('R-SABAB-SINOV');
    await sql`
      INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                        amal_qiladi, yaratdi_id)
      VALUES (${boshqa}, 1004, 2004, now() + interval '30 days', ${XODIM})`;

    await radEtilsin(
      () => sql`UPDATE band SET holat = 'BOSHATILDI' WHERE bolak_id = ${boshqa}`,
    );
  });

  it("noma'lum bo'shatish sababi rad etiladi", async () => {
    const boshqa = await bolakYarat('R-SABAB-2');
    await radEtilsin(
      () => sql`
        INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                          holat, boshatish_sabab, amal_qiladi, yaratdi_id)
        VALUES (${boshqa}, 1005, 2005, 'BOSHATILDI', 'YOMON_SABAB',
                now() + interval '30 days', ${XODIM})`,
    );
  });

  it('ISHLATILDI holatidagi band yangisiga to\'sqinlik qilmaydi', async () => {
    const b = await bolakYarat('R-ISHLATILDI');
    await sql`
      INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                        holat, amal_qiladi, yaratdi_id)
      VALUES (${b}, 1006, 2006, 'ISHLATILDI', now(), ${XODIM})`;
    await sql`
      INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                        amal_qiladi, yaratdi_id)
      VALUES (${b}, 1007, 2007, now() + interval '30 days', ${XODIM})`;

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band WHERE bolak_id = ${b}`;
    expect(q[0]?.n).toBe(2);
  });
});

// ─── TZ 7.3 · Poyga: ikki usta bir vaqtda ─────────────────────────────────

describe('TZ 7.3 — HAQIQIY POYGA: ikki so\'rov bir vaqtda', () => {
  it("faqat BITTASI o'tadi, ikkinchisi rad etiladi", async () => {
    const b = await bolakYarat('R-POYGA');

    const urinish = (pozitsiya: number) =>
      sql`
        INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                          amal_qiladi, yaratdi_id)
        VALUES (${b}, ${pozitsiya}, ${pozitsiya}, now() + interval '30 days', ${XODIM})`
        .then(() => 'OK' as const)
        .catch(() => 'RAD' as const);

    // Ikkalasi ham bir vaqtda yuboriladi
    const natijalar = await Promise.all([urinish(3001), urinish(3002)]);

    expect(natijalar.filter((n) => n === 'OK')).toHaveLength(1);
    expect(natijalar.filter((n) => n === 'RAD')).toHaveLength(1);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band WHERE bolak_id = ${b} AND holat = 'FAOL'`;
    expect(q[0]?.n).toBe(1);
  });
});

// ─── QISM 1 §6.5 · ombor_harakat o'zgarmas ────────────────────────────────

describe("QISM 1 §6.5 — ombor jurnali o'zgarmas", () => {
  let harakatBolak: number;

  beforeAll(async () => {
    harakatBolak = await bolakYarat('R-HARAKAT');
    await sql`
      INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                 tannarx_summa, izoh, xodim_id)
      VALUES (${FILIAL}, ${harakatBolak}, 'KIRIM', 90, 7020000, 'asl yozuv', ${XODIM})`;
  });

  it('UPDATE rad etiladi', async () => {
    await radEtilsin(
      () => sql`UPDATE ombor_harakat SET izoh = 'soxta' WHERE bolak_id = ${harakatBolak}`,
    );
  });

  it('DELETE rad etiladi', async () => {
    await radEtilsin(() => sql`DELETE FROM ombor_harakat WHERE bolak_id = ${harakatBolak}`);
  });

  it('asl yozuv joyida qoladi', async () => {
    const q = await sql<{ izoh: string }[]>`
      SELECT izoh FROM ombor_harakat WHERE bolak_id = ${harakatBolak}`;
    expect(q[0]?.izoh).toBe('asl yozuv');
  });

  it("bo'sh o'lchovli yozuv rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, tannarx_summa, xodim_id)
        VALUES (${FILIAL}, ${harakatBolak}, 'KIRIM', 100, ${XODIM})`,
    );
  });
});

// ─── TZ 7.9 · Kirim hujjati ───────────────────────────────────────────────

describe('TZ 7.9 va 9.6 — kirim hujjati', () => {
  let yetkazibId: number;

  beforeAll(async () => {
    const y = await sql<{ id: number }[]>`
      INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
      VALUES ('Ombor sinov yetkazuvchisi', ${XODIM}) RETURNING id`;
    const id = y[0]?.id;
    if (id === undefined) throw new Error('yetkazib beruvchi yaratilmadi');
    yetkazibId = id;
  });

  it("TZ 9.6 — dollarli kirimda KURS majburiy, aks holda tannarx qotmaydi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO kirim (raqam, sana, filial_id, yetkazib_beruvchi_id, valyuta, yaratdi_id)
        VALUES (${`K-USD-KURSSIZ-${BELGI}`}, current_date, ${FILIAL}, ${yetkazibId}, 'USD', ${XODIM})`,
    );
  });

  it('kurs bilan saqlanadi', async () => {
    await sql`
      INSERT INTO kirim (raqam, sana, filial_id, yetkazib_beruvchi_id, valyuta,
                         kurs_snapshot, yaratdi_id)
      VALUES (${`K-USD-1-${BELGI}`}, current_date, ${FILIAL}, ${yetkazibId}, 'USD', 12650, ${XODIM})`;
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kirim WHERE raqam = ${`K-USD-1-${BELGI}`}`;
    expect(q[0]?.n).toBe(1);
  });

  it('storno sababsiz bo\'lmaydi (7.12)', async () => {
    await radEtilsin(
      () => sql`UPDATE kirim SET holat = 'STORNO' WHERE raqam = ${`K-USD-1-${BELGI}`}`,
    );
  });

  it("TZ 7.9 — defekt bor bo'lsa qayerga ketishi AYTILISHI shart", async () => {
    const k = await sql<{ id: number }[]>`
      INSERT INTO kirim (raqam, sana, filial_id, yetkazib_beruvchi_id, yaratdi_id)
      VALUES (${`K-DEFEKT-${BELGI}`}, current_date, ${FILIAL}, ${yetkazibId}, ${XODIM}) RETURNING id`;
    const kirimId = k[0]?.id ?? 0;

    await radEtilsin(
      () => sql`
        INSERT INTO kirim_qator (kirim_id, material_id, miqdor_kirim, narx_birlik,
                                 defekt_miqdor, tannarx_birlik, yaratdi_id)
        VALUES (${kirimId}, ${materialId}, 10, 66000, 1, 66000, ${XODIM})`,
    );
  });

  it('defekt turi bilan saqlanadi', async () => {
    const k = await sql<{ id: number }[]>`
      SELECT id FROM kirim WHERE raqam = ${`K-DEFEKT-${BELGI}`}`;
    const kirimId = k[0]?.id ?? 0;

    await sql`
      INSERT INTO kirim_qator (kirim_id, material_id, miqdor_kirim, narx_birlik,
                               defekt_miqdor, defekt_turi, tannarx_birlik, yaratdi_id)
      VALUES (${kirimId}, ${materialId}, 10, 66000, 1, 'HISOBDAN_CHIQADI', 66000, ${XODIM})`;

    const q = await sql<{ tannarx_birlik: string }[]>`
      SELECT tannarx_birlik FROM kirim_qator WHERE kirim_id = ${kirimId}`;
    // P-17 — bo'luvchi to'liq miqdor: 660 000 / 10 = 66 000
    expect(Number(q[0]?.tannarx_birlik)).toBe(66000);
  });

  it("defekt miqdori umumiy miqdordan oshmaydi", async () => {
    const k = await sql<{ id: number }[]>`
      SELECT id FROM kirim WHERE raqam = ${`K-DEFEKT-${BELGI}`}`;
    await radEtilsin(
      () => sql`
        INSERT INTO kirim_qator (kirim_id, material_id, miqdor_kirim, narx_birlik,
                                 defekt_miqdor, defekt_turi, tannarx_birlik, yaratdi_id)
        VALUES (${k[0]?.id ?? 0}, ${materialId}, 5, 1000, 6, 'QAYTARILADI', 1000, ${XODIM})`,
    );
  });
});
