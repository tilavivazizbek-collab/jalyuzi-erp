/** QISM 1 §19 — «bugun» Toshkent bo'yicha (2026-10-06) */
import { describe, expect, it } from 'vitest';
import { toshkentKuni } from '@/lib/domain/sana';

describe('toshkentKuni', () => {
  it('EC-SANA-01: Toshkentda yarim tundan keyin — YANGI kun, UTC da hali kecha', () => {
    // 2026-10-05 20:30 UTC = 2026-10-06 01:30 Toshkent
    const tun = new Date('2026-10-05T20:30:00Z');
    expect(tun.toISOString().slice(0, 10)).toBe('2026-10-05');
    expect(toshkentKuni(tun)).toBe('2026-10-06');
  });

  it('EC-SANA-02: kunduzi ikkalasi bir xil', () => {
    expect(toshkentKuni(new Date('2026-10-06T07:00:00Z'))).toBe('2026-10-06');
  });

  it('EC-SANA-03: 19:00 UTC dan keyin Toshkentda ertangi kun boshlanadi', () => {
    expect(toshkentKuni(new Date('2026-12-31T18:59:59Z'))).toBe('2026-12-31');
    expect(toshkentKuni(new Date('2026-12-31T19:00:00Z'))).toBe('2027-01-01');
  });
});
