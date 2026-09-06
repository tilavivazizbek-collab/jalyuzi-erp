/**
 * TZ 7.3 · 7.4 · 7.5 · 7.6 · Q-13 · K-06
 */
import { describe, expect, it } from 'vitest';
import {
  BAGRIKENGLIK_M,
  birlashtirishTavsiyasi,
  bolakTanla,
  chiqindiMaydoni,
  daraja,
  kesimBalansi,
  kesimQatorlari,
  kesimRejasi,
  ostatkaBorRulonTanlandi,
  rulondanTasma,
  sigadimi,
  type Bolak,
  type Chegaralar,
  kesimOlchami,
} from '@/lib/domain/kesish';
import { BiznesXato } from '@/lib/xato';

const STANDART: Chegaralar = { yaroqsizM: null, kamIshlatiladiganM: null };

const bolak = (
  id: number,
  turi: 'RULON' | 'OSTATKA',
  eniM: number,
  boyiM: number,
  qismanOchilgan = false,
): Bolak => ({ id, kod: `${turi === 'RULON' ? 'R' : 'O'}-${String(id)}`, turi, eniM, boyiM, qismanOchilgan });

// ─── 7.5 · Uch daraja ─────────────────────────────────────────────────────

describe('7.5 — daraja ENI bo\'yicha aniqlanadi', () => {
  it('standart chegaralar: 0.5 va 1.0', () => {
    expect(daraja(0.4, STANDART)).toBe('YAROQSIZ');
    expect(daraja(0.7, STANDART)).toBe('KAM_ISHLATILADIGAN');
    expect(daraja(1.5, STANDART)).toBe('YAROQLI');
  });

  it('chegara qiymatining o\'zi yuqori darajaga tegishli', () => {
    expect(daraja(0.5, STANDART)).toBe('KAM_ISHLATILADIGAN');
    expect(daraja(1.0, STANDART)).toBe('YAROQLI');
  });

  it('material o\'z chegarasi standartdan ustun (7.5)', () => {
    const qimmat: Chegaralar = { yaroqsizM: 0.3, kamIshlatiladiganM: 0.6 };
    expect(daraja(0.4, qimmat)).toBe('KAM_ISHLATILADIGAN');
    expect(daraja(0.4, STANDART)).toBe('YAROQSIZ');
  });

  it('MAYDON emas, aynan ENI — 0.20 × 6 hech narsaga yaramaydi', () => {
    // 1.2 kv.m, lekin eni 0.20
    expect(daraja(0.2, STANDART)).toBe('YAROQSIZ');
  });
});

// ─── 7.6 · Sig'adimi ──────────────────────────────────────────────────────

describe("7.6 — bo'lak sig'adimi", () => {
  const b = bolak(1, 'OSTATKA', 0.9, 1.4);

  it("TZ misoli: 0.90 × 1.40 ga 90.2 × 140 sig'adi", () => {
    expect(sigadimi(b, { eniM: 0.902, boyiM: 1.4 })).toBe(true);
  });

  it("91.5 × 140 SIG'MAYDI", () => {
    expect(sigadimi(b, { eniM: 0.915, boyiM: 1.4 })).toBe(false);
  });

  it('bag\'rikenglik aniq 1 sm', () => {
    expect(BAGRIKENGLIK_M).toBe(0.01);
    expect(sigadimi(b, { eniM: 0.91, boyiM: 1.4 })).toBe(true);
    expect(sigadimi(b, { eniM: 0.9101, boyiM: 1.4 })).toBe(false);
  });

  it('3-qadam — BURISH YO\'Q: eni eniga, bo\'yi bo\'yiga', () => {
    const uzun = bolak(2, 'OSTATKA', 1.0, 3.0);
    // 3.0 × 1.0 aylantirilsa sig'ardi, lekin burish taqiqlangan
    expect(sigadimi(uzun, { eniM: 3.0, boyiM: 1.0 })).toBe(false);
    expect(sigadimi(uzun, { eniM: 1.0, boyiM: 3.0 })).toBe(true);
  });

  it("bo'yi ham tekshiriladi", () => {
    expect(sigadimi(b, { eniM: 0.5, boyiM: 2.0 })).toBe(false);
  });
});

// ─── 7.6 · Tanlash tartibi ────────────────────────────────────────────────

describe('7.6, 5-qadam — tartib: ostatka → qisman rulon → yangi rulon', () => {
  const kerak = { eniM: 1.0, boyiM: 2.0 };

  it('ostatka birinchi tanlanadi', () => {
    const n = bolakTanla(
      [bolak(1, 'RULON', 3.0, 30.0), bolak(2, 'OSTATKA', 1.5, 2.5)],
      kerak,
    );
    expect(n?.bolak.id).toBe(2);
    expect(n?.manba).toBe('OSTATKA');
  });

  it('ostatka yo\'q bo\'lsa qisman ochilgan rulon', () => {
    const n = bolakTanla(
      [bolak(1, 'RULON', 3.0, 30.0), bolak(2, 'RULON', 3.0, 12.0, true)],
      kerak,
    );
    expect(n?.bolak.id).toBe(2);
  });

  it('oxirida yangi rulon', () => {
    const n = bolakTanla([bolak(1, 'RULON', 3.0, 30.0)], kerak);
    expect(n?.bolak.id).toBe(1);
    expect(n?.manba).toBe('RULON');
  });
});

describe('7.6, 6-qadam — eng kam chiqindi qoldiradigani', () => {
  it("TZ misoli: 140 sm ga 2 m dan kesiladi, 3 m dan emas", () => {
    const n = bolakTanla(
      [bolak(1, 'RULON', 3.0, 30.0), bolak(2, 'RULON', 2.0, 30.0)],
      { eniM: 1.4, boyiM: 2.0 },
    );
    expect(n?.bolak.eniM).toBe(2.0);
  });

  it('chiqindi maydoni to\'g\'ri hisoblanadi', () => {
    // 2.0 enli rulondan 1.4 kesilsa 0.6 qoladi, bo'yi 2.0 → 1.2 kv.m
    expect(chiqindiMaydoni(bolak(1, 'RULON', 2.0, 30.0), { eniM: 1.4, boyiM: 2.0 })).toBeCloseTo(1.2, 6);
  });

  it('tartib chiqindidan USTUN — ostatka ko\'proq chiqindi bersa ham', () => {
    const n = bolakTanla(
      [bolak(1, 'RULON', 1.45, 30.0), bolak(2, 'OSTATKA', 3.0, 2.0)],
      { eniM: 1.4, boyiM: 2.0 },
    );
    expect(n?.bolak.id).toBe(2);
  });

  it('barobar bo\'lsa eskisi tanlanadi — natija barqaror', () => {
    const n = bolakTanla(
      [bolak(5, 'OSTATKA', 2.0, 3.0), bolak(3, 'OSTATKA', 2.0, 3.0)],
      { eniM: 1.4, boyiM: 2.0 },
    );
    expect(n?.bolak.id).toBe(3);
  });
});

describe('7.6, 7-qadam — hech qaysisiga sig\'masa', () => {
  it("null qaytadi — pozitsiya «Materialga kutmoqda»ga tushadi", () => {
    expect(bolakTanla([bolak(1, 'OSTATKA', 0.5, 1.0)], { eniM: 2.0, boyiM: 3.0 })).toBeNull();
  });

  it("bo'sh omborda ham null", () => {
    expect(bolakTanla([], { eniM: 1.0, boyiM: 1.0 })).toBeNull();
  });
});

describe('7.6 — ostatka bor turib rulon tanlansa ogohlantirish', () => {
  const bolaklar = [bolak(1, 'OSTATKA', 1.8, 2.0), bolak(2, 'RULON', 3.0, 30.0)];
  const kerak = { eniM: 1.2, boyiM: 2.0 };

  it('mos ostatka borligini aytadi', () => {
    const o = ostatkaBorRulonTanlandi(bolaklar, kerak, bolaklar[1] as Bolak);
    expect(o?.kod).toBe('O-1');
  });

  it('ostatka tanlansa ogohlantirish yo\'q', () => {
    expect(ostatkaBorRulonTanlandi(bolaklar, kerak, bolaklar[0] as Bolak)).toBeNull();
  });

  it('mos ostatka bo\'lmasa ogohlantirish yo\'q', () => {
    expect(ostatkaBorRulonTanlandi([bolaklar[1] as Bolak], kerak, bolaklar[1] as Bolak)).toBeNull();
  });

  it("ochilgan rulon tanlansa ogohlantirish yo'q — bu qoidaning o'zi", () => {
    const ochilgan = bolak(3, 'RULON', 3.0, 30.0, true);
    expect(ostatkaBorRulonTanlandi([...bolaklar, ochilgan], kerak, ochilgan)).toBeNull();
  });
});

// ─── 7.4 · Kesim rejasi: IKKI QOLDIQ ──────────────────────────────────────

describe("7.4 — kesimdan IKKI qoldiq qoladi (egasi, 2026-09-05)", () => {
  it("egasining misoli: 3 × 35 rulon, buyurtma 1.5 × 5", () => {
    const r = kesimRejasi(bolak(1, 'RULON', 3.0, 35.0), { eniM: 1.5, boyiM: 5.0 });

    // Rulonning ENISI o'zgarmaydi, faqat bo'yi kamayadi (7.4)
    expect(r.manbaQoldiq).toEqual({ eniM: 3.0, boyiM: 30.0 });
    // Yon kesma: eni 3 − 1.5, bo'yi BUYURTMANIKI
    expect(r.kesma).toEqual({ eniM: 1.5, boyiM: 5.0 });
    expect(r.mahsulotKvM).toBeCloseTo(7.5, 4);
  });

  it("yig'indi manba maydoniga TENG — hech narsa yo'qolmaydi", () => {
    const manba = bolak(1, 'RULON', 3.0, 35.0);
    const r = kesimRejasi(manba, { eniM: 1.5, boyiM: 5.0 });
    const jami =
      (r.manbaQoldiq?.eniM ?? 0) * (r.manbaQoldiq?.boyiM ?? 0) +
      (r.kesma?.eniM ?? 0) * (r.kesma?.boyiM ?? 0) +
      r.mahsulotKvM;
    expect(jami).toBeCloseTo(manba.eniM * manba.boyiM, 4);
  });

  it("eni to'liq ishlatilsa yon kesma QOLMAYDI", () => {
    const r = kesimRejasi(bolak(1, 'RULON', 1.5, 20.0), { eniM: 1.5, boyiM: 5.0 });
    expect(r.kesma).toBeNull();
    expect(r.manbaQoldiq).toEqual({ eniM: 1.5, boyiM: 15.0 });
  });

  it("bo'yi to'liq ishlatilsa manbadan hech narsa qolmaydi", () => {
    const r = kesimRejasi(bolak(1, 'OSTATKA', 1.8, 2.0), { eniM: 1.2, boyiM: 2.0 });
    expect(r.manbaQoldiq).toBeNull();
    expect(r.kesma).toEqual({ eniM: 0.6, boyiM: 2.0 });
  });

  it('kesmadan kesilganda ham AYNAN shu qoida (egasi tasdiqladi)', () => {
    // 2 × 8 kesmadan 1.5 × 5 kesilsa → 2 × 3 va 0.5 × 5
    const r = kesimRejasi(bolak(1, 'OSTATKA', 2.0, 8.0), { eniM: 1.5, boyiM: 5.0 });
    expect(r.manbaQoldiq).toEqual({ eniM: 2.0, boyiM: 3.0 });
    expect(r.kesma).toEqual({ eniM: 0.5, boyiM: 5.0 });
  });

  it("rulondan qolgan qism RULON bo'lib qoladi, kesma esa OSTATKA (7.4)", () => {
    const manba = bolak(1, 'RULON', 3.0, 35.0);
    const r = kesimRejasi(manba, { eniM: 1.5, boyiM: 5.0 });
    const n = kesimQatorlari(
      manba,
      { manbaQoldiq: r.manbaQoldiq, kesma: r.kesma, kesmaSaqlansinmi: true },
      STANDART,
    );

    expect(n.yangiBolaklar).toHaveLength(2);
    expect(n.yangiBolaklar[0]?.rol).toBe('MANBA_QOLDIQ');
    expect(n.yangiBolaklar[0]?.rulonmi).toBe(true);
    expect(n.yangiBolaklar[1]?.rol).toBe('KESMA');
    expect(n.yangiBolaklar[1]?.rulonmi).toBe(false);
    expect(n.mahsulotgaKvM).toBeCloseTo(7.5, 4);
    expect(kesimBalansi(n)).toBe(true);
  });

  it('yaroqsiz yon kesma chiqindiga ketadi, rulon esa qoladi (7.5)', () => {
    // 3.00 enli rulondan 2.70 kesilsa yon parcha 0.30 — yaroqsiz
    const manba = bolak(1, 'RULON', 3.0, 35.0);
    const r = kesimRejasi(manba, { eniM: 2.7, boyiM: 5.0 });
    const n = kesimQatorlari(
      manba,
      { manbaQoldiq: r.manbaQoldiq, kesma: r.kesma, kesmaSaqlansinmi: true },
      STANDART,
    );

    expect(n.qoldiqDarajasi).toBe('YAROQSIZ');
    expect(n.yangiBolaklar).toHaveLength(1);
    expect(n.yangiBolaklar[0]?.rol).toBe('MANBA_QOLDIQ');
    expect(n.qatorlar[2]?.kvM).toBeCloseTo(1.5, 4); // 0.30 × 5.00 chiqindi
    expect(kesimBalansi(n)).toBe(true);
  });
});

// ─── 7.6 · Yangi tanlov navbati (egasi, 2026-09-05) ───────────────────────

describe('7.6 — aniq mos kesma → ochiq rulon → boshqa kesma → yangi rulon', () => {
  const kerak = { eniM: 1.5, boyiM: 5.0 };

  it('aynan mos kesma BIRINCHI — u butunlay ishlatiladi', () => {
    const n = bolakTanla(
      [
        bolak(1, 'RULON', 3.0, 12.0, true), // ochiq rulon
        bolak(2, 'OSTATKA', 2.0, 8.0), // boshqa kesma
        bolak(3, 'OSTATKA', 1.5, 5.0), // AYNAN mos
      ],
      kerak,
    );
    expect(n?.bolak.id).toBe(3);
  });

  it("aniq mos kesma yo'q — ochiq rulon boshqa kesmadan OLDIN", () => {
    const n = bolakTanla(
      [bolak(1, 'OSTATKA', 2.0, 8.0), bolak(2, 'RULON', 3.0, 12.0, true)],
      kerak,
    );
    expect(n?.bolak.id).toBe(2);
  });

  it("ochiq rulon yo'q — kesma ishlatiladi, yangi rulon ochilmaydi", () => {
    const n = bolakTanla(
      [bolak(1, 'RULON', 3.0, 35.0), bolak(2, 'OSTATKA', 2.0, 8.0)],
      kerak,
    );
    expect(n?.bolak.id).toBe(2);
  });

  it("hech narsa yo'q — eng oxirida yangi rulon ochiladi", () => {
    const n = bolakTanla([bolak(1, 'RULON', 3.0, 35.0)], kerak);
    expect(n?.bolak.id).toBe(1);
  });

  it("bag'rikenglik 1 sm aniq moslikda ham amal qiladi", () => {
    const n = bolakTanla(
      [bolak(1, 'RULON', 3.0, 12.0, true), bolak(2, 'OSTATKA', 1.51, 5.0)],
      kerak,
    );
    expect(n?.bolak.id).toBe(2);
  });
});

// ─── K-06 · Kesim uch qatori (TZ 7.6) ─────────────────────────────────────

describe('K-06 · kesim uch qatori — TZ 7.6', () => {
  // Ostatka 1.80 × 2.00 = 3.60 kv.m, buyurtma 1.20 × 2.00, qoladi 0.60 × 2.00
  const manba = bolak(1, 'OSTATKA', 1.8, 2.0);
  // Yangi shakl: manbadan hech narsa qolmaydi (bo'yi teng), yon kesma 0.60 × 2.00
  const qoldiq = {
    manbaQoldiq: null,
    kesma: { eniM: 0.6, boyiM: 2.0 },
    kesmaSaqlansinmi: true,
  };

  it('3.60 = 1.20 + 2.40 + 0', () => {
    const n = kesimQatorlari(manba, qoldiq, STANDART);

    expect(n.qatorlar[0]?.kvM).toBeCloseTo(3.6, 4); // chiqdi
    expect(n.qatorlar[1]?.kvM).toBeCloseTo(1.2, 4); // ostatka
    expect(n.qatorlar[2]?.kvM).toBeCloseTo(0, 4); //  chiqindi
    expect(n.mahsulotgaKvM).toBeCloseTo(2.4, 4); //   mahsulotga
  });

  it('QISM 3 §12 invarianti — yig\'indi nol', () => {
    expect(kesimBalansi(kesimQatorlari(manba, qoldiq, STANDART))).toBe(true);
  });

  it('qolgan bo\'lak 0.60 — kam ishlatiladigan darajada', () => {
    expect(kesimQatorlari(manba, qoldiq, STANDART).qoldiqDarajasi).toBe('KAM_ISHLATILADIGAN');
  });

  it('YAROQSIZ qoldiq chiqindiga ketadi, ostatka bo\'lmaydi (7.5)', () => {
    const mayda = { manbaQoldiq: null, kesma: { eniM: 0.3, boyiM: 2.0 }, kesmaSaqlansinmi: true };
    const n = kesimQatorlari(manba, mayda, STANDART);
    expect(n.qatorlar[1]?.kvM).toBe(0);
    expect(n.qatorlar[2]?.kvM).toBeCloseTo(0.6, 4);
    expect(kesimBalansi(n)).toBe(true);
  });

  it('usta chiqindiga chiqarsa ostatka yozilmaydi (7.6)', () => {
    const n = kesimQatorlari(manba, { ...qoldiq, kesmaSaqlansinmi: false }, STANDART);
    expect(n.qatorlar[1]?.kvM).toBe(0);
    expect(n.qatorlar[2]?.kvM).toBeCloseTo(1.2, 4);
    expect(kesimBalansi(n)).toBe(true);
  });

  it('qoldiq manbadan katta bo\'la olmaydi', () => {
    expect(() =>
      kesimQatorlari(
        manba,
        { manbaQoldiq: null, kesma: { eniM: 2.0, boyiM: 3.0 }, kesmaSaqlansinmi: true },
        STANDART,
      ),
    ).toThrow(BiznesXato);
  });
});

// ─── 7.4 · Rulondan tasma ─────────────────────────────────────────────────

describe('7.4 — rulonning ENI o\'zgarmaydi, faqat BO\'YI kamayadi', () => {
  const rulon = bolak(1, 'RULON', 3.0, 30.0);

  it('TZ misoli: 3.00 × 30.00 dan 2 m tasma ochiladi → 3.00 × 28.00', () => {
    const n = rulondanTasma(rulon, { eniM: 1.2, boyiM: 2.0 });
    expect(n.rulonYangiBoyi).toBe(28.0);
    expect(n.tasma.eniM).toBe(3.0);
    expect(n.tasma.boyiM).toBe(2.0);
  });

  it('tasma OSTATKA turida bo\'ladi', () => {
    expect(rulondanTasma(rulon, { eniM: 1.2, boyiM: 2.0 }).tasma.turi).toBe('OSTATKA');
  });

  it('bo\'yi yetmasa rad etiladi', () => {
    expect(() => rulondanTasma(rulon, { eniM: 1.0, boyiM: 50.0 })).toThrow(BiznesXato);
  });

  it('ostatkadan tasma ochib bo\'lmaydi', () => {
    expect(() => rulondanTasma(bolak(2, 'OSTATKA', 2.0, 2.0), { eniM: 1.0, boyiM: 1.0 })).toThrow(
      BiznesXato,
    );
  });
});

// ─── Q-13 · Birlashtirib kesish ───────────────────────────────────────────

describe('7.6, 0-qadam va Q-13 — birlashtirish TAVSIYASI', () => {
  it("uchta 2.10 × 1.40 birga 6.30 × 1.40 bo'ladi", () => {
    const uchta = [
      { eniM: 2.1, boyiM: 1.4 },
      { eniM: 2.1, boyiM: 1.4 },
      { eniM: 2.1, boyiM: 1.4 },
    ];
    expect(birlashtirishTavsiyasi(uchta)).toEqual({ eniM: 6.3, boyiM: 1.4 });
  });

  it("bo'yi har xil bo'lsa birlashtirilmaydi — tasma bir yo'la ochilmaydi", () => {
    expect(
      birlashtirishTavsiyasi([
        { eniM: 2.1, boyiM: 1.4 },
        { eniM: 2.1, boyiM: 2.0 },
      ]),
    ).toBeNull();
  });

  it('bitta pozitsiyada tavsiya yo\'q', () => {
    expect(birlashtirishTavsiyasi([{ eniM: 2.1, boyiM: 1.4 }])).toBeNull();
    expect(birlashtirishTavsiyasi([])).toBeNull();
  });
});

// ─── P-24 · Maydondan kesim to'rtburchagi ─────────────────────────────────

describe("P-24 — slot maydonidan kesim eni chiqadi", () => {
  it('Rollo 210 × 140 — butun eni qaytadi', () => {
    // 2.94 kv.m ÷ 1.40 m = 2.10 m
    expect(kesimOlchami('2.9400', 140)).toEqual({ eniM: 2.1, boyiM: 1.4 });
  });

  it("Dikke chet sloti — 30 sm, butun eni EMAS (TZ 3.5)", () => {
    // 0.66 kv.m ÷ 2.20 m = 0.30 m
    expect(kesimOlchami('0.6600', 220)).toEqual({ eniM: 0.3, boyiM: 2.2 });
  });

  it("Dikke o'rta sloti — 120 sm", () => {
    // 2.64 kv.m ÷ 2.20 m = 1.20 m
    expect(kesimOlchami('2.6400', 220)).toEqual({ eniM: 1.2, boyiM: 2.2 });
  });

  it("uch slot yig'indisi butun maydonga teng (K-02)", () => {
    const a = kesimOlchami('0.6600', 220);
    const b = kesimOlchami('0.6600', 220);
    const c = kesimOlchami('2.6400', 220);
    const jami = a.eniM + b.eniM + c.eniM;
    // 0.30 + 0.30 + 1.20 = 1.80 m — mahsulotning butun eni
    expect(jami).toBeCloseTo(1.8, 10);
  });

  it("bo'yi nol bo'lsa rad etiladi — bo'luvchi", () => {
    expect(() => kesimOlchami('2.94', 0)).toThrow(BiznesXato);
  });

  it("maydon nol bo'lsa rad etiladi", () => {
    expect(() => kesimOlchami('0', 140)).toThrow(BiznesXato);
  });
});
