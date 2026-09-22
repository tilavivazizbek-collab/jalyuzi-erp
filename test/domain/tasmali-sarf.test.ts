/**
 * test/domain/tasmali-sarf.test.ts — egasi holati 2026-09-22
 *
 * ⚠️ EGASINING HAQIQIY MATOSI: dikkey uchun rulon, eni 0.40 m,
 *    bo'yi 100 m. Mato tepadan pastga tushadi va to'lqin hosil
 *    qiladi: orqa-oldinga tushib chiqqani uchun 0.40 m enli tasma
 *    oynada ~0.11 m joy egallaydi.
 *
 *    2 m enli oynaga 18 ta tasma tushadi (bir tomonga ochilsa).
 *
 * ⚠️ Bu yerdagi xato IKKI TOMONGA qimmat: kam hisoblansa mato
 *    yetmaydi va usta ishni to'xtatadi; ko'p hisoblansa ombordan
 *    ortiqcha band qilinadi va boshqa buyurtmaga yetmaydi.
 */

import { describe, expect, it } from 'vitest';
import { formuladanSarf, sarfFormulasi } from '@/lib/domain/sarf-turi';
import { slotSarfi, soniUchun, standartQiymatlar } from '@/lib/domain/formula';
import { m } from '@/lib/domain/birlik';
import { kesimOlchami } from '@/lib/domain/kesish';

/** Egasining sozlamasi: qadam 0.11 m, tasma eni 0.40 m */
const QADAM = '0.11';
const TASMA_ENI = '0.40';

describe('TASMALI sarf — egasining dikkey matosi', () => {
  it('EC-TASMA-01: formula ekrandagi to‘rt katakdan yasaladi', () => {
    expect(sarfFormulasi('TASMALI', QADAM, '0', TASMA_ENI, 'ROUND')).toBe(
      "ROUND(ENI / 0.11) * 0.4 * BO'YI",
    );
  });

  /**
   * ⚠️ MARKAZDAN OCHILISH — bitta kam tasma. Formula tilida SHART
   *    yo'q, shuning uchun bu «soniga qo'shimcha» katagi orqali
   *    yoziladi.
   */
  it('EC-TASMA-02: soniga qo‘shimcha manfiy bo‘lishi mumkin', () => {
    expect(sarfFormulasi('TASMALI', QADAM, '-1', TASMA_ENI, 'ROUND')).toBe(
      "(ROUND(ENI / 0.11) - 1) * 0.4 * BO'YI",
    );
  });

  it('EC-TASMA-03: formula ekranga QAYTA o‘qiladi', () => {
    const f = sarfFormulasi('TASMALI', QADAM, '-1', TASMA_ENI, 'CEIL');
    expect(formuladanSarf(f)).toEqual({
      turi: 'TASMALI',
      qiymat: '0.11',
      qiymat2: '-1',
      tasmaEniM: '0.4',
      yaxlitlash: 'CEIL',
    });
  });

  /**
   * ⚠️ EGASINING RAQAMI: 2 m oyna → 18 ta tasma.
   *    2 ÷ 0.11 = 18.18 → yaqiniga yaxlitlansa 18.
   */
  it('EC-TASMA-04: 2 m oynada 18 ta tasma — sarf 18 kv.m', () => {
    const f = sarfFormulasi('TASMALI', QADAM, '0', TASMA_ENI, 'ROUND');
    const sarf = slotSarfi(f, standartQiymatlar(m(2), m(2.5), 1), 'KV_M', 1);
    // 18 ta × 0.40 m × 2.50 m = 18.00 kv.m
    expect(sarf).toBeCloseTo(18, 2);
  });

  it('EC-TASMA-05: markazdan ochilsa 17 ta — sarf 17 kv.m', () => {
    const f = sarfFormulasi('TASMALI', QADAM, '-1', TASMA_ENI, 'ROUND');
    const sarf = slotSarfi(f, standartQiymatlar(m(2), m(2.5), 1), 'KV_M', 1);
    expect(sarf).toBeCloseTo(17, 2);
  });

  /**
   * ⚠️ ENG MUHIM TEKSHIRUV: ombordan 0.40 m enli tasma tortilishi
   *    kerak, 7.2 metr enli mato EMAS — bunday rulon dunyoda yo'q.
   */
  it('EC-TASMA-06: ombordan 0.40 m enli tasma tortiladi', () => {
    const f = sarfFormulasi('TASMALI', QADAM, '0', TASMA_ENI, 'ROUND');
    const sarf = slotSarfi(f, standartQiymatlar(m(2), m(2.5), 1), 'KV_M', 1);

    const kesim = kesimOlchami(sarf, 2.5, {
      koeffitsient: 1,
      yonalish: 'ENIGA',
      soni: 1,
      kesimEniM: 0.4,
    });

    expect(kesim.eniM).toBe(0.4);
    // 18.00 kv.m ÷ 0.40 m = 45 metr
    expect(kesim.boyiM).toBeCloseTo(45, 1);
  });

  /**
   * ⚠️ 100 metrli rulonga sig'adimi — sotuvchi shuni bilishi kerak.
   *    45 m ketadi, 55 m qoladi.
   */
  it('EC-TASMA-07: 100 m rulondan 45 m ketadi', () => {
    const f = sarfFormulasi('TASMALI', QADAM, '0', TASMA_ENI, 'ROUND');
    const sarf = slotSarfi(f, standartQiymatlar(m(2), m(2.5), 1), 'KV_M', 1);
    const kesim = kesimOlchami(sarf, 2.5, { kesimEniM: 0.4, soni: 1 });
    expect(100 - kesim.boyiM).toBeCloseTo(55, 1);
  });

  /**
   * ⚠️ MIJOZ NARXI BOSHQA HISOB: u oyna maydonidan olinadi
   *    (2 × 2.5 = 5 kv.m), sarflangan matodan emas (18 kv.m).
   *    Nisbat 3.6 barobar — dikkey narx jadvali shuni hisobga
   *    olishi SHART, aks holda har buyurtmada zarar bo'ladi.
   */
  it('EC-TASMA-08: mato sarfi oyna maydonidan 3.6 barobar ko‘p', () => {
    const f = sarfFormulasi('TASMALI', QADAM, '0', TASMA_ENI, 'ROUND');
    const sarf = slotSarfi(f, standartQiymatlar(m(2), m(2.5), 1), 'KV_M', 1);
    const oynaMaydoni = 2 * 2.5;
    expect(sarf / oynaMaydoni).toBeCloseTo(3.6, 1);
  });

  /**
   * ⚠️ `slotSarfi` BITTA buyum sarfini beradi; `soniUchun` uni
   *    songa ko'paytiradi (formulada `SONI` bo'lmasa). Chaqiruv
   *    tartibi `lib/amal/sarflash.ts` dagi bilan AYNAN bir xil —
   *    aks holda test haqiqatdan uzilib qolardi.
   */
  it('EC-TASMA-09: uchta bir xil parda — jami uch barobar', () => {
    const f = sarfFormulasi('TASMALI', QADAM, '0', TASMA_ENI, 'ROUND');
    const bir = slotSarfi(f, standartQiymatlar(m(2), m(2.5), 3), 'KV_M', 1);
    const sarf = soniUchun(f, bir, 3);
    expect(sarf).toBeCloseTo(54, 1);

    /** Kesim esa BITTA buyum uchun — usta uchta alohida to'plam kesadi */
    const kesim = kesimOlchami(sarf, 2.5, { kesimEniM: 0.4, soni: 3 });
    expect(kesim.boyiM).toBeCloseTo(45, 1);
  });
});
