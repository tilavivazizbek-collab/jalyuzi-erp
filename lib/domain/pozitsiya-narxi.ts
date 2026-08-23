/**
 * lib/domain/pozitsiya-narxi.ts — TZ 3.5 · 3.6 · 3.8 · 6.3 · Q-01
 *
 * Bitta pozitsiyaning narxini konstruktordan yig'adi.
 *
 * ⚠️ Bu yerda turgani bejiz emas. Narxni IKKI interfeys hisoblaydi —
 *    sotuv ekrani va Telegram bot (13.5). §2.2 «bir mantiq — bir
 *    joyda»: nusxa ko'chirilsa botda bir narx, saytda boshqa narx
 *    chiqardi va mijoz «botda boshqacha yozgan edi» derdi.
 *
 * ⚠️ Bazaga TEGMAYDI (§5.1) — narx, formula va o'lcham parametr
 *    bo'lib keladi.
 */

import { sm, type SarflashBirligi } from './birlik';
import { nolSom, pulMatn, som, type Som } from './pul';
import {
  aksessuarNarxi,
  matoNarxi,
  pozitsiyaNarxi,
  qatorSummasi,
  type Offset,
} from './narx';
import { sarflashHisobla, standartQiymatlar } from './formula';

export interface SlotKirishi {
  readonly nom: string;
  readonly formula: string;
  readonly sarflashBirligi: SarflashBirligi;
  /** Tanlangan matoning STANDART narxi; tanlanmagan bo'lsa `null` */
  readonly narx: string | null;
  /** TZ 3.6 — sotuvchi tuzatgan miqdor; narx SHUNGA tayanadi */
  readonly tuzatilganMiqdor?: number | null;
}

export interface AksessuarKirishi {
  readonly nom: string;
  readonly formula: string;
  readonly sarflashBirligi: SarflashBirligi;
  readonly narx: string | null;
  readonly majburiy: boolean;
  /** TZ 3.7 — qo'lda kiritilgan son formulani USTIDAN YOZMAYDI */
  readonly qoldaSoni?: number | null;
}

export interface NarxKirishi {
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly soni: number;
  readonly parametrlar: Readonly<Record<string, number>>;
  readonly slotlar: readonly SlotKirishi[];
  readonly aksessuarlar: readonly AksessuarKirishi[];
  /** TZ 6.3 — offset FAQAT matoga, aksessuarga tegmaydi */
  readonly offset: Offset | null;
  readonly xizmatHaqi: string | null;
}

export interface NarxQatori {
  readonly nom: string;
  readonly miqdor: number;
  readonly sarflashBirligi: SarflashBirligi;
  /** Offset qo'llangan birlik narxi */
  readonly birlikNarxi: string | null;
  readonly summa: string;
  readonly matomi: boolean;
}

export interface NarxNatijasi {
  readonly qatorlar: readonly NarxQatori[];
  readonly jami: string;
}

/**
 * TZ 3.8 — pozitsiya narxi:
 *
 * ```
 * Σ(slot sarflashi × o'sha slot matosining narxi)
 *   + Σ(aksessuar soni × narxi)
 *   + xizmat haqi
 * ```
 *
 * ⚠️ «Har slot O'Z narxi bilan hisoblanadi. Umumiy maydonni bitta
 *    mato narxiga ko'paytirish noto'g'ri — Dikke'da uch xil mato uch
 *    xil narxda.»
 *
 * ⚠️ TZ 6.3 — mijoz offseti **matoga** qo'llanadi, aksessuarga
 *    **tegmaydi**.
 *
 * ⚠️ Q-01 — chiziqli material smda sarflanadi, narxi 1 metr uchun.
 *    O'girish `qatorSummasi` ichida, bir joyda.
 */
export function pozitsiyaNarxiniHisobla(k: NarxKirishi): NarxNatijasi {
  const asos = standartQiymatlar(
    sm(k.eniSm),
    sm(k.boyiSm),
    k.soni,
    k.parametrlar,
  );

  const slotQatorlari: NarxQatori[] = k.slotlar.map((s) => {
    const hisoblangan = sarflashHisobla(s.formula, asos, s.sarflashBirligi);
    // TZ 3.6 — narx TUZATILGAN songa tayanadi
    const miqdor = s.tuzatilganMiqdor ?? hisoblangan;

    if (s.narx === null) {
      return {
        nom: s.nom,
        miqdor,
        sarflashBirligi: s.sarflashBirligi,
        birlikNarxi: null,
        summa: pulMatn(nolSom()),
        matomi: true,
      };
    }

    const birlikNarxi = matoNarxi({
      standart: som(s.narx),
      // Filial narxi SQL da hal qilingan (`COALESCE`) — 20.9
      filialNarxi: null,
      offset: k.offset,
      kurs: null,
    });

    return {
      nom: s.nom,
      miqdor,
      sarflashBirligi: s.sarflashBirligi,
      birlikNarxi: pulMatn(birlikNarxi),
      summa: pulMatn(
        qatorSummasi({
          nom: s.nom,
          sarflashBirligi: s.sarflashBirligi,
          miqdor: miqdor as never,
          narx: birlikNarxi,
        }),
      ),
      matomi: true,
    };
  });

  const aksessuarQatorlari: NarxQatori[] = k.aksessuarlar.map((a) => {
    const hisoblangan = sarflashHisobla(a.formula, asos, a.sarflashBirligi);
    // TZ 3.7 — qo'lda kiritilgan son formulani ustidan yozmaydi
    const miqdor = a.qoldaSoni ?? hisoblangan;

    if (a.narx === null) {
      return {
        nom: a.nom,
        miqdor,
        sarflashBirligi: a.sarflashBirligi,
        birlikNarxi: null,
        summa: pulMatn(nolSom()),
        matomi: false,
      };
    }

    // ⚠️ 6.3 — offset BERILMAYDI
    const birlikNarxi = aksessuarNarxi(som(a.narx), null);

    return {
      nom: a.nom,
      miqdor,
      sarflashBirligi: a.sarflashBirligi,
      birlikNarxi: pulMatn(birlikNarxi),
      summa: pulMatn(
        qatorSummasi({
          nom: a.nom,
          sarflashBirligi: a.sarflashBirligi,
          miqdor: miqdor as never,
          narx: birlikNarxi,
        }),
      ),
      matomi: false,
    };
  });

  const qatorlar = [...slotQatorlari, ...aksessuarQatorlari];

  const jami: Som = pozitsiyaNarxi(
    qatorlar.map((q) => ({
      nom: q.nom,
      sarflashBirligi: q.sarflashBirligi,
      miqdor: q.miqdor as never,
      narx: q.birlikNarxi === null ? nolSom() : som(q.birlikNarxi),
    })),
    k.xizmatHaqi === null ? null : som(k.xizmatHaqi),
  );

  return { qatorlar, jami: pulMatn(jami) };
}
