import { describe, expect, it } from 'vitest';
import { sahifaKesimi, sahifaRaqami } from '@/lib/domain/sahifa';

describe('sahifaKesimi', () => {
  const r = Array.from({ length: 250 }, (_, i) => i);

  it('o‘rta sahifa — o‘sha qatorlar', () => {
    const k = sahifaKesimi(r, 2, 100);
    expect(k).toMatchObject({ joriy: 2, jami: 3 });
    expect(k.qatorlar[0]).toBe(100);
    expect(k.qatorlar).toHaveLength(100);
  });

  it('oxirgi sahifa qisqa; chegaradan tashqari so‘rov eng yaqiniga tushadi', () => {
    expect(sahifaKesimi(r, 3, 100).qatorlar).toHaveLength(50);
    expect(sahifaKesimi(r, 99, 100).joriy).toBe(3);
    expect(sahifaKesimi(r, 0, 100).joriy).toBe(1);
  });

  it('bo‘sh ro‘yxat — bitta bo‘sh sahifa', () => {
    expect(sahifaKesimi([], 1, 100)).toEqual({ qatorlar: [], joriy: 1, jami: 1 });
  });

  it('sahifaRaqami — noto‘g‘ri qiymat 1', () => {
    expect(sahifaRaqami('3')).toBe(3);
    expect(sahifaRaqami('0')).toBe(1);
    expect(sahifaRaqami('abc')).toBe(1);
    expect(sahifaRaqami('2.5')).toBe(1);
    expect(sahifaRaqami(undefined)).toBe(1);
    expect(sahifaRaqami(['2'])).toBe(1);
  });
});
