/**
 * lib/db/ulanish.ts — QISM 1 §1.3, §6.2
 *
 * Postgres ulanishining YAGONA yasalish joyi. Har skript o'zicha
 * `postgres(url)` chaqirsa, tur o'girish sozlamalari har joyda har xil
 * bo'lib qoladi — quyidagi xato aynan shundan chiqqan edi.
 *
 * ⚠️ NIMA UCHUN BU FAYL BOR (QARORLAR-KOD P-13)
 *
 * postgres.js `BIGINT` (int8) ni MATN qilib qaytaradi — 64 bitli son
 * JavaScript `number` ga sig'masligi mumkin. Natijada:
 *
 *     xato_urinish = "1";   "1" + 1  →  "11"
 *
 * Hisoblagich 2-urinishdayoq 11 ga sakrab, xodim vaqtidan oldin bloklandi.
 *
 * Yechim: int8 shu yerda `number` ga o'giriladi va xavfsiz chegaradan
 * oshsa XATO OTILADI — jimgina aniqlik yo'qotilmaydi.
 *
 * Pul bunga tegishli emas: u `NUMERIC` da saqlanadi va MATN bo'lib keladi
 * (§1.3 — «Drizzle NUMERIC ni matn qilib qaytaradi, bu pul aniqligi uchun
 * to'g'ri xatti-harakat»). Uni `lib/domain/pul.ts` o'zi qabul qiladi.
 */

import postgres from 'postgres';

/** PostgreSQL `int8` tur raqami. */
const INT8_OID = 20;

/**
 * `BIGINT` → `number`.
 *
 * Loyihaning barcha `BIGSERIAL` kaliti va hisoblagichi 2^53 dan ancha kichik
 * (3 yilda ~50 000 buyurtma pozitsiyasi — QISM 1 §15). Shunga qaramay
 * chegara tekshiriladi: bir kun oshib ketsa xato otiladi, jim qolmaydi.
 */
const int8Number = {
  to: INT8_OID,
  from: [INT8_OID],
  serialize: (x: number | string | bigint): string => String(x),
  parse: (x: string): number => {
    const n = Number(x);
    if (!Number.isSafeInteger(n)) {
      throw new Error(
        `BIGINT qiymati JavaScript son chegarasidan oshdi: ${x}. ` +
          'lib/db/ulanish.ts ni ko\'ring (QARORLAR-KOD P-13).',
      );
    }
    return n;
  },
};

export type Ulanish = ReturnType<typeof postgres>;

export interface UlanishSozlamasi {
  readonly max?: number;
  readonly idleTimeout?: number;
}

export function ulanishYarat(url: string, sozlama: UlanishSozlamasi = {}): Ulanish {
  return postgres(url, {
    max: sozlama.max ?? 10,
    idle_timeout: sozlama.idleTimeout ?? 20,
    types: { bigint: int8Number },
  });
}
