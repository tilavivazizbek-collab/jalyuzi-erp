/**
 * TZ 8.17 · Q-15 · 2.1 · 2.2-invariant · EC-BRK-01…05 · P-25
 *
 * Ishlab chiqarish braki — qayta kesish.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  haqSaqlanishiMumkinmi,
  qaytaKesishHal,
  qaytaKesishSora,
} from '@/lib/amal/qayta-kesish';
import { ishniOl, tugatdim } from '@/lib/amal/ish';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import type { Chegaralar } from '@/lib/domain/kesish';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId: number;
let turId: number;
let slotId: number;

const FILIAL = 1;
const XODIM = 1;
const USTA = 1;

const CHEGARALAR: Chegaralar = { yaroqsizM: 0.3, kamIshlatiladiganM: 0.5 };

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`QK sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`QK sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

let hisoblagich = 0;

async function rulonYarat(eni = 1.8, boyi = 2.0): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-QK-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', ${eni}, ${boyi}, 78000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

async function ishdagiPozitsiya(): Promise<number> {
  hisoblagich += 1;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-QK-${String(Date.now())}-${String(hisoblagich)}`,
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
        eniSm: 120,
        boyiSm: 200,
        soni: 1,
        narxSnapshot: '500000',
        chegirmaSumma: '0',
        xizmatHaqi: '0',
        formulaSnapshot: {},
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
  const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
  await ishniOl(sql, pozitsiyaId, USTA, '45000');
  return pozitsiyaId;
}

// ─── 8.17.2 · So'rov ──────────────────────────────────────────────────────

describe('TZ 8.17.2 — usta so\'rov yuboradi', () => {
  it("so'rov pozitsiyani O'ZGARTIRMAYDI (EC-BRK-01 gacha)", async () => {
    await rulonYarat();
    const pozitsiyaId = await ishdagiPozitsiya();

    const n = await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'OLCHAM_XATO', izoh: '5 sm kalta kesildi', rasmYol: null },
      USTA,
    );

    expect(n.sorovId).toBeGreaterThan(0);
    expect(n.oldingiSoni).toBe(0);

    const p = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.holat).toBe('ISHLAB_CHIQARILMOQDA');
  });

  it("bir vaqtda IKKITA ochiq so'rov bo'lmaydi", async () => {
    await rulonYarat();
    const pozitsiyaId = await ishdagiPozitsiya();

    await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'TIKUV_BUZILDI', izoh: null, rasmYol: null },
      USTA,
    );

    await expect(
      qaytaKesishSora(
        sql,
        { pozitsiyaId, sabab: 'BOSHQA', izoh: null, rasmYol: null },
        USTA,
      ),
    ).rejects.toThrow();
  });

  it("ish boshlanmagan pozitsiyaga so'rov yuborib bo'lmaydi", async () => {
    await rulonYarat();

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-QK-BOSH-${String(Date.now())}`,
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
            eniSm: 120,
            boyiSm: 200,
            soni: 1,
            narxSnapshot: '500000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: {},
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
      },
      XODIM,
    );

    await expect(
      qaytaKesishSora(
        sql,
        {
          pozitsiyaId: n.pozitsiyalar[0]?.pozitsiyaId ?? 0,
          sabab: 'BOSHQA',
          izoh: null,
          rasmYol: null,
        },
        USTA,
      ),
    ).rejects.toThrow();
  });
});

// ─── EC-BRK-01 · Rad etish ────────────────────────────────────────────────

describe('EC-BRK-01 — admin rad etsa pozitsiya o\'z holida qoladi', () => {
  it("holat o'zgarmaydi, qayta_kesildi_soni oshmaydi", async () => {
    await rulonYarat();
    const pozitsiyaId = await ishdagiPozitsiya();

    const s = await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'BOSHQA', izoh: null, rasmYol: null },
      USTA,
    );

    const n = await qaytaKesishHal(
      sql,
      {
        sorovId: s.sorovId,
        tasdiqlansinmi: false,
        ushlanmaSumma: '0',
        haqSaqlandi: false,
        izoh: 'Ustaning o\'zi tuzata oladi',
      },
      XODIM,
    );

    expect(n.holat).toBe('RAD_ETILDI');
    expect(n.qaytaKesildiSoni).toBe(0);

    const p = await sql<{ holat: string; qayta_kesildi_soni: number }[]>`
      SELECT holat, qayta_kesildi_soni FROM buyurtma_pozitsiya
      WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.holat).toBe('ISHLAB_CHIQARILMOQDA');
    expect(p[0]?.qayta_kesildi_soni).toBe(0);
  });

  it("hal qilingan so'rov qayta hal qilinmaydi", async () => {
    await rulonYarat();
    const pozitsiyaId = await ishdagiPozitsiya();

    const s = await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'BOSHQA', izoh: null, rasmYol: null },
      USTA,
    );
    const k = {
      sorovId: s.sorovId,
      tasdiqlansinmi: false,
      ushlanmaSumma: '0',
      haqSaqlandi: false,
      izoh: null,
    };

    await qaytaKesishHal(sql, k, XODIM);
    await expect(qaytaKesishHal(sql, k, XODIM)).rejects.toThrow();
  });
});

// ─── 8.17.4 · Tasdiqlash ──────────────────────────────────────────────────

describe('TZ 8.17.4 — tasdiqlansa material IKKINCHI MARTA yechiladi', () => {
  it("birinchi bo'lak CHIQINDIGA, yangisi band qilinadi", async () => {
    // Ikkita rulon: biri braklanadi, ikkinchisi yangi band bo'ladi
    await rulonYarat(1.8, 2.0);
    await rulonYarat(1.8, 2.0);
    const pozitsiyaId = await ishdagiPozitsiya();

    const s = await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'MATO_YIRTILDI', izoh: null, rasmYol: null },
      USTA,
    );

    const n = await qaytaKesishHal(
      sql,
      {
        sorovId: s.sorovId,
        tasdiqlansinmi: true,
        ushlanmaSumma: '0',
        haqSaqlandi: true,
        izoh: 'Material defekti (8.17.5.1)',
      },
      XODIM,
    );

    expect(n.holat).toBe('TASDIQLANDI');
    expect(n.pozitsiyaHolati).toBe('ISHLAB_CHIQARILMOQDA');
    expect(n.materialTopilmadi).toBe(false);
    expect(n.chiqindiKvM).toBeCloseTo(3.6, 6);
    expect(n.qaytaKesildiSoni).toBe(1);

    // Birinchi bo'lak BRAK bo'ldi va jurnalga CHIQINDI tushdi
    const j = await sql<{ turi: string; miqdor_kv_m: string }[]>`
      SELECT turi, miqdor_kv_m FROM ombor_harakat
      WHERE manba_turi = 'qayta_kesish' AND manba_id = ${s.sorovId}`;
    expect(j).toHaveLength(1);
    expect(j[0]?.turi).toBe('CHIQINDI');
    expect(Number(j[0]?.miqdor_kv_m)).toBeCloseTo(-3.6, 4);

    // Yangi band qo'yildi
    const bd = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    expect(bd[0]?.n).toBe(1);
  });

  it('EC-BRK-02 — yangi bo\'lak yo\'q bo\'lsa MATERIALGA_KUTMOQDA', async () => {
    // Faqat BITTA rulon — u braklanadi, boshqasi qolmaydi
    const yolgiz = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`QK yolg'iz mato ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M',
              ${XODIM})
      RETURNING id`;
    const yolgizId = yolgiz[0]?.id ?? 0;

    hisoblagich += 1;
    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${yolgizId}, ${FILIAL},
              ${`R-QK-Y-${String(Date.now())}-${String(hisoblagich)}`},
              'RULON', 1.8, 2.0, 78000, ${XODIM})`;

    const b = await buyurtmaYarat(
      sql,
      {
        raqam: `B-QK-Y-${String(Date.now())}`,
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
            eniSm: 120,
            boyiSm: 200,
            soni: 1,
            narxSnapshot: '500000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: {},
            slotlar: [
              {
                slotId,
                materialId: yolgizId,
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
      },
      XODIM,
    );

    const pozitsiyaId = b.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const s = await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'OLCHAM_XATO', izoh: null, rasmYol: null },
      USTA,
    );

    const n = await qaytaKesishHal(
      sql,
      {
        sorovId: s.sorovId,
        tasdiqlansinmi: true,
        ushlanmaSumma: '0',
        haqSaqlandi: false,
        izoh: null,
      },
      XODIM,
    );

    expect(n.materialTopilmadi).toBe(true);
    expect(n.pozitsiyaHolati).toBe('MATERIALGA_KUTMOQDA');
  });

  it('Q-15 — ushlanma va haq qarori saqlanadi (10.13 · 8.17.5.1)', async () => {
    await rulonYarat(1.8, 2.0);
    await rulonYarat(1.8, 2.0);
    const pozitsiyaId = await ishdagiPozitsiya();

    const s = await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'TIKUV_BUZILDI', izoh: null, rasmYol: null },
      USTA,
    );

    await qaytaKesishHal(
      sql,
      {
        sorovId: s.sorovId,
        tasdiqlansinmi: true,
        ushlanmaSumma: '50000',
        haqSaqlandi: false,
        izoh: 'Ustaning aybi',
      },
      XODIM,
    );

    const q = await sql<{ ushlanma_summa: string; haq_saqlandi: boolean }[]>`
      SELECT ushlanma_summa, haq_saqlandi FROM qayta_kesish WHERE id = ${s.sorovId}`;
    expect(Number(q[0]?.ushlanma_summa)).toBe(50_000);
    expect(q[0]?.haq_saqlandi).toBe(false);
  });

  it('EC-BRK-03 — uchinchi marta ham ruxsat, son oshib boradi (8.17.8)', async () => {
    for (let i = 0; i < 4; i += 1) await rulonYarat(1.8, 2.0);
    const pozitsiyaId = await ishdagiPozitsiya();

    for (let i = 1; i <= 2; i += 1) {
      const s = await qaytaKesishSora(
        sql,
        { pozitsiyaId, sabab: 'BOSHQA', izoh: null, rasmYol: null },
        USTA,
      );
      const n = await qaytaKesishHal(
        sql,
        {
          sorovId: s.sorovId,
          tasdiqlansinmi: true,
          ushlanmaSumma: '0',
          haqSaqlandi: false,
          izoh: null,
        },
        XODIM,
      );
      expect(n.qaytaKesildiSoni).toBe(i);
    }
  });
});

// ─── P-25 · EC-BRK-05 · TAYYOR dan qaytish ────────────────────────────────

describe('P-25 · EC-BRK-05 — «Tugatdim» bosilgach brak topilsa', () => {
  it("TAYYOR pozitsiya ISHLAB_CHIQARILMOQDA ga qaytadi", async () => {
    await rulonYarat(1.8, 2.0);
    await rulonYarat(1.8, 2.0);
    const pozitsiyaId = await ishdagiPozitsiya();

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        manba: 'RULON',
        qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
        ogohTasdiqlandi: false,
        izoh: null,
      },
      CHEGARALAR,
      USTA,
    );

    const s = await qaytaKesishSora(
      sql,
      { pozitsiyaId, sabab: 'TIKUV_BUZILDI', izoh: null, rasmYol: null },
      USTA,
    );

    const n = await qaytaKesishHal(
      sql,
      {
        sorovId: s.sorovId,
        tasdiqlansinmi: true,
        ushlanmaSumma: '0',
        haqSaqlandi: false,
        izoh: null,
      },
      XODIM,
    );

    expect(n.pozitsiyaHolati).toBe('ISHLAB_CHIQARILMOQDA');
    // Material allaqachon yechilgan — chiqindi qo'shilmaydi
    expect(n.chiqindiKvM).toBe(0);

    const p = await sql<{ holat: string; tugatildi: Date | null }[]>`
      SELECT holat, tugatildi FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.holat).toBe('ISHLAB_CHIQARILMOQDA');
    expect(p[0]?.tugatildi).toBeNull();
  });
});

// ─── 8.17.5.1 · Haq istisnosi ─────────────────────────────────────────────

describe('TZ 8.17.5.1 — qaysi sabab istisnoga tushishi mumkin', () => {
  it('material defekti sabablari', () => {
    expect(haqSaqlanishiMumkinmi('MATO_YIRTILDI')).toBe(true);
    expect(haqSaqlanishiMumkinmi('MEXANIZM_NOSOZ')).toBe(true);
  });

  it("ustaning ishi sabablari — haq bekor qilinadi (Q-15)", () => {
    expect(haqSaqlanishiMumkinmi('OLCHAM_XATO')).toBe(false);
    expect(haqSaqlanishiMumkinmi('TIKUV_BUZILDI')).toBe(false);
    expect(haqSaqlanishiMumkinmi('BOSHQA')).toBe(false);
  });
});
