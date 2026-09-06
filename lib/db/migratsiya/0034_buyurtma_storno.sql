-- TZ 8.8 — BUYURTMA STORNOSI
--
-- ⚠️ NEGA KERAK
--
-- 8.8: «Storno bundan farq qiladi. Bekor qilish — REAL BIZNES HOLATI
-- (mijoz fikridan qaytdi). Storno — XATO: buyurtma umuman bo'lmagan,
-- sotuvchi noto'g'ri kiritgan. Faqat admin qiladi va HISOBOTDA
-- ALOHIDA ko'rinadi.»
--
-- Shu paytgacha ikkalasi bir xil ko'rinardi: ikkalasida ham pozitsiya
-- `BEKOR` bo'lardi va hisobot ularni ajrata olmasdi.
--
-- ⚠️ NEGA `holat` USTUNI QO'SHILMAYDI
--
-- TZ 8.2: «Buyurtmaning UMUMIY STATUSI YO'Q.» Status har POZITSIYADA
-- turadi. Shuning uchun storno buyurtmaga BELGI bo'lib qo'shiladi,
-- status bo'lib emas — pozitsiyalar avvalgidek `BEKOR` bo'ladi va
-- ularni chiqarib tashlaydigan barcha hisobot o'z-o'zidan ishlaydi.
--
-- Hisobot esa `storno_sabab IS NOT NULL` bo'yicha ikkisini ajratadi.
--
-- ⚠️ Sabab MAJBURIY: «B-2026-000184 nega yo'q?» degan savolga javob
-- olti oydan keyin ham topilishi kerak (2.4).

--> statement-breakpoint
ALTER TABLE "buyurtma" ADD COLUMN "storno_sabab" text;

--> statement-breakpoint
ALTER TABLE "buyurtma" ADD COLUMN "storno_sana" timestamp with time zone;

--> statement-breakpoint
ALTER TABLE "buyurtma" ADD COLUMN "storno_xodim_id" bigint;

--> statement-breakpoint
-- Uchalasi BIRGA to'ladi yoki birgalikda bo'sh qoladi
ALTER TABLE "buyurtma" ADD CONSTRAINT "buyurtma_storno_toliq"
  CHECK (
    ("buyurtma"."storno_sabab" IS NULL
     AND "buyurtma"."storno_sana" IS NULL
     AND "buyurtma"."storno_xodim_id" IS NULL)
    OR
    ("buyurtma"."storno_sabab" IS NOT NULL
     AND "buyurtma"."storno_sana" IS NOT NULL
     AND "buyurtma"."storno_xodim_id" IS NOT NULL)
  );

--> statement-breakpoint
CREATE INDEX "buyurtma_storno" ON "buyurtma" USING btree ("storno_sana")
  WHERE "buyurtma"."storno_sana" IS NOT NULL;
