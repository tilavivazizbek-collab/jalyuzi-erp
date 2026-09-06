/**
 * TZ 9.5 · 9.6 — dollar qarzini so'mda to'lash va kurs farqi.
 *
 * ⚠️ NEGA BU TESTLAR BOR
 *
 *    `kursFarqi()` va uning kanonik testi (1 650 000) allaqachon bor
 *    edi, lekin uni HECH KIM CHAQIRMASDI: dollar qarzini so'mda
 *    to'lash imkoniyati umuman yozilmagan edi (2026-09-03 auditi).
 *    Endi to'lov xaridlarga FIFO taqsimlanadi va farq har hujjatning
 *    O'Z kursi bo'yicha hisoblanadi.
 */
import { describe, expect, it } from 'vitest';
import {
  ochiqXaridlar,
  somToloviniTaqsimla,
  type OchiqXarid,
} from '@/lib/domain/kurs-farqi';
import { dollar, kurs, pulMatn, som } from '@/lib/domain/pul';

const SANA = new Date('2026-09-03T10:00:00+05:00');
const k = (q: number) => kurs(q, SANA, 'SNAPSHOT');

/** TZ 9.6 misoli — 3 000 $ 12 650 kursda kirgan. */
const XARID: OchiqXarid = { qoldiq: dollar(3000), kirimKursi: k(12_650) };

describe('TZ 9.6 — kanonik misol', () => {
  /**
   * ```
   * Kirim   3 000 $ × 12 650 = 37 950 000  → tannarx (qotdi)
   * To'lov  3 000 $ × 13 200 = 39 600 000  → kassadan chiqdi
   * Kurs farqi                  1 650 000  → xarajat
   * ```
   */
  it("39 600 000 so'm to'langanda farq 1 650 000 — XARAJAT", () => {
    const n = somToloviniTaqsimla([XARID], som(39_600_000), k(13_200));

    expect(pulMatn(n.yopilgan)).toBe('3000.00');
    expect(n.turi).toBe('XARAJAT');
    expect(pulMatn(n.farq)).toBe('1650000.00');
    expect(pulMatn(n.avans)).toBe('0.00');
  });

  it('kurs TUSHSA — daromad, xarajatga manfiy yozilmaydi', () => {
    // 3 000 × 12 000 = 36 000 000 → 12 650 dan arzonga yopildi
    const n = somToloviniTaqsimla([XARID], som(36_000_000), k(12_000));

    expect(n.turi).toBe('DAROMAD');
    // (12 650 − 12 000) × 3 000 = 1 950 000
    expect(pulMatn(n.farq)).toBe('1950000.00');
  });

  it("kurs o'zgarmasa farq YO'Q", () => {
    const n = somToloviniTaqsimla([XARID], som(37_950_000), k(12_650));
    expect(n.turi).toBe('YOQ');
    expect(pulMatn(n.farq)).toBe('0.00');
  });
});

describe('TZ 9.5 — eng eski hujjatdan yopiladi', () => {
  /** Har hujjatning O'Z kursi bor — o'rtachalash noto'g'ri javob berardi. */
  const eskilar: readonly OchiqXarid[] = [
    { qoldiq: dollar(1000), kirimKursi: k(12_000) }, // eng eski
    { qoldiq: dollar(2000), kirimKursi: k(13_000) },
  ];

  it('to\'lov ikkala hujjatga bo\'linadi, farq har biriga alohida', () => {
    // 3 000 $ ni 13 200 kursda yopamiz = 39 600 000
    const n = somToloviniTaqsimla(eskilar, som(39_600_000), k(13_200));

    expect(pulMatn(n.yopilgan)).toBe('3000.00');
    expect(n.qatorlar).toHaveLength(2);
    // (13 200 − 12 000) × 1 000 = 1 200 000
    expect(pulMatn(n.qatorlar[0]?.farq ?? som(0))).toBe('1200000.00');
    // (13 200 − 13 000) × 2 000 = 400 000
    expect(pulMatn(n.qatorlar[1]?.farq ?? som(0))).toBe('400000.00');
    expect(pulMatn(n.farq)).toBe('1600000.00');
  });

  it('qisman to\'lov faqat ENG ESKI hujjatni yopadi', () => {
    // 1 000 $ × 13 200 = 13 200 000
    const n = somToloviniTaqsimla(eskilar, som(13_200_000), k(13_200));

    expect(pulMatn(n.yopilgan)).toBe('1000.00');
    expect(n.qatorlar).toHaveLength(1);
    expect(pulMatn(n.farq)).toBe('1200000.00');
  });

  it('yopilgan hujjat tashlab ketiladi', () => {
    const n = somToloviniTaqsimla(
      [{ qoldiq: dollar(0), kirimKursi: k(12_000) }, XARID],
      som(13_200_000),
      k(13_200),
    );
    expect(n.qatorlar).toHaveLength(1);
    expect(pulMatn(n.qatorlar[0]?.yopildi ?? dollar(0))).toBe('1000.00');
  });
});

describe('TZ 9.5 — ortiqcha to\'lov AVANS bo\'ladi', () => {
  it("qarzdan ko'p to'lansa ortig'iga kurs farqi YOZILMAYDI", () => {
    // 4 000 $ lik to'lov, qarz esa 3 000 $
    const n = somToloviniTaqsimla([XARID], som(52_800_000), k(13_200));

    expect(pulMatn(n.yopilgan)).toBe('3000.00');
    expect(pulMatn(n.avans)).toBe('1000.00');
    // Farq faqat yopilgan 3 000 $ bo'yicha
    expect(pulMatn(n.farq)).toBe('1650000.00');
  });

  it("qarz umuman bo'lmasa hammasi avans", () => {
    const n = somToloviniTaqsimla([], som(13_200_000), k(13_200));

    expect(pulMatn(n.yopilgan)).toBe('0.00');
    expect(pulMatn(n.avans)).toBe('1000.00');
    expect(n.turi).toBe('YOQ');
  });
});

describe("TZ 9.5 — qaysi hujjat hali yopilmagan", () => {
  const hammasi: readonly OchiqXarid[] = [
    { qoldiq: dollar(1000), kirimKursi: k(12_000) },
    { qoldiq: dollar(2000), kirimKursi: k(13_000) },
  ];

  it("hech narsa to'lanmagan bo'lsa hammasi ochiq", () => {
    expect(ochiqXaridlar(hammasi, dollar(0))).toHaveLength(2);
  });

  it("eng eski hujjat to'liq yopilsa ro'yxatdan chiqadi", () => {
    const n = ochiqXaridlar(hammasi, dollar(1000));
    expect(n).toHaveLength(1);
    expect(pulMatn(n[0]?.qoldiq ?? dollar(0))).toBe('2000.00');
  });

  it('qisman yopilgan hujjatning QOLGANI ochiq turadi', () => {
    const n = ochiqXaridlar(hammasi, dollar(1500));
    expect(n).toHaveLength(1);
    expect(pulMatn(n[0]?.qoldiq ?? dollar(0))).toBe('1500.00');
  });

  it("hammasi to'langan bo'lsa ochiq hujjat yo'q", () => {
    expect(ochiqXaridlar(hammasi, dollar(3000))).toHaveLength(0);
  });
});
