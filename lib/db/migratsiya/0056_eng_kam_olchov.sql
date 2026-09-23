-- 0056 · ENG KAM HISOB O'LCHOVI — egasi qarori 2026-09-23
--
-- ⚠️ NEGA KERAK
--
--    «0.4 × 0.5 m parda = 0.2 kv.m × 30 000 = 6 000 so'm» — mexanizm
--    o'zi undan qimmat, ustaning ishi hisobga ham kirmagan. Jalyuzi
--    sohasida deyarli hamma «kamida 1 kv.m dan hisoblanadi» qoidasi
--    bilan ishlaydi; tizimda bunday tushuncha UMUMAN yo'q edi.
--
--    Egasi tasdiqladi: «Ha, kv.m bo'yicha».
--
-- ⚠️ NEGA `mahsulot_narx` DA, turda EMAS
--
--    Eng kam hisob — NARX qoidasi, mahsulotning jismoniy xossasi
--    emas. Shu yerda turgani uchun:
--
--      · 0055 dagi «darajaga umumiy narx» qatorida ham ishlaydi
--      · tanlash tartibi (`qoidaniTop`) bilan bir xil boradi —
--        aniqroq qoida o'z eng kam hisobini olib keladi
--      · optomchiga boshqa, chakanaga boshqa eng kam qo'yish mumkin
--
--    Turga qo'yilsa bularning hech biri ishlamasdi va ikkinchi
--    tanlash mantig'i yozilishi kerak bo'lardi (CLAUDE.md §3).
--
-- ⚠️ NOMI `min_olchov`, `min_kv_m` EMAS
--
--    Qoida `MAYDON` dan tashqari `ENI`, `BO'YI`, `DONA`, `MIQDOR`
--    usullarida ham ishlaydi. `MAYDON` da birlik kv.m, `ENI` da esa
--    METR. Nomiga «kv.m» yozilsa u yolg'on bo'lardi — ekranda birlik
--    usulga qarab yoziladi.
--
-- ⚠️ BO'SH = TEKSHIRUV YO'Q. Hamma mavjud qator `NULL` bo'lib qoladi
--    va hech narsa o'zgarmaydi.

ALTER TABLE "mahsulot_narx"
  ADD COLUMN IF NOT EXISTS "min_olchov" numeric(10, 4);

COMMENT ON COLUMN "mahsulot_narx"."min_olchov" IS
  'Eng kam hisob o''lchovi: o''lcham shundan kichik bo''lsa shu qiymat olinadi. NULL — tekshirilmaydi (0056).';

-- ⚠️ MANFIY yoki NOL ma'nosiz: nol «kamida nol» degani, ya'ni
--    qoidaning o'zi yo'q. Bo'sh qoldirish kerak.
ALTER TABLE "mahsulot_narx" DROP CONSTRAINT IF EXISTS "mahsulot_narx_min_olchov";
ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_min_olchov"
  CHECK ("min_olchov" IS NULL OR "min_olchov" > 0);
