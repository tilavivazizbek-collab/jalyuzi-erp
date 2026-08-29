/**
 * TZ 7.11 — ombor harakatining nomi va miqdori.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * Nom va miqdor ilgari sahifa ichida turardi. «Ombor tarixi»
 * ekrani qo'shilganda ikkinchi nusxa paydo bo'lishi mumkin edi —
 * va vaqt o'tib ikki ekran bir harakatni ikki xil atay boshlardi.
 * Endi ikkalasi shu moduldan oladi, test esa qoidalarni qotiradi.
 */
import { describe, expect, it } from 'vitest';
import {
  HARAKAT_TURLARI,
  harakatNomi,
  miqdorMatni,
  yonalish,
} from '@/lib/domain/ombor-harakat';

const BOSH = { miqdorKvM: null, miqdorSm: null, miqdorDona: null };

describe('Harakat nomi', () => {
  it('har turning o‘zbekcha nomi bor', () => {
    for (const t of HARAKAT_TURLARI) {
      const n = harakatNomi(t);
      expect(n).not.toBe('');
      /** Kod emas, odam o'qiydigan nom bo'lishi shart */
      expect(n).not.toBe(t);
    }
  });

  it("noma'lum tur kodi bilan ko'rsatiladi — teshik yashirilmaydi", () => {
    expect(harakatNomi('YANGI_TUR')).toBe('YANGI_TUR');
  });
});

describe('Miqdor ko‘rinishi', () => {
  it('kv.m — to‘rt xona', () => {
    expect(miqdorMatni({ ...BOSH, miqdorKvM: 3.6 })).toBe('3.6000 kv.m');
  });

  it('Q-01 — sm bazada, metr ekranda', () => {
    expect(miqdorMatni({ ...BOSH, miqdorSm: 210 })).toBe('2.10 m');
  });

  it('dona — butun son', () => {
    expect(miqdorMatni({ ...BOSH, miqdorDona: 4 })).toBe('4 dona');
  });

  it('chiqim manfiy holicha ko‘rsatiladi', () => {
    expect(miqdorMatni({ ...BOSH, miqdorKvM: -1.2 })).toBe('-1.2000 kv.m');
    expect(miqdorMatni({ ...BOSH, miqdorSm: -350 })).toBe('-3.50 m');
  });

  it("o'lchovsiz yozuv — chiziqcha", () => {
    expect(miqdorMatni(BOSH)).toBe('—');
  });
});

describe('Yo‘nalish', () => {
  it('musbat — ombor to‘ldi', () => {
    expect(yonalish({ ...BOSH, miqdorKvM: 12 })).toBe('KIRDI');
    expect(yonalish({ ...BOSH, miqdorDona: 3 })).toBe('KIRDI');
  });

  it('manfiy — ombordan chiqdi', () => {
    expect(yonalish({ ...BOSH, miqdorSm: -100 })).toBe('CHIQDI');
  });

  it('nol — sanoq farq chiqarmadi', () => {
    expect(yonalish({ ...BOSH, miqdorKvM: 0 })).toBe('NOL');
    expect(yonalish(BOSH)).toBe('NOL');
  });
});

/**
 * ⚠️ Ro'yxat BAZADAGI CHECK bilan mos bo'lishi shart.
 *
 *    Bazaga yangi tur qo'shilib bu ro'yxat unutilsa, ekranda
 *    kod ko'rinadi va filtrda o'sha tur umuman yo'q bo'ladi.
 *    Teskarisi ham xavfli: ro'yxatda bor, bazada yo'q turni
 *    filtrdan tanlash mumkin bo'ladi va hech qachon natija
 *    bermaydi.
 */
describe('Ro‘yxat baza CHECK bilan mos', () => {
  it("ombor_harakat_turi — ikkala ro'yxat bir xil", async () => {
    const fs = await import('node:fs/promises');
    const manba = await fs.readFile('lib/db/schema/ombor.ts', 'utf-8');

    const boshi = manba.indexOf("'ombor_harakat_turi'");
    expect(boshi, 'CHECK topilmadi — nomi o‘zgarganmi?').toBeGreaterThan(-1);

    const parcha = manba.slice(boshi, manba.indexOf('),', boshi));
    const bazadagi = [...parcha.matchAll(/'([A-Z_]+)'/g)]
      .map((m) => m[1])
      .filter((t) => t !== 'ombor_harakat_turi');

    expect([...bazadagi].sort()).toEqual([...HARAKAT_TURLARI].sort());
  });
});
