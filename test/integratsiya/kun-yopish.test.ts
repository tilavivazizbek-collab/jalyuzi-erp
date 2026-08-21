/**
 * TZ 12.17 · K-09 · 2.1 · 2.2-invariant
 *
 * Kun yopish — kassaning yuragi.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chiqimQil } from '@/lib/amal/kassa';
import { kunHolati, kunniQaytaOch, kunniYop, kunYopiqmi } from '@/lib/amal/kun-yopish';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let kassaId = 0;

const FILIAL = 1;
const XODIM = 1;

let hisoblagich = 0;
const manba = (): number => {
  hisoblagich += 1;
  return Number(`${String(Date.now()).slice(-8)}${String(hisoblagich)}`);
};

/**
 * ⚠️ Kassa BITTA — `kassa_filial_bitta` indeksi bir filialda bir
 *    turdagi bir valyutali BITTA kassaga ruxsat beradi (12.2).
 *
 *    Testlar bir-biriga xalaqit bermasligi uchun har biri O'Z SANASIDA
 *    ishlaydi: kun hisobi `(kassa, sana)` juftligiga bog'langan.
 */
let sanaHisoblagich = 0;

/**
 * ⚠️ Sanalar HAR YURISHDA boshqa bo'lishi shart.
 *
 *    Avval `2026-01-01` dan boshlanardi va ikkinchi yurishda o'sha
 *    kunlar allaqachon yopilgan bo'lardi — «kun yopilgan» xatosi
 *    chiqib, to'g'ri kod «yiqilgan» bo'lib ko'rinardi (T-06 dagi bilan
 *    bir xil xato).
 *
 *    Vaqt bo'yicha siljish ham YETMADI: ikki yurish ketma-ket
 *    boshlangan va bir xil daqiqaga tushgan. Shuning uchun TASODIFIY
 *    siljish — 30 000 kunlik oraliqda 12 ta sana to'qnashishi amalda
 *    nolga teng.
 */
const KUN_ASOSI = Math.floor(Math.random() * 30_000);

const yangiSana = (): string => {
  sanaHisoblagich += 1;
  const d = new Date(2000, 0, 1);
  d.setDate(d.getDate() + KUN_ASOSI + sanaHisoblagich);
  return d.toISOString().slice(0, 10);
};

beforeAll(async () => {
  sql = sinovUlanishi();

  const bor = await sql<{ id: number }[]>`
    SELECT id FROM kassa
    WHERE filial_id = ${FILIAL} AND xodim_id IS NULL AND turi = 'BANK'
      AND valyuta = 'SOM'`;

  if (bor[0] !== undefined) {
    kassaId = bor[0].id;
    return;
  }

  const q = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${FILIAL}, NULL, 'BANK', 'SOM', 'Kun sinov kassasi', ${XODIM})
    RETURNING id`;
  kassaId = q[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end();
});

/**
 * Yozuvni O'TGAN SANA bilan qo'shadi.
 *
 * ⚠️ `UPDATE kassa_yozuv` ishlatib bo'lmaydi — §6.5 trigger uni
 *    to'sadi (va to'g'ri qiladi). Shuning uchun sana INSERT paytida
 *    beriladi.
 */
async function yozuv(
  summa: string,
  sana: string,
  kod = 'K9',
): Promise<void> {
  await sql`
    INSERT INTO kassa_yozuv (sana, kassa_id, kod, summa, valyuta, manba_turi,
                             manba_id, qator, xodim_id)
    VALUES (${`${sana} 12:00:00+05`}::timestamptz, ${kassaId}, ${kod}, ${summa},
            'SOM', 'sinov', ${manba()}, 1, ${XODIM})`;
}

// ─── K-09 · TZ 12.17 ──────────────────────────────────────────────────────

describe('K-09 · TZ 12.17 — kun hisobi', () => {
  it('850 000 + 4 200 000 − 1 850 000 = 3 200 000', async () => {
    const kecha = yangiSana();
    const bugun = yangiSana();

    const oldin = await kunHolati(sql, kassaId, kecha);

    // Kechagi qoldiq
    await yozuv('850000', kecha);
    // Bugungi kirim: 2 900 000 + 800 000 + 500 000
    await yozuv('2900000', bugun);
    await yozuv('800000', bugun);
    await yozuv('500000', bugun);
    // Bugungi chiqim: 230 000 + 620 000 + 1 000 000
    await yozuv('-230000', bugun, 'C6');
    await yozuv('-620000', bugun, 'C7');
    await yozuv('-1000000', bugun, 'C9');

    const h = await kunHolati(sql, kassaId, bugun);

    // ⚠️ Kassa umumiy — oldingi testlar qoldirgan qoldiq ayiriladi
    const asos = Number(oldin.boshlangich);
    expect(Number(h.boshlangich) - asos).toBe(850_000);
    expect(Number(h.kirim)).toBe(4_200_000);
    expect(Number(h.chiqim)).toBe(1_850_000);
    expect(Number(h.hisoblangan) - asos).toBe(3_200_000);
  });

  it("2.2-invariant — boshlang'ich qoldiq SAQLANMAYDI, yig'indidan chiqadi", async () => {
    const a = yangiSana();
    const b = yangiSana();
    const c = yangiSana();

    const oldin = Number((await kunHolati(sql, kassaId, a)).boshlangich);

    await yozuv('100000', a);
    await yozuv('250000', b);

    const h = await kunHolati(sql, kassaId, c);
    // Ikki kunning yig'indisi
    expect(Number(h.boshlangich) - oldin).toBe(350_000);
    expect(Number(h.kirim)).toBe(0);
  });
});

// ─── TZ 12.17 · Yopish va farq ────────────────────────────────────────────

/**
 * ⚠️ Kassa TESTLAR ORASIDA umumiy, shuning uchun `sanaldi` HAR SAFAR
 *    hisoblangan qoldiqdan chiqariladi. Qat'iy son yozilsa oldingi
 *    testlarning qoldig'i farq bo'lib chiqadi va test o'zini o'zi
 *    buzadi (T-06 dagi bilan bir xil xato).
 */
describe('TZ 12.17 — kunni yopish', () => {
  it("farq yo'q — izohsiz yopiladi", async () => {
    const sana = yangiSana();
    await yozuv('1000000', sana);

    const h = await kunHolati(sql, kassaId, sana);
    const n = await kunniYop(
      sql,
      { kassaId, sana, sanaldi: h.hisoblangan, izoh: null },
      XODIM,
    );

    expect(n.farqBormi).toBe(false);
    expect(Number(n.farq)).toBe(0);
    expect(await kunYopiqmi(sql, kassaId, sana)).toBe(true);
  });

  it('farq bor — izoh MAJBURIY, lekin yopish BLOKLANMAYDI', async () => {
    const sana = yangiSana();
    await yozuv('3200000', sana);

    const h = await kunHolati(sql, kassaId, sana);
    // 50 000 kam sanaldi
    const kam = (Number(h.hisoblangan) - 50_000).toFixed(2);

    // Izohsiz — rad etiladi
    await expect(
      kunniYop(sql, { kassaId, sana, sanaldi: kam, izoh: null }, XODIM),
    ).rejects.toThrow();

    // Izoh bilan — o'tadi, farq qayd etiladi
    const n = await kunniYop(
      sql,
      {
        kassaId,
        sana,
        sanaldi: kam,
        izoh: 'Mijozga qaytim berishda adashdim',
      },
      XODIM,
    );

    expect(n.farqBormi).toBe(true);
    expect(Number(n.farq)).toBe(-50_000);
  });

  it('ortiqcha chiqsa ham qayd etiladi', async () => {
    const sana = yangiSana();
    await yozuv('1000000', sana);

    const h = await kunHolati(sql, kassaId, sana);
    const n = await kunniYop(
      sql,
      {
        kassaId,
        sana,
        sanaldi: (Number(h.hisoblangan) + 30_000).toFixed(2),
        izoh: 'Ortiqcha chiqdi',
      },
      XODIM,
    );
    expect(Number(n.farq)).toBe(30_000);
  });

  it("ikki marta yopib bo'lmaydi", async () => {
    const sana = yangiSana();
    await yozuv('500000', sana);

    const h = await kunHolati(sql, kassaId, sana);
    await kunniYop(sql, { kassaId, sana, sanaldi: h.hisoblangan, izoh: null }, XODIM);

    await expect(
      kunniYop(sql, { kassaId, sana, sanaldi: h.hisoblangan, izoh: null }, XODIM),
    ).rejects.toThrow();
  });

  it('TZ 2.4 — yopish audit jurnaliga tushadi', async () => {
    const sana = yangiSana();
    await yozuv('700000', sana);

    const h = await kunHolati(sql, kassaId, sana);
    const n = await kunniYop(
      sql,
      { kassaId, sana, sanaldi: h.hisoblangan, izoh: null },
      XODIM,
    );

    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'kassa_kun' AND obyekt_id = ${n.kunId}
        AND amal = 'KUN_YOPILDI'`;
    expect(a[0]?.n).toBe(1);
  });
});

// ─── TZ 12.17 · Qayta ochish ──────────────────────────────────────────────

describe('TZ 12.17 — admin kunni qayta ochadi', () => {
  /** Yopilgan kun yaratadi va uning id sini qaytaradi. */
  async function yopilganKun(): Promise<{ kunId: number; sana: string }> {
    const sana = yangiSana();
    await yozuv('400000', sana);
    const h = await kunHolati(sql, kassaId, sana);
    const n = await kunniYop(
      sql,
      { kassaId, sana, sanaldi: h.hisoblangan, izoh: null },
      XODIM,
    );
    return { kunId: n.kunId, sana };
  }

  it('sabab MAJBURIY', async () => {
    const { kunId } = await yopilganKun();
    await expect(kunniQaytaOch(sql, kunId, '  ', XODIM)).rejects.toThrow();
  });

  it('qayta ochilgach kun YOPIQ emas va audit jurnalida qoladi', async () => {
    const { kunId, sana } = await yopilganKun();

    await kunniQaytaOch(sql, kunId, 'Sotuvchi sanashda adashgan', XODIM);

    expect(await kunYopiqmi(sql, kassaId, sana)).toBe(false);

    const q = await sql<{ qayta_ochildi: Date | null }[]>`
      SELECT qayta_ochildi FROM kassa_kun WHERE id = ${kunId}`;
    expect(q[0]?.qayta_ochildi).not.toBeNull();

    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'kassa_kun' AND obyekt_id = ${kunId}
        AND amal = 'KUN_QAYTA_OCHILDI'`;
    expect(a[0]?.n).toBe(1);
  });

  it("yopilmagan kunni qayta ochib bo'lmaydi", async () => {
    const { kunId } = await yopilganKun();
    await kunniQaytaOch(sql, kunId, 'birinchi', XODIM);
    await expect(kunniQaytaOch(sql, kunId, 'ikkinchi', XODIM)).rejects.toThrow();
  });

  it('qayta ochilgach yana yopish mumkin', async () => {
    const { kunId, sana } = await yopilganKun();
    await kunniQaytaOch(sql, kunId, 'tuzatish kerak', XODIM);

    const h = await kunHolati(sql, kassaId, sana);
    const ikkinchi = await kunniYop(
      sql,
      {
        kassaId,
        sana,
        sanaldi: (Number(h.hisoblangan) - 10_000).toFixed(2),
        izoh: 'qayta sanaldi',
      },
      XODIM,
    );
    expect(Number(ikkinchi.farq)).toBe(-10_000);
    // AUDIT B-06 — kassa va sana juftligi noyob, yangi qator ochilmaydi
    expect(ikkinchi.kunId).toBe(kunId);
  });
});

// ─── Kassa moduli bilan bog'lanish ────────────────────────────────────────

describe('kun hisobi kassa yozuvlariga tayanadi', () => {
  it('operatsion xarajat chiqimga tushadi', async () => {
    // ⚠️ `chiqimQil` sanani o'zi qo'yadi (now()), shuning uchun bugungi
    //    kun oldindan o'lchanadi va FARQ tekshiriladi — test qayta
    //    yurganda o'zining oldingi yozuvini sanamasin.
    const bugun = new Date().toISOString().slice(0, 10);
    const oldin = Number((await kunHolati(sql, kassaId, bugun)).chiqim);

    await chiqimQil(
      sql,
      {
        yozuv: {
          kassaId,
          kod: 'C7',
          summa: '-450000',
          valyuta: 'SOM',
          manbaTuri: 'sinov',
          manbaId: manba(),
          qator: 1,
          izoh: null,
        },
        filialId: FILIAL,
        sana: bugun,
        modda: 'OPERATSION',
      },
      XODIM,
    );

    const h = await kunHolati(sql, kassaId, bugun);
    expect(Number(h.chiqim) - oldin).toBe(450_000);
  });
});
