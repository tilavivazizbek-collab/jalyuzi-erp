/**
 * TZ 11.6.2 — ABC tahlil. Mijozlar va ombor uchun bitta mexanizm.
 */
import { describe, expect, it } from 'vitest';
import { ABC_STANDART, abcTahlil, paretoNuqtalari } from '@/lib/domain/hisobot/abc';
import { dollar, pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const mijoz = (nom: string, summa: number) => ({ kalit: nom, nom, qiymat: som(summa) });

describe('ABC tahlil — TZ 11.6.2', () => {
  it('tushumning 80% i qaysi mijozlardan', () => {
    // Jami 1 000 000. Anvar 60%, Bobur 25% → ikkisi 85% (A),
    // Dilnoza 10% (B, chunki oldingi yig'indi 85% < 95%), qolgani C.
    const n = abcTahlil([
      mijoz('Anvar', 600_000),
      mijoz('Bobur', 250_000),
      mijoz('Dilnoza', 100_000),
      mijoz('Eshmat', 30_000),
      mijoz('Farrux', 20_000),
    ]);

    expect(n.qatorlar.map((q) => q.nom)).toEqual([
      'Anvar',
      'Bobur',
      'Dilnoza',
      'Eshmat',
      'Farrux',
    ]);
    expect(n.qatorlar.map((q) => q.toifa)).toEqual(['A', 'A', 'B', 'C', 'C']);
    expect(n.soni).toEqual({ A: 2, B: 1, C: 2 });
    expect(pulMatn(n.jami)).toBe('1000000.00');
  });

  it('kumulyativ foiz 100 ga yetadi va oshmaydi', () => {
    const n = abcTahlil([mijoz('A', 700_000), mijoz('B', 200_000), mijoz('C', 100_000)]);
    expect(n.qatorlar.map((q) => q.kumulyativFoiz)).toEqual([70, 90, 100]);
    expect(n.qatorlar.map((q) => q.ulushFoiz)).toEqual([70, 20, 10]);
  });

  it('chegarani kesib o‘tgan element YUQORI toifada qoladi', () => {
    // Birinchisi 79%, ikkinchisi bilan 96% bo'ladi. Ikkinchisi baribir A:
    // u boshlanganda yig'indi hali 79% (< 80) edi.
    const n = abcTahlil([mijoz('Katta', 790_000), mijoz('Ikkinchi', 170_000), mijoz('Kichik', 40_000)]);
    expect(n.qatorlar.map((q) => q.toifa)).toEqual(['A', 'A', 'C']);
  });

  it('bitta mijoz — hammasi A', () => {
    const n = abcTahlil([mijoz('Yolgiz', 500_000)]);
    expect(n.qatorlar[0]?.toifa).toBe('A');
    expect(n.qatorlar[0]?.kumulyativFoiz).toBe(100);
  });

  it('bo‘sh ro‘yxat yiqilmaydi', () => {
    const n = abcTahlil([]);
    expect(n.qatorlar).toHaveLength(0);
    expect(pulMatn(n.jami)).toBe('0.00');
  });

  it('manfiy tushum foizlarni buzmaydi — oxirida C bo‘lib turadi', () => {
    // Qaytarishdan keyin manfiy chiqqan mijoz (8.10). U 80% bazasiga
    // kirmaydi, aks holda foizlar 100 dan oshib ketardi.
    const n = abcTahlil([mijoz('Yaxshi', 800_000), mijoz('Qaytardi', -50_000), mijoz('Kichik', 200_000)]);
    expect(pulMatn(n.jami)).toBe('1000000.00');
    const oxirgi = n.qatorlar[n.qatorlar.length - 1];
    expect(oxirgi?.nom).toBe('Qaytardi');
    expect(oxirgi?.toifa).toBe('C');
    expect(oxirgi?.ulushFoiz).toBe(0);
    expect(n.qatorlar[1]?.kumulyativFoiz).toBe(100);
  });

  it('nol qiymatli mijoz ham ko‘rinadi', () => {
    const n = abcTahlil([mijoz('Bor', 100_000), mijoz('Nol', 0)]);
    expect(n.qatorlar).toHaveLength(2);
    expect(n.qatorlar[1]?.toifa).toBe('C');
  });

  it('teng qiymatlarda tartib barqaror — har ochilishda o‘zgarmaydi', () => {
    const birinchi = abcTahlil([mijoz('Bobur', 100), mijoz('Anvar', 100)]);
    const ikkinchi = abcTahlil([mijoz('Anvar', 100), mijoz('Bobur', 100)]);
    expect(birinchi.qatorlar.map((q) => q.nom)).toEqual(ikkinchi.qatorlar.map((q) => q.nom));
    expect(birinchi.qatorlar.map((q) => q.nom)).toEqual(['Anvar', 'Bobur']);
  });

  it('so‘m va dollar aralashtirilmaydi — 1.3-invariant', () => {
    expect(() =>
      abcTahlil([mijoz('Somli', 100), { kalit: 'd', nom: 'Dollarli', qiymat: dollar(100) }]),
    ).toThrow(BiznesXato);
  });

  it('dollarli ro‘yxat o‘zi ishlaydi', () => {
    const n = abcTahlil([
      { kalit: 1, nom: 'A', qiymat: dollar(800) },
      { kalit: 2, nom: 'B', qiymat: dollar(200) },
    ]);
    expect(pulMatn(n.jami)).toBe('1000.00');
    expect(n.qatorlar.map((q) => q.toifa)).toEqual(['A', 'B']);
  });

  it('noto‘g‘ri chegara — xato', () => {
    expect(() => abcTahlil([mijoz('A', 10)], { a: 0, b: 95 })).toThrow(BiznesXato);
    expect(() => abcTahlil([mijoz('A', 10)], { a: 90, b: 80 })).toThrow(BiznesXato);
    expect(() => abcTahlil([mijoz('A', 10)], { a: 80, b: 120 })).toThrow(BiznesXato);
    expect(ABC_STANDART).toEqual({ a: 80, b: 95 });
  });

  it('Pareto chizig‘i uchun nuqtalar', () => {
    const n = abcTahlil([mijoz('A', 800), mijoz('B', 200)]);
    expect(paretoNuqtalari(n)).toEqual([
      { x: 'A', y: 80 },
      { x: 'B', y: 100 },
    ]);
  });
});
