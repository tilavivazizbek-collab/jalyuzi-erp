/**
 * Forma YUBORMAGAN maydon tekshiruvni yiqitmasligi kerak.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 *    2026-09-10: egasi mijoz qo'sha olmadi. Ekranda «Formada xato
 *    bor — qizil maydonlarni tekshiring» turardi, qizil maydon esa
 *    YO'Q edi.
 *
 *    Sabab: `shaxsTuri` maydoni formada CHIZILMAGAN (u mijoz
 *    turidan hisoblanadi), lekin server har maydonni
 *    `matnMaydon` bilan o'qiydi va yo'q maydondan BO'SH SATR
 *    qaytadi. `z.enum(...).default('JISMONIY')` esa `.default()`
 *    ni faqat `undefined` da qo'llaydi — bo'sh satr enumga
 *    tushmay, tekshiruv yiqilardi.
 *
 *    Xato ko'rinmaydigan maydonga tegishli bo'lgani uchun odam
 *    hech narsa qila olmasdi.
 *
 * ⚠️ Bu test SXEMA darajasida — bazasiz, tez. `npm test` da yuradi.
 */
import { describe, expect, it } from 'vitest';
import { mijozSxema } from '@/lib/sxema/mijoz';

/** Forma yuboradigan xom qiymatlar — hammasi matn, yo'g'i bo'sh satr */
const XOM = {
  ism: 'Aziz',
  telefon: '+998643425455',
  manzil: '',
  eslatma: '',
  mijozGuruhId: '',
  mijozTuriId: '1',
  offsetTuri: '',
  offsetQiymat: '',
  qarzLimiti: '5000000',
  shaxsTuri: '',
  tashkilotNomi: '',
  inn: '',
  yuridikManzil: '',
  bankNomi: '',
  hisobRaqam: '',
  mfo: '',
  shartnomaRaqam: '',
  ndsStavka: '',
};

describe("Mijoz formasi — yuborilmagan maydon to'smaydi", () => {
  it("shaxsTuri BO'SH kelsa JISMONIY bo'ladi", () => {
    const r = mijozSxema.safeParse(XOM);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.shaxsTuri).toBe('JISMONIY');
  });

  it('eng kam to‘ldirilgan forma — faqat ism', () => {
    const bosh = Object.fromEntries(Object.keys(XOM).map((k) => [k, '']));
    const r = mijozSxema.safeParse({ ...bosh, ism: 'Aziz' });
    expect(r.success).toBe(true);
  });

  /**
   * ⚠️ Tuzatish HIMOYANI BUZMAGANINI tekshiradi: yuridik shaxsda
   *    uch maydon hamon MAJBURIY (QISM 3 §2.8).
   */
  it('YURIDIK shaxs rekvizitsiz RAD ETILADI', () => {
    const r = mijozSxema.safeParse({ ...XOM, shaxsTuri: 'YURIDIK' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === 'tashkilotNomi')).toBe(true);
    }
  });

  it('YURIDIK shaxs rekvizit bilan O‘TADI', () => {
    const r = mijozSxema.safeParse({
      ...XOM,
      shaxsTuri: 'YURIDIK',
      tashkilotNomi: 'Jalyuzi MCHJ',
      inn: '123456789',
      yuridikManzil: 'Toshkent',
    });
    expect(r.success).toBe(true);
  });

  /** Noma'lum qiymat jimgina o'tib ketmasligi kerak */
  it('xato qiymat RAD ETILADI', () => {
    const r = mijozSxema.safeParse({ ...XOM, shaxsTuri: 'BOSHQA' });
    expect(r.success).toBe(false);
  });

  it("telefon +998 64 bilan boshlansa ham qabul qilinadi", () => {
    // Faqat mobil emas, shahar raqami ham mijozda bo'lishi mumkin
    const r = mijozSxema.safeParse({ ...XOM, telefon: '+998643425455' });
    expect(r.success).toBe(true);
  });
});
