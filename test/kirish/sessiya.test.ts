/**
 * QISM 1 §8 — sessiya bazada, 30 kun, har so'rovda uzayadi
 */
import { describe, expect, it } from 'vitest';
import {
  SESSIYA_KUN,
  hashTeng,
  sessiyaYarat,
  sessiyaYaroqlimi,
  tokenHash,
  uzaytirilsinmi,
  yangiMuddat,
} from '@/lib/kirish/sessiya';

const T0 = new Date('2026-08-16T10:00:00+05:00');
const kun = (n: number): Date => new Date(T0.getTime() + n * 86_400_000);
const soat = (n: number): Date => new Date(T0.getTime() + n * 3_600_000);

describe('token yaratish', () => {
  it('har safar boshqa token', () => {
    const a = sessiyaYarat(T0);
    const b = sessiyaYarat(T0);
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it('token yetarlicha uzun — 256 bit', () => {
    const { token } = sessiyaYarat(T0);
    expect(token.length).toBeGreaterThanOrEqual(42);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("bazaga tokenning O'ZI emas, hashi yoziladi", () => {
    const { token, tokenHash: h } = sessiyaYarat(T0);
    expect(h).not.toBe(token);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash(token)).toBe(h);
  });

  it('muddat 30 kun', () => {
    const { amalQiladi } = sessiyaYarat(T0);
    expect(amalQiladi.getTime()).toBe(kun(SESSIYA_KUN).getTime());
  });
});

describe('hash taqqoslash', () => {
  it("bir xil qiymat — teng", () => {
    expect(hashTeng(tokenHash('a'), tokenHash('a'))).toBe(true);
  });

  it('boshqa qiymat — teng emas', () => {
    expect(hashTeng(tokenHash('a'), tokenHash('b'))).toBe(false);
  });

  it("uzunligi har xil bo'lsa yiqilmaydi", () => {
    expect(hashTeng('qisqa', tokenHash('a'))).toBe(false);
  });
});

describe('yaroqlilik', () => {
  it('muddat ichida yaroqli', () => {
    const s = { amalQiladi: kun(SESSIYA_KUN), bekorQilindi: null };
    expect(sessiyaYaroqlimi(s, kun(29))).toBe(true);
  });

  it('muddat tugagach yaroqsiz', () => {
    const s = { amalQiladi: kun(SESSIYA_KUN), bekorQilindi: null };
    expect(sessiyaYaroqlimi(s, kun(31))).toBe(false);
  });

  it('bekor qilingan sessiya DARHOL o\'chadi — JWT dan farqi shu', () => {
    const s = { amalQiladi: kun(SESSIYA_KUN), bekorQilindi: T0 };
    expect(sessiyaYaroqlimi(s, kun(1))).toBe(false);
  });
});

describe('surilma muddat', () => {
  it("yangi sessiya darhol uzaytirilmaydi — bazaga bekorga yozilmaydi", () => {
    const s = { amalQiladi: kun(SESSIYA_KUN), bekorQilindi: null };
    expect(uzaytirilsinmi(s, T0)).toBe(false);
  });

  it('bir soatdan keyin uzaytiriladi', () => {
    const s = { amalQiladi: kun(SESSIYA_KUN), bekorQilindi: null };
    expect(uzaytirilsinmi(s, soat(1))).toBe(true);
  });

  it("muddati tugagan sessiya uzaytirilmaydi", () => {
    const s = { amalQiladi: kun(SESSIYA_KUN), bekorQilindi: null };
    expect(uzaytirilsinmi(s, kun(31))).toBe(false);
  });

  it('bekor qilingan sessiya uzaytirilmaydi', () => {
    const s = { amalQiladi: kun(SESSIYA_KUN), bekorQilindi: T0 };
    expect(uzaytirilsinmi(s, soat(2))).toBe(false);
  });

  it('uzaytirilganda yana 30 kun beriladi', () => {
    expect(yangiMuddat(kun(10)).getTime()).toBe(kun(10 + SESSIYA_KUN).getTime());
  });
});
