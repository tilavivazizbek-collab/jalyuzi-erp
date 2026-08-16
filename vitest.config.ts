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
    // QISM 1 §19 — testlar ham Toshkent vaqtida ishlaydi
    env: {
      TZ: 'Asia/Tashkent',
    },
    coverage: {
      provider: 'v8',
      // §14.2 — sof mantiq qatlamlari. `lib/ruxsat/` ham bazaga tegmaydi.
      include: ['lib/domain/**/*.ts', 'lib/ruxsat/**/*.ts', 'lib/kirish/**/*.ts'],
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
