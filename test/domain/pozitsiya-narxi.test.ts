/**
 * test/domain/pozitsiya-narxi.test.ts — TZ 3.5 · 3.6 · 3.7 · 3.8 · 4.7 · 6.3
 *
 * ⚠️ NARX MODELI 2026-09-20 DA O'ZGARDI
 *
 *    Ilgari narx MATERIALLARDAN yig'ilardi va bu testlar o'sha
 *    yig'indini tekshirardi. Egasi modelni rad etdi: narx endi
 *    tur × mato darajasi jadvalidan keladi.
 *
 *    Shuning uchun bu yerda ikki narsa ALOHIDA sinaladi:
 *
 *      sarf           qaysi materialdan qancha — NARXSIZ
 *      narxQatorlari  mijoz qancha to'laydi
 *
 *    Ilgari ular bitta ro'yxat edi va aynan shu chalkashlik narxni
 *    materialga bog'lab qo'ygandi.
 */

import { describe, expect, it } from 'vitest';
import {
  pozitsiyaNarxiniHisobla,
  type NarxKirishi,
} from '@/lib/domain/pozitsiya-narxi';
import type { Qoida } from '@/lib/domain/narx-qoidasi';
import { dollar, kurs, som } from '@/lib/domain/pul';

/** «1 kv.m gacha 150 000, undan katta 120 000» */
const QOIDA: Qoida = {
  hisoblashUsuli: 'MAYDON',
  bosqichlar: [
    { dan: 0, gacha: 1, narx: '150000', valyuta: 'SOM' },
    { dan: 1, gacha: null, narx: '120000', valyuta: 'SOM' },
  ],
};

/** Rollo 210 × 140 = 2.94 kv.m — kanonik o'lcham (K-03) */
const ASOS: NarxKirishi = {
  eniM: 2.1,
  boyiM: 1.4,
  soni: 1,
  parametrlar: {},
  slotlar: [
    { nom: 'Mato', formula: 'MAYDON', sarflashBirligi: 'KV_M', majburiy: true } as never,
  ],
  aksessuarlar: [
    { nom: 'Kronshteyn', formula: '2', sarflashBirligi: 'DONA', majburiy: true },
  ],
  qoida: QOIDA,
  qoshimchalar: [],
  offset: null,
  kurs: null,
  xizmatHaqi: null,
};

describe('sarf — NARXSIZ ro‘yxat (egasi qarori 2026-09-20)', () => {
  it('mato va aksessuar miqdori chiqadi, narxi YO‘Q', () => {
    const n = pozitsiyaNarxiniHisobla(ASOS);

    expect(n.sarf).toHaveLength(2);
    expect(n.sarf[0]).toEqual({
      nom: 'Mato',
      miqdor: 2.94,
      sarflashBirligi: 'KV_M',
      matomi: true,
    });
    expect(n.sarf[1]).toEqual({
      nom: 'Kronshteyn',
      miqdor: 2,
      sarflashBirligi: 'DONA',
      matomi: false,
    });

    /** ⚠️ Qatorda `narx` yoki `summa` MAYDONI BO'LMASLIGI kerak */
    expect(Object.keys(n.sarf[0] as object).sort()).toEqual([
      'matomi',
      'miqdor',
      'nom',
      'sarflashBirligi',
    ]);
  });

  it('TZ 3.6 — sotuvchi tuzatgan miqdor ombor uchun ustun', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...ASOS,
      slotlar: [{ ...(ASOS.slotlar[0] as object), tuzatilganMiqdor: 3.5 } as never],
    });
    expect(n.sarf[0]?.miqdor).toBe(3.5);
  });

  it('TZ 3.7 — qo‘lda kiritilgan aksessuar soni formulani USTIDAN YOZMAYDI', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...ASOS,
      aksessuarlar: [{ ...(ASOS.aksessuarlar[0] as object), qoldaSoni: 5 } as never],
    });
    expect(n.sarf[1]?.miqdor).toBe(5);
  });

  /**
   * ⚠️ Narx qoidasi yo'q bo'lsa ham sarf TO'LA chiqadi: sotuvchi
   *    qaysi materialdan qancha ketishini baribir ko'radi.
   */
  it('narx qo‘yilmagan bo‘lsa ham sarf ro‘yxati to‘la', () => {
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, qoida: null });
    expect(n.sarf).toHaveLength(2);
    expect(n.jami).toBeNull();
  });
});

describe('narx — tur × mato darajasi jadvalidan', () => {
  it('2.94 kv.m «1 dan katta» bosqichiga tushadi: 2.94 × 120 000', () => {
    const n = pozitsiyaNarxiniHisobla(ASOS);
    expect(n.olchov).toBeCloseTo(2.94, 4);
    expect(n.bosqich?.narx).toBe('120000');
    expect(n.jami).toBe('352800.00');
  });

  it('kichik o‘lcham qimmatroq bosqichga tushadi', () => {
    // 60 × 80 = 0.48 kv.m → «1 gacha» → 150 000
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, eniM: 0.6, boyiM: 0.8 });
    expect(n.bosqich?.narx).toBe('150000');
    expect(n.jami).toBe('72000.00');
  });

  /**
   * ⚠️ ENG MUHIM TEKSHIRUV — narx endi materialga BOG'LIQ EMAS.
   *    Slot va aksessuar butunlay o'zgarsa ham jami o'zgarmasligi
   *    kerak: ilgari bu raqamni aynan ular belgilardi.
   */
  it('material o‘zgarsa narx O‘ZGARMAYDI', () => {
    const a = pozitsiyaNarxiniHisobla(ASOS);
    const b = pozitsiyaNarxiniHisobla({
      ...ASOS,
      slotlar: [
        { nom: 'Boshqa mato', formula: 'MAYDON * 3', sarflashBirligi: 'KV_M' } as never,
      ],
      aksessuarlar: [
        { nom: 'Boshqa aksessuar', formula: '99', sarflashBirligi: 'DONA', majburiy: true },
      ],
    });

    expect(b.jami).toBe(a.jami);
    // Sarf esa o'zgargan bo'lishi kerak
    expect(b.sarf[0]?.miqdor).not.toBe(a.sarf[0]?.miqdor);
  });

  it('narx qo‘yilmagan bo‘lsa jami NULL va sabab aytiladi', () => {
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, qoida: null });
    expect(n.jami).toBeNull();
    expect(n.xato).toContain("narx qo'yilmagan");
  });

  it('o‘lchamga bosqich topilmasa ham jami NULL — bepulga sotilmaydi', () => {
    const teshik: Qoida = {
      hisoblashUsuli: 'MAYDON',
      bosqichlar: [{ dan: 5, gacha: null, narx: '120000', valyuta: 'SOM' }],
    };
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, qoida: teshik });
    expect(n.jami).toBeNull();
    expect(n.xato).not.toBeNull();
  });
});

describe('qo‘shimchalar — TZ 3.8', () => {
  const BILAN: NarxKirishi = {
    ...ASOS,
    qoshimchalar: [
      { nom: 'Usti shabalik', hisoblashUsuli: 'ENI', narx: '80000', valyuta: 'SOM' },
      { nom: "O'rnatish", hisoblashUsuli: 'QATIY', narx: '150000', valyuta: 'SOM' },
    ],
  };

  it('asosiy + qo‘shimchalar alohida qator bo‘lib chiqadi', () => {
    const n = pozitsiyaNarxiniHisobla(BILAN);
    expect(n.narxQatorlari).toEqual([
      { nom: 'Asosiy narx', summa: '352800.00' },
      { nom: 'Usti shabalik', summa: '168000.00' },
      { nom: "O'rnatish", summa: '150000.00' },
    ]);
    // 352 800 + 168 000 + 150 000
    expect(n.jami).toBe('670800.00');
  });

  it('tanlanmagan qo‘shimcha jamiga kirmaydi', () => {
    expect(pozitsiyaNarxiniHisobla(ASOS).jami).toBe('352800.00');
  });
});

describe('TZ 4.7 — xizmat haqi', () => {
  it('alohida qator bo‘lib jamiga qo‘shiladi', () => {
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, xizmatHaqi: '50000' });
    expect(n.narxQatorlari.at(-1)).toEqual({ nom: 'Xizmat haqi', summa: '50000.00' });
    expect(n.jami).toBe('402800.00');
  });

  it('nol xizmat haqi qator YASAMAYDI — «0 so‘m» yozilmaydi', () => {
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, xizmatHaqi: '0' });
    expect(n.narxQatorlari).toHaveLength(1);
  });
});

/**
 * TZ 6.3 — offset MATOGA qo'llanadi, aksessuarga tegmaydi.
 * Yangi modelda buning ma'nosi: ASOSIY narxga tushadi, qo'shimchaga emas.
 * O'rnatish haqiga chegirma berish alohida qaror bo'lishi kerak.
 */
describe('TZ 6.3 — offset faqat asosiy narxga', () => {
  it('−10% asosiyni arzonlashtiradi, qo‘shimcha o‘zgarmaydi', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...ASOS,
      qoshimchalar: [
        { nom: "O'rnatish", hisoblashUsuli: 'QATIY', narx: '150000', valyuta: 'SOM' },
      ],
      offset: { turi: 'FOIZ', foiz: -10 },
    });
    expect(n.narxQatorlari[0]?.summa).toBe('317520.00'); // 352 800 − 10%
    expect(n.narxQatorlari[1]?.summa).toBe('150000.00');
    expect(n.jami).toBe('467520.00');
  });

  it('offsetsiz narx o‘zgarmaydi', () => {
    expect(pozitsiyaNarxiniHisobla({ ...ASOS, offset: null }).jami).toBe('352800.00');
  });

  it('so‘mdagi offset qo‘shiladi', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...ASOS,
      offset: { turi: 'SOM', summa: som('20000') },
    });
    expect(n.jami).toBe('372800.00');
  });
});

describe('valyuta — TZ 5.4', () => {
  const KURS = kurs(12_500, new Date('2026-09-20'), 'JORIY');
  const DOLLARDA: Qoida = {
    hisoblashUsuli: 'MAYDON',
    bosqichlar: [{ dan: 0, gacha: null, narx: '10', valyuta: 'USD' }],
  };

  it('dollardagi bosqich kurs bilan so‘mga o‘giriladi', () => {
    // 2.94 × 10 $ = 29.4 $ × 12 500 = 367 500
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, qoida: DOLLARDA, kurs: KURS });
    expect(n.jami).toBe('367500.00');
  });

  /**
   * ⚠️ Kurs yo'q bo'lsa jimgina so'm deb olish narxni MING BAROBAR
   *    kamaytirardi. Sotuvchi xatoni ko'rgani ancha yaxshi.
   */
  it('kurssiz dollar narxi XATO beradi, jim so‘m deb olinmaydi', () => {
    const n = pozitsiyaNarxiniHisobla({ ...ASOS, qoida: DOLLARDA, kurs: null });
    expect(n.jami).toBeNull();
    expect(n.xato).not.toBeNull();
  });

  it('dollardagi offset ham kurs bilan o‘giriladi', () => {
    const n = pozitsiyaNarxiniHisobla({
      ...ASOS,
      offset: { turi: 'USD', summa: dollar('4') },
      kurs: KURS,
    });
    expect(n.jami).toBe('402800.00'); // 352 800 + 50 000
  });
});
