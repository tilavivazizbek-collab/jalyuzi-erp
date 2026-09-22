/**
 * test/domain/tanlov.test.ts — egasi holatlari 2026-09-22
 *
 * ⚠️ Bu yerdagi holatlar EGASI SANAB BERGAN vaziyatlar. Har biri
 *    ilgari «ikki alohida tur qiling» degan javob olgan edi.
 *
 * ⚠️ Xato ikki tomonga qimmat: tanlov sarfga tegmay qolsa mato
 *    noto'g'ri hisoblanadi; ortiqcha tegsa to'g'ri buyurtma
 *    rad etiladi.
 */

import { describe, expect, it } from 'vitest';
import {
  aksessuarKeraklimi,
  birikkanKodmi,
  kodTakrorlanganmi,
  tanlovMatni,
  tanlovNuqsonlari,
  tanlovQiymatlari,
  tanlovYuki,
  variantniTop,
  yetishmaganTanlovlar,
  yoqolganKodlar,
  type Tanlov,
} from '@/lib/domain/tanlov';

/** 1-daraja: faqat yozuv. Zanjir chapdanmi yoki o'ngdan */
const BOSHQARUV: Tanlov = {
  id: 1,
  kod: null,
  nom: 'Boshqaruv tomoni',
  majburiy: true,
  variantlar: [
    { id: 11, nom: 'Chap', qiymat: null, narx: null },
    { id: 12, nom: "O'ng", qiymat: null, narx: null },
  ],
};

/** 2-daraja: narxga qo'shadi */
const KASSETA: Tanlov = {
  id: 2,
  kod: null,
  nom: 'Kasseta',
  majburiy: false,
  variantlar: [
    { id: 21, nom: "Yo'q", qiymat: null, narx: null },
    { id: 22, nom: 'Bor', qiymat: null, narx: '50000' },
  ],
};

/** 3-daraja: formulaga son beradi */
const LAMEL: Tanlov = {
  id: 3,
  kod: 'LAMEL_ENI',
  nom: 'Lamel eni',
  majburiy: true,
  variantlar: [
    { id: 31, nom: '89 mm', qiymat: 0.089, narx: null },
    { id: 32, nom: '127 mm', qiymat: 0.127, narx: null },
  ],
};

/** Egasining dikkey holati: ochilish tasma soniga ta'sir qiladi */
const OCHILISH: Tanlov = {
  id: 4,
  kod: 'QOSHIMCHA_TASMA',
  nom: 'Ochilish',
  majburiy: true,
  variantlar: [
    { id: 41, nom: 'Bir tomonga', qiymat: 0, narx: null },
    { id: 42, nom: 'Markazdan', qiymat: -1, narx: null },
  ],
};

const HAMMASI = [BOSHQARUV, KASSETA, LAMEL, OCHILISH];

describe('Majburiy tanlov', () => {
  it('EC-TANL-01: tanlanmagan majburiylar RO‘YXAT bo‘lib qaytadi', () => {
    expect(yetishmaganTanlovlar(HAMMASI, {})).toEqual([
      'Boshqaruv tomoni',
      'Lamel eni',
      'Ochilish',
    ]);
  });

  it('EC-TANL-02: ixtiyoriy tanlov yetishmaydiganlar ichida yo‘q', () => {
    const q = { 1: 12, 3: 31, 4: 41 };
    expect(yetishmaganTanlovlar(HAMMASI, q)).toEqual([]);
  });
});

describe('1-daraja — faqat yozuv', () => {
  it('EC-TANL-03: yozuv ustaga TANLOV NOMI bilan boradi', () => {
    const yuk = tanlovYuki([BOSHQARUV, KASSETA], { 1: 12, 2: 22 });
    expect(tanlovMatni(yuk)).toBe("Boshqaruv tomoni: O'ng · Kasseta: Bor");
  });

  /**
   * ⚠️ «O'ng» degan yolg'iz so'z ustaga hech narsa aytmaydi —
   *    o'ng tomoni nimaning?
   */
  it('EC-TANL-04: variant nomi YOLG‘IZ yozilmaydi', () => {
    const yuk = tanlovYuki([BOSHQARUV], { 1: 11 });
    expect(tanlovMatni(yuk)).toContain('Boshqaruv tomoni');
  });

  it('EC-TANL-05: tanlanmagan tanlov yukka tushmaydi', () => {
    expect(tanlovYuki(HAMMASI, {})).toEqual([]);
  });
});

describe('2-daraja — narx', () => {
  it('EC-TANL-06: variant narxi yukda qotadi', () => {
    const yuk = tanlovYuki([KASSETA], { 2: 22 });
    expect(yuk[0]?.narx).toBe('50000');
  });

  it('EC-TANL-07: narxsiz variant narxga tegmaydi', () => {
    const yuk = tanlovYuki([KASSETA], { 2: 21 });
    expect(yuk[0]?.narx).toBeNull();
  });

  /**
   * ⚠️ NOM SNAPSHOT — admin keyin variantni o'chirsa ham eski
   *    buyurtmada o'sha kungi nom turadi (2.3-invariant).
   */
  it('EC-TANL-08: yukda NOM ham qotadi, faqat id emas', () => {
    const yuk = tanlovYuki([KASSETA], { 2: 22 });
    expect(yuk[0]?.tanlovNomi).toBe('Kasseta');
    expect(yuk[0]?.variantNomi).toBe('Bor');
  });
});

describe('3-daraja — formulaga son', () => {
  it('EC-TANL-09: tanlov kodi formula o‘zgaruvchisiga aylanadi', () => {
    expect(tanlovQiymatlari(HAMMASI, { 3: 32, 4: 42 })).toEqual({
      LAMEL_ENI: 0.127,
      QOSHIMCHA_TASMA: -1,
    });
  });

  it('EC-TANL-10: 127 mm o‘rniga 89 mm tanlansa son o‘zgaradi', () => {
    expect(tanlovQiymatlari([LAMEL], { 3: 31 })).toEqual({ LAMEL_ENI: 0.089 });
  });

  /** ⚠️ Kodsiz tanlov formulaga UMUMAN bormaydi */
  it('EC-TANL-11: kodsiz tanlov formulaga tushmaydi', () => {
    expect(tanlovQiymatlari([BOSHQARUV, KASSETA], { 1: 11, 2: 22 })).toEqual({});
  });

  /**
   * ⚠️ NOL ham QIYMAT. «Bir tomonga» variantida qo'shimcha tasma 0 —
   *    agar nol «yo'q» deb qaralsa, formula noma'lum o'zgaruvchi
   *    xatosini berardi.
   */
  it('EC-TANL-12: qiymat NOL bo‘lsa ham formulaga tushadi', () => {
    expect(tanlovQiymatlari([OCHILISH], { 4: 41 })).toEqual({ QOSHIMCHA_TASMA: 0 });
  });

  it('EC-TANL-13: tanlanmagan bo‘lsa JIM o‘tkaziladi, xato otilmaydi', () => {
    expect(() => tanlovQiymatlari(HAMMASI, {})).not.toThrow();
    expect(tanlovQiymatlari(HAMMASI, {})).toEqual({});
  });
});

describe('Aksessuarni variantga bog‘lash', () => {
  /**
   * ⚠️ EGASINING HOLATI: motorli jalyuzida zanjir qo'shilmaydi,
   *    kabel va quvvat manbai qo'shiladi.
   */
  it('EC-TANL-14: variantga bog‘lanmagan aksessuar DOIM kerak', () => {
    expect(aksessuarKeraklimi(null, {})).toBe(true);
    expect(aksessuarKeraklimi(null, { 1: 11 })).toBe(true);
  });

  it('EC-TANL-15: variantga bog‘langan aksessuar faqat o‘shanda', () => {
    /** 42 = «Markazdan» */
    expect(aksessuarKeraklimi(42, { 4: 42 })).toBe(true);
    expect(aksessuarKeraklimi(42, { 4: 41 })).toBe(false);
    expect(aksessuarKeraklimi(42, {})).toBe(false);
  });
});

describe('Admin ekrani — saqlashdan oldingi tekshiruv', () => {
  it('EC-TANL-16: bitta variantli tanlov rad etiladi', () => {
    const yomon: Tanlov = {
      ...BOSHQARUV,
      variantlar: [{ id: 11, nom: 'Chap', qiymat: null, narx: null }],
    };
    expect(tanlovNuqsonlari(yomon)).toHaveLength(1);
  });

  it('EC-TANL-17: noto‘g‘ri shakldagi kod rad etiladi', () => {
    expect(tanlovNuqsonlari({ ...LAMEL, kod: 'lamel eni' })).not.toHaveLength(0);
    expect(tanlovNuqsonlari({ ...LAMEL, kod: '1LAMEL' })).not.toHaveLength(0);
  });

  /**
   * ⚠️ Kod bor, son yo'q → formula «noma'lum o'zgaruvchi» beradi va
   *    SOTUV TO'XTAYDI. Saqlashda ushlanadi.
   */
  it('EC-TANL-18: kod bor, lekin birorta variantda son yo‘q — rad', () => {
    const yomon: Tanlov = {
      ...LAMEL,
      variantlar: LAMEL.variantlar.map((v) => ({ ...v, qiymat: null })),
    };
    expect(tanlovNuqsonlari(yomon).join(' ')).toContain('son');
  });

  it('EC-TANL-19: takrorlangan variant nomi rad etiladi', () => {
    const yomon: Tanlov = {
      ...BOSHQARUV,
      variantlar: [
        { id: 11, nom: 'Chap', qiymat: null, narx: null },
        { id: 12, nom: 'chap', qiymat: null, narx: null },
      ],
    };
    expect(tanlovNuqsonlari(yomon).join(' ')).toContain('takrorlanmasin');
  });

  it('EC-TANL-20: to‘g‘ri tanlovda nuqson yo‘q', () => {
    for (const t of HAMMASI) expect(tanlovNuqsonlari(t)).toEqual([]);
  });
});

describe('Kod to‘qnashuvlari', () => {
  /**
   * ⚠️ ENG XAVFLISI: admin tanlovga `ENI` kodini qo'ysa, formula
   *    oynaning enini emas, tanlovning sonini olardi. Hamma hisob
   *    JIMGINA buzilardi.
   */
  it('EC-TANL-21: tizim o‘zgaruvchilari band', () => {
    expect(birikkanKodmi('ENI')).toBe(true);
    expect(birikkanKodmi("BO'YI")).toBe(true);
    expect(birikkanKodmi('MAYDON')).toBe(true);
    expect(birikkanKodmi('SONI')).toBe(true);
    expect(birikkanKodmi('LAMEL_ENI')).toBe(false);
  });

  it('EC-TANL-22: tanlov va parametr kodi takrorlanmasin', () => {
    expect(kodTakrorlanganmi([LAMEL], ['LAMEL_ENI'])).toBe('LAMEL_ENI');
    expect(kodTakrorlanganmi([LAMEL], ['CHET'])).toBeNull();
  });

  /**
   * ⚠️ Admin `CEIL(ENI / LAMEL_ENI)` yozib, keyin «Lamel eni»
   *    tanlovini o'chirsa — formula buziladi va buni faqat
   *    sotuvchi mijoz oldida bilardi.
   */
  it('EC-TANL-23: formulada ishlatilgan yo‘q kod topiladi', () => {
    expect(yoqolganKodlar(['ENI', 'LAMEL_ENI'], [LAMEL], [])).toEqual([]);
    expect(yoqolganKodlar(['ENI', 'LAMEL_ENI'], [], [])).toEqual(['LAMEL_ENI']);
    expect(yoqolganKodlar(['CHET'], [], ['CHET'])).toEqual([]);
  });
});

describe('variantniTop', () => {
  it('EC-TANL-24: tanlanmagan yoki yo‘q variant — null', () => {
    expect(variantniTop(LAMEL, {})).toBeNull();
    expect(variantniTop(LAMEL, { 3: 999 })).toBeNull();
    expect(variantniTop(LAMEL, { 3: 32 })?.nom).toBe('127 mm');
  });
});
