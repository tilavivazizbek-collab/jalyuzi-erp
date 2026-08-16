/**
 * QISM 1 §8 — «5 martadan keyin 15 daqiqa bloklanadi»
 */
import { describe, expect, it } from 'vitest';
import {
  BLOK_DAQIQA,
  BOSHLANGICH,
  MAX_URINISH,
  blokQoldiqDaqiqa,
  bloklanganmi,
  muvaffaqiyatdanKeyin,
  qolganUrinish,
  xatodanKeyin,
  type BlokHolati,
} from '@/lib/kirish/blok';

const T0 = new Date('2026-08-16T10:00:00+05:00');
const keyin = (daqiqa: number): Date => new Date(T0.getTime() + daqiqa * 60_000);

/** n marta noto'g'ri parol kiritilgandagi holat */
const nMartaXato = (n: number, vaqt: Date = T0): BlokHolati => {
  let h = BOSHLANGICH;
  for (let i = 0; i < n; i += 1) h = xatodanKeyin(h, vaqt);
  return h;
};

describe('bloklash chegarasi', () => {
  it("4 xatodan keyin hali bloklanmaydi", () => {
    const h = nMartaXato(4);
    expect(bloklanganmi(h, T0)).toBe(false);
    expect(qolganUrinish(h, T0)).toBe(1);
  });

  it('5-xatoda bloklanadi', () => {
    const h = nMartaXato(MAX_URINISH);
    expect(bloklanganmi(h, T0)).toBe(true);
    expect(qolganUrinish(h, T0)).toBe(0);
  });

  it('boshida 5 urinish bor', () => {
    expect(qolganUrinish(BOSHLANGICH, T0)).toBe(MAX_URINISH);
    expect(bloklanganmi(BOSHLANGICH, T0)).toBe(false);
  });
});

describe('blok muddati — 15 daqiqa', () => {
  const bloklangan = nMartaXato(MAX_URINISH);

  it('14 daqiqada hali bloklangan', () => {
    expect(bloklanganmi(bloklangan, keyin(14))).toBe(true);
    expect(blokQoldiqDaqiqa(bloklangan, keyin(14))).toBe(1);
  });

  it('15 daqiqada ochiladi', () => {
    expect(bloklanganmi(bloklangan, keyin(BLOK_DAQIQA))).toBe(false);
    expect(blokQoldiqDaqiqa(bloklangan, keyin(BLOK_DAQIQA))).toBe(0);
  });

  it("qoldiq daqiqa yuqoriga yaxlitlanadi — «1 daqiqadan keyin» deyilsin", () => {
    expect(blokQoldiqDaqiqa(bloklangan, keyin(0))).toBe(BLOK_DAQIQA);
    expect(blokQoldiqDaqiqa(bloklangan, keyin(10.5))).toBe(5);
  });
});

describe('blok tugagandan keyin', () => {
  const bloklangan = nMartaXato(MAX_URINISH);

  it('hisoblagich noldan boshlanadi — yana 5 urinish beriladi', () => {
    const keyingi = keyin(BLOK_DAQIQA + 1);
    expect(qolganUrinish(bloklangan, keyingi)).toBe(MAX_URINISH);

    const yangi = xatodanKeyin(bloklangan, keyingi);
    expect(yangi.xatoUrinish).toBe(1);
    expect(bloklanganmi(yangi, keyingi)).toBe(false);
  });

  it("aks holda bir marta bloklangan xodim har xatosida darhol bloklanardi", () => {
    let h = bloklangan;
    const keyingi = keyin(BLOK_DAQIQA + 1);
    for (let i = 0; i < 4; i += 1) h = xatodanKeyin(h, keyingi);
    expect(bloklanganmi(h, keyingi)).toBe(false);
  });
});

describe('muvaffaqiyatli kirish', () => {
  it('hisoblagichni tozalaydi', () => {
    expect(muvaffaqiyatdanKeyin()).toEqual(BOSHLANGICH);
  });

  it("4 xatodan keyin to'g'ri parol kiritilsa hammasi tozalanadi", () => {
    const h = nMartaXato(4);
    expect(h.xatoUrinish).toBe(4);
    expect(muvaffaqiyatdanKeyin().xatoUrinish).toBe(0);
  });
});

describe('bloklangan paytdagi xato', () => {
  it('blok vaqtini uzaytirmaydi — 15 daqiqa 15 daqiqaligicha qoladi', () => {
    const bloklangan = nMartaXato(MAX_URINISH);
    const yana = xatodanKeyin(bloklangan, keyin(5));
    expect(yana.bloklangan?.getTime()).toBe(bloklangan.bloklangan?.getTime());
    expect(bloklanganmi(yana, keyin(BLOK_DAQIQA))).toBe(false);
  });
});
