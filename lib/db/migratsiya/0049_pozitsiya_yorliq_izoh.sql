-- 0049 · POZITSIYA YORLIG'I VA IZOHI — soha auditi 2026-09-22
--
-- ⚠️ MUAMMO: BUTUN TIZIMDA IZOH YOZADIGAN JOY YO'Q EDI
--
--    `buyurtma` da ham, `buyurtma_pozitsiya` da ham erkin matn
--    ustuni yo'q. Ya'ni sotuvchi «zanjir o'ngdan», «mijoz o'zi
--    olib ketadi», «yuqori qavat, lift yo'q» kabi gaplarni
--    HECH QAYERGA yoza olmasdi. Ular og'zaki aytilardi va
--    yo'qolardi.
--
-- ⚠️ EGASI 2026-09-22: tanlovlar (zanjir tomoni, o'rnatish turi)
--    «faqat yozilsin va ustaga borsin» degan. Izoh — o'sha
--    tanlovlar keladigan joyning birinchi bosqichi.
--
-- ─── yorliq ─────────────────────────────────────────────────────
--
--    «Zal — katta oyna», «Oshxona», «Yotoqxona chap».
--
--    Bitta buyurtmada olti oyna bo'lsa, usta ham, montajchi ham
--    qaysi biri qayerga ketishini BILMASDI: ro'yxatda faqat
--    «1-qator, 2-qator» turardi. O'lchamlari yaqin bo'lsa
--    (1.40×2.10 va 1.45×2.10) adashish deyarli muqarrar.
--
--    Chekda va kvitansiyada ham ko'rinadi: mijoz qaysi pul qaysi
--    oyna uchun ekanini ko'radi.
--
-- ─── izoh ───────────────────────────────────────────────────────
--
--    Ichki eslatma — usta va montajchi uchun. Chekka CHIQMAYDI:
--    unda ichki gap («bu mijoz janjalkash») mijoz qo'liga tushib
--    qolardi.
--
-- ⚠️ IKKALASI HAM IXTIYORIY. Majburiy qilinsa sotuvchi shoshib
--    nuqta qo'yib ketardi va maydon ma'nosini yo'qotardi.
--
-- ⚠️ SNAPSHOT EMAS — tahrirlanadi. Yorliq va izoh pul yoki o'lcham
--    emas, ular ish davomida aniqlashadi («mijoz qo'ng'iroq qildi,
--    zanjirni chapga o'zgartiring»). 2.3-invariant qotirishni
--    faqat PUL va O'LCHAM uchun talab qiladi.

ALTER TABLE "buyurtma_pozitsiya"
  ADD COLUMN IF NOT EXISTS "yorliq" text,
  ADD COLUMN IF NOT EXISTS "izoh" text;

-- ⚠️ Bo'sh satr `NULL` ga tenglashtiriladi: aks holda ro'yxatda
--    «yorliq bor» deb ko'rinadigan, lekin ko'zga hech narsa
--    ko'rinmaydigan qatorlar paydo bo'lardi.
ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "pozitsiya_yorliq_bosh_emas";
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_yorliq_bosh_emas"
  CHECK ("yorliq" IS NULL OR length(btrim("yorliq")) > 0);

ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "pozitsiya_izoh_bosh_emas";
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_izoh_bosh_emas"
  CHECK ("izoh" IS NULL OR length(btrim("izoh")) > 0);

COMMENT ON COLUMN "buyurtma_pozitsiya"."yorliq" IS
  'Qaysi oyna: «Zal — katta oyna». Chekda va kvitansiyada ko''rinadi.';
COMMENT ON COLUMN "buyurtma_pozitsiya"."izoh" IS
  'Ichki eslatma — usta va montajchi uchun. Chekka CHIQMAYDI.';
