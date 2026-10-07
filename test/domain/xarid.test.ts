import { describe, expect, it } from 'vitest';
import {
  kechikkanmi,
  kutilyaptimi,
  narxBirligiMatni,
  qatorHolati,
  xaridHolati,
  xaridQatorSummasi,
} from '@/lib/domain/xarid';

describe('xarid buyurtmasi holati — 0063', () => {
  it('qolgan va ortiqcha', () => {
    expect(qatorHolati({ miqdor: '10', kelgan: '7' })).toEqual({ qolgan: '3.00', ortiqcha: '0.00' });
    expect(qatorHolati({ miqdor: '10', kelgan: '12' })).toEqual({ qolgan: '0.00', ortiqcha: '2.00' });
    // 0.1 + 0.2 — number bilan xato chiqardi
    expect(qatorHolati({ miqdor: '0.3', kelgan: '0.30' }).qolgan).toBe('0.00');
  });

  it('ochiq buyurtma — kelganidan', () => {
    expect(xaridHolati('OCHIQ', [{ miqdor: '5', kelgan: '0' }])).toBe('KUTILMOQDA');
    expect(
      xaridHolati('OCHIQ', [
        { miqdor: '5', kelgan: '5' },
        { miqdor: '2', kelgan: '0' },
      ]),
    ).toBe('QISMAN');
    expect(
      xaridHolati('OCHIQ', [
        { miqdor: '5', kelgan: '6' },
        { miqdor: '2', kelgan: '2' },
      ]),
    ).toBe('TOLIQ');
  });

  it('egasining qarori ustun', () => {
    expect(xaridHolati('YOPILDI', [{ miqdor: '5', kelgan: '1' }])).toBe('YOPILDI');
    expect(xaridHolati('BEKOR', [{ miqdor: '5', kelgan: '0' }])).toBe('BEKOR');
  });

  it('kechikish — faqat kutilayotganda', () => {
    expect(kutilyaptimi('QISMAN')).toBe(true);
    expect(kechikkanmi('KUTILMOQDA', '2026-10-01', '2026-10-07')).toBe(true);
    expect(kechikkanmi('KUTILMOQDA', '2026-10-07', '2026-10-07')).toBe(false);
    expect(kechikkanmi('TOLIQ', '2026-10-01', '2026-10-07')).toBe(false);
    expect(kechikkanmi('QISMAN', null, '2026-10-07')).toBe(false);
  });
});

describe('xarid qatori summasi — taxmin', () => {
  const b = { narx: '4', miqdor: '10', odatdagiBoyiM: '50', odatdagiEniM: '3' } as const;
  it('rulonga, metrga, kv.m ga', () => {
    expect(xaridQatorSummasi({ ...b, asosi: 'BIRLIK' })).toBe('40.00');
    expect(xaridQatorSummasi({ ...b, asosi: 'METR' })).toBe('2000.00');
    expect(xaridQatorSummasi({ ...b, asosi: 'KV_M' })).toBe('6000.00');
  });
  it('o‘lcham yoki narx yo‘q — uydirilmaydi', () => {
    expect(xaridQatorSummasi({ ...b, asosi: 'METR', odatdagiBoyiM: null })).toBeNull();
    expect(xaridQatorSummasi({ ...b, asosi: 'KV_M', odatdagiEniM: null })).toBeNull();
    expect(xaridQatorSummasi({ ...b, asosi: 'BIRLIK', narx: null })).toBeNull();
  });
  it('birlik matni', () => {
    expect(narxBirligiMatni('METR', 'USD', 'rulon')).toBe('$/metr');
    expect(narxBirligiMatni('BIRLIK', 'SOM', 'dona')).toBe("so'm/dona");
  });
});
