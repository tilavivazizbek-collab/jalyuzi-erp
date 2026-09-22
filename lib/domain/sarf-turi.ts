/**
 * lib/domain/sarf-turi.ts — TZ 4.4 · 4.5 · AUDIT B-01
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Konstruktorda sarflash FORMULA bo'lib yozilardi: `MAYDON × 2`.
 * Egasi dasturchi emas — u «1 kv.m ga 2 kv.m mato ketadi» deb
 * o'ylaydi, `MAYDON × 2` deb emas.
 *
 * Endi ekranda ikki narsa tanlanadi: nimadan hisoblanadi va necha
 * barobar. Bu fayl uni formulaga aylantiradi va teskarisiga o'qiydi.
 *
 * ⚠️ Formulaning O'ZI o'zgarmadi. `lib/domain/formula.ts` avvalgidek
 *    ishlaydi — sotuvda ham, botda ham, ombordan yechishda ham.
 *    Bu fayl faqat EKRAN uchun soddalashtirilgan qatlam.
 *
 * ⚠️ Bu yerdagi xato ombordan NOTO'G'RI MATERIAL yechilishiga olib
 *    keladi: «Enidan × 2» ni maydonga aylantirib qo'ysak, 2 metrlik
 *    jalyuziga 4 metr karniz yozilardi va tannarx xato chiqardi.
 */

import { BiznesXato } from '@/lib/xato';
import { normalla } from './formula';

export const SARF_TURLARI = [
  'MAYDON',
  'ENI',
  "BO'YI",
  'ENI_BOYI',
  'TASMALI',
  'DONA',
  'MURAKKAB',
] as const;

export type SarfTuri = (typeof SARF_TURLARI)[number];

/**
 * Tasma soni qanday yaxlitlanadi — `TASMALI` uchun.
 *
 * ⚠️ Uchalasi ham kerak va tanlov EGASIDA:
 *
 *      YUQORIGA (CEIL)  — har doim ko'proq. Mato yetmay qolmaydi,
 *                         lekin ortiqcha ketadi
 *      YAQINIGA (ROUND) — eng tabiiysi: 18.02 → 18, 18.7 → 19
 *      PASTGA (FLOOR)   — har doim kamroq, tig'iz o'ram
 *
 *    Qaysi biri to'g'riligini USTA biladi, kod emas.
 */
export const YAXLITLASHLAR = ['ROUND', 'CEIL', 'FLOOR'] as const;
export type Yaxlitlash = (typeof YAXLITLASHLAR)[number];

export const YAXLITLASH_NOMI: Record<Yaxlitlash, string> = {
  ROUND: 'yaqiniga',
  CEIL: 'yuqoriga',
  FLOOR: 'pastga',
};

export interface SarfTavsifi {
  readonly nom: string;
  /** Ekranda raqam yonida turadigan izoh */
  readonly izoh: string;
  /** `MURAKKAB` da raqam emas, formulaning o'zi yoziladi */
  readonly raqamli: boolean;
  /**
   * Ikkita koeffitsient so'raladi: eniga alohida, bo'yiga alohida.
   * Faqat `ENI_BOYI` da `true`.
   */
  readonly ikkiQiymat: boolean;
  /**
   * Tasma sozlamalari so'raladimi — qadam, tasma eni, yaxlitlash,
   * soniga qo'shimcha. Faqat `TASMALI` da `true`.
   */
  readonly tasmali?: boolean;
}

export const SARF_TAVSIFI: Record<SarfTuri, SarfTavsifi> = {
  MAYDON: {
    nom: 'Maydondan',
    izoh: '1 kv.m jalyuziga shuncha ketadi',
    raqamli: true,
    ikkiQiymat: false,
  },
  ENI: {
    nom: 'Enidan',
    izoh: 'faqat eni bo‘yicha — karniz, lenta',
    raqamli: true,
    ikkiQiymat: false,
  },
  "BO'YI": {
    nom: "Bo‘yidan",
    izoh: 'faqat bo‘yi bo‘yicha — zanjir, arqon',
    raqamli: true,
    ikkiQiymat: false,
  },
  ENI_BOYI: {
    nom: 'Ham eniga, ham bo‘yiga',
    izoh: 'eniga ham, bo‘yiga ham ketadi — profil ramka',
    raqamli: true,
    ikkiQiymat: true,
  },
  /**
   * TASMALI — lamel, vertikal, to'lqinsimon parda (2026-09-22).
   *
   * ⚠️ NEGA ALOHIDA TUR KERAK BO'LDI
   *
   *    Bunday mahsulotda mato ENI bo'ylab EMAS, TASMALAB ketadi:
   *    rulondan bir xil enli tasmalar tortiladi va har tasma
   *    oynaning bir qismini egallaydi. Tasmaning o'z eni bilan
   *    egallagan joyi BOSHQA-BOSHQA son.
   *
   *    Misol: 0.40 m enli tasma oynada 0.11 m joy egallaydi.
   *    2 m oynaga ~18 ta tasma tushadi va mato sarfi
   *    18 × 0.40 × bo'yi bo'ladi — ya'ni oyna maydonidan
   *    bir necha barobar ko'p.
   *
   *    «Maydondan» turi buni IFODA QILA OLMAYDI: u maydonga
   *    bitta ko'paytma qo'yadi, tasma soni esa butun songa
   *    yaxlitlanadi va qadamga bog'liq.
   */
  TASMALI: {
    nom: 'Tasmalab (lamel, to‘lqin)',
    izoh: 'rulondan bir xil enli tasmalar tortiladi',
    raqamli: true,
    ikkiQiymat: false,
    tasmali: true,
  },
  DONA: {
    nom: 'Har donaga',
    izoh: 'o‘lchamdan bog‘liq emas — kronshteyn, vint',
    raqamli: true,
    ikkiQiymat: false,
  },
  MURAKKAB: {
    nom: 'Murakkab',
    izoh: 'formulani o‘zingiz yozasiz',
    raqamli: false,
    ikkiQiymat: false,
  },
};

/** Sonni formulaga yozishga tayyorlaydi: `2` · `1.5` */
function sonMatni(xom: string): string {
  const t = xom.trim();
  if (t === '') throw new BiznesXato('SARF_NOTOGRI', 'Sarf kiritilmagan');

  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) {
    throw new BiznesXato('SARF_NOTOGRI', `Sarf musbat son bo'lishi kerak: ${t}`);
  }

  // `2.0` emas, `2` — formula matni odam o'qishi uchun ham qoladi
  return String(n);
}

/**
 * Ekrandagi tanlovdan formula matnini yasaydi.
 *
 * ⚠️ `SONI` ga ko'paytirilmaydi: `lib/domain/formula.ts` uni
 *    o'zgaruvchi sifatida beradi va sotuv qatori sonini
 *    hisob-kitobning boshqa joyida qo'llaydi. Bu yerda ikkinchi
 *    marta ko'paytirsak sarf ikki barobar chiqib ketardi.
 */
/**
 * `TASMALI` turining sozlamalari.
 *
 * ⚠️ OBYEKT, pozitsion argument EMAS. Beshta-oltita ketma-ket matn
 *    argumenti yozilsa, ularning birini adashtirib qo'yish oson va
 *    xato JIMGINA o'tib ketardi: qadam bilan tasma eni o'rin
 *    almashsa formula baribir «ishlaydi», faqat butunlay boshqa
 *    raqam beradi.
 */
export interface TasmaSozlamasi {
  /** Bitta tasma oynada egallaydigan joy, metrda */
  readonly qadam: string;
  /** Rulondan tortiladigan tasma eni, metrda. Kesim eni ham SHU */
  readonly tasmaEniM: string;
  /** Tasma soni qanday yaxlitlanadi */
  readonly yaxlitlash: Yaxlitlash;
  /** Soniga qo'shimcha: `-1` — markazdan ochilganda bitta kam */
  readonly qoshimchaSoni: string;
  /**
   * HAR TASMAGA qo'shiladigan zapas, metrda — egasi qarori 2026-09-22.
   *
   * ⚠️ HAR TASMAGA, butun kesimga bir marta EMAS. Egasi shuni tanladi:
   *    lamel pastidan buklama har tasmada alohida qilinadi. 18 ta
   *    tasmada 10 sm zapas = 1.80 m qo'shimcha mato.
   *
   * ⚠️ Bo'sh — zapas yo'q.
   */
  readonly zapasM: string;
}

export function sarfFormulasi(
  turi: SarfTuri,
  qiymat: string,
  qiymat2 = '',
  tasma?: TasmaSozlamasi,
): string {
  if (turi === 'MURAKKAB') {
    const t = qiymat.trim();
    if (t === '') throw new BiznesXato('SARF_NOTOGRI', 'Formula kiritilmagan');
    return t;
  }

  /**
   * ⚠️ QO'SHISH, ko'paytirish emas.
   *
   *    `ENI × a × BO'YI × b` yozilsa u `MAYDON × (a×b)` ning aynan
   *    o'zi bo'lardi — «Maydondan» turi allaqachon shuni beradi va
   *    ikkinchi tanlov faqat chalkashtirardi.
   *
   *    Bu tur boshqa narsa uchun: material HAM eni bo'ylab, HAM bo'yi
   *    bo'ylab ketadi. Plisse ramkasi — yuqori va pastki profil
   *    (`ENI × 2`) ustiga ikki yon profil (`BO'YI × 2`). Ilgari bu
   *    ikki alohida qator bo'lardi, endi bitta.
   */
  if (turi === 'ENI_BOYI') {
    return `ENI * ${sonMatni(qiymat)} + BO'YI * ${sonMatni(qiymat2)}`;
  }

  /**
   * TASMALI — `ROUND(ENI / qadam) * tasmaEni * BO'YI`
   *
   * ⚠️ Natija KV.M da chiqadi: tasma soni × tasma eni × bo'yi.
   *    Mato sloti `KV_M` birligida bo'lgani uchun aynan shu kerak.
   *
   * ⚠️ QO'SHIMCHA SONI manfiy ham bo'lishi mumkin. Markazdan
   *    ochiladigan variantda tasma soni bir tomonlamadan bitta kam
   *    (yoki ko'p) bo'lishi mumkin — buni formulaga yozadigan
   *    boshqa yo'l yo'q, chunki formula tilida SHART yo'q.
   *
   * ⚠️ Nol qo'shimcha qavssiz yoziladi: formula matni egasining
   *    ko'ziga ham tushadi va ortiqcha qavs uni chalkashtiradi.
   */
  if (turi === 'TASMALI') {
    if (tasma === undefined) {
      throw new BiznesXato('SARF_NOTOGRI', 'Tasma sozlamalari kiritilmagan');
    }

    const qadam = sonMatni(tasma.qadam);
    const tasmaEni = sonMatni(tasma.tasmaEniM);

    const xomQoshimcha = tasma.qoshimchaSoni.trim();
    const qoshimcha = xomQoshimcha === '' ? 0 : Number(xomQoshimcha);
    if (!Number.isInteger(qoshimcha)) {
      throw new BiznesXato(
        'SARF_NOTOGRI',
        `Soniga qo'shimcha butun son bo'lishi kerak: ${xomQoshimcha}`,
      );
    }

    const soni =
      qoshimcha === 0
        ? `${tasma.yaxlitlash}(ENI / ${qadam})`
        : `(${tasma.yaxlitlash}(ENI / ${qadam}) ${qoshimcha > 0 ? '+' : '-'} ${String(Math.abs(qoshimcha))})`;

    /**
     * ⚠️ ZAPAS QAVS ICHIDA — egasi qarori 2026-09-22: «har tasmaga
     *    alohida». `(BO'YI + 0.1)` yozilgani uchun u tasma soniga
     *    KO'PAYADI: 18 ta tasmada 10 sm zapas 1.80 m mato beradi.
     *
     *    Qavssiz `BO'YI + 0.1` yozilsa, zapas butun kesimga bir
     *    marta tushardi — bu BOSHQA hisob va egasi uni tanlamadi.
     */
    const xomZapas = tasma.zapasM.trim();
    const boyi = xomZapas === '' ? "BO'YI" : `(BO'YI + ${sonMatni(xomZapas)})`;

    return `${soni} * ${tasmaEni} * ${boyi}`;
  }

  const son = sonMatni(qiymat);

  switch (turi) {
    case 'MAYDON':
      return `MAYDON * ${son}`;
    case 'ENI':
      return `ENI * ${son}`;
    case "BO'YI":
      return `BO'YI * ${son}`;
    case 'DONA':
      return son;
  }
}

export interface SarfHolati {
  readonly turi: SarfTuri;
  /** Raqamli turlarda son, `MURAKKAB` da formulaning o'zi, `ENI_BOYI` da ENI koeffitsienti */
  readonly qiymat: string;
  /**
   * `ENI_BOYI` — BO'YI koeffitsienti.
   * `TASMALI` — soniga qo'shimcha (`-1`, `0`, `2` …).
   * Boshqa turlarda bo'sh.
   */
  readonly qiymat2: string;
  /** Faqat `TASMALI` — bitta tasmaning eni, metrda */
  readonly tasmaEniM?: string;
  /** Faqat `TASMALI` — tasma soni qanday yaxlitlanadi */
  readonly yaxlitlash?: Yaxlitlash;
  /** Faqat `TASMALI` — HAR TASMAGA qo'shiladigan zapas, metrda */
  readonly zapasM?: string;
}

/**
 * Saqlangan formulani ekrandagi tanlovga qaytaradi.
 *
 * ⚠️ Mos kelmasa `MURAKKAB` qaytadi va formula matni o'zgarishsiz
 *    ko'rsatiladi. Jimgina «MAYDON × 1» deb taxmin qilish eng
 *    xavfli yo'l bo'lardi: admin formulani ochib, saqlab qo'ysa
 *    sarf butunlay boshqacha bo'lib ketardi.
 */
export function formuladanSarf(formula: string): SarfHolati {
  const t = normalla(formula).trim();

  /**
   * `ENI * 2 + BO'YI * 1.5` — ikki koeffitsientli tur.
   *
   * ⚠️ `koPaytma` dan OLDIN tekshiriladi. Tartib muhim emas (ikkalasi
   *    ham `^...$` ga bog'langan), lekin o'qiganda aniq bo'lsin:
   *    bu shakl bittalik ko'paytmadan uzunroq va aniqroq.
   */
  const ikkalasi = /^ENI\s*\*\s*(\d+(?:\.\d+)?)\s*\+\s*BO'YI\s*\*\s*(\d+(?:\.\d+)?)$/.exec(t);
  if (ikkalasi !== null) {
    const eniSoni = ikkalasi[1];
    const boyiSoni = ikkalasi[2];
    if (eniSoni !== undefined && boyiSoni !== undefined) {
      return { turi: 'ENI_BOYI', qiymat: eniSoni, qiymat2: boyiSoni };
    }
  }

  /**
   * TASMALI — `ROUND(ENI / 0.11) * 0.4 * BO'YI` yoki
   * `(ROUND(ENI / 0.11) - 1) * 0.4 * BO'YI`
   *
   * ⚠️ `koPaytma` dan OLDIN tekshiriladi: bu shakl uzunroq va
   *    aniqroq, oddiy ko'paytma bilan chalkashmaydi.
   */
  const tasmali =
    /^\(?(ROUND|CEIL|FLOOR)\s*\(\s*ENI\s*\/\s*(\d+(?:\.\d+)?)\s*\)\s*(?:([+-])\s*(\d+)\s*\))?\s*\*\s*(\d+(?:\.\d+)?)\s*\*\s*(?:BO'YI|\(\s*BO'YI\s*\+\s*(\d+(?:\.\d+)?)\s*\))$/.exec(
      t,
    );
  if (tasmali !== null) {
    const fn = tasmali[1];
    const qadam = tasmali[2];
    const ishora = tasmali[3];
    const qoshimcha = tasmali[4];
    const tasmaEni = tasmali[5];
    const zapas = tasmali[6];
    if (fn !== undefined && qadam !== undefined && tasmaEni !== undefined) {
      return {
        turi: 'TASMALI',
        qiymat: qadam,
        qiymat2:
          qoshimcha === undefined ? '0' : `${ishora === '-' ? '-' : ''}${qoshimcha}`,
        tasmaEniM: tasmaEni,
        yaxlitlash: fn as Yaxlitlash,
        zapasM: zapas ?? '',
      };
    }
  }

  /** `MAYDON * 2` · `ENI*1.5` · `BO'YI * 3` */
  const koPaytma = /^(MAYDON|ENI|BO'YI)\s*\*\s*(\d+(?:\.\d+)?)$/.exec(t);
  if (koPaytma !== null) {
    const nom = koPaytma[1];
    const son = koPaytma[2];
    if (nom !== undefined && son !== undefined) {
      return { turi: nom as SarfTuri, qiymat: son, qiymat2: '' };
    }
  }

  /** Yolg'iz son — `4` (kronshteyn) */
  if (/^\d+(?:\.\d+)?$/.test(t)) {
    return { turi: 'DONA', qiymat: t, qiymat2: '' };
  }

  /** `MAYDON` — ko'paytmasiz, ya'ni × 1 */
  const yolgiz = /^(MAYDON|ENI|BO'YI)$/.exec(t);
  if (yolgiz !== null) {
    const nom = yolgiz[1];
    if (nom !== undefined) return { turi: nom as SarfTuri, qiymat: '1', qiymat2: '' };
  }

  return { turi: 'MURAKKAB', qiymat: formula, qiymat2: '' };
}
