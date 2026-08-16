import { defineConfig } from 'drizzle-kit';

// QISM 1 §6.8 — migratsiya faqat drizzle-kit orqali, fayl sifatida, git da.
// Qo'lda ALTER TABLE taqiqlanadi.
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema/*.ts',
  out: './lib/db/migratsiya',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://jalyuzi:jalyuzi@localhost:5432/jalyuzi',
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
