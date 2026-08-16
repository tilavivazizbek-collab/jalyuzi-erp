/**
 * QISM 1 §2.1 — «Har invariant kodda».
 */
import { describe, expect, it } from 'vitest';
import { invariantlarniTalabQil, invariantlarniTekshir } from '@/lib/domain/invariant';

describe('ishga tushish tekshiruvlari', () => {
  it('hammasi o\'tadi', () => {
    const buzilgan = invariantlarniTekshir().filter((x) => !x.ozgan);
    expect(buzilgan.map((x) => `${x.nom}: ${x.izoh}`)).toEqual([]);
  });

  it('invariantlarniTalabQil otmaydi', () => {
    expect(() => { invariantlarniTalabQil(); }).not.toThrow();
  });

  it('beshta tekshiruv bor', () => {
    expect(invariantlarniTekshir()).toHaveLength(5);
  });
});
