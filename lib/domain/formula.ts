/**
 * lib/domain/formula.ts — TZ 4.5, 4.8 · QISM 1 §4.3 · AUDIT B-01
 *
 * Konstruktorda yozilgan sarflash formulasini o'qiydi va hisoblaydi.
 *
 *   Ishlatiladigan nomlar:  ENI · BO'YI · MAYDON · SONI + mahsulot parametrlari
 *   Amallar:                + − × /  va qavslar
 *
 * KIRISH BIRLIGI HAR DOIM SANTIMETR (TZ 5.3). `MAYDON` kvadrat santimetrda
 * beriladi. Natija materialning sarflash birligiga qarab talqin qilinadi —
 * B-01 auditidagi noaniqlik shu yerda yopiladi.
 *
 * `eval` va `new Function` ISHLATILMAYDI: formula matnini admin kiritadi,
 * u kod bo'lib bajarilmasligi kerak (§16).
 */

import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';
import {
  dona,
  kvSmToKvM,
  maydonKvSm,
  sm,
  type Dona,
  type KvadratMetr,
  type Santimetr,
  type SarflashBirligi,
} from '@/lib/domain/birlik';

const D = Decimal.clone({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

/** Har mahsulot turida mavjud bo'ladigan nomlar — TZ 4.5 */
export const STANDART_OZGARUVCHILAR = ['ENI', "BO'YI", 'MAYDON', 'SONI'] as const;

export type Qiymatlar = Readonly<Record<string, number>>;

// ─── Daraxt ───────────────────────────────────────────────────────────────

export type Amal = '+' | '-' | '*' | '/';

export type Ifoda =
  | { readonly tur: 'SON'; readonly qiymat: Decimal }
  | { readonly tur: 'NOM'; readonly nom: string }
  | { readonly tur: 'AMAL'; readonly amal: Amal; readonly chap: Ifoda; readonly ong: Ifoda }
  | { readonly tur: 'MANFIY'; readonly ichki: Ifoda };

// ─── Belgilarni bir ko'rinishga keltirish ─────────────────────────────────

/**
 * Admin `×` ni ham, `*` ni ham yozishi mumkin; apostrof klaviaturaga qarab
 * uch xil belgidan biri bo'ladi. Hammasi bitta ko'rinishga keltiriladi,
 * aks holda `BO'YI` va `BO’YI` ikki xil o'zgaruvchi bo'lib qoladi.
 */
export function normalla(matn: string): string {
  return matn
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[×✕✖]/g, '*')
    .replace(/[÷∕]/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/ /g, ' ');
}

// ─── Tokenlarga ajratish ──────────────────────────────────────────────────

type TokenTuri = 'SON' | 'NOM' | 'AMAL' | 'OCH' | 'YOP';
interface Token {
  readonly tur: TokenTuri;
  readonly matn: string;
  readonly joy: number;
}

const NOM_BOSHI = /[A-Za-z]/;
const NOM_DAVOMI = /[A-Za-z0-9_']/;
const RAQAM = /[0-9]/;

function tokenlar(xom: string): Token[] {
  const matn = normalla(xom);
  const natija: Token[] = [];
  let i = 0;

  while (i < matn.length) {
    const belgi = matn[i] as string;

    if (belgi === ' ' || belgi === '\t' || belgi === '\n' || belgi === '\r') {
      i += 1;
      continue;
    }

    if (RAQAM.test(belgi) || (belgi === '.' && RAQAM.test(matn[i + 1] ?? ''))) {
      const boshi = i;
      let nuqta = false;
      while (i < matn.length) {
        const b = matn[i] as string;
        if (RAQAM.test(b)) {
          i += 1;
        } else if (b === '.' && !nuqta) {
          nuqta = true;
          i += 1;
        } else {
          break;
        }
      }
      natija.push({ tur: 'SON', matn: matn.slice(boshi, i), joy: boshi });
      continue;
    }

    if (NOM_BOSHI.test(belgi)) {
      const boshi = i;
      while (i < matn.length && NOM_DAVOMI.test(matn[i] as string)) {
        i += 1;
      }
      // Oxiridagi apostrof nomga kirmaydi: `BO'YI'` emas, `BO'YI`
      let oxiri = i;
      while (oxiri > boshi && matn[oxiri - 1] === "'") {
        oxiri -= 1;
      }
      natija.push({ tur: 'NOM', matn: matn.slice(boshi, oxiri).toUpperCase(), joy: boshi });
      i = oxiri;
      continue;
    }

    if (belgi === '+' || belgi === '-' || belgi === '*' || belgi === '/') {
      natija.push({ tur: 'AMAL', matn: belgi, joy: i });
      i += 1;
      continue;
    }

    if (belgi === '(') {
      natija.push({ tur: 'OCH', matn: belgi, joy: i });
      i += 1;
      continue;
    }

    if (belgi === ')') {
      natija.push({ tur: 'YOP', matn: belgi, joy: i });
      i += 1;
      continue;
    }

    throw new BiznesXato('FORMULA_XATO', `tushunarsiz belgi «${belgi}» (${String(i + 1)}-o'rin)`);
  }

  return natija;
}

// ─── Tahlil (rekursiv tushish) ────────────────────────────────────────────
//
//   ifoda  := had  (('+' | '-') had)*
//   had    := ko'p (('*' | '/') ko'p)*
//   ko'p   := ('-' | '+')* atom
//   atom   := SON | NOM | '(' ifoda ')'

class Tahlilchi {
  private o = 0;

  constructor(private readonly t: readonly Token[]) {}

  private joriy(): Token | undefined {
    return this.t[this.o];
  }

  private yut(): Token {
    const token = this.t[this.o];
    if (token === undefined) {
      throw new BiznesXato('FORMULA_XATO', 'formula tugallanmagan');
    }
    this.o += 1;
    return token;
  }

  parse(): Ifoda {
    if (this.t.length === 0) {
      throw new BiznesXato('FORMULA_XATO', "formula bo'sh");
    }
    const natija = this.ifoda();
    const qoldi = this.joriy();
    if (qoldi !== undefined) {
      throw new BiznesXato(
        'FORMULA_XATO',
        `«${qoldi.matn}» ortiqcha (${String(qoldi.joy + 1)}-o'rin)`,
      );
    }
    return natija;
  }

  private ifoda(): Ifoda {
    let chap = this.had();
    for (;;) {
      const token = this.joriy();
      if (token?.tur === 'AMAL' && (token.matn === '+' || token.matn === '-')) {
        this.yut();
        chap = { tur: 'AMAL', amal: token.matn, chap, ong: this.had() };
      } else {
        return chap;
      }
    }
  }

  private had(): Ifoda {
    let chap = this.kop();
    for (;;) {
      const token = this.joriy();
      if (token?.tur === 'AMAL' && (token.matn === '*' || token.matn === '/')) {
        this.yut();
        chap = { tur: 'AMAL', amal: token.matn, chap, ong: this.kop() };
      } else {
        return chap;
      }
    }
  }

  private kop(): Ifoda {
    const token = this.joriy();
    if (token?.tur === 'AMAL' && token.matn === '-') {
      this.yut();
      return { tur: 'MANFIY', ichki: this.kop() };
    }
    if (token?.tur === 'AMAL' && token.matn === '+') {
      this.yut();
      return this.kop();
    }
    return this.atom();
  }

  private atom(): Ifoda {
    const token = this.yut();

    if (token.tur === 'SON') {
      return { tur: 'SON', qiymat: new D(token.matn) };
    }

    if (token.tur === 'NOM') {
      return { tur: 'NOM', nom: token.matn };
    }

    if (token.tur === 'OCH') {
      const ichki = this.ifoda();
      const yopuvchi = this.joriy();
      if (yopuvchi?.tur !== 'YOP') {
        throw new BiznesXato('FORMULA_XATO', "qavs yopilmagan");
      }
      this.yut();
      return ichki;
    }

    throw new BiznesXato(
      'FORMULA_XATO',
      `«${token.matn}» kutilmagan joyda (${String(token.joy + 1)}-o'rin)`,
    );
  }
}

/** Formula matnini daraxtga aylantiradi. Xato bo'lsa `BiznesXato` otadi (TZ 4.5). */
export function formulaTahlil(matn: string): Ifoda {
  return new Tahlilchi(tokenlar(matn)).parse();
}

// ─── O'zgaruvchilar ───────────────────────────────────────────────────────

/**
 * Formulada ishlatilgan nomlar ro'yxati.
 * TZ 4.3: parametr o'chirilayotganda «CHET 2 ta formulada ishlatilmoqda»
 * ogohlantirishi shu ro'yxatdan chiqadi.
 */
export function formulaOzgaruvchilari(matn: string): string[] {
  const topilgan = new Set<string>();
  const yur = (i: Ifoda): void => {
    switch (i.tur) {
      case 'NOM':
        topilgan.add(i.nom);
        return;
      case 'AMAL':
        yur(i.chap);
        yur(i.ong);
        return;
      case 'MANFIY':
        yur(i.ichki);
        return;
      case 'SON':
        return;
    }
  };
  yur(formulaTahlil(matn));
  return [...topilgan].sort();
}

export interface TekshiruvNatijasi {
  readonly yaroqli: boolean;
  readonly ishlatilgan: readonly string[];
  readonly nomalum: readonly string[];
  readonly xato: string | undefined;
}

/**
 * TZ 4.5: «Formula kiritilganda darhol tekshiriladi — xato bo'lsa saqlanmaydi.»
 * Otmaydi — natijani qaytaradi, chunki bu forma validatsiyasi.
 */
export function formulaTekshir(matn: string, mavjudNomlar: readonly string[]): TekshiruvNatijasi {
  const ruxsat = new Set<string>([...STANDART_OZGARUVCHILAR, ...mavjudNomlar.map(normalla)]);
  try {
    const ishlatilgan = formulaOzgaruvchilari(matn);
    const nomalum = ishlatilgan.filter((n) => !ruxsat.has(n));
    return {
      yaroqli: nomalum.length === 0,
      ishlatilgan,
      nomalum,
      xato: nomalum.length === 0 ? undefined : `noma'lum: ${nomalum.join(', ')}`,
    };
  } catch (x) {
    return {
      yaroqli: false,
      ishlatilgan: [],
      nomalum: [],
      xato: x instanceof BiznesXato ? x.message : 'formulani o\'qib bo\'lmadi',
    };
  }
}

// ─── Hisoblash ────────────────────────────────────────────────────────────

function baholash(i: Ifoda, qiymatlar: Qiymatlar): Decimal {
  switch (i.tur) {
    case 'SON':
      return i.qiymat;

    case 'NOM': {
      const q = qiymatlar[i.nom];
      if (q === undefined) {
        throw new BiznesXato('FORMULA_NOMALUM_OZGARUVCHI', i.nom);
      }
      if (!Number.isFinite(q)) {
        throw new BiznesXato('FORMULA_XATO', `${i.nom} qiymati son emas`);
      }
      return new D(q);
    }

    case 'MANFIY':
      return baholash(i.ichki, qiymatlar).negated();

    case 'AMAL': {
      const chap = baholash(i.chap, qiymatlar);
      const ong = baholash(i.ong, qiymatlar);
      switch (i.amal) {
        case '+':
          return chap.plus(ong);
        case '-':
          return chap.minus(ong);
        case '*':
          return chap.times(ong);
        case '/':
          if (ong.isZero()) {
            throw new BiznesXato('NOLGA_BOLINDI', 'formulada nolga bo\'lish');
          }
          return chap.div(ong);
      }
    }
  }
}

/** Formulani berilgan qiymatlar bilan hisoblaydi. Natija — xom son (birligi yo'q). */
export function formulaHisobla(matn: string, qiymatlar: Qiymatlar): Decimal {
  return baholash(formulaTahlil(matn), qiymatlar);
}

/**
 * Standart o'zgaruvchilar to'plami. `MAYDON` kvadrat santimetrda beriladi (§4.3),
 * shuning uchun uni chaqiruvchi joyda qayta hisoblash shart emas.
 */
export function standartQiymatlar(
  eni: Santimetr,
  boyi: Santimetr,
  soni: number,
  parametrlar: Qiymatlar = {},
): Qiymatlar {
  const natija: Record<string, number> = {};
  for (const [nom, qiymat] of Object.entries(parametrlar)) {
    natija[normalla(nom).toUpperCase()] = qiymat;
  }
  natija['ENI'] = eni;
  natija["BO'YI"] = boyi;
  natija['MAYDON'] = maydonKvSm(eni, boyi);
  natija['SONI'] = soni;
  return natija;
}

/**
 * Xom natijani materialning sarflash birligiga o'giradi — QISM 1 §4.3, AUDIT B-01.
 *
 *   KV_M  — formula kv.sm bergan, kv.m ga bo'linadi
 *   SM    — shundayligicha (Q-01: chiziqli material smda sarflanadi)
 *   DONA  — yuqoriga yaxlitlanadi (yarim kronshteyn bo'lmaydi)
 */
export function formulaNatijasi(
  xom: Decimal,
  sarflashBirligi: SarflashBirligi,
): Santimetr | KvadratMetr | Dona {
  switch (sarflashBirligi) {
    case 'KV_M':
      return kvSmToKvM(xom.toNumber());
    case 'SM':
      return sm(xom.toNumber());
    case 'DONA':
      return dona(xom.ceil().toNumber());
  }
}

/** Formula + birlik — sotuv ekrani va test kalkulyatori (TZ 3.5, 4.8) shu funksiyani chaqiradi. */
export function sarflashHisobla(
  formula: string,
  qiymatlar: Qiymatlar,
  sarflashBirligi: SarflashBirligi,
): Santimetr | KvadratMetr | Dona {
  return formulaNatijasi(formulaHisobla(formula, qiymatlar), sarflashBirligi);
}
