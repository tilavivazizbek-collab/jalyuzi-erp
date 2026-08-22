/**
 * TZ 20.9 · Q-28 — material narxining filial istisnosi.
 *
 * «Standart umumiy, filial o'zgartirishi mumkin.» Qator YO'Q bo'lsa
 * standart ishlaydi — shuning uchun «standartga qaytarish» qatorni
 * o'chirish demak.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { filialNarxiBelgila, filialNarxlari } from '@/lib/amal/filial-narx';
import { matoNarxi } from '@/lib/domain/narx';
import { pulMatn, som } from '@/lib/domain/pul';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let materialId = 0;
let filialA = 0;
let filialB = 0;

const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const b = belgi();

  filialA = 1;

  const yangi = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id)
    VALUES (${`Narx filiali ${b}`}, ${XODIM}) RETURNING id`;
  filialB = yangi[0]?.id ?? 0;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          sotuv_narx, yaratdi_id)
    VALUES (${`Narx matosi ${b}`}, 'RULON', 'rulon', 'KV_M', 120000, ${XODIM})
    RETURNING id`;
  materialId = m[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

describe('TZ 20.9 — filial narx istisnosi', () => {
  it("istisno yo'q bo'lsa standart ishlaydi (20.9.1)", async () => {
    const royxat = await filialNarxlari(sql, materialId);
    const b = royxat.find((r) => r.filialId === filialB);
    expect(b?.narx).toBeNull();
  });

  it('filial narxi qo\'yiladi va ro\'yxatda istisno bo\'lib ko\'rinadi', async () => {
    const n = await filialNarxiBelgila(
      sql,
      { materialId, filialId: filialB, narx: '114000' },
      XODIM,
    );
    expect(n.ozgardimi).toBe(true);

    const royxat = await filialNarxlari(sql, materialId);
    expect(Number(royxat.find((r) => r.filialId === filialB)?.narx)).toBe(114_000);
    // Boshqa filial tegilmaydi
    expect(royxat.find((r) => r.filialId === filialA)?.narx).toBeNull();
  });

  it("SQL zanjiri: COALESCE(filial, standart) — sotuv ekrani shundan o'qiydi", async () => {
    const q = await sql<{ narx: string }[]>`
      SELECT COALESCE(fn.sotuv_narx::text, m.sotuv_narx::text) AS narx
      FROM material m
      LEFT JOIN material_filial_narx fn
             ON fn.material_id = m.id AND fn.filial_id = ${filialB}
      WHERE m.id = ${materialId}`;
    expect(Number(q[0]?.narx)).toBe(114_000);

    const standart = await sql<{ narx: string }[]>`
      SELECT COALESCE(fn.sotuv_narx::text, m.sotuv_narx::text) AS narx
      FROM material m
      LEFT JOIN material_filial_narx fn
             ON fn.material_id = m.id AND fn.filial_id = ${filialA}
      WHERE m.id = ${materialId}`;
    expect(Number(standart[0]?.narx)).toBe(120_000);
  });

  it('20.9.3 — filial narxi → mijoz offseti → yaxlitlash', () => {
    // 114 000 − 3% = 110 580 → 100 gacha yaxlitlanadi → 110 600
    const narx = matoNarxi({
      standart: som('120000'),
      filialNarxi: som('114000'),
      offset: { turi: 'FOIZ', foiz: -3 },
      kurs: null,
    });
    expect(pulMatn(narx)).toBe('110600.00');
  });

  it("narx o'zgarishi audit jurnaliga tushadi (2.4)", async () => {
    await filialNarxiBelgila(
      sql,
      { materialId, filialId: filialB, narx: '113000' },
      XODIM,
    );

    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'material' AND obyekt_id = ${materialId}
        AND amal = 'NARX_OZGARTIRISH'`;
    expect((a[0]?.n ?? 0) >= 2).toBe(true);
  });

  it("bir xil narx qayta yozilsa jurnal to'ldirilmaydi", async () => {
    const oldin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'material' AND obyekt_id = ${materialId}
        AND amal = 'NARX_OZGARTIRISH'`;

    const n = await filialNarxiBelgila(
      sql,
      { materialId, filialId: filialB, narx: '113000' },
      XODIM,
    );
    expect(n.ozgardimi).toBe(false);

    const keyin = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'material' AND obyekt_id = ${materialId}
        AND amal = 'NARX_OZGARTIRISH'`;
    expect(keyin[0]?.n).toBe(oldin[0]?.n);
  });

  it("bo'sh narx istisnoni OLIB TASHLAYDI, nol qo'ymaydi", async () => {
    const n = await filialNarxiBelgila(
      sql,
      { materialId, filialId: filialB, narx: null },
      XODIM,
    );
    expect(n.ozgardimi).toBe(true);

    const qator = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM material_filial_narx
      WHERE material_id = ${materialId} AND filial_id = ${filialB}`;
    expect(qator[0]?.n).toBe(0);

    // Endi standart ishlaydi
    const royxat = await filialNarxlari(sql, materialId);
    expect(royxat.find((r) => r.filialId === filialB)?.narx).toBeNull();
  });

  it('manfiy narx rad etiladi', async () => {
    await expect(
      filialNarxiBelgila(
        sql,
        { materialId, filialId: filialB, narx: '-1' },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});
