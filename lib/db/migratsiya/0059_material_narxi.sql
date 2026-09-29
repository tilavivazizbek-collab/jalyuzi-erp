-- 0059 · «MATERIALNI O'ZI SOTISH» JADVALI MATERIALGA BOG'LANADI
--        egasi qarori 2026-09-24
--
-- ⚠️ NEGA KERAK BO'LIB QOLDI
--
--    0057 da narx darajasi olib tashlandi. Daraja «bu jadval qaysi
--    materiallarga» degan savolga javob berardi — u ketgach
--    «Materialni o'zi sotish» jadvali BITTA bo'lib qoldi va
--    to'g'ridan sotiladigan HAMMA materialga tegishli bo'ldi.
--
--    Ya'ni «ko'p olganga arzonroq» (0056, egasi qarori 2026-09-22)
--    buzilgan edi: jadvalga 35 000 so'm/metr yozilsa karniz ham,
--    pult ham, mato ham shu narxda sotilardi.
--
--    Egasiga uch variant berildi; u «Har materialga alohida jadval»
--    ni tanladi.
--
-- ⚠️ QANDAY ISHLAYDI — uch pog'ona, aniqdan umumiyga:
--
--      material_id = shu material  → shu materialning jadvali
--      material_id bo'sh           → umumiy jadval (hammasiga)
--      qoida umuman yo'q           → materialning o'z sotuv narxi
--
--    Tanlash `qoidaniTop()` da, bitta joyda (EC-QT-14…20).
--
-- ⚠️ MAVJUD MA'LUMOT TEGILMAYDI. Bor qatorlarning `material_id` si
--    bo'sh qoladi, ya'ni ular UMUMIY jadval bo'lib ishlayveradi —
--    egasi qaysi materialga alohida narx kerakligini o'zi
--    belgilaydi. Hech bir narx o'zgarmaydi.

ALTER TABLE "mahsulot_narx"
  ADD COLUMN IF NOT EXISTS "material_id" bigint REFERENCES "material"("id");

/*
 * ⚠️ MATERIAL FAQAT «O'ZI SOTISH» QATORIDA BO'LADI.
 *
 *    Tayyor jalyuzi narxi TURGA tegishli va materialga bog'lanmaydi:
 *    bir turdagi hamma mato bir xil narxda sotiladi (0057, egasi
 *    qarori). «Falon tur uchun, lekin falon materialga» — ma'nosiz
 *    qator bo'lardi va uni faqat baza to'sa oladi (§9.4).
 */
ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_material"
  CHECK (NOT ("material_id" IS NOT NULL
              AND ("mahsulot_tur_id" IS NOT NULL OR "hamma_turga")));

/*
 * ⚠️ NOYOBLIK INDEKSIGA `material_id` QO'SHILADI.
 *
 *    Usiz ikkita material bir xil to'rtlikka tushardi: karnizning
 *    «optomchiga» qatori pultnikini ustiga yozib yuborardi.
 *
 * ⚠️ QISMAN (`WHERE faol`) — 0058 dagi sabab bilan bir xil: nofaol
 *    qatorlar narx TARIXI va ular bir-biriga to'qnashishi mumkin.
 *
 * ⚠️ Kod `ON CONFLICT` bandini shu ro'yxat bilan AYNAN bir xil
 *    yozishi shart, aks holda har saqlash yiqiladi.
 */
DROP INDEX IF EXISTS "mahsulot_narx_bitta";

CREATE UNIQUE INDEX "mahsulot_narx_bitta" ON "mahsulot_narx" (
  coalesce("mahsulot_tur_id", 0),
  "hamma_turga",
  coalesce("material_id", 0),
  coalesce("mijoz_turi_id", 0),
  coalesce("filial_id", 0)
) WHERE "faol";

CREATE INDEX IF NOT EXISTS "mahsulot_narx_material_idx"
  ON "mahsulot_narx" ("material_id")
  WHERE "material_id" IS NOT NULL AND "faol";

COMMENT ON COLUMN "mahsulot_narx"."material_id" IS
  'Qaysi materialga — faqat «materialni o''zi sotish» qatorida. Bo''sh bo''lsa jadval hamma materialga (0059).';
