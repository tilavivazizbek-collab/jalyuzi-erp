/**
 * LOYIHA T-04 — sotuv paytida kesim ko'rinishi. 2026-10-14.
 * Qoida yangi emas: bolakTanla + kesimRejasi + daraja — shu uchtasi birga.
 */
import { describe, expect, it } from 'vitest';
import { kesimKorinishi, type Bolak } from '@/lib/domain/kesish';

const b = (id: number, turi: Bolak['turi'], eniM: number, boyiM: number, qismanOchilgan = false): Bolak => ({
  id,
  kod: `B-${String(id)}`,
  turi,
  eniM,
  boyiM,
  qismanOchilgan,
});
const CHEGARA = { yaroqsizM: 0.5, kamIshlatiladiganM: 1 };

describe('T-04 — kesimKorinishi', () => {
  it('EC-KK-01: TZ 7.4 misoli — 3×35 rulondan 1.5×5: rulon 3×30 va kesma 1.5×5 qoladi', () => {
    const k = kesimKorinishi([b(1, 'RULON', 3, 35)], { eniM: 1.5, boyiM: 5 }, CHEGARA);
    expect(k).toEqual({
      bolakKod: 'B-1',
      manba: 'YANGI_RULON',
      bolak: { eniM: 3, boyiM: 35 },
      aniqMos: false,
      qoladi: [
        { eniM: 3, boyiM: 30, daraja: 'YAROQLI' },
        { eniM: 1.5, boyiM: 5, daraja: 'YAROQLI' },
      ],
    });
  });

  it('EC-KK-02: ostatka afzal (7.6 tartibi); tor kesma — daraja bilan', () => {
    const k = kesimKorinishi(
      [b(1, 'RULON', 3, 35), b(2, 'OSTATKA', 1.6, 2)],
      { eniM: 1.2, boyiM: 2 },
      CHEGARA,
    );
    expect(k?.manba).toBe('OSTATKA');
    expect(k?.bolakKod).toBe('B-2');
    expect(k?.qoladi).toEqual([{ eniM: 0.4, boyiM: 2, daraja: 'YAROQSIZ' }]);
  });

  it('EC-KK-03: aniq mos ostatka — hech narsa qolmaydi', () => {
    const k = kesimKorinishi([b(5, 'OSTATKA', 1.2, 2)], { eniM: 1.2, boyiM: 2 }, CHEGARA);
    expect(k).toMatchObject({ aniqMos: true, qoladi: [] });
  });

  it('EC-KK-04: ochilgan rulon yangi rulondan oldin; sig‘masa null', () => {
    const k = kesimKorinishi([b(1, 'RULON', 3, 35), b(2, 'RULON', 2.5, 10, true)], { eniM: 2, boyiM: 1.5 }, CHEGARA);
    expect(k?.manba).toBe('OCHILGAN_RULON');
    // Kesma eni aynan 0.50 — chegara «< 0.50» bo'lgani uchun yaroqsiz EMAS
    expect(k?.qoladi.map((q) => q.daraja)).toEqual(['YAROQLI', 'KAM_ISHLATILADIGAN']);
    expect(kesimKorinishi([b(1, 'RULON', 1, 35)], { eniM: 2, boyiM: 1 }, CHEGARA)).toBeNull();
  });
});
