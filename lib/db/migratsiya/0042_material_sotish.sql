-- MATERIALNI O'ZI SOTISH — egasi qarori 2026-09-20
--
-- ⚠️ NIMA YETISHMAYDI
--
-- Mijoz «menga 5 metr shu matodan bering» desa, hozir buni yozib
-- bo'lmaydi. Kronshteyn va mexanizm donalab sotiladi, mato esa yo'q:
-- uni sotish RULONDAN KESISH demak, ya'ni ombor amali.
--
-- Uchta cheklov aynan shuni to'sib turardi. Ular bejiz qo'yilmagan —
-- «qo'shimcha buyum tayyorlanmaydi, kesilmaydi» qoidasidan chiqqan.
-- Endi qoida kengaydi: kesiladigan material ham sotiladi.
--
-- ⚠️ CHEKLOVLAR FAQAT KENGAYADI, TORAYMAYDI. Mavjud ma'lumot
--    o'zgarmaydi va eski qatorlar yangi cheklovdan ham o'tadi.

-- ─── 1. Qo'shimcha buyumda o'lcham ─────────────────────────────────────
--
-- Ilgari: slotsiz pozitsiyada eni va bo'yi NOL bo'lishi shart edi.
-- Endi: yo ikkalasi nol (donalab sotish), yo ikkalasi musbat
-- (metrlab kesib sotish). Yarim to'ldirilgan o'lcham baribir o'tmaydi.

ALTER TABLE "buyurtma_pozitsiya"
  DROP CONSTRAINT IF EXISTS "pozitsiya_qoshimcha_olchamsiz";

DO $$ BEGIN
  ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_olcham_juft"
    CHECK (("eni_sm" = 0 AND "boyi_sm" = 0) OR ("eni_sm" > 0 AND "boyi_sm" > 0));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. Slotsiz material qatori ────────────────────────────────────────
--
-- Band qilish va kesish zanjiri `pozitsiya_material` dan o'qiydi.
-- Slotsiz pozitsiyaga material biriktirib bo'lmasa, mato sotilganda
-- ombordan hech narsa yechilmasdi.
--
-- ⚠️ Noyob indeks PARTIAL bo'ladi: bitta pozitsiyada bitta slot bir
--    marta uchraydi, slotsiz qator esa bittagina bo'ladi va indeksga
--    umuman tushmaydi.

ALTER TABLE "pozitsiya_material" ALTER COLUMN "slot_id" DROP NOT NULL;

DROP INDEX IF EXISTS "pozitsiya_material_slot";

CREATE UNIQUE INDEX IF NOT EXISTS "pozitsiya_material_slot"
  ON "pozitsiya_material" ("buyurtma_pozitsiya_id", "slot_id")
  WHERE "slot_id" IS NOT NULL;

-- ─── 3. Turi yo'q narx qoidasi ─────────────────────────────────────────
--
-- «Narxlar va turlar» jadvali mahsulot TURIGA bog'langan. Matoning
-- o'zini sotishda tur yo'q, narx esa baribir kerak.
--
-- Bo'sh `mahsulot_tur_id` = «materialni o'zi sotish» qoidasi. Butun
-- bosqichli hisoblash mantig'i qayta ishlatiladi — yangi kod yozilmaydi.
--
-- ⚠️ Noyob indeks `coalesce` bilan: Postgresda NULL lar bir-biriga
--    teng emas va usiz ikkita «materialni o'zi sotish» qatori
--    o'tib ketardi.

ALTER TABLE "mahsulot_narx" ALTER COLUMN "mahsulot_tur_id" DROP NOT NULL;

DROP INDEX IF EXISTS "mahsulot_narx_bitta";

CREATE UNIQUE INDEX IF NOT EXISTS "mahsulot_narx_bitta" ON "mahsulot_narx"
  USING btree (coalesce("mahsulot_tur_id", 0), "narx_guruh_id",
               coalesce("mijoz_turi_id", 0), coalesce("filial_id", 0));
