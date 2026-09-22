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
  /**
   * ⚠️ `QARZ_HISOBDAN_CHIQARILDI` EDI (2026-09-22 gacha) va u
   *    hech qachon yozilmagan: `umidsizQarz()` `UMIDSIZ_QARZ` deb
   *    yozadi. Ikki xil nom — ta'riflangani o'lik, yozilgani
   *    ro'yxatda yo'q edi. Haqiqiy nom qoldirildi: bazada
   *    allaqachon shu nomdagi yozuvlar turibdi va ularni
   *    o'zgartirish 2.3-invariantni buzardi.
   */
  UMIDSIZ_QARZ: {
    nom: 'Qarz hisobdan chiqarildi',
    band: 'TZ 2.4, 12.1',
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
  /**
   * ⚠️ Oldindan to'lov ALOHIDA tranzaksiyada yoziladi (sotuv ekrani).
   *    U yiqilsa buyurtma qoladi, pul esa kassada — tizimda yo'q.
   *    Ilgari sotuvchi buni BIR MARTA ekranda ko'rardi va tamom;
   *    kun yopilganda farq chiqar, sababi topilmasdi.
   */
  TOLOV_YOZILMADI: {
    nom: "Oldindan to'lov yozilmay qoldi",
    band: 'TZ 2.4, 12.5',
    sababMajburiy: false,
  },
  /**
   * ⚠️ 2026-09-22 — HISOBDAN CHIQARISH endi yoziladi.
   *
   *    §10 U-08 «hisobdan chiqarish» ni jurnalga tushishi shart
   *    deb sanaydi, lekin `nofaolQil()` hech narsa yozmasdi:
   *    material, mijoz, kassa, filial, xodim — hammasi IZSIZ
   *    o'chirilardi. `MIJOZ_NOFAOL` esa faqat mijozni nazarda
   *    tutgani uchun qolganini qoplay olmasdi.
   */
  NOFAOL_QILINDI: {
    nom: 'Ro‘yxatdan olib tashlandi',
    band: 'TZ 2.4, QISM 1 §10',
    sababMajburiy: false,
  },
  QAYTA_FAOLLASHTIRILDI: {
    nom: 'Ro‘yxatga qaytarildi',
    band: 'TZ 2.4, QISM 1 §10',
    sababMajburiy: false,
  },
  /** TZ 12.17 — yopilgan kunni admin qayta ochadi, sabab majburiy */
  KUN_QAYTA_OCHILDI: {
    nom: 'Kun qayta ochildi',
    band: 'TZ 2.4, 12.17',
    sababMajburiy: true,
  },
  KUN_YOPILDI: { nom: 'Kun yopildi', band: 'TZ 2.4, 12.17', sababMajburiy: false },
  /** Q-03 — material yetmagani BUYURTMA BERILAYOTGANDA bilinadi */
  SLOT_MATERIALI_YETMADI: {
    nom: 'Slot materiali yetmadi',
    band: 'TZ 2.4, 8.12',
    sababMajburiy: false,
  },
  AKSESSUAR_YETMADI: {
    nom: 'Aksessuar yetmadi',
    band: 'TZ 2.4, 8.12',
    sababMajburiy: false,
  },
  /** TZ 7.4 — butun rulon ochildi, endi u «ochilgan» hisoblanadi */
  RULON_OCHILDI: { nom: 'Rulon ochildi', band: 'TZ 2.4, 7.4', sababMajburiy: false },

  // ─── Amalda yoziladigan, lekin 2026-09-22 gacha ro'yxatda bo'lmagan kodlar ──
  //
  // ⚠️ Ro'yxat TZ 2.4 dagi 11 amaldan boshlangan va shu holicha
  //    qolgan edi. Kod esa o'sib borgan: har yangi tranzaksiya
  //    audit yozuvini ODDIY MATN bilan yozgan. Natijada ro'yxat
  //    bilan haqiqat ajralib ketdi va terish xatosi hech qanday
  //    xato bermasdi. `yozilgan-amallar.test.ts` endi buni
  //    ushlaydi — shuning uchun ro'yxat TO'LIQ bo'lishi shart.

  YARATISH: { nom: 'Yaratildi', band: 'TZ 2.4', sababMajburiy: false },
  TAHRIRLASH: { nom: 'Tahrirlandi', band: 'TZ 2.4', sababMajburiy: false },
  BEKOR: { nom: 'Bekor qilindi', band: 'TZ 2.4, 8.8', sababMajburiy: false },
  TASDIQLASH: { nom: 'Tasdiqlandi', band: 'TZ 2.4, 8.2', sababMajburiy: false },

  // Buyurtma va ishlab chiqarish
  POZITSIYA_QOSHILDI: {
    nom: "Pozitsiya qo'shildi",
    band: 'TZ 2.4, 8.16',
    sababMajburiy: false,
  },
  NARX_OZGARTIRISH: { nom: "Narx o'zgartirildi", band: 'TZ 2.4, 8.16', sababMajburiy: true },
  HOLAT_QOLDA_TUZATILDI: {
    nom: "Holat qo'lda tuzatildi",
    band: 'TZ 2.4, 8.15',
    sababMajburiy: true,
  },
  ISH_OLINDI: { nom: 'Usta ishni oldi', band: 'TZ 2.4, 13.5', sababMajburiy: false },
  ISH_QAYTARIB_OLINDI: {
    nom: 'Ish ustadan qaytarib olindi',
    band: 'TZ 2.4, 13.5',
    sababMajburiy: true,
  },
  TUGATDIM: { nom: 'Usta tugatdi', band: 'TZ 2.4, 13.6', sababMajburiy: false },
  TOPSHIRISH: { nom: 'Mijozga topshirildi', band: 'TZ 2.4, 8.7', sababMajburiy: false },
  QAYTARISH: { nom: 'Mijoz qaytardi', band: 'TZ 2.4, 8.13', sababMajburiy: true },
  RAD_ETISH: { nom: 'Mijoz rad etdi', band: 'TZ 2.4, 8.13', sababMajburiy: true },

  // Qayta kesish (8.17)
  QAYTA_KESISH_SOROVI: {
    nom: "Qayta kesish so'raldi",
    band: 'TZ 2.4, 8.17',
    sababMajburiy: true,
  },
  QAYTA_KESISH_TASDIQ: {
    nom: 'Qayta kesish tasdiqlandi',
    band: 'TZ 2.4, 8.17',
    sababMajburiy: false,
  },
  QAYTA_KESISH_RAD: {
    nom: 'Qayta kesish rad etildi',
    band: 'TZ 2.4, 8.17',
    sababMajburiy: true,
  },

  // Ombor va filiallararo
  KOCHIRISH_JONATILDI: {
    nom: "Ko'chirish jo'natildi",
    band: 'TZ 2.4, 20.7',
    sababMajburiy: false,
  },
  KOCHIRISH_QABUL: {
    nom: "Ko'chirish qabul qilindi",
    band: 'TZ 2.4, 20.7',
    sababMajburiy: false,
  },
  KOCHIRISH_BEKOR: {
    nom: "Ko'chirish bekor qilindi",
    band: 'TZ 2.4, 20.7',
    sababMajburiy: true,
  },
  YETIB_KELDI: { nom: 'Yetib keldi', band: 'TZ 2.4, 20.8', sababMajburiy: false },
  YAKUNLASH: { nom: 'Yakunlandi', band: 'TZ 2.4, 7.10', sababMajburiy: false },
  QARZ_OTKAZISH: {
    nom: "Filiallararo qarz o'tkazildi",
    band: 'TZ 2.4, 22.3',
    sababMajburiy: false,
  },
  FILIAL_TOLOV: { nom: "Filiallararo to'lov", band: 'TZ 2.4, 22.3', sababMajburiy: false },

  // Spravochnik va sozlash
  STAVKA: { nom: 'Usta stavkasi belgilandi', band: 'TZ 2.4, 13.2', sababMajburiy: false },
  STAVKA_OCHIRISH: {
    nom: "Usta stavkasi o'chirildi",
    band: 'TZ 2.4, 13.2',
    sababMajburiy: false,
  },
  DAVO_HAL: { nom: "Yetkazuvchi da'vosi hal qilindi", band: 'TZ 2.4, 9.8', sababMajburiy: false },
  BOT_BOGLANDI: { nom: "Telegram hisobi bog'landi", band: 'TZ 2.4, 13.4', sababMajburiy: false },

  // §10 U-08 — turkum sifatida qo'shilganlar
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
