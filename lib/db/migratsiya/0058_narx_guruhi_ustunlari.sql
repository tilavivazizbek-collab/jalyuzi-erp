-- 0058 · NARX GURUHI USTUNLARI TASHLANADI
--        0057 ning ikkinchi qadami — egasi qarori 2026-09-24
--
-- ⚠️ BU MIGRATSIYA FAQAT YANGI KOD DEPLOY BO'LGACH qo'llanadi.
--
--    0057 ustunni ixtiyoriy qildi va shu bilan eski kod ham, yangi
--    kod ham ishlaydigan oraliq holat yaratdi. Endi yangi kod
--    jonli saytda ishlab turibdi va ustunlarni hech kim o'qimaydi.
--
-- ⚠️ NIMA KETADI:
--      narx_guruh                      — jadvalning o'zi
--      material.narx_guruh_id          — matoning darajasi
--      mahsulot_narx.narx_guruh_id     — narx qoidasining o'qi
--      mahsulot_slot.narx_belgilaydi   — «qaysi slot darajani beradi»

DROP INDEX IF EXISTS "mahsulot_narx_bitta";
DROP INDEX IF EXISTS "mahsulot_narx_hamma_tur_idx";
DROP INDEX IF EXISTS "mahsulot_slot_narx_bitta";

ALTER TABLE "mahsulot_narx" DROP COLUMN IF EXISTS "narx_guruh_id";
ALTER TABLE "material"      DROP COLUMN IF EXISTS "narx_guruh_id";
ALTER TABLE "mahsulot_slot" DROP COLUMN IF EXISTS "narx_belgilaydi";

/*
 * ⚠️ NOYOBLIK ENDI FAQAT FAOL QATORLARGA — 2026-09-24.
 *
 *    Eski indeks NOFAOL qatorlarni ham qamrardi va uning ichida
 *    `narx_guruh_id` bor edi. Ustun tashlangach o'sha nofaol
 *    qatorlar BIR-BIRIGA to'qnashadi: ikki darajaga yozilgan ikki
 *    tarix qatori endi bir xil to'rtlikka aylanadi.
 *
 *    Tekshirildi (2026-09-24, ustun tashlanishidan oldin):
 *      egasining bazasi — 0 ta to'qnashuv
 *      sinov bazasi     — 16 ta guruh, 48 ta qator
 *
 *    Ya'ni to'liq indeks SINOV BAZASIDA yiqilardi va migratsiya
 *    «bitta bazada ishladi» degan yolg'on tinchlik berardi
 *    (QOIDALAR §6 — migratsiya IKKI bazaga qo'llanadi).
 *
 * ⚠️ NEGA O'CHIRIB TASHLANMADI. Boshqa yo'l — to'qnashgan nofaol
 *    qatorlarni DELETE qilish edi. Lekin ular narx TARIXI: qachon
 *    qaysi narx turgani faqat shu yerda qoladi (2.1-invariant).
 *    Indeksni qisqartirish tarixni saqlaydi va hech nimani
 *    yo'qotmaydi.
 *
 * ⚠️ KOD HAM SHUNGA MOSLANDI: `ON CONFLICT ... WHERE faol`.
 *    Predikat yozilmasa Postgres bu indeksni TANIMAYDI va har
 *    saqlash «no unique or exclusion constraint matching» bilan
 *    yiqilardi.
 */
CREATE UNIQUE INDEX "mahsulot_narx_bitta" ON "mahsulot_narx" (
  coalesce("mahsulot_tur_id", 0),
  "hamma_turga",
  coalesce("mijoz_turi_id", 0),
  coalesce("filial_id", 0)
) WHERE "faol";

CREATE INDEX IF NOT EXISTS "mahsulot_narx_hamma_tur_idx"
  ON "mahsulot_narx" ("hamma_turga")
  WHERE "hamma_turga" AND "faol";

COMMENT ON COLUMN "mahsulot_narx"."hamma_turga" IS
  'Hamma tur uchun standart narx — turga alohida qator bo''lmasa ishlatiladi (0055, 0057 da darajadan ajratildi).';

DROP TABLE IF EXISTS "narx_guruh";
