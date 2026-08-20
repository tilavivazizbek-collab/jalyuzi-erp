import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Baza integratsiya testlari — `npm run test:baza`
 *
 * `npm test` dan ALOHIDA turadi: u sof mantiqni tekshiradi va tarmoqsiz,
 * bazasiz, bir necha soniyada o'tadi. Bu yerdagilar esa haqiqiy bazaga
 * ulanadi va baza bilan kod CHEGARASINI sinaydi.
 *
 * Aynan shu chegarada ikki xato topilgan: P-13 (`BIGINT` matn bo'lib keldi)
 * va P-14 (sahifa chizilayotganda cookie yozilmadi). Ikkalasini ham sof
 * mantiq testlari ko'rmagan edi.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./test/integratsiya/muhit-yukla.ts'],
    include: ['test/integratsiya/**/*.test.ts'],
    env: { TZ: 'Asia/Tashkent' },
    // Bitta bazaga bir vaqtda yozilmasin — hisoblagich va sessiya
    // testlari bir-birini buzib qo'yadi
    fileParallelism: false,
    sequence: { concurrent: false },
    // ⚠️ Baza MASOFADA turibdi (10-bosqichgacha), har so'rov tarmoqdan
    //    o'tadi. Bitta test 10–15 ta so'rov yuboradi: kechikish sakraganda
    //    30 s yetmay qoldi va TO'G'RI ishlaydigan testlar «yiqildi».
    //    Limit tarmoqqa, kodga emas, moslangan — testning o'zi qisqartirilmadi.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
