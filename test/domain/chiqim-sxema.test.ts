/**
 * TZ 7.10 · 7.12 — hisobdan chiqarish va storno formalarining tekshiruvi.
 *
 * Bu testlar bazaga TEGMAYDI — `npm test` bilan oflayn ishlaydi.
 */
import { describe, expect, it } from 'vitest';
import {
  CHIQARISH_SABABLARI,
  SABAB_NOMI,
  chiqimSxema,
  chiqimBekorSxema,
  stornoSxema,
} from '@/lib/sxema/chiqim';

const asos = {
  bolakId: '12',
  sabab: 'YIRTILDI',
  izoh: '',
  davoQilinadimi: false,
};

describe('TZ 7.10 — chiqarish formasi', () => {
  it("to'g'ri ma'lumot o'tadi va bolakId songa aylanadi", () => {
    const n = chiqimSxema.safeParse(asos);
    expect(n.success).toBe(true);
    expect(n.success && n.data.bolakId).toBe(12);
    expect(n.success && n.data.izoh).toBeUndefined();
  });

  it('sabab ro\'yxatdan tashqarida bo\'lsa RAD ETILADI', () => {
    expect(chiqimSxema.safeParse({ ...asos, sabab: 'XOHLAGANIM' }).success).toBe(false);
  });

  it("«Boshqa» tanlansa izoh MAJBURIY — hisobotda foydasiz qator qolmasin", () => {
    const bosh = chiqimSxema.safeParse({ ...asos, sabab: 'BOSHQA' });
    expect(bosh.success).toBe(false);
    expect(!bosh.success && bosh.error.issues[0]?.path).toEqual(['izoh']);

    const izohli = chiqimSxema.safeParse({
      ...asos,
      sabab: 'BOSHQA',
      izoh: 'Sichqon kemirdi',
    });
    expect(izohli.success).toBe(true);
  });

  it("bo'lak raqami bo'lmasa yoki manfiy bo'lsa RAD ETILADI", () => {
    for (const x of ['', '0', '-3', 'abc', '1.5']) {
      expect(chiqimSxema.safeParse({ ...asos, bolakId: x }).success).toBe(false);
    }
  });

  it('har sabab uchun o\'zbekcha nom bor (14.9)', () => {
    for (const s of CHIQARISH_SABABLARI) {
      expect(SABAB_NOMI[s].length).toBeGreaterThan(0);
    }
  });
});

describe('TZ 7.10 — bekor qilish formasi', () => {
  it('sabab MAJBURIY — teskari yozuv izohiga tushadi', () => {
    expect(chiqimBekorSxema.safeParse({ harakatId: '5', izoh: '   ' }).success).toBe(false);
    expect(chiqimBekorSxema.safeParse({ harakatId: '5', izoh: 'Topildi' }).success).toBe(
      true,
    );
  });
});

describe('TZ 7.12 — storno formasi', () => {
  it('sababsiz storno qilinmaydi', () => {
    expect(stornoSxema.safeParse({ kirimId: '7', sabab: '' }).success).toBe(false);
  });

  it("to'g'ri ma'lumot o'tadi", () => {
    const n = stornoSxema.safeParse({ kirimId: '7', sabab: 'Ikki marta kiritilgan' });
    expect(n.success).toBe(true);
    expect(n.success && n.data.kirimId).toBe(7);
  });
});
