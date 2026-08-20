/**
 * TZ 7.10 · QISM 1 §1 · 2.2-invariant · QABUL S2.6
 *
 * Boshlang'ich qoldiq — tizimga o'tish amali.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { boshlangichQoldiq } from '@/lib/amal/boshlangich';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

const FILIAL = 1;
const XODIM = 1;

beforeAll(() => {
  sql = sinovUlanishi();
});

afterAll(async () => {
  await sql.end();
});

let hisoblagich = 0;

async function materialYarat(
  hisobTuri: string,
  sarflash: string,
  koeff = '1',
): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, yaratdi_id)
    VALUES (${`Bosh sinov ${String(Date.now())}-${String(hisoblagich)}`},
            ${hisobTuri}, 'rulon', ${sarflash}, ${koeff}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

// ─── 7.10 · Rulon ─────────────────────────────────────────────────────────

describe("TZ 7.10 — boshlang'ich qoldiq", () => {
  it('rulonlar bo\'lak bo\'lib tushadi, qiymat kv.m bo\'yicha (P-20)', async () => {
    const materialId = await materialYarat('RULON', 'KV_M');

    const n = await boshlangichQoldiq(
      sql,
      {
        materialId,
        filialId: FILIAL,
        bolaklar: [
          { eniM: 3.0, boyiM: 28.0 },
          { eniM: 2.0, boyiM: 10.0 },
        ],
        miqdor: null,
        tannarxBirlik: '78000',
        izoh: null,
      },
      XODIM,
    );

    expect(n.bolakSoni).toBe(2);
    // (3 × 28 × 78 000) + (2 × 10 × 78 000) = 6 552 000 + 1 560 000
    expect(n.jamiSumma).toBe('8112000.00');

    const b = await sql<{ holat: string; tannarx_birlik_snapshot: string }[]>`
      SELECT holat, tannarx_birlik_snapshot FROM bolak
      WHERE material_id = ${materialId} ORDER BY id`;
    expect(b).toHaveLength(2);
    expect(b[0]?.holat).toBe('BOSH');
    expect(Number(b[0]?.tannarx_birlik_snapshot)).toBe(78_000);
  });

  it('2.2-invariant — qoldiq JURNALDAN chiqadi', async () => {
    const materialId = await materialYarat('RULON', 'KV_M');

    await boshlangichQoldiq(
      sql,
      {
        materialId,
        filialId: FILIAL,
        bolaklar: [{ eniM: 3.0, boyiM: 28.0 }],
        miqdor: null,
        tannarxBirlik: '78000',
        izoh: null,
      },
      XODIM,
    );

    const j = await sql<{ turi: string; miqdor_kv_m: string; tannarx_summa: string }[]>`
      SELECT oh.turi, oh.miqdor_kv_m, oh.tannarx_summa
      FROM ombor_harakat oh
      JOIN bolak b ON b.id = oh.bolak_id
      WHERE b.material_id = ${materialId}`;

    expect(j).toHaveLength(1);
    expect(j[0]?.turi).toBe('BOSHLANGICH');
    expect(Number(j[0]?.miqdor_kv_m)).toBe(84);
    expect(Number(j[0]?.tannarx_summa)).toBe(6_552_000);
  });

  it('QABUL S2.6 — yetkazib beruvchi qarziga TEGMAYDI', async () => {
    const materialId = await materialYarat('RULON', 'KV_M');

    await boshlangichQoldiq(
      sql,
      {
        materialId,
        filialId: FILIAL,
        bolaklar: [{ eniM: 3.0, boyiM: 28.0 }],
        miqdor: null,
        tannarxBirlik: '78000',
        izoh: null,
      },
      XODIM,
    );

    // Kirim hujjati YARATILMAYDI
    const k = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kirim_qator WHERE material_id = ${materialId}`;
    expect(k[0]?.n).toBe(0);

    // Bo'lak hech qaysi kirimga bog'lanmagan
    const b = await sql<{ kirim_qator_id: number | null }[]>`
      SELECT kirim_qator_id FROM bolak WHERE material_id = ${materialId}`;
    expect(b[0]?.kirim_qator_id).toBeNull();
  });

  it('IKKI MARTA kiritib bo\'lmaydi — qoldiq ikkilanmaydi', async () => {
    const materialId = await materialYarat('RULON', 'KV_M');
    const kirim = {
      materialId,
      filialId: FILIAL,
      bolaklar: [{ eniM: 3.0, boyiM: 28.0 }],
      miqdor: null,
      tannarxBirlik: '78000',
      izoh: null,
    };

    await boshlangichQoldiq(sql, kirim, XODIM);
    await expect(boshlangichQoldiq(sql, kirim, XODIM)).rejects.toThrow();

    const b = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM bolak WHERE material_id = ${materialId}`;
    expect(b[0]?.n).toBe(1);
  });

  it("2.1-invariant — rad etilsa hech narsa yozilmaydi", async () => {
    await expect(
      boshlangichQoldiq(
        sql,
        {
          materialId: 999_999_999,
          filialId: FILIAL,
          bolaklar: [{ eniM: 3.0, boyiM: 28.0 }],
          miqdor: null,
          tannarxBirlik: '78000',
          izoh: null,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("o'lcham ham, miqdor ham yo'q bo'lsa RAD ETILADI", async () => {
    const materialId = await materialYarat('RULON', 'KV_M');
    await expect(
      boshlangichQoldiq(
        sql,
        { materialId, filialId: FILIAL, bolaklar: [], miqdor: null, tannarxBirlik: '78000', izoh: null },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

// ─── Q-01 · Chiziqli material smda ────────────────────────────────────────

describe('Q-01 — chiziqli material SMDA yuritiladi', () => {
  it("karniz jurnalda `miqdor_sm` ustuniga tushadi, `miqdor_dona` ga emas", async () => {
    const materialId = await materialYarat('CHIZIQLI', 'SM', '300');

    const n = await boshlangichQoldiq(
      sql,
      {
        materialId,
        filialId: FILIAL,
        bolaklar: [],
        miqdor: 3000, // 10 shtanga × 300 sm
        tannarxBirlik: '220', // so'm/sm
        izoh: null,
      },
      XODIM,
    );

    // 3000 sm × 220 = 660 000
    expect(n.jamiSumma).toBe('660000.00');

    const j = await sql<{ miqdor_sm: string | null; miqdor_dona: number | null }[]>`
      SELECT oh.miqdor_sm, oh.miqdor_dona FROM ombor_harakat oh
      JOIN bolak b ON b.id = oh.bolak_id
      WHERE b.material_id = ${materialId}`;

    expect(Number(j[0]?.miqdor_sm)).toBe(3000);
    expect(j[0]?.miqdor_dona).toBeNull();
  });
});

// ─── DONA ─────────────────────────────────────────────────────────────────

describe("DONA — miqdor bilan", () => {
  it('380 dona kronshteyn, 5000 so\'mdan', async () => {
    const materialId = await materialYarat('DONA', 'DONA', '50');

    const n = await boshlangichQoldiq(
      sql,
      {
        materialId,
        filialId: FILIAL,
        bolaklar: [],
        miqdor: 380,
        tannarxBirlik: '5000',
        izoh: 'Tizimga o\'tish',
      },
      XODIM,
    );

    expect(n.bolakSoni).toBe(1);
    expect(n.jamiSumma).toBe('1900000.00');

    const j = await sql<{ miqdor_dona: number | null; izoh: string | null }[]>`
      SELECT oh.miqdor_dona, oh.izoh FROM ombor_harakat oh
      JOIN bolak b ON b.id = oh.bolak_id
      WHERE b.material_id = ${materialId}`;
    expect(j[0]?.miqdor_dona).toBe(380);
    expect(j[0]?.izoh).toBe("Tizimga o'tish");
  });
});
