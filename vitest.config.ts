import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Integratsiya testlari alohida to'plamda — vitest.baza.config.ts
    exclude: ['test/integratsiya/**'],
    // QISM 1 §19 — testlar ham Toshkent vaqtida ishlaydi
    env: {
      TZ: 'Asia/Tashkent',
    },
    coverage: {
      provider: 'v8',
      // §14.2 — sof mantiq qatlamlari. `lib/ruxsat/` ham bazaga tegmaydi.
      include: [
        'lib/domain/**/*.ts',
        'lib/ruxsat/**/*.ts',
        'lib/kirish/**/*.ts',
        'lib/audit/**/*.ts',
      ],
      /**
       * Bu ikkitasi Next.js ga bog'langan (`next/headers`, `next/navigation`)
       * va sof funksiya sifatida chaqirib bo'lmaydi — shuning uchun ular
       * o'lchovga kirmaydi.
       *
       * ⚠️ Ular sinalmagan degani EMAS, lekin hozircha AVTOMAT sinalmagan.
       * QISM 1 §14.2 ularni Playwright ga havola qiladi («Interfeys —
       * asosiy oqimlar Playwright da»). Qarz: docs/QARZLAR.md, T-01.
       */
      exclude: ['lib/kirish/cookie.ts', 'lib/kirish/joriy.ts'],
      reporter: ['text', 'html'],
      // QISM 1 §14.2 — sof mantiq qatlami 90% dan past bo'lmaydi
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
