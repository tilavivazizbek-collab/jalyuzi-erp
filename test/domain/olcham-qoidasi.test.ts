/**
 * test/domain/olcham-qoidasi.test.ts — 0053
 *
 * Oyna o'lchamidan tayyor jalyuzi o'lchamiga o'tish. Egasining
 * 2026-09-23 dagi holati: «mijoz buyurtma beradi… standart
 * belgilangan o'lcham bilan, agar belgilangan bo'lsa belgilangan
 * qo'shimcha bilan; keyin usta xohishicha o'zgartiraveradi inputni,
 * o'zgartirmasa eski holatida saqlanadi».
 */

import { describe, expect, it } from 'vitest';
import {
  olchamMatni,
  ornatishNuqsonlari,
  ornatishYuki,
  ornatishniTop,
  oynaOlchami,
  qoshimchaMatni,
  standartOrnatish,
  tayyorOlcham,
  type Ornatish,
} from '@/lib/domain/olcham-qoidasi';
import { BiznesXato } from '@/lib/xato';

const USTIGA: Ornatish = {
  id: 1,
  nom: 'Oyna ustiga',
  eniQoshimchaM: 0.1,
  boyiQoshimchaM: 0.15,
  standartmi: true,
};

const PROYOM: Ornatish = {
  id: 2,
  nom: 'Proyomga',
  eniQoshimchaM: -0.01,
  boyiQoshimchaM: -0.01,
  standartmi: false,
};

const POLDAN: Ornatish = {
  id: 3,
  nom: 'Poldan (dikkey)',
  eniQoshimchaM: 0,
  boyiQoshimchaM: -0.015,
  standartmi: false,
};

describe("EC-OLQ · oyna → tayyor o'lcham", () => {
  it('EC-OLQ-01 · devorga o\'rnatishda o\'lcham KATTALASHADI', () => {
    expect(tayyorOlcham({ eniM: 1.5, boyiM: 2.0 }, USTIGA)).toEqual({
      eniM: 1.6,
      boyiM: 2.15,
    });
  });

  it('EC-OLQ-02 · proyomga o\'rnatishda o\'lcham KICHRAYADI', () => {
    expect(tayyorOlcham({ eniM: 1.5, boyiM: 2.0 }, PROYOM)).toEqual({
      eniM: 1.49,
      boyiM: 1.99,
    });
  });

  it("EC-OLQ-03 · faqat bo'yiga tegadigan qoida enini o'zgartirmaydi", () => {
    // qo'shimcha avval 1 sm ga yaxlitlanadi: −0.015 → −0.02
    expect(tayyorOlcham({ eniM: 1.0, boyiM: 2.0 }, POLDAN)).toEqual({
      eniM: 1.0,
      boyiM: 1.98,
    });
  });

  it('EC-OLQ-04 · qoida yo\'q — o\'lcham o\'zgarmaydi (eski xulq)', () => {
    expect(tayyorOlcham({ eniM: 1.5, boyiM: 2.0 }, null)).toEqual({
      eniM: 1.5,
      boyiM: 2.0,
    });
  });

  /**
   * ⚠️ ENG MUHIM TEST: ikkilik kasr. 1.4 + 0.1 = 1.5000000000000002.
   *    Yaxlitlanmasa ekranda bir raqam, `numeric(8,2)` da boshqa
   *    turardi.
   */
  it('EC-OLQ-05 · ikkilik kasr yaxlitlanadi', () => {
    const t = tayyorOlcham({ eniM: 1.4, boyiM: 2.3 }, { ...USTIGA, boyiQoshimchaM: 0.1 });
    expect(t.eniM).toBe(1.5);
    expect(t.boyiM).toBe(2.4);
  });

  it('EC-OLQ-06 · natija nolga tushsa TO\'XTATADI', () => {
    expect(() =>
      tayyorOlcham({ eniM: 0.2, boyiM: 2.0 }, { ...PROYOM, eniQoshimchaM: -0.3 }),
    ).toThrow(BiznesXato);
  });

  it("EC-OLQ-07 · xato xabarida qoida NOMI bo'ladi", () => {
    try {
      tayyorOlcham({ eniM: 0.2, boyiM: 2.0 }, { ...PROYOM, eniQoshimchaM: -0.3 });
      expect.unreachable();
    } catch (x) {
      expect(x).toBeInstanceOf(BiznesXato);
      expect((x as BiznesXato).message).toContain('Proyomga');
    }
  });

  it('EC-OLQ-08 · son bo\'lmagan o\'lcham rad etiladi', () => {
    expect(() => tayyorOlcham({ eniM: Number.NaN, boyiM: 2 }, USTIGA)).toThrow(BiznesXato);
  });
});

describe('EC-OLQ · teskari hisob', () => {
  it('EC-OLQ-09 · tayyordan oyna chiqadi', () => {
    expect(oynaOlchami({ eniM: 1.6, boyiM: 2.15 }, USTIGA)).toEqual({
      eniM: 1.5,
      boyiM: 2.0,
    });
  });

  it('EC-OLQ-10 · borib-kelish yo\'qotishsiz', () => {
    const oyna = { eniM: 1.23, boyiM: 2.47 };
    expect(oynaOlchami(tayyorOlcham(oyna, PROYOM), PROYOM)).toEqual(oyna);
  });

  it('EC-OLQ-11 · qoida yo\'q — teskari hisob ham o\'zgartirmaydi', () => {
    expect(oynaOlchami({ eniM: 1.6, boyiM: 2.15 }, null)).toEqual({
      eniM: 1.6,
      boyiM: 2.15,
    });
  });
});

describe('EC-OLQ · standart tanlash', () => {
  it('EC-OLQ-12 · belgilangan standart olinadi', () => {
    expect(standartOrnatish([PROYOM, USTIGA, POLDAN])?.id).toBe(USTIGA.id);
  });

  /**
   * ⚠️ Standart belgilanmasa BIRINCHISI olinadi, `null` emas: bo'sh
   *    dropdown bilan ochilsa sotuvchi tanlashni unutar va oyna
   *    o'lchami tayyor o'lcham bo'lib ketardi.
   */
  it('EC-OLQ-13 · standart yo\'q bo\'lsa BIRINCHISI olinadi', () => {
    expect(standartOrnatish([PROYOM, POLDAN])?.id).toBe(PROYOM.id);
  });

  it("EC-OLQ-14 · ro'yxat bo'sh — null (tur qoidasiz)", () => {
    expect(standartOrnatish([])).toBeNull();
  });

  it('EC-OLQ-15 · id bo\'yicha topiladi', () => {
    expect(ornatishniTop([USTIGA, PROYOM], 2)?.nom).toBe('Proyomga');
    expect(ornatishniTop([USTIGA, PROYOM], 99)).toBeNull();
    expect(ornatishniTop([USTIGA, PROYOM], null)).toBeNull();
  });
});

describe('EC-OLQ · snapshot', () => {
  /**
   * 2.3-invariant: qoida ertaga tahrirlansa ham eski buyurtmaning
   * o'lchami tushuntirib beriladigan bo'lib qolsin.
   */
  it('EC-OLQ-16 · nom ham, IKKALA qo\'shimcha ham qotadi', () => {
    expect(ornatishYuki(USTIGA)).toEqual({
      ornatishId: 1,
      ornatishNom: 'Oyna ustiga',
      ornatishEniM: 0.1,
      ornatishBoyiM: 0.15,
    });
  });

  it('EC-OLQ-17 · qoida yo\'q — snapshot ham yo\'q', () => {
    expect(ornatishYuki(null)).toBeNull();
  });
});

describe('EC-OLQ · nuqsonlar', () => {
  it('EC-OLQ-18 · toza ro\'yxatda nuqson yo\'q', () => {
    expect(ornatishNuqsonlari([USTIGA, PROYOM, POLDAN])).toEqual([]);
  });

  it('EC-OLQ-19 · ikkita standart — nuqson', () => {
    const n = ornatishNuqsonlari([USTIGA, { ...PROYOM, standartmi: true }]);
    expect(n.some((x) => x.includes('BITTA'))).toBe(true);
  });

  it("EC-OLQ-20 · bir xil nom ikki marta — nuqson", () => {
    const n = ornatishNuqsonlari([USTIGA, { ...PROYOM, nom: 'oyna ustiga  ' }]);
    expect(n.some((x) => x.includes('ikki marta'))).toBe(true);
  });

  it("EC-OLQ-21 · bo'sh nom — nuqson", () => {
    expect(ornatishNuqsonlari([{ ...USTIGA, nom: '   ' }]).length).toBeGreaterThan(0);
  });

  it("EC-OLQ-22 · bo'sh ro'yxat — nuqson yo'q (qoidasiz tur)", () => {
    expect(ornatishNuqsonlari([])).toEqual([]);
  });
});

describe("EC-OLQ · ko'rsatish", () => {
  it('EC-OLQ-23 · qo\'shimcha belgisi bilan ko\'rinadi', () => {
    expect(qoshimchaMatni(USTIGA)).toBe('+0.10 × +0.15');
    expect(qoshimchaMatni(PROYOM)).toBe('−0.01 × −0.01');
    expect(qoshimchaMatni(POLDAN)).toBe('0 × −0.02');
  });

  /**
   * ⚠️ Usta ish varag'ida IKKALA o'lchamni ko'rishi kerak — xato
   *    aynan ularning orasida tug'iladi.
   */
  it('EC-OLQ-24 · matnda oyna ham, tayyor ham bor', () => {
    const m = olchamMatni({ eniM: 1.5, boyiM: 2.0 }, { eniM: 1.6, boyiM: 2.15 }, 'Oyna ustiga');
    expect(m).toContain('1.50');
    expect(m).toContain('1.60');
    expect(m).toContain('Oyna ustiga');
  });

  it("EC-OLQ-25 · oyna o'lchami yo'q — faqat tayyor ko'rinadi", () => {
    expect(olchamMatni(null, { eniM: 1.6, boyiM: 2.15 }, null)).toBe('1.60 × 2.15 m');
  });

  /**
   * ⚠️ POLDAN qo'shimchasi −0.015, lekin tizimning aniqligi BIR
   *    SANTIMETR (`numeric(_,2)`). Ekrandagi raqam ham, hisobdagi
   *    raqam ham, snapshotdagi raqam ham AYNAN BIR XIL bo'lishi
   *    shart: ilgari `toFixed` pastga, Postgres yuqoriga
   *    yaxlitlab, bitta qoida ikki xil son berardi.
   */
  it('EC-OLQ-26 · sm dan mayda qoida uchta joyda ham bir xil yaxlitlanadi', () => {
    expect(qoshimchaMatni(POLDAN)).toContain('0.02');
    expect(tayyorOlcham({ eniM: 1.0, boyiM: 2.0 }, POLDAN).boyiM).toBe(1.98);
    expect(ornatishYuki(POLDAN)?.ornatishBoyiM).toBe(-0.02);
  });
});
