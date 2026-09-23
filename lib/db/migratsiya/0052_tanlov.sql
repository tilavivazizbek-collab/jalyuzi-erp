-- 0052 · TANLOV MODELI — egasi holatlari 2026-09-22
--
-- ⚠️ NEGA KERAK
--
--    Tizim ikki narsani modellashtira olardi: O'LCHOV (son) va
--    MATERIAL (ombordan yeyiladigan narsa). TANLOV esa yo'q edi:
--    zanjir chapdanmi yoki o'ngdan, shiftga yoki devorga, kasseta
--    bormi, lamel 89 yoki 127 mm, bir tomonga yoki markazdan
--    ochiladi, qo'lda yoki motorli.
--
--    Egasi TO'RT MARTA bir xil savol berdi (zebra, dikkey
--    ochilishi, motorli, burchak oyna) va har safar «ikki alohida
--    tur qiling» degan javob oldi — dasturchi uchun arzon, egasi
--    uchun qimmat: har tur ikki barobar sozlanadi.
--
-- ⚠️ UCH DARAJALI TA'SIR, har biri IXTIYORIY:
--
--      1. YOZUV  — variant nomi buyurtmada qoladi va ustaga boradi.
--                  `kod` ham, `narx` ham bo'sh
--      2. NARX   — variant narxga qo'shadi (kasseta +50 000)
--      3. SARF   — variant FORMULAGA son beradi. Tanlovning `kod`i
--                  formulada o'zgaruvchi: CEIL(ENI / LAMEL_ENI)
--
--    Egasi avval «faqat yozilsin» degan edi, lekin o'zining dikkey
--    misoli aksini ko'rsatdi: ochilish tomoni mato soniga ham,
--    mexanizmga ham ta'sir qiladi.
--
-- ⚠️ 3-DARAJA MAVJUD MEXANIZMNI QAYTA ISHLATADI. `lib/domain/formula.ts`
--    nomli parametrlarni allaqachon biladi. Tanlov — bu qiymati
--    ro'yxatdan tanlanadigan parametr, xolos. Yangi formula tili
--    YOZILMAYDI.
--
-- ⚠️ MAVJUD TURLAR O'ZGARMAYDI: tanlovi yo'q tur avvalgidek
--    ishlayveradi, aksessuarning `variant_id` si bo'sh bo'lsa u
--    doim qo'shiladi.

-- ─── Tanlov ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mahsulot_tanlov" (
  "id"              bigserial PRIMARY KEY,
  "mahsulot_tur_id" bigint NOT NULL REFERENCES "mahsulot_tur"("id"),
  -- Formulada ishlatiladigan nom: LAMEL_ENI. NULL — formulaga tegmaydi
  "kod"             text,
  "nom"             text NOT NULL,
  "majburiy"        boolean NOT NULL DEFAULT true,
  "tartib"          integer NOT NULL DEFAULT 0,
  "faol"            boolean NOT NULL DEFAULT true,
  "yaratildi"       timestamptz NOT NULL DEFAULT now(),
  "yaratdi_id"      bigint REFERENCES "xodim"("id"),
  "ozgartirildi"    timestamptz,
  "ozgartirdi_id"   bigint REFERENCES "xodim"("id")
);

ALTER TABLE "mahsulot_tanlov" DROP CONSTRAINT IF EXISTS "tanlov_nom";
ALTER TABLE "mahsulot_tanlov" ADD CONSTRAINT "tanlov_nom"
  CHECK (length(btrim("nom")) > 0);

-- ⚠️ Kod formula tahlilchisi taniydigan shaklda bo'lishi SHART:
--    faqat katta harf, raqam, pastki chiziq va apostrof.
--    `mahsulot_parametr.kod` bilan BIR XIL qoida.
ALTER TABLE "mahsulot_tanlov" DROP CONSTRAINT IF EXISTS "tanlov_kod_shakli";
ALTER TABLE "mahsulot_tanlov" ADD CONSTRAINT "tanlov_kod_shakli"
  CHECK ("kod" IS NULL OR "kod" ~ '^[A-Z][A-Z0-9_'']*$');

-- ⚠️ ENG XAVFLI TO'QNASHUV: admin tanlovga `ENI` kodini qo'ysa,
--    formula oynaning enini emas, TANLOVNING sonini olardi va
--    butun hisob jimgina buzilardi.
ALTER TABLE "mahsulot_tanlov" DROP CONSTRAINT IF EXISTS "tanlov_kod_band_emas";
ALTER TABLE "mahsulot_tanlov" ADD CONSTRAINT "tanlov_kod_band_emas"
  CHECK ("kod" IS NULL OR "kod" NOT IN ('ENI', 'BO''YI', 'MAYDON', 'SONI'));

-- Bitta turda bitta kod — formulada qaysi biri ekani noaniq qolmasin
CREATE UNIQUE INDEX IF NOT EXISTS "tanlov_kod_bitta"
  ON "mahsulot_tanlov" ("mahsulot_tur_id", "kod")
  WHERE "kod" IS NOT NULL AND "faol";

CREATE INDEX IF NOT EXISTS "tanlov_tur" ON "mahsulot_tanlov" ("mahsulot_tur_id", "tartib");

-- ─── Variant ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mahsulot_tanlov_variant" (
  "id"            bigserial PRIMARY KEY,
  "tanlov_id"     bigint NOT NULL REFERENCES "mahsulot_tanlov"("id"),
  "nom"           text NOT NULL,
  -- Formulaga beriladigan son. NULL — bu variant sarfga tegmaydi
  "qiymat"        numeric(10,4),
  -- Qat'iy summa. NULL — narxga tegmaydi.
  -- ⚠️ O'lchamga bog'liq narx `mahsulot_qoshimcha` da: u MAYDON/ENI/
  --    BO'YI usullarini allaqachon biladi va ikkinchi marta yozish
  --    «bir mantiq — bir joyda» ni buzardi.
  "narx"          numeric(14,2),
  "valyuta"       text NOT NULL DEFAULT 'SOM',
  "tartib"        integer NOT NULL DEFAULT 0,
  "faol"          boolean NOT NULL DEFAULT true,
  "yaratildi"     timestamptz NOT NULL DEFAULT now(),
  "yaratdi_id"    bigint REFERENCES "xodim"("id"),
  "ozgartirildi"  timestamptz,
  "ozgartirdi_id" bigint REFERENCES "xodim"("id")
);

ALTER TABLE "mahsulot_tanlov_variant" DROP CONSTRAINT IF EXISTS "variant_nom";
ALTER TABLE "mahsulot_tanlov_variant" ADD CONSTRAINT "variant_nom"
  CHECK (length(btrim("nom")) > 0);

ALTER TABLE "mahsulot_tanlov_variant" DROP CONSTRAINT IF EXISTS "variant_narx";
ALTER TABLE "mahsulot_tanlov_variant" ADD CONSTRAINT "variant_narx"
  CHECK ("narx" IS NULL OR "narx" >= 0);

ALTER TABLE "mahsulot_tanlov_variant" DROP CONSTRAINT IF EXISTS "variant_valyuta";
ALTER TABLE "mahsulot_tanlov_variant" ADD CONSTRAINT "variant_valyuta"
  CHECK ("valyuta" IN ('SOM', 'USD'));

-- ⚠️ Bir tanlovda ikkita bir xil nom bo'lsa sotuvchi qaysi birini
--    tanlaganini bilmasdi. Katta-kichik harf hisobga olinmaydi.
CREATE UNIQUE INDEX IF NOT EXISTS "variant_nom_bitta"
  ON "mahsulot_tanlov_variant" ("tanlov_id", lower(btrim("nom")))
  WHERE "faol";

CREATE INDEX IF NOT EXISTS "variant_tanlov"
  ON "mahsulot_tanlov_variant" ("tanlov_id", "tartib");

-- ─── Aksessuarni variantga bog'lash ─────────────────────────────

-- ⚠️ Motorli jalyuzida zanjir QO'SHILMAYDI, kabel va quvvat manbai
--    qo'shiladi. Qo'lda boshqariladiganda teskari.
--
-- ⚠️ NULL — aksessuar HAR DOIM kerak (avvalgi xulq). Shu sababli
--    mavjud aksessuarlarning birortasi ham o'zgarmaydi.
ALTER TABLE "mahsulot_aksessuar"
  ADD COLUMN IF NOT EXISTS "variant_id" bigint REFERENCES "mahsulot_tanlov_variant"("id");

COMMENT ON COLUMN "mahsulot_aksessuar"."variant_id" IS
  'Aksessuar faqat shu variant tanlanganda qo''shiladi. NULL — doim qo''shiladi.';

-- ─── Buyurtmadagi tanlov — SNAPSHOT bilan ───────────────────────

-- ⚠️ NOM VA QIYMAT NUSXA bo'lib yoziladi (2.3-invariant). Admin keyin
--    variantni o'chirsa yoki nomini o'zgartirsa, eski buyurtma
--    o'zgarmaydi: usta ham, chek ham o'sha kungi nomni ko'radi.
CREATE TABLE IF NOT EXISTS "pozitsiya_tanlov" (
  "id"                     bigserial PRIMARY KEY,
  "buyurtma_pozitsiya_id"  bigint NOT NULL REFERENCES "buyurtma_pozitsiya"("id"),
  "mahsulot_tanlov_id"     bigint NOT NULL REFERENCES "mahsulot_tanlov"("id"),
  "variant_id"             bigint NOT NULL REFERENCES "mahsulot_tanlov_variant"("id"),
  "tanlov_nomi_snapshot"   text NOT NULL,
  "variant_nomi_snapshot"  text NOT NULL,
  -- Formulaga bergan soni — `formula_snapshot` bilan birga saqlanadi
  "qiymat_snapshot"        numeric(10,4),
  -- So'mga o'girilgan holda: kurs o'zgarsa buyurtma o'zgarmaydi
  "narx_snapshot"          numeric(14,2),
  "yaratildi"              timestamptz NOT NULL DEFAULT now(),
  "yaratdi_id"             bigint REFERENCES "xodim"("id"),
  "ozgartirildi"           timestamptz,
  "ozgartirdi_id"          bigint REFERENCES "xodim"("id")
);

ALTER TABLE "pozitsiya_tanlov" DROP CONSTRAINT IF EXISTS "pozitsiya_tanlov_narx";
ALTER TABLE "pozitsiya_tanlov" ADD CONSTRAINT "pozitsiya_tanlov_narx"
  CHECK ("narx_snapshot" IS NULL OR "narx_snapshot" >= 0);

-- ⚠️ Bitta pozitsiyada bitta tanlov BIR MARTA: ikkita javob bo'lsa
--    formula qaysi sonni olishini hech kim bilmasdi.
CREATE UNIQUE INDEX IF NOT EXISTS "pozitsiya_tanlov_bitta"
  ON "pozitsiya_tanlov" ("buyurtma_pozitsiya_id", "mahsulot_tanlov_id");

CREATE INDEX IF NOT EXISTS "pozitsiya_tanlov_poz"
  ON "pozitsiya_tanlov" ("buyurtma_pozitsiya_id");
