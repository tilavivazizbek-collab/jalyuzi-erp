/**
 * REACT 19 — FORMA O'ZI TOZALANISHI.
 *
 * ⚠️ NEGA BU TEST BOR
 *
 * 2026-08-28 da egasi xabar berdi: mijoz yoki mahsulot qo'shayotib
 * «Saqlash» bosilganda «formada xato bor, qizil maydonlarni
 * tekshiring» chiqardi — lekin qizil maydon ko'rinmasdi va
 * YOZILGAN HAMMA NARSA YO'QOLARDI.
 *
 * Sabab kodda emas, React 19 ning yangi xatti-harakatida:
 * `<form action={...}>` amali tugagach React barcha maydonni
 * O'ZI tozalaydi. U amal muvaffaqiyatli tugadimi yoki xato
 * qaytardimi — bilmaydi, shuning uchun ikkala holatda ham
 * tozalaydi. Qizil chegara bor edi, lekin maydon endi bo'sh
 * bo'lgani uchun odam nima noto'g'ri ekanini ko'rmasdi.
 *
 * Yechim: xato holatiga kiritilgan xom qiymatlar biriktiriladi va
 * forma ularni qayta ko'rsatadi.
 *
 * Bu test o'sha biriktirish mantig'ini qo'riqlaydi.
 */
import { describe, expect, it } from 'vitest';
import { kirimniQaytar, type QaytarilganKirim } from '@/app/(panel)/forma-yordamchi';

interface SinovHolati extends QaytarilganKirim {
  readonly xato: string | null;
}

describe('kirimniQaytar — yozilgan ma‘lumot yo‘qolmaydi', () => {
  it('kiritilgan qiymatlar holatga biriktiriladi', () => {
    const kirim = { ism: 'Aziz Karimov', telefon: '901234567' };
    const n = kirimniQaytar<SinovHolati>({ xato: 'Xato bor' }, {}, kirim);

    expect(n.kiritilgan).toEqual(kirim);
    expect(n.xato).toBe('Xato bor');
  });

  it('urinish raqami har safar oshadi', () => {
    /**
     * ⚠️ Raqam `key` bo'lib ishlatiladi: React tozalagan maydonni
     *    QAYTA yaratadi va `defaultValue` yangidan qo'llanadi.
     *    Raqam o'zgarmasa maydon bo'sh qolib ketardi.
     */
    const a = kirimniQaytar<SinovHolati>({ xato: 'x' }, {}, { ism: 'A' });
    expect(a.urinish).toBe(1);

    const b = kirimniQaytar<SinovHolati>({ xato: 'x' }, a, { ism: 'B' });
    expect(b.urinish).toBe(2);

    const c = kirimniQaytar<SinovHolati>({ xato: 'x' }, b, { ism: 'C' });
    expect(c.urinish).toBe(3);
  });

  it('holatning boshqa maydonlari o‘zgarmaydi', () => {
    const n = kirimniQaytar<SinovHolati & { maydonXatolari: Record<string, string> }>(
      { xato: 'Xato bor', maydonXatolari: { ism: 'Nomini kiriting' } },
      {},
      { ism: '' },
    );

    expect(n.maydonXatolari).toEqual({ ism: 'Nomini kiriting' });
  });

  it('bo‘sh qiymatlar ham qaytariladi — ular ham odam tanlovi', () => {
    /**
     * ⚠️ Odam maydonni ATAYLAB bo'sh qoldirgan bo'lishi mumkin.
     *    Uni «to'ldirilmagan» deb tashlab yuborsak, keyingi
     *    ko'rsatishda standart qiymat qaytib kelardi va odam
     *    o'chirgan narsasi qayta paydo bo'lardi.
     */
    const n = kirimniQaytar<SinovHolati>({ xato: 'x' }, {}, { ism: 'A', telefon: '' });
    expect(n.kiritilgan?.['telefon']).toBe('');
  });
});
