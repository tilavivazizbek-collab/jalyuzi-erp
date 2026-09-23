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

  /**
   * EDGE YIG'MASIDAN NODE MODULLARINI CHIQARIB TASHLASH — 2026-09-23.
   *
   * ⚠️ `serverExternalPackages` FAQAT Node serveriga tegishli.
   *    `next dev` esa `instrumentation.ts` ni EDGE uchun ham yig'adi
   *    va o'sha yerda yana o'sha xato chiqadi:
   *
   *      Module not found: Can't resolve 'net'
   *
   *    Dev rejimida bitta yig'ish xatosi BUTUN saytni yiqitadi —
   *    har sahifa 500 qaytaradi, jumladan `/kirish`. Ya'ni loyihani
   *    brauzerda ochib ko'rishning umuman iloji yo'q edi.
   *    `npm run build` esa o'tib ketardi, chunki u edge yig'masini
   *    boshqacha ko'radi — shuning uchun xato uzoq sezilmadi.
   *
   * ⚠️ Bu YASHIRISH EMAS. `instrumentation.ts` da baza import
   *    qilinishidan oldin `NEXT_RUNTIME !== 'nodejs'` tekshiruvi
   *    turadi, ya'ni bu kod Edge da HECH QACHON ishlamaydi. Faqat
   *    webpack shuni statik tahlilda ko'ra olmaydi. `false` —
   *    webpackning shu holat uchun mo'ljallangan yo'li: modul
   *    bo'sh qilib qo'yiladi.
   */
  webpack: (config: { resolve?: { fallback?: Record<string, false> } }, ctx: { nextRuntime?: string }) => {
    if (ctx.nextRuntime === 'edge') {
      config.resolve ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        stream: false,
        crypto: false,
        os: false,
        perf_hooks: false,
        child_process: false,
      };
    }
    return config;
  },

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
