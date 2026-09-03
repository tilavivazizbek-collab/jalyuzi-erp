/**
 * QISM 1 §14.1 — TZ dagi kanonik raqamlar.
 *
 * 0-bosqichda ikkitasi tekshiriladi (K-01, K-02). Qolgan to'qqiztasining
 * raqami test/kanonik.ts da muzlatilgan va moduli qurilgan bosqichda
 * shu yerga qo'shiladi.
 */
import { describe, expect, it } from 'vitest';
import { K01, K02, K03, K04, K05, K06, K07, K09, K10, KANONIK } from './kanonik';
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
import { dollar, kopaytir, kurs, kursFarqi, nolSom, pulKorsat, pulMatn, som } from '@/lib/domain/pul';
import { birlikTannarxi, xarajatniTaqsimla } from '@/lib/domain/tannarx';
import { bolakTanla, kesimBalansi, kesimQatorlari } from '@/lib/domain/kesish';
import { kunHisobi, xodimBalansi } from '@/lib/domain/balans';

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
    // 6-bosqichgacha qurilgan: K-01…K-07 · K-09 (kassa) · K-11 (filiallararo)
    const qurilgan = KANONIK.filter((k) => k.bosqich <= 6);
    expect(qurilgan).toHaveLength(9);
    expect(qurilgan.every((k) => k.holat === 'TAYYOR')).toBe(true);
  });

  it("barcha kanonik raqam TAYYOR — oxirgisi K-08 yopildi", () => {
    // K-08 (11.7.5 ustama eroziyasi) 8-bosqichda yopildi:
    // test/domain/hisobot-ombor.test.ts
    const kutayotgan = KANONIK.filter((k) => k.holat === 'KUTILMOQDA');
    expect(kutayotgan.map((k) => k.kod)).toEqual([]);
  });

  it('kodlar takrorlanmaydi', () => {
    expect(new Set(KANONIK.map((k) => k.kod)).size).toBe(KANONIK.length);
  });
});

describe('K-04: transport taqsimoti — TZ 7.9', () => {
  const qatorlar = K04.qatorlar.map((q, i) => ({
    id: i + 1,
    miqdor: 1,
    narxBirlik: som(q.qiymat),
    defektMiqdor: 0,
  }));

  it("ulushlar yig'indisi 2 000 000 — pul yo'qolmaydi va paydo bo'lmaydi", () => {
    const ulushlar = xarajatniTaqsimla(qatorlar, som(K04.xarajat));
    const jami = ulushlar.reduce((y, u) => y + Number(pulMatn(u.ulush)), 0);
    expect(jami).toBe(K04.jami);
    expect(jami).toBe(K04.tzMisoli.reduce((a, b) => a + b, 0));
  });

  it('aniq nisbat bo\'yicha ulushlar (P-16)', () => {
    const ulushlar = xarajatniTaqsimla(qatorlar, som(K04.xarajat));
    expect(ulushlar.map((u) => pulMatn(u.ulush))).toEqual(K04.aniqUlushlar);
  });
});

describe('K-05: brak tannarxga taqsimlanmaydi — TZ 7.9', () => {
  const qator = {
    id: 1,
    miqdor: K05.miqdor,
    narxBirlik: som(K05.narxBirlik),
    defektMiqdor: K05.defekt,
  };

  it("660 000 / 10 = 66 000, 73 333 EMAS (P-17)", () => {
    const n = birlikTannarxi(qator, nolSom(), 'HISOBDAN_CHIQADI');
    expect(pulMatn(n.birlikTannarx)).toBe(K05.birlikTannarx);
    expect(Number(pulMatn(n.birlikTannarx))).not.toBe(K05.notogriTannarx);
  });

  it("brak alohida zarar bo'lib chiqadi — yetkazib beruvchi ko'rinadi", () => {
    const n = birlikTannarxi(qator, nolSom(), 'HISOBDAN_CHIQADI');
    expect(pulMatn(n.defektZarari)).toBe(K05.defektZarari);
  });
});

describe('K-06: kesim uch qatori — TZ 7.6', () => {
  const manba = {
    id: 1,
    kod: 'O-207',
    turi: 'OSTATKA' as const,
    eniM: K06.manba.eniM,
    boyiM: K06.manba.boyiM,
    qismanOchilgan: false,
  };
  const qoldiq = { ...K06.qoldiq, saqlansinmi: true };
  const chegaralar = { yaroqsizM: null, kamIshlatiladiganM: null };

  it('3.60 = 1.20 + 2.40 + 0', () => {
    const n = kesimQatorlari(manba, qoldiq, chegaralar);
    expect(n.qatorlar[0]?.kvM).toBeCloseTo(K06.chiqdi, 4);
    expect(n.qatorlar[1]?.kvM).toBeCloseTo(K06.ostatka, 4);
    expect(n.qatorlar[2]?.kvM).toBeCloseTo(K06.chiqindi, 4);
    expect(n.mahsulotgaKvM).toBeCloseTo(K06.mahsulotga, 4);
  });

  it("QISM 3 §12 invarianti — chiqqan = ostatka + chiqindi + mahsulotga", () => {
    expect(kesimBalansi(kesimQatorlari(manba, qoldiq, chegaralar))).toBe(true);
  });

  it("tanlov aynan shu bo'lakni topadi (7.6 algoritmi)", () => {
    const n = bolakTanla([manba], K06.kerak);
    expect(n?.bolak.kod).toBe('O-207');
    expect(n?.manba).toBe('OSTATKA');
  });
});

// ─── K-09 · TZ 12.17 — kun yopish ─────────────────────────────────────────

describe('K-09: kun yopish — TZ 12.17', () => {
  it('850 000 + 4 200 000 − 1 850 000 = 3 200 000', () => {
    const k = kunHisobi(som(K09.boshlangich), som(K09.kirim), som(K09.chiqim));
    expect(pulMatn(k.hisoblangan)).toBe(K09.hisoblangan);
  });
});

// ─── K-10 · AUDIT Z-12 — usta balansi ─────────────────────────────────────

describe('K-10: usta balansi — TZ 13.8 · AUDIT Z-12', () => {
  it('2 180 000 − 940 000 − 100 000 = 1 140 000', () => {
    const b = xodimBalansi([
      { turi: 'HAQ', summa: K10.haq, valyuta: 'SOM' },
      { turi: 'TOLOV', summa: K10.tolov, valyuta: 'SOM' },
      { turi: 'USHLANMA', summa: K10.ushlanma, valyuta: 'SOM' },
    ]);
    expect(pulMatn(b.som)).toBe(K10.balans);
  });
});
