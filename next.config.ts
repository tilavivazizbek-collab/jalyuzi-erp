import type { NextConfig } from 'next';

const config: NextConfig = {
  // Dockerfile shu chiqishga tayanadi — §2.3 platformaga bog'lanmaslik tekshiruvi
  output: 'standalone',

  /**
   * ⚠️ `postgres` NODE kutubxonasi — u `net`, `tls`, `crypto` ga tayanadi
   *    va Edge muhitida ishlamaydi.
   *
   *    `instrumentation.ts` uni FAQAT Node da chaqiradi
   *    (`NEXT_RUNTIME` tekshiruvi bilan), lekin webpack dinamik
   *    importni baribir statik tahlil qiladi va Edge yig'masiga
   *    qo'shmoqchi bo'ladi. Natijada:
   *
   *      Module not found: Can't resolve 'net'
   *
   *    va butun sahifa 500 qaytaradi. Bu ro'yxat kutubxonani
   *    yig'madan tashqarida qoldiradi — Next.js ning shu holat
   *    uchun mo'ljallangan yo'li.
   */
  serverExternalPackages: ['postgres'],

  reactStrictMode: true,
  typescript: {
    // Xato yashirilmaydi — QISM 1 §5
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default config;
