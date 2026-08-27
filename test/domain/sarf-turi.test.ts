/**
 * TZ 4.4 · 4.5 · AUDIT B-01 — ekrandagi sarf tanlovi ↔ formula.
 *
 * ⚠️ Bu yerdagi xato OMBORDAN NOTO'G'RI MATERIAL yechilishiga olib
 *    keladi. «Enidan × 2» maydonga aylanib qolsa, 2 metrlik
 *    jalyuziga 4 metr karniz yozilardi va tannarx xato chiqardi.
 */
import { describe, expect, it } from 'vitest';
import {
  SARF_TAVSIFI,
  SARF_TURLARI,
  formuladanSarf,
  sarfFormulasi,
} from '@/lib/domain/sarf-turi';
import { formulaHisobla, formulaTekshir } from '@/lib/domain/formula';
import { BiznesXato } from '@/lib/xato';

describe('sarfFormulasi — tanlovdan formula', () => {
  it('Maydondan × 2 → «MAYDON * 2» (ikki qavat mato)', () => {
    expect(sarfFormulasi('MAYDON', '2')).toBe('MAYDON * 2');
  });

  it('Maydondan × 1.5 → Plisse matosi', () => {
    expect(sarfFormulasi('MAYDON', '1.5')).toBe('MAYDON * 1.5');
  });

  it('Enidan × 2 → «ENI * 2» (stepler lenta)', () => {
    expect(sarfFormulasi('ENI', '2')).toBe('ENI * 2');
  });

  it("Bo'yidan × 1 → zanjir", () => {
    expect(sarfFormulasi("BO'YI", '1')).toBe("BO'YI * 1");
  });

  it('Har donaga × 4 → «4» (kronshteyn)', () => {
    expect(sarfFormulasi('DONA', '4')).toBe('4');
  });

  it('Murakkab — yozilgani o‘zgarishsiz qoladi', () => {
    expect(sarfFormulasi('MURAKKAB', "(ENI - 60) * BO'YI")).toBe("(ENI - 60) * BO'YI");
  });

  it('`2.0` emas, `2` — formula matni odam o‘qishi uchun', () => {
    expect(sarfFormulasi('MAYDON', '2.0')).toBe('MAYDON * 2');
  });

  it("bo'sh, nol yoki manfiy sarf rad etiladi", () => {
    expect(() => sarfFormulasi('MAYDON', '')).toThrow(BiznesXato);
    expect(() => sarfFormulasi('MAYDON', '0')).toThrow(BiznesXato);
    expect(() => sarfFormulasi('MAYDON', '-2')).toThrow(BiznesXato);
    expect(() => sarfFormulasi('MAYDON', 'salom')).toThrow(BiznesXato);
  });

  it("bo'sh murakkab formula rad etiladi", () => {
    expect(() => sarfFormulasi('MURAKKAB', '   ')).toThrow(BiznesXato);
  });
});

describe('sarfFormulasi — natija formula qatlamida ishlaydi', () => {
  /**
   * ⚠️ Eng muhim tekshiruv: bu yerda yasalgan matn
   *    `lib/domain/formula.ts` uchun HAQIQIY formula bo'lishi kerak.
   *    Aks holda xato faqat sotuvchi mahsulotni sotmoqchi
   *    bo'lganda bilinardi.
   */
  it('har turdan chiqqan formula tekshiruvdan o‘tadi', () => {
    for (const t of SARF_TURLARI) {
      const f = t === 'MURAKKAB' ? "(ENI - 60) * BO'YI" : sarfFormulasi(t, '2');
      expect(formulaTekshir(f, []).yaroqli).toBe(true);
    }
  });

  it("«Enidan × 2» eni bo'yicha hisoblaydi, bo'yiga tegmaydi", () => {
    const f = sarfFormulasi('ENI', '2');
    // 200 sm eni, 100 sm bo'yi
    const a = formulaHisobla(f, { ENI: 200, "BO'YI": 100, MAYDON: 20000, SONI: 1 });
    // Bo'yi ikki barobar oshsa ham natija o'zgarmasligi kerak
    const b = formulaHisobla(f, { ENI: 200, "BO'YI": 200, MAYDON: 40000, SONI: 1 });
    expect(a.toNumber()).toBe(400);
    expect(b.toNumber()).toBe(400);
  });

  it('«Har donaga × 4» o‘lchamdan mutlaqo bog‘liq emas', () => {
    const f = sarfFormulasi('DONA', '4');
    const a = formulaHisobla(f, { ENI: 100, "BO'YI": 100, MAYDON: 10000, SONI: 1 });
    const b = formulaHisobla(f, { ENI: 300, "BO'YI": 250, MAYDON: 75000, SONI: 1 });
    expect(a.toNumber()).toBe(4);
    expect(b.toNumber()).toBe(4);
  });

  it('«Maydondan × 2» maydonga ikki barobar', () => {
    const f = sarfFormulasi('MAYDON', '2');
    expect(formulaHisobla(f, { ENI: 200, "BO'YI": 100, MAYDON: 20000, SONI: 1 }).toNumber()).toBe(40000);
  });
});

describe('formuladanSarf — saqlangan formulani ekranga qaytarish', () => {
  it('«MAYDON * 2» → Maydondan × 2', () => {
    expect(formuladanSarf('MAYDON * 2')).toEqual({ turi: 'MAYDON', qiymat: '2' });
  });

  it("bo'shliqsiz yozilgan ham o'qiladi", () => {
    expect(formuladanSarf('ENI*1.5')).toEqual({ turi: 'ENI', qiymat: '1.5' });
  });

  it('`×` belgisi ham `*` kabi o‘qiladi', () => {
    expect(formuladanSarf('MAYDON × 2')).toEqual({ turi: 'MAYDON', qiymat: '2' });
  });

  it('boshqa apostrof bilan yozilgani ham o‘qiladi', () => {
    expect(formuladanSarf('BO’YI * 3')).toEqual({ turi: "BO'YI", qiymat: '3' });
  });

  it('yolg‘iz son → Har donaga', () => {
    expect(formuladanSarf('4')).toEqual({ turi: 'DONA', qiymat: '4' });
  });

  it('ko‘paytmasiz `MAYDON` → × 1', () => {
    expect(formuladanSarf('MAYDON')).toEqual({ turi: 'MAYDON', qiymat: '1' });
  });

  it('murakkab formula MURAKKAB bo‘lib, o‘zgarishsiz qoladi', () => {
    const f = "(ENI - 2 * CHET) * BO'YI";
    expect(formuladanSarf(f)).toEqual({ turi: 'MURAKKAB', qiymat: f });
  });

  it("qo'shish borligi uchun sodda deb TAXMIN QILINMAYDI", () => {
    // «MAYDON * 2 + 100» ni «MAYDON × 2» deb o'qish sarfni buzardi
    expect(formuladanSarf('MAYDON * 2 + 100').turi).toBe('MURAKKAB');
  });

  it("bo'linish ham murakkab", () => {
    expect(formuladanSarf('MAYDON / 2').turi).toBe('MURAKKAB');
  });
});

describe('Borib-kelish qiymatni buzmaydi', () => {
  it('har raqamli tur formulaga aylanib, qaytib o‘ziga keladi', () => {
    const raqamlilar = SARF_TURLARI.filter((t) => SARF_TAVSIFI[t].raqamli);

    for (const t of raqamlilar) {
      for (const son of ['1', '2', '1.5', '4']) {
        const f = sarfFormulasi(t, son);
        const q = formuladanSarf(f);
        expect(q).toEqual({ turi: t, qiymat: son });
      }
    }
  });
});
