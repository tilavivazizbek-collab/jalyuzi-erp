/**
 * TZ 10.8 · 10.9 · 10.10 · 10.12 · 20.11.3 · 2.3-invariant
 */
import { describe, expect, it } from 'vitest';
import {
  bosqichniTop,
  haqHisobla,
  pozitsiyaHaqi,
  stavkaTanla,
  type Bosqich,
  type StavkaQatori,
} from '@/lib/domain/stavka';
import { pulMatn } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const s = (o: Partial<StavkaQatori> = {}): StavkaQatori => ({
  id: 1,
  mahsulotTurId: 10,
  filialId: null,
  xodimId: null,
  qiymat: '15000',
  birlik: 'DONA',
  amalQiladiDan: '2026-01-01',
  ...o,
});

// ─── TZ 10.9 · Ustunlik: xodim > filial > standart ────────────────────────

describe('TZ 10.9 — eng aniq mos stavka tanlanadi', () => {
  it('xodim stavkasi filialdan ham, standartdan ham ustun', () => {
    const n = stavkaTanla(
      [
        s({ id: 1, qiymat: '15000' }),
        s({ id: 2, filialId: 2, qiymat: '17000' }),
        s({ id: 3, xodimId: 5, qiymat: '20000' }),
      ],
      10,
      2,
      5,
      '2026-08-21',
    );
    expect(n?.id).toBe(3);
  });

  it('xodim stavkasi yo\'q — filial olinadi', () => {
    const n = stavkaTanla(
      [s({ id: 1, qiymat: '15000' }), s({ id: 2, filialId: 2, qiymat: '17000' })],
      10,
      2,
      5,
      '2026-08-21',
    );
    expect(n?.id).toBe(2);
  });

  it('ikkalasi ham yo\'q — standart', () => {
    const n = stavkaTanla([s({ id: 1 })], 10, 2, 5, '2026-08-21');
    expect(n?.id).toBe(1);
  });

  it("boshqa filialning stavkasi olinmaydi", () => {
    const n = stavkaTanla(
      [s({ id: 1 }), s({ id: 2, filialId: 99, qiymat: '99000' })],
      10,
      2,
      5,
      '2026-08-21',
    );
    expect(n?.id).toBe(1);
  });

  it("boshqa mahsulot turining stavkasi olinmaydi", () => {
    expect(stavkaTanla([s({ mahsulotTurId: 77 })], 10, 2, 5, '2026-08-21')).toBeNull();
  });
});

// ─── 2.3-invariant · Sana ─────────────────────────────────────────────────

describe("2.3-invariant — o'tgan ish eski stavkada qoladi", () => {
  it('kelajakdagi stavka BUGUNGI ishga qo\'llanmaydi', () => {
    const n = stavkaTanla(
      [
        s({ id: 1, qiymat: '15000', amalQiladiDan: '2026-01-01' }),
        s({ id: 2, qiymat: '20000', amalQiladiDan: '2026-12-01' }),
      ],
      10,
      2,
      5,
      '2026-08-21',
    );
    expect(n?.id).toBe(1);
  });

  it('bir xil darajada — KECHROQ boshlangani olinadi', () => {
    const n = stavkaTanla(
      [
        s({ id: 1, qiymat: '15000', amalQiladiDan: '2026-01-01' }),
        s({ id: 2, qiymat: '18000', amalQiladiDan: '2026-06-01' }),
      ],
      10,
      2,
      5,
      '2026-08-21',
    );
    expect(n?.id).toBe(2);
  });

  it("hali kuchga kirmagan stavka yagona bo'lsa — stavka YO'Q", () => {
    expect(
      stavkaTanla([s({ amalQiladiDan: '2027-01-01' })], 10, 2, 5, '2026-08-21'),
    ).toBeNull();
  });
});

// ─── TZ 10.8 · Bosqichli jadval ───────────────────────────────────────────

describe('TZ 10.8 — chegaraga AYNAN TENG qiymat QUYI bosqichga kiradi', () => {
  const jadval: Bosqich[] = [
    { chegaraKvM: 1.0, qiymat: '1' },
    { chegaraKvM: 1.5, qiymat: '2' },
    { chegaraKvM: null, qiymat: '3' },
  ];

  it('1.00 kv.m → 1', () => {
    expect(bosqichniTop(jadval, 1.0).qiymat).toBe('1');
  });

  it('1.01 kv.m → 2', () => {
    expect(bosqichniTop(jadval, 1.01).qiymat).toBe('2');
  });

  it('1.50 kv.m → 2', () => {
    expect(bosqichniTop(jadval, 1.5).qiymat).toBe('2');
  });

  it('1.51 kv.m → 3', () => {
    expect(bosqichniTop(jadval, 1.51).qiymat).toBe('3');
  });

  it("eng quyi bosqich MINIMAL HAQ — 0.3 kv.m ham to'lanadi", () => {
    expect(bosqichniTop(jadval, 0.3).qiymat).toBe('1');
  });

  it("tartibsiz ro'yxat ham to'g'ri ishlaydi", () => {
    const aralash: Bosqich[] = [
      { chegaraKvM: null, qiymat: '3' },
      { chegaraKvM: 1.5, qiymat: '2' },
      { chegaraKvM: 1.0, qiymat: '1' },
    ];
    expect(bosqichniTop(aralash, 1.2).qiymat).toBe('2');
  });

  it("bo'sh jadval rad etiladi", () => {
    expect(() => bosqichniTop([], 1.0)).toThrow(BiznesXato);
  });
});

// ─── TZ 10.8 · Haq hisoblash ──────────────────────────────────────────────

describe("TZ 10.8 — uch xil hisoblash usuli", () => {
  it("qat'iy summa — o'lchamdan qat'i nazar", () => {
    expect(pulMatn(haqHisobla('15000', 'DONA', 3.2))).toBe('15000.00');
    expect(pulMatn(haqHisobla('15000', 'DONA', 0.5))).toBe('15000.00');
  });

  it('kv.metrga — 18 000 × 3.2 = 57 600', () => {
    expect(pulMatn(haqHisobla('18000', 'KV_M', 3.2))).toBe('57600.00');
  });

  it("kasrli maydon aniq hisoblanadi", () => {
    expect(pulMatn(haqHisobla('18000', 'KV_M', 2.94))).toBe('52920.00');
  });
});

// ─── TZ 10.12 · Stavkasi yo'q mahsulot ────────────────────────────────────

describe('TZ 10.12 — stavkasi belgilanmagan tur ishlab chiqarishni TO\'XTATMAYDI', () => {
  it('haq 0 bo\'ladi va ogohlantirish bayrog\'i qo\'yiladi', () => {
    const n = pozitsiyaHaqi(null, 3.2);
    expect(pulMatn(n.haq)).toBe('0.00');
    expect(n.stavkaYoq).toBe(true);
  });

  it('stavka bor — ogohlantirish yo\'q', () => {
    const n = pozitsiyaHaqi(s({ qiymat: '18000', birlik: 'KV_M' }), 3.2);
    expect(pulMatn(n.haq)).toBe('57600.00');
    expect(n.stavkaYoq).toBe(false);
  });
});
