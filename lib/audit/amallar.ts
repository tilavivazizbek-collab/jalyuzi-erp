/**
 * lib/audit/amallar.ts — TZ 2.4 · QISM 1 §10 · AUDIT U-08
 *
 * Audit jurnaliga tushadigan amallar va yozuv yasash mantiqi.
 * Bu fayl bazaga tegmaydi — yozuvni tayyorlaydi, yozishni `lib/amal/` qiladi.
 *
 * TZ 2.4: «Har yozuvda: sana-vaqt, kim, nima, eski qiymat, yangi qiymat, sabab.»
 *
 * U-08 teskari qoidasi: quyidagi TURDAGI har qanday amal jurnalga tushadi —
 * storno · qo'lda korrektsiya · chegaradan oshish · hisobdan chiqarish ·
 * sozlama o'zgarishi · ruxsat o'zgarishi.
 */

/** TZ 2.4 da sanalgan amallar + §10 dagi turkumlar. */
export const AUDIT_AMALLARI = {
  STORNO: { nom: 'Storno', band: 'TZ 2.4, 12.15', sababMajburiy: true },
  NARX_QOLDA: { nom: "Narx qo'lda o'zgartirildi", band: 'TZ 2.4', sababMajburiy: false },
  CHEGIRMA_LIMITIDAN_OSHDI: {
    nom: 'Chegirma limitidan oshdi',
    band: 'TZ 2.4, 3.11',
    sababMajburiy: false,
  },
  QARZ_HISOBDAN_CHIQARILDI: {
    nom: 'Qarz hisobdan chiqarildi',
    band: 'TZ 2.4',
    sababMajburiy: true,
  },
  OMBORDAN_CHIQARILDI: {
    nom: 'Ombordan hisobdan chiqarildi',
    band: 'TZ 2.4, 7.9',
    sababMajburiy: true,
  },
  QOLDA_TUZATISH: { nom: "Qo'lda korrektsiya", band: 'TZ 2.4', sababMajburiy: true },
  RUXSAT_OZGARDI: { nom: "Ruxsat o'zgardi", band: 'TZ 2.4, 14.6', sababMajburiy: false },
  MAHSULOT_TURI_TAHRIRLANDI: {
    nom: 'Mahsulot turi tahrirlandi',
    band: 'TZ 2.4, 4.10',
    sababMajburiy: false,
  },
  KURS_OZGARDI: { nom: "Kurs o'zgardi", band: 'TZ 2.4, 14.5', sababMajburiy: false },
  MATERIAL_BIRLIGI_OZGARDI: {
    nom: "Material birligi o'zgardi",
    band: 'TZ 2.4, 5.3',
    sababMajburiy: true,
  },
  MIJOZ_NOFAOL: { nom: 'Mijoz nofaol qilindi', band: 'TZ 2.4, 6.7', sababMajburiy: false },

  // §10 U-08 — turkum sifatida qo'shilganlar
  CHEGARADAN_OSHDI: { nom: 'Chegaradan oshish', band: 'QISM 1 §10', sababMajburiy: false },
  SOZLAMA_OZGARDI: { nom: "Sozlama o'zgardi", band: 'QISM 1 §10, TZ 14', sababMajburiy: false },
  CHEK_CHOP: { nom: 'Chek chop etildi', band: 'TZ 8.9', sababMajburiy: false },
  KIRISH_BLOKLANDI: { nom: 'Hisob bloklandi', band: 'QISM 1 §8', sababMajburiy: false },
  PAROL_OZGARTIRILDI: { nom: "Parol o'zgartirildi", band: 'QISM 1 §8', sababMajburiy: false },
} as const satisfies Record<string, { nom: string; band: string; sababMajburiy: boolean }>;

export type AuditAmal = keyof typeof AUDIT_AMALLARI;

export const AUDIT_AMAL_KODLARI = Object.keys(AUDIT_AMALLARI) as AuditAmal[];

export function sababMajburiymi(amal: AuditAmal): boolean {
  return AUDIT_AMALLARI[amal].sababMajburiy;
}

// ─── Yozuv yasash ─────────────────────────────────────────────────────────

export type Qiymatlar = Readonly<Record<string, unknown>>;

export interface AuditYozuv {
  readonly xodimId: number;
  readonly filialId: number | null;
  readonly amal: AuditAmal;
  readonly obyektTuri: string;
  readonly obyektId: number;
  readonly eskiQiymat: Qiymatlar | null;
  readonly yangiQiymat: Qiymatlar | null;
  readonly izoh: string | null;
  readonly ip: string | null;
}

export interface YozuvKirishi {
  readonly xodimId: number;
  readonly filialId?: number | null;
  readonly amal: AuditAmal;
  readonly obyektTuri: string;
  readonly obyektId: number;
  readonly eski?: Qiymatlar;
  readonly yangi?: Qiymatlar;
  readonly izoh?: string;
  readonly ip?: string;
}

/**
 * Faqat O'ZGARGAN maydonlarni ajratib oladi.
 *
 * Butun qatorni ikki marta yozish jurnalni shishiradi va «nima o'zgardi»
 * degan savolga javob bermaydi — TZ 2.4 aynan shuni so'raydi.
 */
export function farqniAjrat(
  eski: Qiymatlar,
  yangi: Qiymatlar,
): { eski: Qiymatlar; yangi: Qiymatlar } {
  const kalitlar = new Set([...Object.keys(eski), ...Object.keys(yangi)]);
  const e: Record<string, unknown> = {};
  const y: Record<string, unknown> = {};

  for (const k of kalitlar) {
    if (!birXilmi(eski[k], yangi[k])) {
      e[k] = eski[k] ?? null;
      y[k] = yangi[k] ?? null;
    }
  }
  return { eski: e, yangi: y };
}

function birXilmi(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/** O'zgarish bo'lganmi — bo'lmasa jurnalga yozilmaydi. */
export function ozgarishBormi(eski: Qiymatlar, yangi: Qiymatlar): boolean {
  return Object.keys(farqniAjrat(eski, yangi).yangi).length > 0;
}

export type YozuvNatijasi =
  | { readonly holat: 'YOZILADI'; readonly yozuv: AuditYozuv }
  | { readonly holat: 'OZGARISH_YOQ' }
  | { readonly holat: 'SABAB_KERAK'; readonly amal: AuditAmal };

/**
 * Jurnal yozuvini tayyorlaydi.
 *
 * Sabab majburiy bo'lgan amallarda (storno, hisobdan chiqarish, qo'lda
 * korrektsiya) izohsiz yozuv qaytariladi — chaqiruvchi uni saqlamasligi
 * kerak. «Kim, nima, nega» dan biri yetishmasa jurnal savolga javob bermaydi.
 */
export function yozuvYasa(k: YozuvKirishi): YozuvNatijasi {
  if (sababMajburiymi(k.amal) && (k.izoh === undefined || k.izoh.trim() === '')) {
    return { holat: 'SABAB_KERAK', amal: k.amal };
  }

  let eski = k.eski ?? null;
  let yangi = k.yangi ?? null;

  if (k.eski !== undefined && k.yangi !== undefined) {
    if (!ozgarishBormi(k.eski, k.yangi)) {
      return { holat: 'OZGARISH_YOQ' };
    }
    const farq = farqniAjrat(k.eski, k.yangi);
    eski = farq.eski;
    yangi = farq.yangi;
  }

  return {
    holat: 'YOZILADI',
    yozuv: {
      xodimId: k.xodimId,
      filialId: k.filialId ?? null,
      amal: k.amal,
      obyektTuri: k.obyektTuri,
      obyektId: k.obyektId,
      eskiQiymat: eski,
      yangiQiymat: yangi,
      izoh: k.izoh?.trim() ?? null,
      ip: k.ip ?? null,
    },
  };
}
