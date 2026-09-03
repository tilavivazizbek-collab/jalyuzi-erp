/**
 * lib/domain/hisobot/ustama-eroziya.ts — TZ 11.7.5 · K-08
 *
 * «Ustama chegarasi kirim paytida ogohlantiradi (7.8), lekin BIR MARTA.
 *  Bu hisobot butun ro'yxatni ko'rsatadi va qaysi materialning narxini
 *  ko'tarish kerakligi bir ekranda ko'rinadi.»
 *
 * Formula 5.4 dagi bilan bir xil va shu yerda qayta yozilmaydi —
 * `narx.ustamaFoizi` chaqiriladi ("bir mantiq — bir joyda").
 *
 * ⚠️ Ikkala narx ham SO'MDA keladi. Katalog narxi dollarda bo'lsa,
 * chaqiruvchi uni `narx.katalogNarxiniSomga` bilan o'giradi — konversiya
 * kursni talab qiladi, kurs esa domain qatlamiga o'zi kelmaydi (1.3, §3.2).
 */

import Decimal from 'decimal.js';
import { type Som, kopaytir, nolmi, som } from '@/lib/domain/pul';
import { ustamaChegarasi, ustamaFoizi } from '@/lib/domain/narx';

/** Chegara belgilanmagan materialga qo'llanadigan standart ustama, 5.4. */
export const USTAMA_STANDART_CHEGARA = 30;

export interface EroziyaKirishi {
  readonly materialId: number;
  readonly nom: string;
  /** Joriy tannarx — 7.9 bo'yicha hisoblangan birlik tannarxi */
  readonly tannarx: Som;
  /** Katalogdagi sotuv narxi (so'mga keltirilgan) */
  readonly sotuvNarx: Som;
  /** Material kartochkasidagi shaxsiy chegara, bo'sh bo'lsa standart ishlaydi */
  readonly chegara: number | null;
}

export interface EroziyaQatori {
  readonly materialId: number;
  readonly nom: string;
  readonly tannarx: Som;
  readonly sotuvNarx: Som;
  /** Bir kasr xonasigacha — TZ 11.7.5 jadvalidagi ko'rinish (37.4%) */
  readonly ustamaFoiz: number;
  readonly chegara: number;
  readonly pastmi: boolean;
  /** Tannarx nol yoki sotuv narxi yo'q — ustama hisoblanmaydi */
  readonly hisoblanmadi: boolean;
}

export interface EroziyaHisoboti {
  /** Chegaradan pastlar birinchi, ular ichida eng past ustama tepada */
  readonly qatorlar: readonly EroziyaQatori[];
  readonly jamiSoni: number;
  readonly pastSoni: number;
  /** Hisoblab bo'lmaganlar — narxi yoki tannarxi yo'q materiallar */
  readonly hisoblanmaganSoni: number;
}

const birXona = (foiz: number): number => Math.round(foiz * 10) / 10;

/**
 * Bitta materialning ustamasi.
 *
 * Tannarx nol bo'lsa bo'linma yo'q (boshlang'ich qoldiq kiritilmagan
 * material shunday bo'ladi). Bunda 0% deb ko'rsatilmaydi — u «ustama yo'q»
 * degan noto'g'ri xulosa beradi; qator `hisoblanmadi` bo'lib ajratiladi.
 */
export function ustamaQatori(k: EroziyaKirishi): EroziyaQatori {
  const chegara = ustamaChegarasi(k.chegara, USTAMA_STANDART_CHEGARA);
  const hisoblanmadi = nolmi(k.tannarx) || nolmi(k.sotuvNarx);

  if (hisoblanmadi) {
    return {
      materialId: k.materialId,
      nom: k.nom,
      tannarx: k.tannarx,
      sotuvNarx: k.sotuvNarx,
      ustamaFoiz: 0,
      chegara,
      pastmi: false,
      hisoblanmadi: true,
    };
  }

  const ustamaFoiz = birXona(ustamaFoizi(k.sotuvNarx, k.tannarx));
  return {
    materialId: k.materialId,
    nom: k.nom,
    tannarx: k.tannarx,
    sotuvNarx: k.sotuvNarx,
    ustamaFoiz,
    chegara,
    pastmi: ustamaFoiz < chegara,
    hisoblanmadi: false,
  };
}

/**
 * Butun ro'yxat. Saralash: avval muammolilar (⚠️), ular ichida eng past
 * ustama tepada — 11.7.5 ning maqsadi shu, «qaysi narxni ko'tarish kerak»
 * bir qarashda ko'rinsin.
 */
export function ustamaEroziyasi(kirish: readonly EroziyaKirishi[]): EroziyaHisoboti {
  const qatorlar = kirish.map(ustamaQatori).sort((a, b) => {
    if (a.hisoblanmadi !== b.hisoblanmadi) return a.hisoblanmadi ? 1 : -1;
    if (a.pastmi !== b.pastmi) return a.pastmi ? -1 : 1;
    if (a.ustamaFoiz !== b.ustamaFoiz) return a.ustamaFoiz - b.ustamaFoiz;
    return a.nom.localeCompare(b.nom, 'uz');
  });

  return {
    qatorlar,
    jamiSoni: qatorlar.length,
    pastSoni: qatorlar.filter((q) => q.pastmi).length,
    hisoblanmaganSoni: qatorlar.filter((q) => q.hisoblanmadi).length,
  };
}

/**
 * Chegaraga yetish uchun sotuv narxi qancha bo'lishi kerak.
 *
 * Hisobotning amaliy qismi: «13.6% — kam» deyish yetarli emas, «35 000 emas,
 * 40 000 bo'lsin» deyilishi kerak. Natija 100 so'mgacha yaxlitlanmaydi —
 * bu tavsiya, narx emas; yaxlitlashni narx qo'yish oqimi qiladi (§3.3).
 */
export function kerakliNarx(tannarx: Som, chegaraFoiz: number): Som {
  if (nolmi(tannarx)) return som(0);
  const koeffitsient = new Decimal(1).plus(new Decimal(chegaraFoiz).div(100));
  return kopaytir(tannarx, koeffitsient.toString());
}
