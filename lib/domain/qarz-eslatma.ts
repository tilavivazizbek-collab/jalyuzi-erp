/**
 * lib/domain/qarz-eslatma.ts — mijozga avtomatik qarz eslatmasi (TZ 13.6,
 * LOYIHA T-06). Sof qaror — bazaga tegmaydi. 2026-10-14
 *
 * ⚠️ FAQAT MUDDATI O'TGAN qarzga: muddat qo'yilmagan yoki hali kelmagan
 *    qarz uchun mijozga xabar ketmaydi (`muddatOtganQarz` — kartochka va
 *    qarzdorlar ro'yxati bilan bitta hisob).
 * ⚠️ BEZOR QILMASLIK: oxirgi eslatmadan (qo'lda yoki avtomatik) `takrorKun`
 *    o'tmaguncha yangisi yo'q.
 * ⚠️ `birinchiKun = 0` — avtomatik eslatma O'CHIQ.
 */

export interface QarzEslatmaQoidasi {
  /** Muddatdan necha kun o'tgach birinchi eslatma; 0 — o'chiq */
  readonly birinchiKun: number;
  /** Keyingi eslatmalar orasidagi kun */
  readonly takrorKun: number;
}

export const STANDART_QARZ_ESLATMA: QarzEslatmaQoidasi = { birinchiKun: 3, takrorKun: 7 };

/**
 * @param kechikishKun muddatdan necha kun o'tgan (eng eski ochiq qarz); `null` — muddati o'tgan qarz yo'q
 * @param oxirgiEslatmadanKun oxirgi eslatmadan beri kun; `null` — hech yuborilmagan
 */
export function qarzEslatmaKerakmi(
  q: QarzEslatmaQoidasi,
  kechikishKun: number | null,
  oxirgiEslatmadanKun: number | null,
): boolean {
  if (q.birinchiKun <= 0) return false;
  if (kechikishKun === null || kechikishKun < q.birinchiKun) return false;
  return oxirgiEslatmadanKun === null || oxirgiEslatmadanKun >= q.takrorKun;
}

/** Sozlama tekshiruvi: butun kun, 0…90 va 1…90 */
export function qarzEslatmaQoidasiniTekshir(birinchi: string, takror: string): QarzEslatmaQoidasi | null {
  if (!/^\d{1,2}$/.test(birinchi.trim()) || !/^\d{1,2}$/.test(takror.trim())) return null;
  const b = Number(birinchi.trim());
  const t = Number(takror.trim());
  if (b > 90 || t < 1 || t > 90) return null;
  return { birinchiKun: b, takrorKun: t };
}
