/**
 * TZ 5.4 · 9.6 · 1.3-invariant — $ ↔ so'm ko'rsatish va ustama.
 *
 * ⚠️ Bu yerdagi o'girish EKRAN UCHUN. Bazaga faqat bitta valyutadagi
 *    raqam yoziladi — ikkalasini saqlash kurs o'zgargach ikki xil
 *    haqiqat yaratardi.
 */
import { describe, expect, it } from 'vitest';
import {
  hamrohQiymat,
  narxJuftiniYangila,
  saqlanadiganNarx,
  ustamaFoizi,
} from '@/lib/domain/narx-kalkulyatori';
import { katalogNarxi } from '@/lib/domain/narx';
import { kurs, pulMatn, type Som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

describe('hamrohQiymat — $ dan so\'mga', () => {
  it('12 $ × 12 800 = 153 600 so\'m', () => {
    expect(hamrohQiymat('12', '12800', 'USD_DAN_SOMGA')).toBe('153600.00');
  });

  it('kasrli narx aniq hisoblanadi (float xatosi yo\'q)', () => {
    // 0.1 + 0.2 muammosi bo'lgan joy — Decimal ishlatilgani shu uchun
    expect(hamrohQiymat('0.1', '3', 'USD_DAN_SOMGA')).toBe('0.30');
  });

  it('tiyingacha yaxlitlanadi', () => {
    expect(hamrohQiymat('1.005', '1', 'USD_DAN_SOMGA')).toBe('1.01');
  });
});

describe("hamrohQiymat — so'mdan $ ga", () => {
  it("153 600 so'm ÷ 12 800 = 12 $", () => {
    expect(hamrohQiymat('153600', '12800', 'SOM_DAN_USDGA')).toBe('12.00');
  });
});

describe('hamrohQiymat — to\'ldirilmagan yoki noto\'g\'ri kirish', () => {
  it("narx bo'sh — hech narsa ko'rsatilmaydi", () => {
    expect(hamrohQiymat('', '12800', 'USD_DAN_SOMGA')).toBe('');
  });

  it("kurs bo'sh — hech narsa ko'rsatilmaydi", () => {
    expect(hamrohQiymat('12', '', 'USD_DAN_SOMGA')).toBe('');
  });

  it('kurs nol — bo\'linish yiqilmaydi', () => {
    expect(hamrohQiymat('12', '0', 'SOM_DAN_USDGA')).toBe('');
  });

  it('manfiy kurs qabul qilinmaydi', () => {
    expect(hamrohQiymat('12', '-100', 'USD_DAN_SOMGA')).toBe('');
  });

  it('manfiy narx qabul qilinmaydi', () => {
    expect(hamrohQiymat('-5', '12800', 'USD_DAN_SOMGA')).toBe('');
  });

  it('harf yozilsa yiqilmaydi', () => {
    expect(hamrohQiymat('salom', '12800', 'USD_DAN_SOMGA')).toBe('');
    expect(hamrohQiymat('12', 'salom', 'USD_DAN_SOMGA')).toBe('');
  });

  it("nol narx — nol ko'rsatiladi, bu to'g'ri javob", () => {
    expect(hamrohQiymat('0', '12800', 'USD_DAN_SOMGA')).toBe('0.00');
  });
});

describe('ustamaFoizi — TZ 5.4', () => {
  it('100 000 → 130 000 = 30%', () => {
    expect(ustamaFoizi('100000', 'SOM', '130000', 'SOM')).toBe(30);
  });

  it('sotuv narxi tannarxdan past — manfiy foiz ko\'rinadi', () => {
    // Bu ATAYLAB ko'rsatiladi: zarar ko'rib sotayotganini bilishi kerak
    expect(ustamaFoizi('100000', 'SOM', '90000', 'SOM')).toBe(-10);
  });

  it('bir xonagacha yaxlitlanadi', () => {
    expect(ustamaFoizi('3', 'SOM', '4', 'SOM')).toBe(33.3);
  });

  it('valyutalar har xil — null (1.3-invariant: aralashtirilmaydi)', () => {
    expect(ustamaFoizi('12', 'USD', '200000', 'SOM')).toBeNull();
  });

  it("narxlardan biri bo'sh — null", () => {
    expect(ustamaFoizi('', 'SOM', '130000', 'SOM')).toBeNull();
    expect(ustamaFoizi('100000', 'SOM', '', 'SOM')).toBeNull();
  });

  it('tannarx nol — null (nolga bo\'linish)', () => {
    expect(ustamaFoizi('0', 'SOM', '130000', 'SOM')).toBeNull();
  });

  it('harf yozilsa yiqilmaydi', () => {
    expect(ustamaFoizi('salom', 'SOM', '130000', 'SOM')).toBeNull();
  });
});

describe("narxJuftiniYangila — $ va so'm bir-biriga bog'langan", () => {
  const BOSH = { dollar: '', som: '' };

  it("50 $ kiritildi, kurs 11 900 → so'm 595 000", () => {
    const y = narxJuftiniYangila(BOSH, 'DOLLAR', '50', '11900', false);
    expect(y.dollar).toBe('50');
    expect(y.som).toBe('595000.00');
  });

  it("so'm kiritilsa $ qayta hisoblanadi", () => {
    const y = narxJuftiniYangila(BOSH, 'SOM', '595000', '11900', false);
    expect(y.dollar).toBe('50.00');
    expect(y.som).toBe('595000');
  });

  it("kurs o'zgarsa so'm qayta hisoblanadi", () => {
    const j = { dollar: '50', som: '595000.00' };
    const y = narxJuftiniYangila(j, 'KURS', '12000', '12000', false);
    expect(y.som).toBe('600000.00');
    expect(y.dollar).toBe('50');
  });
});

describe('Yaxlitlash — kataklar qotadi', () => {
  /**
   * Egasining aynan aytgan holati: 50 $ × 11 900 = 595 000, lekin
   * u 600 000 ga sotmoqchi va $ 50 bo'lib qolishi kerak.
   */
  it("so'm qo'lda yaxlitlansa $ o'zgarmaydi", () => {
    const j = { dollar: '50', som: '595000.00' };
    const y = narxJuftiniYangila(j, 'SOM', '600000', '11900', true);
    expect(y.som).toBe('600000');
    expect(y.dollar).toBe('50');
  });

  it("yaxlitlanmagan bo'lsa o'sha o'zgarish $ ni ham o'zgartiradi", () => {
    const j = { dollar: '50', som: '595000.00' };
    const y = narxJuftiniYangila(j, 'SOM', '600000', '11900', false);
    expect(y.dollar).toBe('50.42');
  });

  it("yaxlitlangan narxni kurs o'zgarishi buzmaydi", () => {
    const j = { dollar: '50', som: '600000' };
    const y = narxJuftiniYangila(j, 'KURS', '12500', '12500', true);
    expect(y).toEqual(j);
  });

  it("yaxlitlangan holatda $ tahrirlansa so'm qotgan qoladi", () => {
    const j = { dollar: '50', som: '600000' };
    const y = narxJuftiniYangila(j, 'DOLLAR', '52', '11900', true);
    expect(y.som).toBe('600000');
    expect(y.dollar).toBe('52');
  });
});

describe('saqlanadiganNarx — bazaga qaysi raqam boradi', () => {
  const j = { dollar: '50', som: '600000' };

  it("yaxlitlangan narx SO'MDA qotadi — kurs uni o'zgartirmasin", () => {
    expect(saqlanadiganNarx(j, 'USD', true)).toEqual({ narx: '600000', valyuta: 'SOM' });
  });

  it('dollar tanlansa dollar saqlanadi', () => {
    expect(saqlanadiganNarx(j, 'USD', false)).toEqual({ narx: '50', valyuta: 'USD' });
  });

  it("so'm tanlansa so'm saqlanadi", () => {
    expect(saqlanadiganNarx(j, 'SOM', false)).toEqual({ narx: '600000', valyuta: 'SOM' });
  });

  it("ikkala raqam hech qachon birga saqlanmaydi (1.3-invariant)", () => {
    const s = saqlanadiganNarx(j, 'USD', false);
    expect(Object.keys(s)).toEqual(['narx', 'valyuta']);
  });
});

describe("katalogNarxi — dollardagi material narxi (5.4 · 1.3-invariant)", () => {
  const k = kurs('12800', new Date('2026-08-27'), 'JORIY');

  it("so'mdagi narx o'zgarishsiz qoladi", () => {
    expect(pulMatn(katalogNarxi('120000', 'SOM', k) as Som)).toBe('120000.00');
  });

  it('dollardagi narx kursga uriladi', () => {
    // 12 $ × 12 800 = 153 600 so'm
    expect(pulMatn(katalogNarxi('12', 'USD', k) as Som)).toBe('153600.00');
  });

  it("narx yo'q bo'lsa null — mato tanlanmagan holat", () => {
    expect(katalogNarxi(null, 'USD', k)).toBeNull();
  });

  it("so'mdagi narx uchun kurs KERAK EMAS", () => {
    expect(pulMatn(katalogNarxi('120000', 'SOM', null) as Som)).toBe('120000.00');
  });

  /**
   * ⚠️ ENG MUHIM TEKSHIRUV. Ilgari valyuta umuman o'qilmasdi va
   *    12 $ narx sotuvda 12 SO'M bo'lib chiqardi. Endi kurssiz
   *    dollarli narx JIMGINA qabul qilinmaydi — xato otiladi.
   */
  it('dollardagi narx uchun kurs bo‘lmasa XATO otiladi', () => {
    expect(() => katalogNarxi('12', 'USD', null)).toThrow(BiznesXato);
  });

  it("kurssiz dollar narxi hech qachon so'm deb qabul qilinmaydi", () => {
    let natija: unknown = 'otilmadi';
    try {
      natija = katalogNarxi('12', 'USD', null);
    } catch {
      natija = 'otildi';
    }
    expect(natija).toBe('otildi');
  });
});
