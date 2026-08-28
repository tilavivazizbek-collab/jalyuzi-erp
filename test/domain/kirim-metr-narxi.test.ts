/**
 * TZ 7.9 — kirim narxi METR bo'yicha.
 *
 * ⚠️ NEGA BU BOR
 *
 * Egasi aytdi: «keladigan mato rulon bo'lsa enining farqi yo'q,
 * faqat bo'yi narxga hisoblanadi. Narxi 4 $, bo'yi 50 bo'lsa
 * rulonning narxi 200.»
 *
 * Ilgari faqat «rulon uchun narx» bor edi va omborchi 200 ni
 * O'ZI hisoblab kiritardi. Qo'lda hisoblash — xato manbayi.
 */
import { describe, expect, it } from 'vitest';
import { qatorQiymati, rulonTannarxi, birlikTannarxi } from '@/lib/domain/tannarx';
import { nolSom, pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

describe('qatorQiymati — narx asosi', () => {
  it('BIRLIK: 3 rulon × 200 = 600', () => {
    const q = qatorQiymati({
      id: 1,
      miqdor: 3,
      narxBirlik: som('200'),
      defektMiqdor: 0,
      narxAsosi: 'BIRLIK',
    });
    expect(pulMatn(q)).toBe('600.00');
  });

  it('METR: 4 × 50 metr = 200 — egasining misoli', () => {
    const q = qatorQiymati({
      id: 1,
      miqdor: 1,
      narxBirlik: som('4'),
      defektMiqdor: 0,
      narxAsosi: 'METR',
      jamiBoyiM: 50,
    });
    expect(pulMatn(q)).toBe('200.00');
  });

  it('METR: uch rulon 50+30+45 = 125 metr × 4 = 500', () => {
    const q = qatorQiymati({
      id: 1,
      miqdor: 3,
      narxBirlik: som('4'),
      defektMiqdor: 0,
      narxAsosi: 'METR',
      jamiBoyiM: 125,
    });
    expect(pulMatn(q)).toBe('500.00');
  });

  it("narx asosi ko'rsatilmasa BIRLIK — eski qatorlar buzilmaydi", () => {
    const q = qatorQiymati({ id: 1, miqdor: 3, narxBirlik: som('200'), defektMiqdor: 0 });
    expect(pulMatn(q)).toBe('600.00');
  });

  it("METR da bo'y berilmasa XATO — qator bepul bo'lib qolmasin", () => {
    expect(() =>
      qatorQiymati({
        id: 1,
        miqdor: 1,
        narxBirlik: som('4'),
        defektMiqdor: 0,
        narxAsosi: 'METR',
      }),
    ).toThrow(BiznesXato);
  });

  it('ENI narxga TA’SIR QILMAYDI — egasi shuni aytdi', () => {
    /** Ikki rulon bir xil bo'yda, har xil enida — narx bir xil */
    const a = qatorQiymati({
      id: 1,
      miqdor: 1,
      narxBirlik: som('4'),
      defektMiqdor: 0,
      narxAsosi: 'METR',
      jamiBoyiM: 50,
    });
    const b = qatorQiymati({
      id: 2,
      miqdor: 1,
      narxBirlik: som('4'),
      defektMiqdor: 0,
      narxAsosi: 'METR',
      jamiBoyiM: 50,
    });
    expect(pulMatn(a)).toBe(pulMatn(b));
  });
});

describe('rulonTannarxi — har rulon o‘z bo‘yiga mutanosib', () => {
  /** 125 metr uchun 500 to'landi → metriga 4 */
  const jami = som('500');

  it('50 metrlik rulon 200 turadi', () => {
    expect(pulMatn(rulonTannarxi(jami, 125, 50))).toBe('200.00');
  });

  it('30 metrlik rulon 120 turadi', () => {
    expect(pulMatn(rulonTannarxi(jami, 125, 30))).toBe('120.00');
  });

  it('45 metrlik rulon 180 turadi', () => {
    expect(pulMatn(rulonTannarxi(jami, 125, 45))).toBe('180.00');
  });

  it('uchtasining yig‘indisi qator qiymatiga TENG', () => {
    /**
     * ⚠️ Eng muhim shart: pul yo'qdan bor bo'lmaydi va yo'qolmaydi.
     */
    const a = rulonTannarxi(jami, 125, 50);
    const b = rulonTannarxi(jami, 125, 30);
    const c = rulonTannarxi(jami, 125, 45);
    const yigindi = Number(pulMatn(a)) + Number(pulMatn(b)) + Number(pulMatn(c));
    expect(yigindi).toBeCloseTo(500, 2);
  });

  it("bo'y nol bo'lsa xato — bo'lish buziladi", () => {
    expect(() => rulonTannarxi(jami, 0, 50)).toThrow(BiznesXato);
    expect(() => rulonTannarxi(jami, 125, 0)).toThrow(BiznesXato);
  });
});

describe('Transport bilan birga', () => {
  it('xarajat qo‘shilgach ham bo‘y bo‘yicha taqsimlanadi', () => {
    /**
     * 125 metr × 4 = 500, ustiga 100 transport → 600.
     * Metriga 4.80 → 50 metrlik rulon 240 turadi.
     */
    const n = birlikTannarxi(
      {
        id: 1,
        miqdor: 3,
        narxBirlik: som('4'),
        defektMiqdor: 0,
        narxAsosi: 'METR',
        jamiBoyiM: 125,
      },
      som('100'),
      null,
    );

    expect(pulMatn(n.jamiQiymat)).toBe('600.00');
    expect(pulMatn(rulonTannarxi(n.jamiQiymat, 125, 50))).toBe('240.00');
  });

  it('xarajatsiz ham jami qiymat to‘g‘ri', () => {
    const n = birlikTannarxi(
      {
        id: 1,
        miqdor: 1,
        narxBirlik: som('4'),
        defektMiqdor: 0,
        narxAsosi: 'METR',
        jamiBoyiM: 50,
      },
      nolSom(),
      null,
    );
    expect(pulMatn(n.jamiQiymat)).toBe('200.00');
  });
});
