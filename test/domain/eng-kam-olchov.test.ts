/**
 * test/domain/eng-kam-olchov.test.ts — 0056
 *
 * «Kamida 1 kv.m dan hisoblanadi» — egasi tasdiqladi 2026-09-23.
 *
 * ⚠️ 0.4 × 0.5 m parda = 0.2 kv.m × 30 000 = 6 000 so'm. Mexanizm
 *    o'zi undan qimmat, ustaning ishi hisobga ham kirmagan. Jalyuzi
 *    sohasida deyarli hamma shu qoida bilan ishlaydi; tizimda u
 *    umuman yo'q edi.
 */

import { describe, expect, it } from 'vitest';
import { engKamOlchov, pozitsiyaQoidaNarxi } from '@/lib/domain/narx-qoidasi';

const BOSQICHLAR = [
  { dan: 0, gacha: 1, narx: '150000', valyuta: 'SOM' },
  { dan: 1, gacha: 3, narx: '130000', valyuta: 'SOM' },
  { dan: 3, gacha: null, narx: '110000', valyuta: 'SOM' },
];

const kirim = (eniM: number, boyiM: number, minOlchov?: number | null) => ({
  qoida: { hisoblashUsuli: 'MAYDON' as const, bosqichlar: BOSQICHLAR, minOlchov },
  eniM,
  boyiM,
  miqdor: 1,
  qoshimchalar: [],
  offset: null,
  kurs: null,
});

describe('EC-EKO · eng kam o’lchov', () => {
  it('EC-EKO-01 · kichik o’lcham eng kamgacha ko’tariladi', () => {
    expect(engKamOlchov(0.2, 1)).toBe(1);
  });

  it('EC-EKO-02 · kattasi tegilmaydi', () => {
    expect(engKamOlchov(3.44, 1)).toBe(3.44);
  });

  it('EC-EKO-03 · aynan teng — o’zgarmaydi', () => {
    expect(engKamOlchov(1, 1)).toBe(1);
  });

  /** ⚠️ Bo'sh = tekshiruv yo'q. Eski qoidalar buzilmaydi */
  it('EC-EKO-04 · berilmagan bo’lsa tegilmaydi', () => {
    expect(engKamOlchov(0.2, null)).toBe(0.2);
    expect(engKamOlchov(0.2, undefined)).toBe(0.2);
  });

  /** ⚠️ Nol «kamida nol» degani — qoidaning o'zi yo'q */
  it('EC-EKO-05 · nol va manfiy e’tiborga olinmaydi', () => {
    expect(engKamOlchov(0.2, 0)).toBe(0.2);
    expect(engKamOlchov(0.2, -5)).toBe(0.2);
  });
});

describe('EC-EKO · narxga ta’siri', () => {
  /**
   * ⚠️ ENG MUHIM TEST: eng kam hisob BOSQICH TANLASHDAN OLDIN
   *    qo'llanadi.
   *
   *    0.2 kv.m li parda «kamida 1 kv.m» bilan 1 kv.m DEK
   *    hisoblanadi — demak bosqich ham 1 kv.m ga qarab tanlanadi
   *    (130 000), 0.2 ga qarab emas (150 000).
   *
   *    Keyin qo'llansa mijoz IKKI MARTA jazolanardi: eng qimmat
   *    bosqich olinib, ustiga 1 ga ko'paytirilardi.
   */
  it('EC-EKO-06 · bosqich ham eng kam o’lchovga qarab tanlanadi', () => {
    const n = pozitsiyaQoidaNarxi(kirim(0.4, 0.5, 1));
    expect(n.olchov).toBe(1);
    expect(n.bosqich?.narx).toBe('130000');
    expect(n.jami).toBe('130000.00');
  });

  it('EC-EKO-07 · eng kamsiz — kichik parda arzon ketadi', () => {
    const n = pozitsiyaQoidaNarxi(kirim(0.4, 0.5));
    expect(n.olchov).toBe(0.2);
    expect(n.bosqich?.narx).toBe('150000');
    /** 0.2 × 150 000 = 30 000 — mexanizm o'zi undan qimmat */
    expect(n.jami).toBe('30000.00');
  });

  it('EC-EKO-08 · katta o’lchamga ta’sir qilmaydi', () => {
    const bilan = pozitsiyaQoidaNarxi(kirim(1.6, 2.15, 1));
    const bilansiz = pozitsiyaQoidaNarxi(kirim(1.6, 2.15));
    expect(bilan.jami).toBe(bilansiz.jami);
    expect(bilan.olchov).toBeCloseTo(3.44, 4);
  });
});
