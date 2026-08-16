/**
 * TZ 3.8 · 3.11 · 5.4 · 6.3 · 20.9 · Q-01 · Q-28
 */
import { describe, expect, it } from 'vitest';
import {
  aksessuarNarxi,
  amaldagiNarx,
  buyurtmaNarxi,
  chegirmaHisobla,
  istisnomi,
  matoNarxi,
  offsetQolla,
  pozitsiyaNarxi,
  qatorSummasi,
  ustamaChegarasi,
  ustamaFoizi,
  ustamaPastmi,
  type Offset,
  type Qator,
} from '@/lib/domain/narx';
import { dollar, kurs, pulMatn, som } from '@/lib/domain/pul';
import { dona, kvM, sm } from '@/lib/domain/birlik';
import { BiznesXato } from '@/lib/xato';

const KURS = kurs(12_650, new Date('2026-08-16'), 'SNAPSHOT');

// ─── 20.9 · Filial narxi ──────────────────────────────────────────────────

describe('20.9.1 — filial narxi standartdan ustun (Q-28)', () => {
  it("filial narxi bo'sh — standart ishlaydi", () => {
    expect(pulMatn(amaldagiNarx(som(120_000), null))).toBe('120000.00');
    expect(istisnomi(null)).toBe(false);
  });

  it('filial narxi bor — u ustun', () => {
    expect(pulMatn(amaldagiNarx(som(120_000), som(114_000)))).toBe('114000.00');
    expect(istisnomi(som(114_000))).toBe(true);
  });
});

// ─── 6.3 · Offset ─────────────────────────────────────────────────────────

describe("6.3 — mijoz offsetining uch turi", () => {
  const baza = som(120_000);

  it("so'mda: baza + offset", () => {
    const o: Offset = { turi: 'SOM', summa: som(-1500) };
    expect(pulMatn(offsetQolla(baza, o, null))).toBe('118500.00');
  });

  it('foizda: baza × (1 + offset)', () => {
    const o: Offset = { turi: 'FOIZ', foiz: -3 };
    expect(pulMatn(offsetQolla(baza, o, null))).toBe('116400.00');
  });

  it('dollarda: baza + (offset × kurs)', () => {
    const o: Offset = { turi: 'DOLLAR', summa: dollar(-1) };
    expect(pulMatn(offsetQolla(baza, o, KURS))).toBe('107350.00');
  });

  it('offset yo\'q — narx o\'zgarmaydi', () => {
    expect(pulMatn(offsetQolla(baza, null, null))).toBe('120000.00');
  });

  it('dollarli offsetda kurs MAJBURIY (§3.2)', () => {
    const o: Offset = { turi: 'DOLLAR', summa: dollar(-1) };
    expect(() => offsetQolla(baza, o, null)).toThrow(BiznesXato);
  });

  it("noto'g'ri foiz rad etiladi", () => {
    const o: Offset = { turi: 'FOIZ', foiz: Number.NaN };
    expect(() => offsetQolla(baza, o, null)).toThrow(BiznesXato);
  });
});

// ─── 20.9.3 · To'liq zanjir ───────────────────────────────────────────────

describe("20.9.3 — filial narxi → offset → yaxlitlash", () => {
  it('TZ dagi misol: 120 000 → 114 000 → −3% → 110 600', () => {
    const narx = matoNarxi({
      standart: som(120_000),
      filialNarxi: som(114_000),
      offset: { turi: 'FOIZ', foiz: -3 },
      kurs: null,
    });
    expect(pulMatn(narx)).toBe('110600.00');
  });

  it('6.3 dagi misol: 118 750 × 0.97 = 115 187.5 → 115 200', () => {
    const narx = matoNarxi({
      standart: som(118_750),
      filialNarxi: null,
      offset: { turi: 'FOIZ', foiz: -3 },
      kurs: null,
    });
    expect(pulMatn(narx)).toBe('115200.00');
  });

  it('aksessuarga offset TEGMAYDI (6.3)', () => {
    expect(pulMatn(aksessuarNarxi(som(45_000), null))).toBe('45000.00');
    expect(pulMatn(aksessuarNarxi(som(45_000), som(43_000)))).toBe('43000.00');
  });
});

// ─── 3.8 · Qator va pozitsiya ─────────────────────────────────────────────

describe('Q-01 — chiziqli material: sm sarflanadi, narx 1 metr uchun', () => {
  it('420 sm karniz × 35 000 so\'m/m = 147 000', () => {
    const q: Qator = {
      nom: 'Karniz',
      sarflashBirligi: 'SM',
      miqdor: sm(420),
      narx: som(35_000),
    };
    expect(pulMatn(qatorSummasi(q))).toBe('147000.00');
  });

  it('kv.m — to\'g\'ridan-to\'g\'ri ko\'paytiriladi', () => {
    const q: Qator = {
      nom: 'Mato',
      sarflashBirligi: 'KV_M',
      miqdor: kvM(2.94),
      narx: som(120_000),
    };
    expect(pulMatn(qatorSummasi(q))).toBe('352800.00');
  });

  it('dona — to\'g\'ridan-to\'g\'ri', () => {
    const q: Qator = {
      nom: 'Kronshteyn',
      sarflashBirligi: 'DONA',
      miqdor: dona(2),
      narx: som(5000),
    };
    expect(pulMatn(qatorSummasi(q))).toBe('10000.00');
  });
});

describe('3.8 — pozitsiya narxi', () => {
  it("har slot O'Z narxi bilan — umumiy maydonga ko'paytirilmaydi", () => {
    // Dikke: uch xil mato, uch xil narx
    const qatorlar: Qator[] = [
      { nom: 'Oq mato', sarflashBirligi: 'KV_M', miqdor: kvM(0.66), narx: som(85_000) },
      { nom: "Ko'k chet", sarflashBirligi: 'KV_M', miqdor: kvM(0.66), narx: som(120_000) },
      { nom: "Ko'k o'rta", sarflashBirligi: 'KV_M', miqdor: kvM(2.64), narx: som(120_000) },
    ];
    // 56 100 + 79 200 + 316 800 = 452 100
    expect(pulMatn(pozitsiyaNarxi(qatorlar, null))).toBe('452100.00');

    // Noto'g'ri yo'l: 3.96 kv.m × 120 000 = 475 200 — boshqa raqam
    expect(pulMatn(pozitsiyaNarxi(
      [{ nom: 'jami', sarflashBirligi: 'KV_M', miqdor: kvM(3.96), narx: som(120_000) }],
      null,
    ))).toBe('475200.00');
  });

  it('xizmat haqi qo\'shiladi (4.7)', () => {
    const q: Qator[] = [
      { nom: 'Mato', sarflashBirligi: 'KV_M', miqdor: kvM(1), narx: som(100_000) },
    ];
    expect(pulMatn(pozitsiyaNarxi(q, som(20_000)))).toBe('120000.00');
    expect(pulMatn(pozitsiyaNarxi(q, null))).toBe('100000.00');
  });

  it("bo'sh pozitsiya nol", () => {
    expect(pulMatn(pozitsiyaNarxi([], null))).toBe('0.00');
  });

  it('buyurtma narxi — pozitsiyalar yig\'indisi (3.9)', () => {
    expect(pulMatn(buyurtmaNarxi([som(678_400), som(452_100)]))).toBe('1130500.00');
    expect(pulMatn(buyurtmaNarxi([]))).toBe('0.00');
  });
});

// ─── 3.11 · Chegirma ──────────────────────────────────────────────────────

describe('3.11 — chegirma va qo\'shimcha haq', () => {
  it('summa kamaytirilsa — chegirma', () => {
    const n = chegirmaHisobla(som(704_800), som(678_400), null);
    expect(n.turi).toBe('CHEGIRMA');
    expect(pulMatn(n.summa)).toBe('26400.00');
  });

  it('summa oshirilsa — qo\'shimcha haq', () => {
    const n = chegirmaHisobla(som(678_400), som(704_800), null);
    expect(n.turi).toBe('QOSHIMCHA');
    expect(pulMatn(n.summa)).toBe('26400.00');
  });

  it('teng bo\'lsa — chegirma yo\'q', () => {
    const n = chegirmaHisobla(som(678_400), som(678_400), 5);
    expect(n.turi).toBe('YOQ');
    expect(n.limitdanOshdi).toBe(false);
  });

  it('limitdan oshsa ogohlantiradi, lekin BLOKLAMAYDI', () => {
    // 678 400 dan 10% = 67 840
    const oshgan = chegirmaHisobla(som(678_400), som(600_000), 10);
    expect(oshgan.turi).toBe('CHEGIRMA');
    expect(oshgan.limitdanOshdi).toBe(true);

    const oshmagan = chegirmaHisobla(som(678_400), som(650_000), 10);
    expect(oshmagan.limitdanOshdi).toBe(false);
  });

  it("qo'shimcha haq limitga tegishli emas", () => {
    const n = chegirmaHisobla(som(100_000), som(900_000), 1);
    expect(n.turi).toBe('QOSHIMCHA');
    expect(n.limitdanOshdi).toBe(false);
  });

  it('limit belgilanmagan bo\'lsa oshmaydi', () => {
    expect(chegirmaHisobla(som(100_000), som(1), null).limitdanOshdi).toBe(false);
  });
});

// ─── 5.4 · Ustama ─────────────────────────────────────────────────────────

describe('5.4 — ustama', () => {
  it('(sotuv − tannarx) ÷ tannarx', () => {
    expect(ustamaFoizi(som(120_000), som(87_333))).toBeCloseTo(37.4, 1);
    expect(ustamaFoizi(som(130_000), som(100_000))).toBe(30);
  });

  it("material chegarasi bo'sh bo'lsa standart ishlaydi", () => {
    expect(ustamaChegarasi(null, 30)).toBe(30);
    expect(ustamaChegarasi(15, 30)).toBe(15);
  });

  it('chegaradan pastligini aniqlaydi (7.8 ogohlantirishi)', () => {
    expect(ustamaPastmi(som(120_000), som(100_000), 30)).toBe(true);
    expect(ustamaPastmi(som(130_000), som(100_000), 30)).toBe(false);
    expect(ustamaPastmi(som(140_000), som(100_000), 30)).toBe(false);
  });
});
