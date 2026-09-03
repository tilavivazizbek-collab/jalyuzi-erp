/**
 * TZ 5.4 · 6.2 · 6.3 — UCH QATLAMLI narx.
 *
 * Egasining misoli (2026-08-30):
 *   Standart 120 000, «Optom» uchun 105 000, mijozga −2% offset
 *   → 105 000 × 0.98 = 102 900
 *
 * Optom narxi qo'yilmagan bo'lsa: 120 000 × 0.98 = 117 600
 */
import { describe, expect, it } from 'vitest';
import { amaldagiNarx, aksessuarNarxi, matoNarxi } from '@/lib/domain/narx';
import { pulMatn, som } from '@/lib/domain/pul';

describe('Uch qatlamli narx — ustunlik tartibi', () => {
  it('tur narxi FILIAL narxidan ham ustun', () => {
    const n = amaldagiNarx(som(120000), som(114000), som(105000));
    expect(pulMatn(n)).toBe('105000.00');
  });

  it('tur narxi yo‘q — filial narxi ishlaydi', () => {
    expect(pulMatn(amaldagiNarx(som(120000), som(114000), null))).toBe('114000.00');
  });

  it('ikkalasi ham yo‘q — standart', () => {
    expect(pulMatn(amaldagiNarx(som(120000), null, null))).toBe('120000.00');
  });

  it('⚠️ hech qachon narxsiz qolmaydi', () => {
    expect(pulMatn(amaldagiNarx(som(1), null))).toBe('1.00');
  });
});

describe('Egasining misoli — tur narxi + offset', () => {
  it('Optom 105 000 · offset −2% → 102 900', () => {
    const n = matoNarxi({
      standart: som(120000),
      filialNarxi: null,
      turNarxi: som(105000),
      offset: { turi: 'FOIZ', foiz: -2 },
      kurs: null,
    });
    expect(pulMatn(n)).toBe('102900.00');
  });

  it('Optom narxi qo‘yilmagan → standartdan −2% = 117 600', () => {
    const n = matoNarxi({
      standart: som(120000),
      filialNarxi: null,
      turNarxi: null,
      offset: { turi: 'FOIZ', foiz: -2 },
      kurs: null,
    });
    expect(pulMatn(n)).toBe('117600.00');
  });

  it('⚠️ OFFSET HECH QAYERDA O‘TKAZIB YUBORILMAYDI', () => {
    const turBilan = matoNarxi({
      standart: som(120000),
      filialNarxi: null,
      turNarxi: som(105000),
      offset: { turi: 'SOM', summa: som(-5000) },
      kurs: null,
    });
    expect(pulMatn(turBilan)).toBe('100000.00');
  });
});

describe('Aksessuar — tur narxi qo‘llanadi, offset yo‘q (6.3)', () => {
  it('optom mexanizmni ham optom narxda oladi', () => {
    expect(pulMatn(aksessuarNarxi(som(48000), null, som(40000)))).toBe('40000.00');
  });

  it('tur narxi yo‘q — standart', () => {
    expect(pulMatn(aksessuarNarxi(som(48000), null, null))).toBe('48000.00');
  });
});
