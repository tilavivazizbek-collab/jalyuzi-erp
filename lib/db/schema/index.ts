/**
 * lib/db/schema/index.ts
 *
 * Barcha jadvallar shu yerdan chiqadi — `drizzle.config.ts` va `lib/db`
 * shu faylni o'qiydi.
 *
 * Jadvallar ro'yxati — QISM 3 §13. Bosqichma-bosqich to'ldiriladi:
 *   1-bosqich  asos + tizim (11 jadval)   ← hozir
 *   2-bosqich  spravochniklar (9)
 *   3-bosqich  ombor (8)
 *   ...
 */

export * from './ustunlar';
export * from './asos';
export * from './tizim';
