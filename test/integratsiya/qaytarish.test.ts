/**
 * TZ 8.10 · 11.4.1 · 12.1 · 12.10 · 12.11 · 2.1-invariant
 *
 * Mijozga qaytarish va qo'lda kiritiladigan kassa hodisalari.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pozitsiyaniQaytar } from '@/lib/amal/qaytarish';
import { boshqaHodisa, eganingPuli, operatsionXarajat } from '@/lib/amal/xarajat';
import { buyurtmaTolovi } from '@/lib/amal/tolov';
import { buyurtmaYarat, type BuyurtmaKirimi } from '@/lib/amal/buyurtma';
import { ishniOl, pozitsiyaniTopshir, tugatdim } from '@/lib/amal/ish';
import type { Chegaralar } from '@/lib/domain/kesish';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId = 0;
let turId = 0;
let slotId = 0;
let naqdKassa = 0;
let adminKassa = 0;

const FILIAL = 1;
const XODIM = 1;
const CHEGARALAR: Chegaralar = { yaroqsizM: 0.3, kamIshlatiladiganM: 0.5 };

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const b = belgi();

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Qaytarish matosi ${b}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const t = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Qaytarish turi ${b}`}, ${XODIM}) RETURNING id`;
  turId = t[0]?.id ?? 0;

  const s = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_slot (mahsulot_tur_id, nom, tartib, formula, yaratdi_id)
    VALUES (${turId}, 'Asosiy mato', 1, ${"ENI * BO'YI"}, ${XODIM}) RETURNING id`;
  slotId = s[0]?.id ?? 0;

  const kassaOl = async (turi: string, xodim: number | null): Promise<number> => {
    const bor = await sql<{ id: number }[]>`
      SELECT id FROM kassa
      WHERE filial_id = ${FILIAL} AND turi = ${turi} AND valyuta = 'SOM'
        AND xodim_id IS NOT DISTINCT FROM ${xodim}`;
    if (bor[0] !== undefined) return bor[0].id;

    const y = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${FILIAL}, ${xodim}, ${turi}, 'SOM', ${`${turi} ${b}`}, ${XODIM})
      RETURNING id`;
    return y[0]?.id ?? 0;
  };

  naqdKassa = await kassaOl('NAQD', XODIM);
  adminKassa = await kassaOl('NAQD', null);
}, 120_000);

afterAll(async () => {
  await sql.end();
});

async function mijozYarat(): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, yaratdi_id)
    VALUES (${`Qaytarish mijozi ${belgi()}`},
            ${`9977${String(Date.now()).slice(-5)}`}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

/**
 * TOPSHIRILGAN pozitsiya yaratadi.
 *
 * ⚠️ TZ 8.10 — qaytarish faqat TOPSHIRILGANDAN keyin bo'ladi: mijoz
 *    mahsulotni oldi, keyin qaytardi. Tayyor mahsulotni mijoz umuman
 *    olmasa — bu RAD ETISH (8.8), boshqa amal.
 */
async function tayyorPozitsiya(
  narx: string,
  mijozId: number | null,
): Promise<number> {
  await sql`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL}, ${`R-QAY-${belgi()}`}, 'RULON', 1.8, 2.0,
            78000, ${XODIM})`;

  const kirim: BuyurtmaKirimi = {
    raqam: `B-QAY-${belgi()}`,
    mijozId,
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
        narxSnapshot: narx,
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

  await ishniOl(sql, pozitsiyaId, XODIM, '0', 'DONA');
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
    XODIM,
  );

  await pozitsiyaniTopshir(sql, pozitsiyaId, XODIM);

  return pozitsiyaId;
}

// ─── TZ 8.10 · Qaytarish ──────────────────────────────────────────────────

describe('TZ 8.10 — qaytarish POZITSIYA darajasida', () => {
  it("qarzi bor mijozda avval QARZDAN chegiriladi", async () => {
    const mijozId = await mijozYarat();
    const pozitsiyaId = await tayyorPozitsiya('800000', mijozId);

    // To'lov qilinmagan — qarz 800 000
    const n = await pozitsiyaniQaytar(
      sql,
      {
        pozitsiyaId,
        summa: '800000',
        kassaId: null,
        ortiqchaYoli: 'NAQD',
        izoh: 'Mijoz olmadi',
      },
      XODIM,
    );

    expect(Number(n.qarzdan)).toBe(800_000);
    expect(Number(n.naqd)).toBe(0);
    expect(Number(n.ushlabQolindi)).toBe(0);

    // 2.2-invariant — qarz nolga qaytadi
    const q = await sql<{ qarz: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS qarz FROM mijoz_harakat
      WHERE mijoz_id = ${mijozId}`;
    expect(Number(q[0]?.qarz)).toBe(0);
  });

  it("qarz to'langan bo'lsa ortiqchasi KASSADAN naqd chiqadi", async () => {
    const mijozId = await mijozYarat();
    const pozitsiyaId = await tayyorPozitsiya('800000', mijozId);

    const b = await sql<{ buyurtma_id: number }[]>`
      SELECT buyurtma_id FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;

    await buyurtmaTolovi(
      sql,
      {
        buyurtmaId: b[0]?.buyurtma_id ?? 0,
        qatorlar: [{ kassaId: naqdKassa, summa: '800000', valyuta: 'SOM' }],
        izoh: null,
      },
      XODIM,
    );

    const n = await pozitsiyaniQaytar(
      sql,
      {
        pozitsiyaId,
        summa: '800000',
        kassaId: naqdKassa,
        ortiqchaYoli: 'NAQD',
        izoh: 'Mijoz qaytardi',
      },
      XODIM,
    );

    expect(Number(n.qarzdan)).toBe(0);
    expect(Number(n.naqd)).toBe(800_000);
    expect(n.kassaYozuvId).not.toBeNull();

    const y = await sql<{ kod: string; summa: string }[]>`
      SELECT kod, summa FROM kassa_yozuv WHERE id = ${n.kassaYozuvId ?? 0}`;
    expect(y[0]?.kod).toBe('C6');
    expect(Number(y[0]?.summa)).toBe(-800_000);
  });

  it("ortiqchasi AVANS bo'lib qolishi mumkin (8.10)", async () => {
    const mijozId = await mijozYarat();
    const pozitsiyaId = await tayyorPozitsiya('500000', mijozId);

    const b = await sql<{ buyurtma_id: number }[]>`
      SELECT buyurtma_id FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    await buyurtmaTolovi(
      sql,
      {
        buyurtmaId: b[0]?.buyurtma_id ?? 0,
        qatorlar: [{ kassaId: naqdKassa, summa: '500000', valyuta: 'SOM' }],
        izoh: null,
      },
      XODIM,
    );

    const n = await pozitsiyaniQaytar(
      sql,
      {
        pozitsiyaId,
        summa: '500000',
        kassaId: null,
        ortiqchaYoli: 'AVANS',
        izoh: 'Keyingi buyurtmaga qoldirdi',
      },
      XODIM,
    );

    expect(Number(n.avans)).toBe(500_000);
    expect(n.kassaYozuvId).toBeNull();

    // Qarz MANFIYGA tushadi — bu avans
    const q = await sql<{ qarz: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS qarz FROM mijoz_harakat
      WHERE mijoz_id = ${mijozId}`;
    expect(Number(q[0]?.qarz)).toBe(-500_000);
  });

  it("kelishilgan summa kam bo'lsa farq «ushlab qolindi» bo'ladi (11.4.1)", async () => {
    const mijozId = await mijozYarat();
    const pozitsiyaId = await tayyorPozitsiya('800000', mijozId);

    const n = await pozitsiyaniQaytar(
      sql,
      {
        pozitsiyaId,
        summa: '600000',
        kassaId: null,
        ortiqchaYoli: 'NAQD',
        izoh: 'Kelishildi',
      },
      XODIM,
    );

    expect(Number(n.ushlabQolindi)).toBe(200_000);

    // Xarajatni KAMAYTIRADI — alohida daromad emas
    const x = await sql<{ modda: string; summa: string }[]>`
      SELECT modda, summa FROM xarajat
      WHERE manba_turi = 'qaytarish' AND manba_id = ${pozitsiyaId}`;
    expect(x[0]?.modda).toBe('BOSHQA');
    expect(Number(x[0]?.summa)).toBe(-200_000);
  });

  it("TZ 8.10 — CHEGARA YO'Q, 0 ham kiritiladi", async () => {
    const mijozId = await mijozYarat();
    const pozitsiyaId = await tayyorPozitsiya('800000', mijozId);

    const n = await pozitsiyaniQaytar(
      sql,
      {
        pozitsiyaId,
        summa: '0',
        kassaId: null,
        ortiqchaYoli: 'NAQD',
        izoh: 'Mijozning aybi — pul qaytarilmadi',
      },
      XODIM,
    );

    expect(Number(n.qaytarildi)).toBe(0);
    expect(Number(n.ushlabQolindi)).toBe(800_000);
  });

  it('izoh MAJBURIY', async () => {
    const pozitsiyaId = await tayyorPozitsiya('400000', await mijozYarat());

    await expect(
      pozitsiyaniQaytar(
        sql,
        { pozitsiyaId, summa: '400000', kassaId: null, ortiqchaYoli: 'NAQD', izoh: '  ' },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("mijozsiz buyurtmada hammasi KASSADAN naqd", async () => {
    const pozitsiyaId = await tayyorPozitsiya('400000', null);

    const n = await pozitsiyaniQaytar(
      sql,
      {
        pozitsiyaId,
        summa: '400000',
        kassaId: naqdKassa,
        // Mijozsizda tanlov yo'q — baribir naqd
        ortiqchaYoli: 'AVANS',
        izoh: "Ko'chadan kelgan xaridor",
      },
      XODIM,
    );

    expect(Number(n.naqd)).toBe(400_000);
    expect(Number(n.avans)).toBe(0);
    expect(Number(n.qarzdan)).toBe(0);
  });

  it("qaytarilgan pozitsiya QAYTA qaytarilmaydi (8.10)", async () => {
    const pozitsiyaId = await tayyorPozitsiya('400000', await mijozYarat());

    const k = {
      pozitsiyaId,
      summa: '400000',
      kassaId: null,
      ortiqchaYoli: 'NAQD' as const,
      izoh: 'birinchi',
    };

    await pozitsiyaniQaytar(sql, k, XODIM);
    await expect(pozitsiyaniQaytar(sql, k, XODIM)).rejects.toThrow();
  });

  it("ombor qoldig'iga TEGILMAYDI — mato allaqachon kesilgan", async () => {
    const pozitsiyaId = await tayyorPozitsiya('400000', await mijozYarat());

    const oldin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM ombor_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;

    await pozitsiyaniQaytar(
      sql,
      { pozitsiyaId, summa: '400000', kassaId: null, ortiqchaYoli: 'NAQD', izoh: 'x' },
      XODIM,
    );

    const keyin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM ombor_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(keyin[0]?.n).toBe(oldin[0]?.n);
  });
});

// ─── TZ 12.10 · Operatsion xarajat ────────────────────────────────────────

describe('TZ 12.10 — operatsion xarajat HAQIQIY xarajat', () => {
  it('kassadan chiqadi VA xarajat yoziladi', async () => {
    const n = await operatsionXarajat(
      sql,
      {
        kassaId: naqdKassa,
        summa: '450000',
        valyuta: 'SOM',
        modda: 'OPERATSION',
        izoh: 'Internet to\'lovi',
      },
      FILIAL,
      XODIM,
    );

    expect(n.xarajatId).not.toBeNull();

    const y = await sql<{ kod: string; summa: string; manba_turi: string }[]>`
      SELECT kod, summa, manba_turi FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('C7');
    expect(Number(y[0]?.summa)).toBe(-450_000);
    // TZ 12.3 — qo'lda kiritilgan yozuvda manba «qo'lda»
    expect(y[0]?.manba_turi).toBe('qolda');
  });

  it('izoh MAJBURIY', async () => {
    await expect(
      operatsionXarajat(
        sql,
        {
          kassaId: naqdKassa,
          summa: '100000',
          valyuta: 'SOM',
          modda: 'OPERATSION',
          izoh: '   ',
        },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("ketma-ket ikki xarajat to'qnashmaydi (P-26 uchligi)", async () => {
    const a = await operatsionXarajat(
      sql,
      { kassaId: naqdKassa, summa: '10000', valyuta: 'SOM', modda: 'OPERATSION', izoh: 'a' },
      FILIAL,
      XODIM,
    );
    const b = await operatsionXarajat(
      sql,
      { kassaId: naqdKassa, summa: '20000', valyuta: 'SOM', modda: 'OPERATSION', izoh: 'b' },
      FILIAL,
      XODIM,
    );
    expect(a.kassaYozuvId).not.toBe(b.kassaYozuvId);
  });
});

// ─── TZ 12.11 · Egasining puli ────────────────────────────────────────────

describe("TZ 12.11 — egasining puli XARAJAT EMAS", () => {
  it("pul olinganda kassadan chiqadi, xarajat YOZILMAYDI", async () => {
    const n = await eganingPuli(
      sql,
      {
        kassaId: adminKassa,
        summa: '5000000',
        valyuta: 'SOM',
        qoshdimi: false,
        izoh: 'Shaxsiy ehtiyoj',
      },
      XODIM,
    );

    const y = await sql<{ kod: string; summa: string }[]>`
      SELECT kod, summa FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('C8');
    expect(Number(y[0]?.summa)).toBe(-5_000_000);

    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat WHERE kassa_yozuv_id = ${n.kassaYozuvId}`;
    expect(x[0]?.n).toBe(0);
  });

  it('pul qo\'shilganda K6 kodi bilan kiradi', async () => {
    const n = await eganingPuli(
      sql,
      {
        kassaId: adminKassa,
        summa: '3000000',
        valyuta: 'SOM',
        qoshdimi: true,
        izoh: 'Aylanma uchun',
      },
      XODIM,
    );

    const y = await sql<{ kod: string; summa: string }[]>`
      SELECT kod, summa FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('K6');
    expect(Number(y[0]?.summa)).toBe(3_000_000);
  });

  it("SOTUVCHI kassasidan olib bo'lmaydi (12.11)", async () => {
    await expect(
      eganingPuli(
        sql,
        {
          kassaId: naqdKassa,
          summa: '100000',
          valyuta: 'SOM',
          qoshdimi: false,
          izoh: 'x',
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

// ─── TZ 12.5 · K9 · 12.6 · C10 ────────────────────────────────────────────

describe('TZ 12.5 · 12.6 — boshqa kirim va chiqim', () => {
  it("boshqa KIRIM xarajat yozmaydi", async () => {
    const n = await boshqaHodisa(
      sql,
      {
        kassaId: naqdKassa,
        summa: '150000',
        valyuta: 'SOM',
        kirimmi: true,
        izoh: 'Hisobdan chiqarilgan qarz qaytdi',
      },
      FILIAL,
      XODIM,
    );

    expect(n.xarajatId).toBeNull();

    const y = await sql<{ kod: string }[]>`
      SELECT kod FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('K9');
  });

  it('boshqa CHIQIM xarajatga tushadi', async () => {
    const n = await boshqaHodisa(
      sql,
      {
        kassaId: naqdKassa,
        summa: '90000',
        valyuta: 'SOM',
        kirimmi: false,
        izoh: 'Kutilmagan chiqim',
      },
      FILIAL,
      XODIM,
    );

    expect(n.xarajatId).not.toBeNull();

    const y = await sql<{ kod: string }[]>`
      SELECT kod FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`;
    expect(y[0]?.kod).toBe('C10');
  });

  it('izoh MAJBURIY', async () => {
    await expect(
      boshqaHodisa(
        sql,
        { kassaId: naqdKassa, summa: '10000', valyuta: 'SOM', kirimmi: true, izoh: '' },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });
});
