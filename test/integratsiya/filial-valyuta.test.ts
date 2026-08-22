/**
 * TZ 22.5 · 22.6.3 · 14.5 — filiallararo DOLLARLI harakat.
 *
 * ⚠️ `filial_harakat` da baza cheklovi bor:
 *    `valyuta <> 'USD' OR kurs_snapshot IS NOT NULL`.
 *
 *    Dollarli topshiriq va to'lov kursni yozmasa, amal bazaga yetib
 *    borgach yiqiladi va sabab tushunarsiz bo'ladi. Bu yerda ikkala
 *    yo'l ham dollarda sinaladi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { topshiriqniQabulQil, topshiriqYubor } from '@/lib/amal/kassa';
import { filialQarzTolovi } from '@/lib/amal/filial-hisob';
import { joriyKurs } from '@/lib/amal/kurs';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let filialA = 0;
let filialB = 0;
let sotuvchiKassa = 0;
let adminKassaB = 0;
let adminKassaA = 0;

const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

/**
 * ⚠️ `kassa_bitta` — bir filialda bir xodimga bir turdagi bir valyutada
 *    FAQAT BITTA kassa. Shuning uchun avval qidiriladi, keyin
 *    yaratiladi: test har yurishda o'tishi shart (QOIDALAR §6).
 */
async function kassaOl(
  filialId: number,
  xodim: number | null,
  valyuta: string,
): Promise<number> {
  const bor = await sql<{ id: number }[]>`
    SELECT id FROM kassa
    WHERE filial_id = ${filialId} AND turi = 'NAQD' AND valyuta = ${valyuta}
      AND xodim_id IS NOT DISTINCT FROM ${xodim}`;
  if (bor[0] !== undefined) return bor[0].id;

  const q = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${filialId}, ${xodim}, 'NAQD', ${valyuta},
            ${`Valyuta kassa ${belgi()}`}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

beforeAll(async () => {
  sql = sinovUlanishi();

  const f = await sql<{ id: number }[]>`
    SELECT id FROM filial WHERE faol = true ORDER BY bosh DESC LIMIT 1`;
  filialA = f[0]?.id ?? 1;

  const b = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id)
    VALUES (${`Valyuta filiali ${belgi()}`}, ${XODIM}) RETURNING id`;
  filialB = b[0]?.id ?? 0;

  sotuvchiKassa = await kassaOl(filialA, XODIM, 'USD');
  adminKassaB = await kassaOl(filialB, null, 'USD');
  adminKassaA = await kassaOl(filialA, null, 'USD');

  /**
   * Sotuvchi kassasiga dollar tushsin — topshirish uchun.
   *
   * ⚠️ `kassa_yozuv_manba` — bir manbaga bir yozuv (P-26). Qat'iy
   *    `manba_id` bilan ikkinchi yurish yiqilardi, shuning uchun
   *    ketma-ketlikdan noyob raqam olinadi (QOIDALAR §6).
   */
  const manba = await sql<{ n: number }[]>`
    SELECT nextval('qolda_manba_seq')::int AS n`;

  await sql`
    INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta, manba_turi,
                             manba_id, qator, izoh, xodim_id)
    VALUES (${sotuvchiKassa}, 'K1', 5000, 'USD', 'sinov',
            ${manba[0]?.n ?? 0}, 1, 'Sinov kirimi', ${XODIM})`;

  // 14.5 — kurs bo'lmasa dollarli yozuv yozib bo'lmaydi
  const bugun = new Date().toISOString().slice(0, 10);
  await sql`
    INSERT INTO kurs_tarix (sana, qiymat, yaratdi_id)
    VALUES (${bugun}, 13200, ${XODIM})
    ON CONFLICT (sana) DO NOTHING`;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

describe('TZ 14.5 — joriy kurs', () => {
  it('eng oxirgi sana bo\'yicha kurs qaytadi', async () => {
    const k = await joriyKurs(sql);
    expect(k).not.toBeNull();
    expect(Number(k)).toBeGreaterThan(0);
  });
});

describe('TZ 22.5 — dollarli topshiriq boshqa filialga', () => {
  it("qarz DOLLARDA yoziladi va kurs snapshot bilan qotadi", async () => {
    const t = await topshiriqYubor(
      sql,
      {
        kimdanKassaId: sotuvchiKassa,
        kimgaKassaId: adminKassaB,
        summa: '1000',
        valyuta: 'USD',
        izoh: 'Dollarni boshqa filialga topshirdim',
      },
      XODIM,
    );

    await topshiriqniQabulQil(sql, t.topshiriqId, XODIM);

    const h = await sql<
      { summa: string; valyuta: string; kurs_snapshot: string | null }[]
    >`
      SELECT summa::text, valyuta, kurs_snapshot::text
      FROM filial_harakat
      WHERE manba_turi = 'topshiriq' AND manba_id = ${t.topshiriqId}`;

    expect(h).toHaveLength(1);
    expect(h[0]?.valyuta).toBe('USD');
    expect(Number(h[0]?.summa)).toBe(1000);
    // ⚠️ Baza cheklovi: dollarli yozuvda kurs MAJBURIY
    expect(h[0]?.kurs_snapshot).not.toBeNull();
    expect(Number(h[0]?.kurs_snapshot)).toBeGreaterThan(0);
  });

  it('22.5 — qabul qilgan filial topshirganga qarzdor', async () => {
    const t = await topshiriqYubor(
      sql,
      {
        kimdanKassaId: sotuvchiKassa,
        kimgaKassaId: adminKassaB,
        summa: '200',
        valyuta: 'USD',
        izoh: 'sinov',
      },
      XODIM,
    );
    await topshiriqniQabulQil(sql, t.topshiriqId, XODIM);

    const h = await sql<{ kimdan: number; kimga: number }[]>`
      SELECT kimdan_filial_id AS kimdan, kimga_filial_id AS kimga
      FROM filial_harakat
      WHERE manba_turi = 'topshiriq' AND manba_id = ${t.topshiriqId}`;

    // Pul B ga bordi → B, A ga qarzdor
    expect(h[0]?.kimdan).toBe(filialB);
    expect(h[0]?.kimga).toBe(filialA);
  });
});

describe('TZ 22.6.3 — dollarli qarz to\'lovi', () => {
  it("to'lov yozuvi ham kurs snapshot bilan tushadi", async () => {
    const n = await filialQarzTolovi(
      sql,
      {
        kimdanKassaId: adminKassaB,
        kimgaKassaId: adminKassaA,
        summa: '300',
        izoh: "Dollarli qarz to'lovi",
      },
      XODIM,
    );

    const h = await sql<{ valyuta: string; kurs_snapshot: string | null }[]>`
      SELECT valyuta, kurs_snapshot::text FROM filial_harakat
      WHERE id = ${n.filialHarakatId}`;

    expect(h[0]?.valyuta).toBe('USD');
    expect(h[0]?.kurs_snapshot).not.toBeNull();
  });
});
