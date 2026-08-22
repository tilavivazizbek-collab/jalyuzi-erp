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
      /**
       * `server-only` — Next.js beradigan qo'riqchi paket: kod brauzer
       * to'plamiga tushib qolsa qurishni yiqitadi. Ish vaqtida hech
       * narsa qilmaydi va npm da alohida o'rnatilmagan.
       *
       * `ekran-sorovlari.test.ts` ekran so'rovlarini bazada sinash
       * uchun `app/**\/malumot.ts` ni import qiladi — shuning uchun u
       * bo'sh modulga almashtiriladi.
       */
      'server-only': fileURLToPath(
        new URL('./test/integratsiya/server-only-orin.ts', import.meta.url),
      ),
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

    /**
     * ⚠️ Tarmoq uzilishi testni QAYTA yurgizadi (T-08).
     *
     * Baza masofada turibdi va uy tarmog'i kunda bir necha marta
     * uziladi: `ENOTFOUND`, `ECONNRESET`, `CONNECTION_CLOSED`. Bir
     * uzilish ~50 daqiqalik yurishni yo'q qiladi va SOG' kodni qizil
     * ko'rsatadi.
     *
     * Bu xatoni YASHIRMAYDI: haqiqiy xato uch marta ham yiqiladi.
     * Faqat o'tkinchi uzilish tuzaladi.
     *
     * Buni qilish mumkin, chunki QOIDALAR §6 bo'yicha har baza testi
     * **har yurishda** o'tishi shart — qat'iy id, qat'iy nom va
     * mutlaq `COUNT(*)` yo'q. Qayta yurgizish natijani o'zgartirmaydi.
     *
     * 10-bosqichda baza egasining serveriga ko'chadi va bu olib
     * tashlanadi.
     */
    retry: 2,
  },
});
