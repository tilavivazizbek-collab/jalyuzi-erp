/**
 * QISM 1 §4 · 5.3-invariant · Q-01, Q-05
 */
import { describe, expect, it } from 'vitest';
import {
  bolakKorsat,
  dona,
  kvM,
  kvMKorsat,
  kvMMatn,
  kvMYigindi,
  kvSmToKvM,
  m,
  maydon,
  maydonKvSm,
  metrKorsat,
  metrMatn,
  mToSm,
  sm,
  smKorsat,
  smMatn,
  smToM,
} from '@/lib/domain/birlik';
import { BiznesXato } from '@/lib/xato';

describe('o\'girish — Q-01', () => {
  it('420 sm = 4.20 m', () => {
    expect(smToM(sm(420))).toBe(4.2);
    expect(mToSm(m(4.2))).toBe(420);
  });

  it('ikkilik kasr bazadagi aniqlikka keltiriladi', () => {
    // 419 / 100 ikkilik sanoqda aniq chiqmaydi
    expect(smToM(sm(419))).toBe(4.19);
    expect(smToM(sm(1))).toBe(0.01);
  });

  it('kvadrat santimetr → kvadrat metr (§4.3)', () => {
    expect(kvSmToKvM(6600)).toBe(0.66);
    expect(kvSmToKvM(26_400)).toBe(2.64);
    expect(kvSmToKvM(29_400)).toBe(2.94);
  });
});

describe('maydon — Q-05: kv.m hech qachon kiritilmaydi', () => {
  it('bo\'lak maydoni eni × bo\'yi dan chiqadi', () => {
    expect(maydon(m(3), m(28))).toBe(84);
    expect(maydon(m(1.8), m(2.2))).toBe(3.96);
  });

  it('buyurtma o\'lchamidan MAYDON kv.smda beriladi', () => {
    expect(maydonKvSm(sm(210), sm(140))).toBe(29_400);
  });
});

describe('tekshiruvlar', () => {
  it('manfiy o\'lcham rad etiladi', () => {
    expect(() => sm(-1)).toThrow(BiznesXato);
    expect(() => m(-0.5)).toThrow(BiznesXato);
    expect(() => kvM(-1)).toThrow(BiznesXato);
  });

  it('son bo\'lmagan qiymat rad etiladi', () => {
    expect(() => sm(Number.NaN)).toThrow(BiznesXato);
    expect(() => m(Number.POSITIVE_INFINITY)).toThrow(BiznesXato);
  });

  it('dona butun bo\'lishi shart — yarim kronshteyn bo\'lmaydi', () => {
    expect(dona(2)).toBe(2);
    expect(() => dona(1.5)).toThrow(BiznesXato);
  });
});

describe('yig\'ish', () => {
  it('kvadrat metrlar yig\'indisi — TZ 3.5 slotlari', () => {
    expect(kvMYigindi([kvM(0.66), kvM(0.66), kvM(2.64)])).toBe(3.96);
    expect(kvMYigindi([])).toBe(0);
  });
});

describe('ko\'rsatish — §4.2', () => {
  it('bazaga beriladigan ko\'rinish ustun aniqligiga mos', () => {
    expect(smMatn(sm(420))).toBe('420.00');
    expect(metrMatn(m(4.2))).toBe('4.20');
    expect(kvMMatn(kvM(2.94))).toBe('2.9400');
  });

  it('chiziqli material smda saqlanadi, metrda ko\'rsatiladi', () => {
    expect(smKorsat(sm(420))).toBe('4.20 m');
    expect(metrKorsat(m(4.2))).toBe('4.20 m');
    expect(kvMKorsat(kvM(2.94))).toBe('2.9400 kv.m');
  });

  it('bo\'lak eni × bo\'yi ko\'rinishida (Q-05)', () => {
    expect(bolakKorsat(m(3), m(28))).toBe('3.00 × 28.00 m');
  });
});
