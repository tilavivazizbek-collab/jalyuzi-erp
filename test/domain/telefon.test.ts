/**
 * TZ 6.5 · 10.2 · 13.2 · QISM 1 §8
 *
 * Telefon raqami tizimda SHAXSNI belgilaydi. Bir odam ikki xil yozilsa
 * ikkita mijoz bo'lib qoladi va qarzi ikkiga bo'linadi — shuning uchun
 * bu funksiya alohida sinaladi.
 */
import { describe, expect, it } from 'vitest';
import {
  MAMLAKAT_KODI,
  telefonKanonik,
  telefonKorsat,
  telefonTeng,
  telefonYaroqlimi,
} from '@/lib/domain/telefon';
import { BiznesXato } from '@/lib/xato';

describe("bir ko'rinishga keltirish", () => {
  const KUTILGAN = '998901234567';

  it('bir odam qanday yozilsa ham bitta raqam chiqadi', () => {
    const yozuvlar = [
      '998901234567',
      '+998901234567',
      '+998 90 123 45 67',
      '+998 (90) 123-45-67',
      '998-90-123-45-67',
      '901234567',
      '90 123 45 67',
      '8 90 123 45 67',
      '  +998 90 123 45 67  ',
    ];
    for (const y of yozuvlar) {
      expect(telefonKanonik(y), y).toBe(KUTILGAN);
    }
  });

  it('mamlakat kodi qo\'shiladi', () => {
    expect(telefonKanonik('901234567').startsWith(MAMLAKAT_KODI)).toBe(true);
  });
});

describe("noto'g'ri raqam", () => {
  it('kalta, uzun va bo\'sh raqam rad etiladi', () => {
    for (const yomon of ['', '123', '12345678', '9012345678901234', 'salom']) {
      expect(() => telefonKanonik(yomon), yomon).toThrow(BiznesXato);
      expect(telefonYaroqlimi(yomon), yomon).toBe(false);
    }
  });

  it("boshqa mamlakat kodi rad etiladi — uzunligi mos kelsa ham", () => {
    // 12 raqam, lekin 998 bilan boshlanmaydi
    expect(() => telefonKanonik('799012345678')).toThrow(BiznesXato);
  });

  it('yaroqli raqamda otmaydi', () => {
    expect(telefonYaroqlimi('+998 90 123 45 67')).toBe(true);
  });
});

describe('6.5 — dublikat nazorati', () => {
  it('har xil yozilgan bir raqam TENG deb topiladi', () => {
    expect(telefonTeng('+998 90 123 45 67', '901234567')).toBe(true);
    expect(telefonTeng('8 90 123 45 67', '998901234567')).toBe(true);
  });

  it('boshqa raqam teng emas', () => {
    expect(telefonTeng('901234567', '901234568')).toBe(false);
  });

  it("buzuq raqam hech narsaga teng emas — yiqilmaydi", () => {
    expect(telefonTeng('salom', '901234567')).toBe(false);
    expect(telefonTeng('salom', 'salom')).toBe(false);
  });
});

describe("ko'rsatish", () => {
  it('o\'qishga qulay ko\'rinish', () => {
    expect(telefonKorsat('998901234567')).toBe('+998 90 123 45 67');
  });

  it('kanonik bo\'lmagan qiymat o\'zgarishsiz qaytadi', () => {
    expect(telefonKorsat('notogri')).toBe('notogri');
    expect(telefonKorsat('901234567')).toBe('901234567');
  });

  it('kanonik → ko\'rsatish → kanonik aylanishi buzilmaydi', () => {
    const asl = '998901234567';
    expect(telefonKanonik(telefonKorsat(asl))).toBe(asl);
  });
});
