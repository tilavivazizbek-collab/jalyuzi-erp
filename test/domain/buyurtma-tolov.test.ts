import { describe, expect, it } from 'vitest';
import { buyurtmaTolovi } from '@/lib/domain/buyurtma-tolov';
import { qarzniTaqsimla, type JurnalQatori } from '@/lib/domain/qarz-taqsimot';

const q = (id: number, sana: string, turi: string, summa: string, b: number | null): JurnalQatori => ({
  id,
  sana: new Date(`${sana}T12:00:00+05:00`),
  turi,
  summa,
  valyuta: 'SOM',
  buyurtmaId: b,
});

describe('buyurtma to‘landimi', () => {
  // B1 300 000, B2 200 000; mijoz kartochkadan 400 000 to'ladi
  const t = qarzniTaqsimla([
    q(1, '2026-10-01', 'SOTUV', '300000', 1),
    q(2, '2026-10-02', 'SOTUV', '200000', 2),
    q(3, '2026-10-03', 'TOLOV', '-400000', null),
  ]);
  const band = (id: number) => t.bandlar.find((b) => b.buyurtmaId === id);

  it('kartochkadan to‘lov eski buyurtmani to‘liq yopadi', () => {
    expect(buyurtmaTolovi({ jami: '300000', mijozlimi: true, band: band(1), kassa: '0' })).toEqual({
      tolangan: '300000.00',
      qolgan: '0.00',
      daraja: 'TOLANDI',
    });
    expect(buyurtmaTolovi({ jami: '200000', mijozlimi: true, band: band(2), kassa: '0' }).daraja).toBe('QISMAN');
  });

  it('mijozsiz — faqat bog‘langan kassa', () => {
    expect(buyurtmaTolovi({ jami: '100000', mijozlimi: false, kassa: '0' }).daraja).toBe('TOLANMAGAN');
    expect(buyurtmaTolovi({ jami: '100000', mijozlimi: false, kassa: '100000' }).daraja).toBe('TOLANDI');
    expect(buyurtmaTolovi({ jami: '100000', mijozlimi: false, kassa: '40000' }).qolgan).toBe('60000.00');
  });

  it('mijozli, bandi yo‘q — qarz yo‘q', () => {
    expect(buyurtmaTolovi({ jami: '0', mijozlimi: true, kassa: '0' }).daraja).toBe('TOLANDI');
  });
});
