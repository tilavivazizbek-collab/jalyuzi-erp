/**
 * TZ 7.10 · P-20 — boshlang'ich qoldiqning tannarxi.
 *
 * ⚠️ Egasi «metriga 5 $ edi» deydi, bazaga esa 1 KV.M ning
 *    tannarxi kerak. Bu hisob noto'g'ri bo'lsa, butun foyda
 *    hisoboti qiyshayadi.
 */
import { describe, expect, it } from 'vitest';
import { rulonKvMTannarxi } from '@/lib/domain/boshlangich-narx';
import { som } from '@/lib/domain/pul';

describe("Rulonning 1 kv.m tannarxi", () => {
  it('KV.M narxida tannarx AYNAN o‘sha narx', () => {
    // 50×3 va 20×2 — enlari boshqa, lekin narx kv.m ga berilgan
    const t = rulonKvMTannarxi('KV_M', som(5), [
      { eniM: 3, boyiM: 50 },
      { eniM: 2, boyiM: 20 },
    ]);
    expect(t).toBe('5.0000');
  });

  it("BO'YIGA narxida eni hisobga kiradi", () => {
    // 50 m × 5 = 250, maydon 50×3 = 150 kv.m → 250/150 = 1.6667
    const t = rulonKvMTannarxi('METR', som(5), [{ eniM: 3, boyiM: 50 }]);
    expect(Number(t)).toBeCloseTo(1.6667, 3);
  });

  it('bitta keng rulonning kv.m i arzonroq', () => {
    const ensiz = rulonKvMTannarxi('METR', som(5), [{ eniM: 2, boyiM: 50 }]);
    const keng = rulonKvMTannarxi('METR', som(5), [{ eniM: 4, boyiM: 50 }]);
    expect(Number(ensiz)).toBeGreaterThan(Number(keng));
  });

  it('RULONGA narxida — rulon soni × narx', () => {
    // 2 rulon × 300 = 600, maydon 150 + 40 = 190 → 3.1579
    const t = rulonKvMTannarxi('BIRLIK', som(300), [
      { eniM: 3, boyiM: 50 },
      { eniM: 2, boyiM: 20 },
    ]);
    expect(Number(t)).toBeCloseTo(3.1579, 3);
  });

  it('JAMI QIYMAT saqlanadi — o‘rtacha tannarx uni buzmaydi', () => {
    const bolaklar = [
      { eniM: 3, boyiM: 50 },
      { eniM: 2, boyiM: 20 },
    ];
    const jamiKvM = 150 + 40;
    const t = rulonKvMTannarxi('METR', som(5), bolaklar);

    // bo'yiga: (50 + 20) × 5 = 350
    expect(Number(t) * jamiKvM).toBeCloseTo(350, 2);
  });

  it("rulon yo'q yoki o'lchamsiz — xato, jimgina nol emas", () => {
    expect(() => rulonKvMTannarxi('METR', som(5), [])).toThrow();
    expect(() => rulonKvMTannarxi('METR', som(5), [{ eniM: 0, boyiM: 50 }])).toThrow();
  });
});
