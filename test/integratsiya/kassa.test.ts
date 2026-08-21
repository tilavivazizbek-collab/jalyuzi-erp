/**
 * TZ 12.1 · 12.3 · 12.4 · 12.7 · 12.15 · 2.1 · 2.2-invariant · QISM 1 §6.5
 *
 * Kassa: idempotentlik, xarajat ajratilishi, storno, topshiriq.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  chiqimQil,
  kassaStorno,
  pulsizXarajat,
  topshiriqniQabulQil,
  topshiriqYubor,
} from '@/lib/amal/kassa';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let adminKassa = 0;
let sotuvchiKassa = 0;
let dollarKassa = 0;

const FILIAL = 1;
const XODIM = 1;
const SANA = '2026-08-21';

let hisoblagich = 0;
const manba = (): number => {
  hisoblagich += 1;
  return Number(`${String(Date.now()).slice(-8)}${String(hisoblagich)}`);
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const belgi = String(Date.now());

  const yarat = async (
    nom: string,
    turi: string,
    valyuta: string,
    xodim: number | null,
  ): Promise<number> => {
    const q = await sql<{ id: number }[]>`
      INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
      VALUES (${FILIAL}, ${xodim}, ${turi}, ${valyuta}, ${nom}, ${XODIM})
      ON CONFLICT DO NOTHING
      RETURNING id`;
    if (q[0] !== undefined) return q[0].id;

    // Allaqachon bor — mavjudini olamiz
    const bor = await sql<{ id: number }[]>`
      SELECT id FROM kassa
      WHERE filial_id = ${FILIAL} AND turi = ${turi} AND valyuta = ${valyuta}
        AND xodim_id IS NOT DISTINCT FROM ${xodim}`;
    return bor[0]?.id ?? 0;
  };

  adminKassa = await yarat(`Admin naqd ${belgi}`, 'NAQD', 'SOM', null);
  dollarKassa = await yarat(`Admin dollar ${belgi}`, 'NAQD', 'USD', null);
  sotuvchiKassa = await yarat(`Sotuvchi naqd ${belgi}`, 'NAQD', 'SOM', XODIM);
}, 120_000);

afterAll(async () => {
  await sql.end();
});

// ─── TZ 12.3 · Idempotentlik ──────────────────────────────────────────────

describe('TZ 12.3 — bir manbadan IKKINCHI yozuv yozilmaydi', () => {
  it("tugmani ikki marta bosish ikkinchi yozuv YARATMAYDI", async () => {
    const m = manba();
    const yozuv = {
      kassaId: adminKassa,
      kod: 'C7',
      summa: '-450000',
      valyuta: 'SOM' as const,
      manbaTuri: 'sinov',
      manbaId: m,
      qator: 1,
      izoh: 'Operatsion xarajat',
    };

    await chiqimQil(
      sql,
      { yozuv, filialId: FILIAL, sana: SANA, modda: 'OPERATSION' },
      XODIM,
    );

    await expect(
      chiqimQil(sql, { yozuv, filialId: FILIAL, sana: SANA, modda: 'OPERATSION' }, XODIM),
    ).rejects.toThrow();

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa_yozuv
      WHERE manba_turi = 'sinov' AND manba_id = ${m}`;
    expect(q[0]?.n).toBe(1);
  });

  it("bir manbadan turli QATOR yozilishi mumkin (12.3)", async () => {
    const m = manba();

    for (const qator of [1, 2]) {
      await chiqimQil(
        sql,
        {
          yozuv: {
            kassaId: adminKassa,
            kod: 'C7',
            summa: '-100000',
            valyuta: 'SOM',
            manbaTuri: 'sinov',
            manbaId: m,
            qator,
            izoh: null,
          },
          filialId: FILIAL,
          sana: SANA,
          modda: 'OPERATSION',
        },
        XODIM,
      );
    }

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa_yozuv
      WHERE manba_turi = 'sinov' AND manba_id = ${m}`;
    expect(q[0]?.n).toBe(2);
  });
});

// ─── TZ 12.1 · Xarajat ≠ kassa chiqimi ────────────────────────────────────

describe('TZ 12.1 — xarajat va kassa ALOHIDA', () => {
  it('operatsion xarajat: kassadan chiqadi VA xarajat yoziladi', async () => {
    const m = manba();
    const n = await chiqimQil(
      sql,
      {
        yozuv: {
          kassaId: adminKassa,
          kod: 'C7',
          summa: '-450000',
          valyuta: 'SOM',
          manbaTuri: 'sinov',
          manbaId: m,
          qator: 1,
          izoh: null,
        },
        filialId: FILIAL,
        sana: SANA,
        modda: 'OPERATSION',
      },
      XODIM,
    );

    expect(n.xarajatId).not.toBeNull();

    const x = await sql<{ summa: string; kassa_yozuv_id: number }[]>`
      SELECT summa, kassa_yozuv_id FROM xarajat WHERE id = ${n.xarajatId ?? 0}`;
    // Xarajat MUSBAT, kassa yozuvi manfiy
    expect(Number(x[0]?.summa)).toBe(450_000);
    expect(x[0]?.kassa_yozuv_id).toBe(n.kassaYozuvId);
  });

  it("ish haqi TO'LOVI kassadan chiqadi, lekin XARAJAT YOZILMAYDI", async () => {
    const m = manba();
    const n = await chiqimQil(
      sql,
      {
        yozuv: {
          kassaId: adminKassa,
          kod: 'C4',
          summa: '-940000',
          valyuta: 'SOM',
          manbaTuri: 'sinov',
          manbaId: m,
          qator: 1,
          izoh: "Ustaga ish haqi",
        },
        filialId: FILIAL,
        sana: SANA,
        modda: 'ISH_HAQI',
      },
      XODIM,
    );

    // Haq allaqachon «Tugatdim» da xarajat bo'lgan — ikki marta sanalmaydi
    expect(n.xarajatId).toBeNull();

    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat WHERE kassa_yozuv_id = ${n.kassaYozuvId}`;
    expect(x[0]?.n).toBe(0);
  });

  it('ombor braki: XARAJAT bor, kassa yozuvi YO\'Q', async () => {
    const m = manba();
    const id = await pulsizXarajat(
      sql,
      {
        sana: SANA,
        filialId: FILIAL,
        modda: 'OMBOR_BRAKI',
        summa: '7020000',
        valyuta: 'SOM',
        manbaTuri: 'sinov',
        manbaId: m,
        izoh: null,
      },
      XODIM,
    );

    const x = await sql<{ kassa_yozuv_id: number | null; summa: string }[]>`
      SELECT kassa_yozuv_id, summa FROM xarajat WHERE id = ${id}`;
    expect(x[0]?.kassa_yozuv_id).toBeNull();
    expect(Number(x[0]?.summa)).toBe(7_020_000);
  });

  it("pul chiqmaydigan modda kassa yozuviga BOG'LANMAYDI", async () => {
    const m = manba();
    await expect(
      chiqimQil(
        sql,
        {
          yozuv: {
            kassaId: adminKassa,
            kod: 'C7',
            summa: '-100000',
            valyuta: 'SOM',
            manbaTuri: 'sinov',
            manbaId: m,
            qator: 1,
            izoh: null,
          },
          filialId: FILIAL,
          sana: SANA,
          // OMBOR_BRAKI — pul chiqmaydigan modda (12.1)
          modda: 'OMBOR_BRAKI',
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});

// ─── QISM 1 §1.3 · Valyuta ────────────────────────────────────────────────

describe("QISM 1 §1.3 — kassa valyutasi to'lov valyutasiga mos kelishi shart", () => {
  it("so'm kassasiga dollar yozib bo'lmaydi", async () => {
    const m = manba();
    await expect(
      chiqimQil(
        sql,
        {
          yozuv: {
            kassaId: adminKassa,
            kod: 'C7',
            summa: '-100',
            valyuta: 'USD',
            manbaTuri: 'sinov',
            manbaId: m,
            qator: 1,
            izoh: null,
          },
          filialId: FILIAL,
          sana: SANA,
          modda: 'OPERATSION',
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("dollar kassasiga dollar yoziladi", async () => {
    const m = manba();
    const n = await chiqimQil(
      sql,
      {
        yozuv: {
          kassaId: dollarKassa,
          kod: 'C7',
          summa: '-100',
          valyuta: 'USD',
          manbaTuri: 'sinov',
          manbaId: m,
          qator: 1,
          izoh: null,
        },
        filialId: FILIAL,
        sana: SANA,
        modda: 'OPERATSION',
      },
      XODIM,
    );
    expect(n.kassaYozuvId).toBeGreaterThan(0);
  });
});

// ─── QISM 1 §6.5 · O'zgarmaslik ───────────────────────────────────────────

describe("QISM 1 §6.5 — kassa yozuvi o'zgarmas", () => {
  it('UPDATE rad etiladi', async () => {
    const m = manba();
    const n = await chiqimQil(
      sql,
      {
        yozuv: {
          kassaId: adminKassa,
          kod: 'C7',
          summa: '-50000',
          valyuta: 'SOM',
          manbaTuri: 'sinov',
          manbaId: m,
          qator: 1,
          izoh: null,
        },
        filialId: FILIAL,
        sana: SANA,
        modda: 'OPERATSION',
      },
      XODIM,
    );

    await expect(
      sql`UPDATE kassa_yozuv SET summa = -1 WHERE id = ${n.kassaYozuvId}`,
    ).rejects.toThrow();
  });

  it('DELETE rad etiladi', async () => {
    const m = manba();
    const n = await chiqimQil(
      sql,
      {
        yozuv: {
          kassaId: adminKassa,
          kod: 'C7',
          summa: '-50000',
          valyuta: 'SOM',
          manbaTuri: 'sinov',
          manbaId: m,
          qator: 1,
          izoh: null,
        },
        filialId: FILIAL,
        sana: SANA,
        modda: 'OPERATSION',
      },
      XODIM,
    );

    await expect(
      sql`DELETE FROM kassa_yozuv WHERE id = ${n.kassaYozuvId}`,
    ).rejects.toThrow();
  });
});

// ─── TZ 12.15 · Storno ────────────────────────────────────────────────────

describe('TZ 12.15 — bitta yozuvga BITTA storno', () => {
  async function yozuvYarat(): Promise<number> {
    const n = await chiqimQil(
      sql,
      {
        yozuv: {
          kassaId: adminKassa,
          kod: 'C7',
          summa: '-300000',
          valyuta: 'SOM',
          manbaTuri: 'sinov',
          manbaId: manba(),
          qator: 1,
          izoh: null,
        },
        filialId: FILIAL,
        sana: SANA,
        modda: 'OPERATSION',
      },
      XODIM,
    );
    return n.kassaYozuvId;
  }

  it('teskari yozuv qo\'shiladi, ESKISI joyida qoladi (§6.5)', async () => {
    const yozuvId = await yozuvYarat();
    const n = await kassaStorno(sql, yozuvId, 'Xato kiritilgan', XODIM);

    const q = await sql<{ summa: string; storno_id: number | null }[]>`
      SELECT summa, storno_id FROM kassa_yozuv WHERE id IN (${yozuvId}, ${n.stornoId})
      ORDER BY id`;

    expect(Number(q[0]?.summa)).toBe(-300_000);
    expect(q[0]?.storno_id).toBeNull();
    expect(Number(q[1]?.summa)).toBe(300_000);
    expect(q[1]?.storno_id).toBe(yozuvId);
  });

  it('ikkinchi storno RAD ETILADI', async () => {
    const yozuvId = await yozuvYarat();
    await kassaStorno(sql, yozuvId, 'birinchi', XODIM);
    await expect(kassaStorno(sql, yozuvId, 'ikkinchi', XODIM)).rejects.toThrow();
  });

  it('sababsiz storno rad etiladi', async () => {
    const yozuvId = await yozuvYarat();
    await expect(kassaStorno(sql, yozuvId, '   ', XODIM)).rejects.toThrow();
  });

  it('xarajat ham teskari yoziladi — foyda-zarar to\'g\'ri qoladi', async () => {
    const yozuvId = await yozuvYarat();
    const n = await kassaStorno(sql, yozuvId, 'Xato', XODIM);

    const x = await sql<{ summa: string }[]>`
      SELECT summa FROM xarajat WHERE kassa_yozuv_id = ${n.stornoId}`;
    expect(Number(x[0]?.summa)).toBe(-300_000);
  });
});

// ─── TZ 12.4 · 12.7 · Topshiriq ───────────────────────────────────────────

describe("TZ 12.4 — tasdiqlash pul yaratmaydi, topshiriqda pul QABULDA ko'chadi", () => {
  it("jo'natilganda kassa yozuvi YOZILMAYDI", async () => {
    const t = await topshiriqYubor(
      sql,
      {
        kimdanKassaId: sotuvchiKassa,
        kimgaKassaId: adminKassa,
        summa: '1000000',
        valyuta: 'SOM',
        izoh: null,
      },
      XODIM,
    );

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kassa_yozuv
      WHERE manba_turi = 'topshiriq' AND manba_id = ${t.topshiriqId}`;
    expect(q[0]?.n).toBe(0);
  });

  it('qabul qilinganda IKKI yozuv tushadi — chiqim va kirim', async () => {
    const t = await topshiriqYubor(
      sql,
      {
        kimdanKassaId: sotuvchiKassa,
        kimgaKassaId: adminKassa,
        summa: '1000000',
        valyuta: 'SOM',
        izoh: null,
      },
      XODIM,
    );

    const n = await topshiriqniQabulQil(sql, t.topshiriqId, XODIM);

    const q = await sql<{ kod: string; summa: string; kassa_id: number }[]>`
      SELECT kod, summa, kassa_id FROM kassa_yozuv
      WHERE id IN (${n.chiqimId}, ${n.kirimId}) ORDER BY id`;

    expect(q[0]?.kod).toBe('C9');
    expect(Number(q[0]?.summa)).toBe(-1_000_000);
    expect(q[0]?.kassa_id).toBe(sotuvchiKassa);

    expect(q[1]?.kod).toBe('K7');
    expect(Number(q[1]?.summa)).toBe(1_000_000);
    expect(q[1]?.kassa_id).toBe(adminKassa);

    // 12.1 — kassalar orasidagi ko'chish XARAJAT EMAS
    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat
      WHERE kassa_yozuv_id IN (${n.chiqimId}, ${n.kirimId})`;
    expect(x[0]?.n).toBe(0);
  });

  it('ikki marta qabul qilib bo\'lmaydi', async () => {
    const t = await topshiriqYubor(
      sql,
      {
        kimdanKassaId: sotuvchiKassa,
        kimgaKassaId: adminKassa,
        summa: '500000',
        valyuta: 'SOM',
        izoh: null,
      },
      XODIM,
    );

    await topshiriqniQabulQil(sql, t.topshiriqId, XODIM);
    await expect(topshiriqniQabulQil(sql, t.topshiriqId, XODIM)).rejects.toThrow();
  });

  it("o'ziga o'zi topshirib bo'lmaydi", async () => {
    await expect(
      topshiriqYubor(
        sql,
        {
          kimdanKassaId: adminKassa,
          kimgaKassaId: adminKassa,
          summa: '100000',
          valyuta: 'SOM',
          izoh: null,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('valyutasi boshqa kassaga topshirib bo\'lmaydi', async () => {
    await expect(
      topshiriqYubor(
        sql,
        {
          kimdanKassaId: sotuvchiKassa,
          kimgaKassaId: dollarKassa,
          summa: '100000',
          valyuta: 'SOM',
          izoh: null,
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });
});
