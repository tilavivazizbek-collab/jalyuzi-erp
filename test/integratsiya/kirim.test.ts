/**
 * TZ 7.9 · QISM 1 §7.1 · 2.1-invariant · K-04 · K-05
 *
 * Kirim hujjati — bitta tranzaksiyada bo'laklar, transport taqsimoti
 * va tannarx.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { kirimYarat, type KirimKirimi } from '@/lib/amal/kirim';
import { pulMatn } from '@/lib/domain/pul';
import type { Ulanish } from '@/lib/db/ulanish';
import { sinovUlanishi } from './yordamchi';

let sql: Ulanish;
let yetkazibId: number;
let matoId: number;
let shtangaId: number;
let kronshteynId: number;

const FILIAL = 1;
const XODIM = 1;

beforeAll(async () => {
  sql = sinovUlanishi();

  const y = await sql<{ id: number }[]>`
    INSERT INTO yetkazib_beruvchi (nom, yaratdi_id)
    VALUES ('Kirim sinov yetkazuvchisi', ${XODIM}) RETURNING id`;
  yetkazibId = y[0]?.id ?? 0;

  const yarat = async (
    nom: string,
    hisobTuri: string,
    kirimBirligi: string,
    sarflash: string,
    koeff: string,
    narx: string | null,
  ): Promise<number> => {
    const q = await sql<{ id: number }[]>`
      INSERT INTO material (nom, hisob_turi, kirim_birligi, sarflash_birligi,
                            koeffitsient, sotuv_narx, yaratdi_id)
      VALUES (${nom}, ${hisobTuri}, ${kirimBirligi}, ${sarflash}, ${koeff},
              ${narx}, ${XODIM}) RETURNING id`;
    return q[0]?.id ?? 0;
  };

  matoId = await yarat('Kirim sinov matosi', 'RULON', 'rulon', 'KV_M', '1', '120000');
  shtangaId = await yarat('Kirim sinov karnizi', 'CHIZIQLI', 'shtanga', 'SM', '300', '35000');
  kronshteynId = await yarat('Kirim sinov kronshteyni', 'DONA', 'quti', 'DONA', '50', '5000');
}, 60_000);

afterAll(async () => {
  await sql.end();
});

let raqamHisoblagich = 0;
const yangiRaqam = (): string => {
  raqamHisoblagich += 1;
  return `K-SINOV-${String(Date.now())}-${String(raqamHisoblagich)}`;
};

const asos = (qatorlar: KirimKirimi['qatorlar']): KirimKirimi => ({
  raqam: yangiRaqam(),
  sana: '2026-08-20',
  filialId: FILIAL,
  yetkazibBeruvchiId: yetkazibId,
  valyuta: 'SOM',
  kursSnapshot: null,
  transportSumma: '0',
  bojxonaSumma: '0',
  tolovMuddati: null,
  qatorlar,
});

// ─── 7.9 · Rulon — har biri alohida bo'lak ────────────────────────────────

describe('TZ 7.9 — har rulon alohida bo\'lak bo\'lib tushadi', () => {
  it('ikki rulon → ikki bo\'lak, har biri o\'z o\'lchami bilan', async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: matoId,
          miqdorKirim: 2,
          narxBirlik: '3510000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [
            { eniM: 3.0, boyiM: 30.0 },
            { eniM: 2.0, boyiM: 25.0 },
          ],
        },
      ]),
      XODIM,
    );

    expect(n.bolakSoni).toBe(2);

    const b = await sql<{ kod: string; eni_m: string; boyi_m: string }[]>`
      SELECT bo.kod, bo.eni_m, bo.boyi_m FROM bolak bo
      JOIN kirim_qator kq ON kq.id = bo.kirim_qator_id
      WHERE kq.kirim_id = ${n.kirimId} ORDER BY bo.id`;

    expect(b).toHaveLength(2);
    expect(Number(b[0]?.eni_m)).toBe(3.0);
    expect(Number(b[1]?.eni_m)).toBe(2.0);
    expect(b[0]?.kod.startsWith('R-')).toBe(true);
  });

  it("o'lchamlar soni rulon soniga mos kelmasa RAD ETILADI", async () => {
    await expect(
      kirimYarat(
        sql,
        asos([
          {
            materialId: matoId,
            miqdorKirim: 3,
            narxBirlik: '100000',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
          },
        ]),
        XODIM,
      ),
    ).rejects.toThrow();
  });

  it("rad etilgan hujjat bazaga YOZILMAYDI (2.1-invariant)", async () => {
    const raqam = yangiRaqam();
    await expect(
      kirimYarat(
        sql,
        {
          ...asos([
            {
              materialId: matoId,
              miqdorKirim: 2,
              narxBirlik: '100000',
              defektMiqdor: 0,
              defektTuri: null,
              bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
            },
          ]),
          raqam,
        },
        XODIM,
      ),
    ).rejects.toThrow();

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kirim WHERE raqam = ${raqam}`;
    expect(q[0]?.n).toBe(0);
  });
});

// ─── K-04 · Transport taqsimoti bazada ────────────────────────────────────

describe('K-04 · transport taqsimoti — TZ 7.9', () => {
  it("uch qatorga taqsimlanadi, yig'indi aynan 2 000 000", async () => {
    const n = await kirimYarat(
      sql,
      {
        ...asos([
          {
            materialId: matoId,
            miqdorKirim: 1,
            narxBirlik: '3744000',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
          },
          {
            materialId: shtangaId,
            miqdorKirim: 1,
            narxBirlik: '594000',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [],
          },
          {
            materialId: kronshteynId,
            miqdorKirim: 1,
            narxBirlik: '640000',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [],
          },
        ]),
        transportSumma: '2000000',
      },
      XODIM,
    );

    const q = await sql<{ transport_ulush: string }[]>`
      SELECT transport_ulush FROM kirim_qator
      WHERE kirim_id = ${n.kirimId} ORDER BY id`;

    const jami = q.reduce((y, r) => y + Number(r.transport_ulush), 0);
    expect(jami).toBe(2_000_000);

    // P-16 — aniq nisbat
    expect(q.map((r) => r.transport_ulush)).toEqual([
      '1504218.56',
      '238650.06',
      '257131.38',
    ]);
  });

  it('transport tannarxga QO\'SHILADI (7.9)', async () => {
    const n = await kirimYarat(
      sql,
      {
        ...asos([
          {
            materialId: matoId,
            miqdorKirim: 1,
            narxBirlik: '1000000',
            defektMiqdor: 0,
            defektTuri: null,
            bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
          },
        ]),
        transportSumma: '200000',
      },
      XODIM,
    );

    const q = await sql<{ tannarx_birlik: string }[]>`
      SELECT tannarx_birlik FROM kirim_qator WHERE kirim_id = ${n.kirimId}`;
    expect(Number(q[0]?.tannarx_birlik)).toBe(1_200_000);
  });
});

// ─── K-05 · Brak tannarxga taqsimlanmaydi ─────────────────────────────────

describe('K-05 · brak — TZ 7.9', () => {
  it('660 000 / 10 = 66 000, tannarx o\'smaydi (P-17)', async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: shtangaId,
          miqdorKirim: 10,
          narxBirlik: '66000',
          defektMiqdor: 1,
          defektTuri: 'HISOBDAN_CHIQADI',
          bolaklar: [],
        },
      ]),
      XODIM,
    );

    const q = await sql<{ tannarx_birlik: string }[]>`
      SELECT tannarx_birlik FROM kirim_qator WHERE kirim_id = ${n.kirimId}`;
    expect(Number(q[0]?.tannarx_birlik)).toBe(66_000);
  });

  it("brak alohida zarar bo'lib qaytadi — hisobotda ko'rinadi", async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: shtangaId,
          miqdorKirim: 10,
          narxBirlik: '66000',
          defektMiqdor: 1,
          defektTuri: 'HISOBDAN_CHIQADI',
          bolaklar: [],
        },
      ]),
      XODIM,
    );
    expect(pulMatn(n.defektZarari)).toBe('66000.00');
  });

  it("qaytariladigan defekt omborga KIRMAYDI", async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: kronshteynId,
          miqdorKirim: 10,
          narxBirlik: '5000',
          defektMiqdor: 2,
          defektTuri: 'QAYTARILADI',
          bolaklar: [],
        },
      ]),
      XODIM,
    );

    const q = await sql<{ miqdor: string }[]>`
      SELECT bo.miqdor FROM bolak bo
      JOIN kirim_qator kq ON kq.id = bo.kirim_qator_id
      WHERE kq.kirim_id = ${n.kirimId}`;
    // 10 − 2 = 8 quti × 50 dona = 400
    expect(Number(q[0]?.miqdor)).toBe(400);
    expect(pulMatn(n.defektZarari)).toBe('0.00');
  });
});

// ─── 7.8 · Har bo'lak o'z tannarxini eslab qoladi ─────────────────────────

describe("TZ 7.8 — har bo'lak O'Z kirimini va tannarxini biladi", () => {
  it('ikki kirim, ikki xil tannarx — aralashmaydi', async () => {
    const birinchi = await kirimYarat(
      sql,
      asos([
        {
          materialId: matoId,
          miqdorKirim: 1,
          narxBirlik: '7020000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
        },
      ]),
      XODIM,
    );

    const ikkinchi = await kirimYarat(
      sql,
      asos([
        {
          materialId: matoId,
          miqdorKirim: 1,
          narxBirlik: '8190000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
        },
      ]),
      XODIM,
    );

    const olish = async (kirimId: number): Promise<number> => {
      const q = await sql<{ tannarx_birlik_snapshot: string }[]>`
        SELECT bo.tannarx_birlik_snapshot FROM bolak bo
        JOIN kirim_qator kq ON kq.id = bo.kirim_qator_id
        WHERE kq.kirim_id = ${kirimId}`;
      return Number(q[0]?.tannarx_birlik_snapshot);
    };

    // 78 000 so'm/kv.m × 90 kv.m = 7 020 000 so'm/rulon
    expect(await olish(birinchi.kirimId)).toBe(78_000);
    expect(await olish(ikkinchi.kirimId)).toBe(91_000);
  });
});

// ─── 7.9 · Ustama ogohlantirishi ──────────────────────────────────────────

describe('TZ 7.9 — ustama chegaradan past bo\'lsa OGOHLANTIRADI, bloklamaydi', () => {
  it("tannarx sotuv narxiga yaqinlashsa ogohlantirish chiqadi", async () => {
    // Mato sotuv narxi 120 000, tannarx 110 000 → ustama 9%, chegara 30%
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: matoId,
          miqdorKirim: 1,
          narxBirlik: '110000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
        },
      ]),
      XODIM,
    );

    expect(n.ogohlantirishlar).toHaveLength(1);
    expect(n.ogohlantirishlar[0]?.materialNomi).toBe('Kirim sinov matosi');
    expect(n.ogohlantirishlar[0]?.ustamaFoiz).toBeCloseTo(9.09, 1);
  });

  it('BLOKLAMAYDI — hujjat baribir saqlanadi (mol allaqachon kelgan)', async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: matoId,
          miqdorKirim: 1,
          narxBirlik: '119000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
        },
      ]),
      XODIM,
    );

    const q = await sql<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM kirim WHERE id = ${n.kirimId}`;
    expect(q[0]?.n).toBe(1);
    expect(n.ogohlantirishlar.length).toBeGreaterThan(0);
  });

  it("ustama yetarli bo'lsa ogohlantirish yo'q", async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: matoId,
          miqdorKirim: 1,
          narxBirlik: '80000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [{ eniM: 3.0, boyiM: 30.0 }],
        },
      ]),
      XODIM,
    );
    expect(n.ogohlantirishlar).toEqual([]);
  });
});

// ─── Ombor jurnali ────────────────────────────────────────────────────────

describe('har bo\'lak uchun ombor jurnaliga yozuv tushadi', () => {
  it('KIRIM turidagi yozuv yaratiladi', async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: matoId,
          miqdorKirim: 2,
          narxBirlik: '100000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [
            { eniM: 3.0, boyiM: 30.0 },
            { eniM: 3.0, boyiM: 20.0 },
          ],
        },
      ]),
      XODIM,
    );

    const q = await sql<{ turi: string; miqdor_kv_m: string }[]>`
      SELECT oh.turi, oh.miqdor_kv_m FROM ombor_harakat oh
      JOIN bolak bo ON bo.id = oh.bolak_id
      JOIN kirim_qator kq ON kq.id = bo.kirim_qator_id
      WHERE kq.kirim_id = ${n.kirimId} ORDER BY oh.id`;

    expect(q).toHaveLength(2);
    expect(q.every((r) => r.turi === 'KIRIM')).toBe(true);
    expect(Number(q[0]?.miqdor_kv_m)).toBe(90);
    expect(Number(q[1]?.miqdor_kv_m)).toBe(60);
  });
});

// ─── Q-01 · Chiziqli material koeffitsienti ───────────────────────────────

describe('Q-01 — chiziqli material koeffitsient bilan smga o\'giriladi', () => {
  it('10 shtanga × 300 = 3000 sm', async () => {
    const n = await kirimYarat(
      sql,
      asos([
        {
          materialId: shtangaId,
          miqdorKirim: 10,
          narxBirlik: '66000',
          defektMiqdor: 0,
          defektTuri: null,
          bolaklar: [],
        },
      ]),
      XODIM,
    );

    const q = await sql<{ miqdor: string }[]>`
      SELECT bo.miqdor FROM bolak bo
      JOIN kirim_qator kq ON kq.id = bo.kirim_qator_id
      WHERE kq.kirim_id = ${n.kirimId}`;
    expect(Number(q[0]?.miqdor)).toBe(3000);
  });
});
