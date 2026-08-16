/**
 * QISM 1 §14.1 — TZ dagi kanonik raqamlar.
 *
 * 0-bosqichda ikkitasi tekshiriladi (K-01, K-02). Qolgan to'qqiztasining
 * raqami test/kanonik.ts da muzlatilgan va moduli qurilgan bosqichda
 * shu yerga qo'shiladi.
 */
import { describe, expect, it } from 'vitest';
import { K01, K02, KANONIK } from './kanonik';
import { kvM, kvMYigindi, sm, smToM, type KvadratMetr } from '@/lib/domain/birlik';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { kopaytir, pulKorsat, pulMatn, som } from '@/lib/domain/pul';

describe('K-01: karniz narxi — Q-01', () => {
  it("210 sm eni → 420 sm sarf → 4.20 m → 147 000 so'm", () => {
    const eni = sm(K01.eni);
    const qiymatlar = standartQiymatlar(eni, sm(140), 1);

    // Karniz — chiziqli material: smda sarflanadi (Q-01)
    const sarfSm = sarflashHisobla(K01.formula, qiymatlar, 'SM');
    expect(sarfSm).toBe(K01.sarflashSm);

    // Narx esa 1 METR uchun belgilangan — tizim ÷100 qiladi
    const sarfMetr = smToM(sarfSm as ReturnType<typeof sm>);
    expect(sarfMetr).toBe(K01.sarflashMetr);

    const jami = kopaytir(som(K01.narxMetrUchun), sarfMetr);
    expect(pulMatn(jami)).toBe(K01.jami);
    expect(pulKorsat(jami)).toBe('147 000');
  });

  it('Z-01 takrorlanmaydi: smni metr deb olsak 100 barobar xato chiqadi', () => {
    const notogri = kopaytir(som(K01.narxMetrUchun), K01.sarflashSm);
    expect(pulMatn(notogri)).toBe('14700000.00');
    // ya'ni 147 000 emas, 14 700 000. Shuning uchun birlik alohida tur.
  });
});

describe('K-02: slot formulalari — TZ 3.5', () => {
  it('Dikke 180 × 220, CHET = 30 → 0.66 + 0.66 + 2.64 = 3.96 kv.m', () => {
    const qiymatlar = standartQiymatlar(sm(K02.eni), sm(K02.boyi), 1, { CHET: K02.chet });

    const natijalar = K02.slotlar.map((slot) =>
      sarflashHisobla(slot.formula, qiymatlar, 'KV_M'),
    ) as KvadratMetr[];

    expect(natijalar).toEqual(K02.slotlar.map((s) => s.kutilgan));
    expect(kvMYigindi(natijalar)).toBe(K02.jami);
  });

  it("umumiy maydon slotlar yig'indisidan farq qiladi — 3.8 ogohlantirishi", () => {
    // 1.80 × 2.20 = 3.96 — bu yerda tasodifan teng, chunki slotlar butun enni qoplaydi
    expect(kvM(1.8 * 2.2)).toBe(K02.jami);
  });
});

describe('kanonik ro\'yxat butunligi', () => {
  it('TZ da 11 ta kanonik raqam bor', () => {
    expect(KANONIK).toHaveLength(11);
  });

  it('0-bosqichga tegishlilarining hammasi TAYYOR', () => {
    const nolinchi = KANONIK.filter((k) => k.bosqich === 0);
    expect(nolinchi).toHaveLength(2);
    expect(nolinchi.every((k) => k.holat === 'TAYYOR')).toBe(true);
  });

  it('kodlar takrorlanmaydi', () => {
    expect(new Set(KANONIK.map((k) => k.kod)).size).toBe(KANONIK.length);
  });
});
