/**
 * QISM 3 §2 · TZ 4, 5, 6, 9, 20.9 · Q-23, Q-26, Q-28
 *
 * Spravochnik jadvallarining baza darajasidagi to'siqlari.
 * Har test qoidani ATAYLAB buzishga urinadi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let guruhId: number;

beforeAll(async () => {
  sql = sinovUlanishi();
  const q = await sql<{ id: number }[]>`
    INSERT INTO almashtirish_guruh (nom, yaratdi_id) VALUES ('Sinov guruhi', 1)
    RETURNING id`;
  const topilgan = q[0]?.id;
  if (topilgan === undefined) throw new Error("guruh yaratilmadi");
  guruhId = topilgan;
}, 60_000);

afterAll(async () => {
  await sql.end();
});

async function radEtilsin(ish: () => Promise<unknown>): Promise<void> {
  await expect(ish()).rejects.toThrow();
}

// ─── TZ 5 · material ──────────────────────────────────────────────────────

describe('TZ 5.2 — hisob turi to\'rt qiymatdan biri', () => {
  it("noma'lum hisob turi rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
        VALUES ('Yomon', 'BOSHQA', 'rulon', 'KV_M', 1)`,
    );
  });

  it("noma'lum sarflash birligi rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
        VALUES ('Yomon', 'RULON', 'rulon', 'METR', 1)`,
    );
  });

  it("to'rt hisob turi ham qabul qilinadi", async () => {
    for (const turi of ['RULON', 'CHIZIQLI', 'DONA', 'KV_M'] as const) {
      await sql`
        INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
        VALUES (${`Sinov ${turi}`}, ${turi}, 'rulon', 'KV_M', 1)`;
    }
    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM material WHERE nom LIKE 'Sinov %'`;
    expect(n[0]?.n).toBe(4);
  });
});

describe('TZ 5.8 — bloklaydigan tekshiruvlar', () => {
  it('koeffitsient 0 rad etiladi (Q-01 — u bo\'luvchi)', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                              koeffitsient, yaratdi_id)
        VALUES ('Nol koef', 'CHIZIQLI', 'shtanga', 'SM', 0, 1)`,
    );
  });

  it('manfiy koeffitsient rad etiladi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                              koeffitsient, yaratdi_id)
        VALUES ('Manfiy koef', 'CHIZIQLI', 'shtanga', 'SM', -3, 1)`,
    );
  });

  it('manfiy sotuv narxi rad etiladi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                              sotuv_narx, yaratdi_id)
        VALUES ('Manfiy narx', 'RULON', 'rulon', 'KV_M', -1000, 1)`,
    );
  });
});

// ─── TZ 20.9 · Q-28 · filial narxi ────────────────────────────────────────

describe('Q-28 — filial narxi istisno sifatida', () => {
  let materialId: number;

  beforeAll(async () => {
    const q = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                            sotuv_narx, almashtirish_guruh_id, yaratdi_id)
      VALUES ('Narx sinovi', 'RULON', 'rulon', 'KV_M', 120000, ${guruhId}, 1)
      RETURNING id`;
    const topilgan = q[0]?.id;
    if (topilgan === undefined) throw new Error('material yaratilmadi');
    materialId = topilgan;
  });

  it('bitta filialga bitta narx — ikkinchisi rad etiladi', async () => {
    await sql`
      INSERT INTO material_filial_narx (material_id, filial_id, sotuv_narx, yaratdi_id)
      VALUES (${materialId}, 1, 114000, 1)`;
    await radEtilsin(
      () => sql`
        INSERT INTO material_filial_narx (material_id, filial_id, sotuv_narx, yaratdi_id)
        VALUES (${materialId}, 1, 110000, 1)`,
    );
  });

  it('manfiy filial narxi rad etiladi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO material_filial_narx (material_id, filial_id, sotuv_narx, yaratdi_id)
        VALUES (${materialId}, 1, -5, 1)`,
    );
  });
});

// ─── TZ 4 · mahsulot turi ─────────────────────────────────────────────────

describe('TZ 4.3 — parametr kodi formulaga mos bo\'lishi shart', () => {
  let turId: number;

  beforeAll(async () => {
    const q = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id) VALUES ('Sinov turi', 1) RETURNING id`;
    const topilgan = q[0]?.id;
    if (topilgan === undefined) throw new Error('tur yaratilmadi');
    turId = topilgan;
  });

  it('katta harfli kod qabul qilinadi', async () => {
    await sql`
      INSERT INTO mahsulot_parametr (mahsulot_tur_id, kod, nom, standart_qiymat, yaratdi_id)
      VALUES (${turId}, 'CHET', 'Chet kengligi', 30, 1)`;
    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mahsulot_parametr WHERE mahsulot_tur_id = ${turId}`;
    expect(n[0]?.n).toBe(1);
  });

  it("kichik harfli kod rad etiladi — formula tahlilchisi uni tanimaydi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mahsulot_parametr (mahsulot_tur_id, kod, nom, yaratdi_id)
        VALUES (${turId}, 'chet', 'Kichik', 1)`,
    );
  });

  it('bir turda bir kod ikki marta bo\'lmaydi', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mahsulot_parametr (mahsulot_tur_id, kod, nom, yaratdi_id)
        VALUES (${turId}, 'CHET', 'Takror', 1)`,
    );
  });

  it('manfiy xizmat haqi rad etiladi (4.7)', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mahsulot_tur (nom, xizmat_haqi, yaratdi_id)
        VALUES ('Manfiy haq', -100, 1)`,
    );
  });
});

// ─── TZ 6 · mijoz · Q-23 soliq maydonlari ─────────────────────────────────

describe('TZ 6 va Q-23 — mijoz', () => {
  it("oddiy mijoz eng kam ma'lumot bilan saqlanadi", async () => {
    await sql`
      INSERT INTO mijoz (ism, telefon, yaratdi_id)
      VALUES ('Sinov mijoz', '998900009999', 1)
      ON CONFLICT (telefon) DO NOTHING`;
    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mijoz WHERE telefon = '998900009999'`;
    expect(n[0]?.n).toBe(1);
  });

  it('bir telefon ikki mijozda bo\'lmaydi (6.5)', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mijoz (ism, telefon, yaratdi_id)
        VALUES ('Dublikat', '998900009999', 1)`,
    );
  });

  it("yuridik shaxsda tashkilot, INN va manzil MAJBURIY (QISM 3 §2.8)", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mijoz (ism, shaxs_turi, yaratdi_id)
        VALUES ('Yuridik yarim', 'YURIDIK', 1)`,
    );
  });

  it("uchalasi to'ldirilsa saqlanadi", async () => {
    await sql`
      INSERT INTO mijoz (ism, shaxs_turi, tashkilot_nomi, inn, yuridik_manzil, yaratdi_id)
      VALUES ('Yuridik to''liq', 'YURIDIK', 'MChJ Sinov', '123456789', 'Toshkent', 1)`;
    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mijoz WHERE inn = '123456789'`;
    expect(n[0]?.n).toBe(1);
  });

  it("offset turi bor, qiymati yo'q — rad etiladi (6.3)", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mijoz (ism, offset_turi, yaratdi_id) VALUES ('Yarim offset', 'FOIZ', 1)`,
    );
  });

  it("noma'lum offset turi rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mijoz (ism, offset_turi, offset_qiymat, yaratdi_id)
        VALUES ('Yomon offset', 'EVRO', -3, 1)`,
    );
  });

  it('uch offset turi ham qabul qilinadi — FOIZ, SOM, USD', async () => {
    for (const turi of ['FOIZ', 'SOM', 'USD'] as const) {
      await sql`
        INSERT INTO mijoz (ism, offset_turi, offset_qiymat, yaratdi_id)
        VALUES (${`Offset ${turi}`}, ${turi}, -3, 1)`;
    }
    const n = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM mijoz WHERE ism LIKE 'Offset %'`;
    expect(n[0]?.n).toBe(3);
  });

  it('manfiy qarz limiti rad etiladi (6.4)', async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO mijoz (ism, qarz_limiti, yaratdi_id) VALUES ('Manfiy limit', -100, 1)`,
    );
  });
});

// ─── TZ 9 · yetkazib beruvchi ─────────────────────────────────────────────

describe('TZ 9 — yetkazib beruvchi', () => {
  it("noma'lum valyuta rad etiladi", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO yetkazib_beruvchi (nom, valyuta, yaratdi_id)
        VALUES ('Yomon valyuta', 'EUR', 1)`,
    );
  });

  it("manfiy to'lov muddati rad etiladi (9.3)", async () => {
    await radEtilsin(
      () => sql`
        INSERT INTO yetkazib_beruvchi (nom, tolov_muddati_kun, yaratdi_id)
        VALUES ('Manfiy muddat', -5, 1)`,
    );
  });
});

// ─── Q-26 · nima umumiy ───────────────────────────────────────────────────

describe('Q-26 — material, mijoz va yetkazib beruvchi UMUMIY', () => {
  it("bu jadvallarda filial_id yo'q — «bir filialda qarzdor, boshqasida toza» bo'lmaydi", async () => {
    const q = await sql<{ table_name: string }[]>`
      SELECT DISTINCT table_name FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'filial_id'
        AND table_name IN ('material', 'mijoz', 'yetkazib_beruvchi',
                           'mahsulot_tur', 'almashtirish_guruh')`;
    expect(q).toEqual([]);
  });

  it('narx istisnosi esa filialga bog\'langan (Q-28)', async () => {
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'material_filial_narx'
        AND column_name = 'filial_id'`;
    expect(q[0]?.n).toBe(1);
  });
});
