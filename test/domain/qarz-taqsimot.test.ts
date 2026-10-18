/**
 * TZ 6.7 · 6.8 · 11.6 · 2.2-invariant — qarzni buyurtmalarga taqsimlash
 * (egasi auditi 2026-10-06, 1-xato).
 */
import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  muddatOtganQarz,
  qarzYoshi,
  qarzniTaqsimla,
  tolovIntizomi,
  yopilganNasiyaKunlari,
  yoshOraligi,
  type JurnalQatori,
} from '@/lib/domain/qarz-taqsimot';

let n = 0;
const kun = (d: number): Date => new Date(Date.UTC(2026, 0, 1) + d * 86_400_000);
const q = (
  d: number,
  turi: string,
  summa: string,
  buyurtmaId: number | null = null,
  valyuta: 'SOM' | 'USD' = 'SOM',
): JurnalQatori => ({ id: ++n, sana: kun(d), turi, summa, valyuta, buyurtmaId });

const jami = (qs: readonly JurnalQatori[], v: 'SOM' | 'USD'): string =>
  qs
    .filter((x) => x.valyuta === v)
    .reduce((y, x) => y.plus(x.summa), new Decimal(0))
    .toFixed(2);

describe('qarzniTaqsimla', () => {
  it('EC-QRZ-01: kartochkadan to‘langan pul eng eski buyurtmani yopadi', () => {
    const qs = [
      q(0, 'SOTUV', '100000', 1),
      q(10, 'SOTUV', '50000', 2),
      q(20, 'TOLOV', '-120000'), // kartochkadan — buyurtmasiz
    ];
    const t = qarzniTaqsimla(qs);
    const b1 = t.bandlar.find((b) => b.buyurtmaId === 1);
    const b2 = t.bandlar.find((b) => b.buyurtmaId === 2);
    expect(b1?.qolgan).toBe('0.00');
    expect(b1?.yopildi).toEqual(kun(20));
    expect(b2?.tolangan).toBe('20000.00');
    expect(b2?.qolgan).toBe('30000.00');
    expect(t.qarz.SOM).toBe('30000.00');
  });

  it('EC-QRZ-02: buyurtmaga qilingan to‘lov avval O‘SHA buyurtmaga tushadi', () => {
    const t = qarzniTaqsimla([
      q(0, 'SOTUV', '100000', 1),
      q(5, 'SOTUV', '80000', 2),
      q(6, 'TOLOV', '-80000', 2),
    ]);
    expect(t.bandlar.find((b) => b.buyurtmaId === 1)?.qolgan).toBe('100000.00');
    expect(t.bandlar.find((b) => b.buyurtmaId === 2)?.yopildi).toEqual(kun(6));
  });

  it('EC-QRZ-03: buyurtmadan ortgan to‘lov boshqa qarzni yopadi, qolgani avans', () => {
    const qs = [
      q(0, 'SOTUV', '30000', 1),
      q(1, 'SOTUV', '50000', 2),
      q(2, 'TOLOV', '-100000', 2),
    ];
    const t = qarzniTaqsimla(qs);
    expect(t.bandlar.every((b) => b.qolgan === '0.00')).toBe(true);
    expect(t.avans.SOM).toBe('20000.00');
    expect(t.qarz.SOM).toBe('-20000.00');
    expect(t.qarz.SOM).toBe(jami(qs, 'SOM'));
  });

  it('EC-QRZ-04: storno qilingan buyurtma qarz bandi emas, unga to‘langani qaytadi', () => {
    const qs = [
      q(0, 'SOTUV', '40000', 1),
      q(1, 'TOLOV', '-40000', 1),
      q(2, 'SOTUV', '-40000', 1), // storno
      q(3, 'SOTUV', '25000', 2),
    ];
    const t = qarzniTaqsimla(qs);
    expect(t.bandlar.map((b) => b.buyurtmaId)).toEqual([2]);
    expect(t.bandlar[0]?.qolgan).toBe('0.00');
    expect(t.avans.SOM).toBe('15000.00');
    expect(t.qarz.SOM).toBe(jami(qs, 'SOM'));
  });

  it('EC-QRZ-05: so‘m to‘lovi dollarli qarzni yopmaydi (1.3)', () => {
    const qs = [q(0, 'SOTUV', '100', 1, 'USD'), q(1, 'TOLOV', '-1200000')];
    const t = qarzniTaqsimla(qs);
    expect(t.bandlar[0]?.qolgan).toBe('100.00');
    expect(t.avans.SOM).toBe('1200000.00');
    expect(t.qarz.USD).toBe('100.00');
  });

  it('EC-QRZ-06: boshlang‘ich qoldiq ham qarz bandi, avans keyingi sotuvni yopadi', () => {
    const qs = [
      q(0, 'AVANS', '-50000'),
      q(1, 'BOSHLANGICH', '20000'),
      q(5, 'SOTUV', '40000', 7),
    ];
    const t = qarzniTaqsimla(qs);
    expect(t.bandlar.find((b) => b.turi === 'BOSHLANGICH')?.qolgan).toBe('0.00');
    const b = t.bandlar.find((x) => x.buyurtmaId === 7);
    expect(b?.qolgan).toBe('10000.00');
    // ⚠️ Avans sotuvdan OLDIN kelgan — yopilish sanasi sotuv sanasidan erta bo'lmaydi
    expect(t.qarz.SOM).toBe(jami(qs, 'SOM'));
  });

  it('EC-QRZ-07: 2.2-invariant — taqsimotdan keyin qarz jurnal yig‘indisiga AYNAN teng', () => {
    const qs = [
      q(0, 'SOTUV', '123456.78', 1),
      q(1, 'SOTUV', '9999.99', 2),
      q(2, 'TOLOV', '-50000', 1),
      q(3, 'QAYTARISH', '-1000.50', 2),
      q(4, 'UMIDSIZ_QARZ', '-3000'),
      q(5, 'SOTUV', '-9999.99', 2),
      q(6, 'SOTUV', '77.77', 3, 'USD'),
      q(7, 'TOLOV', '-100', null, 'USD'),
    ];
    const t = qarzniTaqsimla(qs);
    expect(t.qarz.SOM).toBe(jami(qs, 'SOM'));
    expect(t.qarz.USD).toBe(jami(qs, 'USD'));
  });
});

describe('qarz yoshi va muddat', () => {
  const t = qarzniTaqsimla([
    q(0, 'SOTUV', '100000', 1),
    q(50, 'SOTUV', '200000', 2),
    q(85, 'SOTUV', '300000', 3),
  ]);
  const bugun = kun(100);

  it('EC-QRZ-08: oraliqlar 0-30 · 31-60 · 61-90 · 90+', () => {
    expect(yoshOraligi(30)).toBe('0-30');
    expect(yoshOraligi(31)).toBe('31-60');
    expect(yoshOraligi(91)).toBe('90+');
    expect(qarzYoshi(t.bandlar, 'SOM', bugun)).toEqual({
      '0-30': '300000.00',
      '31-60': '200000.00',
      '61-90': '0.00',
      '90+': '100000.00',
    });
  });

  it('EC-QRZ-09: muddat qo‘yilmagan bo‘lsa hech narsa muddati o‘tgan emas', () => {
    expect(muddatOtganQarz(t.bandlar, 'SOM', null, bugun)).toEqual({
      summa: '0.00',
      engEskiKun: null,
    });
  });

  it('EC-QRZ-10: 30 kunlik muddat — 50 va 100 kunliklar o‘tgan', () => {
    expect(muddatOtganQarz(t.bandlar, 'SOM', 30, bugun)).toEqual({
      summa: '300000.00',
      engEskiKun: 70,
    });
  });
});

describe('tolovIntizomi', () => {
  it('EC-QRZ-11: kartochkadan to‘langan buyurtma ham intizomga kiradi', () => {
    const t = qarzniTaqsimla([
      q(0, 'SOTUV', '100000', 1),
      q(10, 'TOLOV', '-100000'),
      q(20, 'SOTUV', '50000', 2),
    ]);
    expect(tolovIntizomi(t.bandlar, kun(50))).toEqual({
      ortachaKun: 10,
      engUzunKun: 10,
      tolanganSoni: 1,
      ochiqQarzKun: 30,
    });
  });
});

describe('yopilganNasiyaKunlari', () => {
  it('EC-QRZ-12: davr ichida yopilgan nasiya kunlari; naqd, ochiq va davrdan tashqarisi yo‘q', () => {
    const t = qarzniTaqsimla([
      q(0, 'SOTUV', '100000', 1),
      q(5, 'TOLOV', '-100000'), // 1 — 5-kunda yopildi (davrdan oldin)
      q(10, 'SOTUV', '50000', 2),
      q(10, 'TOLOV', '-50000', 2), // 2 — o'sha kuni naqd
      q(12, 'SOTUV', '80000', 3),
      q(30, 'TOLOV', '-80000'), // 3 — 18 kunda
      q(20, 'SOTUV', '40000', 4),
      q(34, 'TOLOV', '-40000'), // 4 — 14 kunda
      q(25, 'SOTUV', '70000', 5), // 5 — ochiq
    ]);
    expect(yopilganNasiyaKunlari(t.bandlar, kun(8), kun(40))).toEqual([18, 14]);
  });
});
