/**
 * ⚠️ 2026-08-29: `?dan=notdate` manzili sahifani BUTUNLAY
 *    yiqitardi — «RangeError: Invalid time value». Sana bazaga
 *    tekshirilmasdan uzatilardi.
 */
import { describe, expect, it } from 'vitest';
import { sanaFiltri } from '@/app/(panel)/ombor/tarix/malumot';

describe('Sana filtri', () => {
  it("to'g'ri sana o'tadi", () => {
    expect(sanaFiltri('2026-08-29')).toBe('2026-08-29');
  });

  it("bo'sh — filtrsiz", () => {
    expect(sanaFiltri('')).toBe('');
    expect(sanaFiltri(undefined)).toBe('');
  });

  it('yaroqsiz matn sahifani yiqitmaydi', () => {
    expect(sanaFiltri('notdate')).toBe('');
    expect(sanaFiltri('2026-13-45')).toBe('');
    expect(sanaFiltri('29.08.2026')).toBe('');
    expect(sanaFiltri("'; DROP TABLE mijoz; --")).toBe('');
  });
});
