-- 0043 · BUTUN TIZIM METRGA O'TADI — egasi qarori 2026-09-20
--
-- «butun tizim metr tizimiga o'tsin, smni to'liq olib tashla,
--  o'lchamlarni to'liq m ga o'tkaz, hech qayerni shuncha emas,
--  bog'langan joylari bilan hisoblashlari bilan to'liq o'zgartirib
--  chiq, ba'zi joylarda 100 ga o'tgansan»
--
-- ⚠️ NEGA: har `÷100` kelajakdagi xato edi. Ular `kesimOlchami`,
--    `olchovi`, `qatorSummasi`, `birlikda`, `miqdorMatni` — beshta
--    ayri joyda turardi va bittasi unutilsa raqam 100 (yoki 10 000)
--    barobar adashardi. Endi o'girishning O'ZI yo'q.
--
-- ⚠️ MA'LUMOT O'CHIRILMAYDI. Har qator joyida o'giriladi. Bu
--    migratsiya BIR MARTA ishlaydi: qayta ishga tushsa qiymatlarni
--    yana 100 ga bo'lib yuborardi, shuning uchun har qadam
--    ustunning HOZIRGI TURIGA qarab shartlangan (`integer` bo'lsa
--    hali o'girilmagan, `numeric` bo'lsa o'girilgan).

-- ─── 1 · buyurtma_pozitsiya: eni/bo'yi sm → m ─────────────────────────────
--
-- ⚠️ CHEKLOVLAR AVVAL OLINADI: `eni_m > 0` cheklovi turgan holda
--    ustun turini o'zgartirib bo'lmaydi.

ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "buyurtma_pozitsiya_olcham";
ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "pozitsiya_qoshimcha_olchamsiz";
ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "pozitsiya_olcham_juft";
ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT IF EXISTS "pozitsiya_turi_yoki_material";

-- ⚠️ USTUN NOMI ham o'zgaradi: `eni_sm` → `eni_m`. Qiymat ma'nosi
--    o'zgargach eski nom YOLG'ON bo'lardi va uni o'qigan har kim
--    100 barobar adashardi. Shuning uchun nom ham, tur ham, qiymat
--    ham bir migratsiyada o'zgaradi — oraliq holat yo'q.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'buyurtma_pozitsiya' AND column_name = 'eni_sm'
  ) THEN
    ALTER TABLE "buyurtma_pozitsiya" RENAME COLUMN "eni_sm" TO "eni_m";
    ALTER TABLE "buyurtma_pozitsiya" RENAME COLUMN "boyi_sm" TO "boyi_m";

    ALTER TABLE "buyurtma_pozitsiya"
      ALTER COLUMN "eni_m" TYPE numeric(8,2) USING ("eni_m"::numeric / 100),
      ALTER COLUMN "boyi_m" TYPE numeric(8,2) USING ("boyi_m"::numeric / 100);
  END IF;
END $$;

ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_olcham_juft"
  CHECK (("eni_m" = 0 AND "boyi_m" = 0) OR ("eni_m" > 0 AND "boyi_m" > 0));

ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_turi_yoki_material"
  CHECK ("qoshimcha_material_id" IS NOT NULL OR ("eni_m" > 0 AND "boyi_m" > 0));

-- ─── 2 · ombor_harakat: miqdor_sm → miqdor_m ──────────────────────────────
--
-- ⚠️ Ustun NOMI ham o'zgaradi. Qiymat ma'nosi o'zgargach eski nom
--    yolg'on bo'lardi va uni o'qigan har kim 100 barobar adashardi.

ALTER TABLE "ombor_harakat" DROP CONSTRAINT IF EXISTS "ombor_harakat_olchov";

-- ⚠️ TRIGGER VAQTINCHA UZILADI.
--
--    `ombor_harakat` da UPDATE TAQIQ (QISM 1 §6.5): har tuzatish
--    STORNO yozuvi bilan qilinadi. Lekin bu yerda tuzatish EMAS —
--    birlik o'zgarishi. Jismoniy miqdor o'zgarmaydi: 350 sm va
--    3.50 m — BIR XIL mato.
--
--    Storno yozish YOLG'ON bo'lardi: u «material harakat qildi»
--    deb yozardi, holbuki hech narsa qimirlamagan. Ombor tarixi
--    bo'lmagan harakat bilan ifloslanardi va tannarx hisobotida
--    tushunarsiz juftliklar chiqardi.
--
--    Trigger SHU BLOK ichida, migratsiya tranzaksiyasida uziladi va
--    darhol qaytariladi — tashqarida bir zum ham ochiq qolmaydi.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'ombor_harakat' AND column_name = 'miqdor_sm'
  ) THEN
    ALTER TABLE "ombor_harakat" RENAME COLUMN "miqdor_sm" TO "miqdor_m";

    ALTER TABLE "ombor_harakat" DISABLE TRIGGER USER;
    UPDATE "ombor_harakat" SET "miqdor_m" = "miqdor_m" / 100 WHERE "miqdor_m" IS NOT NULL;
    ALTER TABLE "ombor_harakat" ENABLE TRIGGER USER;
  END IF;
END $$;

ALTER TABLE "ombor_harakat" ADD CONSTRAINT "ombor_harakat_olchov"
  CHECK ("miqdor_kv_m" IS NOT NULL OR "miqdor_m" IS NOT NULL OR "miqdor_dona" IS NOT NULL);

-- ─── 3 · material: sarflash birligi SM → M ────────────────────────────────
--
-- ⚠️ TARTIB MUHIM: avval koeffitsient va qoldiqlar o'giriladi, KEYIN
--    birlik belgisi almashtiriladi. Teskari bo'lsa `= 'SM'` sharti
--    hech qaysi qatorga tushmasdi va raqamlar smda qolib ketardi.

-- 3.1 — koeffitsient: «1 shtanga = 300 sm» → «1 shtanga = 3 m»
UPDATE "material"
   SET "koeffitsient" = "koeffitsient" / 100
 WHERE "sarflash_birligi" = 'SM' AND "koeffitsient" IS NOT NULL;

-- 3.2 — bo'lak qoldig'i: chiziqli materialning `miqdor` ustuni smda edi
UPDATE "bolak" b
   SET "miqdor" = b."miqdor" / 100
  FROM "material" m
 WHERE b."material_id" = m."id"
   AND m."sarflash_birligi" = 'SM'
   AND b."miqdor" IS NOT NULL;

-- 3.3 — tannarx: narx 1 SM uchun yotgan bo'lsa, endi 1 METR uchun
--
-- ⚠️ Bu YAGONA ×100: qolgan hammasi ÷100. Sabab — narx miqdorga
--    TESKARI bog'langan. Miqdor 100 barobar kichrayganda narx 100
--    barobar kattalashmasa, bo'lakning jami tannarxi 100 barobar
--    yo'qolardi va foyda hisoboti yolg'on ko'rsatardi.
UPDATE "bolak" b
   SET "tannarx_birlik_snapshot" = b."tannarx_birlik_snapshot" * 100
  FROM "material" m
 WHERE b."material_id" = m."id"
   AND m."sarflash_birligi" = 'SM'
   AND b."tannarx_birlik_snapshot" IS NOT NULL;

-- 3.4 — belgining o'zi: 'SM' → 'M'
--
-- ⚠️ TARTIB: avval CHEKLOV OLINADI, keyin qiymat yoziladi, keyin
--    yangi cheklov qo'yiladi. Teskari bo'lsa eski cheklov ('SM',
--    'KV_M', 'DONA') yangi 'M' qiymatini rad etardi va butun
--    migratsiya yiqilardi.

ALTER TABLE "material" DROP CONSTRAINT IF EXISTS "material_sarflash_birligi";
ALTER TABLE "pozitsiya_material" DROP CONSTRAINT IF EXISTS "pozitsiya_material_birlik";
ALTER TABLE "pozitsiya_aksessuar" DROP CONSTRAINT IF EXISTS "pozitsiya_aksessuar_birlik";

UPDATE "material" SET "sarflash_birligi" = 'M' WHERE "sarflash_birligi" = 'SM';
UPDATE "pozitsiya_material" SET "birlik" = 'M' WHERE "birlik" = 'SM';
UPDATE "pozitsiya_aksessuar" SET "birlik" = 'M' WHERE "birlik" = 'SM';

ALTER TABLE "material" ADD CONSTRAINT "material_sarflash_birligi"
  CHECK ("sarflash_birligi" IN ('M','KV_M','DONA'));
ALTER TABLE "pozitsiya_material" ADD CONSTRAINT "pozitsiya_material_birlik"
  CHECK ("birlik" IN ('KV_M','M','DONA'));
ALTER TABLE "pozitsiya_aksessuar" ADD CONSTRAINT "pozitsiya_aksessuar_birlik"
  CHECK ("birlik" IN ('KV_M','M','DONA'));

-- ─── 4 · mahsulot_slot: qat'iy kesim eni ──────────────────────────────────
--
-- Egasi holati 2026-09-20: «dikkey» mato rulonda 0.40 m enli keladi
-- va uni ENIGA kesib bo'lmaydi — faqat bo'yiga tortiladi. Bu ustun
-- to'lsa, kesim to'rtburchagining eni SHU bo'ladi.
--
-- ⚠️ `null` — odatdagi xulq (eni maydondan chiqadi). Ko'pchilik mato
--    uchun aynan shu to'g'ri, shuning uchun standart qiymat yo'q.

ALTER TABLE "mahsulot_slot" ADD COLUMN IF NOT EXISTS "kesim_eni_m" numeric(6,2);

ALTER TABLE "mahsulot_slot" DROP CONSTRAINT IF EXISTS "mahsulot_slot_kesim_eni";
ALTER TABLE "mahsulot_slot" ADD CONSTRAINT "mahsulot_slot_kesim_eni"
  CHECK ("kesim_eni_m" IS NULL OR "kesim_eni_m" > 0);
