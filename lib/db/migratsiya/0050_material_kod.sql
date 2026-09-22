-- 0050 · MATERIAL ARTIKULI — egasi qarori 2026-09-22
--
-- ⚠️ NEGA KERAK
--
--    Ta'minotchi «1120-08» deb gapiradi, korxona esa «Blackout oq»
--    deb. Ikkalasini bog'laydigan narsa yo'q edi, natijada:
--
--      · hisob-fakturani solishtirish qo'lda qilinardi
--      · qayta buyurtma berishda kod har safar qidirib topilardi
--      · bir xil mato ikki xil nom bilan ikki marta kiritilishi
--        mumkin edi va omborda ikkita alohida qoldiq paydo bo'lardi
--
-- ⚠️ IXTIYORIY. Mavjud 88 materialning hech biri kodsiz qolib
--    ketmaydi: `NULL` — «kod kiritilmagan», xato emas. Majburiy
--    qilinsa eski yozuvlarni tahrirlash imkonsiz bo'lardi.
--
-- ⚠️ TAKRORLANMAYDI — qisman unique indeks.
--
--    Kod IDENTIFIKATOR. Ikki materialda bir xil kod turgan
--    zahoti u o'z ma'nosini yo'qotadi: qidiruv ikkita natija
--    beradi, qayta buyurtmada qaysi biri ekani noaniq qoladi.
--    Bo'sh kodlar cheklanmaydi (ularning soni istalgancha).
--
--    Katta-kichik harf va chetdagi bo'shliq HISOBGA OLINMAYDI:
--    «1120-08» va « 1120-08 » — bitta kod.

ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "kod" text;

-- Bo'sh satr `NULL` ga tenglashtiriladi: aks holda «kodi bor»
-- deb ko'rinadigan, lekin ko'zga hech narsa ko'rinmaydigan
-- qatorlar paydo bo'lardi va unique indeks ularni bir-biriga
-- urishtirardi.
ALTER TABLE "material" DROP CONSTRAINT IF EXISTS "material_kod_bosh_emas";
ALTER TABLE "material" ADD CONSTRAINT "material_kod_bosh_emas"
  CHECK ("kod" IS NULL OR length(btrim("kod")) > 0);

CREATE UNIQUE INDEX IF NOT EXISTS "material_kod_bitta"
  ON "material" (lower(btrim("kod")))
  WHERE "kod" IS NOT NULL;

COMMENT ON COLUMN "material"."kod" IS
  'Ta''minotchining artikuli: «BLACKOUT 1120-08». Ixtiyoriy, lekin '
  'kiritilsa TAKRORLANMAYDI. Qidiruv nom bo''yicha ham, kod bo''yicha ham ishlaydi.';
