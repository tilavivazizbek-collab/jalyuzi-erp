/**
 * app/(panel)/material/maydonlar.ts — forma qaysi maydonlarni yuboradi.
 *
 * ⚠️ Bu ro'yxat `lib/sxema/material.ts` dagi Zod sxemasi bilan MOS
 *    bo'lishi shart. Maydon sxemada bo'lib bu yerda bo'lmasa, u
 *    jimgina yo'qoladi: forma xatosiz saqlanadi, qiymat esa bazaga
 *    yetib bormaydi.
 *
 *    `test/sxema/material-maydonlari.test.ts` ikkalasini solishtiradi.
 *
 * ⚠️ Alohida faylda turadi, chunki `amal.ts` — `'use server'`.
 *    U yerdan oddiy massiv eksport qilib bo'lmaydi.
 */
export const MATERIAL_MAYDONLARI = [
  'nom',
  // Ta'minotchi artikuli — 0050
  'kod',
  'hisobTuri',
  'kirimBirligi',
  'sarflashBirligi',
  'koeffitsient',
  // ⚠️ `sotuvNarx` OLIB TASHLANDI (egasi, 2026-09-22) — narx `/narx` da
  // ⚠️ TANNARX EMAS (5.4) — kirimni oldindan to'ldirish uchun
  'kutilayotganKelishNarx',
  'kutilayotganKelishValyuta',
  'minUstamaFoiz',
  'yaroqsizChegaraM',
  'kamIshlatiladiganM',
  'kamQoldiqChegaraM',
  'standartRulonEniM',
  'odatdagiRulonBoyiM',
  'almashtirishGuruhId',
  /** Mato darajasi — mijoz narxi shundan (egasi qarori 2026-09-20) */
  'narxGuruhId',
  /** Tayyor mahsulot belgisi — sotuv narxini ochadi */
  'togridanSotiladi',
  'yaxlitlashQadami',
  // TZ 7.9 — kirimda narx bo'yiga yoki kv.m ga
  'kirimNarxAsosi',
  // Katalog rasmi — `data:` matn yoki `OCHIR` (3.3)
  'rasm',
];

/**
 * Narx va uning valyutasi — JUFTLIK.
 *
 * ⚠️ Valyuta ekranda alohida maydon EMAS: u narx katagining
 *    ichidagi tanlov. Shuning uchun uning nomi xato bo'lsa,
 *    xato hech qayerda ko'rinmaydi — forma jimgina rad etadi.
 *    2026-08-29 da aynan shu bo'ldi.
 *
 *    `test/sxema/material-maydonlari.test.ts` har juftlikning
 *    ikkala nomi ham sxemada borligini tekshiradi.
 */
export const NARX_MAYDONLARI = [
  /**
   * ⚠️ FAQAT KELISH NARXI QOLDI (egasi qarori 2026-09-22).
   *
   *    Sotuv narxi `/narx` → «Materialni o'zi sotish» jadvalidan
   *    keladi. Kelish narxi esa narx siyosati EMAS: u kirim
   *    formasini oldindan to'ldiradi va taxminiy ustamani
   *    ko'rsatadi, pul hisobiga tegmaydi.
   */
  { narx: 'kutilayotganKelishNarx', valyuta: 'kutilayotganKelishValyuta' },
] as const;
