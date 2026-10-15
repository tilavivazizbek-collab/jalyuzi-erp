import { describe, expect, it } from 'vitest';
import { narxOzgarishi } from '@/lib/domain/hisobot/narx-dinamika';

const n = (sana: string, narx: string, kalit = 'RULON:SOM') => ({ sana, narx, kalit });

describe('TZ 9.8 · 11.9.1 — narxOzgarishi', () => {
  it('EC-ND-01: TZ misoli — 1 872 000 → 2 100 000, 8 oyda +12.2%', () => {
    expect(
      narxOzgarishi([n('2026-01-10', '1872000'), n('2026-05-01', '1950000'), n('2026-09-07', '2100000')]),
    ).toEqual({ foiz: 12.2, oylar: 8 });
  });

  it('EC-ND-02: asos yoki valyuta boshqa — foiz yo‘q (rulondan metrga «−98%» chiqmasin)', () => {
    expect(narxOzgarishi([n('2026-01-10', '600000', 'RULON:SOM'), n('2026-02-10', '12000', 'METR:SOM')])).toEqual({
      foiz: null,
      oylar: null,
    });
    expect(narxOzgarishi([n('2026-01-10', '50', 'METR:USD'), n('2026-02-10', '640000', 'METR:SOM')]).foiz).toBeNull();
  });

  it('EC-ND-03: bitta nuqta, nol narx — foiz yo‘q; arzonlashsa manfiy; kamida 1 oy', () => {
    expect(narxOzgarishi([n('2026-01-10', '100')]).foiz).toBeNull();
    expect(narxOzgarishi([n('2026-01-10', '0'), n('2026-01-12', '100')]).foiz).toBeNull();
    expect(narxOzgarishi([n('2026-01-10', '100'), n('2026-01-12', '90')])).toEqual({ foiz: -10, oylar: 1 });
  });
});
