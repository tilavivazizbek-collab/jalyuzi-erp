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

/**
 * Ombor auditi 2026-10-06 — rulon chegarasi METRDA (uzunlik), qoldiq
 * esa kv.m da saqlanadi. Ilgari to'g'ridan-to'g'ri solishtirilardi.
 */
describe('chegaraBirligidaQoldiq — rulon uzunligi', () => {
  it('EC-KAM-R1: eni 3 m, 10 m qolgan — 30 kv.m emas, 10 m; 20 m chegarada KAM', async () => {
    const { chegaraBirligidaQoldiq } = await import('@/lib/domain/birlik-tanlovi');
    const q = chegaraBirligidaQoldiq({
      hisobTuri: 'RULON',
      kvM: 30,
      miqdor: 0,
      boyiYigindisiM: 10,
      standartEniM: 3,
    });
    expect(q).toBe(10);
    expect(kamQoldiqmi('KV_M', q, 20)).toBe(true);
  });

  it('EC-KAM-R2: lamel 0.40 m, 30 m qolgan — 12 kv.m emas, 30 m; 20 m chegarada YETARLI', async () => {
    const { chegaraBirligidaQoldiq } = await import('@/lib/domain/birlik-tanlovi');
    const q = chegaraBirligidaQoldiq({
      hisobTuri: 'RULON',
      kvM: 12,
      miqdor: 0,
      boyiYigindisiM: 30,
      standartEniM: 0.4,
    });
    expect(q).toBe(30);
    expect(kamQoldiqmi('KV_M', q, 20)).toBe(false);
  });

  it('EC-KAM-R3: standart eni yo‘q — bo‘laklar bo‘yi yig‘indisi', async () => {
    const { chegaraBirligidaQoldiq } = await import('@/lib/domain/birlik-tanlovi');
    expect(
      chegaraBirligidaQoldiq({ hisobTuri: 'RULON', kvM: 45, miqdor: 0, boyiYigindisiM: 18, standartEniM: null }),
    ).toBe(18);
  });

  it('EC-KAM-R4: dona va chiziqli — miqdorning o‘zi', async () => {
    const { chegaraBirligidaQoldiq } = await import('@/lib/domain/birlik-tanlovi');
    expect(
      chegaraBirligidaQoldiq({ hisobTuri: 'DONA', kvM: 0, miqdor: 7, boyiYigindisiM: 0, standartEniM: null }),
    ).toBe(7);
    expect(
      chegaraBirligidaQoldiq({ hisobTuri: 'CHIZIQLI', kvM: 0, miqdor: 12.5, boyiYigindisiM: 0, standartEniM: null }),
    ).toBe(12.5);
  });
});
