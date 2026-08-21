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

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Ish sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
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
  await sql.end();
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
        aksessuarlar: [],
      },
    ],
  };

  const n = await buyurtmaYarat(sql, kirim, XODIM);
  return {
    pozitsiyaId: n.pozitsiyalar[0]?.pozitsiyaId ?? 0,
    buyurtmaId: n.buyurtmaId,
  };
}

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
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`Ish bo'sh mato ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M',
              ${XODIM})
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
        manba: 'OSTATKA',
        // Qoladi: 0.60 × 2.00 = 1.20 kv.m
        qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
        ogohTasdiqlandi: false,
        izoh: null,
      },
      CHEGARALAR,
      USTA,
    );

    expect(n.holat).toBe('TAYYOR');
    expect(n.mahsulotgaKvM).toBeCloseTo(2.4, 6);
    expect(n.ostatkaKvM).toBeCloseTo(1.2, 6);
    expect(n.chiqindiKvM).toBe(0);
    expect(n.yangiOstatkaKod).not.toBeNull();

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
        manba: 'OSTATKA',
        qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
        ogohTasdiqlandi: false,
        izoh: null,
      },
      CHEGARALAR,
      USTA,
    );

    const q = await sql<{ tannarx_birlik_snapshot: string; turi: string }[]>`
      SELECT tannarx_birlik_snapshot, turi FROM bolak WHERE kod = ${n.yangiOstatkaKod ?? ''}`;
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
        manba: 'OSTATKA',
        qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
        ogohTasdiqlandi: false,
        izoh: null,
      },
      CHEGARALAR,
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
        manba: 'RULON',
        // 0.20 m — yaroqsiz chegara 0.30 dan kichik
        qoldiq: { eniM: 0.2, boyiM: 2.0, saqlansinmi: true },
        ogohTasdiqlandi: true,
        izoh: null,
      },
      CHEGARALAR,
      USTA,
    );

    expect(n.ostatkaKvM).toBe(0);
    expect(n.chiqindiKvM).toBeCloseTo(0.4, 6);
    expect(n.yangiOstatkaKod).toBeNull();

    const j = await sql<{ turi: string }[]>`
      SELECT turi FROM ombor_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
      ORDER BY id`;
    expect(j.map((x) => x.turi)).toEqual(['KESIM', 'CHIQINDI']);
  });

  it("usta chiqindi deb belgilasa ostatka SAQLANMAYDI (7.6)", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    const n = await tugatdim(
      sql,
      {
        pozitsiyaId,
        manba: 'OSTATKA',
        qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: false },
        ogohTasdiqlandi: false,
        izoh: 'cheti yirtiq',
      },
      CHEGARALAR,
      USTA,
    );

    expect(n.chiqindiKvM).toBeCloseTo(1.2, 6);
    expect(n.yangiOstatkaKod).toBeNull();
  });

  it("olinmagan ishni tugatib bo'lmaydi", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);

    await expect(
      tugatdim(
        sql,
        {
          pozitsiyaId,
          manba: 'OSTATKA',
          qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
          ogohTasdiqlandi: false,
          izoh: null,
        },
        CHEGARALAR,
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
      manba: 'OSTATKA' as const,
      qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
      ogohTasdiqlandi: false,
      izoh: null,
    };

    await tugatdim(sql, k, CHEGARALAR, USTA);
    await expect(tugatdim(sql, k, CHEGARALAR, USTA)).rejects.toThrow();
  });

  it("TZ 2.4 — «ostatka turgan holda rulon» qarori jurnalda qoladi (11.7.7)", async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await tugatdim(
      sql,
      {
        pozitsiyaId,
        manba: 'RULON',
        qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
        ogohTasdiqlandi: true,
        izoh: null,
      },
      CHEGARALAR,
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
  it('pozitsiya navbatga qaytadi, stavka QO\'LDA kiritiladi', async () => {
    await rulonYarat(1.8, 2.0);
    const { pozitsiyaId } = await pozitsiyaTayyorla(1.2, 2.0);
    await ishniOl(sql, pozitsiyaId, USTA, '45000');

    await ishniQaytaribOl(sql, pozitsiyaId, '20000', 'Usta kasal bo\'lib qoldi', XODIM);

    const q = await sql<
      { holat: string; usta_id: number | null; stavka_snapshot: string }[]
    >`SELECT holat, usta_id, stavka_snapshot FROM buyurtma_pozitsiya
      WHERE id = ${pozitsiyaId}`;

    expect(q[0]?.holat).toBe('TASDIQLANGAN');
    expect(q[0]?.usta_id).toBeNull();
    // Usta ishning bir qismini bajargan — admin 20 000 to'laydi
    expect(Number(q[0]?.stavka_snapshot)).toBe(20_000);
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
        manba: 'OSTATKA',
        qoldiq: { eniM: 0.6, boyiM: 2.0, saqlansinmi: true },
        ogohTasdiqlandi: false,
        izoh: null,
      },
      CHEGARALAR,
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
