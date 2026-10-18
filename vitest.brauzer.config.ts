import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Brauzer testlari — `npm run test:brauzer` (T-01, QISM 1 §14.2)
 *
 * Next.js qatlamining o'zini sinaydi: cookie, redirect, server amali.
 * `test:baza` buni ko'rmaydi — u `kir()` ni to'g'ridan-to'g'ri chaqiradi.
 *
 * ⚠️ Sayt OLDINDAN ishga tushirilgan bo'lishi kerak va SINOV bazasiga
 *    ulangan bo'lishi kerak (test o'z xodimlarini o'sha bazaga yozadi):
 *
 *      DATABASE_URL=<sinov> npx next dev -p 3001
 *      BRAUZER_URL=http://localhost:3001 TEST_DATABASE_URL=<sinov> npm run test:brauzer
 *
 * Brauzer yuklab olinmaydi — tizimdagi Chrome (`playwright-core`, channel chrome).
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['test/brauzer/**/*.test.ts'],
    env: { TZ: 'Asia/Tashkent' },
    fileParallelism: false,
    sequence: { concurrent: false },
    // Dev server sahifani birinchi ochilishda kompilyatsiya qiladi
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
