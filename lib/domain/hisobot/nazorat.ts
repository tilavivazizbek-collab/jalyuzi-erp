/**
 * Nazorat — odatdan tashqari amallar. Moliya hisobotlari, 2026-10-12.
 *
 * ⚠️ AYBLOV EMAS (TZ 11.5.6, HISOBOTLAR-ISH §5.2): amal — fakt, yorliq
 *    emas. Shuning uchun bu yerda «shubhali», norma, chegara, reyting
 *    YO'Q; xodimlar ism bo'yicha saralanadi, son bo'yicha emas.
 *    Storno yoki qo'lda narx — ko'pincha to'g'ri ish; egasi faqat
 *    nima bo'lganini ko'rib turishi kerak.
 *
 * ⚠️ Bu yerda faqat GURUHLASH (sof funksiya). Hodisalar `hisobot/nazorat-malumot.ts`
 *    dan keladi — audit jurnali, kassa kuni va kassa yozuvlari.
 */

import Decimal from 'decimal.js';

export const NAZORAT_TURLARI = [
  'KASSA_STORNO',
  'KUN_FARQI',
  'KUN_QAYTA_OCHILDI',
  'TUNGI_KASSA',
  'BUYURTMA_BEKOR',
  'NARX_QOLDA',
  'CHEGIRMA_LIMITDAN',
  'HOLAT_QOLDA',
  'UMIDSIZ_QARZ',
  'OMBOR_STORNO',
  'ORQA_SANA_KIRIM',
  'RUXSAT_SOZLAMA',
  'KIRISH_BLOKLANDI',
] as const;
export type NazoratTuri = (typeof NAZORAT_TURLARI)[number];

export interface TurTavsifi {
  readonly nom: string;
  /** Nega ko'rib turish kerak — betaraf til */
  readonly izoh: string;
  readonly guruh: 'Kassa' | 'Savdo' | 'Ombor' | 'Tizim';
}

export const NAZORAT_TAVSIFI: Readonly<Record<NazoratTuri, TurTavsifi>> = {
  KASSA_STORNO: { guruh: 'Kassa', nom: 'Kassa yozuvi storno qilindi', izoh: 'Pul harakati teskari yozildi — sababi izohda' },
  KUN_FARQI: { guruh: 'Kassa', nom: 'Kun yopishda farq', izoh: 'Sanalgan pul hisoblangandan farq qildi (minus — kamomad)' },
  KUN_QAYTA_OCHILDI: { guruh: 'Kassa', nom: 'Yopilgan kun qayta ochildi', izoh: 'Yopilgan kun yozuvlari yana o‘zgarishi mumkin bo‘ldi' },
  TUNGI_KASSA: { guruh: 'Kassa', nom: 'Ish vaqtidan tashqari kassa yozuvi', izoh: '22:00 dan 07:00 gacha kiritilgan pul harakati' },
  BUYURTMA_BEKOR: { guruh: 'Savdo', nom: 'Buyurtma bekor qilindi', izoh: 'Summa — bekor qilingan buyurtmaga kelib tushgan pul' },
  NARX_QOLDA: { guruh: 'Savdo', nom: 'Narx qo‘lda o‘zgartirildi', izoh: 'Narx jadvaldagidan boshqa yozildi' },
  CHEGIRMA_LIMITDAN: { guruh: 'Savdo', nom: 'Chegirma limitdan oshdi', izoh: 'Sotuvchi limitidan katta chegirma berildi' },
  HOLAT_QOLDA: { guruh: 'Savdo', nom: 'Pozitsiya holati qo‘lda tuzatildi', izoh: 'Odatdagi ish oqimini chetlab o‘tildi' },
  UMIDSIZ_QARZ: { guruh: 'Savdo', nom: 'Mijoz qarzi hisobdan chiqarildi', izoh: 'Umidsiz qarz — korxona zarariga yozildi' },
  OMBOR_STORNO: { guruh: 'Ombor', nom: 'Ombor harakati storno / qo‘lda chiqarildi', izoh: 'Material qoldig‘i qo‘lda o‘zgardi' },
  ORQA_SANA_KIRIM: { guruh: 'Ombor', nom: 'Kirim orqa sana bilan kiritildi', izoh: 'Hujjat sanasidan 3 kundan ko‘p keyin kiritilgan' },
  RUXSAT_SOZLAMA: { guruh: 'Tizim', nom: 'Ruxsat, sozlama yoki parol o‘zgardi', izoh: 'Kim nimaga kira olishi o‘zgardi' },
  KIRISH_BLOKLANDI: { guruh: 'Tizim', nom: 'Kirish bloklandi', izoh: 'Ko‘p marta noto‘g‘ri parol terildi' },
};

export interface NazoratHodisasi {
  readonly turi: NazoratTuri;
  readonly sana: Date;
  readonly xodimId: number;
  readonly xodim: string;
  readonly tavsif: string;
  /** So'mdagi summa; ma'nosi turga bog'liq, yo'q bo'lsa `null` */
  readonly summa: string | null;
  readonly havola: string | null;
}

export interface TurXulosasi {
  readonly turi: NazoratTuri;
  readonly soni: number;
  /** Summalar yig'indisi — mutlaq qiymat (KUN_FARQI da minus ham bor) */
  readonly summa: string | null;
  /** Eng yangisi birinchi */
  readonly hodisalar: readonly NazoratHodisasi[];
}

export interface XodimQatori {
  readonly xodimId: number;
  readonly xodim: string;
  readonly soni: Readonly<Partial<Record<NazoratTuri, number>>>;
  readonly jami: number;
}

export interface NazoratXulosasi {
  /** NAZORAT_TURLARI tartibida, faqat hodisasi borlari */
  readonly turlar: readonly TurXulosasi[];
  /** Ism bo'yicha — son bo'yicha EMAS (reyting yo'q) */
  readonly xodimlar: readonly XodimQatori[];
  readonly jami: number;
}

export function nazoratniGuruhla(hodisalar: readonly NazoratHodisasi[]): NazoratXulosasi {
  const turlar: TurXulosasi[] = [];
  for (const turi of NAZORAT_TURLARI) {
    const h = hodisalar
      .filter((x) => x.turi === turi)
      .sort((a, b) => b.sana.getTime() - a.sana.getTime());
    if (h.length === 0) continue;
    const summali = h.filter((x) => x.summa !== null);
    turlar.push({
      turi,
      soni: h.length,
      summa:
        summali.length === 0
          ? null
          : summali.reduce((a, x) => a.plus(new Decimal(x.summa ?? '0').abs()), new Decimal(0)).toFixed(2),
      hodisalar: h,
    });
  }

  const xarita = new Map<number, { xodim: string; soni: Partial<Record<NazoratTuri, number>>; jami: number }>();
  for (const h of hodisalar) {
    const q = xarita.get(h.xodimId) ?? { xodim: h.xodim, soni: {}, jami: 0 };
    q.soni[h.turi] = (q.soni[h.turi] ?? 0) + 1;
    q.jami += 1;
    xarita.set(h.xodimId, q);
  }
  const xodimlar = [...xarita]
    .map(([xodimId, q]) => ({ xodimId, ...q }))
    .sort((a, b) => a.xodim.localeCompare(b.xodim, 'uz'));

  return { turlar, xodimlar, jami: hodisalar.length };
}
