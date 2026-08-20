/**
 * lib/db/schema/index.ts
 *
 * Barcha jadvallar shu yerdan chiqadi — `drizzle.config.ts` va `lib/db`
 * shu faylni o'qiydi.
 *
 * Jadvallar ro'yxati — QISM 3 §13. Bosqichma-bosqich to'ldiriladi:
 *   1-bosqich  asos + tizim (11 jadval)   ✅
 *   2-bosqich  spravochniklar (9)       ✅
 *   3-bosqich  ombor (10)               ✅  ← hozir
 *   ...
 *
 * ⚠️ Yangi jadval qo'shilsa BU YERGA ham qo'shiladi. `himoya.test.ts`
 *    bazadagi jadvallarni shu ro'yxat bilan solishtiradi: unutilgan
 *    eksport darhol qizil bo'ladi.
 */

export * from './ustunlar';
export * from './asos';
export * from './tizim';
export * from './spravochnik';
export * from './ombor';
