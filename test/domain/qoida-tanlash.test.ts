/**
 * test/domain/qoida-tanlash.test.ts — 0055 · 0057
 *
 * QAYSI NARX QOIDASI ISHLATILADI. Bu tanlov ilgari OLTI joyda
 * qo'lda yozilgan edi va ularning hammasi bir xil emasdi. Endi
 * bitta funksiya, va tartib shu testlar bilan qotadi.
 *
 * ⚠️ 0057 — NARX GURUHI (DARAJA) BUTUNLAY OLIB TASHLANDI (egasi
 *    qarori 2026-09-24). Tanlovda uchta o'q qoldi:
 *
 *      tur      — aniq turga qo'yilganmi yoki HAMMA TURGA
 *      mijoz turi
 *      filial
 *
 *    Narx endi matoga bog'liq emas: bir turdagi hamma mato bir xil
 *    narxda sotiladi.
 *
 * ⚠️ 0059 — TO'RTINCHI O'Q: MATERIAL (egasi qarori 2026-09-24).
 *
 *    Faqat «materialni o'zi sotish» qatorlariga tegishli. Daraja
 *    ketgach bu jadval BITTA bo'lib qolgan edi va karniz bilan
 *    pult bir xil bosqichdan narx olardi. Endi qator materialga
 *    bog'lanishi mumkin va aniq materialniki umumiysidan ustun.
 */

import { describe, expect, it } from 'vitest';
import { narxManbai, qoidaniTop } from '@/lib/domain/narx-qoidasi';

interface Q {
  readonly kod: string;
  readonly mijozTuriId: number | null;
  readonly filialId: number | null;
  readonly hammaTurga?: boolean;
  readonly materialId?: number | null;
}

const MIJOZ = 3;
const FILIAL = 2;

const q = (
  kod: string,
  mijozTuriId: number | null,
  filialId: number | null,
  hammaTurga = false,
): Q => ({ kod, mijozTuriId, filialId, hammaTurga });

/** 0059 — materialga bog'langan qator */
const qm = (
  kod: string,
  materialId: number | null,
  mijozTuriId: number | null = null,
  filialId: number | null = null,
): Q => ({ kod, mijozTuriId, filialId, hammaTurga: false, materialId });

const KIRIM = { mijozTuriId: MIJOZ, filialId: FILIAL };

describe('EC-QT · turga qo’yilgan qoidalar tartibi', () => {
  it('EC-QT-01 · mijoz turi + filial eng aniq', () => {
    const r = qoidaniTop(
      [q('umumiy', null, null), q('filial', null, FILIAL), q('aniq', MIJOZ, FILIAL)],
      KIRIM,
    );
    expect(r?.kod).toBe('aniq');
  });

  /** TZ 6.2 — mijoz turi filialdan USTUN (egasi, 2026-08-30) */
  it('EC-QT-02 · mijoz turi filialdan ustun', () => {
    const r = qoidaniTop([q('filial', null, FILIAL), q('mijoz', MIJOZ, null)], KIRIM);
    expect(r?.kod).toBe('mijoz');
  });

  it('EC-QT-03 · faqat umumiysi bo’lsa o’sha olinadi', () => {
    expect(qoidaniTop([q('umumiy', null, null)], KIRIM)?.kod).toBe('umumiy');
  });

  it('EC-QT-04 · boshqa mijoz turining qoidasi OLINMAYDI', () => {
    expect(qoidaniTop([q('boshqa', 55, null)], KIRIM)).toBeUndefined();
  });

  it('EC-QT-05 · boshqa filialning qoidasi OLINMAYDI', () => {
    expect(qoidaniTop([q('chet', null, 99)], KIRIM)).toBeUndefined();
  });

  it('EC-QT-06 · hech narsa yo’q — undefined', () => {
    expect(qoidaniTop([], KIRIM)).toBeUndefined();
  });
});

describe('EC-QT · hamma tur uchun standart narx', () => {
  /**
   * ⚠️ ASOSIY QOIDA: turga qo'yilgani standartni TO'LIQ
   *    almashtiradi — narx qayerdan kelgani bir qarashda ko'rinsin.
   */
  it('EC-QT-07 · turga qo’yilgani standartdan USTUN', () => {
    const r = qoidaniTop([q('standart', null, null, true), q('tur', null, null)], KIRIM);
    expect(r?.kod).toBe('tur');
  });

  /**
   * ⚠️ ENG NOZIK HOLAT: turda faqat UMUMIY qator bor, standartda esa
   *    mijoz turiga ANIQ qator. Baribir TUR yutadi — «to'liq
   *    almashtirish» degani shu. Aks holda bitta pozitsiyaning
   *    narxi ikki manbadan aralashib chiqardi.
   */
  it('EC-QT-08 · turning umumiy qatori standartning ANIQ qatoridan ham ustun', () => {
    const r = qoidaniTop(
      [q('st-aniq', MIJOZ, FILIAL, true), q('tur-umumiy', null, null)],
      KIRIM,
    );
    expect(r?.kod).toBe('tur-umumiy');
  });

  it('EC-QT-09 · turda qator yo’q — standart narx ishlaydi', () => {
    expect(qoidaniTop([q('standart', null, null, true)], KIRIM)?.kod).toBe('standart');
  });

  it('EC-QT-10 · standart ichida ham aniqdan umumiyga', () => {
    const r = qoidaniTop(
      [q('st-umumiy', null, null, true), q('st-aniq', MIJOZ, FILIAL, true)],
      KIRIM,
    );
    expect(r?.kod).toBe('st-aniq');
  });

  /**
   * ⚠️ Chaqiruvchi ro'yxatni OLDINDAN FILTRLAMASLIGI kerak: turga
   *    tegishli va «hamma tur» qatorlari ARALASH keladi. Filtrlansa
   *    standart qatorlar hech qachon ishlamasdi.
   */
  it('EC-QT-11 · aralash ro’yxat to’g’ri ajratiladi', () => {
    const r = qoidaniTop(
      [
        q('st-umumiy', null, null, true),
        q('t-filial', null, FILIAL),
        q('st-aniq', MIJOZ, FILIAL, true),
        q('t-mijoz', MIJOZ, null),
      ],
      KIRIM,
    );
    expect(r?.kod).toBe('t-mijoz');
  });

  /**
   * ⚠️ ESKI CHAQIRUVCHILAR BUZILMAYDI: `hammaTurga` berilmagan
   *    qator turga bog'langan deb qaraladi.
   */
  it('EC-QT-12 · `hammaTurga` yo’q qator turga bog’langan deb qaraladi', () => {
    const eski = { kod: 'eski', mijozTuriId: null, filialId: null };
    const r = qoidaniTop([q('standart', null, null, true), eski], KIRIM);
    expect(r?.kod).toBe('eski');
  });
});

describe('EC-QT · narx manbai', () => {
  /**
   * ⚠️ 0057 da «DARAJA» → «STANDART». Egasi narxni tuzatmoqchi
   *    bo'lsa qayerga borishini bilishi kerak: turga alohida
   *    qo'yiladigan joy boshqa, hamma tur uchun standart boshqa.
   */
  it('EC-QT-13 · manba ekranda ko’rsatish uchun aniqlanadi', () => {
    expect(narxManbai(q('t', null, null))).toBe('TUR');
    expect(narxManbai(q('s', null, null, true))).toBe('STANDART');
    expect(narxManbai(undefined)).toBe('YOQ');
  });
});

// ─── 0059 — material o'qi ────────────────────────────────────────

const KARNIZ = 17;
const PULT = 21;

describe("EC-QT · material o'qi — 0059", () => {
  /**
   * ⚠️ ASOSIY SABAB. 0059 gacha jadval bitta edi: karnizga
   *    qo'yilgan 35 000 so'm/metr pultga ham qo'llanardi.
   */
  it("EC-QT-14 · boshqa materialning qatori HECH QACHON olinmaydi", () => {
    const r = qoidaniTop([qm('karniz', KARNIZ)], { ...KIRIM, materialId: PULT });
    expect(r).toBeUndefined();
  });

  it("EC-QT-15 · materialga qo'yilgani umumiysidan ustun", () => {
    const r = qoidaniTop([qm('umumiy', null), qm('karniz', KARNIZ)], {
      ...KIRIM,
      materialId: KARNIZ,
    });
    expect(r?.kod).toBe('karniz');
  });

  it("EC-QT-16 · materialniki yo'q bo'lsa umumiyga tushadi", () => {
    const r = qoidaniTop([qm('umumiy', null)], { ...KIRIM, materialId: PULT });
    expect(r?.kod).toBe('umumiy');
  });

  /**
   * ⚠️ MATERIAL O'QI ENG TASHQI. Materialga qo'yilgan UMUMIY qator
   *    (mijoz turi yo'q) umumiy jadvalning ANIQ qatoridan ham
   *    ustun: aks holda aniqroq sozlama umumiysiga yutqazardi.
   */
  it("EC-QT-17 · materialning umumiy qatori umumiy jadvalning aniq qatoridan ustun", () => {
    const r = qoidaniTop([qm('umumiy-aniq', null, MIJOZ, FILIAL), qm('karniz', KARNIZ)], {
      ...KIRIM,
      materialId: KARNIZ,
    });
    expect(r?.kod).toBe('karniz');
  });

  it("EC-QT-18 · material ichida ham sakkiz qadam ishlaydi", () => {
    const r = qoidaniTop(
      [qm('k-umumiy', KARNIZ), qm('k-aniq', KARNIZ, MIJOZ, FILIAL)],
      { ...KIRIM, materialId: KARNIZ },
    );
    expect(r?.kod).toBe('k-aniq');
  });

  /**
   * ⚠️ TAYYOR JALYUZI QATORLARI BUZILMAYDI: `materialId` berilmasa
   *    tanlov avvalgidek ishlaydi.
   */
  it("EC-QT-19 · material berilmasa eski xulq saqlanadi", () => {
    const r = qoidaniTop([q('tur', MIJOZ, FILIAL), q('standart', null, null, true)], KIRIM);
    expect(r?.kod).toBe('tur');
  });

  it("EC-QT-20 · material berilmasa materialga bog'langan qator OLINMAYDI", () => {
    const r = qoidaniTop([qm('karniz', KARNIZ)], KIRIM);
    expect(r).toBeUndefined();
  });
});
