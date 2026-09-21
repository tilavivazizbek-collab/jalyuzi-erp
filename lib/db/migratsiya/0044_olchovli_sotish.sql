-- 0044 · O'LCHOVLI SOTISH — egasi qarori 2026-09-21 (T-16)
--
-- «tuzat metrlab sotib bulsin»
--
-- Chiziqli materialni (karniz, ip, zanjir) 2.5 metrlab
-- to'g'ridan-to'g'ri sotib bo'lmasdi. Sabab tuzilishda edi: miqdor
-- `soni` ustunida saqlanardi va u `integer`.
--
-- ⚠️ NEGA `soni` NUMERIC QILINMADI
--
--    `soni` butun tizimda DONA SANOG'I ma'nosida ishlatiladi:
--      · band qilish `soni` MARTA takrorlanadi (`for i < soni`)
--      · kesim to'rtburchagi jami maydonni `soni` ga bo'ladi (T-12)
--      · chekda «3 × 120 000» bo'lib chiqadi
--
--    Uni kasrga aylantirish «2.5 marta band qil» degan ma'nosiz
--    holatni tug'dirardi. Shuning uchun YANGI ustun: `soni` dona
--    uchun, `miqdor` o'lchov uchun.
--
-- ⚠️ `miqdor` FAQAT QO'SHIMCHA BUYUMDA bo'ladi. Tayyor mahsulotning
--    miqdori o'lchamda (`eni_m` × `boyi_m`) va slotlarda yotadi —
--    u yerga yana bitta miqdor qo'shilsa, qaysi biri haqiqat ekani
--    noaniq bo'lardi. Cheklov shuni bazaning o'zida ushlaydi.

ALTER TABLE "buyurtma_pozitsiya"
  ADD COLUMN IF NOT EXISTS "miqdor" numeric(10,2);

COMMENT ON COLUMN "buyurtma_pozitsiya"."miqdor" IS
  'O''lchov bilan sotilgan miqdor (metr). Faqat qo''shimcha buyumda. '
  'NULL bo''lsa miqdor `soni` da — donalab sotilgan.';

ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "pozitsiya_miqdor_musbat";
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_miqdor_musbat"
  CHECK ("miqdor" IS NULL OR "miqdor" > 0);

-- ⚠️ Tayyor mahsulotda `miqdor` bo'lmaydi — u yerda o'lcham hukmron
ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "pozitsiya_miqdor_qoshimchada";
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_miqdor_qoshimchada"
  CHECK ("miqdor" IS NULL OR "qoshimcha_material_id" IS NOT NULL);
