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
  'hisobTuri',
  'kirimBirligi',
  'sarflashBirligi',
  'koeffitsient',
  'sotuvNarx',
  'sotuvValyuta',
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
  'yaxlitlashQadami',
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
  { narx: 'sotuvNarx', valyuta: 'sotuvValyuta' },
  { narx: 'kutilayotganKelishNarx', valyuta: 'kutilayotganKelishValyuta' },
] as const;
