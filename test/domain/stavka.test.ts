/**
 * TZ 10.8 · 10.9 · 10.10 · 10.12 · 20.11.3 · 2.3-invariant
 */
import { describe, expect, it } from 'vitest';
import {
  bosqichniTop,
  haqHisobla,
  pozitsiyaHaqi,
  stavkaTanla,
  type Bosqich,
  type StavkaQatori,
} from '@/lib/domain/stavka';
import { pulMatn } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

const s = (o: Partial<StavkaQatori> = {}): StavkaQatori => ({
  id: 1,
  mahsulotTurId: 10,
  filialId: null,
  xodimId: null,
  qiymat: '15000',
  birlik: 'DONA',
  chegaraKvM: null,
  amalQiladiDan: '2026-01-01',
  ...o,
});

/**
 * Qat'iy va kv.metrli stavkada maydon tanlovga TA'SIR QILMAYDI —
 * shu testlarda u shunchaki bir qiymat.
 */
const MAYDON = 1;

// ─── TZ 10.9 · Ustunlik: xodim > filial > standart ────────────────────────

describe('TZ 10.9 — eng aniq mos stavka tanlanadi', () => {
  it('xodim stavkasi filialdan ham, standartdan ham ustun', () => {
    const n = stavkaTanla(
      [
        s({ id: 1, qiymat: '15000' }),
        s({ id: 2, filialId: 2, qiymat: '17000' }),
        s({ id: 3, xodimId: 5, qiymat: '20000' }),
      ],
      10,
      2,
      5,
      '2026-08-21',
      MAYDON,
    );
    expect(n?.id).toBe(3);
  });

  it('xodim stavkasi yo\'q — filial olinadi', () => {
    const n = stavkaTanla(
      [s({ id: 1, qiymat: '15000' }), s({ id: 2, filialId: 2, qiymat: '17000' })],
      10,
      2,
      5,
      '2026-08-21',
      MAYDON,
    );
    expect(n?.id).toBe(2);
  });

  it('ikkalasi ham yo\'q — standart', () => {
    const n = stavkaTanla([s({ id: 1 })], 10, 2, 5, '2026-08-21', MAYDON);
    expect(n?.id).toBe(1);
  });

  it("boshqa filialning stavkasi olinmaydi", () => {
    const n = stavkaTanla(
      [s({ id: 1 }), s({ id: 2, filialId: 99, qiymat: '99000' })],
      10,
      2,
      5,
      '2026-08-21',
      MAYDON,
    );
    expect(n?.id).toBe(1);
  });

  it("boshqa mahsulot turining stavkasi olinmaydi", () => {
    expect(stavkaTanla([s({ mahsulotTurId: 77 })], 10, 2, 5, '2026-08-21', MAYDON)).toBeNull();
  });
});

// ─── 2.3-invariant · Sana ─────────────────────────────────────────────────

describe("2.3-invariant — o'tgan ish eski stavkada qoladi", () => {
  it('kelajakdagi stavka BUGUNGI ishga qo\'llanmaydi', () => {
    const n = stavkaTanla(
      [
        s({ id: 1, qiymat: '15000', amalQiladiDan: '2026-01-01' }),
        s({ id: 2, qiymat: '20000', amalQiladiDan: '2026-12-01' }),
      ],
      10,
      2,
      5,
      '2026-08-21',
      MAYDON,
    );
    expect(n?.id).toBe(1);
  });

  it('bir xil darajada — KECHROQ boshlangani olinadi', () => {
    const n = stavkaTanla(
      [
        s({ id: 1, qiymat: '15000', amalQiladiDan: '2026-01-01' }),
        s({ id: 2, qiymat: '18000', amalQiladiDan: '2026-06-01' }),
      ],
      10,
      2,
      5,
      '2026-08-21',
      MAYDON,
    );
    expect(n?.id).toBe(2);
  });

  it("hali kuchga kirmagan stavka yagona bo'lsa — stavka YO'Q", () => {
    expect(
      stavkaTanla([s({ amalQiladiDan: '2027-01-01' })], 10, 2, 5, '2026-08-21', MAYDON),
    ).toBeNull();
  });
});

// ─── TZ 10.8 · Bosqichli jadval ───────────────────────────────────────────

describe('TZ 10.8 — chegaraga AYNAN TENG qiymat QUYI bosqichga kiradi', () => {
  const jadval: Bosqich[] = [
    { chegaraKvM: 1.0, qiymat: '1' },
    { chegaraKvM: 1.5, qiymat: '2' },
    { chegaraKvM: null, qiymat: '3' },
  ];

  it('1.00 kv.m → 1', () => {
    expect(bosqichniTop(jadval, 1.0).qiymat).toBe('1');
  });

  it('1.01 kv.m → 2', () => {
    expect(bosqichniTop(jadval, 1.01).qiymat).toBe('2');
  });

  it('1.50 kv.m → 2', () => {
    expect(bosqichniTop(jadval, 1.5).qiymat).toBe('2');
  });

  it('1.51 kv.m → 3', () => {
    expect(bosqichniTop(jadval, 1.51).qiymat).toBe('3');
  });

  it("eng quyi bosqich MINIMAL HAQ — 0.3 kv.m ham to'lanadi", () => {
    expect(bosqichniTop(jadval, 0.3).qiymat).toBe('1');
  });

  it("tartibsiz ro'yxat ham to'g'ri ishlaydi", () => {
    const aralash: Bosqich[] = [
      { chegaraKvM: null, qiymat: '3' },
      { chegaraKvM: 1.5, qiymat: '2' },
      { chegaraKvM: 1.0, qiymat: '1' },
    ];
    expect(bosqichniTop(aralash, 1.2).qiymat).toBe('2');
  });

  it("bo'sh jadval rad etiladi", () => {
    expect(() => bosqichniTop([], 1.0)).toThrow(BiznesXato);
  });
});

// ─── TZ 10.8 · Haq hisoblash ──────────────────────────────────────────────

describe("TZ 10.8 — uch xil hisoblash usuli", () => {
  it("qat'iy summa — o'lchamdan qat'i nazar", () => {
    expect(pulMatn(haqHisobla('15000', 'DONA', 3.2))).toBe('15000.00');
    expect(pulMatn(haqHisobla('15000', 'DONA', 0.5))).toBe('15000.00');
  });

  it('kv.metrga — 18 000 × 3.2 = 57 600', () => {
    expect(pulMatn(haqHisobla('18000', 'KV_M', 3.2))).toBe('57600.00');
  });

  it("kasrli maydon aniq hisoblanadi", () => {
    expect(pulMatn(haqHisobla('18000', 'KV_M', 2.94))).toBe('52920.00');
  });

  /**
   * ⚠️ 2026-09-05 — SONI hisobga olinadi.
   *
   *    Bitta pozitsiyada uchta bir xil parda bo'lsa, usta uchalasini
   *    tikadi. Ilgari `soni` umuman ishlatilmasdi: mijozdan uchtasining
   *    puli olinar, ustaga bittasining haqi to'lanardi.
   */
  it('SONI ko‘paytiriladi — uchta parda, uchta haq (10.8)', () => {
    // Qat'iy summa: 15 000 × 3
    expect(pulMatn(haqHisobla('15000', 'DONA', 3.2, 3))).toBe('45000.00');
    // Kv.metrga: 18 000 × 2.94 × 3
    expect(pulMatn(haqHisobla('18000', 'KV_M', 2.94, 3))).toBe('158760.00');
  });

  it('soni berilmasa BITTA deb olinadi — eski chaqiruvlar buzilmaydi', () => {
    expect(pulMatn(haqHisobla('15000', 'DONA', 3.2))).toBe(
      pulMatn(haqHisobla('15000', 'DONA', 3.2, 1)),
    );
  });

  it('soni noldan kichik bo‘la olmaydi', () => {
    expect(() => haqHisobla('15000', 'DONA', 3.2, 0)).toThrow();
  });
});

// ─── TZ 10.12 · Stavkasi yo'q mahsulot ────────────────────────────────────

describe('TZ 10.12 — stavkasi belgilanmagan tur ishlab chiqarishni TO\'XTATMAYDI', () => {
  it('haq 0 bo\'ladi va ogohlantirish bayrog\'i qo\'yiladi', () => {
    const n = pozitsiyaHaqi(null, 3.2);
    expect(pulMatn(n.haq)).toBe('0.00');
    expect(n.stavkaYoq).toBe(true);
  });

  it('stavka bor — ogohlantirish yo\'q', () => {
    const n = pozitsiyaHaqi(s({ qiymat: '18000', birlik: 'KV_M' }), 3.2);
    expect(pulMatn(n.haq)).toBe('57600.00');
    expect(n.stavkaYoq).toBe(false);
  });
});

// ─── TZ 10.8 · BOSQICHLI stavka 10.9 bilan birga ──────────────────────────

/**
 * ⚠️ NEGA BU TESTLAR BOR
 *
 *    `bosqichniTop()` yozilgan va sinalgan edi, lekin uni HECH KIM
 *    CHAQIRMASDI: bazada bosqichni saqlaydigan ustun yo'q, stavka
 *    tanlash esa har doim BITTA qator qaytarardi. Ya'ni 10.8 ning
 *    uchinchi usuli qog'ozda bor, tizimda yo'q edi.
 *
 *    Endi ikki qoida KETMA-KET ishlaydi: 10.9 GURUHNI tanlaydi,
 *    10.8 guruh ichidan QATORNI tanlaydi. Bu testlar aynan
 *    o'shalarning ulanishini ushlab turadi.
 */
describe('TZ 10.8 + 10.9 — bosqichli guruh, keyin bosqich', () => {
  const bosqich = (
    id: number,
    chegaraKvM: number | null,
    qiymat: string,
    qolgan: Partial<StavkaQatori> = {},
  ): StavkaQatori =>
    s({ id, chegaraKvM, qiymat, birlik: 'BOSQICH', ...qolgan });

  /** 10.8 misoli: 1 gacha 1, 1–1.5 → 2, undan yuqori → 3 */
  const jadval = [
    bosqich(1, 1.0, '10000'),
    bosqich(2, 1.5, '20000'),
    bosqich(3, null, '30000'),
  ];

  it('maydonga qarab kerakli bosqich tanlanadi', () => {
    expect(stavkaTanla(jadval, 10, 2, 5, '2026-08-21', 0.3)?.qiymat).toBe('10000');
    expect(stavkaTanla(jadval, 10, 2, 5, '2026-08-21', 1.0)?.qiymat).toBe('10000');
    expect(stavkaTanla(jadval, 10, 2, 5, '2026-08-21', 1.01)?.qiymat).toBe('20000');
    expect(stavkaTanla(jadval, 10, 2, 5, '2026-08-21', 1.5)?.qiymat).toBe('20000');
    expect(stavkaTanla(jadval, 10, 2, 5, '2026-08-21', 1.51)?.qiymat).toBe('30000');
    expect(stavkaTanla(jadval, 10, 2, 5, '2026-08-21', 9)?.qiymat).toBe('30000');
  });

  /**
   * ⚠️ ENG MUHIM TEKSHIRUV — bosqichli guruh BUTUNLIGICHA olinadi.
   *
   *    Ilgarigi mantiq bitta qator qaytarardi. Agar u saqlanib
   *    qolsa, uchta bosqichdan tasodifiy bittasi tanlanib, usta
   *    kichkina parda uchun eng qimmat haqni olardi.
   */
  it("xodim jadvali standart jadvalni TO'LIQ almashtiradi", () => {
    const aralash = [
      ...jadval,
      bosqich(11, 1.0, '15000', { xodimId: 5 }),
      bosqich(12, null, '45000', { xodimId: 5 }),
    ];

    // Xodimning o'z jadvali
    expect(stavkaTanla(aralash, 10, 2, 5, '2026-08-21', 0.8)?.id).toBe(11);
    expect(stavkaTanla(aralash, 10, 2, 5, '2026-08-21', 2)?.id).toBe(12);

    // Boshqa usta standart jadvalda qoladi
    expect(stavkaTanla(aralash, 10, 2, 7, '2026-08-21', 2)?.id).toBe(3);
  });

  /** 2.3 — sentabrda jadval o'zgardi, avgust ishi eskisida qoladi */
  it('yangi jadval eski ishga qo‘llanmaydi', () => {
    const ikki = [
      bosqich(1, null, '30000'),
      bosqich(2, null, '50000', { amalQiladiDan: '2026-09-01' }),
    ];
    expect(stavkaTanla(ikki, 10, 2, 5, '2026-08-21', 2)?.qiymat).toBe('30000');
    expect(stavkaTanla(ikki, 10, 2, 5, '2026-09-20', 2)?.qiymat).toBe('50000');
  });

  /**
   * ⚠️ Bosqich QAT'IY summa — maydonga KO'PAYTIRILMAYDI.
   *
   *    Bosqich allaqachon maydonga qarab tanlangan. Yana
   *    ko'paytirilsa haq ikki marta hisoblanardi: 1.2 kv.m lik
   *    parda uchun 20 000 emas, 24 000 chiqardi.
   */
  it('bosqich qiymati maydonga ko‘paytirilmaydi', () => {
    const n = pozitsiyaHaqi(bosqich(2, 1.5, '20000'), 1.2);
    expect(pulMatn(n.haq)).toBe('20000.00');
  });

  it('bosqichli haq SONI ga ko‘paytiriladi', () => {
    const n = pozitsiyaHaqi(bosqich(2, 1.5, '20000'), 1.2, 3);
    expect(pulMatn(n.haq)).toBe('60000.00');
  });
});
