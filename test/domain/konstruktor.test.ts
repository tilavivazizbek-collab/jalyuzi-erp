/**
 * TZ 4 · 3.3 · 5.7
 */
import { describe, expect, it } from 'vitest';
import {
  konstruktorTekshir,
  parametrIshlatilishi,
  parametrOchirilsinmi,
  qaysiFormulaIshlaydi,
  ruxsatEtilganNomlar,
  saqlashniTalabQil,
  slotMateriallari,
  slotOchirilsinmi,
  slotlarTartibda,
  stavkasizUstalar,
  type MahsulotTuri,
} from '@/lib/domain/konstruktor';
import { BiznesXato } from '@/lib/xato';

const DIKKE: MahsulotTuri = {
  id: 1,
  nom: 'Dikke',
  parametrlar: [{ nom: 'CHET', qiymat: 30 }],
  slotlar: [
    { id: 1, nom: 'Oq mato (chet)', formula: "CHET × BO'YI", majburiy: true, tartib: 1, almashtirishGuruhId: 1 },
    { id: 2, nom: "Ko'k mato (chet)", formula: "CHET × BO'YI", majburiy: true, tartib: 2, almashtirishGuruhId: 2 },
    { id: 3, nom: "Ko'k mato (o'rta)", formula: "(ENI − 2×CHET) × BO'YI", majburiy: true, tartib: 3, almashtirishGuruhId: 3 },
  ],
  komplekt: [
    { materialId: 10, nom: 'Mexanizm', formula: '1', majburiy: true },
    { materialId: 11, nom: 'Stepler lenta', formula: 'ENI × 2', majburiy: false },
  ],
  xizmatHaqiSoni: null,
  faol: true,
};

// ─── 4.5 · Formula tekshiruvi ─────────────────────────────────────────────

describe('4.5 — formula saqlashdan oldin tekshiriladi', () => {
  it('to\'g\'ri sozlangan tur saqlanadi', () => {
    const n = konstruktorTekshir(DIKKE);
    expect(n.saqlansinmi).toBe(true);
    expect(n.nuqsonlar).toEqual([]);
  });

  it("noma'lum parametr ushlanadi", () => {
    const yomon: MahsulotTuri = {
      ...DIKKE,
      slotlar: [{ id: 1, nom: 'Mato', formula: 'QALINLIK × 2', majburiy: true, tartib: 1, almashtirishGuruhId: 1 }],
    };
    const n = konstruktorTekshir(yomon);
    expect(n.saqlansinmi).toBe(false);
    expect(n.nuqsonlar[0]).toEqual({
      tur: 'NOMALUM_PARAMETR',
      slot: 'Mato',
      nomlar: ['QALINLIK'],
    });
  });

  it('sintaksis xatosi ushlanadi', () => {
    const yomon: MahsulotTuri = {
      ...DIKKE,
      slotlar: [{ id: 1, nom: 'Mato', formula: '(ENI + ', majburiy: true, tartib: 1, almashtirishGuruhId: 1 }],
    };
    expect(konstruktorTekshir(yomon).nuqsonlar[0]?.tur).toBe('FORMULA_XATO');
  });

  it('standart nomlar har turda mavjud', () => {
    expect(ruxsatEtilganNomlar([])).toEqual(['ENI', "BO'YI", 'MAYDON', 'SONI']);
    expect(ruxsatEtilganNomlar([{ nom: 'chet', qiymat: 30 }])).toContain('CHET');
  });

  it('saqlashniTalabQil xato otadi', () => {
    const yomon: MahsulotTuri = { ...DIKKE, slotlar: [] };
    expect(() => { saqlashniTalabQil(yomon); }).toThrow(BiznesXato);
    expect(() => { saqlashniTalabQil(DIKKE); }).not.toThrow();
  });
});

describe('4.4 — slot va nom tekshiruvlari', () => {
  it('matosiz tur saqlanmaydi — sotuvda ishlamaydi', () => {
    const n = konstruktorTekshir({ ...DIKKE, slotlar: [] });
    expect(n.nuqsonlar).toContainEqual({ tur: 'SLOT_YOQ' });
  });

  it('bir xil nomli slot ushlanadi', () => {
    const yomon: MahsulotTuri = {
      ...DIKKE,
      slotlar: [
        { id: 1, nom: 'Mato', formula: 'MAYDON', majburiy: true, tartib: 1, almashtirishGuruhId: 1 },
        { id: 2, nom: 'mato', formula: 'MAYDON', majburiy: true, tartib: 2, almashtirishGuruhId: 2 },
      ],
    };
    expect(konstruktorTekshir(yomon).nuqsonlar).toContainEqual({
      tur: 'NOM_TAKRORLANGAN',
      nom: 'mato',
    });
  });

  it('takrorlangan parametr ushlanadi', () => {
    const yomon: MahsulotTuri = {
      ...DIKKE,
      parametrlar: [
        { nom: 'CHET', qiymat: 30 },
        { nom: 'chet', qiymat: 40 },
      ],
    };
    expect(konstruktorTekshir(yomon).nuqsonlar).toContainEqual({
      tur: 'PARAMETR_TAKRORLANGAN',
      nom: 'chet',
    });
  });

  it("bog'langan materiali bor slot o'chirilmaydi", () => {
    expect(slotOchirilsinmi(0)).toBe(true);
    expect(slotOchirilsinmi(3)).toBe(false);
  });
});

// ─── 4.6 · Aksessuar komplekti ────────────────────────────────────────────

describe('4.6 — komplekt qatori', () => {
  it("bo'sh formula xato beradi", () => {
    const yomon: MahsulotTuri = {
      ...DIKKE,
      komplekt: [{ materialId: 1, nom: 'Brelok', formula: '   ', majburiy: false }],
    };
    expect(konstruktorTekshir(yomon).nuqsonlar).toContainEqual({
      tur: 'KOMPLEKT_QATORI_BOSH',
      nom: 'Brelok',
    });
  });

  it("statik son ham formula — QISM 3 §2.7 bitta ustunda saqlaydi", () => {
    const tur: MahsulotTuri = {
      ...DIKKE,
      komplekt: [{ materialId: 1, nom: 'Brelok', formula: '4', majburiy: false }],
    };
    expect(konstruktorTekshir(tur).saqlansinmi).toBe(true);
  });

  it("o'lchamga bog'liq formula ham qabul qilinadi", () => {
    const tur: MahsulotTuri = {
      ...DIKKE,
      komplekt: [{ materialId: 1, nom: 'Lenta', formula: 'ENI × 2', majburiy: false }],
    };
    expect(konstruktorTekshir(tur).saqlansinmi).toBe(true);
  });

  it('komplekt formulasi ham tekshiriladi', () => {
    const yomon: MahsulotTuri = {
      ...DIKKE,
      komplekt: [
        { materialId: 1, nom: 'Lenta', formula: 'QALINLIK', majburiy: false },
      ],
    };
    expect(konstruktorTekshir(yomon).nuqsonlar[0]?.tur).toBe('FORMULA_XATO');
  });
});

// ─── 4.3 · Parametrni o'chirish ───────────────────────────────────────────

describe("4.3 — ishlatilayotgan parametr o'chirilmaydi", () => {
  it('CHET uch joyda ishlatilmoqda', () => {
    const i = parametrIshlatilishi(DIKKE, 'CHET');
    expect(i.joylar).toEqual(['Oq mato (chet)', "Ko'k mato (chet)", "Ko'k mato (o'rta)"]);
    expect(parametrOchirilsinmi(DIKKE, 'CHET')).toBe(false);
  });

  it('ishlatilmagan parametrni o\'chirsa bo\'ladi', () => {
    expect(parametrOchirilsinmi(DIKKE, 'QALINLIK')).toBe(true);
  });

  it('komplekt formulasidagi ishlatilish ham hisobga olinadi', () => {
    expect(parametrIshlatilishi(DIKKE, 'ENI').joylar).toContain('Stepler lenta');
  });

  it('katta-kichik harf farq qilmaydi', () => {
    expect(parametrOchirilsinmi(DIKKE, 'chet')).toBe(false);
  });

  it("buzuq formulali qator yiqitmaydi", () => {
    const buzuq: MahsulotTuri = {
      ...DIKKE,
      slotlar: [{ id: 1, nom: 'Buzuq', formula: '(((', majburiy: true, tartib: 1, almashtirishGuruhId: 1 }],
    };
    expect(() => parametrIshlatilishi(buzuq, 'CHET')).not.toThrow();
    expect(parametrOchirilsinmi(buzuq, 'CHET')).toBe(true);
  });
});

// ─── 3.3 · Slot qatorlari ─────────────────────────────────────────────────

describe("3.3, 5.6 va 5.7 — har slotda faqat o'z guruhining matolari", () => {
  // QISM 3 §2.5 — slot ALMASHTIRISH GURUHIGA bog'lanadi
  const materiallar = [
    { almashtirishGuruhId: 1, faol: true, nom: 'Oq mato A' },
    { almashtirishGuruhId: 1, faol: false, nom: 'Oq mato B (nofaol)' },
    { almashtirishGuruhId: 2, faol: true, nom: "Ko'k mato" },
    { almashtirishGuruhId: null, faol: true, nom: 'Guruhsiz material' },
  ];

  const slot = (n: number) => {
    const s = DIKKE.slotlar[n];
    if (s === undefined) throw new Error("slot yo'q");
    return s;
  };

  it("boshqa guruhning matosi chiqmaydi — mexanizm bosilganda kronshteyn yo'q (5.6)", () => {
    expect(slotMateriallari(slot(0), materiallar).map((m) => m.nom)).toEqual(['Oq mato A']);
    expect(slotMateriallari(slot(1), materiallar).map((m) => m.nom)).toEqual(["Ko'k mato"]);
  });

  it('nofaol material sotuvda chiqmaydi (5.9)', () => {
    expect(slotMateriallari(slot(0), materiallar)).toHaveLength(1);
  });

  it("guruhsiz slotda hech narsa chiqmaydi", () => {
    const guruhsiz = { ...slot(0), almashtirishGuruhId: null };
    expect(slotMateriallari(guruhsiz, materiallar)).toEqual([]);
  });

  it("guruhsiz slot saqlashda ushlanadi — bo'sh dropdown mijoz oldida chiqmasin", () => {
    const yomon: MahsulotTuri = {
      ...DIKKE,
      slotlar: [{ ...slot(0), almashtirishGuruhId: null }],
    };
    expect(konstruktorTekshir(yomon).nuqsonlar).toContainEqual({
      tur: 'SLOT_GURUHSIZ',
      nom: 'Oq mato (chet)',
    });
  });

  it('slotlar tartib bo\'yicha chiqadi', () => {
    const aralash: MahsulotTuri = {
      ...DIKKE,
      slotlar: [
        { id: 3, nom: 'C', formula: 'MAYDON', majburiy: true, tartib: 3, almashtirishGuruhId: 3 },
        { id: 1, nom: 'A', formula: 'MAYDON', majburiy: true, tartib: 1, almashtirishGuruhId: 1 },
        { id: 2, nom: 'B', formula: 'MAYDON', majburiy: true, tartib: 2, almashtirishGuruhId: 2 },
      ],
    };
    expect(slotlarTartibda(aralash).map((s) => s.nom)).toEqual(['A', 'B', 'C']);
  });
});

// ─── 4.9 · Stavka ogohlantirishi ──────────────────────────────────────────

describe('4.9 — stavkasiz ustalar', () => {
  it('yangi turda stavkasi yo\'q ustalar ko\'rsatiladi', () => {
    const ustalar = [
      { xodimId: 1, stavkaBormi: true },
      { xodimId: 2, stavkaBormi: false },
      { xodimId: 3, stavkaBormi: false },
    ];
    expect(stavkasizUstalar(ustalar).map((u) => u.xodimId)).toEqual([2, 3]);
  });
});

// ─── 4.10 · Snapshot ──────────────────────────────────────────────────────

describe('4.10 va 2.3-invariant — eski buyurtma eski formula bilan', () => {
  it('snapshot bor — u ishlaydi', () => {
    expect(qaysiFormulaIshlaydi("CHET × BO'YI", 'MAYDON × 1.5')).toBe("CHET × BO'YI");
  });

  it('snapshot yo\'q — joriy formula', () => {
    expect(qaysiFormulaIshlaydi(null, 'MAYDON × 1.5')).toBe('MAYDON × 1.5');
  });
});
