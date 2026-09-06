/**
 * lib/domain/kurs-farqi.ts — TZ 9.5 · 9.6 · 2.3-invariant
 *
 * Dollardagi qarzni SO'MDA to'lash va undan chiqadigan kurs farqi.
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 *    TZ 9.5: «Dollar qarzini so'mda to'lash mumkin... Qarz
 *    `so'm ÷ kurs` bo'yicha kamayadi.»
 *    TZ 9.6: «To'lov paytida chiqadigan farq ALOHIDA XARAJAT
 *    MODDASI bo'lib yoziladi — tannarxga tegmaydi.»
 *
 *    2026-09-03 auditigacha ikkalasi ham yo'q edi: `kursFarqi()`
 *    funksiyasi va uning kanonik testi (1 650 000) yozilgan, lekin
 *    HECH KIM CHAQIRMASDI. To'lov formasi esa kassalarni tanlangan
 *    valyuta bo'yicha filtrlardi — ya'ni dollar qarzini so'mda
 *    to'lashning iloji yo'q edi va kurs farqi umuman tug'ilmasdi.
 *
 * ⚠️ TZ 9.5 — «To'lov umumiy balansga tushadi va ENG ESKI HUJJATDAN
 *    yopiladi». Shuning uchun to'lov xaridlar bo'ylab FIFO
 *    taqsimlanadi: har xaridning O'Z qotgan kursi bor (2.3) va farq
 *    har biriga alohida hisoblanadi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1) — xaridlar ro'yxati parametr bo'lib keladi.
 */

import {
  ayir,
  kattami,
  manfiy,
  musbatmi,
  nolDollar,
  nolSom,
  nolmi,
  ogir,
  pulMatn,
  qosh,
  yengil,
  type Dollar,
  type Kurs,
  type KursFarqiTuri,
  type Som,
} from './pul';

/** Yopilmagan dollarli xarid — eng eskisi birinchi. */
export interface OchiqXarid {
  /** Shu hujjatda qolgan qarz */
  readonly qoldiq: Dollar;
  /** Kirim kunida QOTGAN kurs (9.6) */
  readonly kirimKursi: Kurs;
}

export interface TaqsimotQatori {
  readonly yopildi: Dollar;
  /** Shu qism bo'yicha farq — musbat: qimmatga tushdi */
  readonly farq: Som;
}

export interface TaqsimotNatijasi {
  /** To'lov yopgan qarz — DOLLARDA (9.5) */
  readonly yopilgan: Dollar;
  /**
   * Qarzdan ORTIB QOLGAN qism — avans (9.5).
   * Dollarda, chunki qarz shu valyutada yuritiladi.
   */
  readonly avans: Dollar;
  readonly turi: KursFarqiTuri;
  /** Har doim MUSBAT — yo'nalishni `turi` bildiradi */
  readonly farq: Som;
  readonly qatorlar: readonly TaqsimotQatori[];
}

/**
 * TZ 9.5 · 9.6 — so'mdagi to'lovni dollarli qarzlarga taqsimlaydi.
 *
 * ```
 * Kirim   3 000 $ × 12 650 = 37 950 000  → tannarx (qotdi)
 * To'lov  3 000 $ × 13 200 = 39 600 000  → kassadan chiqdi
 * Kurs farqi                  1 650 000  → xarajat
 * ```
 *
 * @param xaridlar   yopilmagan xaridlar, ENG ESKISI BIRINCHI
 * @param tolov      kassadan chiqqan so'm
 * @param tolovKursi to'lov kunidagi kurs
 */
export function somToloviniTaqsimla(
  xaridlar: readonly OchiqXarid[],
  tolov: Som,
  tolovKursi: Kurs,
): TaqsimotNatijasi {
  /** 9.5 — «Qarz `so'm ÷ kurs` bo'yicha kamayadi» */
  const jamiYopiladi = yengil(tolov, tolovKursi);

  let qolgan = jamiYopiladi;
  let farq = nolSom();
  let yopilgan = nolDollar();
  const qatorlar: TaqsimotQatori[] = [];

  for (const x of xaridlar) {
    if (!musbatmi(qolgan)) break;
    if (!musbatmi(x.qoldiq)) continue;

    // Shu hujjatdan qancha yopiladi — qolganidan ko'p emas
    const yopildi = kattami(qolgan, x.qoldiq) ? x.qoldiq : qolgan;

    /**
     * ⚠️ Farq SHU QISM bo'yicha: har hujjatning kursi boshqacha
     *    bo'lishi mumkin va ularni o'rtachalash noto'g'ri javob
     *    berardi (2.3 — har kirim o'z kursida qotgan).
     */
    const qatorFarqi = ayir(ogir(yopildi, tolovKursi), ogir(yopildi, x.kirimKursi));

    qatorlar.push({ yopildi, farq: qatorFarqi });
    farq = qosh(farq, qatorFarqi);
    yopilgan = qosh(yopilgan, yopildi);
    qolgan = ayir(qolgan, yopildi);
  }

  /**
   * ⚠️ Qarzdan ortiq to'langan qismga kurs farqi YO'Q: u hali
   *    hech qanday kirimga bog'lanmagan, qotgan kursi ham yo'q.
   *    U avans bo'lib turadi va keyingi kirimda yopiladi.
   */
  const avans = musbatmi(qolgan) ? qolgan : nolDollar();

  const turi: KursFarqiTuri = nolmi(farq)
    ? 'YOQ'
    : musbatmi(farq)
      ? 'XARAJAT'
      : 'DAROMAD';

  return {
    yopilgan,
    avans,
    turi,
    farq: turi === 'DAROMAD' ? manfiy(farq) : farq,
    qatorlar,
  };
}

/** Bazaga yoziladigan ko'rinish — `string`, ikki kasr xonasi. */
export const taqsimotMatni = (n: TaqsimotNatijasi): {
  yopilgan: string;
  avans: string;
  farq: string;
} => ({
  yopilgan: pulMatn(n.yopilgan),
  avans: pulMatn(n.avans),
  farq: pulMatn(n.farq),
});

/**
 * TZ 9.5 — qaysi xaridlar hali YOPILMAGANINI aniqlaydi.
 *
 * ⚠️ Bu ham FIFO qoidasi («eng eski hujjatdan yopiladi»), shuning
 *    uchun u ham SHU YERDA turadi (§2.2). Amal qatlami faqat
 *    xaridlar ro'yxatini va jami to'langan summani beradi.
 *
 * @param xaridlar  hamma dollarli xarid, ENG ESKISI BIRINCHI
 * @param tolangan  shu yetkazib beruvchiga jami to'langan dollar
 */
export function ochiqXaridlar(
  xaridlar: readonly OchiqXarid[],
  tolangan: Dollar,
): readonly OchiqXarid[] {
  let qoplandi = tolangan;
  const ochiq: OchiqXarid[] = [];

  for (const x of xaridlar) {
    if (!musbatmi(qoplandi)) {
      ochiq.push(x);
      continue;
    }

    if (kattami(qoplandi, x.qoldiq) || nolmi(ayir(qoplandi, x.qoldiq))) {
      // Bu hujjat to'liq yopilgan
      qoplandi = ayir(qoplandi, x.qoldiq);
      continue;
    }

    // Qisman yopilgan — qolgani ochiq
    ochiq.push({ qoldiq: ayir(x.qoldiq, qoplandi), kirimKursi: x.kirimKursi });
    qoplandi = nolDollar();
  }

  return ochiq;
}
