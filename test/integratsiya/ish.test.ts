/**
 * TZ 7.6 · 8.5 · 8.6 · 8.8 · 10.10 · 2.1 · 2.2 · 2.3-invariant · K-06
 *
 * Ustaning ish oqimi va kesim.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ishniOl,
  ishniQaytaribOl,
  pozitsiyaniBekorQil,
  tugatdim,
  type KesimKirimi,
} from '@/lib/amal/ish';
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

/**
 * Pozitsiyaning HAR FAOL BANDI uchun kesim qatorini yasaydi.
 *
 * ⚠️ «Tugatdim» endi har mato uchun alohida qoldiq talab qiladi
 *    (2026-09-03): ilgari faqat birinchi bo'lak yechilardi.
 */
const kesimlar = async (
  pozitsiyaId: number,
  qoldiq: { eniM: number; boyiM: number; saqlansinmi: boolean },
  manba: 'OSTATKA' | 'RULON' = 'OSTATKA',
): Promise<KesimKirimi[]> => {
  const b = await sql<{ id: number }[]>`
    SELECT id FROM band
    WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'
    ORDER BY id`;
  /**
   * ⚠️ 7.4 dan keyin qoldiq IKKITA. Bu sinovlar ustaning TUZATGAN
   *    o'lchamini yuboradi — ya'ni tizim taklifini bilib turib bekor
   *    qiladi. Shu sababli `manbaQoldiq` bo'sh: manbadan hech narsa
   *    qolmagan, faqat yon kesma bor.
   */
  return b.map((x) => ({
    bandId: x.id,
    manba,
    qoldiqlar: {
      manbaQoldiq: null,
      kesma: qoldiq.eniM > 0 && qoldiq.boyiM > 0 ? { eniM: qoldiq.eniM, boyiM: qoldiq.boyiM } : null,
      kesmaSaqlansinmi: qoldiq.saqlansinmi,
    },
  }));
};


beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
    VALUES (${`Ish sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M',
            -- Chegaralar endi MATERIALDAN o'qiladi (5.5), parametr emas
            ${CHEGARALAR.yaroqsizM}, ${CHEGARALAR.kamIshlatiladiganM}, ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Ish sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

let hisoblagich = 0;

async function rulonYarat(eni = 1.8, boyi = 2.0): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-ISH-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', ${eni}, ${boyi}, 78000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

/** Band qilingan pozitsiya yaratadi — kesim testlari shundan boshlanadi. */
async function pozitsiyaTayyorla(
  eniM = 1.2,
  boyiM = 2.0,
  /** Aksessuar qo'shilsa — ombordan yechilishini tekshirish uchun */
  aksessuar: { materialId: number; soni: number } | null = null,
): Promise<{ pozitsiyaId: number; buyurtmaId: number }> {
  hisoblagich += 1;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-ISH-${String(Date.now())}-${String(hisoblagich)}`,
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
        aksessuarlar:
          aksessuar === null
            ? []
            : [
                {
                  materialId: aksessuar.materialId,
                  soni: String(aksessuar.soni),
                  birlik: 'DONA',
                  narxSnapshot: '30000',
                  qoldaKiritildi: false,
                },
              ],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  return {
    pozitsiyaId: n.pozitsiyalar[0]?.pozitsiyaId ?? 0,
    buyurtmaId: n.buyurtmaId,
  };
}

// ─── Aksessuar ombordan yechiladi ────────────────────────────────────────

describe('Aksessuar «Tugatdim» da ombordan yechiladi', () => {
  /**
   * ⚠️ 2026-08-28 auditida topilgan xato: aksessuar
   *    `pozitsiya_aksessuar` ga yozilardi, lekin ombordan HECH
   *    QAYERDA yechilmasdi. Kronshteyn sotilib puli olinardi,
   *    qoldiq esa kamaymasdi.
   */
  async function kronshteynYarat(miqdor: number): Promise<number> {
    hisoblagich += 1;
    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`ISH-AKS-${String(Date.now())}-${String(hisoblagich)}`},
              'DONA', 'dona', 'DONA', ${XODIM})
      RETURNING id`;
    const materialId = m[0]?.id ?? 0;

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${materialId}, ${FILIAL},
              ${`ISH-AKS-B-${String(Date.now())}-${String(hisoblagich)}`},
              'DONA', ${miqdor}, 20000, ${XODIM})`;

    return materialId;
  }

  async function qoldiq(materialId: number): Promise<number> {
    const q = await sql<{ jami: string }[]>`
      SELECT COALESCE(SUM(miqdor), 0)::text AS jami FROM bolak
      WHERE material_id = ${materialId} AND holat = 'BOSH' AND faol = true`;
    return Number(q[0]?.jami ?? '0');
  }

  it('qoldiq HAQIQATAN kamayadi', async () => {
    const materialId = await kronshteynYarat(10);
    await rulonYarat();

    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0, {
      materialId,
      soni: 4,
    });
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    expect(await qoldiq(materialId)).toBe(10);

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    /** ⚠️ ASOSIY TEKSHIRUV: 10 − 4 = 6 */
    expect(await qoldiq(materialId)).toBe(6);
  });

  it('ombor jurnaliga yozuv tushadi', async () => {
    const materialId = await kronshteynYarat(10);
    await rulonYarat();

    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0, {
      materialId,
      soni: 3,
    });
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    const h = await sql<{ miqdor_dona: number; izoh: string | null }[]>`
      SELECT miqdor_dona, izoh FROM ombor_harakat
      WHERE manba_id = ${pozitsiyaId} AND izoh = 'Aksessuar ishlatildi'`;

    expect(h.length).toBe(1);
    /** ⚠️ MANFIY — ombordan chiqmoqda (2.2-invariant) */
    expect(h[0]?.miqdor_dona).toBe(-3);
  });

  it("aksessuar yetmasa ish TO'XTAMAYDI — usta allaqachon yasagan", async () => {
    const materialId = await kronshteynYarat(2);
    await rulonYarat();

    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0, {
      materialId,
      soni: 10,
    });
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    expect(n.holat).toBe('TAYYOR');

    /** ⚠️ Qoldiq MANFIYGA TUSHMAYDI — yechilmaydi, jurnalda izoh qoladi */
    expect(await qoldiq(materialId)).toBe(2);

    /**
     * ⚠️ AUDIT jurnalida, ombor jurnalida emas: «hech narsa
     *    yechilmadi» ombor HARAKATI emas va bazaning o'zi
     *    bo'laksiz yozuvni rad etadi.
     */
    const h = await sql<{ izoh: string | null }[]>`
      SELECT izoh FROM audit_jurnal
      WHERE obyekt_id = ${pozitsiyaId} AND amal = 'AKSESSUAR_YETMADI'`;
    expect(h.length).toBe(1);
  });
});

// ─── TZ 8.5 · Ishni olish ─────────────────────────────────────────────────

describe('TZ 8.5 — usta navbatdan ishni oladi', () => {
  it("holat ISHLAB_CHIQARILMOQDA ga o'tadi, stavka QOTADI (10.10)", async () => {
    await rulonYarat();
    const { pozitsiyaId } = await pozitsiyaTayyorla();

    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const q = await sql<
      { holat: string; usta_id: number; stavka_snapshot: string }[]
    >`SELECT holat, usta_id, stavka_snapshot FROM buyurtma_pozitsiya
      WHERE id = ${pozitsiyaId}`;

    expect(q[0]?.holat).toBe('ISHLAB_CHIQARILMOQDA');
    expect(q[0]?.usta_id).toBe(USTA);
    expect(Number(q[0]?.stavka_snapshot)).toBe(45_000);
  });

  it("IKKINCHI usta «bu ish allaqachon olingan» oladi", async () => {
    await rulonYarat();
    const { pozitsiyaId } = await pozitsiyaTayyorla();

    await ishniOl(sql, pozitsiyaId, USTA, '45000');
    await expect(ishniOl(sql, pozitsiyaId, USTA, '45000')).rejects.toThrow();
  });

  it('materialga kutayotgan pozitsiyani olib bo\'lmaydi (8.12)', async () => {
    const bosh = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                            yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
      VALUES (${`Ish bo'sh mato ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M',
              ${CHEGARALAR.yaroqsizM}, ${CHEGARALAR.kamIshlatiladiganM}, ${XODIM})
      RETURNING id`;

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-ISH-KUT-${String(Date.now())}`,
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
                materialId: bosh[0]?.id ?? 0,
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
      ishniOl(sql, n.pozitsiyalar[0]?.pozitsiyaId ?? 0, USTA, '45000'),
    ).rejects.toThrow();
  });
});

// ─── TZ 7.6 · K-06 · Kesim uch qatori ─────────────────────────────────────

describe('TZ 7.6 — «Tugatdim» kesimni uch qator qilib yozadi (K-06)', () => {
  it("K-06 — 3.60 = 1.20 + 2.40 + 0, bo'lak ISHLATILDI bo'ladi", async () => {
    // 1.80 × 2.00 = 3.60 kv.m manba, 1.20 × 2.00 = 2.40 mahsulotga
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        // Qoladi: 0.60 × 2.00 = 1.20 kv.m
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    expect(n.holat).toBe('TAYYOR');
    expect(n.mahsulotgaKvM).toBeCloseTo(2.4, 6);
    expect(n.kesimlar[0]?.ostatkaKvM).toBeCloseTo(1.2, 6);
    expect(n.kesimlar[0]?.chiqindiKvM).toBe(0);
    expect(n.yangiOstatkaKodlari[0]).not.toBeNull();

    // Uch qator ombor jurnalida
    const j = await sql<{ turi: string; miqdor_kv_m: string }[]>`
      SELECT turi, miqdor_kv_m FROM ombor_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
      ORDER BY id`;

    expect(j.map((x) => x.turi)).toEqual(['KESIM', 'OSTATKA']);
    expect(Number(j[0]?.miqdor_kv_m)).toBeCloseTo(-3.6, 4);
    expect(Number(j[1]?.miqdor_kv_m)).toBeCloseTo(1.2, 4);
  });

  it("EC-OMB-06 — yangi ostatka tannarxni OTASIDAN meros oladi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    const q = await sql<{ tannarx_birlik_snapshot: string; turi: string }[]>`
      SELECT tannarx_birlik_snapshot, turi FROM bolak WHERE kod = ${n.yangiOstatkaKodlari[0] ?? ''}`;
    expect(q[0]?.turi).toBe('OSTATKA');
    expect(Number(q[0]?.tannarx_birlik_snapshot)).toBe(78_000);
  });

  it("manba bo'lak ISHLATILDI, band ham yopiladi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    const b = await sql<{ holat: string }[]>`
      SELECT bo.holat FROM band bd
      JOIN bolak bo ON bo.id = bd.bolak_id
      WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId}`;
    expect(b[0]?.holat).toBe('ISHLATILDI');

    const bd = await sql<{ holat: string }[]>`
      SELECT holat FROM band WHERE buyurtma_pozitsiya_id = ${pozitsiyaId}`;
    expect(bd[0]?.holat).toBe('ISHLATILDI');
  });

  it("TZ 7.5 — YAROQSIZ qoldiq chiqindiga ketadi, ostatka yaratilmaydi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.6, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        // 0.20 m — yaroqsiz chegara 0.30 dan kichik
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.2, boyiM: 2.0, saqlansinmi: true }, 'RULON'),
        ogohTasdiqlandi: true,
        izoh: null,
      },
      USTA,
    );

    expect(n.kesimlar[0]?.ostatkaKvM).toBe(0);
    expect(n.kesimlar[0]?.chiqindiKvM).toBeCloseTo(0.4, 6);
    // Ostatka yaratilmadi — ro'yxat bo'sh (null lar saqlanmaydi)
    expect(n.yangiOstatkaKodlari).toHaveLength(0);

    const j = await sql<{ turi: string }[]>`
      SELECT turi FROM ombor_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
      ORDER BY id`;
    expect(j.map((x) => x.turi)).toEqual(['KESIM', 'CHIQINDI']);

    /**
     * TZ 12.1 — CHIQINDI FOYDA-ZARARGA TUSHADI.
     *
     * ⚠️ Chiqindi mahsulot tannarxiga KIRMAYDI (11.5.2 da ayiriladi),
     *    shuning uchun 2026-09-03 auditigacha u hech qayerda
     *    hisobga olinmasdi va foyda aynan shu summaga oshib
     *    ko'rinardi.
     */
    const x = await sql<{ modda: string; summa: string; kassa: number | null }[]>`
      SELECT modda, summa::text, kassa_yozuv_id AS kassa FROM xarajat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
        AND modda = 'CHIQINDI'`;

    expect(x).toHaveLength(1);
    // 0.40 kv.m × 78 000 = 31 200, kassaga tegilmaydi
    expect(Number(x[0]?.summa)).toBeCloseTo(31_200, 2);
    expect(x[0]?.kassa).toBeNull();
  });

  it("usta chiqindi deb belgilasa ostatka SAQLANMAYDI (7.6)", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: false }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: 'cheti yirtiq',
      },
      USTA,
    );

    expect(n.kesimlar[0]?.chiqindiKvM).toBeCloseTo(1.2, 6);
    // Ostatka yaratilmadi — ro'yxat bo'sh (null lar saqlanmaydi)
    expect(n.yangiOstatkaKodlari).toHaveLength(0);
  });

  it("olinmagan ishni tugatib bo'lmaydi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);

    await expect(
      tugatdim(
        sql,
        {
          pozitsiyaId,
          kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
          ogohTasdiqlandi: false,
          izoh: null,
        },
        USTA,
      ),
    ).rejects.toThrow();
  });

  it('ikki marta tugatib bo\'lmaydi', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const k = {
      pozitsiyaId,
      kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }),
      ogohTasdiqlandi: false,
      izoh: null,
    };

    await tugatdim(sql, k, USTA);
    await expect(tugatdim(sql, k, USTA)).rejects.toThrow();
  });

  it("TZ 2.4 — «ostatka turgan holda rulon» qarori jurnalda qoladi (11.7.7)", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'RULON'),
        ogohTasdiqlandi: true,
        izoh: null,
      },
      USTA,
    );

    const a = await sql<{ yangi_qiymat: unknown }[]>`
      SELECT yangi_qiymat FROM audit_jurnal
      WHERE obyekt_turi = 'buyurtma_pozitsiya' AND obyekt_id = ${pozitsiyaId}
        AND amal = 'TUGATDIM'`;
    const matn = JSON.stringify(a[0]?.yangi_qiymat);
    expect(matn).toContain('RULON');
    expect(matn).toContain('ogoh_tasdiqlandi');
  });
});

// ─── TZ 8.6 · Ishni qaytarib olish ────────────────────────────────────────

describe('TZ 8.6 — admin ishni qaytarib oladi', () => {
  it('pozitsiya navbatga qaytadi, stavka TOZALANADI', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await ishniQaytaribOl(sql, pozitsiyaId, '20000', 'Usta kasal bo\'lib qoldi', XODIM);

    const q = await sql<
      {
        holat: string;
        usta_id: number | null;
        stavka_snapshot: string | null;
        stavka_birlik_snapshot: string | null;
      }[]
    >`SELECT holat, usta_id, stavka_snapshot, stavka_birlik_snapshot
      FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;

    expect(q[0]?.holat).toBe('TASDIQLANGAN');
    expect(q[0]?.usta_id).toBeNull();

    /**
     * ⚠️ 2026-09-05 — XATTI-HARAKAT O'ZGARDI.
     *
     *    Ilgari admin kiritgan summa `stavka_snapshot` ga yozilardi
     *    va keyingi usta `ishniOl` bilan uni USTIDAN YOZARDI:
     *    eski usta HECH NARSA olmasdi.
     *
     *    Endi summa eski ustaga DARHOL to'lanadi, stavka esa
     *    tozalanadi — keyingi usta o'z snapshotini oladi (10.10).
     */
    expect(q[0]?.stavka_snapshot).toBeNull();
    expect(q[0]?.stavka_birlik_snapshot).toBeNull();
  });

  it('eski ustaga haq DARHOL yoziladi (8.6)', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await ishniQaytaribOl(sql, pozitsiyaId, '20000', 'Usta kasal', XODIM);

    const h = await sql<{ summa: string; turi: string }[]>`
      SELECT summa::text, turi FROM xodim_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
        AND xodim_id = ${USTA} AND turi = 'HAQ'`;

    expect(h).toHaveLength(1);
    expect(Number(h[0]?.summa)).toBe(20_000);

    // 12.1 — pul chiqmagan xarajat, kassa yozuvi YO'Q
    const x = await sql<{ summa: string; kassa_yozuv_id: number | null }[]>`
      SELECT summa::text, kassa_yozuv_id FROM xarajat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
        AND modda = 'ISH_HAQI'`;
    expect(Number(x[0]?.summa)).toBe(20_000);
    expect(x[0]?.kassa_yozuv_id).toBeNull();
  });

  /**
   * ⚠️ Summa QAT'IY: admin uni ko'rib turib kiritgan. Ilgari
   *    `stavka_birlik_snapshot` KV_M bo'lib qolar va keyingi
   *    «Tugatdim» da bu raqam yana maydonga ko'paytirilardi.
   */
  it('nol summa kiritilsa haq yozuvi bo\'lmaydi', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await ishniQaytaribOl(sql, pozitsiyaId, '0', 'Hech narsa qilmagan', XODIM);

    const h = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xodim_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(h[0]?.n).toBe(0);
  });

  it('manfiy summa RAD ETILADI', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await expect(
      ishniQaytaribOl(sql, pozitsiyaId, '-100', 'Sabab', XODIM),
    ).rejects.toThrow();
  });

  it('sabab MAJBURIY', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await expect(
      ishniQaytaribOl(sql, pozitsiyaId, '20000', '   ', XODIM),
    ).rejects.toThrow();
  });

  it("«Tugatdim» bosilgach qaytarib bo'lmaydi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');
    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    await expect(
      ishniQaytaribOl(sql, pozitsiyaId, '20000', 'kech', XODIM),
    ).rejects.toThrow();
  });
});

// ─── TZ 8.8 · Bekor qilish ────────────────────────────────────────────────

describe('TZ 8.8 — bekor qilish FAQAT kesishdan oldin', () => {
  it("band bo'shaydi va bo'lak omborga qaytadi (Q-06)", async () => {
    const bolakId = await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);

    const n = await pozitsiyaniBekorQil(sql, pozitsiyaId, 'Mijoz voz kechdi', XODIM);
    expect(n.boshatilganBand).toBe(1);

    const p = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.holat).toBe('BEKOR');

    const b = await sql<{ holat: string }[]>`
      SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
  });

  it("ish boshlangach bekor qilib bo'lmaydi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await expect(
      pozitsiyaniBekorQil(sql, pozitsiyaId, 'kech', XODIM),
    ).rejects.toThrow();
  });

  it('sabab MAJBURIY', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);

    await expect(pozitsiyaniBekorQil(sql, pozitsiyaId, '  ', XODIM)).rejects.toThrow();
  });

  it("2.1-invariant — rad etilgan bekor hech narsani o'zgartirmaydi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);

    await expect(pozitsiyaniBekorQil(sql, pozitsiyaId, '  ', XODIM)).rejects.toThrow();

    /**
     * ⚠️ QAYSI bo'lak band qilingani tekshirilmaydi — TZ 7.6 «eng kam
     *    chiqindi» qoidasi bo'yicha tizim oldingi testlar qoldirgan
     *    ostatkani tanlashi mumkin. Muhimi: band FAOL qolgan va o'sha
     *    bo'lak hamon BAND holatida.
     */
    const b = await sql<{ holat: string; band_holat: string }[]>`
      SELECT bo.holat, bd.holat AS band_holat
      FROM band bd JOIN bolak bo ON bo.id = bd.bolak_id
      WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId}`;
    expect(b).toHaveLength(1);
    expect(b[0]?.band_holat).toBe('FAOL');
    expect(b[0]?.holat).toBe('BAND');
  });
});

// ─── TZ 10.10 · 12.1 — «Tugatdim» da haq hisoblanadi ─────────────────────

describe('TZ 10.10 — haq «Tugatdim» da hisoblanadi', () => {
  it("kv.m stavkasi maydonga ko'paytiriladi va xodim balansiga tushadi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    // 18 000 so'm/kv.m, pozitsiya 1.20 × 2.00 = 2.40 kv.m → 43 200
    await ishniOl(sql, pozitsiyaId, USTA, '18000', 'KV_M');

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    const h = await sql<{ turi: string; summa: string }[]>`
      SELECT turi, summa FROM xodim_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(h).toHaveLength(1);
    expect(h[0]?.turi).toBe('HAQ');
    expect(Number(h[0]?.summa)).toBe(43_200);
  });

  it("TZ 12.1 — hisoblangan haq XARAJAT, lekin kassa yozuvi YO'Q", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000', 'DONA');

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    const x = await sql<{ modda: string; summa: string; kassa_yozuv_id: number | null }[]>`
      SELECT modda, summa, kassa_yozuv_id FROM xarajat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(x).toHaveLength(1);
    expect(x[0]?.modda).toBe('ISH_HAQI');
    expect(Number(x[0]?.summa)).toBe(45_000);
    expect(x[0]?.kassa_yozuv_id).toBeNull();
  });

  it("qat'iy stavka o'lchamdan qat'i nazar bir xil (10.8)", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.6, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '15000', 'DONA');

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.2, boyiM: 2.0, saqlansinmi: false }, 'RULON'),
        ogohTasdiqlandi: true,
        izoh: null,
      },
      USTA,
    );

    const h = await sql<{ summa: string }[]>`
      SELECT summa FROM xodim_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(Number(h[0]?.summa)).toBe(15_000);
  });

  it("TZ 10.12 — stavkasi yo'q pozitsiyada haq yozilmaydi, ish to'xtamaydi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    // Stavka 0 — 10.12 bo'yicha ishlab chiqarish davom etadi
    await ishniOl(sql, pozitsiyaId, USTA, '0', 'DONA');

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }, 'OSTATKA'),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    expect(n.holat).toBe('TAYYOR');

    const h = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xodim_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(h[0]?.n).toBe(0);
  });
});

// ─── 7.6 · KO'P MATOLI MAHSULOT — 2026-09-03 tuzatishi ────────────────────

/**
 * ⚠️ NEGA BU TEST BOR
 *
 *    Rollo (old + orqa mato) va Dikke (uchta mato) da pozitsiyaga
 *    HAR SLOT uchun alohida band qo'yiladi. «Tugatdim» esa faqat
 *    BIRINCHISINI kesardi:
 *
 *      · ikkinchi mato ombordan CHIQMASDI — qoldiq haqiqatdan ko'p
 *      · bandi FAOL qolib, 30 kundan keyin muddat o'tib bo'lak
 *        «bo'sh»ga qaytardi va jismonan kesilgan mato boshqa
 *        buyurtmaga taklif qilinardi
 *      · tannarx faqat bitta mato bo'yicha hisoblanardi
 *
 *    Bu test o'sha xatoning qaytishiga yo'l qo'ymaydi.
 */
describe("7.6 — ko'p matoli mahsulot", () => {
  let ikkiTurId = 0;
  let slotBir = 0;
  let slotIkki = 0;
  let ikkinchiMatoId = 0;

  beforeAll(async () => {
    const belgi = `${String(Date.now())}-KOP`;

    const m = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                            yaroqsiz_chegara_m, kam_ishlatiladigan_m, yaratdi_id)
      VALUES (${`Ish orqa mato ${belgi}`}, 'RULON', 'rulon', 'KV_M',
              ${CHEGARALAR.yaroqsizM}, ${CHEGARALAR.kamIshlatiladiganM}, ${XODIM})
      RETURNING id`;
    ikkinchiMatoId = m[0]?.id ?? 0;

    const t = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_tur (nom, yaratdi_id)
      VALUES (${`Rollo sinov turi ${belgi}`}, ${XODIM}) RETURNING id`;
    ikkiTurId = t[0]?.id ?? 0;

    const s1 = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
      VALUES (${ikkiTurId}, 'Old mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
    slotBir = s1[0]?.id ?? 0;

    const s2 = await sql<{ id: number }[]>`
      INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
      VALUES (${ikkiTurId}, 'Orqa mato', 2, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
    slotIkki = s2[0]?.id ?? 0;
  }, 60_000);

  /** Ikki matoli, ikki bandli tayyor pozitsiya. */
  async function ikkiMatoliPozitsiya(): Promise<number> {
    hisoblagich += 1;
    const b = String(Date.now());

    // Har mato uchun o'z ruloni
    for (const [i, mat] of [matoId, ikkinchiMatoId].entries()) {
      await sql`
        INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                           tannarx_birlik_snapshot, yaratdi_id)
        VALUES (${mat}, ${FILIAL}, ${`R-KOP-${b}-${String(hisoblagich)}-${String(i)}`},
                'RULON', 1.8, 2.0, 78000, ${XODIM})`;
    }

    const n = await buyurtmaYarat(
      sql,
      {
        raqam: `B-KOP-${b}-${String(hisoblagich)}`,
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
            mahsulotTurId: ikkiTurId,
            eniSm: 120,
            boyiSm: 200,
            soni: 1,
            narxSnapshot: '900000',
            chegirmaSumma: '0',
            xizmatHaqi: '0',
            formulaSnapshot: { sinov: true },
            slotlar: [
              {
                slotId: slotBir,
                materialId: matoId,
                hisoblanganMiqdor: '2.4000',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '120000',
                kerak: { eniM: 1.2, boyiM: 2.0 },
              },
              {
                slotId: slotIkki,
                materialId: ikkinchiMatoId,
                hisoblanganMiqdor: '2.4000',
                tuzatilganMiqdor: null,
                birlik: 'KV_M',
                narxSnapshot: '110000',
                kerak: { eniM: 1.2, boyiM: 2.0 },
              },
            ],
            aksessuarlar: [],
          },
        ],
      },
      XODIM,
    );

    const pozitsiyaId = n.pozitsiyalar[0]?.pozitsiyaId ?? 0;
    await ishniOl(sql, pozitsiyaId, USTA, '45000');
    return pozitsiyaId;
  }

  it('ikki slotga ikki band qo\'yiladi', async () => {
    const pozitsiyaId = await ikkiMatoliPozitsiya();

    const b = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    expect(b[0]?.n).toBe(2);
  });

  /** ⚠️ ASOSIY TEKSHIRUV — eski xato aynan shu yerda edi. */
  it('«Tugatdim» IKKALA matoni ham ombordan yechadi', async () => {
    const pozitsiyaId = await ikkiMatoliPozitsiya();

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    // Ikkala mato ham kesildi
    expect(n.kesimlar).toHaveLength(2);
    expect(n.mahsulotgaKvM).toBeCloseTo(4.8, 6);
    expect(n.yangiOstatkaKodlari).toHaveLength(2);

    // FAOL band QOLMADI — hammasi ISHLATILDI
    const band = await sql<{ holat: string; n: number }[]>`
      SELECT holat, COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId}
      GROUP BY holat`;
    expect(band).toEqual([{ holat: 'ISHLATILDI', n: 2 }]);

    // Ikkala manba bo'lak ham ombordan chiqdi
    const bolaklar = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM bolak
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'ISHLATILDI'`;
    expect(bolaklar[0]?.n).toBe(2);

    // Ombor jurnalida har mato uchun KESIM va OSTATKA
    const j = await sql<{ turi: string; n: number }[]>`
      SELECT turi, COUNT(*)::int AS n FROM ombor_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
      GROUP BY turi ORDER BY turi`;
    expect(j).toEqual([
      { turi: 'KESIM', n: 2 },
      { turi: 'OSTATKA', n: 2 },
    ]);
  });

  /**
   * ⚠️ Bittasi tushib qolsa amal RAD ETILADI — «yarim yechilgan»
   *    pozitsiya bo'lmaydi (2.1-invariant).
   */
  it('bir mato qoldig\'i kiritilmasa RAD ETILADI', async () => {
    const pozitsiyaId = await ikkiMatoliPozitsiya();
    const hammasi = await kesimlar(pozitsiyaId, {
      eniM: 0.6,
      boyiM: 2.0,
      saqlansinmi: true,
    });

    await expect(
      tugatdim(
        sql,
        {
          pozitsiyaId,
          // ATAYLAB faqat bittasi
          kesimlar: hammasi.slice(0, 1),
          ogohTasdiqlandi: false,
          izoh: null,
        },
        USTA,
      ),
    ).rejects.toThrow();

    // Hech narsa yechilmadi — ikkala band ham FAOL qoldi
    const b = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM band
      WHERE buyurtma_pozitsiya_id = ${pozitsiyaId} AND holat = 'FAOL'`;
    expect(b[0]?.n).toBe(2);
  });

  /** 3.15.4 — tannarx HAMMA mato bo'yicha yig'iladi. */
  it('tannarx ikkala matoni ham hisobga oladi', async () => {
    const pozitsiyaId = await ikkiMatoliPozitsiya();

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        kesimlar: await kesimlar(pozitsiyaId, { eniM: 0.6, boyiM: 2.0, saqlansinmi: true }),
        ogohTasdiqlandi: false,
        izoh: null,
      },
      USTA,
    );

    // Har mato: 2.40 kv.m × 78 000 = 187 200 → ikkitasi 374 400
    const p = await sql<{ tannarx: string | null }[]>`
      SELECT tannarx_snapshot::text AS tannarx FROM buyurtma_pozitsiya
      WHERE id = ${pozitsiyaId}`;
    expect(Number(p[0]?.tannarx)).toBeCloseTo(374_400, 2);
  });
});
