/**
 * TZ 7.10 · 7.12 · 2.4 · 2.5-invariant · QISM 1 §6.5
 *
 * Hisobdan chiqarish va kirim stornosi. Ikkalasi ham manfiy qoldiqqa
 * yo'l qo'yadi — bu 2.5-invariantda ONGLI ravishda ruxsat etilgan.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chiqarishniBekorQil, hisobdanChiqar } from '@/lib/amal/hisobdan';
import { kirimYarat, kirimniStorno } from '@/lib/amal/kirim';
import { pulMatn } from '@/lib/domain/pul';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let matoId: number;
let yetkazibId: number;

const FILIAL = 1;
const XODIM = 1;

beforeAll(async () => {
  sql = sinovUlanishi();

  const m = await sql<{ id: number }[]>`
    INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi, yaratdi_id)
    VALUES (${`Hisobdan sinov matosi ${String(Date.now())}`}, 'RULON', 'rulon', 'KV_M', ${XODIM})
    RETURNING id`;
  matoId = m[0]?.id ?? 0;

  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES (${`Hisobdan sinov yetkazuvchisi ${String(Date.now())}`}, ${XODIM}) RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;
}, 60_000);

afterAll(async () => {
  await sql.end();
});

let hisoblagich = 0;
async function bolakYarat(eni = 3.0, boyi = 30.0): Promise<number> {
  hisoblagich += 1;
  const q = await sql<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                       tannarx_birlik_snapshot, yaratdi_id)
    VALUES (${matoId}, ${FILIAL},
            ${`R-HIS-${String(Date.now())}-${String(hisoblagich)}`},
            'RULON', ${eni}, ${boyi}, 78000, ${XODIM})
    RETURNING id`;
  return q[0]?.id ?? 0;
}

// ─── TZ 7.10 · Hisobdan chiqarish ─────────────────────────────────────────

describe('TZ 7.10 — hisobdan chiqarish', () => {
  it("bo'lak BRAK holatiga o'tadi va zarar hisoblanadi", async () => {
    const bolakId = await bolakYarat(3.0, 30.0);

    const n = await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'SUV_KETDI', izoh: 'Tom oqdi', kirimId: null, davoQilinadimi: false },
      XODIM,
    );

    // 3.00 × 30.00 = 90 kv.m × 78 000 = 7 020 000
    expect(pulMatn(n.zarar)).toBe('7020000.00');

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BRAK');
  });

  it('ombor jurnaliga MANFIY yozuv tushadi', async () => {
    const bolakId = await bolakYarat(2.0, 10.0);
    await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'YIRTILDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );

    const q = await sql<{ turi: string; miqdor_kv_m: string; tannarx_summa: string }[]>`
      SELECT turi, miqdor_kv_m, tannarx_summa FROM ombor_harakat
      WHERE bolak_id = ${bolakId} AND turi = 'BRAK'`;

    expect(q[0]?.turi).toBe('BRAK');
    expect(Number(q[0]?.miqdor_kv_m)).toBe(-20);
    expect(Number(q[0]?.tannarx_summa)).toBe(-1_560_000);
  });

  it('TZ 2.4 — audit jurnaliga tushadi, sabab bilan', async () => {
    const bolakId = await bolakYarat(1.0, 5.0);
    await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'RANG_OCHDI', izoh: 'Quyoshda turgan', kirimId: null, davoQilinadimi: false },
      XODIM,
    );

    const q = await sql<{ amal: string; izoh: string; yangi_qiymat: { sabab: string } }[]>`
      SELECT amal, izoh, yangi_qiymat FROM audit_jurnal
      WHERE obyekt_turi = 'bolak' AND obyekt_id = ${bolakId}`;

    expect(q[0]?.amal).toBe('OMBORDAN_CHIQARILDI');
    expect(q[0]?.yangi_qiymat.sabab).toBe('RANG_OCHDI');
    expect(q[0]?.izoh).toContain('Quyoshda turgan');
  });

  it("«Boshqa» sababida izoh MAJBURIY", async () => {
    const bolakId = await bolakYarat();
    await expect(
      hisobdanChiqar(
        sql,
        { bolakId, sabab: 'BOSHQA', izoh: null, kirimId: null, davoQilinadimi: false },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it('ikki marta chiqarib bo\'lmaydi', async () => {
    const bolakId = await bolakYarat();
    await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'YOQOLDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );
    await expect(
      hisobdanChiqar(
        sql,
        { bolakId, sabab: 'YOQOLDI', izoh: null, kirimId: null, davoQilinadimi: false },
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("band qilingan bo'lak chiqarilsa band ham bo'shaydi", async () => {
    const bolakId = await bolakYarat();
    await sql`
      INSERT INTO band (bolak_id, buyurtma_pozitsiya_id, pozitsiya_material_id,
                        amal_qiladi, yaratdi_id)
      VALUES (${bolakId}, 880001, 880001, now() + interval '30 days', ${XODIM})`;
    await sql`UPDATE bolak SET holat = 'BAND' WHERE id = ${bolakId}`;

    await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'SUV_KETDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );

    const b = await sql<{ holat: string }[]>`
      SELECT holat FROM band WHERE bolak_id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSHATILDI');
  });
});

// ─── TZ 7.10 · Bekor qilish ───────────────────────────────────────────────

describe('TZ 7.10 — chiqarishni bekor qilish', () => {
  it("teskari yozuv qo'shiladi, ESKI YOZUV joyida qoladi (§6.5)", async () => {
    const bolakId = await bolakYarat(2.0, 10.0);
    const n = await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'YIRTILDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );

    await chiqarishniBekorQil(sql, n.harakatId, 'Xato kiritilgan edi', XODIM);

    const q = await sql<{ turi: string; miqdor_kv_m: string }[]>`
      SELECT turi, miqdor_kv_m FROM ombor_harakat
      WHERE bolak_id = ${bolakId} ORDER BY id`;

    // Ikkala yozuv ham turibdi: BRAK (−) va STORNO (+)
    expect(q.map((r) => r.turi)).toEqual(['BRAK', 'STORNO']);
    expect(Number(q[0]?.miqdor_kv_m)).toBe(-20);
    expect(Number(q[1]?.miqdor_kv_m)).toBe(20);
  });

  it("bo'lak omborga qaytadi", async () => {
    const bolakId = await bolakYarat();
    const n = await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'YOQOLDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );
    await chiqarishniBekorQil(sql, n.harakatId, 'Topildi', XODIM);

    const b = await sql<{ holat: string }[]>`SELECT holat FROM bolak WHERE id = ${bolakId}`;
    expect(b[0]?.holat).toBe('BOSH');
  });

  it('bekor qilish sababi MAJBURIY', async () => {
    const bolakId = await bolakYarat();
    const n = await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'YOQOLDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );
    await expect(chiqarishniBekorQil(sql, n.harakatId, '   ', XODIM)).rejects.toThrow();
  });

  it("IKKI MARTA bekor qilib bo'lmaydi — qoldiq ikki barobar qaytmaydi", async () => {
    const bolakId = await bolakYarat(2.0, 10.0);
    const n = await hisobdanChiqar(
      sql,
      { bolakId, sabab: 'YIRTILDI', izoh: null, kirimId: null, davoQilinadimi: false },
      XODIM,
    );

    await chiqarishniBekorQil(sql, n.harakatId, 'Birinchi bekor', XODIM);
    await expect(
      chiqarishniBekorQil(sql, n.harakatId, 'Ikkinchi bekor', XODIM),
    ).rejects.toThrow();

    // 2.2-invariant — qoldiq jurnal YIG'INDISI, u nolga qaytishi kerak
    const q = await sql<{ jami: string }[]>`
      SELECT COALESCE(SUM(miqdor_kv_m), 0)::text AS jami
      FROM ombor_harakat WHERE bolak_id = ${bolakId}`;
    expect(Number(q[0]?.jami)).toBe(0);
  });

  it("BRAK bo'lmagan yozuvni bekor qilib bo'lmaydi", async () => {
    const bolakId = await bolakYarat();
    const q = await sql<{ id: number }[]>`
      INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                 tannarx_summa, xodim_id)
      VALUES (${FILIAL}, ${bolakId}, 'KIRIM', 90, 7020000, ${XODIM}) RETURNING id`;
    await expect(
      chiqarishniBekorQil(sql, q[0]?.id ?? 0, 'sinov', XODIM),
    ).rejects.toThrow();
  });
});

// ─── TZ 7.12 · Kirim stornosi ─────────────────────────────────────────────

describe('TZ 7.12 — kirim hujjatini storno qilish', () => {
  const kirimYasa = async (): Promise<number> => {
    const n = await kirimYarat(
      sql,
      {
        raqam: `K-STORNO-${String(Date.now())}-${String(hisoblagich++)}`,
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
            materialId: matoId,
            miqdorKirim: 2,
            narxBirlik: '3510000',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [
              { eniM: 3.0, boyiM: 30.0 },
              { eniM: 3.0, boyiM: 30.0 },
            ],
          },
        ],
      },
      XODIM,
    );
    return n.kirimId;
  };

  it("barcha bo'lak qaytariladi va teskari yozuv tushadi", async () => {
    const kirimId = await kirimYasa();
    const n = await kirimniStorno(sql, kirimId, 'Xato hujjat', XODIM);

    expect(n.qaytarilganBolak).toBe(2);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM ombor_harakat oh
      JOIN bolak b ON b.id = oh.bolak_id
      JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
      WHERE kq.kirim_id = ${kirimId} AND oh.turi = 'STORNO'`;
    expect(q[0]?.n).toBe(2);
  });

  it('hujjat STORNO holatiga o\'tadi, sabab saqlanadi', async () => {
    const kirimId = await kirimYasa();
    await kirimniStorno(sql, kirimId, 'Yetkazib beruvchi xato yubordi', XODIM);

    const q = await sql<{ holat: string; storno_sabab: string }[]>`
      SELECT holat, storno_sabab FROM kirim WHERE id = ${kirimId}`;
    expect(q[0]?.holat).toBe('STORNO');
    expect(q[0]?.storno_sabab).toBe('Yetkazib beruvchi xato yubordi');
  });

  it("2.5-invariant — KESILGAN bo'lak ham qaytariladi", async () => {
    const kirimId = await kirimYasa();

    // Bir bo'lakni ishlatilgan qilib qo'yamiz
    await sql`
      UPDATE bolak SET holat = 'ISHLATILDI'
      WHERE id IN (
        SELECT b.id FROM bolak b
        JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
        WHERE kq.kirim_id = ${kirimId} LIMIT 1
      )`;

    const n = await kirimniStorno(sql, kirimId, 'Storno', XODIM);

    // Storno TO'LIQ — ikkala bo'lak ham qaytdi
    expect(n.qaytarilganBolak).toBe(2);
    // Manfiy qoldiq ogohlantirishi berildi
    expect(n.manfiyQoldiq.length).toBeGreaterThan(0);
  });

  it('ikki marta storno qilib bo\'lmaydi', async () => {
    const kirimId = await kirimYasa();
    await kirimniStorno(sql, kirimId, 'Birinchi', XODIM);
    await expect(kirimniStorno(sql, kirimId, 'Ikkinchi', XODIM)).rejects.toThrow();
  });

  it('sababsiz storno qilib bo\'lmaydi', async () => {
    const kirimId = await kirimYasa();
    await expect(kirimniStorno(sql, kirimId, '  ', XODIM)).rejects.toThrow();
  });

  it("TZ 7.12 — audit jurnalida raqam, summa, kim va sabab bor", async () => {
    const kirimId = await kirimYasa();
    await kirimniStorno(sql, kirimId, 'Audit sinovi', XODIM);

    const q = await sql<
      {
        amal: string;
        xodim_id: number;
        izoh: string;
        eski_qiymat: { raqam: string };
        yangi_qiymat: { summa: string; bolak_soni: number };
      }[]
    >`SELECT amal, xodim_id, izoh, eski_qiymat, yangi_qiymat FROM audit_jurnal
      WHERE obyekt_turi = 'kirim' AND obyekt_id = ${kirimId}`;

    expect(q[0]?.amal).toBe('STORNO');
    expect(q[0]?.xodim_id).toBe(XODIM);
    expect(q[0]?.izoh).toBe('Audit sinovi');
    expect(q[0]?.eski_qiymat.raqam).toBeDefined();
    expect(Number(q[0]?.yangi_qiymat.summa)).toBe(7_020_000);
    expect(q[0]?.yangi_qiymat.bolak_soni).toBe(2);
  });

  it("storno qilingan bo'laklar qoldiqdan chiqadi", async () => {
    const kirimId = await kirimYasa();
    await kirimniStorno(sql, kirimId, 'Storno', XODIM);

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM bolak b
      JOIN kirim_qator kq ON kq.id = b.kirim_qator_id
      WHERE kq.kirim_id = ${kirimId} AND b.faol = true`;
    expect(q[0]?.n).toBe(0);
  });
});
