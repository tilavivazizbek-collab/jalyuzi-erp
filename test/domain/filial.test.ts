/**
 * TZ 20.2 · 20.2.1 · 20.2.2 · 20.4.1 · 20.4.2 · Q-24
 */
import { describe, expect, it } from 'vitest';
import {
  boshFilial,
  boshFilialTekshir,
  filialTekshir,
  filiallararomi,
  ishlabChiqaruvchiniTanla,
  markaziyOmbormi,
  materialTekshiriladiganFilial,
  nofaolQilinsinmi,
  qoldaTanlanganTasdiqla,
  rejim,
  sotaOladiganlar,
  tikaOladiganlar,
  type Filial,
} from '@/lib/domain/filial';
import { BiznesXato } from '@/lib/xato';

const f = (o: Partial<Filial> & { id: number }): Filial => ({
  nom: `Filial ${String(o.id)}`,
  sotadi: true,
  ishlabChiqaradi: true,
  standartIshlabChiqaruvchiId: null,
  bosh: false,
  faol: true,
  ...o,
});

const TOLIQ = f({ id: 1, nom: 'Chilonzor', bosh: true });
const DOKON = f({ id: 2, nom: "Yunusobod do'koni", ishlabChiqaradi: false, standartIshlabChiqaruvchiId: 3 });
const SEX = f({ id: 3, nom: 'Samarqand sexi', sotadi: false });
const OMBOR = f({ id: 4, nom: 'Markaziy ombor', sotadi: false, ishlabChiqaradi: false, standartIshlabChiqaruvchiId: 3 });

// ─── 20.2.1 · To'rt rejim ─────────────────────────────────────────────────

describe("20.2.1 — to'rt rejim", () => {
  it('sotadi + tikadi = to\'liq filial', () => {
    expect(rejim({ sotadi: true, ishlabChiqaradi: true })).toBe('TOLIQ');
  });

  it("sotadi, tikmaydi = do'kon", () => {
    expect(rejim({ sotadi: true, ishlabChiqaradi: false })).toBe('DOKON');
  });

  it('sotmaydi, tikadi = sex', () => {
    expect(rejim({ sotadi: false, ishlabChiqaradi: true })).toBe('SEX');
  });

  it('ikkalasi ham yo\'q = markaziy ombor', () => {
    expect(rejim({ sotadi: false, ishlabChiqaradi: false })).toBe('OMBOR');
    expect(markaziyOmbormi({ sotadi: false, ishlabChiqaradi: false })).toBe(true);
    expect(markaziyOmbormi({ sotadi: true, ishlabChiqaradi: true })).toBe(false);
  });
});

// ─── 20.2 · Sozlama tekshiruvi ────────────────────────────────────────────

describe('20.2 — sozlama izchilligi', () => {
  const hammasi = [TOLIQ, DOKON, SEX, OMBOR];

  it("to'liq filial yaroqli", () => {
    expect(filialTekshir(TOLIQ, hammasi).yaroqli).toBe(true);
  });

  it("tikmaydigan filialda standart ishlab chiqaruvchi MAJBURIY", () => {
    const yomon = f({ id: 9, ishlabChiqaradi: false, standartIshlabChiqaruvchiId: null });
    expect(filialTekshir(yomon, hammasi).nuqsonlar).toContain('ISHLAB_CHIQARUVCHI_KERAK');
  });

  it("o'ziga o'zi yubora olmaydi", () => {
    const yomon = f({ id: 9, ishlabChiqaradi: false, standartIshlabChiqaruvchiId: 9 });
    expect(filialTekshir(yomon, hammasi).nuqsonlar).toContain('OZIGA_OZI');
  });

  it("tikmaydigan filialga yuborib bo'lmaydi", () => {
    // 2-filial do'kon (tikmaydi), unga yuborish xato
    const yomon = f({ id: 9, ishlabChiqaradi: false, standartIshlabChiqaruvchiId: 2 });
    expect(filialTekshir(yomon, hammasi).nuqsonlar).toContain('ISHLAB_CHIQARUVCHI_TIKMAYDI');
  });

  it('nofaol filialga yuborib bo\'lmaydi', () => {
    const nofaolSex = f({ id: 5, sotadi: false, faol: false });
    const yomon = f({ id: 9, ishlabChiqaradi: false, standartIshlabChiqaruvchiId: 5 });
    expect(filialTekshir(yomon, [...hammasi, nofaolSex]).nuqsonlar).toContain(
      'ISHLAB_CHIQARUVCHI_NOFAOL',
    );
  });

  it("tikadigan filialda standart ishlab chiqaruvchi shart emas", () => {
    expect(filialTekshir(SEX, hammasi).yaroqli).toBe(true);
  });
});

// ─── 20.2.2 · Bosh filial ─────────────────────────────────────────────────

describe('20.2.2 — bosh filial', () => {
  const hammasi = [TOLIQ, DOKON, SEX, OMBOR];

  it('bittasi bosh', () => {
    expect(boshFilial(hammasi)?.id).toBe(1);
    expect(boshFilialTekshir(hammasi)).toBe(true);
  });

  it('bosh filial yo\'q bo\'lsa xato holat', () => {
    expect(boshFilialTekshir([DOKON, SEX])).toBe(false);
    expect(boshFilial([DOKON, SEX])).toBe(null);
  });

  it('ikkita bosh ham xato holat', () => {
    expect(boshFilialTekshir([TOLIQ, f({ id: 8, bosh: true })])).toBe(false);
  });

  it("bosh filialni nofaol qilib bo'lmaydi", () => {
    expect(nofaolQilinsinmi(TOLIQ)).toBe(false);
    expect(nofaolQilinsinmi(DOKON)).toBe(true);
  });
});

// ─── 20.4.1 · Ishlab chiqaruvchini tanlash ────────────────────────────────

describe('20.4.1 — ishlab chiqaruvchi filial', () => {
  it("1-qadam: o'zi tikadigan bo'lsa — o'zi", () => {
    expect(ishlabChiqaruvchiniTanla(TOLIQ)).toEqual({
      holat: 'TANLANDI',
      filialId: 1,
      manba: 'OZI',
    });
  });

  it("2-qadam: tikmasa — standart ishlab chiqaruvchi", () => {
    expect(ishlabChiqaruvchiniTanla(DOKON)).toEqual({
      holat: 'TANLANDI',
      filialId: 3,
      manba: 'STANDART',
    });
  });

  it("3-qadam: standart ham bo'sh — sotuvchi qo'lda tanlaydi", () => {
    const dokon = f({ id: 7, ishlabChiqaradi: false, standartIshlabChiqaruvchiId: null });
    expect(ishlabChiqaruvchiniTanla(dokon)).toEqual({ holat: 'QOLDA_TANLASH_KERAK' });
  });

  it("qo'lda tanlangan filial tikadigan bo'lishi shart", () => {
    expect(qoldaTanlanganTasdiqla(SEX)).toEqual({
      holat: 'TANLANDI',
      filialId: 3,
      manba: 'QOLDA',
    });
    expect(() => qoldaTanlanganTasdiqla(DOKON)).toThrow(BiznesXato);
    expect(() => qoldaTanlanganTasdiqla(OMBOR)).toThrow(BiznesXato);
  });

  it('nofaol filialga yuborib bo\'lmaydi', () => {
    const nofaol = f({ id: 6, sotadi: false, faol: false });
    expect(() => qoldaTanlanganTasdiqla(nofaol)).toThrow(BiznesXato);
  });
});

// ─── 20.4.2 · Material qaysi filialda tekshiriladi ────────────────────────

describe('20.4.2 — material tekshiruvi', () => {
  it("SOTGAN emas, TIKUVCHI filial ombori bo'yicha", () => {
    // Sotuvchi Chilonzorda (1), buyurtma Samarqandda tikiladi (3)
    expect(materialTekshiriladiganFilial(3)).toBe(3);
  });
});

// ─── 20.5 · Filiallararo oqim ─────────────────────────────────────────────

describe('20.5 — qachon uchta yangi status ishlaydi', () => {
  it('sotgan va tikuvchi har xil — filiallararo', () => {
    expect(filiallararomi(2, 3)).toBe(true);
  });

  it('bir xil — eski oqim, uch status o\'tkazib yuboriladi', () => {
    expect(filiallararomi(1, 1)).toBe(false);
  });
});

// ─── Ro'yxatlar ───────────────────────────────────────────────────────────

describe("ro'yxatlar", () => {
  const nofaolDokon = f({ id: 5, ishlabChiqaradi: false, standartIshlabChiqaruvchiId: 3, faol: false });
  const hammasi = [TOLIQ, DOKON, SEX, OMBOR, nofaolDokon];

  it('sota oladiganlar — faol va sotadi', () => {
    expect(sotaOladiganlar(hammasi).map((x) => x.id)).toEqual([1, 2]);
  });

  it('tika oladiganlar — faol va ishlab chiqaradi', () => {
    expect(tikaOladiganlar(hammasi).map((x) => x.id)).toEqual([1, 3]);
  });
});
