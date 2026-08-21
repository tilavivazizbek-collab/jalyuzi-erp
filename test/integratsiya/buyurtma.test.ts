/**
 * TZ 3.6 · 3.9 · 3.10 · 3.14 · 7.3 · 8.4 · 8.12 · 20.4.2 · 20.5
 * Q-03 · Q-12 · 2.1 · 2.3-invariant
 *
 * Buyurtma yaratish tranzaksiyasi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buyurtmaYarat,
  pozitsiyaniTasdiqla,
  type BuyurtmaKirimi,
  type PozitsiyaKirimi,
} from '@/lib/amal/buyurtma';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId: number;
let aksessuarId: number;
let turId: number;
let slotId: number;
let ikkinchiSlotId: number;

const FILIAL = 1;
const XODIM = 1;

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Buyurtma sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const a = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, yaratdi_id)
    VALUES (${`Buyurtma sinov mexanizmi ${belgi}`}, 'DONA', 'quti', 'DONA', 50, ${XODIM})
    RETURNING id`;
  aksessuarId = a[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Buyurtma sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Old mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  const s2 = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Orqa mato', 2, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  ikkinchiSlotId = s2[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

let hisoblagich = 0;

async function rulonYarat(eni = 3.0, boyi = 30.0, material = matoId): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${material}, ${FILIAL},
            ${`R-BUY-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', ${eni}, ${boyi}, 78000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

const raqam = (): string => {
  hisoblagich += 1;
  return `B-SINOV-${String(Date.now())}-${String(hisoblagich)}`;
};

const pozitsiya = (o: Partial<PozitsiyaKirimi> = {}): PozitsiyaKirimi => ({
  mahsulotTurId: turId,
  eniSm: 210,
  boyiSm: 140,
  soni: 1,
  narxSnapshot: '678400',
  chegirmaSumma: '0',
  xizmatHaqi: '0',
  formulaSnapshot: { slot: "ENI * BO'YI" },
  slotlar: [
    {
      slotId,
      materialId: matoId,
      hisoblanganMiqdor: '2.9400',
      tuzatilganMiqdor: null,
      birlik: 'KV_M',
      narxSnapshot: '120000',
      kerak: { eniM: 2.1, boyiM: 1.4 },
    },
  ],
  aksessuarlar: [],
  ...o,
});

const asos = (o: Partial<BuyurtmaKirimi> = {}): BuyurtmaKirimi => ({
  raqam: raqam(),
  mijozId: null,
  sotganFilialId: FILIAL,
  ishlabChiqaruvchiFilialId: FILIAL,
  manba: 'SAYT',
  valyuta: 'SOM',
  kursSnapshot: null,
  tayyorlikSana: null,
  qarzgaKetadimi: false,
  pozitsiyalar: [pozitsiya()],
  ...o,
});

// ─── Q-12 · TZ 8.4 ────────────────────────────────────────────────────────

describe('Q-12 — sayt buyurtmasi darhol tasdiqlanadi va BAND qilinadi', () => {
  it("pozitsiya TASDIQLANGAN, bo'lak BAND ga o'tadi (7.3)", async () => {
    const bolakId = await rulonYarat();

    const n = await buyurtmaYarat(sql, asos(), XODIM);

    expect(n.materialYetishmadi).toBe(false);
    expect(n.pozitsiyalar[0]?.holat).toBe('TASDIQLANGAN');

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BAND');

    const band = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}
        AND holat = 'FAOL'`;
    expect(band[0]?.n).toBe(1);
  });

  it('bot buyurtmasi TASDIQ_KUTMOQDA — material BAND QILINMAYDI', async () => {
    const bolakId = await rulonYarat();

    const n = await buyurtmaYarat(sql, asos({ manba: 'BOT' }), XODIM);
    expect(n.pozitsiyalar[0]?.holat).toBe('TASDIQ_KUTMOQDA');

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
  });
});

// ─── TZ 3.6 · Ikki miqdor ─────────────────────────────────────────────────

describe('TZ 3.6 — ombordan HISOBLANGAN yechiladi, tuzatilgani narxga tegadi', () => {
  it('ikkala son ham saqlanadi va aralashmaydi', async () => {
    await rulonYarat();

    const n = await buyurtmaYarat(
      sql,
      asos({
        pozitsiyalar: [
          pozitsiya({
            slotlar: [
              {
                slotId,
                materialId: matoId,
                hisoblanganMiqdor: '0.6600',
                tuzatilganMiqdor: '1.0000',
                birlik: 'KV_M',
                narxSnapshot: '85000',
                kerak: { eniM: 0.3, boyiM: 2.2 },
              },
            ],
          }),
        ],
      }),
      XODIM,
    );

    const q = await sql<
      { hisoblangan_miqdor: string; tuzatilgan_miqdor: string }[]
    >`
      SELECT hisoblangan_miqdor, tuzatilgan_miqdor FROM pozitsiya_material
      WHERE buyurtma_pozitsiya_id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}`;

    expect(Number(q[0]?.hisoblangan_miqdor)).toBe(0.66);
    expect(Number(q[0]?.tuzatilgan_miqdor)).toBe(1.0);
  });
});

// ─── Q-03 · TZ 8.12 · Material yetishmasa ─────────────────────────────────

describe('Q-03 — material yetishmasligi BUYURTMA BERILAYOTGANDA aytiladi', () => {
  it("mos bo'lak yo'q — pozitsiya MATERIALGA_KUTMOQDA ga tushadi", async () => {
    const yolgiz = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`Bo'sh mato ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
      RETURNING id`;

    const n = await buyurtmaYarat(
      sql,
      asos({
        pozitsiyalar: [
          pozitsiya({
            slotlar: [
              {
                slotId,
                materialId: yolgiz[0]?.id ?? 0,
                hisoblanganMiqdor: '2.9400',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '120000',
                kerak: { eniM: 2.1, boyiM: 1.4 },
              },
            ],
          }),
        ],
      }),
      XODIM,
    );

    expect(n.materialYetishmadi).toBe(true);
    expect(n.pozitsiyalar[0]?.holat).toBe('MATERIALGA_KUTMOQDA');

    const q = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}`;
    expect(q[0]?.holat).toBe('MATERIALGA_KUTMOQDA');
  });

  it("buyurtma baribir SAQLANADI — mijoz ketmaydi", async () => {
    const yolgiz = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`Bo'sh mato 2 ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
      RETURNING id`;

    const n = await buyurtmaYarat(
      sql,
      asos({
        pozitsiyalar: [
          pozitsiya({
            slotlar: [
              {
                slotId,
                materialId: yolgiz[0]?.id ?? 0,
                hisoblanganMiqdor: '2.9400',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '120000',
                kerak: { eniM: 2.1, boyiM: 1.4 },
              },
            ],
          }),
        ],
      }),
      XODIM,
    );

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma WHERE id = ${n.buyurtmaId}`;
    expect(q[0]?.n).toBe(1);
  });
});

// ─── QISM 3 §3.2.1 · Ko'p slot ────────────────────────────────────────────

describe('QISM 3 §3.2.1 — har slot uchun ALOHIDA band', () => {
  it('ikki slot — ikki band', async () => {
    await rulonYarat(3.0, 30.0);
    await rulonYarat(3.0, 30.0);

    const n = await buyurtmaYarat(
      sql,
      asos({
        pozitsiyalar: [
          pozitsiya({
            slotlar: [
              {
                slotId,
                materialId: matoId,
                hisoblanganMiqdor: '2.9400',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '120000',
                kerak: { eniM: 2.1, boyiM: 1.4 },
              },
              {
                slotId: ikkinchiSlotId,
                materialId: matoId,
                hisoblanganMiqdor: '2.9400',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '90000',
                kerak: { eniM: 2.1, boyiM: 1.4 },
              },
            ],
          }),
        ],
      }),
      XODIM,
    );

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}
        AND holat = 'FAOL'`;
    expect(q[0]?.n).toBe(2);
  });

  it("bitta slot topilmasa IKKALASI ham band qilinmaydi (yarim band yo'q)", async () => {
    await rulonYarat(3.0, 30.0);

    const yolgiz = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`Yarim band matosi ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M',
              ${XODIM})
      RETURNING id`;

    const n = await buyurtmaYarat(
      sql,
      asos({
        pozitsiyalar: [
          pozitsiya({
            slotlar: [
              {
                slotId,
                materialId: matoId,
                hisoblanganMiqdor: '2.9400',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '120000',
                kerak: { eniM: 2.1, boyiM: 1.4 },
              },
              {
                slotId: ikkinchiSlotId,
                materialId: yolgiz[0]?.id ?? 0,
                hisoblanganMiqdor: '2.9400',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '90000',
                kerak: { eniM: 2.1, boyiM: 1.4 },
              },
            ],
          }),
        ],
      }),
      XODIM,
    );

    expect(n.pozitsiyalar[0]?.holat).toBe('MATERIALGA_KUTMOQDA');

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}`;
    expect(q[0]?.n).toBe(0);
  });
});

// ─── TZ 20.5 · Filiallararo ───────────────────────────────────────────────

describe('TZ 20.5 — tikuvchi filial boshqa bo\'lsa', () => {
  it('pozitsiya FILIALGA_YUBORILDI bo\'lib tushadi', async () => {
    const ikkinchi = await sql<{ id: number }[]>`
      INSERT INTO filial (nom, sotadi, ishlab_chiqaradi, bosh, yaratdi_id)
      VALUES (${`Sinov filial ${String(Date.now())}`}, true, true, false, ${XODIM})
      RETURNING id`;
    const ikkinchiId = ikkinchi[0]?.id ?? 0;

    await rulonYarat(3.0, 30.0);

    const n = await buyurtmaYarat(
      sql,
      asos({ ishlabChiqaruvchiFilialId: ikkinchiId }),
      XODIM,
    );

    // 20.4.2 — material IKKINCHI filialda qidiriladi, u yerda bo'lak yo'q
    expect(n.pozitsiyalar[0]?.holat).toBe('MATERIALGA_KUTMOQDA');

    const q = await sql<{ ishlab_chiqaruvchi_filial_id: number }[]>`
      SELECT ishlab_chiqaruvchi_filial_id FROM buyurtma WHERE id = ${n.buyurtmaId}`;
    expect(q[0]?.ishlab_chiqaruvchi_filial_id).toBe(ikkinchiId);
  });
});

// ─── 2.1-invariant · Rad etilgan buyurtma ─────────────────────────────────

describe('2.1-invariant — rad etilgan buyurtma YOZILMAYDI', () => {
  it("bo'sh savat rad etiladi", async () => {
    await expect(
      buyurtmaYarat(sql, asos({ pozitsiyalar: [] }), XODIM),
    ).rejects.toThrow();
  });

  it('TZ 3.10 — qarzga sotishda mijoz MAJBURIY', async () => {
    await expect(
      buyurtmaYarat(sql, asos({ qarzgaKetadimi: true, mijozId: null }), XODIM),
    ).rejects.toThrow();
  });

  it('AUDIT B-04 — dollarli buyurtmada kurs majburiy', async () => {
    await expect(
      buyurtmaYarat(sql, asos({ valyuta: 'USD', kursSnapshot: null }), XODIM),
    ).rejects.toThrow();
  });

  it("takroriy raqam rad etiladi va hech narsa yozilmaydi", async () => {
    await rulonYarat();
    const r = raqam();

    await buyurtmaYarat(sql, asos({ raqam: r }), XODIM);
    await expect(buyurtmaYarat(sql, asos({ raqam: r }), XODIM)).rejects.toThrow();

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma WHERE raqam = ${r}`;
    expect(q[0]?.n).toBe(1);
  });
});

// ─── TZ 3.7 · Aksessuar ───────────────────────────────────────────────────

describe('TZ 3.7 — aksessuar qo\'lda kiritilgani belgilanadi', () => {
  it('bayroq saqlanadi — formula uni ustidan yozmasin', async () => {
    await rulonYarat();

    const n = await buyurtmaYarat(
      sql,
      asos({
        pozitsiyalar: [
          pozitsiya({
            aksessuarlar: [
              {
                materialId: aksessuarId,
                soni: '2',
                birlik: 'DONA',
                narxSnapshot: '5000',
                qoldaKiritildi: true,
              },
            ],
          }),
        ],
      }),
      XODIM,
    );

    const q = await sql<{ qolda_kiritildi: boolean; soni: string }[]>`
      SELECT qolda_kiritildi, soni FROM pozitsiya_aksessuar
      WHERE buyurtma_pozitsiya_id = ${n.pozitsiyalar[0]?.pozitsiyaId ?? 0}`;
    expect(q[0]?.qolda_kiritildi).toBe(true);
    expect(Number(q[0]?.soni)).toBe(2);
  });
});

// ─── TZ 8.4 · Tasdiqlash ──────────────────────────────────────────────────

describe('TZ 8.4 — botdan kelgan pozitsiyani sotuvchi tasdiqlaydi', () => {
  it('tasdiqlangach material BAND qilinadi (7.3)', async () => {
    await rulonYarat();
    const n = await buyurtmaYarat(sql, asos({ manba: 'BOT' }), XODIM);
    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

    const t = await pozitsiyaniTasdiqla(sql, pozitsiyaId, XODIM);
    expect(t.holat).toBe('TASDIQLANGAN');

    /**
     * ⚠️ QAYSI bo'lak band qilingani tekshirilmaydi — TZ 7.6 «eng kam
     *    chiqindi» qoidasi bo'yicha tizim shu yurishdagi boshqa bo'lakni
     *    tanlashi mumkin. Muhimi: pozitsiyada FAOL band bor va o'sha
     *    bo'lak omborda BAND holatida turibdi.
     */
    const b = await sql<{ holat: string }[]>`
      SELECT bo.holat FROM band bd
      JOIN bolak bo ON bo.id = bd.bolak_id
      WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId} AND bd.holat = 'FAOL'`;
    expect(b).toHaveLength(1);
    expect(b[0]?.holat).toBe('BAND');
  });

  it('ikki marta tasdiqlab bo\'lmaydi (8.3 o\'tishlari)', async () => {
    await rulonYarat();
    const n = await buyurtmaYarat(sql, asos({ manba: 'BOT' }), XODIM);
    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

    await pozitsiyaniTasdiqla(sql, pozitsiyaId, XODIM);
    await expect(pozitsiyaniTasdiqla(sql, pozitsiyaId, XODIM)).rejects.toThrow();
  });

  it('TZ 2.4 — tasdiqlash audit jurnaliga tushadi', async () => {
    await rulonYarat();
    const n = await buyurtmaYarat(sql, asos({ manba: 'BOT' }), XODIM);
    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;

    await pozitsiyaniTasdiqla(sql, pozitsiyaId, XODIM);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'buyurtma_pozitsiya' AND obyekt_id = ${pozitsiyaId}
        AND amal = 'TASDIQLASH'`;
    expect(q[0]?.n).toBe(1);
  });
});

// ─── TZ 2.4 · Audit ───────────────────────────────────────────────────────

describe('TZ 2.4 — buyurtma audit jurnaliga tushadi', () => {
  it('raqam, pozitsiya soni va tikuvchi filial yoziladi', async () => {
    await rulonYarat();
    const n = await buyurtmaYarat(sql, asos(), XODIM);

    const q = await sql<{ yangi_qiymat: unknown }[]>`
      SELECT yangi_qiymat FROM audit_jurnal
      WHERE obyekt_turi = 'buyurtma' AND obyekt_id = ${n.buyurtmaId}`;
    expect(q).toHaveLength(1);
    expect(JSON.stringify(q[0]?.yangi_qiymat)).toContain(n.raqam);
  });
});
