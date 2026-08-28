/**
 * TZ 7.8 — dona materialni ombordan yechish (FIFO).
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * 2026-08-28 auditida chiqdi: aksessuar (kronshteyn, zanjir)
 * `pozitsiya_aksessuar` ga yozilardi, lekin ombordan HECH QAYERDA
 * yechilmasdi. Kronshteyn sotilib puli olinardi, qoldiq esa
 * kamaymasdi — farq har sotuvda ortib borardi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { donaYech, partiyalarTannarxi } from '@/lib/amal/dona-yechish';
import { BiznesXato } from '@/lib/xato';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

const FILIAL = 1;
const XODIM = 1;

const belgi = `DON-${String(Date.now()).slice(-8)}`;

let hisoblagich = 0;
const kod = (): string => {
  hisoblagich += 1;
  return `${belgi}-${String(hisoblagich)}`;
};

beforeAll(() => {
  sql = sinovUlanishi();
}, 120_000);

afterAll(async () => {
  await sql`UPDATE bolak SET faol = false WHERE kod LIKE ${`${belgi}%`}`;
  await sql`UPDATE material SET faol = false WHERE nom LIKE ${`${belgi}%`}`;
  await sql.end();
});

async function materialYarat(): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`${belgi} kronshteyn ${String(hisoblagich)}`}, 'DONA', 'dona', 'DONA', ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

/** Partiya qo'shadi — `tannarx` har partiyada boshqa, FIFO ko'rinsin */
async function partiya(materialId: number, miqdor: number, tannarx: number): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${materialId}, ${FILIAL}, ${kod()}, 'DONA', ${miqdor}, ${tannarx}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

describe('TZ 7.8 — FIFO bo‘yicha yechiladi', () => {
  it('eng eski partiya BIRINCHI ketadi', async () => {
    const m = await materialYarat();
    const eski = await partiya(m, 10, 5000);
    await partiya(m, 10, 7000);

    const n = await sql.begin(async (tx) => donaYech(tx, m, FILIAL, 4));

    expect(n.holat).toBe('YECHILDI');
    expect(n.partiyalar.length).toBe(1);
    expect(n.partiyalar[0]?.bolakId).toBe(eski);
    /** ⚠️ Eski partiyaning tannarxi — yangisiniki emas */
    expect(Number(n.partiyalar[0]?.tannarx)).toBe(5000);
  });

  it('bir partiya yetmasa keyingisiga o‘tadi', async () => {
    const m = await materialYarat();
    await partiya(m, 3, 5000);
    await partiya(m, 10, 7000);

    const n = await sql.begin(async (tx) => donaYech(tx, m, FILIAL, 8));

    expect(n.holat).toBe('YECHILDI');
    expect(n.partiyalar.length).toBe(2);
    expect(Number(n.partiyalar[0]?.miqdor)).toBe(3);
    expect(Number(n.partiyalar[1]?.miqdor)).toBe(5);

    /** 3 × 5000 + 5 × 7000 = 50 000 */
    expect(Number(partiyalarTannarxi(n.partiyalar))).toBe(50000);
  });

  it('qoldiq haqiqatan kamayadi', async () => {
    const m = await materialYarat();
    await partiya(m, 10, 5000);

    await sql.begin(async (tx) => donaYech(tx, m, FILIAL, 4));

    const q = await sql<{ jami: string }[]>`
      SELECT COALESCE(SUM(miqdor), 0)::text AS jami FROM bolak
      WHERE material_id = ${m} AND holat = 'BOSH' AND faol = true`;

    expect(Number(q[0]?.jami)).toBe(6);
  });

  it("partiya tugasa ISHLATILDI bo'ladi, o'chirilmaydi", async () => {
    const m = await materialYarat();
    const id = await partiya(m, 5, 5000);

    await sql.begin(async (tx) => donaYech(tx, m, FILIAL, 5));

    const q = await sql<{ holat: string; miqdor: string; faol: boolean }[]>`
      SELECT holat, miqdor::text, faol FROM bolak WHERE id = ${id}`;

    expect(q[0]?.holat).toBe('ISHLATILDI');
    expect(Number(q[0]?.miqdor)).toBe(0);
    /** ⚠️ Tannarx tarixi kerak (2.3-invariant) */
    expect(q[0]?.faol).toBe(true);
  });
});

describe('Yetmasa HECH NARSA yechilmaydi (2.1-invariant)', () => {
  it('yetmaganda YETMADI qaytadi va qoldiq o‘zgarmaydi', async () => {
    const m = await materialYarat();
    await partiya(m, 3, 5000);

    const n = await sql.begin(async (tx) => donaYech(tx, m, FILIAL, 10));

    expect(n.holat).toBe('YETMADI');
    expect(Number(n.mavjud)).toBe(3);

    /**
     * ⚠️ Yarim yechish BO'LMAYDI: 3 tasi ketib 7 tasi qarz bo'lib
     *    qolsa, ombor ham, buyurtma ham noto'g'ri holatda qolardi.
     */
    const q = await sql<{ jami: string }[]>`
      SELECT COALESCE(SUM(miqdor), 0)::text AS jami FROM bolak
      WHERE material_id = ${m} AND holat = 'BOSH' AND faol = true`;
    expect(Number(q[0]?.jami)).toBe(3);
  });

  it('umuman qoldiq bo‘lmasa ham YETMADI', async () => {
    const m = await materialYarat();
    const n = await sql.begin(async (tx) => donaYech(tx, m, FILIAL, 1));

    expect(n.holat).toBe('YETMADI');
    expect(Number(n.mavjud)).toBe(0);
  });

  it('nol yoki manfiy miqdor rad etiladi', async () => {
    const m = await materialYarat();
    await expect(sql.begin(async (tx) => donaYech(tx, m, FILIAL, 0))).rejects.toBeInstanceOf(
      BiznesXato,
    );
    await expect(sql.begin(async (tx) => donaYech(tx, m, FILIAL, -5))).rejects.toBeInstanceOf(
      BiznesXato,
    );
  });
});

describe('Filial ajratilgan', () => {
  it('boshqa filialning qoldig‘i ishlatilmaydi', async () => {
    const m = await materialYarat();

    const boshqa = await sql<{ id: number }[]>`
      SELECT id FROM filial WHERE id <> ${FILIAL} AND faol = true LIMIT 1`;
    const boshqaId = boshqa[0]?.id;

    if (boshqaId === undefined) return;

    await sql`
      INSERT INTO bolak (material_id, filial_id, kod, turi, miqdor,
                         tannarx_birlik_snapshot, yaratdi_id)
      VALUES (${m}, ${boshqaId}, ${kod()}, 'DONA', 100, 5000, ${XODIM})`;

    /** ⚠️ Boshqa filialda 100 ta bor, lekin bu yerda yo'q */
    const n = await sql.begin(async (tx) => donaYech(tx, m, FILIAL, 1));
    expect(n.holat).toBe('YETMADI');
  });
});
