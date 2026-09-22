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
    sarflashBirligi: 'M',
    /**
     * ⚠️ 2026-09-22 — `true` EDI va bu XATO edi.
     *
     *    Kirim birligi ham, sarflash birligi ham METR: o'girish
     *    yo'q, koeffitsient doim 1. `true` turgani uchun material
     *    formasi «METR bo'lsa 100» deb maxsus shoxcha yozgan edi
     *    (santimetr davridan qolgan) va yangi metr materiali
     *    koeffitsient = 100 bilan saqlanardi. Keyin 50 m kirim
     *    omborga 5000 m bo'lib tushardi, metr tannarxi esa 100
     *    barobar kamayardi — va buni hech kim sezmasdi.
     *
     *    Bazadagi ikki materialda koeffitsient 1.0000 (0043 to'g'ri
     *    o'girgan), ya'ni zarar hali yetmagan: xato YANGI material
     *    ochilganda yoki eskisi qayta saqlanganda otardi.
     */
    ozgarishKerak: false,
    olchamliMi: false,
    narxBirligi: 'metr',
  },
  SHTANGA: {
    nom: 'Shtanga',
    hisobTuri: 'CHIZIQLI',
    kirimBirligi: 'shtanga',
    sarflashBirligi: 'M',
    ozgarishKerak: true,
    olchamliMi: false,
    narxBirligi: 'metr',
  },
  QUTI: {
    nom: 'Quti',
    hisobTuri: 'CHIZIQLI',
    kirimBirligi: 'quti',
    sarflashBirligi: 'M',
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
 * «Bitta shtanga necha metr material?» qatorining savoli.
 *
 * ⚠️ Q-01: koeffitsient = «1 kirim birligida nechta METR». 2026-09-20
 *    dan bazada ham metr — o'girish yo'q. Omborchi «3» deb yozadi va
 *    bazaga ham 3 tushadi.
 */
export function ozgarishSavoli(birlik: OlchovBirligi): string {
  const t = BIRLIK_TAVSIFI[birlik];
  return `Bitta ${t.kirimBirligi} necha metr material?`;
}

/**
 * «Bitta shtanga necha metr material?» degan kirish maydoni QAYSI
 * birlikda ko'rsatiladi.
 *
 * ⚠️ 2026-09-20 dan koeffitsient METRDA — o'girish yo'q, u yerda
 *    so'rashning ma'nosi yo'q (egasi: «1 metr necha metr» degan
 *    savol bema'niga o'xshaydi). Faqat SHTANGA va QUTI da kirim
 *    birligi metrdan farq qilishi mumkin — u yerda so'raladi.
 */
export function ozgarishKiritiladimi(birlik: OlchovBirligi): boolean {
  /**
   * ⚠️ METR uchun maxsus shoxcha bor edi — endi kerak emas:
   *    jadvalning o'zida `ozgarishKerak: false` turibdi. Ikki
   *    joyda ikki xil javob bo'lishi xatoning manbayi edi
   *    (forma koeffitsientni 100 deb yuborardi).
   */
  return BIRLIK_TAVSIFI[birlik].ozgarishKerak;
}

/**
 * Ekrandagi metrni bazadagi koeffitsientga o'giradi.
 *
 * ⚠️ 2026-09-20 — koeffitsient ENDI METRDA saqlanadi, shuning
 *    uchun bu ikki funksiya HECH NARSA O'ZGARTIRMAYDI. Ular
 *    ataylab qoldirildi: chaqiruv joylari (material formasi)
 *    o'zgarishsiz qoladi va agar kelajakda yana farq paydo
 *    bo'lsa, o'girish yana SHU YERDA bo'ladi — boshqa joyda emas.
 */
export function metrniKoeffitsientga(metr: string): string {
  const n = Number(metr);
  if (!Number.isFinite(n) || n <= 0) {
    throw new BiznesXato('KOEFFITSIENT_NOTOGRI', metr);
  }
  return String(n);
}

/** Bazadagi koeffitsientni ekrandagi metrga qaytaradi. */
export function koeffitsientniMetrga(koeffitsient: string): string {
  const n = Number(koeffitsient);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(n);
}

// ─── Q-10 · Kam qoldiq ogohlantirishi ─────────────────────────────────────

/**
 * Ostatka (yaroqsiz / kam ishlatiladigan) chegaralari SHU MAHSULOTGA
 * tegishlimi.
 *
 * ⚠️ Faqat METRLI mahsulotda ma'noli. Dona mexanizmda «yaroqsiz eni»
 *    degan narsa yo'q — u yo butun, yo yo'q. Egasi (2026-08-29):
 *    «mahsulot donaga bo'lsa yaroqsiz yoki ostatkalar yo'qoladi,
 *    faqat metrda bo'ladi».
 */
export function ostatkaChegarasiKerakmi(sarflashBirligi: string): boolean {
  return sarflashBirligi !== 'DONA';
}

/**
 * Q-10 — qoldiq chegaradan kam tushdimi.
 *
 * ⚠️ 2026-09-20 — chiziqli mahsulot ham METRDA saqlanadi, ya'ni
 *    miqdor va chegara ALLAQACHON bir birlikda. Ilgari bu yerda
 *    ÷100 turardi.
 *
 * ⚠️ Ustun nomi `kam_qoldiq_chegara_m` — «m» tarixiy nom. Dona
 *    mahsulotda u DONA saqlaydi. Ustunni qayta nomlash 40+ faylga
 *    tegadi, foydasi yo'q.
 */
export function kamQoldiqmi(
  sarflashBirligi: string,
  miqdor: number,
  chegara: number | null,
): boolean {
  if (chegara === null) return false;
  return miqdor < chegara;
}

/** Chegara qaysi birlikda yoziladi — ekrandagi yorliq uchun */
export function chegaraBirligi(sarflashBirligi: string): string {
  return sarflashBirligi === 'DONA' ? 'dona' : 'm';
}
