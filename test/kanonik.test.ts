/**
 * QISM 1 §14.1 — TZ dagi kanonik raqamlar.
 *
 * 0-bosqichda ikkitasi tekshiriladi (K-01, K-02). Qolgan to'qqiztasining
 * raqami test/kanonik.ts da muzlatilgan va moduli qurilgan bosqichda
 * shu yerga qo'shiladi.
 */
import { describe, expect, it } from 'vitest';
import { K01, K02, K03, K07, KANONIK } from './kanonik';
import {
  dona,
  kvM,
  kvMYigindi,
  kvSmToKvM,
  maydonKvSm,
  sm,
  smToM,
  type KvadratMetr,
} from '@/lib/domain/birlik';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { pozitsiyaNarxi, qatorSummasi, type Qator } from '@/lib/domain/narx';
import { dollar, kopaytir, kurs, kursFarqi, pulKorsat, pulMatn, som } from '@/lib/domain/pul';

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

describe('K-03: kanonik buyurtma — TZ 3.8', () => {
  it("Rollo 210 × 140 → 678 400 so'm", () => {
    // Maydon Q-05 bo'yicha eni × bo'yi dan hisoblanadi, kiritilmaydi
    const maydon = kvSmToKvM(maydonKvSm(sm(K03.eni), sm(K03.boyi)));
    expect(maydon).toBe(K03.maydonKvM);

    const qatorlar: Qator[] = [
      { nom: 'old mato', sarflashBirligi: 'KV_M', miqdor: maydon, narx: som('120000') },
      { nom: 'orqa mato', sarflashBirligi: 'KV_M', miqdor: maydon, narx: som('90000') },
      { nom: 'mexanizm', sarflashBirligi: 'DONA', miqdor: dona(1), narx: som('45000') },
      { nom: 'kronshteyn', sarflashBirligi: 'DONA', miqdor: dona(2), narx: som('5000') },
      { nom: 'brelok', sarflashBirligi: 'DONA', miqdor: dona(2), narx: som('3000') },
    ];

    // Har qator TZ 3.8 jadvalidagi raqamga mos kelishi kerak
    expect(qatorlar.map((q) => pulMatn(qatorSummasi(q)))).toEqual(
      K03.qatorlar.map((q) => q.jami),
    );

    expect(pulMatn(pozitsiyaNarxi(qatorlar, null))).toBe(K03.jami);
    expect(pulKorsat(pozitsiyaNarxi(qatorlar, null))).toBe('678 400');
  });
});

describe('K-07: kurs farqi — TZ 9.6', () => {
  const qarz = dollar(K07.qarzDollar);
  const kirim = kurs(K07.kirimKursi, new Date('2026-08-01'), 'SNAPSHOT');
  const tolov = kurs(K07.tolovKursi, new Date('2026-09-01'), 'JORIY');

  it("3 000 $: 39 600 000 − 37 950 000 = 1 650 000 xarajat", () => {
    const f = kursFarqi(qarz, kirim, tolov);
    expect(pulMatn(f.qotganTannarx)).toBe(K07.qotganTannarx);
    expect(pulMatn(f.tolovSummasi)).toBe(K07.tolovSummasi);
    expect(pulMatn(f.summa)).toBe(K07.farq);
    expect(f.turi).toBe('XARAJAT');
  });

  it('kurs tushsa — DAROMAD, alohida modda (xarajatga manfiy yozilmaydi)', () => {
    const tushgan = kurs('12100', new Date('2026-09-01'), 'JORIY');
    const f = kursFarqi(qarz, kirim, tushgan);
    expect(f.turi).toBe('DAROMAD');
    expect(pulMatn(f.summa)).toBe('1650000.00');
  });

  it("kurs o'zgarmasa farq yo'q", () => {
    expect(kursFarqi(qarz, kirim, kirim).turi).toBe('YOQ');
  });

  it('tannarx kirim kursida QOTADI — to\'lov kursi unga tegmaydi (2.3)', () => {
    const a = kursFarqi(qarz, kirim, tolov);
    const b = kursFarqi(qarz, kirim, kurs('20000', new Date('2026-10-01'), 'JORIY'));
    expect(pulMatn(a.qotganTannarx)).toBe(pulMatn(b.qotganTannarx));
  });
});

describe('kanonik ro\'yxat butunligi', () => {
  it('TZ da 11 ta kanonik raqam bor', () => {
    expect(KANONIK).toHaveLength(11);
  });

  it('qurilgan bosqichlarning raqamlari TAYYOR', () => {
    const qurilgan = KANONIK.filter((k) => k.bosqich <= 2);
    expect(qurilgan).toHaveLength(4);
    expect(qurilgan.every((k) => k.holat === 'TAYYOR')).toBe(true);
  });

  it('kodlar takrorlanmaydi', () => {
    expect(new Set(KANONIK.map((k) => k.kod)).size).toBe(KANONIK.length);
  });
});
