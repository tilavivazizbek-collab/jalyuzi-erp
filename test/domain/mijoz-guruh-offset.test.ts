/**
 * TZ 6.3 — mijozga AMALDA qo'llanadigan chegirma.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * Chegirma ikki joydan kelishi mumkin: guruhdan (ulgurji, VIP)
 * va mijozning o'z kartochkasidan. Qaysi biri yutishi PUL
 * masalasi: noto'g'ri tanlov har buyurtmada narxni siljitadi va
 * buni oylar o'tib hisobotdan sezish qiyin.
 *
 * Qoida: shaxsiy chegirma ustun, ikkalasi QO'SHILMAYDI.
 */
import { describe, expect, it } from 'vitest';
import { amaldagiOffset, offsetQollanmadimi } from '@/lib/domain/mijoz';
import { kurs, pulMatn, type Som } from '@/lib/domain/pul';

const FOIZ = (q: string) => ({ offsetTuri: 'FOIZ', offsetQiymat: q });
const SOM = (q: string) => ({ offsetTuri: 'SOM', offsetQiymat: q });
const YOQ = { offsetTuri: null, offsetQiymat: null };

describe('Amaldagi chegirma', () => {
  it('ikkovi ham yo‘q — chegirmasiz', () => {
    expect(amaldagiOffset(YOQ, YOQ)).toBeNull();
    expect(amaldagiOffset(null, null)).toBeNull();
  });

  it('faqat guruhda bor — guruhniki ishlaydi', () => {
    expect(amaldagiOffset(YOQ, FOIZ('-10'))).toEqual({ turi: 'FOIZ', foiz: -10 });
  });

  it('faqat mijozda bor — shaxsiysi ishlaydi', () => {
    expect(amaldagiOffset(FOIZ('-15'), YOQ)).toEqual({ turi: 'FOIZ', foiz: -15 });
  });

  it('IKKOVI ham bor — SHAXSIYSI yutadi', () => {
    /** «Ulgurji −10%» guruhidagi mijozga alohida −15% qo'yilgan */
    expect(amaldagiOffset(FOIZ('-15'), FOIZ('-10'))).toEqual({ turi: 'FOIZ', foiz: -15 });
  });

  it('ikkovi QO‘SHILMAYDI — −25% chiqmaydi', () => {
    const n = amaldagiOffset(FOIZ('-15'), FOIZ('-10'));
    expect(n).not.toEqual({ turi: 'FOIZ', foiz: -25 });
  });

  it('turlari boshqa bo‘lsa ham shaxsiysi yutadi', () => {
    expect(amaldagiOffset(SOM('-5000'), FOIZ('-10'))).toEqual({
      turi: 'SOM',
      summa: expect.anything(),
    });
  });

  it('guruh yo‘q mijoz — faqat shaxsiysi qaraladi', () => {
    expect(amaldagiOffset(FOIZ('-5'), null)).toEqual({ turi: 'FOIZ', foiz: -5 });
  });

  it('USD guruh chegirmasi QO‘LLANMAYDI — kurs kerak (6.3)', () => {
    /**
     * ⚠️ Guruh formasida USD taklif qilinmaydi, lekin bazada
     *    eski yozuv bo'lishi mumkin. Jimgina so'm deb hisoblash
     *    xavfli — narx bir necha ming barobar xato bo'lardi.
     */
    expect(amaldagiOffset(YOQ, { offsetTuri: 'USD', offsetQiymat: '-5' })).toBeNull();
  });
});

// ─── 6.3 · USD offseti kurs bilan ─────────────────────────────────────────

/**
 * ⚠️ NEGA BU TESTLAR BOR
 *
 * 2026-09-05 gacha USD offseti kurs berilgan-berilmaganidan qat'i
 * nazar TASHLAB YUBORILARDI. Mijoz kartochkasida «−10 $» turar,
 * sotuv formasi «joriy kurs ishlatiladi» deb va'da qilar, mijoz
 * esa standart narxda olardi — hech qanday ogohlantirishsiz.
 */
describe('6.3 — USD chegirmasi joriy kursda so‘mga o‘giriladi', () => {
  const USD = (q: string) => ({ offsetTuri: 'USD', offsetQiymat: q });
  const KURS = kurs('12500', new Date(), 'JORIY');

  it('−10 $ · kurs 12 500 → −125 000 so‘m', () => {
    const o = amaldagiOffset(USD('-10'), null, KURS);
    expect(o?.turi).toBe('SOM');
    expect(pulMatn((o as { turi: 'SOM'; summa: Som }).summa)).toBe('-125000.00');
  });

  it('kurs BERILMASA qo‘llanmaydi — jimgina noto‘g‘ri narx chiqmaydi', () => {
    expect(amaldagiOffset(USD('-10'), null)).toBeNull();
  });

  it('shaxsiy USD chegirmasi guruhnikidan ustun', () => {
    const o = amaldagiOffset(USD('-10'), SOM('-5000'), KURS);
    expect(pulMatn((o as { turi: 'SOM'; summa: Som }).summa)).toBe('-125000.00');
  });

  /**
   * ⚠️ Kurs yo'q bo'lsa shaxsiy USD chegirmasi qo'llanmaydi, LEKIN
   *    guruhnikiga ham o'tilmaydi: shaxsiysi baribir ustun (6.3).
   *    Aks holda mijoz kutganidan boshqa chegirma olardi.
   */
  it('kurssiz shaxsiy USD — guruh so‘m chegirmasiga O‘TILMAYDI', () => {
    expect(amaldagiOffset(USD('-10'), SOM('-5000'))).toBeNull();
  });
});

describe('6.3 — sotuvchi ogohlantiriladi', () => {
  const USD = (q: string) => ({ offsetTuri: 'USD', offsetQiymat: q });
  const KURS = kurs('12500', new Date(), 'JORIY');

  it('kurssiz USD chegirmasi bo‘lsa — ogohlantirish', () => {
    expect(offsetQollanmadimi(USD('-10'), null, null)).toBe(true);
  });

  it('kurs bo‘lsa ogohlantirish YO‘Q', () => {
    expect(offsetQollanmadimi(USD('-10'), null, KURS)).toBe(false);
  });

  it('so‘m chegirmasida ogohlantirish YO‘Q', () => {
    expect(offsetQollanmadimi(SOM('-5000'), null, null)).toBe(false);
  });

  it('guruhning USD chegirmasi ham ogohlantiradi', () => {
    expect(offsetQollanmadimi(YOQ, USD('-10'), null)).toBe(true);
  });

  /**
   * ⚠️ Shaxsiy so'm chegirmasi bor bo'lsa guruhning USD i baribir
   *    qo'llanmaydi (shaxsiysi ustun) — bu ogohlantirish emas.
   */
  it('shaxsiy so‘m bor bo‘lsa guruh USD i ogohlantirmaydi', () => {
    expect(offsetQollanmadimi(SOM('-5000'), USD('-10'), null)).toBe(false);
  });
});
