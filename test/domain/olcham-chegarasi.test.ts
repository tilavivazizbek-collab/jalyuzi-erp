/**
 * test/domain/olcham-chegarasi.test.ts — egasi qarori 2026-09-22
 *
 * ⚠️ Bu yerdagi xato IKKI TOMONGA ham qimmat:
 *
 *    juda bo'sh  → 4 metrli rulon qabul qilinadi, mato va usta
 *                  vaqti kuyadi, mijozga pul qaytariladi
 *    juda qattiq → to'g'ri buyurtma rad etiladi va mijoz ketadi
 *
 *    Shuning uchun chegaraning O'ZI o'tishi alohida tekshiriladi.
 */

import { describe, expect, it } from 'vitest';
import {
  chegaraXabari,
  chegaralarMantiqiymi,
  olchamniTekshir,
  type OlchamChegarasi,
} from '@/lib/domain/olcham-chegarasi';
import { mahsulotTurSxema } from '@/lib/sxema/konstruktor';

/** Rulon uchun odatiy chegaralar — `docs/JALYUZI-TURLARI.md` ruhida */
const RULON: OlchamChegarasi = {
  minEniM: 0.3,
  maksEniM: 2.8,
  minBoyiM: 0.3,
  maksBoyiM: 3,
};

const CHEGARASIZ: OlchamChegarasi = {
  minEniM: null,
  maksEniM: null,
  minBoyiM: null,
  maksBoyiM: null,
};

describe('olchamniTekshir', () => {
  it('EC-OLCH-01: chegara ichidagi o‘lcham o‘tadi', () => {
    expect(olchamniTekshir(RULON, 1.8, 2.2)).toEqual([]);
  });

  /**
   * ⚠️ EGASINING HOLATI: chegara qo'yilmagan tur avvalgidek
   *    ishlayveradi. Bu shart — egasi turlarni bittalab to'ldiradi
   *    va to'ldirilmagani ishdan to'xtamasligi kerak.
   */
  it('EC-OLCH-02: chegara qo‘yilmagan bo‘lsa HECH NARSA tekshirilmaydi', () => {
    expect(olchamniTekshir(CHEGARASIZ, 4, 9)).toEqual([]);
    expect(olchamniTekshir(CHEGARASIZ, 0.01, 0.01)).toEqual([]);
  });

  it('EC-OLCH-03: 4 metrli rulon TO‘XTATILADI', () => {
    const n = olchamniTekshir(RULON, 4, 2.2);
    expect(n).toHaveLength(1);
    expect(n[0]?.tur).toBe('ENI_KATTA');
    expect(n[0]?.chegara).toBe(2.8);
    expect(n[0]?.qiymat).toBe(4);
  });

  it('EC-OLCH-04: juda tor parda ham to‘xtatiladi', () => {
    expect(olchamniTekshir(RULON, 0.15, 2)[0]?.tur).toBe('ENI_KICHIK');
  });

  /**
   * ⚠️ IKKALASI BIRDAN ko'rsatiladi: bittalab aytilsa sotuvchi
   *    o'lchamni ikki marta tuzatib, ikki marta xato oladi.
   */
  it('EC-OLCH-05: eni ham, bo‘yi ham noto‘g‘ri bo‘lsa IKKALASI aytiladi', () => {
    const n = olchamniTekshir(RULON, 4, 5);
    expect(n.map((x) => x.tur)).toEqual(['ENI_KATTA', 'BOYI_KATTA']);
  });

  /**
   * ⚠️ CHEGARANING O'ZI O'TADI. Sohada «eng katta eni 2.80» degani
   *    2.80 m li parda QILINADI degani. Qat'iy `<` bo'lsa aynan
   *    chegaradagi buyurtma rad etilardi va sotuvchi sababini
   *    tushunmasdi.
   */
  it('EC-OLCH-06: aynan chegaradagi o‘lcham O‘TADI', () => {
    expect(olchamniTekshir(RULON, 2.8, 3)).toEqual([]);
    expect(olchamniTekshir(RULON, 0.3, 0.3)).toEqual([]);
  });

  it('EC-OLCH-07: chegaradan bir santimetr oshsa to‘xtaydi', () => {
    expect(olchamniTekshir(RULON, 2.81, 3)).toHaveLength(1);
  });

  it('EC-OLCH-08: faqat bittasi qo‘yilgan bo‘lsa faqat o‘sha ishlaydi', () => {
    const faqatMaksEni: OlchamChegarasi = { ...CHEGARASIZ, maksEniM: 2.8 };
    expect(olchamniTekshir(faqatMaksEni, 2.9, 99)).toHaveLength(1);
    expect(olchamniTekshir(faqatMaksEni, 2.7, 99)).toEqual([]);
  });
});

describe('chegaraXabari', () => {
  it('EC-OLCH-09: xabar chegarani ham, yozilganini ham aytadi', () => {
    const n = olchamniTekshir(RULON, 4, 2.2)[0];
    const x = n === undefined ? '' : chegaraXabari(n, 'Rulon');
    expect(x).toContain('Rulon');
    expect(x).toContain('2.80 m');
    expect(x).toContain('4.00 m');
  });
});

describe('chegaralarMantiqiymi', () => {
  it('EC-OLCH-10: to‘g‘ri chegaralarda xato yo‘q', () => {
    expect(chegaralarMantiqiymi(RULON)).toEqual([]);
    expect(chegaralarMantiqiymi(CHEGARASIZ)).toEqual([]);
  });

  /**
   * ⚠️ Bunday tur HECH QACHON sotilmasdi va sababi faqat birinchi
   *    mijoz oldida ma'lum bo'lardi. Saqlashdan oldin aytiladi.
   */
  it('EC-OLCH-11: teskari chegara SAQLASHDAN OLDIN ushlanadi', () => {
    const teskari: OlchamChegarasi = { ...CHEGARASIZ, minEniM: 2.5, maksEniM: 2 };
    expect(chegaralarMantiqiymi(teskari)).toHaveLength(1);
  });

  it('EC-OLCH-12: bo‘yi bo‘yicha teskari chegara ham ushlanadi', () => {
    const teskari: OlchamChegarasi = { ...CHEGARASIZ, minBoyiM: 4, maksBoyiM: 3 };
    expect(chegaralarMantiqiymi(teskari)[0]).toContain("bo'yi");
  });
});

// ─── Sxema darajasida — teskari chegara saqlanmaydi ──────────────────────

describe('mahsulotTurSxema — o‘lcham chegarasi (0051)', () => {
  /**
   * ⚠️ Eng kichik YAROQLI tur: kamida bitta slot shart, belgilar
   *    esa `boolean` (forma ularni `'on'` dan o'girib beradi).
   */
  const asos = {
    nom: 'Rulon',
    xizmatHaqi: '',
    tartib: '0',
    oynadaKorinadi: true,
    botdaKorinadi: true,
    slotlar: [
      {
        nom: 'Mato',
        formula: 'MAYDON',
        majburiy: true,
        almashtirishGuruhId: null,
        koeffitsient: 1,
        kesishTuri: 'ENIGA',
        kesimEniM: '',
      },
    ],
    parametrlar: [],
    aksessuarlar: [],
  };

  it('EC-OLCH-13: bo‘sh chegara o‘tadi — «chegara yo‘q» degani', () => {
    const r = mahsulotTurSxema.safeParse({
      ...asos,
      minEniM: '',
      maksEniM: '',
      minBoyiM: '',
      maksBoyiM: '',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.maksEniM).toBeNull();
  });

  it('EC-OLCH-14: to‘g‘ri chegara o‘tadi', () => {
    const r = mahsulotTurSxema.safeParse({ ...asos, minEniM: '0.3', maksEniM: '2.8' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.maksEniM).toBe(2.8);
  });

  /**
   * ⚠️ Bunday tur HECH QACHON sotilmasdi. Bazada ham CHECK bor,
   *    lekin u xom xato beradi — bu yerda tushunarli jumla chiqadi.
   */
  it('EC-OLCH-15: teskari chegara RAD ETILADI', () => {
    const r = mahsulotTurSxema.safeParse({ ...asos, minEniM: '2.5', maksEniM: '2' });
    expect(r.success).toBe(false);
  });

  it('EC-OLCH-16: manfiy chegara rad etiladi', () => {
    expect(mahsulotTurSxema.safeParse({ ...asos, maksEniM: '-1' }).success).toBe(false);
    expect(mahsulotTurSxema.safeParse({ ...asos, maksEniM: '0' }).success).toBe(false);
  });
});
