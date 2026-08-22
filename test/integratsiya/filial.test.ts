/**
 * TZ 20.7 · 22 — filiallararo ko'chirish va hisob-kitob.
 *
 * K-11 kanonik son bazada: `312 000 + 57 600 + 154 400 = 524 000`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  kochirishBekorQil,
  kochirishJonat,
  kochirishQabulQil,
  kochirishSora,
} from '@/lib/amal/kochirish';
import {
  filialHarakatlari,
  qoldaTuzatish,
  tayyorMahsulotQarziniQaytarTx,
  tayyorMahsulotQarziYozTx,
} from '@/lib/amal/filial-harakat';
import { filialQarzTolovi } from '@/lib/amal/filial-hisob';
import { pozitsiyaniTopshir, pozitsiyaYetibKeldi } from '@/lib/amal/ish';
import {
  kassaStorno,
  topshiriqniQabulQil,
  topshiriqYubor,
} from '@/lib/amal/kassa';
import { balanslarNolmi, filialBalansi } from '@/lib/domain/filial-hisob';
import { pulMatn } from '@/lib/domain/pul';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;

/** Markaziy (beruvchi) va Sinov-2 (qabul qiluvchi) filiallari. */
let filialA = 0;
let filialB = 0;
let materialId = 0;
let kassaA = 0;
let kassaB = 0;

const XODIM = 1;

let hisoblagich = 0;
const belgi = (): string => {
  hisoblagich += 1;
  return `${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}-${String(hisoblagich)}`;
};

beforeAll(async () => {
  sql = sinovUlanishi();
  const b = belgi();

  filialA = 1;

  const yangiFilial = await sql<{ id: number }[]>`
    INSERT INTO filial (nom, yaratdi_id)
    VALUES (${`Sinov filial ${b}`}, ${XODIM}) RETURNING id`;
  filialB = yangiFilial[0]?.id ?? 0;

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Sinov mato ${b}`}, 'RULON', 'rulon', 'KV_M', ${XODIM}) RETURNING id`;
  materialId = m[0]?.id ?? 0;

  kassaA = await kassaOl(filialA, 'NAQD', b);
  kassaB = await kassaOl(filialB, 'NAQD', b);
}, 120_000);

afterAll(async () => {
  await sql.end();
});

/**
 * Filialning admin kassasi — bor bo'lsa o'sha, yo'q bo'lsa yangisi.
 *
 * ⚠️ `kassa_filial_bitta` — bir filialda bir turdagi bitta admin kassasi.
 *    Test har ishga tushganda yangisini yozsa ikkinchi safar yiqilardi
 *    (QOIDALAR §6 — test har safar o'tishi shart).
 */
async function kassaOl(
  filialId: number,
  turi: 'NAQD' | 'KARTA',
  belgisi: string,
): Promise<number> {
  const bor = await sql<{ id: number }[]>`
    SELECT id FROM kassa
    WHERE filial_id = ${filialId} AND turi = ${turi} AND valyuta = 'SOM'
      AND xodim_id IS NULL`;
  if (bor[0] !== undefined) return bor[0].id;

  const y = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${filialId}, NULL, ${turi}, 'SOM',
            ${`${turi} ${String(filialId)} ${belgisi}`}, ${XODIM})
    RETURNING id`;
  return y[0]?.id ?? 0;
}

/** 12.14 — sotuvchining shaxsiy kassasi (xodim_id to'lgan). */
async function sotuvchiKassaOl(filialId: number): Promise<number> {
  const bor = await sql<{ id: number }[]>`
    SELECT id FROM kassa
    WHERE filial_id = ${filialId} AND turi = 'NAQD' AND valyuta = 'SOM'
      AND xodim_id = ${XODIM}`;
  if (bor[0] !== undefined) return bor[0].id;

  const y = await sql<{ id: number }[]>`
    INSERT INTO kassa (filial_id, xodim_id, turi, valyuta, nom, yaratdi_id)
    VALUES (${filialId}, ${XODIM}, 'NAQD', 'SOM',
            ${`Sotuvchi ${String(filialId)} ${belgi()}`}, ${XODIM})
    RETURNING id`;
  return y[0]?.id ?? 0;
}

/** Bir bo'lak — eni × bo'yi metrda, tannarx kv.m uchun. */
async function bolakYarat(
  filialId: number,
  eniM: string,
  boyiM: string,
  tannarxBirlik: string,
): Promise<number> {
  const y = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, holat, yaratdi_id)
    VALUES (${materialId}, ${filialId}, ${`S-${belgi()}`}, 'RULON',
            ${eniM}, ${boyiM}, ${tannarxBirlik}, 'BOSH', ${XODIM})
    RETURNING id`;
  return y[0]?.id ?? 0;
}

// ─── TZ 20.7 · Material ko'chirish ────────────────────────────────────────

describe("TZ 20.7 — material ko'chirish", () => {
  it("jo'natilganda bo'lak YOLDA bo'ladi va beruvchi qoldig'idan chiqadi", async () => {
    const bolakId = await bolakYarat(filialA, '3.00', '10.00', '87333.3333');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );

    const n = await kochirishJonat(
      sql,
      { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: null, qarzSabab: null },
      filialA,
      XODIM,
    );

    expect(n.bolakSoni).toBe(1);
    // 3.00 × 10.00 = 30 kv.m × 87 333.3333 = 2 620 000
    expect(Number(n.tannarxBoyicha)).toBeCloseTo(2_620_000, 0);
    expect(n.qarzSumma).toBe(n.tannarxBoyicha);

    const b = await sql<{ holat: string; filial_id: number }[]>`
      SELECT holat, filial_id FROM bolak WHERE id = ${bolakId}`;
    // 20.7.4 — beruvchi qoldig'idan chiqarilgan, lekin hali unda turibdi
    expect(b[0]?.holat).toBe('YOLDA');
    expect(b[0]?.filial_id).toBe(filialA);

    const oh = await sql<{ turi: string; tannarx_summa: string; filial_id: number }[]>`
      SELECT turi, tannarx_summa, filial_id FROM ombor_harakat
      WHERE manba_turi = 'kochirish' AND manba_id = ${h.id}`;
    expect(oh).toHaveLength(1);
    expect(oh[0]?.turi).toBe('KOCHIRISH_CHIQDI');
    expect(Number(oh[0]?.tannarx_summa)).toBeLessThan(0);
    expect(oh[0]?.filial_id).toBe(filialA);

    // 22.4.4 — qarz HALI yozilmaydi
    const fh = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial_harakat
      WHERE manba_turi = 'kochirish' AND manba_id = ${h.id}`;
    expect(fh[0]?.n).toBe(0);
  });

  it('qabul qilinganda bo\'lak filiali o\'zgaradi va QARZ yoziladi (22.4.4)', async () => {
    const bolakId = await bolakYarat(filialA, '3.00', '10.00', '87333.3333');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );
    await kochirishJonat(
      sql,
      { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: null, qarzSabab: null },
      filialA,
      XODIM,
    );

    const q = await kochirishQabulQil(sql, { kochirishId: h.id, tuzatishlar: [] }, filialB, XODIM);

    const b = await sql<
      { holat: string; filial_id: number; tannarx_birlik_snapshot: string }[]
    >`
      SELECT holat, filial_id, tannarx_birlik_snapshot FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
    expect(b[0]?.filial_id).toBe(filialB);
    // 20.7.3 · 2.3-invariant — tannarx ko'chishda O'ZGARMAYDI
    expect(Number(b[0]?.tannarx_birlik_snapshot)).toBeCloseTo(87_333.3333, 3);

    const fh = await sql<
      { kimdan_filial_id: number; kimga_filial_id: number; turi: string; summa: string }[]
    >`
      SELECT kimdan_filial_id, kimga_filial_id, turi, summa FROM filial_harakat
      WHERE id = ${q.filialHarakatId ?? 0}`;
    // 22.2 — «A dan B ga material ko'chirildi → B → A qarzdor»
    expect(fh[0]?.kimdan_filial_id).toBe(filialB);
    expect(fh[0]?.kimga_filial_id).toBe(filialA);
    expect(fh[0]?.turi).toBe('MATERIAL_KOCHIRISH');
    expect(Number(fh[0]?.summa)).toBeCloseTo(2_620_000, 0);
  });

  it('2.1-invariant — ko\'chishda umumiy ombor qiymati o\'zgarmaydi', async () => {
    const bolakId = await bolakYarat(filialA, '2.00', '5.00', '100000');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );
    await kochirishJonat(
      sql,
      { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: null, qarzSabab: null },
      filialA,
      XODIM,
    );
    await kochirishQabulQil(sql, { kochirishId: h.id, tuzatishlar: [] }, filialB, XODIM);

    const jami = await sql<{ jami: string }[]>`
      SELECT COALESCE(SUM(tannarx_summa), 0)::text AS jami FROM ombor_harakat
      WHERE manba_turi = 'kochirish' AND manba_id = ${h.id}`;
    // Chiqdi (−1 000 000) + Kirdi (+1 000 000) = 0
    expect(Number(jami[0]?.jami)).toBe(0);
  });

  it("EC-FQ-03 — haqiqiy o'lcham kichik chiqsa qarz haqiqiy bo'yicha", async () => {
    const bolakId = await bolakYarat(filialA, '3.00', '10.00', '100000');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );
    await kochirishJonat(
      sql,
      { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: null, qarzSabab: null },
      filialA,
      XODIM,
    );

    const q = await kochirishQabulQil(
      sql,
      {
        kochirishId: h.id,
        tuzatishlar: [
          {
            bolakId,
            eniM: '3.00',
            boyiM: '8.00',
            miqdor: null,
            izoh: "Rulon kalta chiqdi",
          },
        ],
      },
      filialB,
      XODIM,
    );

    // 3 × 8 = 24 kv.m × 100 000 = 2 400 000 (30 kv.m emas)
    expect(Number(q.qarzSumma)).toBe(2_400_000);

    const b = await sql<{ boyi_m: string }[]>`
      SELECT boyi_m FROM bolak WHERE id = ${bolakId}`;
    expect(Number(b[0]?.boyi_m)).toBe(8);
  });

  it('EC-FQ-06 — summani qo\'lda 0 qilish mumkin, sabab MAJBURIY', async () => {
    const bolakId = await bolakYarat(filialA, '1.00', '1.00', '50000');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );

    await expect(
      kochirishJonat(
        sql,
        { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: '0', qarzSabab: '  ' },
        filialA,
        XODIM,
      ),
    ).rejects.toThrow();

    const n = await kochirishJonat(
      sql,
      {
        kochirishId: h.id,
        bolakIdlar: [bolakId],
        qarzSumma: '0',
        qarzSabab: 'Namuna sifatida bepul berildi',
      },
      filialA,
      XODIM,
    );
    expect(n.qarzSumma).toBe('0');

    const q = await kochirishQabulQil(sql, { kochirishId: h.id, tuzatishlar: [] }, filialB, XODIM);
    expect(Number(q.qarzSumma)).toBe(0);
    // P-33 — nol qarzda `filial_harakat` yozuvi UMUMAN yaratilmaydi
    expect(q.filialHarakatId).toBeNull();

    const fh = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial_harakat
      WHERE manba_turi = 'kochirish' AND manba_id = ${h.id}`;
    expect(fh[0]?.n).toBe(0);
  });

  it('EC-FQ-02 — bekor qilinsa qarz YOZILMAYDI, bo\'lak qaytadi', async () => {
    const bolakId = await bolakYarat(filialA, '2.00', '2.00', '60000');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );
    await kochirishJonat(
      sql,
      { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: null, qarzSabab: null },
      filialA,
      XODIM,
    );

    const n = await kochirishBekorQil(
      sql,
      { kochirishId: h.id, sabab: 'Yo\'lda mashina buzildi' },
      filialA,
      XODIM,
    );
    expect(n.qaytganBolak).toBe(1);

    const b = await sql<{ holat: string; filial_id: number }[]>`
      SELECT holat, filial_id FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
    expect(b[0]?.filial_id).toBe(filialA);

    const fh = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial_harakat
      WHERE manba_turi = 'kochirish' AND manba_id = ${h.id}`;
    expect(fh[0]?.n).toBe(0);
  });

  it('boshqa filialning bo\'lagini jo\'natib bo\'lmaydi (Q-25)', async () => {
    const begona = await bolakYarat(filialB, '1.00', '1.00', '10000');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );

    await expect(
      kochirishJonat(
        sql,
        { kochirishId: h.id, bolakIdlar: [begona], qarzSumma: null, qarzSabab: null },
        filialA,
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('qabul qiluvchi filialdan boshqasi qabul qila olmaydi', async () => {
    const bolakId = await bolakYarat(filialA, '1.00', '1.00', '10000');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );
    await kochirishJonat(
      sql,
      { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: null, qarzSabab: null },
      filialA,
      XODIM,
    );

    await expect(
      kochirishQabulQil(sql, { kochirishId: h.id, tuzatishlar: [] }, filialA, XODIM),
    ).rejects.toThrow();
  });

  it('qabul qilingan hujjat ikkinchi marta qabul qilinmaydi', async () => {
    const bolakId = await bolakYarat(filialA, '1.00', '1.00', '10000');

    const h = await kochirishSora(
      sql,
      { kimdanFilialId: filialA, kimgaFilialId: filialB, izoh: 'Sinov' },
      XODIM,
    );
    await kochirishJonat(
      sql,
      { kochirishId: h.id, bolakIdlar: [bolakId], qarzSumma: null, qarzSabab: null },
      filialA,
      XODIM,
    );
    await kochirishQabulQil(sql, { kochirishId: h.id, tuzatishlar: [] }, filialB, XODIM);

    await expect(
      kochirishQabulQil(sql, { kochirishId: h.id, tuzatishlar: [] }, filialB, XODIM),
    ).rejects.toThrow();
  });
});

// ─── TZ 22.3 · Tayyor mahsulot qarzi ──────────────────────────────────────

/** Sotgan va tikkan filiali har xil bo'lgan pozitsiya. */
async function pozitsiyaYarat(
  sotgan: number,
  ishlab: number,
  narx: string,
  holat = 'YETIB_KELDI',
): Promise<number> {
  const b = belgi();
  const tur = await sql<{ id: number }[]>`
    INSERT INTO mahsulot_tur (nom, yaratdi_id)
    VALUES (${`Filial tur ${b}`}, ${XODIM}) RETURNING id`;

  const buy = await sql<{ id: number }[]>`
    INSERT INTO buyurtma (raqam, sotuvchi_id, sotgan_filial_id,
                          ishlab_chiqaruvchi_filial_id, manba, yaratdi_id)
    VALUES (${`B-FIL-${b}`}, ${XODIM}, ${sotgan}, ${ishlab}, 'SAYT', ${XODIM})
    RETURNING id`;

  const p = await sql<{ id: number }[]>`
    INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id,
                                    eni_sm, boyi_sm, narx_snapshot,
                                    formula_snapshot, holat, yaratdi_id)
    VALUES (${buy[0]?.id ?? 0}, 1, ${tur[0]?.id ?? 0}, 210, 140, ${narx},
            ${sql.json({ sinov: true })}, ${holat}, ${XODIM})
    RETURNING id`;

  return p[0]?.id ?? 0;
}

/** Tannarx va ish haqini jurnallarga yozadi — hisob shulardan chiqadi. */
async function sarfYoz(
  pozitsiyaId: number,
  filialId: number,
  tannarx: string,
  ishHaqi: string,
): Promise<void> {
  const bolakId = await bolakYarat(filialId, '1.00', '1.00', '1');

  await sql`
    INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                               tannarx_summa, manba_turi, manba_id, xodim_id)
    VALUES (${filialId}, ${bolakId}, 'KESIM', -1,
            ${`-${tannarx}`}, 'buyurtma_pozitsiya', ${pozitsiyaId}, ${XODIM})`;

  await sql`
    INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta, kassa_yozuv_id,
                         manba_turi, manba_id, izoh, xodim_id)
    VALUES (current_date, ${filialId}, 'ISH_HAQI', ${ishHaqi}, 'SOM', NULL,
            'buyurtma_pozitsiya', ${pozitsiyaId}, 'Sinov', ${XODIM})`;
}

describe('K-11 — tayyor mahsulot qarzi bazada (22.3.1)', () => {
  it('312 000 + 57 600 + 154 400 = 524 000', async () => {
    const pozitsiyaId = await pozitsiyaYarat(filialA, filialB, '678400');
    await sarfYoz(pozitsiyaId, filialB, '312000', '57600');

    const n = await sql.begin((tx) => tayyorMahsulotQarziYozTx(tx, pozitsiyaId, XODIM));

    expect(Number(n.summa)).toBe(524_000);

    const fh = await sql<{ kimdan_filial_id: number; kimga_filial_id: number }[]>`
      SELECT kimdan_filial_id, kimga_filial_id FROM filial_harakat
      WHERE id = ${n.qarzId ?? 0}`;
    // Sotgan filial tikkan filialga qarzdor
    expect(fh[0]?.kimdan_filial_id).toBe(filialA);
    expect(fh[0]?.kimga_filial_id).toBe(filialB);
  });

  it("EC-FQ-01 — qaytarilsa qarz QAYTA hisoblanadi (22.3.4)", async () => {
    const pozitsiyaId = await pozitsiyaYarat(filialA, filialB, '678400');
    await sarfYoz(pozitsiyaId, filialB, '312000', '57600');

    await sql.begin((tx) => tayyorMahsulotQarziYozTx(tx, pozitsiyaId, XODIM));

    // Mijozga 600 000 qaytarildi, 78 400 ushlab qolindi (8.10)
    const t = await sql.begin((tx) =>
      tayyorMahsulotQarziniQaytarTx(tx, pozitsiyaId, '78400', XODIM),
    );
    expect(t.teskariId).not.toBeNull();

    const qatorlar = await sql<{ turi: string; summa: string }[]>`
      SELECT turi, summa FROM filial_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}
      ORDER BY id`;

    expect(qatorlar).toHaveLength(2);
    expect(Number(qatorlar[0]?.summa)).toBe(524_000);
    expect(qatorlar[1]?.turi).toBe('QAYTARISH');
    expect(Number(qatorlar[1]?.summa)).toBe(-445_600);

    // 22.3.3 — sotgan filial ushlab qolganidan ko'pini bermaydi
    const jami =
      Number(qatorlar[0]?.summa ?? 0) + Number(qatorlar[1]?.summa ?? 0);
    expect(jami).toBe(78_400);
  });

  it('22.3.3 — zararda qarz TUSHUMDAN oshmaydi', async () => {
    const pozitsiyaId = await pozitsiyaYarat(filialA, filialB, '300000');
    await sarfYoz(pozitsiyaId, filialB, '312000', '57600');

    const n = await sql.begin((tx) => tayyorMahsulotQarziYozTx(tx, pozitsiyaId, XODIM));
    // Formula 334 800 berardi
    expect(Number(n.summa)).toBe(300_000);
  });

  it('22.3.5 — bir filial sotgan va tikkan bo\'lsa qarz YO\'Q', async () => {
    const pozitsiyaId = await pozitsiyaYarat(filialA, filialA, '678400');
    await sarfYoz(pozitsiyaId, filialA, '312000', '57600');

    const n = await sql.begin((tx) => tayyorMahsulotQarziYozTx(tx, pozitsiyaId, XODIM));
    expect(n.qarzId).toBeNull();
    expect(Number(n.summa)).toBe(0);
  });
});

describe("TZ 20.5.1 · 20.8 — tayyor mahsulot yo'lda", () => {
  it("«Yetib keldi» ni faqat SOTGAN filial bosa oladi", async () => {
    const pozitsiyaId = await pozitsiyaYarat(filialA, filialB, '500000', 'TAYYOR_YOLDA');

    // Tikuvchi filial bosa olmaydi
    await expect(
      pozitsiyaYetibKeldi(sql, pozitsiyaId, filialB, XODIM),
    ).rejects.toThrow();

    await pozitsiyaYetibKeldi(sql, pozitsiyaId, filialA, XODIM);

    const p = await sql<{ holat: string }[]>`
      SELECT holat FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;
    expect(p[0]?.holat).toBe('YETIB_KELDI');
  });

  it("22.3.2 — qarz «Topshirildi» da yoziladi, «Yetib keldi» da EMAS", async () => {
    const pozitsiyaId = await pozitsiyaYarat(filialA, filialB, '678400', 'TAYYOR_YOLDA');
    await sarfYoz(pozitsiyaId, filialB, '312000', '57600');

    await pozitsiyaYetibKeldi(sql, pozitsiyaId, filialA, XODIM);

    const oraliq = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(oraliq[0]?.n).toBe(0);

    await pozitsiyaniTopshir(sql, pozitsiyaId, XODIM);

    const keyin = await sql<{ turi: string; summa: string }[]>`
      SELECT turi, summa FROM filial_harakat
      WHERE manba_turi = 'buyurtma_pozitsiya' AND manba_id = ${pozitsiyaId}`;
    expect(keyin).toHaveLength(1);
    expect(keyin[0]?.turi).toBe('TAYYOR_MAHSULOT');
    expect(Number(keyin[0]?.summa)).toBe(524_000);
  });

  it("yo'lda turgan pozitsiyani to'g'ridan-to'g'ri topshirib bo'lmaydi", async () => {
    const pozitsiyaId = await pozitsiyaYarat(filialA, filialB, '100000', 'TAYYOR_YOLDA');

    await expect(pozitsiyaniTopshir(sql, pozitsiyaId, XODIM)).rejects.toThrow();
  });
});

describe("TZ 22.5 — pul topshirish qarzi", () => {
  it("boshqa filialga topshirilsa QABUL QILGAN filial qarzdor bo'ladi (Q-29)", async () => {
    // Sotuvchi kassasi A filialida, admin kassasi B filialida
    const sotuvchiKassa = await sotuvchiKassaOl(filialA);

    const t = await topshiriqYubor(
      sql,
      { kimdanKassaId: sotuvchiKassa, kimgaKassaId: kassaB, summa: '4200000', valyuta: 'SOM', izoh: null },
      XODIM,
    );
    const n = await topshiriqniQabulQil(sql, t.topshiriqId, XODIM);

    const fh = await sql<
      { kimdan_filial_id: number; kimga_filial_id: number; summa: string }[]
    >`
      SELECT kimdan_filial_id, kimga_filial_id, summa FROM filial_harakat
      WHERE manba_turi = 'topshiriq' AND manba_id = ${t.topshiriqId}
        AND turi = 'PUL_TOPSHIRISH'`;

    // Pul B kassasiga tushdi → B, A ga qarzdor
    expect(fh[0]?.kimdan_filial_id).toBe(filialB);
    expect(fh[0]?.kimga_filial_id).toBe(filialA);
    expect(Number(fh[0]?.summa)).toBe(4_200_000);

    // EC-FQ-08 — storno qilinsa qarz ham teskari yoziladi
    await kassaStorno(sql, n.kirimId, 'Summa mos kelmadi', XODIM);

    const teskari = await sql<{ summa: string }[]>`
      SELECT summa FROM filial_harakat
      WHERE manba_turi = 'topshiriq_storno' AND manba_id = ${t.topshiriqId}`;
    expect(teskari).toHaveLength(1);
    expect(Number(teskari[0]?.summa)).toBe(-4_200_000);

    // Ikkinchi leg ham storno qilinsa qarz IKKI BAROBAR qaytmaydi
    await kassaStorno(sql, n.chiqimId, 'Summa mos kelmadi', XODIM);

    const yana = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial_harakat
      WHERE manba_turi = 'topshiriq_storno' AND manba_id = ${t.topshiriqId}`;
    expect(yana[0]?.n).toBe(1);
  });

  it("o'z filiali adminiga topshirilsa qarz TUG'ILMAYDI", async () => {
    const sotuvchiKassa = await sotuvchiKassaOl(filialA);

    const t = await topshiriqYubor(
      sql,
      { kimdanKassaId: sotuvchiKassa, kimgaKassaId: kassaA, summa: '100000', valyuta: 'SOM', izoh: null },
      XODIM,
    );
    await topshiriqniQabulQil(sql, t.topshiriqId, XODIM);

    const fh = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM filial_harakat
      WHERE manba_turi = 'topshiriq' AND manba_id = ${t.topshiriqId}`;
    expect(fh[0]?.n).toBe(0);
  });
});

// ─── TZ 22.6 · Balans va to'lov ───────────────────────────────────────────

describe("TZ 22.6 — filial balansi va to'lov", () => {
  it("C12 / K11 — to'lov ikkala kassaga va balansga tushadi (P-32)", async () => {
    const n = await filialQarzTolovi(
      sql,
      {
        kimdanKassaId: kassaB,
        kimgaKassaId: kassaA,
        summa: '1000000',
        izoh: 'Avgust yakuni',
      },
      XODIM,
    );

    const y = await sql<{ kod: string; summa: string }[]>`
      SELECT kod, summa FROM kassa_yozuv
      WHERE id IN (${n.chiqimId}, ${n.kirimId}) ORDER BY qator`;
    expect(y[0]?.kod).toBe('C12');
    expect(Number(y[0]?.summa)).toBe(-1_000_000);
    expect(y[1]?.kod).toBe('K11');
    expect(Number(y[1]?.summa)).toBe(1_000_000);

    // 22.7.3 — foyda-zararga TEGMAYDI
    const x = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM xarajat
      WHERE kassa_yozuv_id IN (${n.chiqimId}, ${n.kirimId})`;
    expect(x[0]?.n).toBe(0);

    const fh = await sql<{ turi: string; kimdan_filial_id: number }[]>`
      SELECT turi, kimdan_filial_id FROM filial_harakat WHERE id = ${n.filialHarakatId}`;
    expect(fh[0]?.turi).toBe('TOLOV');
    // To'lov qarzni kamaytiradi — yo'nalish teskari
    expect(fh[0]?.kimdan_filial_id).toBe(filialA);
  });

  it("bir filial ichidagi kassalar orasida filial to'lovi bo'lmaydi", async () => {
    const ikkinchiA = await kassaOl(filialA, 'KARTA', belgi());

    await expect(
      filialQarzTolovi(
        sql,
        {
          kimdanKassaId: kassaA,
          kimgaKassaId: ikkinchiA,
          summa: '100000',
          izoh: 'x',
        },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('EC-FQ-10 — qo\'lda tuzatishda sabab MAJBURIY va jurnalga tushadi', async () => {
    await expect(
      qoldaTuzatish(
        sql,
        { kimdanFilialId: filialA, kimgaFilialId: filialB, summa: '50000', sabab: ' ' },
        XODIM,
      ),
    ).rejects.toThrow();

    const n = await qoldaTuzatish(
      sql,
      {
        kimdanFilialId: filialA,
        kimgaFilialId: filialB,
        summa: '50000',
        sabab: 'Zararni teng bo\'lish (22.3.3)',
      },
      XODIM,
    );

    const a = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM audit_jurnal
      WHERE obyekt_turi = 'filial_harakat' AND obyekt_id = ${n.harakatId}
        AND amal = 'QOLDA_TUZATISH'`;
    expect(a[0]?.n).toBe(1);
  });

  it('2.2-invariant — balans SUM() dan chiqadi, saqlanmaydi', async () => {
    const harakatlar = await filialHarakatlari(sql, filialB, null, null);
    const balansB = filialBalansi(filialB, harakatlar);
    const balansA = filialBalansi(filialA, harakatlar);

    // 22.9.4 · 11-invariant — juftlik ichida yig'indi 0
    expect(Number(pulMatn(balansA)) + Number(pulMatn(balansB))).toBe(0);
    expect(balanslarNolmi([filialA, filialB], harakatlar)).toBe(true);
  });

  it('filial_harakat O\'ZGARTIRILMAYDI (22.9.1 · §6.5)', async () => {
    const n = await qoldaTuzatish(
      sql,
      {
        kimdanFilialId: filialA,
        kimgaFilialId: filialB,
        summa: '1000',
        sabab: 'Himoya sinovi',
      },
      XODIM,
    );

    await expect(
      sql`UPDATE filial_harakat SET summa = 9999 WHERE id = ${n.harakatId}`,
    ).rejects.toThrow();

    await expect(
      sql`DELETE FROM filial_harakat WHERE id = ${n.harakatId}`,
    ).rejects.toThrow();
  });
});
