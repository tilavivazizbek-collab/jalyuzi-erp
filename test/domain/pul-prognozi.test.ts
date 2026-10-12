import { describe, expect, it } from 'vitest';
import { kunQosh, pulPrognozi } from '@/lib/domain/hisobot/pul-prognozi';

describe('pul prognozi', () => {
  const p = pulPrognozi({
    bugun: '2026-10-12',
    boshlangich: '1000000',
    kirimlar: [
      { sana: '2026-10-15', summa: '300000' },
      { sana: '2026-12-01', summa: '999999' }, // oynadan tashqari
    ],
    chiqimlar: [
      { sana: '2026-10-01', summa: '200000' }, // muddati o'tgan — bugun
      { sana: '2026-10-20', summa: '1500000' },
    ],
    kunlikKirim: '50000',
    kunlikChiqim: '20000',
    kunSoni: 10,
  });

  it('o‘tgan muddatli to‘lov bugunga tushadi, oynadan tashqarisi kirmaydi', () => {
    expect(p.kunlar[0]).toMatchObject({ sana: '2026-10-12', chiqim: '200000.00', malum: '800000.00' });
    expect(p.kunlar).toHaveLength(11);
    expect(p.kunlar.at(-1)?.sana).toBe('2026-10-22');
  });

  it('ma‘lum chiziq 20-oktabrda manfiy; odatdagi oqim bilan', () => {
    // 800 000 + 300 000 − 1 500 000 = −400 000
    expect(p.malumYetmaydi).toEqual({ sana: '2026-10-20', qoldiq: '-400000.00' });
    // odatdagi: 8 kun × 30 000 = +240 000 → −160 000
    expect(p.yetmaydi).toEqual({ sana: '2026-10-20', qoldiq: '-160000.00' });
    expect(p.engPast.sana).toBe('2026-10-20');
  });

  it('kun qo‘shish oy chegarasida', () => {
    expect(kunQosh('2026-10-31', 1)).toBe('2026-11-01');
  });
});
