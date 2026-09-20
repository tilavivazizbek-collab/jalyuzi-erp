/**
 * QISM 1 §4 · 5.3-invariant · Q-01, Q-05
 *
 * ⚠️ 2026-09-20 — TIZIM BUTUNLAY METRGA O'TDI.
 *
 *    Bu fayldagi o'girish testlari (`smToM`, `mToSm`, `kvSmToKvM`,
 *    `maydonKvSm`) O'CHIRILDI, chunki o'girishning O'ZI o'chirildi.
 *    Ularni «birlik saqlanib qolsin» deb qoldirish eng yomon yo'l
 *    bo'lardi: test o'tib turgani uchun kod hali sm bilan
 *    ishlayotgandek ko'rinardi.
 *
 *    O'rniga shu narsa tekshiriladi: metr kiritilgan joyda metr
 *    chiqadi va hech qayerda 100 ga ko'paytirilmaydi.
 */
import { describe, expect, it } from 'vitest';
import {
  bolakKorsat,
  dona,
  kvM,
  kvMKorsat,
  kvMMatn,
  kvMYigindi,
  m,
  maydon,
  metrKorsat,
  metrMatn,
} from '@/lib/domain/birlik';
import { BiznesXato } from '@/lib/xato';

describe("metr — o'girish yo'q (Q-01)", () => {
  it('yozilgan son o\'sha-o\'sha qaytadi', () => {
    expect(m(4.2)).toBe(4.2);
    expect(m(2.1)).toBe(2.1);
    expect(m(0.4)).toBe(0.4);
  });

  it('ikkilik kasr bazadagi aniqlikka keltiriladi', () => {
    // NUMERIC(8,2) — santimetrgacha, undan mayda emas
    expect(m(4.195)).toBe(4.2);
    expect(m(0.005)).toBe(0.01);
    expect(m(1 / 3)).toBe(0.33);
  });

  it('eski karniz misoli endi to\'g\'ridan-to\'g\'ri metrda', () => {
    // Ilgari: sm(420) → smToM → 4.20. Endi: 4.20 ning o'zi.
    expect(m(4.2)).toBe(4.2);
    expect(metrKorsat(m(4.2))).toBe('4.20 m');
  });
});

describe('maydon — Q-05: kv.m hech qachon kiritilmaydi', () => {
  it('bo\'lak maydoni eni × bo\'yi dan chiqadi', () => {
    expect(maydon(m(3), m(28))).toBe(84);
    expect(maydon(m(1.8), m(2.2))).toBe(3.96);
  });

  it('buyurtma o\'lchamidan MAYDON kv.M da beriladi (ilgari kv.sm edi)', () => {
    // Ilgari: maydonKvSm(sm(210), sm(140)) = 29 400 kv.sm
    expect(maydon(m(2.1), m(1.4))).toBe(2.94);
  });

  it('K-02 slotlari: kv.m to\'g\'ridan-to\'g\'ri chiqadi', () => {
    expect(maydon(m(0.3), m(2.2))).toBe(0.66);
    expect(maydon(m(1.2), m(2.2))).toBe(2.64);
  });
});

describe('tekshiruvlar', () => {
  it('manfiy o\'lcham rad etiladi', () => {
    expect(() => m(-0.5)).toThrow(BiznesXato);
    expect(() => kvM(-1)).toThrow(BiznesXato);
  });

  it('son bo\'lmagan qiymat rad etiladi', () => {
    expect(() => m(Number.NaN)).toThrow(BiznesXato);
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
    expect(metrMatn(m(4.2))).toBe('4.20');
    expect(kvMMatn(kvM(2.94))).toBe('2.9400');
  });

  it('chiziqli material metrda saqlanadi va metrda ko\'rsatiladi', () => {
    expect(metrKorsat(m(4.2))).toBe('4.20 m');
    expect(kvMKorsat(kvM(2.94))).toBe('2.9400 kv.m');
  });

  it('bo\'lak eni × bo\'yi ko\'rinishida (Q-05)', () => {
    expect(bolakKorsat(m(3), m(28))).toBe('3.00 × 28.00 m');
  });
});
