-- TZ 7.4 · 7.6 — OCHILGAN RULON
--
-- ⚠️ NEGA KERAK
--
-- TZ 7.4: «Rulonning ENI hech qachon o'zgarmaydi. Kesilganda faqat
-- BO'YI kamayadi.»
-- TZ 7.6, 5-qadam: «Tartib: qoldiq kesma → QISMAN OCHILGAN RULON →
-- yangi rulon.»
--
-- Ikkala qoida ham yozilgan, lekin o'rtadagi tushuncha bazada YO'Q edi.
-- `lib/amal/band.ts` uni `turi = 'RULON' AND ota_bolak_id IS NOT NULL`
-- deb hisoblardi, `lib/amal/ish.ts` esa kesilgan rulondan HAR DOIM
-- 'OSTATKA' yaratardi. Ya'ni otasi bor RULON hech qachon tug'ilmagan
-- va shart HAMISHA yolg'on bo'lgan — 5-qadamning o'rta bosqichi o'lik.
--
-- Oqibati ekranda ham ko'rinardi: 3 × 35 rulondan bitta parda kesilsa,
-- qolgan 3 × 30 «qoldiq kesma» bo'lib turardi. Egasi omborda nechta
-- BUTUN rulon borligini bilolmasdi.
--
-- ⚠️ NEGA `ota_bolak_id` DAN HISOBLAB BO'LMAYDI
--
-- Boshlang'ich zahira kiritilganda ochilgan rulonning OTASI YO'Q — u
-- tizimdan oldin ochilgan. Shuning uchun belgi ALOHIDA ustun bo'lishi
-- shart, aks holda egasi omboridagi bor rulonni kirita olmaydi.

--> statement-breakpoint
ALTER TABLE "bolak" ADD COLUMN "ochilgan" boolean DEFAULT false NOT NULL;

--> statement-breakpoint
-- Faqat RULON ochilgan bo'ladi: kesma allaqachon rulon emas
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_ochilgan_faqat_rulon"
  CHECK ("bolak"."ochilgan" = false OR "bolak"."turi" = 'RULON');

--> statement-breakpoint
-- 7.6 tanlovi «ochilganini avval tugat» deb saralaydi — indeks shunga
CREATE INDEX "bolak_ochilgan" ON "bolak" USING btree
  ("material_id", "filial_id", "ochilgan")
  WHERE "bolak"."faol" = true AND "bolak"."holat" = 'BOSH';
