/**
 * Q-10 · 5.5 — kam qoldiq va ostatka chegaralari.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * Egasi (2026-08-29): «mahsulot donaga bo'lsa yaroqsiz yoki
 * ostatkalar yo'qoladi, faqat metrda bo'ladi».
 *
 * Kam qoldiq ogohlantirishi esa ilgari FAQAT santimetrli
 * mahsulotda ishlardi: 200 ta mexanizmdan 2 tasi qolsa ham hech
 * kim ogohlantirilmasdi.
 */
import { describe, expect, it } from 'vitest';
import {
  chegaraBirligi,
  kamQoldiqmi,
  ostatkaChegarasiKerakmi,
} from '@/lib/domain/birlik-tanlovi';

describe('Ostatka chegarasi kimga kerak', () => {
  it('mato va chiziqli mahsulotda kerak', () => {
    expect(ostatkaChegarasiKerakmi('SM')).toBe(true);
    expect(ostatkaChegarasiKerakmi('KV_M')).toBe(true);
  });

  it('donada kerak emas', () => {
    expect(ostatkaChegarasiKerakmi('DONA')).toBe(false);
  });
});

describe('Kam qoldiq ogohlantirishi', () => {
  it('chegara qo‘yilmagan bo‘lsa ogohlantirmaydi', () => {
    expect(kamQoldiqmi('DONA', 0, null)).toBe(false);
  });

  it('Q-01 — chiziqli mahsulot smda saqlanadi, chegara metrda', () => {
    // 350 sm = 3.5 m, chegara 5 m → kam
    expect(kamQoldiqmi('SM', 350, 5)).toBe(true);
    // 800 sm = 8 m, chegara 5 m → yetarli
    expect(kamQoldiqmi('SM', 800, 5)).toBe(false);
  });

  it('DONA — chegara ham donada', () => {
    expect(kamQoldiqmi('DONA', 2, 10)).toBe(true);
    expect(kamQoldiqmi('DONA', 40, 10)).toBe(false);
  });

  it('chegaraga TENG bo‘lsa hali ogohlantirmaydi', () => {
    expect(kamQoldiqmi('DONA', 10, 10)).toBe(false);
  });

  it('nol qoldiq — albatta ogohlantiradi', () => {
    expect(kamQoldiqmi('DONA', 0, 1)).toBe(true);
    expect(kamQoldiqmi('SM', 0, 1)).toBe(true);
  });
});

describe('Chegara birligi — ekrandagi yorliq', () => {
  it('donada «dona», qolganida «m»', () => {
    expect(chegaraBirligi('DONA')).toBe('dona');
    expect(chegaraBirligi('SM')).toBe('m');
    expect(chegaraBirligi('KV_M')).toBe('m');
  });
});
