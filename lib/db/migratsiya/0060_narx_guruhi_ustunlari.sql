-- 0060 · NARX GURUHI USTUNLARI TASHLANADI
--        0057 ning ikkinchi qadami — egasi qarori 2026-09-24
--
-- ⚠️ ENG OXIRGI QADAM — ATAYLAB. Bu yagona BUZADIGAN migratsiya:
--    qo'llangach eski kod ishlamaydi (u `narx_guruh_id` ni o'qiydi).
--
--    Shuning uchun tartib shunday qurildi:
--
--      0057  narx_guruh_id IXTIYORIY bo'ladi   ← eski kod ishlaydi
--      0059  material_id qo'shiladi            ← eski kod ishlaydi
--      push  → Render deploy tugasin           ← yangi kod jonli
--      0060  ustunlar TASHLANADI (bu)          ← eski kod endi yo'q
--
--    Ilgari bu migratsiya 0058 edi va 0059 dan OLDIN turardi. Shunda
--    deploy bilan migratsiya orasida jonli sayt butunlay yiqilardi:
--    materiallar ro'yxati ham, sotuv ekrani ham `narx_guruh_id` ni
--    so'raydi. Oxiriga surilgach oraliqda faqat NARX SAQLASH
--    ishlamaydi (`ON CONFLICT` indeksga mos kelmaydi) — egasi kunda
--    bir necha marta qiladigan ish emas.
--
-- ⚠️ NIMA KETADI:
--      narx_guruh                      — jadvalning o'zi
--      material.narx_guruh_id          — matoning darajasi
--      mahsulot_narx.narx_guruh_id     — narx qoidasining o'qi
--      mahsulot_slot.narx_belgilaydi   — «qaysi slot darajani beradi»
--
-- ⚠️ `mahsulot_narx_bitta` INDEKSIGA TEGILMAYDI. Uni 0059 qurgan va
--    u yerda `material_id` bor. Bu yerda qayta qurilsa material o'qi
--    indeksdan TUSHIB qolardi va ikki materialning jadvali
--    bir-birini bosib o'tardi — 0059 ning butun ma'nosi yo'qolardi.

DROP INDEX IF EXISTS "mahsulot_narx_hamma_tur_idx";
DROP INDEX IF EXISTS "mahsulot_slot_narx_bitta";

ALTER TABLE "mahsulot_narx" DROP COLUMN IF EXISTS "narx_guruh_id";
ALTER TABLE "material"      DROP COLUMN IF EXISTS "narx_guruh_id";
ALTER TABLE "mahsulot_slot" DROP COLUMN IF EXISTS "narx_belgilaydi";

/*
 * ⚠️ Eski indeks `narx_guruh_id` ustida edi — ustun ketgach u
 *    o'zi ham yo'qoladi, shuning uchun qayta quriladi.
 */
CREATE INDEX IF NOT EXISTS "mahsulot_narx_hamma_tur_idx"
  ON "mahsulot_narx" ("hamma_turga")
  WHERE "hamma_turga" AND "faol";

COMMENT ON COLUMN "mahsulot_narx"."hamma_turga" IS
  'Hamma tur uchun standart narx — turga alohida qator bo''lmasa ishlatiladi (0055, 0057 da darajadan ajratildi).';

DROP TABLE IF EXISTS "narx_guruh";
