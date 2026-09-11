/**
 * «Omborda hozir bor» bo'limi ochiq tursa ham TEGILMAGUNCHA yozilmaydi.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    2026-09-11: egasi bo'lim ochiq tursin dedi — yopiq turgani
 *    ko'rinmasdi va yangi mato qo'shilib, omborda nol bo'lib
 *    qolardi.
 *
 *    Lekin uni shunchaki ochib qo'yish MATERIALNI SAQLASHNI
 *    BLOKLARDI: ichidagi kataklar kartochkadan o'zi to'ladi
 *    (rulon o'lchami va kelish narxi — 2026-08-30 qarori).
 *    Bo'lim ochilishi bilan ular formaga tushar, server esa
 *    «zahira kiritilibdi» deb o'ylab yetishmagan maydonni
 *    so'rardi — odam esa bu bo'limga umuman tegmagan bo'lardi.
 *
 *    Bu kechagi `shaxsTuri` xatosining aynan o'zi: odam tegmagan
 *    joyi uchun xato oladi.
 *
 * ⚠️ Ikki tomonlama tekshiriladi: tegilmagani yozilmasligi HAM,
 *    tegilgani yozilishi HAM. Faqat birinchisi sinalsa, qoidani
 *    «hech qachon yozma» qilib qo'yish ham testdan o'tib ketardi.
 */
import { describe, expect, it } from 'vitest';
import { zahiraKiritildimi } from '@/lib/sxema/material';

/** Kartochkadan o'zi to'lgan holat — odam tegmagan */
const OZI_TOLGAN = {
  tegildi: '',
  narx: '60000',
  miqdor: '',
  bolakBor: true,
};

describe("Zahira bo'limi — ochiq turgani «to'ldirildi» degani emas", () => {
  it('tegilmagan bo‘lim — kataklar to‘la bo‘lsa ham yozilmaydi', () => {
    expect(zahiraKiritildimi(OZI_TOLGAN)).toBe(false);
  });

  it('mutlaqo bo‘sh va tegilmagan — yozilmaydi', () => {
    expect(
      zahiraKiritildimi({ tegildi: '', narx: '', miqdor: '', bolakBor: false }),
    ).toBe(false);
  });

  it('odam tegdi va rulon o‘lchami bor — YOZILADI', () => {
    expect(zahiraKiritildimi({ ...OZI_TOLGAN, tegildi: 'ha' })).toBe(true);
  });

  it('odam tegdi va miqdor kiritdi — YOZILADI', () => {
    expect(
      zahiraKiritildimi({ tegildi: 'ha', narx: '', miqdor: '12', bolakBor: false }),
    ).toBe(true);
  });

  /**
   * ⚠️ Tegib, keyin fikridan qaytgan holat. Hammasi o'chirilgan
   *    bo'lsa zahira YO'Q — aks holda odam bo'sh katak uchun
   *    «narxni kiriting» degan xato olardi.
   */
  it('tegdi, lekin hammasini o‘chirdi — yozilmaydi', () => {
    expect(
      zahiraKiritildimi({ tegildi: 'ha', narx: '', miqdor: '', bolakBor: false }),
    ).toBe(false);
  });

  /**
   * ⚠️ Narx yozib, miqdorni unutgan holat JIMGINA o'tkazilmaydi:
   *    bu yerda `true` qaytadi va keyingi tekshiruv «miqdorni
   *    kiriting» deb aytadi. Agar `false` bo'lsa, egasi zahira
   *    kiritdim deb o'ylab qolardi.
   */
  it('narx bor, miqdor yo‘q — tekshiruvga o‘tadi, jim qolmaydi', () => {
    expect(
      zahiraKiritildimi({ tegildi: 'ha', narx: '60000', miqdor: '', bolakBor: false }),
    ).toBe(true);
  });
});
