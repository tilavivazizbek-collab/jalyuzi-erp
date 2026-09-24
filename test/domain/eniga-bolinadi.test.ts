/**
 * test/domain/eniga-bolinadi.test.ts — egasi so'rovi 2026-09-24
 *
 * «Mato eni kichik, 1 metrda 9 ta mato ketadi… aniq formula:
 *  buyurtma eni / mahsulot eni × bo'yi».
 *
 * ⚠️ «Tasmalab» dan FARQI — ikkisi IKKI XIL son beradi:
 *
 *      Tasmalab        → soni × tasma eni × bo'yi  = KV.M
 *      Eniga bo'linadi → soni × bo'yi             = UZUNLIK
 */

import { describe, expect, it } from 'vitest';
import { formuladanSarf, sarfFormulasi } from '@/lib/domain/sarf-turi';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { m } from '@/lib/domain/birlik';

const bolinish = (materialEniM: string, yaxlitlash: 'CEIL' | 'ROUND' | 'FLOOR' = 'CEIL') => ({
  materialEniM,
  yaxlitlash,
});

/** 2.00 × 1.50 m buyurtma */
const q = standartQiymatlar(m(2), m(1.5), 1, {});

describe('EC-EB · formula matni', () => {
  it('EC-EB-01 · egasining formulasi aynan chiqadi', () => {
    expect(sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0.11'))).toBe(
      "CEIL(ENI / 0.11) * BO'YI",
    );
  });

  it('EC-EB-02 · yaxlitlash tanlovi formulaga tushadi', () => {
    expect(
      sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0.11', 'ROUND')),
    ).toBe("ROUND(ENI / 0.11) * BO'YI");
    expect(
      sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0.11', 'FLOOR')),
    ).toBe("FLOOR(ENI / 0.11) * BO'YI");
  });

  /** ⚠️ Nolga bo'lish butun hisobni cheksizlikka olib ketardi */
  it('EC-EB-03 · nol yoki bo’sh eni RAD ETILADI', () => {
    expect(() => sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0'))).toThrow();
    expect(() => sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish(''))).toThrow();
    expect(() => sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('-1'))).toThrow();
  });

  it('EC-EB-04 · sozlama berilmasa RAD ETILADI', () => {
    expect(() => sarfFormulasi('ENIGA_BOLINADI', '', '')).toThrow();
  });
});

describe('EC-EB · hisob', () => {
  /**
   * Egasining misoli: «1 metrda 9 ta mato ketadi» → mato eni ≈ 0.11 m.
   * 2 m buyurtmaga 2 / 0.11 = 18.18 → 19 ta bo'lak.
   * Har bo'lak 1.50 m → 28.50 m.
   */
  it('EC-EB-05 · 2.00 m eni, 0.11 m mato → 19 ta bo’lak × 1.50 m', () => {
    const f = sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0.11'));
    expect(Number(sarflashHisobla(f, q, 'M'))).toBeCloseTo(28.5, 4);
  });

  it('EC-EB-06 · yaxlitlash pastga bo’lsa bitta kam', () => {
    const f = sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0.11', 'FLOOR'));
    /** 18.18 → 18 ta × 1.50 = 27.00 */
    expect(Number(sarflashHisobla(f, q, 'M'))).toBeCloseTo(27, 4);
  });

  /** ⚠️ Aynan bo'lingan holat: yaxlitlash hech narsa qo'shmasin */
  it('EC-EB-07 · aynan bo’linsa ortiqcha bo’lak qo’shilmaydi', () => {
    const f = sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0.50'));
    /** 2.00 / 0.50 = 4 ta × 1.50 = 6.00 */
    expect(Number(sarflashHisobla(f, q, 'M'))).toBeCloseTo(6, 4);
  });

  /**
   * ⚠️ «Tasmalab» bilan SOLISHTIRISH — ikkisi boshqa son berishi
   *    ATAYLAB shunday. Agar bir xil chiqsa, ikkinchi tur keraksiz
   *    bo'lardi va kimdir ularni almashtirib yuborardi.
   */
  it('EC-EB-08 · «Tasmalab» dan BOSHQA son beradi', () => {
    const bolinadi = sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish('0.11'));
    const tasmali = sarfFormulasi('TASMALI', '', '', {
      qadam: '0.11',
      tasmaEniM: '0.11',
      yaxlitlash: 'CEIL',
      qoshimchaSoni: '',
      zapasM: '',
    });

    const a = Number(sarflashHisobla(bolinadi, q, 'M'));
    const b = Number(sarflashHisobla(tasmali, q, 'KV_M'));
    /** Tasmalab material eniga HAM ko'paytiradi: 28.50 × 0.11 = 3.135 */
    expect(a).toBeCloseTo(28.5, 4);
    expect(b).toBeCloseTo(3.135, 4);
    expect(a).not.toBeCloseTo(b, 2);
  });
});

describe('EC-EB · borib-kelish', () => {
  /**
   * ⚠️ BU TEST BO'LMASA saqlangan tur tahrirda «Murakkab» bo'lib
   *    ochilardi: formula bazada to'g'ri turar, lekin ekran uni
   *    tanimasdi va egasi kataklarni boshqatdan to'ldirishga majbur
   *    bo'lardi.
   */
  it('EC-EB-09 · formula ekranga QAYTIB keladi', () => {
    for (const eni of ['0.11', '0.4', '1', '0.055']) {
      for (const y of ['CEIL', 'ROUND', 'FLOOR'] as const) {
        const f = sarfFormulasi('ENIGA_BOLINADI', '', '', undefined, bolinish(eni, y));
        expect(formuladanSarf(f)).toEqual({
          turi: 'ENIGA_BOLINADI',
          qiymat: '',
          qiymat2: '',
          materialEniM: eni,
          yaxlitlash: y,
        });
      }
    }
  });

  /**
   * ⚠️ «Tasmalab» qolipi bilan CHALKASHMAYDI. Ikkalasi ham
   *    `CEIL(ENI / son)` bilan boshlanadi; farqi — orasidagi
   *    ko'paytuvchi. Chalkashsa tahrirda butunlay boshqa tur
   *    ochilardi.
   */
  it('EC-EB-10 · «Tasmalab» formulasi bu tur deb o’qilmaydi', () => {
    const tasmali = sarfFormulasi('TASMALI', '', '', {
      qadam: '0.11',
      tasmaEniM: '0.4',
      yaxlitlash: 'CEIL',
      qoshimchaSoni: '',
      zapasM: '',
    });
    expect(formuladanSarf(tasmali).turi).toBe('TASMALI');
  });
});
