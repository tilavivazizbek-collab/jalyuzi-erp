// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * QISM 1 §2.1 — «Har invariant kodda». Hujjatdagi jumla yetarli emas,
 * shuning uchun quyidagi qoidalar linterda ushlanadi:
 *
 *   §5.1  qatlamlar    lib/domain/ bazaga tegmaydi
 *   §2.3  platforma    Vercel / Neon SDK lari import qilinmaydi
 *   §3.1  pul          parseFloat bilan pul o'qilmaydi
 *   CLAUDE.md §5       any · @ts-ignore · keraksiz eslint-disable taqiq
 */
export default defineConfig([
  globalIgnores(['node_modules/**', '.next/**', 'coverage/**', 'next-env.d.ts']),

  tseslint.configs.strictTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // tsconfig ga kirmaydigan sozlama fayllari
          allowDefaultProject: ['*.mjs', '*.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      // Keraksiz `eslint-disable` ning o'zi xato hisoblanadi
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          // @ts-expect-error faqat tur testlarida — u kutilgan xatoni ISBOTLAYDI
          'ts-expect-error': 'allow-with-description',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: false, allowBoolean: false },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@vercel/*', '@neondatabase/*'],
              message:
                "QISM 1 §2.3 — platformaga bog'lanish taqiqlanadi. Oddiy Postgres va jadval ishlating.",
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Pul uchun lib/domain/pul.ts ishlating (§3.1).' },
      ],
      eqeqeq: ['error', 'always'],
    },
  },

  // §5.1 — sof mantiq qatlami bazaga TEGMAYDI
  {
    files: ['lib/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/db',
                '**/db/**',
                '**/muhit',
                'drizzle-orm',
                'drizzle-orm/**',
                'postgres',
                'next',
                'next/**',
                'react',
                'react/**',
              ],
              message:
                "QISM 1 §5.1 — lib/domain/ bazaga va freymvorkka tegmaydi. Ma'lumot parametr bo'lib kelsin.",
            },
          ],
        },
      ],
    },
  },

  // Testlarda kutilgan xatoni ko'rsatish uchun yumshoqroq qoidalar
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },

  // Tur testlari ATAYLAB noto'g'ri kod yozadi — har qatorda `@ts-expect-error`.
  // Linter ularni xato deb sanashi kerak emas: aynan shu xatolar isbot bo'lib
  // xizmat qiladi. Bu inline `eslint-disable` emas, fayl darajasidagi qoida.
  {
    files: ['test/**/*.tur-test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
]);
