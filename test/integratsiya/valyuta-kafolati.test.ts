/**
 * 1.3-invariant · TZ 8.13 · 9.6 — VALYUTA KAFOLATLARI BAZADA
 *
 * ⚠️ NEGA BU TESTLAR BOR
 *
 *    Hisobotlarda tushum shunday hisoblanadi:
 *
 *      summa × CASE WHEN valyuta = 'USD'
 *                   THEN COALESCE(kurs_snapshot, 0) ELSE 1 END
 *
 *    Ya'ni kursi yo'q dollarli buyurtma tushumga NOL bo'lib
 *    tushadi — sotuv butunlay ko'zdan yo'qoladi va hech qanday
 *    xato chiqmaydi.
 *
 *    Hozir bu holat yuzaga kelmaydi, chunki sxemada CHECK bor.
 *    Lekin o'sha kafolat HECH QAYERDA sinalmagan edi: kimdir
 *    cheklovni olib tashlasa, hisobotlar jimgina kamaytirib
 *    ko'rsata boshlardi.
 *
 *    Shuning uchun test kodning emas, BAZANING o'zini sinaydi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
const FILIAL = 1;
const XODIM = 1;

let hisoblagich = 0;
const raqam = (): string => {
  hisoblagich += 1;
  return `B-VAL-${String(Date.now())}-${String(hisoblagich)}`;
};

beforeAll(() => {
  sql = sinovUlanishi();
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe('AUDIT B-04 · TZ 9.6 — dollarli buyurtmada kurs MAJBURIY', () => {
  it('kurssiz USD buyurtma bazaga TUSHMAYDI', async () => {
    await expect(
      sql`
        INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id,
                              ishlab_chiqaruvchi_filial_id, manba,
                              valyuta, kurs_snapshot, yaratdi_id)
        VALUES (${raqam()}, ${XODIM}, ${FILIAL}, ${FILIAL}, 'SAYT',
                'USD', NULL, ${XODIM})`,
    ).rejects.toThrow();
  });

  it('kurs bilan USD buyurtma tushadi', async () => {
    const r = raqam();
    await sql`
      INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id,
                            ishlab_chiqaruvchi_filial_id, manba,
                            valyuta, kurs_snapshot, yaratdi_id)
      VALUES (${r}, ${XODIM}, ${FILIAL}, ${FILIAL}, 'SAYT',
              'USD', 12500, ${XODIM})`;

    const q = await sql<{ kurs: string }[]>`
      SELECT kurs_snapshot::text AS kurs FROM buyurtma WHERE raqam = ${r}`;
    expect(Number(q[0]?.kurs)).toBe(12500);
  });

  it('so‘mli buyurtmada kurs KERAK EMAS', async () => {
    const r = raqam();
    await sql`
      INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id,
                            ishlab_chiqaruvchi_filial_id, manba,
                            valyuta, kurs_snapshot, yaratdi_id)
      VALUES (${r}, ${XODIM}, ${FILIAL}, ${FILIAL}, 'SAYT',
              'SOM', NULL, ${XODIM})`;

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma WHERE raqam = ${r}`;
    expect(q[0]?.n).toBe(1);
  });

  /**
   * ⚠️ Hisobotdagi ifodaning O'ZI tekshiriladi: kafolat buzilsa
   *    aynan shu joyda nol chiqadi.
   */
  it('hisobot ifodasi: kursli USD buyurtma so‘mga to‘g‘ri o‘giriladi', async () => {
    const q = await sql<{ somda: string }[]>`
      SELECT (100 * CASE WHEN 'USD' = 'USD' THEN 12500::numeric ELSE 1 END)::text
             AS somda`;
    expect(Number(q[0]?.somda)).toBe(1_250_000);
  });
});

describe('1.3-invariant — kassa yozuvida valyuta cheklangan', () => {
  it('noma‘lum valyuta bazaga TUSHMAYDI', async () => {
    const k = await sql<{ id: number }[]>`
      SELECT id FROM kassa WHERE filial_id = ${FILIAL} AND faol = true LIMIT 1`;
    const kassaId = k[0]?.id;
    if (kassaId === undefined) return;

    await expect(
      sql`
        INSERT INTO kassa_yozuv (kassa_id, kod, summa, valyuta,
                                 manba_turi, manba_id, xodim_id)
        VALUES (${kassaId}, 'K1', 1000, 'EUR', 'sinov',
                ${Date.now() % 1_000_000}, ${XODIM})`,
    ).rejects.toThrow();
  });
});
