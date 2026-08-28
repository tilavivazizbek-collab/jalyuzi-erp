/**
 * O'chirish (nofaol qilish) — §3 · 2.3-invariant.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * 2026-08-28 auditida chiqdi: tizimda O'CHIRISH UMUMAN YO'Q edi.
 * Eski keraksiz material, guruh yoki mijoz ro'yxatlarda abadiy
 * qolardi.
 *
 * Lekin o'chirishning o'zi yetarli emas: ishlatilayotgan yozuvni
 * o'chirsak, undan ham yomon bo'ladi. Omborda qoldig'i bor
 * materialni o'chirsak qoldiq egasiz qolardi; qarzi bor mijozni
 * o'chirsak pul yo'qolgandek bo'lardi.
 *
 * Shuning uchun testning asosiy qismi — nima o'chirilMASLIGI.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nofaolQil, qaytar } from '@/lib/amal/nofaol';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

const FILIAL = 1;
const XODIM = 1;

const belgi = `NOF-${String(Date.now()).slice(-8)}`;

let hisoblagich = 0;
const nom = (qism: string): string => {
  hisoblagich += 1;
  return `${belgi} ${qism}${String(hisoblagich)}`;
};

beforeAll(() => {
  sql = sinovUlanishi();
}, 120_000);

afterAll(async () => {
  await sql.end();
});

async function materialYarat(nomi: string): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${nomi}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

// ─── Oddiy holat ─────────────────────────────────────────────────────────

describe("Bo'sh yozuv o'chiriladi", () => {
  it("material nofaol bo'ladi va ro'yxatdan chiqadi", async () => {
    const id = await materialYarat(nom('bosh material'));

    const n = await nofaolQil(sql, 'material', id, XODIM);
    expect(n.holat).toBe('OCHIRILDI');

    const q = await sql<{ faol: boolean; ochirildi: Date | null }[]>`
      SELECT faol, ochirildi FROM material WHERE id = ${id}`;

    expect(q[0]?.faol).toBe(false);
    /** ⚠️ Sana ham yoziladi — qachon o'chirilgani tarixda qoladi */
    expect(q[0]?.ochirildi).not.toBeNull();
  });

  it("yozuv O'CHIRILMAYDI — faqat nofaol bo'ladi (§3)", async () => {
    const id = await materialYarat(nom('saqlanadi'));
    await nofaolQil(sql, 'material', id, XODIM);

    /**
     * ⚠️ Qator BAZADA QOLADI. Eski buyurtmada uning nomi
     *    ko'rinib turishi kerak (2.3-invariant).
     */
    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM material WHERE id = ${id}`;
    expect(q[0]?.n).toBe(1);
  });

  it("ikkinchi marta o'chirish xato bermaydi", async () => {
    const id = await materialYarat(nom('takror'));
    await nofaolQil(sql, 'material', id, XODIM);

    /** Odam tugmani ikki marta bossa xato chiqmasligi kerak */
    const n = await nofaolQil(sql, 'material', id, XODIM);
    expect(n.holat).toBe('OCHIRILDI');
  });

  it('qaytarish mumkin', async () => {
    const id = await materialYarat(nom('qaytariladi'));
    await nofaolQil(sql, 'material', id, XODIM);
    await qaytar(sql, 'material', id, XODIM);

    const q = await sql<{ faol: boolean; ochirildi: Date | null }[]>`
      SELECT faol, ochirildi FROM material WHERE id = ${id}`;
    expect(q[0]?.faol).toBe(true);
    expect(q[0]?.ochirildi).toBeNull();
  });
});

// ─── Ishlatilayotgani to'siladi ──────────────────────────────────────────

describe("Ishlatilayotgan yozuv O'CHIRILMAYDI", () => {
  it("omborda qoldig'i bor material to'siladi", async () => {
    const id = await materialYarat(nom('qoldiqli'));

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${id}, ${FILIAL}, ${`${belgi}-B${String(hisoblagich)}`},
              'RULON', 3, 30, 78000, ${XODIM})`;

    const n = await nofaolQil(sql, 'material', id, XODIM);

    expect(n.holat).toBe('BAND');
    /** ⚠️ Sabab TUSHUNARLI bo'lishi kerak, raqamli kod emas */
    expect(n.sabab).toContain('omborda');
    expect(n.sabab).toContain('1');

    const q = await sql<{ faol: boolean }[]>`
      SELECT faol FROM material WHERE id = ${id}`;
    expect(q[0]?.faol).toBe(true);
  });

  it("guruhda material bo'lsa to'siladi", async () => {
    const g = await sql<{ id: number }[]>`
      INSERT INTO almashtirish_guruh (nom, yaratdi_id)
      VALUES (${nom('guruh')}, ${XODIM}) RETURNING id`;
    const guruhId = g[0]?.id ?? 0;

    const materialId = await materialYarat(nom('guruhdagi'));
    await sql`UPDATE material SET almashtirish_guruh_id = ${guruhId} WHERE id = ${materialId}`;

    const n = await nofaolQil(sql, 'guruh', guruhId, XODIM);

    expect(n.holat).toBe('BAND');
    expect(n.sabab).toContain('material');
  });

  it("guruh bo'shatilgach o'chiriladi", async () => {
    const g = await sql<{ id: number }[]>`
      INSERT INTO almashtirish_guruh (nom, yaratdi_id)
      VALUES (${nom('bosh guruh')}, ${XODIM}) RETURNING id`;

    const n = await nofaolQil(sql, 'guruh', g[0]?.id ?? 0, XODIM);
    expect(n.holat).toBe('OCHIRILDI');
  });

  it("bosh filial hech qachon o'chirilmaydi", async () => {
    const f = await sql<{ id: number }[]>`
      SELECT id FROM filial WHERE bosh = true LIMIT 1`;

    const n = await nofaolQil(sql, 'filial', f[0]?.id ?? 0, XODIM);

    expect(n.holat).toBe('BAND');
    expect(n.sabab).toContain('bosh filial');
  });
});

// ─── 2.1-invariant ───────────────────────────────────────────────────────

describe('Yarim bajarilgan amal qolmaydi', () => {
  it("to'silgan yozuvda `ochirildi` sanasi yozilmaydi", async () => {
    const id = await materialYarat(nom('sanasiz'));

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${id}, ${FILIAL}, ${`${belgi}-S${String(hisoblagich)}`},
              'RULON', 2, 20, 50000, ${XODIM})`;

    await nofaolQil(sql, 'material', id, XODIM);

    /**
     * ⚠️ Tekshiruv o'tmasa HECH NARSA o'zgarmasligi kerak —
     *    yarim o'chirilgan holat bo'lmaydi.
     */
    const q = await sql<{ faol: boolean; ochirildi: Date | null }[]>`
      SELECT faol, ochirildi FROM material WHERE id = ${id}`;
    expect(q[0]?.faol).toBe(true);
    expect(q[0]?.ochirildi).toBeNull();
  });

  it("mavjud bo'lmagan yozuv xato beradi", async () => {
    await expect(nofaolQil(sql, 'material', 2_000_000_000, XODIM)).rejects.toThrow();
  });
});
