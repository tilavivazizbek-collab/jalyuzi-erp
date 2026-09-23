/**
 * test/domain/qoida-tanlash.test.ts — 0055
 *
 * QAYSI NARX QOIDASI ISHLATILADI. Bu tanlov ilgari BESH joyda
 * qo'lda yozilgan edi va ularning hammasi bir xil emasdi. Endi
 * bitta funksiya, va tartib shu testlar bilan qotadi.
 *
 * Egasi qarori 2026-09-23: darajaga umumiy narx qo'yiladi, turga
 * qo'yilgani esa uni TO'LIQ almashtiradi.
 */

import { describe, expect, it } from 'vitest';
import { narxManbai, qoidaniTop } from '@/lib/domain/narx-qoidasi';

interface Q {
  readonly kod: string;
  readonly narxGuruhId: number;
  readonly mijozTuriId: number | null;
  readonly filialId: number | null;
  readonly hammaTurga?: boolean;
}

const DARAJA = 7;
const MIJOZ = 3;
const FILIAL = 2;

const q = (
  kod: string,
  mijozTuriId: number | null,
  filialId: number | null,
  hammaTurga = false,
): Q => ({ kod, narxGuruhId: DARAJA, mijozTuriId, filialId, hammaTurga });

const KIRIM = { narxGuruhId: DARAJA, mijozTuriId: MIJOZ, filialId: FILIAL };

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

  it('EC-QT-04 · boshqa darajaning qoidasi OLINMAYDI', () => {
    const chet: Q = { kod: 'chet', narxGuruhId: 99, mijozTuriId: null, filialId: null };
    expect(qoidaniTop([chet], KIRIM)).toBeUndefined();
  });

  it('EC-QT-05 · daraja berilmasa hech narsa topilmaydi', () => {
    expect(
      qoidaniTop([q('umumiy', null, null)], { ...KIRIM, narxGuruhId: null }),
    ).toBeUndefined();
  });

  it('EC-QT-06 · boshqa mijoz turining qoidasi OLINMAYDI', () => {
    const r = qoidaniTop([q('boshqa', 55, null)], KIRIM);
    expect(r).toBeUndefined();
  });
});

describe('EC-QT · darajaga umumiy narx (0055)', () => {
  /**
   * ⚠️ ASOSIY QOIDA: turga qo'yilgani darajanikini TO'LIQ
   *    almashtiradi. Egasi shuni tanladi — narx qayerdan kelgani
   *    bir qarashda ko'rinsin.
   */
  it('EC-QT-07 · turga qo’yilgani darajanikidan USTUN', () => {
    const r = qoidaniTop([q('daraja', null, null, true), q('tur', null, null)], KIRIM);
    expect(r?.kod).toBe('tur');
  });

  /**
   * ⚠️ ENG NOZIK HOLAT: turga faqat UMUMIY qator bor, darajada esa
   *    mijoz turiga ANIQ qator. Baribir TUR yutadi — «to'liq
   *    almashtirish» degani shu. Aks holda bitta pozitsiyaning
   *    narxi ikki manbadan aralashib chiqardi.
   */
  it('EC-QT-08 · turning umumiy qatori darajaning ANIQ qatoridan ham ustun', () => {
    const r = qoidaniTop(
      [q('daraja-aniq', MIJOZ, FILIAL, true), q('tur-umumiy', null, null)],
      KIRIM,
    );
    expect(r?.kod).toBe('tur-umumiy');
  });

  it('EC-QT-09 · turda qator yo’q — daraja narxi ishlaydi', () => {
    const r = qoidaniTop([q('daraja', null, null, true)], KIRIM);
    expect(r?.kod).toBe('daraja');
  });

  it('EC-QT-10 · daraja ichida ham aniqdan umumiyga', () => {
    const r = qoidaniTop(
      [q('d-umumiy', null, null, true), q('d-aniq', MIJOZ, FILIAL, true)],
      KIRIM,
    );
    expect(r?.kod).toBe('d-aniq');
  });

  /**
   * ⚠️ Chaqiruvchi ro'yxatni OLDINDAN FILTRLAMASLIGI kerak: turga
   *    tegishli va «hamma tur» qatorlari ARALASH keladi. Filtrlansa
   *    5–8-qadamlar hech qachon ishlamasdi.
   */
  it('EC-QT-11 · aralash ro’yxat to’g’ri ajratiladi', () => {
    const r = qoidaniTop(
      [
        q('d-umumiy', null, null, true),
        q('t-filial', null, FILIAL),
        q('d-aniq', MIJOZ, FILIAL, true),
        q('t-mijoz', MIJOZ, null),
      ],
      KIRIM,
    );
    expect(r?.kod).toBe('t-mijoz');
  });

  /**
   * ⚠️ ESKI CHAQIRUVCHILAR BUZILMAYDI: `hammaTurga` berilmagan
   *    qator turga bog'langan deb qaraladi (bot va sinov
   *    ma'lumotlari uni bilmaydi).
   */
  it('EC-QT-12 · `hammaTurga` yo’q qator turga bog’langan deb qaraladi', () => {
    const eski = { kod: 'eski', narxGuruhId: DARAJA, mijozTuriId: null, filialId: null };
    const r = qoidaniTop([q('daraja', null, null, true), eski], KIRIM);
    expect(r?.kod).toBe('eski');
  });

  it('EC-QT-13 · hech narsa yo’q — undefined', () => {
    expect(qoidaniTop([], KIRIM)).toBeUndefined();
  });
});

describe('EC-QT · narx manbai', () => {
  it('EC-QT-14 · manba ekranda ko’rsatish uchun aniqlanadi', () => {
    expect(narxManbai(q('t', null, null))).toBe('TUR');
    expect(narxManbai(q('d', null, null, true))).toBe('DARAJA');
    expect(narxManbai(undefined)).toBe('YOQ');
  });
});
