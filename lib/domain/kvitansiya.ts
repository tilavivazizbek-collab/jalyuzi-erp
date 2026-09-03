/**
 * lib/domain/kvitansiya.ts — TZ 8.9
 *
 * QISMAN TOPSHIRISH KVITANSIYASI ning sof mantiqi.
 *
 * ⚠️ NEGA ALOHIDA HUJJAT
 *
 *    TZ 8.9: «Chek FAQAT buyurtma to'liq yopilganda, bir marta.»
 *    Lekin mijoz ko'pincha buyurtmaning bir qismini oldinroq olib
 *    ketadi — qo'liga hech narsa bermasdan jo'natib bo'lmaydi.
 *    Kvitansiya aynan shu holat uchun: «bugun nima olib ketdingiz»
 *    va «yana nima qoldi».
 *
 * ⚠️ CHEKDAN UCH FARQI
 *
 *    1. Buyurtma yopilmagan bo'lsa ham beriladi.
 *    2. QR YO'Q — kvitansiya yakuniy hujjat emas, uni botga
 *       ulashning ma'nosi yo'q. QR chekda qoladi.
 *    3. QOLGAN pozitsiyalar ham yoziladi. Mijoz «yana nima
 *       kutyapman?» degan savolga qog'ozdan javob oladi va bir
 *       haftadan keyin kelib bahslashmaydi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1). Summa hisobi chek bilan BITTA
 *    manbadan: `pulYasa`, `qosh`, `ayir` va `CHEKKA_TUSHMAYDI`
 *    aynan `chek.ts` dan olinadi. Ikkinchi nusxa yozilsa,
 *    kvitansiyadagi «jami» chekdagidan farq qilib qolardi.
 */

import {
  CHEKKA_TUSHMAYDI,
  chekPuli,
  nolPul,
  pulYasa,
  qatorYasa,
  sanaVaqtMatni,
  type ChekPozitsiyasi,
  type ChekQatori,
} from './chek';
import { ayir, nolmi, qosh, type Pul, type Valyuta } from './pul';

export interface KvitansiyaKirimi {
  readonly buyurtmaRaqam: string;
  readonly sana: Date;
  /**
   * Kvitansiya chop etilayotgan payt.
   *
   * ⚠️ PARAMETR sifatida keladi, `new Date()` bu yerda CHAQIRILMAYDI:
   *    domain sof bo'lishi kerak (§5.1), aks holda funksiyani
   *    testda tekshirib bo'lmasdi.
   */
  readonly chiqarilgan: Date;
  readonly sotuvchi: string;
  readonly mijoz: string | null;
  readonly valyuta: Valyuta;
  readonly pozitsiyalar: readonly ChekPozitsiyasi[];
  /** Shu buyurtma bo'yicha jami to'langan summa */
  readonly tolangan: string;
  readonly korxonaNom: string | null;
  readonly korxonaManzil: string | null;
  readonly korxonaTelefon: string | null;
}

export interface Kvitansiya {
  readonly korxonaNom: string | null;
  readonly korxonaManzil: string | null;
  readonly korxonaTelefon: string | null;

  readonly buyurtmaRaqam: string;
  readonly sanaMatn: string;
  /** Kvitansiya CHOP ETILGAN payt — buyurtma sanasi emas */
  readonly chiqarilganMatn: string;
  readonly sotuvchi: string;
  readonly mijoz: string | null;
  readonly valyuta: Valyuta;

  /** Bugun qo'liga tegayotgan pozitsiyalar */
  readonly topshirilgan: readonly ChekQatori[];
  /** Hali kutilayotganlari — narxsiz, faqat ro'yxat */
  readonly qolgan: readonly ChekQatori[];

  /** Butun buyurtma summasi (chegirma ayirilgan) */
  readonly jami: string;
  readonly tolangan: string;
  /** To'liq to'langan bo'lsa `null` */
  readonly qarz: string | null;

  /** Hamma pozitsiya topshirilgan — endi CHEK chiqarish kerak */
  readonly toliqTopshirildi: boolean;
}

/**
 * ⚠️ Kvitansiyada BUTUN buyurtma summasi turadi, topshirilgan
 *    qismning summasi emas.
 *
 *    Sabab: mijoz pulni pozitsiya-pozitsiya emas, buyurtma bo'yicha
 *    to'laydi (avans + qolgani). «Topshirilgan qism 400 000» deb
 *    yozilsa, mijoz 400 000 to'lash kerak deb o'ylaydi — aslida u
 *    allaqachon 600 000 avans bergan bo'lishi mumkin. Qarz esa
 *    buyurtma darajasida yuritiladi (6.7).
 */
export function kvitansiyaYasa(k: KvitansiyaKirimi): Kvitansiya {
  const chiqadigan = k.pozitsiyalar.filter((p) => !CHEKKA_TUSHMAYDI.includes(p.holat));

  const nol = nolPul(k.valyuta);
  const hisoblangan = chiqadigan.reduce<Pul>((y, p) => qosh(y, pulYasa(p.narx, k.valyuta)), nol);
  const chegirma = chiqadigan.reduce<Pul>((y, p) => qosh(y, pulYasa(p.chegirma, k.valyuta)), nol);
  const jami = ayir(hisoblangan, chegirma);
  const tolangan = pulYasa(k.tolangan, k.valyuta);
  const qarz = ayir(jami, tolangan);

  const topshirilgan = chiqadigan.filter((p) => p.holat === 'TOPSHIRILDI');
  /**
   * ⚠️ QAYTARILGAN «qolgan» ro'yxatiga TUSHMAYDI: u mijozga
   *    berilgan va qaytib kelgan, mijoz uni kutmayapti.
   */
  const qolgan = chiqadigan.filter(
    (p) => p.holat !== 'TOPSHIRILDI' && p.holat !== 'QAYTARILGAN',
  );

  return {
    korxonaNom: k.korxonaNom,
    korxonaManzil: k.korxonaManzil,
    korxonaTelefon: k.korxonaTelefon,

    buyurtmaRaqam: k.buyurtmaRaqam,
    sanaMatn: sanaVaqtMatni(k.sana),
    chiqarilganMatn: sanaVaqtMatni(k.chiqarilgan),
    sotuvchi: k.sotuvchi,
    mijoz: k.mijoz,
    valyuta: k.valyuta,

    topshirilgan: topshirilgan.map((p) => qatorYasa(p, k.valyuta)),
    qolgan: qolgan.map((p) => qatorYasa(p, k.valyuta)),

    jami: chekPuli(jami),
    tolangan: chekPuli(tolangan),
    qarz: nolmi(qarz) ? null : chekPuli(qarz),

    toliqTopshirildi: qolgan.length === 0,
  };
}
