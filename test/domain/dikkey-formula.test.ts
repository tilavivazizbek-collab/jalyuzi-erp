/**
 * Dikkey formulalarini bazaga yozishdan OLDIN tekshirish.
 * Egasining misoli: eni 1 m, bo'yi 2 m → 10 ta lamel, 20 m rulon, 8 kv.m.
 */
import { describe, expect, it } from 'vitest';
import { m } from '@/lib/domain/birlik';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { kesimOlchami } from '@/lib/domain/kesish';

const LAMEL_ENI = 0.4;   // rulon eni, metr
const QADAM = 0.1;       // bitta lamel egallaydigan joy, metr

const MATO = `CEIL(ENI / ${String(QADAM)}) * BO'YI * ${String(LAMEL_ENI)}`;
const BIGUNOK = `CEIL(ENI / ${String(QADAM)})`;

describe('dikkey — egasining misoli', () => {
  it("1.00 × 2.00 m → 10 ta lamel, 8 kv.m mato, kesim 0.40 × 20.00", () => {
    const q = standartQiymatlar(m(1), m(2), 1, {});

    expect(sarflashHisobla(BIGUNOK, q, 'DONA')).toBe(10);
    expect(sarflashHisobla(MATO, q, 'KV_M')).toBe(8);

    const kerak = kesimOlchami(8, 2, { kesimEniM: LAMEL_ENI });
    expect(kerak).toEqual({ eniM: 0.4, boyiM: 20 });
  });

  it('kasr eni yuqoriga yaxlitlanadi — yarim lamel bo\'lmaydi', () => {
    // 1.45 m → 14.5 ta emas, 15 ta lamel
    const q = standartQiymatlar(m(1.45), m(2), 1, {});
    expect(sarflashHisobla(BIGUNOK, q, 'DONA')).toBe(15);
    expect(sarflashHisobla(MATO, q, 'KV_M')).toBe(12);
  });

  it("ikkilik kasr ZARAR QILMAYDI — 1 / 0.1 aynan 10", () => {
    /**
     * ⚠️ Oddiy JavaScriptda `1 / 0.1 = 10.000000000000002` va CEIL
     *    11 berardi — bitta ortiqcha lamel har buyurtmada. Dvigatel
     *    Decimal ishlatgani uchun bunday bo'lmaydi. Test shuni
     *    qo'riqlaydi.
     */
    for (const eni of [1, 2, 3, 0.7, 1.3, 2.9]) {
      const q = standartQiymatlar(m(eni), m(2), 1, {});
      const kutilgan = Math.round(eni / QADAM);
      expect(sarflashHisobla(BIGUNOK, q, 'DONA')).toBe(kutilgan);
    }
  });

  it("bo'yi ikki barobar bo'lsa sarf ham ikki barobar", () => {
    const q1 = standartQiymatlar(m(1), m(2), 1, {});
    const q2 = standartQiymatlar(m(1), m(4), 1, {});
    expect(sarflashHisobla(MATO, q2, 'KV_M')).toBe(
      Number(sarflashHisobla(MATO, q1, 'KV_M')) * 2,
    );
  });
});
