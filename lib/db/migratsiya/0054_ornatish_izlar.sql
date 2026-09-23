-- 0054 · `mahsulot_ornatish` — iz ustunlari (0053 ning davomi)
--
-- ⚠️ 0053 da jadval spravochnik andozasidan CHETGA CHIQIB yaratilgan:
--    `yaratilgan` degan bitta ustun qo'yilgan, `ochirildi` va kim
--    yaratgani esa umuman yo'q.
--
--    QISM 3 §0.1 bo'yicha har spravochnik jadvalida IZ bo'lishi
--    shart: kim yaratdi, qachon, kim o'zgartirdi. `mahsulot_tanlov`
--    (0052) da ham aynan shunday. Bitta jadval andozadan chiqib
--    tursa, ertaga «qaysi biri to'g'ri?» degan savol tug'iladi va
--    keyingi jadval qaysisiga qarab yozilishi noma'lum bo'lib qoladi.
--
-- ⚠️ 0053 ni TAHRIRLAB bo'lmaydi: u ikkala bazaga allaqachon
--    qo'llangan va drizzle uni hash bo'yicha eslab qolgan. Xatoni
--    tuzatishning yagona to'g'ri yo'li — yangi migratsiya.
--
-- ⚠️ `yaratilgan` ma'lumoti YO'QOTILMAYDI: avval `yaratildi` ga
--    ko'chiriladi, keyingina eski ustun olib tashlanadi. Jadval
--    hozircha bo'sh, lekin bu tartib odat bo'lib qolishi kerak —
--    to'la jadvalda ham xuddi shunday yozilardi.

ALTER TABLE "mahsulot_ornatish"
  ADD COLUMN IF NOT EXISTS "yaratildi"     timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "yaratdi_id"    bigint REFERENCES "xodim"("id"),
  ADD COLUMN IF NOT EXISTS "ozgartirildi"  timestamptz,
  ADD COLUMN IF NOT EXISTS "ozgartirdi_id" bigint REFERENCES "xodim"("id"),
  ADD COLUMN IF NOT EXISTS "ochirildi"     timestamptz;

UPDATE "mahsulot_ornatish"
   SET "yaratildi" = "yaratilgan"
 WHERE "yaratilgan" IS NOT NULL;

ALTER TABLE "mahsulot_ornatish" DROP COLUMN IF EXISTS "yaratilgan";

ALTER TABLE "mahsulot_ornatish" DROP CONSTRAINT IF EXISTS "ornatish_nom";
ALTER TABLE "mahsulot_ornatish" ADD CONSTRAINT "ornatish_nom"
  CHECK (length(btrim("nom")) > 0);
