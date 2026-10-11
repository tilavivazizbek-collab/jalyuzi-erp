import { describe, expect, it } from 'vitest';
import { foydaZarar, ozgarishFoizi, xarajatModdaNomi } from '@/lib/domain/hisobot/foyda-zarar';

describe('foyda-zarar — 11.4.1', () => {
  const f = foydaZarar({
    tushum: '10000000',
    material: '4000000',
    ishHaqi: '1000000',
    xarajatlar: [
      { modda: 'OPERATSION', summa: '1500000' },
      { modda: 'KASSA_FARQI', summa: '10000' },
      { modda: 'BOSHQA', summa: '0' },
    ],
    kursZarar: '200000',
    kursDaromad: '50000',
  });

  it('tushum − tannarx − xarajat − kurs zarari + kurs daromadi', () => {
    expect(f.tannarx).toBe('5000000.00');
    expect(f.yalpiFoyda).toBe('5000000.00');
    expect(f.xarajatJami).toBe('1510000.00');
    // 5 000 000 − 1 510 000 − 200 000 + 50 000
    expect(f.sofFoyda).toBe('3340000.00');
    expect(f.rentabellik).toBe(33.4);
  });

  it('nol xarajat qatori ko‘rsatilmaydi, kattasi birinchi, nomlari bilan', () => {
    expect(f.xarajatlar.map((x) => x.nom)).toEqual(['Operatsion (ijara, kommunal…)', 'Kassa farqi (kun yopish)']);
    expect(xarajatModdaNomi('NOMALUM')).toBe('NOMALUM');
  });

  it('tushum nol — rentabellik yo‘q; o‘zgarish foizi', () => {
    expect(
      foydaZarar({ tushum: '0', material: '0', ishHaqi: '0', xarajatlar: [], kursZarar: '0', kursDaromad: '0' })
        .rentabellik,
    ).toBeNull();
    expect(ozgarishFoizi('120', '100')).toBe(20);
    expect(ozgarishFoizi('-50', '100')).toBe(-150);
    expect(ozgarishFoizi('10', '0')).toBeNull();
  });
});
