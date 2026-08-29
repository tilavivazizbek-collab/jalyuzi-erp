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
import { amaldagiOffset } from '@/lib/domain/mijoz';

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
