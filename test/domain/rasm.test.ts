/**
 * TZ 4.2 · 3.3 — katalog rasmi.
 *
 * ⚠️ Rasm BAZADA saqlanadi: Render bepul rejasida fayl tizimi
 *    vaqtinchalik va har deploy da rasmlar yo'qolardi.
 */
import { describe, expect, it } from 'vitest';
import { ENG_KATTA_BAYT, rasmniOqi } from '@/lib/domain/rasm';
import { BiznesXato } from '@/lib/xato';

/** Kichik haqiqiy webp — bir nechta bayt yetarli */
const NAMUNA = Buffer.from('RIFF....WEBPVP8 ', 'ascii').toString('base64');

describe('rasmniOqi — uch xil javob', () => {
  it("bo'sh matn — rasm O'ZGARMADI", () => {
    expect(rasmniOqi('')).toBeNull();
    expect(rasmniOqi('   ')).toBeNull();
  });

  it('`OCHIR` — rasmni olib tashlash', () => {
    /**
     * ⚠️ Bo'sh matndan FARQ QILADI. Ikkalasi bir xil bo'lsa
     *    rasmni o'chirib bo'lmasdi: har saqlashda «o'zgarmadi»
     *    deb tushunilardi.
     */
    expect(rasmniOqi('OCHIR')).toBe('OCHIR');
  });

  it('`data:` matn baytlarga o‘giriladi', () => {
    const n = rasmniOqi(`data:image/webp;base64,${NAMUNA}`);
    expect(n).not.toBeNull();
    expect(n).not.toBe('OCHIR');

    if (n !== null && n !== 'OCHIR') {
      expect(n.turi).toBe('image/webp');
      expect(n.baytlar.length).toBeGreaterThan(0);
    }
  });
});

describe('Xavfsizlik va chegaralar', () => {
  it('SVG QABUL QILINMAYDI — ichida kod bo‘lishi mumkin', () => {
    expect(() => rasmniOqi(`data:image/svg+xml;base64,${NAMUNA}`)).toThrow(BiznesXato);
  });

  it('rasm bo‘lmagan tur rad etiladi', () => {
    expect(() => rasmniOqi(`data:text/html;base64,${NAMUNA}`)).toThrow(BiznesXato);
    expect(() => rasmniOqi(`data:application/javascript;base64,${NAMUNA}`)).toThrow(
      BiznesXato,
    );
  });

  it('noto‘g‘ri format rad etiladi', () => {
    expect(() => rasmniOqi('shunchaki matn')).toThrow(BiznesXato);
    expect(() => rasmniOqi('data:image/webp,xxx')).toThrow(BiznesXato);
  });

  it("bo'sh rasm rad etiladi", () => {
    expect(() => rasmniOqi('data:image/webp;base64,')).toThrow(BiznesXato);
  });

  it('1 MB dan katta rasm rad etiladi', () => {
    /**
     * ⚠️ Brauzer kichiklashtiradi, lekin uni aylanib o'tish
     *    mumkin. Bu — oxirgi to'siq: baza shishib ketmasin.
     */
    const katta = Buffer.alloc(ENG_KATTA_BAYT + 1000).toString('base64');
    expect(() => rasmniOqi(`data:image/webp;base64,${katta}`)).toThrow(BiznesXato);
  });

  it('jpeg va png ham qabul qilinadi', () => {
    expect(rasmniOqi(`data:image/jpeg;base64,${NAMUNA}`)).not.toBeNull();
    expect(rasmniOqi(`data:image/png;base64,${NAMUNA}`)).not.toBeNull();
  });
});
