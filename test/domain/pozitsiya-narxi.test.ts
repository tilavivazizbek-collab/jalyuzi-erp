/**
 * TZ 3.5 · 3.6 · 3.8 · 6.3 · Q-01 — pozitsiya narxini konstruktordan
 * yig'ish.
 *
 * ⚠️ K-03 kanonik raqami shu yerda uchidan uchigacha tekshiriladi:
 *    formula → miqdor → qator → jami. Ilgari bu zanjir faqat
 *    brauzerdagi formada bor edi va sinalmasdi.
 */
import { describe, expect, it } from 'vitest';
import { pozitsiyaNarxiniHisobla } from '@/lib/domain/pozitsiya-narxi';
import { K03 } from '../kanonik';

const OLD_MATO = {
  nom: 'old mato',
  formula: 'maydon',
  sarflashBirligi: 'KV_M' as const,
  narx: '120000',
};

const ORQA_MATO = {
  nom: 'orqa mato',
  formula: 'maydon',
  sarflashBirligi: 'KV_M' as const,
  narx: '90000',
};

const KRONSHTEYN = {
  nom: 'kronshteyn',
  formula: 'soni * 2',
  sarflashBirligi: 'DONA' as const,
  narx: '5000',
  majburiy: true,
};

/** K-03 — Rollo 210 × 140, ikki mato va uch aksessuar. */
const KANONIK = {
  eniSm: K03.eni,
  boyiSm: K03.boyi,
  soni: 1,
  parametrlar: {},
  slotlar: [OLD_MATO, ORQA_MATO],
  aksessuarlar: [
    {
      nom: 'mexanizm',
      formula: 'soni',
      sarflashBirligi: 'DONA' as const,
      narx: '45000',
      majburiy: true,
    },
    KRONSHTEYN,
    {
      nom: 'brelok',
      formula: 'soni * 2',
      sarflashBirligi: 'DONA' as const,
      narx: '3000',
      majburiy: true,
    },
  ],
  offset: null,
  xizmatHaqi: null,
};

describe('K-03 · TZ 3.8 — kanonik buyurtma 678 400', () => {
  it('jami aynan kanonik raqamga teng', () => {
    const n = pozitsiyaNarxiniHisobla(KANONIK);
    expect(n.jami).toBe(K03.jami);
  });

  it('har qator alohida to‘g‘ri — «har slot O‘Z narxi bilan»', () => {
    const n = pozitsiyaNarxiniHisobla(KANONIK);

    for (const kutilgan of K03.qatorlar) {
      const q = n.qatorlar.find((x) => x.nom === kutilgan.nom);
      expect(q, kutilgan.nom).toBeDefined();
      expect(q?.summa, kutilgan.nom).toBe(kutilgan.jami);
    }
  });

  it('maydon eni × bo‘yi dan chiqadi, kiritilmaydi (Q-05)', () => {
    const n = pozitsiyaNarxiniHisobla(KANONIK);
    const old = n.qatorlar.find((x) => x.nom === 'old mato');
    expect(old?.miqdor).toBeCloseTo(K03.maydonKvM, 4);
  });
});

describe('TZ 6.3 — offset MATOGA, aksessuarga TEGMAYDI', () => {
  it('−10% da mato arzonlashadi, aksessuar o‘zgarmaydi', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...KANONIK,
      offset: { turi: 'FOIZ', foiz: -10 },
    });

    const old = n.qatorlar.find((x) => x.nom === 'old mato');
    const mexanizm = n.qatorlar.find((x) => x.nom === 'mexanizm');

    // 120 000 − 10% = 108 000
    expect(Number(old?.birlikNarxi)).toBe(108_000);
    // Aksessuar tegilmadi
    expect(Number(mexanizm?.birlikNarxi)).toBe(45_000);
  });

  it('offsetsiz narx kanonik bilan bir xil', () => {
    const a = pozitsiyaNarxiniHisobla(KANONIK);
    const b = pozitsiyaNarxiniHisobla({ ...KANONIK, offset: null });
    expect(a.jami).toBe(b.jami);
  });
});

describe('TZ 3.6 · 3.7 — qo‘lda tuzatish', () => {
  it('tuzatilgan miqdor NARXGA tayanadi', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...KANONIK,
      slotlar: [{ ...OLD_MATO, tuzatilganMiqdor: 3 }, ORQA_MATO],
    });

    const old = n.qatorlar.find((x) => x.nom === 'old mato');
    expect(old?.miqdor).toBe(3);
    // 3 × 120 000 = 360 000
    expect(Number(old?.summa)).toBe(360_000);
  });

  it('qo‘lda kiritilgan aksessuar soni formulani USTIDAN YOZMAYDI', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...KANONIK,
      aksessuarlar: [{ ...KRONSHTEYN, qoldaSoni: 5 }],
    });

    const k = n.qatorlar.find((x) => x.nom === 'kronshteyn');
    expect(k?.miqdor).toBe(5);
    expect(Number(k?.summa)).toBe(25_000);
  });
});

describe('TZ 4.7 — xizmat haqi', () => {
  it('jamiga qo‘shiladi', () => {
    const n = pozitsiyaNarxiniHisobla({ ...KANONIK, xizmatHaqi: '50000' });
    expect(Number(n.jami)).toBe(678_400 + 50_000);
  });
});

describe('narxsiz mato — buyurtma yig‘ilaveradi', () => {
  it('narxi yo‘q slot nol bilan hisoblanadi, yiqilmaydi', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...KANONIK,
      slotlar: [{ ...OLD_MATO, narx: null }, ORQA_MATO],
    });

    const old = n.qatorlar.find((x) => x.nom === 'old mato');
    expect(old?.birlikNarxi).toBeNull();
    expect(Number(old?.summa)).toBe(0);
    // Qolgan qatorlar hisoblanaveradi
    expect(Number(n.jami)).toBe(678_400 - 352_800);
  });
});
