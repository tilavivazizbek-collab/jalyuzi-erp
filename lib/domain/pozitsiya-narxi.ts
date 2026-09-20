/**
 * lib/domain/pozitsiya-narxi.ts — TZ 3.5 · 3.6 · 3.8 · 4.7 · 6.3 · Q-01
 *
 * Bitta pozitsiyaning narxi va material sarfi.
 *
 * ⚠️ NARX MODELI 2026-09-20 DA O'ZGARDI
 *
 *    Ilgari:  Σ(slot miqdori × matoning narxi) + Σ(aksessuar × narxi)
 *    Endi:    tur × mato darajasi → bosqichli jadval
 *
 *    Egasi: «hozirda qatnashgan har bir narsani narxi hisoblanib
 *    qo'shiladi, endi unday bo'lmaydi — men belgilab qo'yaman
 *    mijozga narx qanday hisoblanishini».
 *
 * ⚠️ MATERIAL SARFI QOLDI, NARXI KETDI.
 *
 *    Qaysi materialdan qancha ketishi avvalgidek hisoblanadi —
 *    ombor shunga tayanadi va sotuvchi ham ko'rib turadi. Faqat
 *    har qatorning NARXI endi chiqmaydi: mijoz narxi butunlay
 *    boshqa joydan keladi.
 *
 *    Shuning uchun natija IKKI ro'yxat: `sarf` (nechta) va
 *    `narxQatorlari` (qancha pul). Ilgari ular bitta ro'yxat edi
 *    va aynan shu chalkashlik narxni materialga bog'lab qo'ygandi.
 *
 * ⚠️ Bu yerda turgani bejiz emas. Narxni IKKI interfeys hisoblaydi —
 *    sotuv ekrani va Telegram bot (13.5). §2.2 «bir mantiq — bir
 *    joyda»: nusxa ko'chirilsa botda bir narx, saytda boshqa narx
 *    chiqardi va mijoz «botda boshqacha yozgan edi» derdi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1) — narx qoidasi, formula va o'lcham
 *    parametr bo'lib keladi.
 */

import { m, type SarflashBirligi } from './birlik';
import {
  kopaytir,
  nolmi,
  nolSom,
  pulMatn,
  som,
  yigindi,
  type Kurs,
  type Som,
} from './pul';
import { offsetQolla, type Offset } from './narx';
import { slotSarfi, soniUchun, standartQiymatlar, sarflashHisobla } from './formula';
import {
  bosqichniTop,
  olchovi,
  qoidaNarxi,
  qoshimchaNarxi,
  type Bosqich,
  type Qoida,
  type Qoshimcha,
} from './narx-qoidasi';
import { biznesXatosimi } from '@/lib/xato';

export interface SlotKirishi {
  readonly nom: string;
  readonly formula: string;
  readonly sarflashBirligi: SarflashBirligi;
  /** AUDIT 1-topilma — «nechta marta»; KV_M jami sarf uchun */
  readonly koeffitsient?: number | null;
  /** TZ 3.6 — sotuvchi tuzatgan miqdor; ombor SHUNGA tayanadi */
  readonly tuzatilganMiqdor?: number | null;
}

export interface AksessuarKirishi {
  readonly nom: string;
  readonly formula: string;
  readonly sarflashBirligi: SarflashBirligi;
  readonly majburiy: boolean;
  /** TZ 3.7 — qo'lda kiritilgan son formulani USTIDAN YOZMAYDI */
  readonly qoldaSoni?: number | null;
}

export interface NarxKirishi {
  readonly eniM: number;
  readonly boyiM: number;
  readonly soni: number;
  readonly parametrlar: Readonly<Record<string, number>>;
  readonly slotlar: readonly SlotKirishi[];
  readonly aksessuarlar: readonly AksessuarKirishi[];
  /**
   * Tanlangan mato darajasiga mos narx qoidasi.
   *
   * ⚠️ `null` — bu tur va daraja uchun narx qo'yilmagan. Natijada
   *    `xato` to'ladi va `jami` NULL bo'ladi: nol narx qaytarish
   *    jalyuzini bepulga berish demak edi.
   */
  readonly qoida: Qoida | null;
  /** Mijoz tanlagan qo'shimchalar — «usti shabalik», «o'rnatish» */
  readonly qoshimchalar: readonly Qoshimcha[];
  /** TZ 6.3 — mijoz guruhi offseti */
  readonly offset: Offset | null;
  readonly kurs?: Kurs | null;
  readonly xizmatHaqi: string | null;
}

/** Ombor va ishlab chiqarish uchun — NARXSIZ (egasi qarori 2026-09-20) */
export interface SarfQatori {
  readonly nom: string;
  readonly miqdor: number;
  readonly sarflashBirligi: SarflashBirligi;
  readonly matomi: boolean;
}

/** Mijoz to'laydigan qatorlar */
export interface NarxQatori {
  readonly nom: string;
  readonly summa: string;
}

export interface NarxNatijasi {
  /** Qaysi materialdan qancha — narxsiz */
  readonly sarf: readonly SarfQatori[];
  /** Asosiy narx, qo'shimchalar, xizmat haqi */
  readonly narxQatorlari: readonly NarxQatori[];
  /** Bosqich qaysi songa qarab tanlangani — ekranda ko'rsatiladi */
  readonly olchov: number | null;
  readonly bosqich: Bosqich | null;
  /** `null` — narx hisoblanmadi, `xato` ni ko'ring */
  readonly jami: string | null;
  /** Sotuvchiga ko'rsatiladigan sabab; `null` — hammasi joyida */
  readonly xato: string | null;
}

// ─── Material sarfi ───────────────────────────────────────────────────────

/**
 * Slot va aksessuar miqdorlari.
 *
 * ⚠️ Narx modelidan MUSTAQIL: narx qoidasi bo'lmasa ham bu ro'yxat
 *    to'la chiqadi. Sotuvchi «narx qo'yilmagan» xabarini ko'radi,
 *    lekin qaysi materialdan qancha ketishini baribir biladi.
 */
function sarfQatorlari(k: NarxKirishi): SarfQatori[] {
  const asos = standartQiymatlar(m(k.eniM), m(k.boyiM), k.soni, k.parametrlar);

  const slotlar: SarfQatori[] = k.slotlar.map((s) => {
    const bir = slotSarfi(s.formula, asos, s.sarflashBirligi, s.koeffitsient);
    const hisoblangan = soniUchun(s.formula, bir, k.soni);
    return {
      nom: s.nom,
      // TZ 3.6 — sotuvchi tuzatgan bo'lsa ombor SHUNGA tayanadi
      miqdor: s.tuzatilganMiqdor ?? hisoblangan,
      sarflashBirligi: s.sarflashBirligi,
      matomi: true,
    };
  });

  const aksessuarlar: SarfQatori[] = k.aksessuarlar.map((a) => {
    const bir = Number(sarflashHisobla(a.formula, asos, a.sarflashBirligi));
    const hisoblangan = soniUchun(a.formula, bir, k.soni);
    return {
      nom: a.nom,
      // TZ 3.7 — qo'lda kiritilgan son formulani ustidan yozmaydi
      miqdor: a.qoldaSoni ?? hisoblangan,
      sarflashBirligi: a.sarflashBirligi,
      matomi: false,
    };
  });

  return [...slotlar, ...aksessuarlar];
}

// ─── Narx ─────────────────────────────────────────────────────────────────

/**
 * TZ 3.8 — pozitsiya narxi:
 *
 * ```
 * asosiy = bosqich stavkasi × o'lcham         (mijoz guruhi offseti bilan)
 *        + Σ(tanlangan qo'shimchalar)
 *        + xizmat haqi
 *        × soni
 * ```
 *
 * ⚠️ OFFSET faqat ASOSIY narxga tushadi (TZ 6.3 ruhida): o'rnatish
 *    haqiga chegirma berish alohida qaror bo'lishi kerak, uni mijoz
 *    guruhi avtomatik hal qilmasligi kerak.
 *
 * ⚠️ `soni` ga oxirida ko'paytiriladi. Hozir u har doim 1 —
 *    sotuv formasi, bot va tahrir uchalasi ham shunday yuboradi
 *    (`docs/QARZLAR.md` T-12), lekin model to'g'ri bo'lib qolsin.
 */
export function pozitsiyaNarxiniHisobla(k: NarxKirishi): NarxNatijasi {
  const sarf = sarfQatorlari(k);

  if (k.qoida === null) {
    return {
      sarf,
      narxQatorlari: [],
      olchov: null,
      bosqich: null,
      jami: null,
      xato: "Bu mahsulot va mato darajasi uchun narx qo'yilmagan",
    };
  }

  let olchov: number;
  try {
    olchov = olchovi(k.qoida.hisoblashUsuli, k.eniM, k.boyiM);
  } catch (x) {
    return {
      sarf,
      narxQatorlari: [],
      olchov: null,
      bosqich: null,
      jami: null,
      xato: biznesXatosimi(x) ? x.message : "O'lcham noto'g'ri",
    };
  }

  const bosqich = bosqichniTop(k.qoida.bosqichlar, olchov);

  let asosiy: Som;
  try {
    asosiy = offsetQolla(
      qoidaNarxi(k.qoida, k.eniM, k.boyiM, k.kurs ?? null),
      k.offset,
      k.kurs ?? null,
    );
  } catch (x) {
    return {
      sarf,
      narxQatorlari: [],
      olchov,
      bosqich,
      jami: null,
      xato: biznesXatosimi(x) ? x.message : 'Narxni hisoblab bo‘lmadi',
    };
  }

  const qatorlar: NarxQatori[] = [{ nom: 'Asosiy narx', summa: pulMatn(asosiy) }];

  for (const q of k.qoshimchalar) {
    qatorlar.push({
      nom: q.nom,
      summa: pulMatn(qoshimchaNarxi(q, k.eniM, k.boyiM, k.kurs ?? null)),
    });
  }

  /**
   * TZ 4.7 — xizmat haqi turga qo'yiladi va jamiga qo'shiladi.
   *
   * ⚠️ Nol bo'lsa QATOR YASALMAYDI: mijoz chekida «Xizmat haqi
   *    0 so'm» degan qator turishi ma'nosiz va savol tug'diradi.
   */
  const xizmat = k.xizmatHaqi === null ? nolSom() : som(k.xizmatHaqi);
  if (!nolmi(xizmat)) {
    qatorlar.push({ nom: 'Xizmat haqi', summa: pulMatn(xizmat) });
  }

  const bir = yigindi(
    nolSom(),
    qatorlar.map((q) => som(q.summa)),
  );
  const jami = k.soni > 1 ? kopaytir(bir, k.soni) : bir;

  return {
    sarf,
    narxQatorlari: qatorlar,
    olchov,
    bosqich,
    jami: pulMatn(jami),
    xato: null,
  };
}
