-- 0047 · MIQDOR BO'YICHA BOSQICH — egasi qarori 2026-09-22
--
-- ⚠️ EGASI: «ko'p olganga arzonroq beriladi — muni matoni qilgandek
--    belgilab qo'yish orqali hal qilsa bo'ladi».
--
--    Ya'ni karniz va donalab sotiladigan buyum ham xuddi mato kabi
--    «Narxlar va turlar» → «Materialni o'zi sotish» jadvalidan narx
--    oladi. Farqi faqat bosqich NIMAGA qarab tanlanishida.
--
-- ⚠️ NEGA YANGI USUL KERAK — mavjudlari yaramaydi:
--
--      MAYDON · ENI · BO'YI  → o'lchamdan hisoblanadi. Karniz va
--                              mexanizmda eni-bo'yi umuman
--                              kiritilmaydi, ya'ni hisoblab
--                              bo'lmaydi.
--
--      DONA                  → o'lchov DOIM 1. Ma'nosi «o'lcham
--                              narxga ta'sir qilmaydi». Bosqich ham
--                              doim 1 ga qarab tanlanadi, demak
--                              «10 donadan ko'p olsa arzon» degan
--                              qoidani YOZIB BO'LMAYDI.
--
--      MIQDOR                → bosqich SOTILAYOTGAN MIQDORGA qarab
--                              tanlanadi: M materialda metr, DONA
--                              materialda dona. Narx ham o'shanga
--                              ko'paytiriladi.
--
-- ⚠️ ESKI QOIDALARGA TEGMAYDI. Faqat yangi qiymatga ruxsat beriladi;
--    hech bir mavjud qator o'zgarmaydi va hech kim MIQDOR ga
--    o'tishga majbur emas. Daraja qo'yilmagan material avvalgidek
--    o'zining `sotuv_narx` idan sotiladi.

ALTER TABLE "mahsulot_narx" DROP CONSTRAINT IF EXISTS "mahsulot_narx_usul";

ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_usul"
  CHECK ("hisoblash_usuli" IN ('MAYDON','ENI','BO''YI','DONA','MIQDOR'));

COMMENT ON COLUMN "mahsulot_narx"."hisoblash_usuli" IS
  'Bosqich nimaga qarab tanlanadi: MAYDON (kv.m), ENI/BO''YI (metr), '
  'DONA (o''lchamsiz, o''lchov doim 1), MIQDOR (sotilayotgan miqdor — '
  'M materialda metr, DONA materialda dona).';
