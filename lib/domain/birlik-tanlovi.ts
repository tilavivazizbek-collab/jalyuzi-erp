/**
 * lib/domain/birlik-tanlovi.ts — TZ 5.2 · 5.3 · Q-01
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 * Material kartochkasida uchta maydon turardi: «hisob turi»,
 * «kirim birligi», «sarflash birligi». Ular bir-biriga bog'liq —
 * noto'g'ri uchlik tanlansa (masalan rulon + dona + SM) material
 * hech qachon to'g'ri yechilmasdi, lekin buni forma ushlamasdi.
 *
 * Endi ekranda BITTA tanlov: «O'lchov birligi». Har tanlov
 * uchlikni SHU YERDA to'g'ri qo'yadi. Ekran nimani ko'rsatishini
 * ham shu fayl aytadi.
 *
 * ⚠️ Bazadagi uchta ustun O'ZGARMADI. Ular butun tizimda —
 *    kirimda, band qilishda, hisobotlarda — ishlatiladi. Bu fayl
 *    ular ustidagi soddalashtirilgan qatlam, o'rnini bosuvchi emas.
 */

import { BiznesXato } from '@/lib/xato';
import type { HisobTuri, SarflashBirligi } from '@/lib/sxema/material';

export const OLCHOV_BIRLIKLARI = [
  'RULON',
  'KV_M',
  'DONA',
  'METR',
  'SHTANGA',
  'QUTI',
] as const;

export type OlchovBirligi = (typeof OLCHOV_BIRLIKLARI)[number];

export interface BirlikTavsifi {
  readonly nom: string;
  /** Bazadagi `hisob_turi` */
  readonly hisobTuri: HisobTuri;
  /** Bazadagi `kirim_birligi` — ombor qanday qabul qiladi */
  readonly kirimBirligi: string;
  /** Bazadagi `sarflash_birligi` — buyurtmada qanday yechiladi */
  readonly sarflashBirligi: SarflashBirligi;
  /**
   * Kirim birligi sarflash birligidan farq qiladimi.
   *
   * ⚠️ `true` bo'lsa ekranda «1 shtanga = ___ metr» qatori chiqadi.
   *    Bu — koeffitsient, lekin bu so'z ekranda ISHLATILMAYDI:
   *    omborchi «koeffitsient» degan so'zni tushunmaydi, «1 shtanga
   *    necha metr» degan savolni esa darhol tushunadi.
   */
  readonly ozgarishKerak: boolean;
  /** Rulon — eni va bo'yi bilan keladi (Q-05) */
  readonly olchamliMi: boolean;
  /** Narx qaysi birlik uchun yoziladi (5.4) */
  readonly narxBirligi: string;
}

export const BIRLIK_TAVSIFI: Record<OlchovBirligi, BirlikTavsifi> = {
  RULON: {
    nom: 'Rulon',
    hisobTuri: 'RULON',
    kirimBirligi: 'rulon',
    sarflashBirligi: 'KV_M',
    ozgarishKerak: false,
    olchamliMi: true,
    narxBirligi: 'kv.m',
  },
  KV_M: {
    nom: 'Kvadrat metr',
    hisobTuri: 'KV_M',
    kirimBirligi: 'kv.m',
    sarflashBirligi: 'KV_M',
    ozgarishKerak: false,
    olchamliMi: false,
    narxBirligi: 'kv.m',
  },
  DONA: {
    nom: 'Dona',
    hisobTuri: 'DONA',
    kirimBirligi: 'dona',
    sarflashBirligi: 'DONA',
    ozgarishKerak: false,
    olchamliMi: false,
    narxBirligi: 'dona',
  },
  METR: {
    nom: 'Metr',
    hisobTuri: 'CHIZIQLI',
    kirimBirligi: 'metr',
    sarflashBirligi: 'SM',
    ozgarishKerak: true,
    olchamliMi: false,
    narxBirligi: 'metr',
  },
  SHTANGA: {
    nom: 'Shtanga',
    hisobTuri: 'CHIZIQLI',
    kirimBirligi: 'shtanga',
    sarflashBirligi: 'SM',
    ozgarishKerak: true,
    olchamliMi: false,
    narxBirligi: 'metr',
  },
  QUTI: {
    nom: 'Quti',
    hisobTuri: 'CHIZIQLI',
    kirimBirligi: 'quti',
    sarflashBirligi: 'SM',
    ozgarishKerak: true,
    olchamliMi: false,
    narxBirligi: 'metr',
  },
};

/**
 * Bazadagi uchlikdan ekrandagi bitta tanlovni topadi.
 *
 * ⚠️ Eski materiallar qo'lda kiritilgan birlik nomi bilan turishi
 *    mumkin («palka», «bobina»). Ular ro'yxatga tushmaydi —
 *    shuning uchun `null` qaytadi va ekran eski uchta maydonni
 *    ko'rsatadi. Ma'lumot YO'QOLMAYDI.
 */
export function birlikniTop(
  hisobTuri: string,
  kirimBirligi: string,
  sarflashBirligi: string,
): OlchovBirligi | null {
  const k = kirimBirligi.trim().toLowerCase();

  for (const b of OLCHOV_BIRLIKLARI) {
    const t = BIRLIK_TAVSIFI[b];
    if (
      t.hisobTuri === hisobTuri &&
      t.kirimBirligi === k &&
      t.sarflashBirligi === sarflashBirligi
    ) {
      return b;
    }
  }
  return null;
}

export function birlikTavsifi(birlik: string): BirlikTavsifi {
  const t = (BIRLIK_TAVSIFI as Record<string, BirlikTavsifi | undefined>)[birlik];
  if (t === undefined) throw new BiznesXato('BIRLIK_NOTOGRI', birlik);
  return t;
}

/**
 * «1 shtanga = ___ metr» qatorining savoli.
 *
 * ⚠️ Ekranda METRDA so'raladi, bazada esa SANTIMETRDA saqlanadi
 *    (Q-01: koeffitsient = 1 kirim birligida nechta sm). Omborchi
 *    «300» deb emas, «3» deb yozadi — u shunday o'ylaydi.
 */
export function ozgarishSavoli(birlik: OlchovBirligi): string {
  const t = BIRLIK_TAVSIFI[birlik];
  return `1 ${t.kirimBirligi} necha metr`;
}

/** Ekrandagi metrni bazadagi koeffitsientga (sm) o'giradi. */
export function metrniKoeffitsientga(metr: string): string {
  const n = Number(metr);
  if (!Number.isFinite(n) || n <= 0) {
    throw new BiznesXato('KOEFFITSIENT_NOTOGRI', metr);
  }
  return String(n * 100);
}

/** Bazadagi koeffitsientni ekrandagi metrga qaytaradi. */
export function koeffitsientniMetrga(koeffitsient: string): string {
  const n = Number(koeffitsient);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(n / 100);
}
