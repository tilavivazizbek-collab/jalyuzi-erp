/**
 * HISOBOTLAR-ISH §9 — bashorat mexanizmi.
 *
 * To'rt bo'lim shu funksiyalarga tayanadi, shuning uchun chegara holatlari
 * (tezlik nol, qoldiq nol, manfiy kirish) shu yerda qoplanadi.
 */
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  CHEGARA_OMBOR,
  aylanish,
  ishonchDarajasi,
  ortachaTezlik,
  qanchaKerak,
  qanchaKunQoldi,
} from '@/lib/domain/hisobot/bashorat';
import { sanaMatn } from '@/lib/domain/hisobot/davr';
import { BiznesXato } from '@/lib/xato';

const BUGUN = new Date(2026, 7, 12);

describe('o‘rtacha tezlik', () => {
  it('60 metr 30 kunda — kuniga 2 metr', () => {
    const t = ortachaTezlik(60, 30);
    expect(t.kunlik.toNumber()).toBe(2);
    expect(t.ishonch).toBe('ORTA');
  });

  it('kasr aniq saqlanadi — Decimal, number emas', () => {
    // 10 / 3 = 3.333… Suzuvchi nuqta bilan hisoblansa keyingi bo'linishda
    // xato to'planadi.
    expect(ortachaTezlik(10, 3).kunlik.toFixed(6)).toBe('3.333333');
  });

  it('harakat bo‘lmasa ishonch YO‘Q', () => {
    expect(ortachaTezlik(0, 90).ishonch).toBe('YOQ');
  });

  it('qisqa kuzatuv — ishonch PAST', () => {
    expect(ortachaTezlik(10, 5).ishonch).toBe('PAST');
    expect(ishonchDarajasi(13, true)).toBe('PAST');
    expect(ishonchDarajasi(14, true)).toBe('ORTA');
    expect(ishonchDarajasi(45, true)).toBe('YAXSHI');
  });

  it('kunlar noldan katta bo‘lishi shart', () => {
    expect(() => ortachaTezlik(10, 0)).toThrow(BiznesXato);
    expect(() => ortachaTezlik(10, -3)).toThrow(BiznesXato);
    expect(() => ortachaTezlik(-1, 30)).toThrow(BiznesXato);
  });
});

describe('qancha kun qoldi — TZ 11.7.3 dan keyingi qadam', () => {
  it('120 metr, kuniga 2 metr → 60 kun, 11.10.2026', () => {
    const b = qanchaKunQoldi(120, ortachaTezlik(60, 30), BUGUN);
    expect(b.kunlar).toBe(60);
    expect(b.sana === null ? '' : sanaMatn(b.sana)).toBe('11.10.2026');
    expect(b.holati).toBe('YETARLI');
  });

  it('pastga yaxlitlaydi — 6.9 kun 6 bo‘ladi', () => {
    // 20.7 / 3 = 6.9 kun. Yuqoriga yaxlitlansa material kutilmaganda tugaydi.
    const b = qanchaKunQoldi('20.7', ortachaTezlik(90, 30), BUGUN);
    expect(b.kunlar).toBe(6);
    expect(b.holati).toBe('XAVF');
  });

  it('chegaralar — 7 kun qizil, 14 kun sariq', () => {
    const tezlik = ortachaTezlik(30, 30); // kuniga 1
    expect(qanchaKunQoldi(7, tezlik, BUGUN).holati).toBe('XAVF');
    expect(qanchaKunQoldi(8, tezlik, BUGUN).holati).toBe('OGOHLANTIRISH');
    expect(qanchaKunQoldi(14, tezlik, BUGUN).holati).toBe('OGOHLANTIRISH');
    expect(qanchaKunQoldi(15, tezlik, BUGUN).holati).toBe('YETARLI');
    expect(CHEGARA_OMBOR.xavf).toBe(7);
  });

  it('qoldiq nol — TUGAGAN', () => {
    const b = qanchaKunQoldi(0, ortachaTezlik(30, 30), BUGUN);
    expect(b.kunlar).toBe(0);
    expect(b.holati).toBe('TUGAGAN');
  });

  it('harakat yo‘q — NOMALUM, «hech qachon tugamaydi» emas', () => {
    // Bu holat 11.7.6 (muzlab qolgan pul) signali: material o'lik yotibdi.
    const b = qanchaKunQoldi(500, ortachaTezlik(0, 180), BUGUN);
    expect(b.kunlar).toBeNull();
    expect(b.sana).toBeNull();
    expect(b.holati).toBe('NOMALUM');
    expect(b.ishonch).toBe('YOQ');
  });

  it('nolga bo‘linish hech qanday yo‘l bilan chiqmaydi', () => {
    expect(() => qanchaKunQoldi(100, ortachaTezlik(0, 1), BUGUN)).not.toThrow();
  });
});

describe('qancha kerak — xarid ro‘yxati uchun (15.3)', () => {
  it('30 kunga yetishi uchun yetishmaydigan miqdor', () => {
    const tezlik = ortachaTezlik(60, 30); // kuniga 2
    expect(qanchaKerak(20, tezlik, 30).toNumber()).toBe(40); // 60 kerak, 20 bor
  });

  it('zaxira yetarli bo‘lsa 0 — manfiy chiqmaydi', () => {
    expect(qanchaKerak(100, ortachaTezlik(60, 30), 30).toNumber()).toBe(0);
  });

  it('manfiy kunlar — xato', () => {
    expect(() => qanchaKerak(10, ortachaTezlik(60, 30), -1)).toThrow(BiznesXato);
  });
});

describe('aylanish koeffitsienti — §3.1 №16', () => {
  it('davr sarfi o‘rtacha qoldiqqa nisbatan', () => {
    const a = aylanish(600, 150);
    expect(a === null ? 0 : a.toNumber()).toBe(4);
  });

  it('o‘rtacha qoldiq nol — hisoblanmaydi', () => {
    expect(aylanish(600, 0)).toBeNull();
  });

  it('Decimal qabul qiladi', () => {
    const a = aylanish(new Decimal('120.5'), new Decimal('24.1'));
    expect(a === null ? 0 : a.toNumber()).toBe(5);
  });
});
