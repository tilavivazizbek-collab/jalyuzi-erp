/**
 * lib/domain/filial-hisob.ts — TZ 22 · 20.17 · Q-33, Q-34, Q-35
 *
 * Filiallararo hisob-kitob. **Bazaga tegmaydi** (QISM 1 §5.1).
 *
 * Uchinchi qarz turi: mijoz va yetkazib beruvchi qarzidan keyin.
 * 2.2-invariant bu yerda ham amal qiladi — balans SAQLANMAYDI,
 * harakatlardan `SUM()` bilan chiqadi.
 *
 * ⚠️ 22.7.3 — «Filiallararo qarz foyda-zararga TEGMAYDI.» Bu korxona
 *    ichidagi harakat: xarajat ham, daromad ham emas.
 */

import {
  ayir,
  bol,
  kattami,
  manfiy,
  manfiymi,
  nolmi,
  nolSom,
  qosh,
  som,
  yigindi,
  type Som,
} from './pul';
import { BiznesXato } from '@/lib/xato';

// ─── 22.9.1 · filial_harakat turlari ──────────────────────────────────────

export const FILIAL_HARAKAT_TURLARI = [
  'TAYYOR_MAHSULOT',
  'MATERIAL_KOCHIRISH',
  'PUL_TOPSHIRISH',
  'TOLOV',
  'QAYTARISH',
  'QOLDA_TUZATISH',
] as const;

export type FilialHarakatTuri = (typeof FILIAL_HARAKAT_TURLARI)[number];

// ─── 20.17 · Foyda taqsimoti ──────────────────────────────────────────────

/**
 * TZ 20.17.1 — sotgan va tikkan filial har xil bo'lsa foyda **50/50**.
 *
 * ⚠️ 20.17.2 — «pul hech qayerga ko'chmaydi». Bu faqat hisobot uchun
 *    taqsimot usuli.
 */
export const FOYDA_ULUSHI = '0.5';

export interface BuyurtmaNatijasi {
  /** Mijozdan olingan summa — sotgan filial kassasida */
  readonly tushum: Som;
  /** Material tannarxi — tikkan filial omboridan */
  readonly tannarx: Som;
  /** Usta haqi — tikkan filial to'laydi */
  readonly ishHaqi: Som;
}

/** Foyda = tushum − tannarx − ish haqi. Manfiy bo'lishi mumkin (3.15.4). */
export function foyda(n: BuyurtmaNatijasi): Som {
  return ayir(ayir(n.tushum, n.tannarx), n.ishHaqi);
}

/** 20.17.1 — bir filial sotdi va tikdi bo'lsa 100% o'sha filialda. */
export function foydaUlushi(n: BuyurtmaNatijasi, bittaFilialmi: boolean): Som {
  const f = foyda(n);
  return bittaFilialmi ? f : bol(f, 2);
}

// ─── 22.3 · Tayyor mahsulot qarzi ─────────────────────────────────────────

export interface TayyorMahsulotQarzi {
  /** Sotgan filial tikkan filialga qancha beradi */
  readonly qarz: Som;
  /** Formula bergan summa — chegara qo'llanmasdan oldin */
  readonly formulaBoyicha: Som;
  /** 22.3.3 — tushum chegarasi ishlaganmi */
  readonly tushumChegarasi: boolean;
  /** Sotgan filialda qoladigan summa */
  readonly sotgandaQoladi: Som;
}

/**
 * TZ 22.3.1 (Q-33) — qarz = tannarx + ish haqi + tikkan filial foyda ulushi.
 *
 * ```
 * Tushum      678 400
 * Tannarx   − 312 000
 * Ish haqi  −  57 600
 * Foyda       308 800  → har filialga 154 400
 *
 * Qarz: 312 000 + 57 600 + 154 400 = 524 000
 * ```
 *
 * ⚠️ 22.3.3 — zarar bo'lsa qarz **tushumdan oshmaydi**:
 *    `qarz = MIN(tannarx + ish haqi + ulush, tushum)`.
 *    Aks holda sotgan filial o'z cho'ntagidan to'lardi.
 */
export function tayyorMahsulotQarzi(n: BuyurtmaNatijasi): TayyorMahsulotQarzi {
  const ulush = foydaUlushi(n, false);
  const formulaBoyicha = qosh(qosh(n.tannarx, n.ishHaqi), ulush);

  const chegara = kattami(formulaBoyicha, n.tushum);
  const qarz = chegara ? n.tushum : formulaBoyicha;

  return {
    qarz,
    formulaBoyicha,
    tushumChegarasi: chegara,
    sotgandaQoladi: ayir(n.tushum, qarz),
  };
}

/**
 * TZ 22.3.4 · EC-FQ-01 — buyurtma qaytarilsa qarz **qayta hisoblanadi**.
 *
 * Sodda «teskari yozuv» yetarli emas: mijozga hamma pul qaytmaydi,
 * **ushlab qolingan summa** (8.10) korxonada qoladi va u ham 50/50
 * bo'linishi kerak (20.17.1).
 *
 * Yechim — qarzni **ushlanmani tushum deb** qayta hisoblash:
 *
 * ```
 * Buyurtma 678 400 · tannarx 312 000 · ish haqi 57 600
 * Yozilgan qarz                                   524 000
 *
 * Mijozga 600 000 qaytarildi, ushlab qolindi       78 400
 *
 * Yangi hisob: tushum = 78 400
 *   zarar          78 400 − 369 600 = −291 200
 *   har filialga                      −145 600
 *   formula        369 600 − 145 600 =  224 000
 *   22.3.3 chegarasi: MIN(224 000, 78 400) = 78 400
 *
 * Teskari yozuv: 78 400 − 524 000 = −445 600
 * ```
 *
 * ⚠️ 22.3.3 chegarasi shu yerda ham ishlaydi: sotgan filial ushlab
 *    qolganidan ko'pini bermaydi — aks holda u o'z cho'ntagidan
 *    to'lardi. Qolgan zararni tikkan filial ko'taradi, chunki xarajat
 *    unda sodir bo'lgan. Teng bo'lish kerak bo'lsa — admin qo'lda
 *    tuzatish yozadi (EC-FQ-10).
 */
export function qaytarishQarzi(
  yozilganQarz: Som,
  ushlabQolindi: Som,
  n: Omit<BuyurtmaNatijasi, 'tushum'>,
): { readonly yangiQarz: Som; readonly teskari: Som } {
  const yangi = tayyorMahsulotQarzi({
    tushum: ushlabQolindi,
    tannarx: n.tannarx,
    ishHaqi: n.ishHaqi,
  });

  return {
    yangiQarz: yangi.qarz,
    teskari: ayir(yangi.qarz, yozilganQarz),
  };
}

// ─── 22.6 · Filial balansi ────────────────────────────────────────────────

export interface FilialHarakati {
  readonly kimdanFilialId: number;
  readonly kimgaFilialId: number;
  readonly turi: FilialHarakatTuri;
  /** So'mda, `NUMERIC` matni */
  readonly summa: string;
}

/**
 * TZ 22.6.1 — bitta filialning boshqa filial bilan balansi.
 *
 * Manfiy — **biz qarzdormiz**, musbat — **bizga qarzdor**.
 *
 * ⚠️ 2.2-invariant: hech qayerda saqlanmaydi, har safar qaytadan
 *    hisoblanadi.
 */
export function filialBalansi(
  filialId: number,
  harakatlar: readonly FilialHarakati[],
): Som {
  return yigindi(
    nolSom(),
    harakatlar.map((h) => {
      if (h.kimdanFilialId === filialId) return manfiy(som(h.summa));
      if (h.kimgaFilialId === filialId) return som(h.summa);
      return nolSom();
    }),
  );
}

export interface JuftBalans {
  readonly filialId: number;
  readonly balans: Som;
}

/** 22.6.1 — filialning har juftlik bo'yicha balansi, keyin sof balans. */
export function balansJadvali(
  filialId: number,
  harakatlar: readonly FilialHarakati[],
): { readonly juftlar: readonly JuftBalans[]; readonly sof: Som } {
  const yigma = new Map<number, Som>();

  for (const h of harakatlar) {
    const boshqa =
      h.kimdanFilialId === filialId
        ? h.kimgaFilialId
        : h.kimgaFilialId === filialId
          ? h.kimdanFilialId
          : null;
    if (boshqa === null) continue;

    const ozgarish =
      h.kimdanFilialId === filialId ? manfiy(som(h.summa)) : som(h.summa);
    yigma.set(boshqa, qosh(yigma.get(boshqa) ?? nolSom(), ozgarish));
  }

  const juftlar = [...yigma.entries()]
    .map(([id, balans]) => ({ filialId: id, balans }))
    .sort((a, b) => a.filialId - b.filialId);

  return {
    juftlar,
    sof: yigindi(
      nolSom(),
      juftlar.map((j) => j.balans),
    ),
  };
}

/**
 * TZ 22.9.4 — **11-invariant**: barcha filial balanslari yig'indisi 0.
 * Har qarz ikki tomonlama yozilgani uchun boshqacha bo'lishi mumkin emas.
 */
export function balanslarNolmi(
  filialIdlar: readonly number[],
  harakatlar: readonly FilialHarakati[],
): boolean {
  return nolmi(
    yigindi(
      nolSom(),
      filialIdlar.map((f) => filialBalansi(f, harakatlar)),
    ),
  );
}

// ─── 22.4 · Material ko'chirish qarzi ─────────────────────────────────────

export interface KochirishQatori {
  readonly bolakId: number;
  /** Bo'lakning kirimdagi tannarxi — 20.7.3, o'zgarmaydi */
  readonly tannarxSumma: Som;
}

/**
 * TZ 22.4.1 (Q-35) — ko'chirish qarzi **tannarx bo'yicha**.
 *
 * ⚠️ 22.4.2 — ichki ustama QO'YILMAYDI: aks holda mato hali sotilmagan
 *    bo'lsa ham korxona darajasida soxta foyda paydo bo'ladi.
 */
export function kochirishQarzi(qatorlar: readonly KochirishQatori[]): Som {
  return yigindi(
    nolSom(),
    qatorlar.map((q) => q.tannarxSumma),
  );
}

/**
 * TZ 22.4.1 · EC-FQ-06 — omborchi summani o'zgartira oladi (0 ham),
 * lekin **sabab majburiy** va audit jurnaliga tushadi (2.4).
 */
export function qoldaQarzniTekshir(qolda: Som, sabab: string): void {
  if (sabab.trim() === '') {
    throw new BiznesXato('KOCHIRISH_SABAB_KERAK', "qarz summasi qo'lda");
  }
  if (manfiymi(qolda)) {
    throw new BiznesXato('TOLOV_MANFIY', "ko'chirish qarzi");
  }
}
