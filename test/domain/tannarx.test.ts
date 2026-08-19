/**
 * TZ 7.8 · 7.9 · K-04 · K-05
 */
import { describe, expect, it } from 'vitest';
import {
  birlikTannarxi,
  fifoYech,
  qatorQiymati,
  ustamaniTekshir,
  xarajatniTaqsimla,
  type KirimQatori,
} from '@/lib/domain/tannarx';
import { nolSom, pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const qator = (id: number, miqdor: number, narx: string, defekt = 0): KirimQatori => ({
  id,
  miqdor,
  narxBirlik: som(narx),
  defektMiqdor: defekt,
});

// ─── K-04 · Transport taqsimoti (TZ 7.9) ──────────────────────────────────

describe('K-04 · transport taqsimoti — TZ 7.9', () => {
  // Mato 3 744 000 · Karniz 594 000 · Kronshteyn 640 000 = 4 978 000
  const qatorlar = [
    qator(1, 1, '3744000'),
    qator(2, 1, '594000'),
    qator(3, 1, '640000'),
  ];
  const XARAJAT = som('2000000');

  it('ulushlar yig\'indisi umumiy summaga AYNAN teng — pul yo\'qolmaydi', () => {
    const ulushlar = xarajatniTaqsimla(qatorlar, XARAJAT);
    const jami = ulushlar.reduce((y, u) => y + Number(pulMatn(u.ulush)), 0);
    expect(jami).toBe(2_000_000);
  });

  /**
   * ⚠️ TZ 7.9 misolidagi raqamlar YAXLITLANGAN FOIZDAN chiqarilgan:
   *
   *     75.2% × 2 000 000 = 1 504 000
   *
   * Aniq nisbat esa boshqacha beradi:
   *
   *     3 744 000 / 4 978 000 × 2 000 000 = 1 504 218.56
   *
   * Farq 0.05% dan kam. Kod ANIQ nisbatni ishlatadi — foizni oldin
   * yaxlitlash sun'iy xato kiritadi. Batafsil: QARORLAR-KOD P-16.
   */
  it('aniq nisbat bo\'yicha ulushlar', () => {
    const ulushlar = xarajatniTaqsimla(qatorlar, XARAJAT);
    expect(ulushlar.map((u) => pulMatn(u.ulush))).toEqual([
      '1504218.56', // 3 744 000 / 4 978 000 × 2 000 000
      '238650.06', //    594 000 / 4 978 000 × 2 000 000
      '257131.38', //    640 000 / 4 978 000 × 2 000 000
    ]);
  });

  it("TZ misolidan farq 0.5% dan oshmaydi — sabab foizning yaxlitlanishi", () => {
    // Eng katta farq kronshteynda: TZ 12.856% ni 12.9% ga ko'targan → 0.34%
    const ulushlar = xarajatniTaqsimla(qatorlar, XARAJAT);
    const tzMisoli = [1_504_000, 238_000, 258_000];

    ulushlar.forEach((u, i) => {
      const kutilgan = tzMisoli[i] ?? 1;
      const farqFoiz = Math.abs(Number(pulMatn(u.ulush)) - kutilgan) / kutilgan;
      expect(farqFoiz, `${String(i)}-qator`).toBeLessThan(0.005);
    });
  });

  it('TZ misolining yig\'indisi bilan aynan mos — 2 000 000', () => {
    const ulushlar = xarajatniTaqsimla(qatorlar, XARAJAT);
    const jami = ulushlar.reduce((y, u) => y + Number(pulMatn(u.ulush)), 0);
    expect(jami).toBe(1_504_000 + 238_000 + 258_000);
  });

  it('taqsimot summa ULUSHIGA proporsional', () => {
    const ulushlar = xarajatniTaqsimla(qatorlar, XARAJAT);
    const u1 = Number(pulMatn(ulushlar[0]?.ulush ?? nolSom()));
    // 3 744 000 / 4 978 000 = 75.21%
    expect(u1 / 2_000_000).toBeCloseTo(3_744_000 / 4_978_000, 5);
  });

  it("xarajat nol bo'lsa hamma ulush nol", () => {
    const ulushlar = xarajatniTaqsimla(qatorlar, nolSom());
    expect(ulushlar.every((u) => pulMatn(u.ulush) === '0.00')).toBe(true);
  });

  it("yaxlitlash qoldig'i yo'qolmaydi — uchga bo'linmaydigan summa", () => {
    // 100 so'm uch teng qatorga: 33.33 + 33.33 + 33.34
    const uchta = [qator(1, 1, '1000'), qator(2, 1, '1000'), qator(3, 1, '1000')];
    const ulushlar = xarajatniTaqsimla(uchta, som('100'));
    const jami = ulushlar.reduce((y, u) => y + Number(pulMatn(u.ulush)), 0);
    expect(jami).toBeCloseTo(100, 10);
  });

  it('bitta qatorli hujjatda hammasi o\'shanga tushadi', () => {
    const ulushlar = xarajatniTaqsimla([qator(1, 1, '500000')], som('75000'));
    expect(pulMatn(ulushlar[0]?.ulush ?? nolSom())).toBe('75000.00');
  });
});

// ─── K-05 · Brak bilan tannarx (TZ 7.9) ───────────────────────────────────

describe('K-05 · brak tannarxga taqsimlanmaydi — TZ 7.9', () => {
  // 10 shtanga, jami 660 000, 1 tasi brak
  const shtanga = qator(1, 10, '66000', 1);

  it("tannarx 66 000 bo'lib QOLAVERADI, 73 333 emas", () => {
    const n = birlikTannarxi(shtanga, nolSom(), 'HISOBDAN_CHIQADI');
    expect(pulMatn(n.birlikTannarx)).toBe('66000.00');
  });

  it("brak summasi alohida zarar bo'lib chiqadi", () => {
    const n = birlikTannarxi(shtanga, nolSom(), 'HISOBDAN_CHIQADI');
    expect(pulMatn(n.defektZarari)).toBe('66000.00');
  });

  it('modeldagi formula 73 333 berardi — u ishlatilmaydi (P-17)', () => {
    const n = birlikTannarxi(shtanga, nolSom(), 'HISOBDAN_CHIQADI');
    const modelBoyicha = 660_000 / (10 - 1);
    expect(Number(pulMatn(n.birlikTannarx))).not.toBeCloseTo(modelBoyicha, 0);
  });

  it("qaytariladigan defekt bizga zarar bermaydi (qarzdan chegiriladi)", () => {
    const n = birlikTannarxi(shtanga, nolSom(), 'QAYTARILADI');
    expect(pulMatn(n.defektZarari)).toBe('0.00');
    expect(n.kirimMiqdor).toBe(9);
  });

  it("o'zimizdan brakka olingani omborga KIRADI va darhol chiqariladi", () => {
    const n = birlikTannarxi(shtanga, nolSom(), 'HISOBDAN_CHIQADI');
    expect(n.kirimMiqdor).toBe(10);
  });

  it('transport tannarxga QO\'SHILADI', () => {
    // 660 000 + 40 000 transport = 700 000 / 10 = 70 000
    const n = birlikTannarxi(qator(1, 10, '66000'), som('40000'), null);
    expect(pulMatn(n.birlikTannarx)).toBe('70000.00');
  });

  it("noto'g'ri miqdor rad etiladi", () => {
    expect(() => birlikTannarxi(qator(1, 0, '100'), nolSom(), null)).toThrow(BiznesXato);
    expect(() => birlikTannarxi(qator(1, 5, '100', 6), nolSom(), null)).toThrow(BiznesXato);
  });
});

// ─── 7.8 · FIFO ───────────────────────────────────────────────────────────

describe("7.8 — dona material FIFO bilan yechiladi", () => {
  const qatlamlar = [
    { kirimQatorId: 1, qoldiq: 5, birlikTannarx: som('5000') },
    { kirimQatorId: 2, qoldiq: 10, birlikTannarx: som('6000') },
    { kirimQatorId: 3, qoldiq: 20, birlikTannarx: som('7000') },
  ];

  it('eng eski kirimdan boshlanadi', () => {
    const n = fifoYech(qatlamlar, 3);
    expect(n.yechimlar).toEqual([
      { kirimQatorId: 1, miqdor: 3, summa: expect.anything() },
    ]);
    expect(pulMatn(n.jamiSumma)).toBe('15000.00');
  });

  it('bir qatlam yetmasa keyingisiga o\'tadi', () => {
    const n = fifoYech(qatlamlar, 12);
    expect(n.yechimlar.map((y) => [y.kirimQatorId, y.miqdor])).toEqual([
      [1, 5],
      [2, 7],
    ]);
    // 5 × 5000 + 7 × 6000 = 67 000
    expect(pulMatn(n.jamiSumma)).toBe('67000.00');
  });

  it('har qatlam O\'Z tannarxi bilan hisoblanadi (2.3-invariant)', () => {
    const n = fifoYech(qatlamlar, 35);
    expect(pulMatn(n.jamiSumma)).toBe('225000.00'); // 25000 + 60000 + 140000
    expect(n.yetishmadi).toBe(0);
  });

  it("qoldiq yetmasa qancha yetishmagani aytiladi", () => {
    const n = fifoYech(qatlamlar, 50);
    expect(n.yetishmadi).toBe(15);
  });

  it("bo'sh qatlam o'tkazib yuboriladi", () => {
    const bosh = [{ kirimQatorId: 9, qoldiq: 0, birlikTannarx: som('1000') }, ...qatlamlar];
    expect(fifoYech(bosh, 2).yechimlar[0]?.kirimQatorId).toBe(1);
  });

  it('manfiy miqdor rad etiladi', () => {
    expect(() => fifoYech(qatlamlar, -1)).toThrow(BiznesXato);
  });
});

// ─── 5.4 · Ustama nazorati ────────────────────────────────────────────────

describe('7.9 — ustama chegaradan past bo\'lsa ogohlantiradi', () => {
  it('ustama foizini hisoblaydi', () => {
    const n = ustamaniTekshir(som('120000'), som('87333'), 30);
    expect(n?.ustamaFoiz).toBeCloseTo(37.4, 1);
    expect(n?.pastmi).toBe(false);
  });

  it('chegaradan past bo\'lsa belgilaydi', () => {
    const n = ustamaniTekshir(som('100000'), som('90000'), 30);
    expect(n?.pastmi).toBe(true);
  });

  it("sotuv narxi yo'q bo'lsa tekshirilmaydi", () => {
    expect(ustamaniTekshir(null, som('90000'), 30)).toBeNull();
  });

  it('nol tannarxda bo\'linish yuz bermaydi', () => {
    expect(ustamaniTekshir(som('100000'), nolSom(), 30)).toBeNull();
  });
});

describe('qator qiymati', () => {
  it('narx × miqdor — defekt ham sotib olingan', () => {
    expect(pulMatn(qatorQiymati(qator(1, 10, '66000', 2)))).toBe('660000.00');
  });
});
