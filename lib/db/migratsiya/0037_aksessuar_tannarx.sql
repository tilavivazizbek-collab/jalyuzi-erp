-- TZ 3.10 · 11.5.2 · 2.3-invariant — AKSESSUAR TANNARXI ALOHIDA USTUNDA
--
-- ⚠️ NIMA TUZATILMOQDA
--
-- `pozitsiya_aksessuar.narx_snapshot` BUTUN TIZIMDA sotuv narxini
-- saqlaydi. Qo'shimcha buyum sotilganda esa u yerga TANNARX
-- yozilardi (lib/amal/buyurtma.ts).
--
-- Mijozning qarzi buzilmasdi: pozitsiyaning O'Z narxi to'g'ri va
-- qarz o'shandan hisoblanadi. Lekin aksessuar kesimidagi hisobot
-- bu qatorni sotuv narxi deb o'qisa, foyda noto'g'ri chiqardi —
-- tannarx daromad bo'lib ko'rinardi.
--
-- ⚠️ NEGA IKKITA USTUN
--
-- Ikkala raqam ham KERAK va ikkalasi ham SNAPSHOT (2.3):
--   narx_snapshot     — mijoz to'lagan narx
--   tannarx_snapshot  — o'sha buyum bizga qanchaga tushgan
--
-- Foyda = birinchisi − ikkinchisi. Bitta ustunda ikkalasini
-- saqlashning iloji yo'q.
--
-- ⚠️ ESKI QATORLAR
--
-- `qolda_kiritildi = true` bo'lgan qatorlarda narx_snapshot da
-- TANNARX turibdi (aynan xato yo'l). Ular ko'chiriladi va
-- narx_snapshot NOLGA tushadi: qo'shimcha buyumning daromadi
-- pozitsiyaning o'zida, bu qatorda emas. Aks holda daromad IKKI
-- MARTA sanalardi.

--> statement-breakpoint
ALTER TABLE "pozitsiya_aksessuar"
  ADD COLUMN "tannarx_snapshot" numeric(14, 2);

--> statement-breakpoint
UPDATE "pozitsiya_aksessuar"
   SET "tannarx_snapshot" = "narx_snapshot",
       "narx_snapshot" = 0
 WHERE "qolda_kiritildi" = true;
