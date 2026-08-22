/**
 * TZ 12.9 · 6.10 · 12.1 · 2.1-invariant
 *
 * Ayirboshlash va umidsiz qarz.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ayirboshlash, umidsizQarz } from '@/lib/amal/ayirboshlash';
import { boshqaHodisa } from '@/lib/amal/xarajat';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let somKassa = 0;
let dollarKassa = 0;
let kartaKassa = 0;
let sotuvchiKassa = 0;

const FILIAL = 1;
const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const b = belgi();

  const kassaOl = async (
    turi: string,
    valyuta: string,
    xodim: number | null,
  ): Promise<number> => {
    const bor = await sql<{ id: number }[]>`
      SELECT id FROM kassa
      WHERE filial_id = ${FILIAL} AND turi = ${turi} AND valyuta = ${valyuta}
        AND xodim_id IS NOT DISTINCT FROM ${xodim}`;
    if (bor[0] !== undefined) return bor[0].id;

    const y = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${FILIAL}, ${xodim}, ${turi}, ${valyuta},
              ${`${turi} ${valyuta} ${b}`}, ${XODIM})
      RETURNING id`;
    return y[0]?.id ?? 0;
  };

  somKassa = await kassaOl('NAQD', 'SOM', null);
  dollarKassa = await kassaOl('NAQD', 'USD', null);
  kartaKassa = await kassaOl('KARTA', 'SOM', null);
  sotuvchiKassa = await kassaOl('NAQD', 'SOM', XODIM);
}, 120_000);

afterAll(async () => {
  await sql.end();
});

async function mijozYarat(): Promise<number> {
  const q = await sql<{ id: number }[]>`
    INSERT INTO mijoz (ism, telefon, yaratdi_id)
    VALUES (${`Umidsiz mijoz ${belgi()}`},
            ${`9966${String(Date.now()).slice(-5)}`}, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

// ─── TZ 12.9 · Ayirboshlash ───────────────────────────────────────────────

describe('TZ 12.9 — ayirboshlash', () => {
  it("1 000 $ × 13 200 = 13 200 000, komissiya 66 000 → 13 134 000", async () => {
    const n = await ayirboshlash(
      sql,
      {
        kimdanKassaId: dollarKassa,
        kimgaKassaId: somKassa,
        summa: '1000',
        kurs: '13200',
        komissiya: '66000',
        izoh: 'Dollarni sotdik',
      },
      FILIAL,
      XODIM,
    );

    expect(Number(n.ogirilgan)).toBe(13_200_000);
    expect(Number(n.kirgan)).toBe(13_134_000);

    const y = await sql<{ kod: string; summa: string; valyuta: string }[]>`
      SELECT kod, summa, valyuta FROM kassa_yozuv
      WHERE id IN (${n.chiqimId}, ${n.kirimId}) ORDER BY qator`;

    expect(Number(y[0]?.summa)).toBe(-1000);
    expect(y[0]?.valyuta).toBe('USD');
    expect(Number(y[1]?.summa)).toBe(13_134_000);
    expect(y[1]?.valyuta).toBe('SOM');

    // P-31 — ayirboshlashning O'Z kodlari, topshiriq (C9/K7) EMAS
    expect(y[0]?.kod).toBe('C11');
    expect(y[1]?.kod).toBe('K10');
  });

  it("kartadan naqdga — kurs ishlatilmaydi, faqat komissiya", async () => {
    const n = await ayirboshlash(
      sql,
      {
        kimdanKassaId: kartaKassa,
        kimgaKassaId: somKassa,
        summa: '5000000',
        kurs: '1',
        komissiya: '50000',
        izoh: 'Kartadan yechildi',
      },
      FILIAL,
      XODIM,
    );

    expect(Number(n.ogirilgan)).toBe(5_000_000);
    expect(Number(n.kirgan)).toBe(4_950_000);
  });

  it("TZ 12.9 — ayirboshlashning O'ZI xarajat EMAS, faqat KOMISSIYA", async () => {
    const n = await ayirboshlash(
      sql,
      {
        kimdanKassaId: dollarKassa,
        kimgaKassaId: somKassa,
        summa: '100',
        kurs: '13200',
        komissiya: '6600',
        izoh: 'sinov',
      },
      FILIAL,
      XODIM,
    );

    // Ikki kassa yozuvi xarajatga BOG'LANMAGAN
    const bogliq = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat
      WHERE kassa_yozuv_id IN (${n.chiqimId}, ${n.kirimId})`;
    expect(bogliq[0]?.n).toBe(0);

    // Komissiya alohida modda bilan, kassa yozuvisiz
    const x = await sql<{ modda: string; summa: string; kassa_yozuv_id: number | null }[]>`
      SELECT modda, summa, kassa_yozuv_id FROM xarajat WHERE id = ${n.xarajatId ?? 0}`;
    expect(x[0]?.modda).toBe('BANK_KOMISSIYASI');
    expect(Number(x[0]?.summa)).toBe(6600);
    expect(x[0]?.kassa_yozuv_id).toBeNull();
  });

  it("komissiyasiz ayirboshlashda xarajat umuman yozilmaydi", async () => {
    const n = await ayirboshlash(
      sql,
      {
        kimdanKassaId: dollarKassa,
        kimgaKassaId: somKassa,
        summa: '50',
        kurs: '13200',
        komissiya: '0',
        izoh: 'komissiyasiz',
      },
      FILIAL,
      XODIM,
    );
    expect(n.xarajatId).toBeNull();
  });

  it("2.1-invariant — ikki yozuv BIR MANBAGA bog'lanadi (12.9)", async () => {
    const n = await ayirboshlash(
      sql,
      {
        kimdanKassaId: dollarKassa,
        kimgaKassaId: somKassa,
        summa: '10',
        kurs: '13200',
        komissiya: '0',
        izoh: 'sinov',
      },
      FILIAL,
      XODIM,
    );

    const y = await sql<{ manba_turi: string; manba_id: number }[]>`
      SELECT manba_turi, manba_id FROM kassa_yozuv
      WHERE id IN (${n.chiqimId}, ${n.kirimId})`;

    expect(y[0]?.manba_turi).toBe('ayirboshlash');
    expect(y[0]?.manba_id).toBe(y[1]?.manba_id);
  });

  it('TZ 12.9 — FAQAT ADMIN kassalari', async () => {
    await expect(
      ayirboshlash(
        sql,
        {
          kimdanKassaId: sotuvchiKassa,
          kimgaKassaId: somKassa,
          summa: '100000',
          kurs: '1',
          komissiya: '0',
          izoh: 'x',
        },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("komissiya summadan katta bo'lsa RAD ETILADI", async () => {
    await expect(
      ayirboshlash(
        sql,
        {
          kimdanKassaId: dollarKassa,
          kimgaKassaId: somKassa,
          summa: '10',
          kurs: '13200',
          komissiya: '500000',
          izoh: 'x',
        },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("o'ziga o'zi ayirboshlab bo'lmaydi", async () => {
    await expect(
      ayirboshlash(
        sql,
        {
          kimdanKassaId: somKassa,
          kimgaKassaId: somKassa,
          summa: '100000',
          kurs: '1',
          komissiya: '0',
          izoh: 'x',
        },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('nol yoki manfiy kurs rad etiladi', async () => {
    await expect(
      ayirboshlash(
        sql,
        {
          kimdanKassaId: dollarKassa,
          kimgaKassaId: somKassa,
          summa: '100',
          kurs: '0',
          komissiya: '0',
          izoh: 'x',
        },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

// ─── TZ 6.10 · Umidsiz qarz ───────────────────────────────────────────────

describe('TZ 6.10 — umidsiz qarz', () => {
  it('qarz yopiladi va XARAJAT yoziladi, kassaga tegilmaydi', async () => {
    const mijozId = await mijozYarat();

    // Avval qarz yaratamiz
    await sql`
      INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                 manba_turi, manba_id, xodim_id)
      VALUES (${mijozId}, ${FILIAL}, 'SOTUV', 1500000, 'SOM',
              'sinov', ${mijozId}, ${XODIM})`;

    const n = await umidsizQarz(
      sql,
      {
        mijozId,
        summa: '1500000',
        valyuta: 'SOM',
        sabab: 'Mijoz bilan aloqa uzildi, bir yil qidirildi',
      },
      FILIAL,
      XODIM,
    );

    expect(Number(n.qolganQarz)).toBe(0);

    const x = await sql<{ modda: string; summa: string; kassa_yozuv_id: number | null }[]>`
      SELECT modda, summa, kassa_yozuv_id FROM xarajat WHERE id = ${n.xarajatId}`;
    expect(x[0]?.modda).toBe('UMIDSIZ_QARZ');
    expect(Number(x[0]?.summa)).toBe(1_500_000);
    // Pul kelmagan — kassaga tegilmaydi
    expect(x[0]?.kassa_yozuv_id).toBeNull();
  });

  it('TZ 2.4 — audit jurnaliga tushadi', async () => {
    const mijozId = await mijozYarat();

    await umidsizQarz(
      sql,
      { mijozId, summa: '200000', valyuta: 'SOM', sabab: 'Hisobdan chiqarildi' },
      FILIAL,
      XODIM,
    );

    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'mijoz' AND obyekt_id = ${mijozId}
        AND amal = 'UMIDSIZ_QARZ'`;
    expect(a[0]?.n).toBe(1);
  });

  it('sabab MAJBURIY', async () => {
    const mijozId = await mijozYarat();
    await expect(
      umidsizQarz(
        sql,
        { mijozId, summa: '100000', valyuta: 'SOM', sabab: '   ' },
        FILIAL,
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("keyin to'langan pul BALANSGA QO'SHILMAYDI — «boshqa kirim» (6.10)", async () => {
    const mijozId = await mijozYarat();

    await sql`
      INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                 manba_turi, manba_id, xodim_id)
      VALUES (${mijozId}, ${FILIAL}, 'SOTUV', 300000, 'SOM',
              'sinov', ${mijozId}, ${XODIM})`;

    await umidsizQarz(
      sql,
      { mijozId, summa: '300000', valyuta: 'SOM', sabab: 'Hisobdan chiqarildi' },
      FILIAL,
      XODIM,
    );

    // Mijoz keyin kelib to'ladi — K9 «boshqa kirim»
    await boshqaHodisa(
      sql,
      {
        kassaId: somKassa,
        summa: '300000',
        valyuta: 'SOM',
        kirimmi: true,
        izoh: 'Hisobdan chiqarilgan qarz qaytdi',
      },
      FILIAL,
      XODIM,
    );

    // ⚠️ Balans O'ZGARMAYDI — qarz allaqachon yopilgan
    const q = await sql<{ qarz: string }[]>`
      SELECT COALESCE(SUM(summa), 0)::text AS qarz FROM mijoz_harakat
      WHERE mijoz_id = ${mijozId}`;
    expect(Number(q[0]?.qarz)).toBe(0);
  });
});
