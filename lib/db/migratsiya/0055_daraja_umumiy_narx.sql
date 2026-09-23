-- 0055 · DARAJAGA UMUMIY NARX — egasi qarori 2026-09-23
--
-- ⚠️ NEGA KERAK
--
--    Narx `tur × daraja` juftligiga qo'yiladi. To'qqiz xil jalyuzi
--    va uch daraja bo'lsa — YIGIRMA YETTI qator. Har yangi tur yana
--    uchta, har yangi daraja yana to'qqizta qo'shadi.
--
--    Bazadagi holat (2026-09-23): olti materialdan BESHTASI
--    sotilmasdi — «arzon» darajasida to'rt material bor, narx
--    qoidasi esa nol; «qimmat» da ham shunday. Sotuvchi ularni
--    tanlasa «narx qo'yilmagan» chiqardi.
--
--    Egasi: «bir narx darajasidan 5 xil yoki 10 xil mahsulot
--    turishi mumkin, bunga qanday yechim bersak bo'ladi».
--
-- ⚠️ YECHIM: daraja qatoriga «HAMMA TUR UCHUN» belgisi. Turga
--    alohida qator qo'yilmagan bo'lsa shu ishlatiladi. Uch qator
--    bilan barcha tur sotiladigan bo'ladi.
--
-- ⚠️ TURGA QO'YILGAN QATOR TO'LIQ ALMASHTIRADI (egasi qarori):
--    qo'shilmaydi, ko'paytirilmaydi. Narx qayerdan kelgani bir
--    qarashda ko'rinsin — yo turdan, yo darajadan.
--
-- ⚠️ NEGA YANGI USTUN, `mahsulot_tur_id IS NULL` EMAS
--
--    `mahsulot_tur_id` NULL qiymati ALLAQACHON band: u «materialni
--    o'zi sotish» degani (egasi qarori 2026-09-20 — mijoz «menga
--    5 metr shu matodan» desa tur yo'q, narx kerak). Shu ma'noni
--    ikkinchi marta yuklash ikkalasini ham buzardi.
--
-- ⚠️ ESKI QATORLAR TEGILMAYDI: `DEFAULT false` — hamma mavjud
--    qoida avvalgidek turga bog'langan holicha qoladi.

ALTER TABLE "mahsulot_narx"
  ADD COLUMN IF NOT EXISTS "hamma_turga" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "mahsulot_narx"."hamma_turga" IS
  'Daraja uchun umumiy narx — turga alohida qator bo''lmasa ishlatiladi (0055).';

-- ⚠️ «Hamma tur uchun» qatorda ANIQ TUR BO'LMASLIGI shart. Aks
--    holda «rulon parda uchun, lekin hamma turga» degan ma'nosiz
--    qator yozilardi va qaysi biri ustun ekani noaniq bo'lardi.
ALTER TABLE "mahsulot_narx" DROP CONSTRAINT IF EXISTS "mahsulot_narx_hamma_turga";
ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_hamma_turga"
  CHECK (NOT "hamma_turga" OR "mahsulot_tur_id" IS NULL);

-- ⚠️ NOYOBLIK INDEKSI QAYTA QURILADI.
--
--    Eski indeksda `coalesce(mahsulot_tur_id, 0)` bor. Endi
--    `mahsulot_tur_id IS NULL` ikki xil ma'no beradi — «materialni
--    o'zi sotish» va «hamma tur uchun» — va ular bir-birini
--    NOYOBLIK bo'yicha to'sib qo'yardi: egasi darajaga umumiy narx
--    qo'ysa, o'sha darajadagi material sotuvi narxi yozilmay
--    qolardi.
DROP INDEX IF EXISTS "mahsulot_narx_bitta";
CREATE UNIQUE INDEX "mahsulot_narx_bitta" ON "mahsulot_narx" (
  coalesce("mahsulot_tur_id", 0),
  "hamma_turga",
  "narx_guruh_id",
  coalesce("mijoz_turi_id", 0),
  coalesce("filial_id", 0)
);

-- Darajaga umumiy narx izlash uchun
CREATE INDEX IF NOT EXISTS "mahsulot_narx_hamma_tur_idx"
  ON "mahsulot_narx" ("narx_guruh_id")
  WHERE "hamma_turga" AND "faol";
