/**
 * TZ 11.1 — hisobot davri va taqqoslash davri.
 *
 * Sinovlar mahalliy vaqtda ishlaydi: jarayon `TZ=Asia/Tashkent` bilan
 * ishga tushadi (vitest.config.ts) va `invariant.ts` buni tekshiradi.
 */
import { describe, expect, it } from 'vitest';
import {
  type Davr,
  davrMatn,
  davrTurimi,
  davrYasa,
  haftaBoshi,
  ichidami,
  kunBoshi,
  kunlarSoni,
  oldingiDavr,
  sanaMatn,
} from '@/lib/domain/hisobot/davr';
import { BiznesXato } from '@/lib/xato';

// Chorshanba
const BUGUN = new Date(2026, 7, 12, 15, 40); // 12.08.2026, 15:40

describe('davr chegaralari — TZ 11.1', () => {
  it('BUGUN — 00:00 dan ertangi 00:00 gacha', () => {
    const d = davrYasa('BUGUN', BUGUN);
    expect(sanaMatn(d.boshi)).toBe('12.08.2026');
    expect(d.boshi.getHours()).toBe(0);
    expect(sanaMatn(d.oxiri)).toBe('13.08.2026');
  });

  it('HAFTA dushanbadan boshlanadi', () => {
    const d = davrYasa('HAFTA', BUGUN);
    expect(sanaMatn(d.boshi)).toBe('10.08.2026');
  });

  it('yakshanba o‘tgan haftaga tegishli — dushanba emas', () => {
    // 16.08.2026 — yakshanba. Hafta 10.08 (dushanba) dan boshlanadi.
    expect(sanaMatn(haftaBoshi(new Date(2026, 7, 16)))).toBe('10.08.2026');
    // 17.08.2026 — dushanba, yangi hafta
    expect(sanaMatn(haftaBoshi(new Date(2026, 7, 17)))).toBe('17.08.2026');
  });

  it('OY, CHORAK, YIL', () => {
    expect(sanaMatn(davrYasa('OY', BUGUN).boshi)).toBe('01.08.2026');
    expect(sanaMatn(davrYasa('CHORAK', BUGUN).boshi)).toBe('01.07.2026');
    expect(sanaMatn(davrYasa('YIL', BUGUN).boshi)).toBe('01.01.2026');
  });

  it('ORALIQ — oxirgi kun ICHIGA kiradi', () => {
    const d = davrYasa('ORALIQ', BUGUN, {
      boshi: new Date(2026, 7, 1),
      oxiri: new Date(2026, 7, 31, 23, 30),
    });
    expect(sanaMatn(d.oxiri)).toBe('01.09.2026');
    expect(ichidami(d, new Date(2026, 7, 31, 23, 59, 59))).toBe(true);
    expect(ichidami(d, new Date(2026, 8, 1, 0, 0, 0))).toBe(false);
  });

  it('teskari oraliq va sanasiz oraliq — xato', () => {
    expect(() =>
      davrYasa('ORALIQ', BUGUN, { boshi: new Date(2026, 7, 31), oxiri: new Date(2026, 7, 1) }),
    ).toThrow(BiznesXato);
    expect(() => davrYasa('ORALIQ', BUGUN)).toThrow(BiznesXato);
  });

  it('davr turi tekshiriladi — manzildan kelgan matn sahifani yiqitmaydi', () => {
    expect(davrTurimi('OY')).toBe(true);
    expect(davrTurimi("'; DROP TABLE mijoz; --")).toBe(false);
  });
});

describe('oldingi davr — taqqoslash uchun', () => {
  it('OY kalendar bo‘yicha suriladi, 30 kun bo‘yicha emas', () => {
    // Iyul 31 kun, iyun 30 kun. Kun soni bilan surilsa iyun 1 kun kam
    // ko'rinardi va «tushum kamaydi» degan soxta natija chiqardi.
    const oy = davrYasa('OY', new Date(2026, 6, 20));
    const oldin = oldingiDavr(oy);
    expect(sanaMatn(oldin.boshi)).toBe('01.06.2026');
    expect(sanaMatn(oldin.oxiri)).toBe('01.07.2026');
  });

  it('yanvarda oldingi oy — o‘tgan yilning dekabri', () => {
    const oldin = oldingiDavr(davrYasa('OY', new Date(2026, 0, 15)));
    expect(sanaMatn(oldin.boshi)).toBe('01.12.2025');
  });

  it('CHORAK va YIL', () => {
    expect(sanaMatn(oldingiDavr(davrYasa('CHORAK', BUGUN)).boshi)).toBe('01.04.2026');
    expect(sanaMatn(oldingiDavr(davrYasa('YIL', BUGUN)).boshi)).toBe('01.01.2025');
  });

  it('BUGUN — kecha', () => {
    const oldin = oldingiDavr(davrYasa('BUGUN', BUGUN));
    expect(sanaMatn(oldin.boshi)).toBe('11.08.2026');
    expect(sanaMatn(oldin.oxiri)).toBe('12.08.2026');
  });

  it('ORALIQ — xuddi shu uzunlikdagi oldingi bo‘lak', () => {
    const d = davrYasa('ORALIQ', BUGUN, {
      boshi: new Date(2026, 7, 10),
      oxiri: new Date(2026, 7, 12),
    });
    const oldin = oldingiDavr(d);
    expect(kunlarSoni(oldin)).toBe(kunlarSoni(d));
    expect(sanaMatn(oldin.boshi)).toBe('07.08.2026');
    expect(oldin.oxiri.getTime()).toBe(d.boshi.getTime());
  });

  it('davrlar ustma-ust tushmaydi — bitta yozuv ikki davrda sanalmaydi', () => {
    const davrlar: Davr[] = [
      davrYasa('OY', BUGUN),
      davrYasa('HAFTA', BUGUN),
      davrYasa('YIL', BUGUN),
    ];
    for (const d of davrlar) {
      expect(oldingiDavr(d).oxiri.getTime()).toBe(d.boshi.getTime());
    }
  });
});

describe('kunlar soni va ko‘rinish', () => {
  it('avgust — 31 kun, fevral 2026 — 28', () => {
    const avgust = davrYasa('ORALIQ', BUGUN, {
      boshi: new Date(2026, 7, 1),
      oxiri: new Date(2026, 7, 31),
    });
    expect(kunlarSoni(avgust)).toBe(31);
    const fevral = davrYasa('ORALIQ', BUGUN, {
      boshi: new Date(2026, 1, 1),
      oxiri: new Date(2026, 1, 28),
    });
    expect(kunlarSoni(fevral)).toBe(28);
  });

  it('bir kunlik davrda ham nolga bo‘linish bo‘lmaydi', () => {
    expect(kunlarSoni(davrYasa('BUGUN', BUGUN))).toBe(1);
  });

  it('ko‘rinishda oxirgi KUN turadi, chegara emas', () => {
    const d = davrYasa('OY', BUGUN);
    expect(davrMatn(d)).toBe('01.08.2026 — 12.08.2026');
  });

  it('kun boshi vaqtni tashlaydi', () => {
    expect(kunBoshi(BUGUN).getHours()).toBe(0);
    expect(kunBoshi(BUGUN).getMinutes()).toBe(0);
  });
});
