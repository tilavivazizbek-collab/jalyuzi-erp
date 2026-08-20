/**
 * TZ 15.1 · 2.1 · 2.2 · 2.3 · 2.5-invariant · TZ 2.4
 * AUDIT Z-05 (KRITIK) · U-06 · A-09
 *
 * Inventarizatsiya bazada: varaqa ochish, sanash, yakunlash.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { varaqaOch, varaqaYakunla, type SanashKiritmasi } from '@/lib/amal/inventarizatsiya';
import { pulMatn } from '@/lib/domain/pul';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId: number;
let donaId: number;

const FILIAL = 1;
const XODIM = 1;
const SANA = '2026-08-20';

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Inv sinov matosi ${belgi}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const d = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, yaratdi_id)
    VALUES (${`Inv sinov kronshteyni ${belgi}`}, 'DONA', 'quti', 'DONA', 50, ${XODIM})
    RETURNING id`;
  donaId = d[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

let hisoblagich = 0;

async function rulonYarat(
  eni = 3.0,
  boyi = 28.0,
  holat = 'BOSH',
  tannarx = 78_000,
): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m, holat,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-INV-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', ${eni}, ${boyi}, ${holat}, ${tannarx}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

async function donaYarat(miqdor = 380, tannarx = 5000): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${donaId}, ${FILIAL},
            ${`D-INV-${String(Date.now())}-${String(hisoblagich)}`},
            'DONA', ${miqdor}, ${tannarx}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

/** Varaqadagi qator id sini bo'lak bo'yicha topadi. */
async function qatorId(varaqaId: number, bolakId: number): Promise<number> {
  const q = await sql<{ id: number }[]>`
    SELECT id FROM inventarizatsiya_qator
    WHERE inventarizatsiya_id = ${varaqaId} AND bolak_id = ${bolakId}`;
  return q[0]?.id ?? 0;
}

// ─── 15.1 · Varaqa ochish ─────────────────────────────────────────────────

describe('TZ 15.1 — sanash varaqasi', () => {
  it('qisman inventarizatsiya — faqat tanlangan material tushadi', async () => {
    await rulonYarat();
    await donaYarat();

    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [donaId], izoh: null },
      XODIM,
    );

    const q = await sql<{ material_id: number }[]>`
      SELECT b.material_id FROM inventarizatsiya_qator iq
      JOIN bolak b ON b.id = iq.bolak_id
      WHERE iq.inventarizatsiya_id = ${v.varaqaId}`;

    expect(q.length).toBeGreaterThan(0);
    expect(q.every((r) => r.material_id === donaId)).toBe(true);
  });

  it("AUDIT U-06 — band bo'lak varaqada BAND belgisi bilan turadi", async () => {
    const bandId = await rulonYarat(3.0, 28.0, 'BAND');

    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    const q = await sql<{ band: boolean }[]>`
      SELECT band FROM inventarizatsiya_qator
      WHERE inventarizatsiya_id = ${v.varaqaId} AND bolak_id = ${bandId}`;
    expect(q[0]?.band).toBe(true);
  });

  it("AUDIT A-09 — yo'ldagi bo'lak YOLDA belgisi bilan turadi", async () => {
    const yoldaId = await rulonYarat(3.0, 28.0, 'YOLDA');

    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    const q = await sql<{ yolda: boolean }[]>`
      SELECT yolda FROM inventarizatsiya_qator
      WHERE inventarizatsiya_id = ${v.varaqaId} AND bolak_id = ${yoldaId}`;
    expect(q[0]?.yolda).toBe(true);
  });

  it("2.3-invariant — varaqa TIZIMDAGI holatni qotirib oladi", async () => {
    const id = await rulonYarat(3.0, 28.0);

    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    // Varaqa ochilgandan KEYIN bo'lak o'zgardi
    await sql`UPDATE bolak SET boyi_m = 20.00 WHERE id = ${id}`;

    const q = await sql<{ tizimda_boyi_m: string }[]>`
      SELECT tizimda_boyi_m FROM inventarizatsiya_qator
      WHERE inventarizatsiya_id = ${v.varaqaId} AND bolak_id = ${id}`;
    expect(Number(q[0]?.tizimda_boyi_m)).toBe(28.0);

    await sql`UPDATE bolak SET boyi_m = 28.00 WHERE id = ${id}`;
  });

  it("sanaladigan bo'lak yo'q bo'lsa varaqa OCHILMAYDI", async () => {
    const bosh = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
      VALUES (${`Inv bo'sh material ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
      RETURNING id`;

    await expect(
      varaqaOch(
        sql,
        { sana: SANA, filialId: FILIAL, materialIdlar: [bosh[0]?.id ?? 0], izoh: null },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

// ─── AUDIT Z-05 · KRITIK ──────────────────────────────────────────────────

describe('AUDIT Z-05 — metrda sanaladi, soxta farq chiqmaydi', () => {
  it("28 metr yozilsa farq NOL — 84 kv.m kutilmaydi", async () => {
    const id = await rulonYarat(3.0, 28.0);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    const n = await varaqaYakunla(
      sql,
      v.varaqaId,
      [{ qatorId: await qatorId(v.varaqaId, id), eniM: 3.0, boyiM: 28.0, miqdor: null, sabab: null, izoh: null }],
      XODIM,
    );

    expect(n.farqli).toBe(0);
    expect(pulMatn(n.jamiFarq)).toBe('0.00');

    // Farq yo'q — ombor jurnaliga yozuv TUSHMAYDI
    const j = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM ombor_harakat
      WHERE bolak_id = ${id} AND turi = 'INVENTARIZATSIYA'`;
    expect(j[0]?.n).toBe(0);
  });
});

// ─── 15.1 · Farq ──────────────────────────────────────────────────────────

describe('TZ 15.1 — farq chiqsa', () => {
  it("bo'yi 28 → 26: −6 kv.m, −468 000 so'm, bo'lak yangilanadi", async () => {
    const id = await rulonYarat(3.0, 28.0);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    const n = await varaqaYakunla(
      sql,
      v.varaqaId,
      [
        {
          qatorId: await qatorId(v.varaqaId, id),
          eniM: 3.0,
          boyiM: 26.0,
          miqdor: null,
          sabab: 'OLCHOV_XATOSI',
          izoh: null,
        },
      ],
      XODIM,
    );

    expect(n.farqli).toBe(1);
    expect(pulMatn(n.jamiFarq)).toBe('-468000.00');

    // 2.2-invariant — farq JURNALGA tushadi
    const j = await sql<{ miqdor_kv_m: string; tannarx_summa: string }[]>`
      SELECT miqdor_kv_m, tannarx_summa FROM ombor_harakat
      WHERE bolak_id = ${id} AND turi = 'INVENTARIZATSIYA'`;
    expect(j).toHaveLength(1);
    expect(Number(j[0]?.miqdor_kv_m)).toBe(-6);
    expect(Number(j[0]?.tannarx_summa)).toBe(-468_000);

    // Bo'lak HAQIQIY songa tenglashdi
    const b = await sql<{ boyi_m: string }[]>`SELECT boyi_m FROM bolak WHERE id = ${id}`;
    expect(Number(b[0]?.boyi_m)).toBe(26.0);
  });

  it('sababsiz farq — butun varaqa RAD ETILADI (2.1-invariant)', async () => {
    const id = await rulonYarat(3.0, 28.0);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    await expect(
      varaqaYakunla(
        sql,
        v.varaqaId,
        [
          {
            qatorId: await qatorId(v.varaqaId, id),
            eniM: 3.0,
            boyiM: 26.0,
            miqdor: null,
            sabab: null,
            izoh: null,
          },
        ],
        XODIM,
      ),
    ).rejects.toThrow();

    // Hech narsa yozilmadi
    const h = await sql<{ holat: string }[]>`
      SELECT holat FROM inventarizatsiya WHERE id = ${v.varaqaId}`;
    expect(h[0]?.holat).toBe('OCHIQ');

    const b = await sql<{ boyi_m: string }[]>`SELECT boyi_m FROM bolak WHERE id = ${id}`;
    expect(Number(b[0]?.boyi_m)).toBe(28.0);
  });

  it("ortiqcha chiqsa — musbat, xarajat KAMAYADI (daromad emas)", async () => {
    const id = await rulonYarat(3.0, 28.0);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    const n = await varaqaYakunla(
      sql,
      v.varaqaId,
      [
        {
          qatorId: await qatorId(v.varaqaId, id),
          eniM: 3.0,
          boyiM: 30.0,
          miqdor: null,
          sabab: 'OLCHOV_XATOSI',
          izoh: null,
        },
      ],
      XODIM,
    );

    expect(pulMatn(n.jamiFarq)).toBe('468000.00');
  });

  it('DONA — 380 dan 374 ga tushdi', async () => {
    const id = await donaYarat(380, 5000);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [donaId], izoh: null },
      XODIM,
    );

    const n = await varaqaYakunla(
      sql,
      v.varaqaId,
      [
        {
          qatorId: await qatorId(v.varaqaId, id),
          eniM: null,
          boyiM: null,
          miqdor: 374,
          sabab: 'YOQOLGAN',
          izoh: 'sanoqda topilmadi',
        },
      ],
      XODIM,
    );

    expect(pulMatn(n.jamiFarq)).toBe('-30000.00');

    const j = await sql<{ miqdor_dona: number }[]>`
      SELECT miqdor_dona FROM ombor_harakat
      WHERE bolak_id = ${id} AND turi = 'INVENTARIZATSIYA'`;
    expect(j[0]?.miqdor_dona).toBe(-6);

    const b = await sql<{ miqdor: string }[]>`SELECT miqdor FROM bolak WHERE id = ${id}`;
    expect(Number(b[0]?.miqdor)).toBe(374);
  });
});

// ─── 15.1 · Yakunlash qoidalari ───────────────────────────────────────────

describe('TZ 15.1 — yakunlash', () => {
  it('ikki marta yakunlab bo\'lmaydi', async () => {
    const id = await rulonYarat(3.0, 28.0);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );
    const k: SanashKiritmasi[] = [
      { qatorId: await qatorId(v.varaqaId, id), eniM: 3.0, boyiM: 28.0, miqdor: null, sabab: null, izoh: null },
    ];

    await varaqaYakunla(sql, v.varaqaId, k, XODIM);
    await expect(varaqaYakunla(sql, v.varaqaId, k, XODIM)).rejects.toThrow();
  });

  it("sanalmagan qator qoldiqqa TEGMAYDI (qisman sanash)", async () => {
    const a = await rulonYarat(3.0, 28.0);
    const b = await rulonYarat(2.0, 10.0);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    // Faqat `a` sanaladi
    await varaqaYakunla(
      sql,
      v.varaqaId,
      [
        {
          qatorId: await qatorId(v.varaqaId, a),
          eniM: 3.0, boyiM: 26.0, miqdor: null,
          sabab: 'OLCHOV_XATOSI', izoh: null,
        },
      ],
      XODIM,
    );

    const bq = await sql<{ boyi_m: string }[]>`SELECT boyi_m FROM bolak WHERE id = ${b}`;
    expect(Number(bq[0]?.boyi_m)).toBe(10.0);
  });

  it("AUDIT A-09 — yo'ldagi bo'lak sanalmaydi, yozilgan son ham hisobga olinmaydi", async () => {
    const id = await rulonYarat(3.0, 28.0, 'YOLDA');
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    const n = await varaqaYakunla(
      sql,
      v.varaqaId,
      [
        {
          qatorId: await qatorId(v.varaqaId, id),
          eniM: 1.0, boyiM: 1.0, miqdor: null,
          sabab: 'YOQOLGAN', izoh: null,
        },
      ],
      XODIM,
    );

    expect(n.farqli).toBe(0);
    const b = await sql<{ boyi_m: string }[]>`SELECT boyi_m FROM bolak WHERE id = ${id}`;
    expect(Number(b[0]?.boyi_m)).toBe(28.0);
  });

  it('TZ 2.4 — yakunlash audit jurnaliga tushadi', async () => {
    const id = await rulonYarat(3.0, 28.0);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [matoId], izoh: null },
      XODIM,
    );

    await varaqaYakunla(
      sql,
      v.varaqaId,
      [
        {
          qatorId: await qatorId(v.varaqaId, id),
          eniM: 3.0, boyiM: 25.0, miqdor: null,
          sabab: 'YOQOLGAN', izoh: null,
        },
      ],
      XODIM,
    );

    const a = await sql<{ amal: string; yangi_qiymat: unknown }[]>`
      SELECT amal, yangi_qiymat FROM audit_jurnal
      WHERE obyekt_turi = 'inventarizatsiya' AND obyekt_id = ${v.varaqaId}
        AND amal = 'YAKUNLASH'`;
    expect(a).toHaveLength(1);
    expect(JSON.stringify(a[0]?.yangi_qiymat)).toContain('YAKUNLANDI');
  });

  it('2.5-invariant — manfiy qoldiq RUXSAT etiladi va qaytariladi', async () => {
    const id = await donaYarat(10, 5000);
    const v = await varaqaOch(
      sql,
      { sana: SANA, filialId: FILIAL, materialIdlar: [donaId], izoh: null },
      XODIM,
    );

    const n = await varaqaYakunla(
      sql,
      v.varaqaId,
      [
        {
          qatorId: await qatorId(v.varaqaId, id),
          eniM: null, boyiM: null, miqdor: -3,
          sabab: 'NOTOGRI_KIRIM', izoh: 'ikki marta kiritilgan',
        },
      ],
      XODIM,
    );

    expect(n.manfiyQoldiq.length).toBeGreaterThan(0);
  });
});
