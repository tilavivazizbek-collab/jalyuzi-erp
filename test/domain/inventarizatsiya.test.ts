/**
 * TZ 15.1 · Q-05 · AUDIT Z-05 (KRITIK) · U-06 · A-09
 *
 * Sanash varaqasi mantiqi — bazasiz.
 */
import { describe, expect, it } from 'vitest';
import {
  farqXarajatmi,
  qatorFarqi,
  sababniTekshir,
  varaqaYakuni,
  type SanashNatijasi,
  type SanashQatori,
} from '@/lib/domain/inventarizatsiya';
import { pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const rulon = (o: Partial<SanashQatori> = {}): SanashQatori => ({
  bolakId: 1,
  kod: 'R-118',
  turi: 'RULON',
  tizimdaEniM: 3.0,
  tizimdaBoyiM: 28.0,
  tizimdaMiqdor: null,
  tannarxBirlik: som('78000'),
  band: false,
  yolda: false,
  ...o,
});

const sanash = (o: Partial<SanashNatijasi> = {}): SanashNatijasi => ({
  eniM: null,
  boyiM: null,
  miqdor: null,
  sabab: null,
  izoh: null,
  ...o,
});

// ─── AUDIT Z-05 · KRITIK — kv.m KIRITILMAYDI ──────────────────────────────

describe('AUDIT Z-05 — varaqa metrda sanaladi, kv.m tizim hisoblaydi', () => {
  it("28 metr yozilsa 84 kv.m kutilmaydi — soxta farq CHIQMAYDI", () => {
    // Auditdagi aynan holat: R-118 rulon 3.00 × 28.00 m
    // Omborchi o'lchab «28» yozadi (bo'yi), eni o'zgarmagan.
    const f = qatorFarqi(rulon(), sanash({ eniM: 3.0, boyiM: 28.0 }));

    expect(f.farqKvM.toNumber()).toBe(0);
    expect(pulMatn(f.farqSumma)).toBe('0.00');
    expect(f.ozgardimi).toBe(false);
  });

  it("bo'yi 28.00 dan 26.00 ga tushsa — farq 6 kv.m, 468 000 so'm", () => {
    const f = qatorFarqi(
      rulon(),
      sanash({ eniM: 3.0, boyiM: 26.0, sabab: 'OLCHOV_XATOSI' }),
    );

    // (3 × 26) − (3 × 28) = 78 − 84 = −6 kv.m
    expect(f.farqKvM.toNumber()).toBe(-6);
    // −6 × 78 000 = −468 000
    expect(pulMatn(f.farqSumma)).toBe('-468000.00');
    expect(f.ozgardimi).toBe(true);
  });

  it('eni ham o\'zgarishi mumkin — chetidan yirtilgan rulon', () => {
    const f = qatorFarqi(
      rulon(),
      sanash({ eniM: 2.8, boyiM: 28.0, sabab: 'HISOBGA_OLINMAGAN_CHIQINDI' }),
    );
    // (2.8 × 28) − (3 × 28) = 78.4 − 84 = −5.6
    expect(f.farqKvM.toNumber()).toBeCloseTo(-5.6, 10);
  });
});

// ─── 15.1 · Ortiqcha — daromad emas, xarajat kamayishi ────────────────────

describe('TZ 15.1 — ortiqcha chiqsa daromad EMAS', () => {
  it('ortiqcha musbat son bo\'lib chiqadi, xarajat kamayadi', () => {
    const f = qatorFarqi(
      rulon(),
      sanash({ eniM: 3.0, boyiM: 30.0, sabab: 'OLCHOV_XATOSI' }),
    );
    expect(f.farqKvM.toNumber()).toBe(6);
    expect(pulMatn(f.farqSumma)).toBe('468000.00');
    expect(farqXarajatmi(f.farqSumma)).toBe(false);
  });

  it('yetishmovchilik XARAJAT deb belgilanadi', () => {
    const f = qatorFarqi(
      rulon(),
      sanash({ eniM: 3.0, boyiM: 20.0, sabab: 'YOQOLGAN' }),
    );
    expect(farqXarajatmi(f.farqSumma)).toBe(true);
  });
});

// ─── 15.1 · Sabab majburiy ────────────────────────────────────────────────

describe('TZ 15.1 — farq chiqsa sabab MAJBURIY', () => {
  it('sababsiz farq rad etiladi', () => {
    const f = qatorFarqi(rulon(), sanash({ eniM: 3.0, boyiM: 26.0 }));
    expect(() => {
      sababniTekshir(f, null);
    }).toThrow(BiznesXato);
  });

  it('farq bo\'lmasa sabab kerak emas', () => {
    const f = qatorFarqi(rulon(), sanash({ eniM: 3.0, boyiM: 28.0 }));
    expect(() => {
      sababniTekshir(f, null);
    }).not.toThrow();
  });

  it('xatoda BO\'LAK KODI ko\'rsatiladi — omborchi qaysi qator ekanini bilsin', () => {
    const f = qatorFarqi(rulon({ kod: 'O-207' }), sanash({ eniM: 1.0, boyiM: 1.0 }));
    try {
      sababniTekshir(f, null);
      expect.unreachable();
    } catch (x) {
      expect(x).toBeInstanceOf(BiznesXato);
      expect((x as BiznesXato).message).toContain('O-207');
    }
  });
});

// ─── AUDIT U-06 va A-09 ───────────────────────────────────────────────────

describe('AUDIT U-06 — band bo\'lak SANALADI', () => {
  it('band bo\'lsa ham jismonan omborda — farq hisoblanadi', () => {
    const f = qatorFarqi(
      rulon({ band: true }),
      sanash({ eniM: 3.0, boyiM: 26.0, sabab: 'OLCHOV_XATOSI' }),
    );
    expect(f.ozgardimi).toBe(true);
    expect(f.farqKvM.toNumber()).toBe(-6);
  });
});

describe('AUDIT A-09 — yo\'ldagi bo\'lak SANALMAYDI', () => {
  it('yo\'lda bo\'lsa yozilgan son ham e\'tiborga olinmaydi', () => {
    const f = qatorFarqi(
      rulon({ yolda: true }),
      sanash({ eniM: 1.0, boyiM: 1.0, sabab: 'YOQOLGAN' }),
    );
    expect(f.ozgardimi).toBe(false);
    expect(pulMatn(f.farqSumma)).toBe('0.00');
  });
});

// ─── Qisman inventarizatsiya ──────────────────────────────────────────────

describe('TZ 15.1 — qisman inventarizatsiya', () => {
  it('sanalmagan qator qoldiqqa TEGMAYDI', () => {
    const f = qatorFarqi(rulon(), sanash());
    expect(f.ozgardimi).toBe(false);
    expect(pulMatn(f.farqSumma)).toBe('0.00');
  });

  it('faqat bir maydon yozilsa ham sanalmagan hisoblanadi', () => {
    const f = qatorFarqi(rulon(), sanash({ eniM: 3.0 }));
    expect(f.ozgardimi).toBe(false);
  });
});

// ─── DONA ─────────────────────────────────────────────────────────────────

describe('DONA — miqdor bo\'yicha sanaladi', () => {
  it('380 dona o\'rniga 374 chiqdi — 6 dona yetishmaydi', () => {
    const q = rulon({
      turi: 'DONA',
      kod: 'D-11',
      tizimdaEniM: null,
      tizimdaBoyiM: null,
      tizimdaMiqdor: 380,
      tannarxBirlik: som('5000'),
    });
    const f = qatorFarqi(q, sanash({ miqdor: 374, sabab: 'YOQOLGAN' }));

    expect(f.farqKvM.toNumber()).toBe(-6);
    expect(pulMatn(f.farqSumma)).toBe('-30000.00');
  });
});

// ─── Varaqa yakuni ────────────────────────────────────────────────────────

describe('TZ 15.1 — varaqa yakuni', () => {
  it("jami QATORLAR yig'indisi — alohida hisoblanmaydi (Z-05)", () => {
    const y = varaqaYakuni([
      {
        qator: rulon({ bolakId: 1, kod: 'R-118' }),
        natija: sanash({ eniM: 3.0, boyiM: 26.0, sabab: 'OLCHOV_XATOSI' }),
      },
      {
        qator: rulon({ bolakId: 2, kod: 'O-207', turi: 'OSTATKA', tizimdaEniM: 1.8, tizimdaBoyiM: 2.0 }),
        natija: sanash({ eniM: 1.8, boyiM: 2.0 }),
      },
      {
        qator: rulon({
          bolakId: 3, kod: 'D-11', turi: 'DONA',
          tizimdaEniM: null, tizimdaBoyiM: null, tizimdaMiqdor: 380,
          tannarxBirlik: som('5000'),
        }),
        natija: sanash({ miqdor: 374, sabab: 'YOQOLGAN' }),
      },
    ]);

    expect(y.sanalgan).toBe(3);
    expect(y.farqli).toBe(2);
    // −468 000 + 0 + (−30 000) = −498 000
    expect(pulMatn(y.jamiFarq)).toBe('-498000.00');
    expect(farqXarajatmi(y.jamiFarq)).toBe(true);

    // Yig'indi aynan qatorlar yig'indisiga teng
    const qoldan = y.qatorlar.reduce((s, q) => s + Number(pulMatn(q.farqSumma)), 0);
    expect(qoldan).toBe(Number(pulMatn(y.jamiFarq)));
  });

  it("yo'ldagi qator sanalganlar soniga KIRMAYDI (A-09)", () => {
    const y = varaqaYakuni([
      { qator: rulon({ bolakId: 1, yolda: true }), natija: sanash({ eniM: 3.0, boyiM: 28.0 }) },
      { qator: rulon({ bolakId: 2 }), natija: sanash({ eniM: 3.0, boyiM: 28.0 }) },
    ]);
    expect(y.sanalgan).toBe(1);
    expect(y.farqli).toBe(0);
  });

  it('sababsiz farqli qator butun varaqani rad etadi (2.1-invariant)', () => {
    expect(() =>
      varaqaYakuni([
        { qator: rulon({ bolakId: 1 }), natija: sanash({ eniM: 3.0, boyiM: 28.0 }) },
        { qator: rulon({ bolakId: 2, kod: 'R-200' }), natija: sanash({ eniM: 3.0, boyiM: 20.0 }) },
      ]),
    ).toThrow(BiznesXato);
  });

  it("bo'sh varaqa — nol farq, xato yo'q", () => {
    const y = varaqaYakuni([]);
    expect(y.sanalgan).toBe(0);
    expect(pulMatn(y.jamiFarq)).toBe('0.00');
  });
});
