-- TZ 10.8 — BOSQICHLI STAVKA
--
-- ⚠️ NIMA YETISHMAYDI
--
-- 10.8 uch xil haq hisoblashni talab qiladi:
--
--   Qat'iy summa   Zashitka 15 000 so'm, o'lchamdan qat'i nazar
--   Kv.metrga      Plisse 18 000 × 3.2 = 57 600
--   Bosqichli      Dikke — jadval bo'yicha
--
-- Uchinchisi UMUMAN ishlamasdi: `stavka.birlik` faqat 'KV_M' yoki
-- 'DONA' bo'la olardi va bosqich chegarasi uchun ustun yo'q edi.
-- Domendagi `bosqichniTop()` yozilgan va sinalgan, lekin uni
-- chaqiradigan ma'lumot bazada saqlanmasdi.
--
-- ⚠️ NEGA YANGI JADVAL EMAS
--
-- Bosqichli stavka — bir necha QATOR bo'lgan bitta stavka. Ular
-- (mahsulot_tur, filial, xodim, amal_qiladi_dan) bo'yicha bir
-- guruhda turadi. Alohida jadval qilinsa, 10.9 dagi ustunlik
-- tartibi (xodim > filial > standart) IKKI JOYDA yozilardi.
--
-- ⚠️ YUQORI CHEGARA
--
-- `chegara_kv_m` — shu qiymat DAXL bo'ladigan yuqori chegara.
-- 10.8: «Chegaraga AYNAN TENG qiymat QUYI bosqichga kiradi»:
--
--   1.00 → 1-bosqich      1.01 → 2-bosqich
--
-- Eng yuqori bosqichda `NULL` — cheksiz.
--
-- ⚠️ Boshqa birliklarda chegara BO'LMAYDI: qat'iy summa va kv.metr
-- stavkasi bitta qator, ularda bosqich ma'nosiz.

--> statement-breakpoint
ALTER TABLE "stavka" ADD COLUMN "chegara_kv_m" numeric(10, 4);

--> statement-breakpoint
ALTER TABLE "stavka" DROP CONSTRAINT IF EXISTS "stavka_birlik";

--> statement-breakpoint
ALTER TABLE "stavka" ADD CONSTRAINT "stavka_birlik"
  CHECK ("stavka"."birlik" IN ('KV_M','DONA','BOSQICH'));

--> statement-breakpoint
-- Chegara FAQAT bosqichli stavkada bo'ladi
ALTER TABLE "stavka" ADD CONSTRAINT "stavka_chegara_faqat_bosqichda"
  CHECK ("stavka"."birlik" = 'BOSQICH' OR "stavka"."chegara_kv_m" IS NULL);

--> statement-breakpoint
ALTER TABLE "stavka" ADD CONSTRAINT "stavka_chegara_musbat"
  CHECK ("stavka"."chegara_kv_m" IS NULL OR "stavka"."chegara_kv_m" > 0);

--> statement-breakpoint
-- Bitta guruhda bitta chegara ikki marta yozilmaydi: aks holda
-- qaysi biri qo'llanishi tasodifga qolardi.
CREATE UNIQUE INDEX "stavka_bosqich_noyob" ON "stavka"
  ("mahsulot_tur_id", "amal_qiladi_dan",
   COALESCE("filial_id", -1), COALESCE("xodim_id", -1),
   COALESCE("chegara_kv_m", -1))
  WHERE "faol" = true AND "birlik" = 'BOSQICH';
