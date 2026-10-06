/** Mijoz importi uchun CSV o'qish — egasi auditi 2026-10-06 */
import { describe, expect, it } from 'vitest';
import { ajratuvchiniTop, csvOqi, sarlavhaKaliti } from '@/lib/domain/csv';

describe('csvOqi', () => {
  it('EC-CSV-01: Excel «;» bilan, BOM bilan', () => {
    expect(csvOqi('\uFEFFIsm;Telefon\r\nAli;+998 90 111 22 33\r\n')).toEqual([
      ['Ism', 'Telefon'],
      ['Ali', '+998 90 111 22 33'],
    ]);
  });

  it('EC-CSV-02: qo‘shtirnoq ichida ajratuvchi, yangi qator va ""', () => {
    expect(csvOqi('Ism,Izoh\n"Vali, MChJ","birinchi\nikkinchi ""katta"""\n')).toEqual([
      ['Ism', 'Izoh'],
      ['Vali, MChJ', 'birinchi\nikkinchi "katta"'],
    ]);
  });

  it('EC-CSV-03: bo‘sh qatorlar tashlanadi, oxirgi qator yangi qatorsiz', () => {
    expect(csvOqi('Ism\tTelefon\n\nAli\t901112233')).toEqual([
      ['Ism', 'Telefon'],
      ['Ali', '901112233'],
    ]);
  });

  it('EC-CSV-04: ajratuvchi sarlavhadan aniqlanadi', () => {
    expect(ajratuvchiniTop('a;b;c')).toBe(';');
    expect(ajratuvchiniTop('a,b,c')).toBe(',');
    expect(ajratuvchiniTop('a\tb')).toBe('\t');
  });

  it('EC-CSV-05: sarlavha kaliti apostrof va katta harfga qaramaydi', () => {
    expect(sarlavhaKaliti("To'lov muddati")).toBe(sarlavhaKaliti('TO‘LOV MUDDATI'));
  });
});

describe('csvYoz', () => {
  it('EC-CSV-10: BOM, «;», CRLF, qo‘shtirnoq va kasr vergul', async () => {
    const { csvYoz, csvSon } = await import('@/lib/domain/csv');
    const m = csvYoz(['Nom', 'Summa'], [['Parda; "Lux"', csvSon('1500000.50')], ['Oq', null]]);
    expect(m.charCodeAt(0)).toBe(0xfeff);
    expect(m.slice(1)).toBe('Nom;Summa\r\n"Parda; ""Lux""";1500000,50\r\nOq;\r\n');
  });

  it('EC-CSV-11: yozilgani o‘qilganda aynan qaytadi', async () => {
    const { csvYoz, csvOqi } = await import('@/lib/domain/csv');
    const jadval = [['Ism', 'Izoh'], ['Vali, MChJ', 'birinchi\nikkinchi "katta"']];
    expect(csvOqi(csvYoz(jadval[0] ?? [], jadval.slice(1)))).toEqual(jadval);
  });
});
