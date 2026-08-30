/**
 * Egasi (2026-08-30): «rulon bo'lsa narx 2 xil bo'ladi va
 * tanlanadi:
 *    1) bo'yi × narx      → 50 × 5 $  = 250 $
 *    2) bo'yi × eni × narx → 50 × 3 × 5 $ = 750 $
 *
 * Bu FAQAT KIRIMDA. Sotuvda har doim kv.m ishlaydi.»
 */
import { describe, expect, it } from 'vitest';
import { qatorQiymati, mutanosibNarx } from '@/lib/domain/tannarx';
import { pulMatn, som } from '@/lib/domain/pul';

const BOSH = { id: 0, miqdor: 1, defektMiqdor: 0 };

describe('Kirim narxining asosi', () => {
  it("BO'YIGA — 50 m × 5 = 250", () => {
    const q = qatorQiymati({
      ...BOSH,
      narxBirlik: som(5),
      narxAsosi: 'METR',
      jamiBoyiM: 50,
    });
    expect(pulMatn(q)).toBe('250.00');
  });

  it('KV.M GA — 50 × 3 × 5 = 750', () => {
    const q = qatorQiymati({
      ...BOSH,
      narxBirlik: som(5),
      narxAsosi: 'KV_M',
      jamiKvM: 150,
    });
    expect(pulMatn(q)).toBe('750.00');
  });

  it("BIRLIK — rulon soniga: 2 rulon × 5 = 10", () => {
    const q = qatorQiymati({
      ...BOSH,
      miqdor: 2,
      narxBirlik: som(5),
      narxAsosi: 'BIRLIK',
    });
    expect(pulMatn(q)).toBe('10.00');
  });

  it("KV.M da o'lcham kiritilmasa — xato, jimgina nolga tushmaydi", () => {
    expect(() =>
      qatorQiymati({ ...BOSH, narxBirlik: som(5), narxAsosi: 'KV_M', jamiKvM: 0 }),
    ).toThrow();
  });

  it("METRda bo'y kiritilmasa — xato", () => {
    expect(() =>
      qatorQiymati({ ...BOSH, narxBirlik: som(5), narxAsosi: 'METR', jamiBoyiM: 0 }),
    ).toThrow();
  });
});

describe('Qator qiymati bo‘laklarga mutanosib bo‘linadi', () => {
  /**
   * ⚠️ KV_M da kv.m tannarxi HAMMA RULONDA BIR XIL chiqishi
   *    kerak — aynan kelishilgan narx. Aks holda bir rulon
   *    qimmat, ikkinchisi arzon bo'lib, foyda hisobotini
   *    buzardi.
   */
  it('kv.m narxida har rulonning kv.m tannarxi bir xil', () => {
    // 50×3 = 150 kv.m va 20×2 = 40 kv.m, jami 190 kv.m, narx 5
    const jami = som(950); // 190 × 5
    const birinchi = mutanosibNarx(jami, 190, 150, 'maydoni');
    const ikkinchi = mutanosibNarx(jami, 190, 40, 'maydoni');

    expect(pulMatn(birinchi)).toBe('750.00');
    expect(pulMatn(ikkinchi)).toBe('200.00');

    // kv.m tannarxi: 750/150 = 5 va 200/40 = 5
    expect(Number(pulMatn(birinchi)) / 150).toBe(5);
    expect(Number(pulMatn(ikkinchi)) / 40).toBe(5);
  });

  it("metr narxida uzun rulon ko'proq to'lanadi", () => {
    // 50 m va 30 m, jami 80 m, narx 5 → jami 400
    const jami = som(400);
    expect(pulMatn(mutanosibNarx(jami, 80, 50, "bo'yi"))).toBe('250.00');
    expect(pulMatn(mutanosibNarx(jami, 80, 30, "bo'yi"))).toBe('150.00');
  });

  it('nol yoki manfiy o‘lchov — xato', () => {
    expect(() => mutanosibNarx(som(100), 0, 10, 'maydoni')).toThrow();
    expect(() => mutanosibNarx(som(100), 10, 0, 'maydoni')).toThrow();
  });
});
