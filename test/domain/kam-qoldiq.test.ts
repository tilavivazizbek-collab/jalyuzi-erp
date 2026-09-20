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
    expect(ostatkaChegarasiKerakmi('M')).toBe(true);
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

  /**
   * ⚠️ 2026-09-20 — qoldiq ham, chegara ham METRDA. Ilgari qoldiq
   *    smda edi va bu yerda ÷100 bo'lardi (350 sm → 3.5 m).
   */
  it('Q-01 — qoldiq ham, chegara ham metrda', () => {
    expect(kamQoldiqmi('M', 3.5, 5)).toBe(true);
    expect(kamQoldiqmi('M', 8, 5)).toBe(false);
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
    expect(kamQoldiqmi('M', 0, 1)).toBe(true);
  });
});

describe('Chegara birligi — ekrandagi yorliq', () => {
  it('donada «dona», qolganida «m»', () => {
    expect(chegaraBirligi('DONA')).toBe('dona');
    expect(chegaraBirligi('M')).toBe('m');
    expect(chegaraBirligi('KV_M')).toBe('m');
  });
});
