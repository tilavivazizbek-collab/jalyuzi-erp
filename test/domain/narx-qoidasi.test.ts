/**
 * test/domain/narx-qoidasi.test.ts — Egasi qarori 2026-09-20 · TZ 3.8
 *
 * ⚠️ Bu yerdagi xato MIJOZDAN NOTO'G'RI PUL OLISHGA olib keladi.
 *    Bosqich bir qadam surilsa yoki chegara noto'g'ri tushunilsa,
 *    jalyuzi arzonga ketadi va buni hech kim sezmaydi.
 */

import { describe, expect, it } from 'vitest';
import {
  bosqichlarniTekshir,
  bosqichniTop,
  chegaradaNarxTushadimi,
  olchovi,
  pozitsiyaQoidaNarxi,
  qoidaNarxi,
  qoshimchaNarxi,
  type Bosqich,
  type Qoida,
} from '@/lib/domain/narx-qoidasi';
import { dollar, kurs, pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

/** Egasi bergan jadval (2026-09-20): 8 $ · 5 $ · 3 $ */
const EGASI_JADVALI: readonly Bosqich[] = [
  { dan: 0, gacha: 0.5, narx: '8', valyuta: 'USD' },
  { dan: 0.5, gacha: 1, narx: '5', valyuta: 'USD' },
  { dan: 1, gacha: null, narx: '3', valyuta: 'USD' },
];

const QOIDA: Qoida = { hisoblashUsuli: 'MAYDON', bosqichlar: EGASI_JADVALI };
const KURS = kurs(12_500, new Date('2026-09-20'), 'JORIY');

describe("o'lchov — bosqich qaysi songa qarab tanlanadi", () => {
  it('MAYDON — kv.m da (santimetrdan)', () => {
    expect(olchovi('MAYDON', 1.8, 2.2)).toBeCloseTo(3.96, 4);
    expect(olchovi('MAYDON', 1, 1)).toBeCloseTo(1, 4);
    expect(olchovi('MAYDON', 0.4, 0.5)).toBeCloseTo(0.2, 4);
  });

  it('ENI va BO‘YI — metrda, ikkinchi o‘lchamga qaramaydi', () => {
    expect(olchovi('ENI', 1.8, 2.2)).toBeCloseTo(1.8, 4);
    expect(olchovi('ENI', 1.8, 5)).toBeCloseTo(1.8, 4);
    expect(olchovi("BO'YI", 1.8, 2.2)).toBeCloseTo(2.2, 4);
    expect(olchovi("BO'YI", 9, 2.2)).toBeCloseTo(2.2, 4);
  });

  it('DONA — o‘lchamdan mutlaqo bog‘liq emas', () => {
    expect(olchovi('DONA', 1.8, 2.2)).toBe(1);
    expect(olchovi('DONA', 0, 0)).toBe(1);
  });

  it('nol yoki manfiy o‘lcham rad etiladi', () => {
    expect(() => olchovi('MAYDON', 0, 2.2)).toThrow(BiznesXato);
    expect(() => olchovi('MAYDON', 180, -1)).toThrow(BiznesXato);
    expect(() => olchovi('ENI', Number.NaN, 220)).toThrow(BiznesXato);
  });
});

/**
 * Chegara qoidasi `[dan, gacha)` — bu yerda xato qilish oson va
 * qimmat: 1.00 kv.m aynan qaysi bosqichga tushishi pul demakdir.
 */
describe('bosqich tanlash — chegara [dan, gacha)', () => {
  const top = (o: number): string | null => bosqichniTop(EGASI_JADVALI, o)?.narx ?? null;

  it('oraliq ichidagilar', () => {
    expect(top(0.2)).toBe('8');
    expect(top(0.75)).toBe('5');
    expect(top(3.96)).toBe('3');
  });

  it('`dan` KIRADI, `gacha` KIRMAYDI', () => {
    expect(top(0)).toBe('8');
    expect(top(0.49999)).toBe('8');
    expect(top(0.5)).toBe('5'); // gacha=0.5 kirmaydi, dan=0.5 kiradi
    expect(top(0.99999)).toBe('5');
    expect(top(1)).toBe('3');
  });

  it('cheksiz bosqich yuqoridan chegaralanmaydi', () => {
    expect(top(1000)).toBe('3');
  });

  it('qoplanmagan o‘lchovga `null` — jimgina nol emas', () => {
    const teshik: Bosqich[] = [{ dan: 2, gacha: null, narx: '3', valyuta: 'SOM' }];
    expect(bosqichniTop(teshik, 1)).toBeNull();
  });
});

describe('asosiy narx — stavka × o‘lchov', () => {
  it('180 × 220 = 3.96 kv.m → 3 $ × 3.96 = 11.88 $ = 148 500 so‘m', () => {
    expect(qoidaNarxi(QOIDA, 1.8, 2.2, KURS)).toEqual(som('148500.00'));
  });

  it('40 × 50 = 0.2 kv.m → eng qimmat bosqich, 8 $ × 0.2 = 1.6 $', () => {
    expect(qoidaNarxi(QOIDA, 0.4, 0.5, KURS)).toEqual(som('20000.00'));
  });

  it('so‘mdagi bosqich kurssiz ham ishlaydi', () => {
    const somda: Qoida = {
      hisoblashUsuli: 'MAYDON',
      bosqichlar: [{ dan: 0, gacha: null, narx: '120000', valyuta: 'SOM' }],
    };
    expect(qoidaNarxi(somda, 1.8, 2.2, null)).toEqual(som('475200.00'));
  });

  it('dollardagi bosqichga kurs bo‘lmasa XATO — jim so‘m deb olinmaydi', () => {
    expect(() => qoidaNarxi(QOIDA, 1.8, 2.2, null)).toThrow(BiznesXato);
  });

  it('bosqich topilmasa XATO — bepulga sotilmaydi', () => {
    const teshik: Qoida = {
      hisoblashUsuli: 'MAYDON',
      bosqichlar: [{ dan: 5, gacha: null, narx: '3', valyuta: 'SOM' }],
    };
    expect(() => qoidaNarxi(teshik, 1.8, 2.2, null)).toThrow(BiznesXato);
  });

  it('ENI usuli — bo‘yi narxga ta’sir qilmaydi', () => {
    const eniga: Qoida = {
      hisoblashUsuli: 'ENI',
      bosqichlar: [{ dan: 0, gacha: null, narx: '250000', valyuta: 'SOM' }],
    };
    expect(qoidaNarxi(eniga, 1.8, 2.2, null)).toEqual(som('450000.00'));
    expect(qoidaNarxi(eniga, 1.8, 4, null)).toEqual(som('450000.00'));
  });

  it('DONA usuli — o‘lcham umuman ta’sir qilmaydi', () => {
    const donaga: Qoida = {
      hisoblashUsuli: 'DONA',
      bosqichlar: [{ dan: 0, gacha: null, narx: '300000', valyuta: 'SOM' }],
    };
    expect(qoidaNarxi(donaga, 1.8, 2.2, null)).toEqual(som('300000.00'));
    expect(qoidaNarxi(donaga, 3, 4, null)).toEqual(som('300000.00'));
  });
});

describe('qo‘shimchalar', () => {
  it('QATIY — o‘lchamga qaramaydi («o‘rnatish 150 000»)', () => {
    const q = { nom: "O'rnatish", hisoblashUsuli: 'QATIY' as const, narx: '150000', valyuta: 'SOM' };
    expect(qoshimchaNarxi(q, 1.8, 2.2, null)).toEqual(som('150000.00'));
    expect(qoshimchaNarxi(q, 3, 4, null)).toEqual(som('150000.00'));
  });

  it('ENI — «usti shabalik» eni bo‘yicha: 1.8 × 80 000 = 144 000', () => {
    const q = { nom: 'Usti shabalik', hisoblashUsuli: 'ENI' as const, narx: '80000', valyuta: 'SOM' };
    expect(qoshimchaNarxi(q, 1.8, 2.2, null)).toEqual(som('144000.00'));
  });

  it('MAYDON — maydon bo‘yicha', () => {
    const q = { nom: 'Qoplama', hisoblashUsuli: 'MAYDON' as const, narx: '10000', valyuta: 'SOM' };
    expect(qoshimchaNarxi(q, 1.8, 2.2, null)).toEqual(som('39600.00'));
  });

  it('dollardagi qo‘shimcha kurs bilan o‘giriladi', () => {
    const q = { nom: 'Pult', hisoblashUsuli: 'QATIY' as const, narx: '12', valyuta: 'USD' };
    expect(qoshimchaNarxi(q, 1.8, 2.2, KURS)).toEqual(som('150000.00'));
  });
});

describe('pozitsiya jami', () => {
  const QOSHIMCHALAR = [
    { nom: 'Usti shabalik', hisoblashUsuli: 'ENI' as const, narx: '80000', valyuta: 'SOM' },
    { nom: "O'rnatish", hisoblashUsuli: 'QATIY' as const, narx: '150000', valyuta: 'SOM' },
  ];

  it('asosiy + qo‘shimchalar = jami', () => {
    const n = pozitsiyaQoidaNarxi({
      qoida: QOIDA,
      eniM: 1.8,
      boyiM: 2.2,
      qoshimchalar: QOSHIMCHALAR,
      offset: null,
      kurs: KURS,
    });
    expect(n.olchov).toBeCloseTo(3.96, 4);
    expect(n.bosqich?.narx).toBe('3');
    expect(n.asosiy).toBe('148500.00');
    expect(n.qoshimchalar.map((q) => q.summa)).toEqual(['144000.00', '150000.00']);
    // 148 500 + 144 000 + 150 000
    expect(n.jami).toBe('442500.00');
  });

  it('qo‘shimchasiz — jami asosiyga teng', () => {
    const n = pozitsiyaQoidaNarxi({
      qoida: QOIDA,
      eniM: 1.8,
      boyiM: 2.2,
      qoshimchalar: [],
      offset: null,
      kurs: KURS,
    });
    expect(n.jami).toBe(n.asosiy);
  });

  /**
   * TZ 6.3 ning aynan o'sha qoidasi: offset MATOGA, aksessuarga emas.
   * O'rnatish haqiga chegirma berish alohida qaror bo'lishi kerak.
   */
  it('offset FAQAT asosiy narxga tushadi, qo‘shimchaga tegmaydi', () => {
    const n = pozitsiyaQoidaNarxi({
      qoida: QOIDA,
      eniM: 1.8,
      boyiM: 2.2,
      qoshimchalar: QOSHIMCHALAR,
      offset: { turi: 'FOIZ', foiz: -10 },
      kurs: KURS,
    });
    // 148 500 − 10% = 133 650; qo'shimchalar o'zgarmaydi
    expect(n.asosiy).toBe('133650.00');
    expect(n.qoshimchalar.map((q) => q.summa)).toEqual(['144000.00', '150000.00']);
    expect(n.jami).toBe('427650.00');
  });

  it('so‘mdagi offset ham asosiyga qo‘shiladi', () => {
    const n = pozitsiyaQoidaNarxi({
      qoida: QOIDA,
      eniM: 1.8,
      boyiM: 2.2,
      qoshimchalar: [],
      offset: { turi: 'SOM', summa: som('20000') },
      kurs: KURS,
    });
    expect(n.asosiy).toBe('168500.00');
  });

  it('dollardagi offset kurs bilan o‘giriladi', () => {
    const n = pozitsiyaQoidaNarxi({
      qoida: QOIDA,
      eniM: 1.8,
      boyiM: 2.2,
      qoshimchalar: [],
      offset: { turi: 'USD', summa: dollar('4') },
      kurs: KURS,
    });
    expect(n.asosiy).toBe('198500.00');
  });
});

describe('bosqichlarni tekshirish — admin ekranida', () => {
  it('egasining jadvali toza', () => {
    expect(bosqichlarniTekshir(EGASI_JADVALI)).toEqual([]);
  });

  it('bo‘sh ro‘yxat', () => {
    expect(bosqichlarniTekshir([])).toEqual([{ tur: 'BOSQICH_YOQ' }]);
  });

  it('noldan boshlanmasa — kichik o‘lchamga narx yo‘q', () => {
    const n = bosqichlarniTekshir([{ dan: 0.5, gacha: null, narx: '3', valyuta: 'SOM' }]);
    expect(n).toEqual([{ tur: 'BOSHLANISH', dan: 0.5 }]);
  });

  it('bo‘shliq — eng xavfli nuqson, faqat o‘sha oraliqda chiqadi', () => {
    const n = bosqichlarniTekshir([
      { dan: 0, gacha: 0.5, narx: '8', valyuta: 'SOM' },
      { dan: 1, gacha: null, narx: '3', valyuta: 'SOM' },
    ]);
    expect(n).toEqual([{ tur: 'BOSHLIQ', dan: 0.5, gacha: 1 }]);
  });

  it('ustma-ust tushgan bosqichlar', () => {
    const n = bosqichlarniTekshir([
      { dan: 0, gacha: 1, narx: '8', valyuta: 'SOM' },
      { dan: 0.5, gacha: null, narx: '3', valyuta: 'SOM' },
    ]);
    expect(n).toEqual([{ tur: 'USTMA_UST', dan: 0.5, gacha: 1 }]);
  });

  it('oxirgisi cheksiz emas — katta buyurtmaga narx yo‘q', () => {
    const n = bosqichlarniTekshir([{ dan: 0, gacha: 5, narx: '8', valyuta: 'SOM' }]);
    expect(n).toEqual([{ tur: 'CHEKSIZ_YOQ', gacha: 5 }]);
  });

  it('tartibsiz kiritilgan bosqichlar ham to‘g‘ri tekshiriladi', () => {
    const teskari = [...EGASI_JADVALI].reverse();
    expect(bosqichlarniTekshir(teskari)).toEqual([]);
  });
});

/**
 * Egasi (2026-09-20) bosqichlarni qo'lda kiritadi va stavka pasayishi
 * uning qarori bo'lishi mumkin. Shuning uchun bu BLOKLAMAYDI —
 * ekranda ko'rsatiladi.
 */
describe('chegarada narx tushishi — ogohlantirish, blok emas', () => {
  it('egasining jadvalida ikkala chegarada ham tushadi', () => {
    const o = chegaradaNarxTushadimi(QOIDA, KURS);
    expect(o).toHaveLength(2);
    // 0.5 kv.m: 8 $ × 0.5 = 4 $ = 50 000 → 5 $ × 0.5 = 2.5 $ = 31 250
    expect(o[0]).toEqual({ chegara: 0.5, oldin: '50000.00', keyin: '31250.00' });
    // 1 kv.m: 5 $ = 62 500 → 3 $ = 37 500
    expect(o[1]).toEqual({ chegara: 1, oldin: '62500.00', keyin: '37500.00' });
  });

  it('stavka o‘sib boradigan jadvalda ogohlantirish yo‘q', () => {
    const osuvchi: Qoida = {
      hisoblashUsuli: 'MAYDON',
      bosqichlar: [
        { dan: 0, gacha: 1, narx: '3', valyuta: 'SOM' },
        { dan: 1, gacha: null, narx: '5', valyuta: 'SOM' },
      ],
    };
    expect(chegaradaNarxTushadimi(osuvchi, null)).toEqual([]);
  });

  it('bitta bosqichda chegara ham yo‘q', () => {
    const yagona: Qoida = {
      hisoblashUsuli: 'MAYDON',
      bosqichlar: [{ dan: 0, gacha: null, narx: '3', valyuta: 'SOM' }],
    };
    expect(chegaradaNarxTushadimi(yagona, null)).toEqual([]);
  });
});

/**
 * MIQDOR BO'YICHA BOSQICH — egasi qarori 2026-09-22.
 *
 * ⚠️ Egasi: «ko'p olganga arzonroq beriladi — muni matoni qilgandek
 *    belgilab qo'yish orqali hal qilsa bo'ladi».
 *
 *    Karniz va donalab sotiladigan buyumda eni-bo'yi umuman
 *    kiritilmaydi, `DONA` usulida esa o'lchov DOIM 1 — ya'ni
 *    «10 metrdan ko'p olsa arzon» degan qoidani mavjud usullar
 *    bilan YOZIB BO'LMASDI.
 */
describe('MIQDOR — bosqich sotilayotgan miqdorga qarab tanlanadi', () => {
  /** Egasi misoli: 10 metrgacha 35 000, undan ko'p bo'lsa 32 000 */
  const KARNIZ: readonly Bosqich[] = [
    { dan: 0, gacha: 10, narx: '35000', valyuta: 'SOM' },
    { dan: 10, gacha: null, narx: '32000', valyuta: 'SOM' },
  ];
  const KARNIZ_QOIDASI: Qoida = { hisoblashUsuli: 'MIQDOR', bosqichlar: KARNIZ };

  it("o'lchov — miqdorning o'zi", () => {
    expect(olchovi('MIQDOR', 0, 0, 7)).toBe(7);
    expect(olchovi('MIQDOR', 0, 0, 2.5)).toBe(2.5);
  });

  it("o'lcham E'TIBORGA OLINMAYDI — karnizda u umuman yo‘q", () => {
    expect(olchovi('MIQDOR', 0, 0, 4)).toBe(4);
    expect(olchovi('MIQDOR', 99, 99, 4)).toBe(4);
  });

  it('miqdor berilmasa 1 — eski chaqiruvlar buzilmaydi', () => {
    expect(olchovi('MIQDOR', 0, 0)).toBe(1);
  });

  it('miqdor nol yoki manfiy bo‘lsa XATO — bepulga ketmasin', () => {
    expect(() => olchovi('MIQDOR', 0, 0, 0)).toThrow(BiznesXato);
    expect(() => olchovi('MIQDOR', 0, 0, -3)).toThrow(BiznesXato);
  });

  it('7 metr — birinchi bosqich: 7 × 35 000 = 245 000', () => {
    expect(qoidaNarxi(KARNIZ_QOIDASI, 0, 0, null, 7)).toEqual(som('245000'));
  });

  it('⚠️ 20 metr — arzon bosqich: 20 × 32 000 = 640 000', () => {
    expect(qoidaNarxi(KARNIZ_QOIDASI, 0, 0, null, 20)).toEqual(som('640000'));
  });

  it('AYNAN 10 metr keyingi bosqichga tushadi — [dan, gacha)', () => {
    expect(qoidaNarxi(KARNIZ_QOIDASI, 0, 0, null, 10)).toEqual(som('320000'));
  });

  it("ko'p olgan KAM olgandan arzonga tushmaydi — jami baribir ortadi", () => {
    const on = Number(pulMatn(qoidaNarxi(KARNIZ_QOIDASI, 0, 0, null, 10)));
    const toqqiz = Number(pulMatn(qoidaNarxi(KARNIZ_QOIDASI, 0, 0, null, 9)));
    expect(on).toBeGreaterThan(toqqiz);
  });

  it('pozitsiya narxi ham miqdorni oladi', () => {
    const n = pozitsiyaQoidaNarxi({
      qoida: KARNIZ_QOIDASI,
      eniM: 0,
      boyiM: 0,
      miqdor: 20,
      qoshimchalar: [],
      offset: null,
      kurs: null,
    });

    expect(n.olchov).toBe(20);
    expect(n.bosqich?.narx).toBe('32000');
    expect(n.jami).toBe('640000.00');
  });

  it('DONA usuliga TEGILMAGAN — o‘lchov doim 1', () => {
    expect(olchovi('DONA', 0, 0, 50)).toBe(1);
  });
});
