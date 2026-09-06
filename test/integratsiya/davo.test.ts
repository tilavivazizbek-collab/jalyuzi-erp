/**
 * TZ 9.9 — yetkazib beruvchiga qo'yilgan da'voni hal qilish.
 *
 * ⚠️ NEGA BU TESTLAR BOR
 *
 *    2026-09-03 auditigacha da'vo QO'YISH bor edi, HAL QILISH yo'q:
 *    kirimda «qaytariladi» deb belgilangan defekt abadiy ochiq
 *    qolardi.
 *
 * ⚠️ Ikki yo'lning pul oqimi BUTUNLAY boshqacha va aynan shu
 *    tekshiriladi:
 *
 *      QABUL     → qarz kamayadi, xarajat YO'Q
 *      O'ZIMIZGA → xarajat yoziladi, qarz O'ZGARMAYDI
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { kirimYarat, type KirimKirimi } from '@/lib/amal/kirim';
import { davoniHalQil } from '@/lib/amal/davo';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let yetkazibId = 0;
let materialId = 0;

const FILIAL = 1;
const XODIM = 1;

const belgi = `DAVO-${String(Date.now()).slice(-8)}`;
let hisoblagich = 0;

beforeAll(async () => {
  sql = sinovUlanishi();

  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${`${belgi} yetkazuvchi`}, ${XODIM}) RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                          koeffitsient, yaratdi_id)
    VALUES (${`${belgi} shtanga`}, 'CHIZIQLI', 'shtanga', 'SM', 300, ${XODIM})
    RETURNING id`;
  materialId = m[0]?.id ?? 0;
}, 120_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

/** Defektli kirim — 10 dona, 1 tasi «qaytariladi». */
async function defektliKirim(): Promise<{ kirimId: number; qatorId: number }> {
  hisoblagich += 1;

  const kirim: KirimKirimi = {
    raqam: `K-${belgi}-${String(hisoblagich)}`,
    sana: '2026-08-20',
    filialId: FILIAL,
    yetkazibBeruvchiId: yetkazibId,
    valyuta: 'SOM',
    kursSnapshot: null,
    transportSumma: '0',
    bojxonaSumma: '0',
    tolovMuddati: null,
    qatorlar: [
      {
        materialId,
        miqdorKirim: 10,
        narxBirlik: '66000',
        defektMiqdor: 1,
        defektTuri: 'QAYTARILADI',
        narxAsosi: 'BIRLIK',
        bolaklar: [],
      },
    ],
  };

  const n = await kirimYarat(sql, kirim, XODIM);

  const q = await sql<{ id: number }[]>`
    SELECT id FROM kirim_qator WHERE kirim_id = ${n.kirimId}`;

  return { kirimId: n.kirimId, qatorId: q[0]?.id ?? 0 };
}

/** Yetkazib beruvchiga qarz — 2.2-invariant bo'yicha yig'indi. */
async function qarz(): Promise<number> {
  const q = await sql<{ jami: string | null }[]>`
    SELECT SUM(summa)::text AS jami FROM yetkazib_beruvchi_harakat
    WHERE yetkazib_beruvchi_id = ${yetkazibId} AND valyuta = 'SOM'`;
  return Number(q[0]?.jami ?? 0);
}

describe("TZ 9.9 — «Qabul qildi»", () => {
  it('qarz KAMAYADI, xarajat yozilmaydi', async () => {
    const { qatorId } = await defektliKirim();
    const oldin = await qarz();

    const n = await davoniHalQil(sql, { kirimQatorId: qatorId, qaror: 'QABUL', izoh: null }, XODIM);

    // 1 dona × 66 000 — KIRIM NARXIDA, tannarxda emas
    expect(Number(n.summa)).toBe(66_000);
    expect(await qarz()).toBeCloseTo(oldin - 66_000, 2);

    const h = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM yetkazib_beruvchi_harakat
      WHERE turi = 'DAVO' AND manba_turi = 'kirim_qator' AND manba_id = ${qatorId}`;
    expect(h[0]?.n).toBe(1);

    // ⚠️ Xarajat YO'Q — biz hech narsa yo'qotmadik
    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat
      WHERE manba_turi = 'kirim_qator' AND manba_id = ${qatorId}`;
    expect(x[0]?.n).toBe(0);
  });

  it('ikkinchi marta hal qilib bo\'lmaydi', async () => {
    const { qatorId } = await defektliKirim();
    await davoniHalQil(sql, { kirimQatorId: qatorId, qaror: 'QABUL', izoh: null }, XODIM);

    await expect(
      davoniHalQil(sql, { kirimQatorId: qatorId, qaror: 'QABUL', izoh: null }, XODIM),
    ).rejects.toThrow();
  });
});

describe("TZ 9.9 — «O'zimizga»", () => {
  it('XARAJAT yoziladi, qarz o\'zgarmaydi', async () => {
    const { qatorId } = await defektliKirim();
    const oldin = await qarz();

    const n = await davoniHalQil(
      sql,
      { kirimQatorId: qatorId, qaror: 'OZIMIZGA', izoh: 'Sotuvchi rad etdi' },
      XODIM,
    );

    // ⚠️ Qarz TEGILMAYDI — molni to'liq to'laymiz
    expect(await qarz()).toBeCloseTo(oldin, 2);

    const x = await sql<{ modda: string; summa: string; kassa: number | null }[]>`
      SELECT modda, summa::text, kassa_yozuv_id AS kassa FROM xarajat
      WHERE manba_turi = 'kirim_qator' AND manba_id = ${qatorId}`;

    expect(x).toHaveLength(1);
    expect(x[0]?.modda).toBe('YETKAZIB_BERUVCHI_DEFEKTI');
    // 12.1 — pul chiqmagan xarajat
    expect(x[0]?.kassa).toBeNull();
    expect(Number(x[0]?.summa)).toBeCloseTo(Number(n.summa), 2);

    // Qator holati rostlandi — endi bu da'vo emas
    const kq = await sql<{ turi: string }[]>`
      SELECT defekt_turi AS turi FROM kirim_qator WHERE id = ${qatorId}`;
    expect(kq[0]?.turi).toBe('HISOBDAN_CHIQADI');
  });

  it('hal qilingandan keyin qayta hal qilinmaydi', async () => {
    const { qatorId } = await defektliKirim();
    await davoniHalQil(sql, { kirimQatorId: qatorId, qaror: 'OZIMIZGA', izoh: null }, XODIM);

    await expect(
      davoniHalQil(sql, { kirimQatorId: qatorId, qaror: 'QABUL', izoh: null }, XODIM),
    ).rejects.toThrow();
  });
});

describe('TZ 9.9 — chegaralar', () => {
  it('defekti yo\'q qatorda da\'vo bo\'lmaydi', async () => {
    hisoblagich += 1;
    const n = await kirimYarat(
      sql,
      {
        raqam: `K-${belgi}-T${String(hisoblagich)}`,
        sana: '2026-08-20',
        filialId: FILIAL,
        yetkazibBeruvchiId: yetkazibId,
        valyuta: 'SOM',
        kursSnapshot: null,
        transportSumma: '0',
        bojxonaSumma: '0',
        tolovMuddati: null,
        qatorlar: [
          {
            materialId,
            miqdorKirim: 5,
            narxBirlik: '50000',
            defektMiqdor: 0,
            defektTuri: null,
            narxAsosi: 'BIRLIK',
            bolaklar: [],
          },
        ],
      },
      XODIM,
    );

    const q = await sql<{ id: number }[]>`
      SELECT id FROM kirim_qator WHERE kirim_id = ${n.kirimId}`;

    await expect(
      davoniHalQil(sql, { kirimQatorId: q[0]?.id ?? 0, qaror: 'QABUL', izoh: null }, XODIM),
    ).rejects.toThrow();
  });
});
