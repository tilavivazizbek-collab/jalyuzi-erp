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
];
