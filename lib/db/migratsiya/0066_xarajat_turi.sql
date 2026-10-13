-- 0066 · XARAJAT TURLARI — egasi o'zi qo'shadi. 2026-10-13
--
-- ⚠️ NEGA: egasi so'ragan (QAMROV «4-qadam», 2026-08-29). Hozir kassadan
--    xarajat faqat to'rt moddaga yoziladi va «Operatsion» ichida ijara,
--    elektr, reklama, internet — hammasi bir qozonda. Foyda-zararda «qaysi
--    xarajat o'syapti?» degan savolga javob yo'q.
--
-- ⚠️ TIZIM MODDALARI O'ZGARMAYDI: ish haqi, kurs farqi, kassa farqi va
--    hokazo foyda-zararda maxsus ma'noga ega (xarajat_modda CHECK). Tur —
--    faqat OPERATSION moddasining ICHKI bo'linishi.
--
-- ⚠️ FAQAT QO'SHADI: `xarajat.xarajat_turi_id` ixtiyoriy — eski yozuvlar
--    «turi ko'rsatilmagan» bo'lib qoladi.

CREATE TABLE IF NOT EXISTS "xarajat_turi" (
  "id" bigserial PRIMARY KEY,
  "nom" text NOT NULL,
  "faol" boolean NOT NULL DEFAULT true,
  "ochirildi" timestamp with time zone,
  "yaratildi" timestamp with time zone NOT NULL DEFAULT now(),
  "yaratdi_id" bigint NOT NULL REFERENCES "xodim"("id"),
  "ozgartirildi" timestamp with time zone,
  "ozgartirdi_id" bigint REFERENCES "xodim"("id"),
  CONSTRAINT "xarajat_turi_nom" CHECK (length(trim("nom")) BETWEEN 1 AND 120)
);

-- Faol turlar orasida bir xil nom bo'lmaydi (katta-kichik harf farqsiz)
CREATE UNIQUE INDEX IF NOT EXISTS "xarajat_turi_nom_yagona"
  ON "xarajat_turi" (lower("nom")) WHERE "faol";

ALTER TABLE "xarajat" ADD COLUMN IF NOT EXISTS "xarajat_turi_id" bigint REFERENCES "xarajat_turi"("id");

-- Tur faqat Operatsion moddada
ALTER TABLE "xarajat" ADD CONSTRAINT "xarajat_turi_operatsion"
  CHECK ("xarajat_turi_id" IS NULL OR "modda" = 'OPERATSION');

CREATE INDEX IF NOT EXISTS "xarajat_turi_idx" ON "xarajat" ("xarajat_turi_id") WHERE "xarajat_turi_id" IS NOT NULL;
