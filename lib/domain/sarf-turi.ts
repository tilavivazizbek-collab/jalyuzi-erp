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

export const SARF_TURLARI = ['MAYDON', 'ENI', "BO'YI", 'DONA', 'MURAKKAB'] as const;

export type SarfTuri = (typeof SARF_TURLARI)[number];

export interface SarfTavsifi {
  readonly nom: string;
  /** Ekranda raqam yonida turadigan izoh */
  readonly izoh: string;
  /** `MURAKKAB` da raqam emas, formulaning o'zi yoziladi */
  readonly raqamli: boolean;
}

export const SARF_TAVSIFI: Record<SarfTuri, SarfTavsifi> = {
  MAYDON: {
    nom: 'Maydondan',
    izoh: '1 kv.m jalyuziga shuncha ketadi',
    raqamli: true,
  },
  ENI: {
    nom: 'Enidan',
    izoh: 'faqat eni bo‘yicha — karniz, lenta',
    raqamli: true,
  },
  "BO'YI": {
    nom: "Bo‘yidan",
    izoh: 'faqat bo‘yi bo‘yicha — zanjir, arqon',
    raqamli: true,
  },
  DONA: {
    nom: 'Har donaga',
    izoh: 'o‘lchamdan bog‘liq emas — kronshteyn, vint',
    raqamli: true,
  },
  MURAKKAB: {
    nom: 'Murakkab',
    izoh: 'formulani o‘zingiz yozasiz',
    raqamli: false,
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
export function sarfFormulasi(turi: SarfTuri, qiymat: string): string {
  if (turi === 'MURAKKAB') {
    const t = qiymat.trim();
    if (t === '') throw new BiznesXato('SARF_NOTOGRI', 'Formula kiritilmagan');
    return t;
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
  /** Raqamli turlarda son, `MURAKKAB` da formulaning o'zi */
  readonly qiymat: string;
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

  /** `MAYDON * 2` · `ENI*1.5` · `BO'YI * 3` */
  const koPaytma = /^(MAYDON|ENI|BO'YI)\s*\*\s*(\d+(?:\.\d+)?)$/.exec(t);
  if (koPaytma !== null) {
    const nom = koPaytma[1];
    const son = koPaytma[2];
    if (nom !== undefined && son !== undefined) {
      return { turi: nom as SarfTuri, qiymat: son };
    }
  }

  /** Yolg'iz son — `4` (kronshteyn) */
  if (/^\d+(?:\.\d+)?$/.test(t)) {
    return { turi: 'DONA', qiymat: t };
  }

  /** `MAYDON` — ko'paytmasiz, ya'ni × 1 */
  const yolgiz = /^(MAYDON|ENI|BO'YI)$/.exec(t);
  if (yolgiz !== null) {
    const nom = yolgiz[1];
    if (nom !== undefined) return { turi: nom as SarfTuri, qiymat: '1' };
  }

  return { turi: 'MURAKKAB', qiymat: formula };
}
