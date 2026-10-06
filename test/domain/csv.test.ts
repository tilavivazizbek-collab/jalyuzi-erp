/** Mijoz importi uchun CSV o'qish — egasi auditi 2026-10-06 */
import { describe, expect, it } from 'vitest';
import { ajratuvchiniTop, csvOqi, sarlavhaKaliti } from '@/lib/domain/csv';

describe('csvOqi', () => {
  it('EC-CSV-01: Excel «;» bilan, BOM bilan', () => {
    expect(csvOqi('﻿Ism;Telefon\r\nAli;+998 90 111 22 33\r\n')).toEqual([
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
