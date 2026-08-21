/**
 * TZ 10.4 · 10.5 · 12.1 · 12.17 · 2.2-invariant · AUDIT Z-12 · K-09 · K-10
 */
import { describe, expect, it } from 'vitest';
import {
  kunFarqi,
  kunHisobi,
  manfiyBalansmi,
  nofaolQilinadimi,
  pulChiqmaydimi,
  tolovniBalansValyutasiga,
  xarajatgaTushadimi,
  xodimBalansi,
  type XodimHarakati,
} from '@/lib/domain/balans';
import { pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const h = (turi: string, summa: string, valyuta: 'SOM' | 'USD' = 'SOM'): XodimHarakati => ({
  turi,
  summa,
  valyuta,
});

// ─── K-10 · AUDIT Z-12 · Usta balansi ─────────────────────────────────────

describe('K-10 · AUDIT Z-12 — balans = hisoblangan − olingan − ushlangan', () => {
  it('2 180 000 − 940 000 − 100 000 = 1 140 000', () => {
    const b = xodimBalansi([
      h('HAQ', '2180000'),
      h('TOLOV', '-940000'),
      h('USHLANMA', '-100000'),
    ]);
    expect(pulMatn(b.som)).toBe('1140000.00');
  });

  it("bo'sh ro'yxatda balans nol", () => {
    const b = xodimBalansi([]);
    expect(pulMatn(b.som)).toBe('0.00');
    expect(pulMatn(b.dollar)).toBe('0.00');
  });

  it('1.3-band — so\'m va dollar ALOHIDA turadi', () => {
    const b = xodimBalansi([h('HAQ', '500000'), h('HAQ', '85', 'USD')]);
    expect(pulMatn(b.som)).toBe('500000.00');
    expect(pulMatn(b.dollar)).toBe('85.00');
  });
});

// ─── TZ 10.4 · Manfiy balans ──────────────────────────────────────────────

describe('TZ 10.4 — manfiy balans MUMKIN', () => {
  it('avans ishlaganidan ko\'p bo\'lsa manfiy', () => {
    const b = xodimBalansi([h('HAQ', '100000'), h('AVANS', '-300000')]);
    expect(pulMatn(b.som)).toBe('-200000.00');
    expect(manfiyBalansmi(b)).toBe(true);
  });

  it('musbat balans manfiy emas', () => {
    expect(manfiyBalansmi(xodimBalansi([h('HAQ', '100000')]))).toBe(false);
  });

  it('dollar manfiy bo\'lsa ham ushlanadi', () => {
    expect(manfiyBalansmi(xodimBalansi([h('AVANS', '-10', 'USD')]))).toBe(true);
  });
});

describe('TZ 10.4 — balansi nol bo\'lmagan xodim nofaol qilinmaydi', () => {
  it('nol balans — nofaol qilinadi', () => {
    expect(nofaolQilinadimi(xodimBalansi([h('HAQ', '100'), h('TOLOV', '-100')]))).toBe(
      true,
    );
  });

  it("qarzi qolgan xodim nofaol qilinmaydi", () => {
    expect(nofaolQilinadimi(xodimBalansi([h('HAQ', '100000')]))).toBe(false);
  });

  it('dollar qoldig\'i ham to\'sadi', () => {
    expect(nofaolQilinadimi(xodimBalansi([h('HAQ', '5', 'USD')]))).toBe(false);
  });
});

// ─── TZ 10.5 · Valyuta ────────────────────────────────────────────────────

describe("TZ 10.5 — to'lov balans valyutasiga o'giriladi", () => {
  it('660 000 so\'m ÷ 13 200 = 50 $', () => {
    expect(tolovniBalansValyutasiga('660000', 'SOM', 'USD', '13200')).toBe('50.00');
  });

  it('50 $ × 13 200 = 660 000 so\'m', () => {
    expect(tolovniBalansValyutasiga('50', 'USD', 'SOM', '13200')).toBe('660000.00');
  });

  it("valyuta bir xil bo'lsa o'girilmaydi va kurs kerak emas", () => {
    expect(tolovniBalansValyutasiga('660000', 'SOM', 'SOM', null)).toBe('660000');
  });

  it('valyuta boshqa, kurs yo\'q — RAD ETILADI', () => {
    expect(() => tolovniBalansValyutasiga('660000', 'SOM', 'USD', null)).toThrow(
      BiznesXato,
    );
  });

  it('nol kurs rad etiladi — bo\'luvchi', () => {
    expect(() => tolovniBalansValyutasiga('660000', 'SOM', 'USD', '0')).toThrow(
      BiznesXato,
    );
  });
});

// ─── TZ 12.1 · Xarajat ≠ kassa chiqimi ────────────────────────────────────

describe('TZ 12.1 — xarajat va kassa chiqimi BOSHQA narsa', () => {
  it("pul chiqmaydigan xarajatlar", () => {
    expect(pulChiqmaydimi('OMBOR_BRAKI')).toBe(true);
    expect(pulChiqmaydimi('CHIQINDI')).toBe(true);
    expect(pulChiqmaydimi('ISH_HAQI')).toBe(true);
    expect(pulChiqmaydimi('UMIDSIZ_QARZ')).toBe(true);
  });

  it('pul chiqadigan xarajatlar', () => {
    expect(pulChiqmaydimi('OPERATSION')).toBe(false);
    expect(pulChiqmaydimi('TRANSPORT_BOJXONA')).toBe(false);
    expect(pulChiqmaydimi('BANK_KOMISSIYASI')).toBe(false);
  });

  it("ish haqi TO'LOVI xarajat EMAS — haq allaqachon yozilgan", () => {
    expect(xarajatgaTushadimi('C4')).toBe(false);
    expect(xarajatgaTushadimi('C5')).toBe(false);
  });

  it("yetkazib beruvchiga to'lov xarajat emas — mol tannarxga kirgan", () => {
    expect(xarajatgaTushadimi('C1')).toBe(false);
    expect(xarajatgaTushadimi('C2')).toBe(false);
  });

  it('egasi pul olishi va topshiriq xarajat emas', () => {
    expect(xarajatgaTushadimi('C8')).toBe(false);
    expect(xarajatgaTushadimi('C9')).toBe(false);
  });

  it('operatsion xarajat kassadan chiqadi VA xarajat', () => {
    expect(xarajatgaTushadimi('C7')).toBe(true);
  });
});

// ─── K-09 · TZ 12.17 · Kun yopish ─────────────────────────────────────────

describe('K-09 · TZ 12.17 — kun yopish', () => {
  it('850 000 + 4 200 000 − 1 850 000 = 3 200 000', () => {
    const k = kunHisobi(som('850000'), som('4200000'), som('1850000'));
    expect(pulMatn(k.hisoblangan)).toBe('3200000.00');
  });

  it("sanalgan hisoblangandan ko'p — ortiqcha", () => {
    expect(pulMatn(kunFarqi(som('3200000'), som('3250000')))).toBe('50000.00');
  });

  it('sanalgan kam — yetishmaydi', () => {
    expect(pulMatn(kunFarqi(som('3200000'), som('3150000')))).toBe('-50000.00');
  });

  it('farq nol — kassa to\'g\'ri', () => {
    expect(pulMatn(kunFarqi(som('3200000'), som('3200000')))).toBe('0.00');
  });
});
