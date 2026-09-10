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
 * o'chirsak, undan ham yomon bo'ladi. Qarzi bor mijozni o'chirsak
 * pul yo'qolgandek bo'lardi.
 *
 * ⚠️ MATERIAL BUNDAN MUSTASNO (egasi, 2026-09-06): omborda
 *    qoldig'i bo'lsa ham o'chiriladi. Buning o'rniga ombor QIYMATI
 *    hisoboti tuzatildi — nofaol materialning matosi ham sanaladi.
 *
 * Shuning uchun testning asosiy qismi — nima o'chirilMASLIGI.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nofaolQil, qaytar } from '@/lib/amal/nofaol';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';
import { omborQiymati } from '@/app/(panel)/hisobot/malumot';

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
  await sql.end({ timeout: 5 });
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
  /**
   * ⚠️ QOIDA O'ZGARDI (egasi, 2026-09-06).
   *
   *    Ilgari omborda qoldig'i bor material O'CHIRILMASDI. Egasi
   *    to'siqni olib tashlashni so'radi: material ro'yxatdan
   *    chiqarilishi «buni endi sotmaymiz» degani, omborda qolgani
   *    esa baribir sotilib yoki hisobdan chiqarilib ketadi.
   *
   *    Test endi shu qoidani tekshiradi — va eng muhimi, PUL
   *    yo'qolmasligini.
   */
  it("omborda qoldig'i bor material O'CHIRILADI", async () => {
    const id = await materialYarat(nom('qoldiqli'));

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${id}, ${FILIAL}, ${`${belgi}-B${String(hisoblagich)}`},
              'RULON', 3, 30, 78000, ${XODIM})`;

    const n = await nofaolQil(sql, 'material', id, XODIM);
    expect(n.holat).toBe('OCHIRILDI');

    const q = await sql<{ faol: boolean }[]>`
      SELECT faol FROM material WHERE id = ${id}`;
    expect(q[0]?.faol).toBe(false);
  });

  /**
   * ⚠️ ENG MUHIM TEKSHIRUV — PUL YO'QOLMAYDI.
   *
   *    To'siq bejiz qo'yilmagan edi: `omborQiymati` hisoboti faqat
   *    FAOL materialni sanardi. Ya'ni material nofaol qilinganda
   *    uning matosi omborda TURIB, ombor qiymatidan jimgina
   *    chiqib ketardi.
   *
   *    To'siq olib tashlangani uchun hisobot ham tuzatildi. Bu test
   *    o'sha tuzatishni ushlab turadi: 3 × 30 × 78 000 = 7 020 000
   *    so'm nofaol qilingandan KEYIN ham sanalishi shart.
   */
  it("nofaol material qoldig'i ombor QIYMATIDA qoladi", async () => {
    const id = await materialYarat(nom('qiymatli'));

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${id}, ${FILIAL}, ${`${belgi}-Q${String(hisoblagich)}`},
              'RULON', 3, 30, 78000, ${XODIM})`;

    const oldin = Number(await omborQiymati(FILIAL));

    await nofaolQil(sql, 'material', id, XODIM);

    const keyin = Number(await omborQiymati(FILIAL));

    // Qiymat KAMAYMAYDI — mato omborda turibdi
    expect(keyin).toBeCloseTo(oldin, 2);
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
  /**
   * ⚠️ MISOL GURUHDA, MATERIALDA EMAS.
   *
   *    Ilgari bu test materialni ishlatardi: omborda qoldig'i bor
   *    material to'silardi. 2026-09-06 da egasi to'siqni olib
   *    tashlashni so'radi va material endi HECH QACHON
   *    to'silmaydi — ya'ni u bu invariant uchun misol bo'la
   *    olmaydi.
   *
   *    Guruh esa to'silishda qoladi: ichida material bo'lsa
   *    o'chirilmaydi.
   */
  it("to'silgan yozuvda ochirildi sanasi yozilmaydi", async () => {
    const g = await sql<{ id: number }[]>`
      INSERT INTO almashtirish_guruh (nom, yaratdi_id)
      VALUES (${nom('sanasiz guruh')}, ${XODIM}) RETURNING id`;
    const guruhId = g[0]?.id ?? 0;

    const materialId = await materialYarat(nom('guruhda qolgan'));
    await sql`UPDATE material SET almashtirish_guruh_id = ${guruhId} WHERE id = ${materialId}`;

    const n = await nofaolQil(sql, 'guruh', guruhId, XODIM);
    expect(n.holat).toBe('BAND');

    /**
     * ⚠️ Tekshiruv o'tmasa HECH NARSA o'zgarmasligi kerak —
     *    yarim o'chirilgan holat bo'lmaydi (2.1-invariant).
     */
    const q = await sql<{ faol: boolean; ochirildi: Date | null }[]>`
      SELECT faol, ochirildi FROM almashtirish_guruh WHERE id = ${guruhId}`;
    expect(q[0]?.faol).toBe(true);
    expect(q[0]?.ochirildi).toBeNull();
  });

  it("mavjud bo'lmagan yozuv xato beradi", async () => {
    await expect(nofaolQil(sql, 'material', 2_000_000_000, XODIM)).rejects.toThrow();
  });
});
