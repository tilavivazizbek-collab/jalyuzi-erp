-- NARX QOIDASI — egasi qarori 2026-09-20 · TZ 3.8 · 6.2 · 20.9
--
-- ⚠️ NIMA O'ZGARADI
--
-- Ilgari mijoz narxi MATERIALLARDAN yig'ilardi:
--
--     Σ(slot miqdori × o'sha matoning narxi) + Σ(aksessuar × narxi)
--
-- Egasi buni rad etdi: «endi men belgilab qo'yaman mijozga narx
-- qanday hisoblanishini». Narx endi MAHSULOT TURI va MATO DARAJASI
-- juftligiga qo'yiladi, maydon bo'yicha bosqichli:
--
--     Rulon + Oddiy mato    0 – 0.5 kv.m    8 $
--                           0.5 – 1         5 $
--                           1 dan katta     3 $
--
-- ⚠️ MATERIAL NARXLARI O'CHIRILMAYDI. `material.sotuv_narx`,
--    `material_tur_narx` va `material_filial_narx` joyida qoladi:
--    tayyor mahsulotni to'g'ridan-to'g'ri sotishda (slotsiz
--    pozitsiya) va tannarx/ustama hisobida hamon kerak.
--
-- ⚠️ NEGA QO'LDA YOZILGAN
--
--    `drizzle-kit generate` 0030-snapshotdan beri farqni hisoblaydi,
--    0031–0039 esa qo'lda yozilgan va snapshotsiz. Shuning uchun u
--    allaqachon bazada bor narsalarni qayta yaratmoqchi bo'ladi
--    (`yetkazib_beruvchi_izoh`, `mahsulot_slot.koeffitsient` …) va
--    migratsiya «already exists» bilan yiqilardi. Bu fayl faqat
--    YANGI narsalarni o'z ichiga oladi.
--
-- ⚠️ `IF NOT EXISTS` — migratsiya qayta yurgizilsa ham zarar qilmasin.
--    Bazaning tarixi hozir nomuvofiq (0038 qo'llanmagan, 0039
--    qo'llangan), shuning uchun bu fayl idempotent bo'lishi shart.

-- ─── Narx guruhi — mato darajasi ────────────────────────────────────────
--
-- Bu ALMASHTIRISH GURUHI EMAS. Ikkalasi boshqa savolga javob beradi:
--   almashtirish_guruh — slotda QAYSI materiallar chiqadi
--   narx_guruh         — o'sha materiallardan qaysi biri QIMMAT

CREATE TABLE IF NOT EXISTS "narx_guruh" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"tartib" integer DEFAULT 0 NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "narx_guruh_nom" CHECK (length(btrim("narx_guruh"."nom")) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "narx_guruh_nom_bitta"
  ON "narx_guruh" USING btree (lower(btrim("nom")));

-- Materialga daraja. Bo'sh bo'lishi mumkin: aksessuar va mexanizmga
-- daraja kerak emas, ular mijoz narxiga alohida kirmaydi.
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "narx_guruh_id" bigint;

DO $$ BEGIN
  ALTER TABLE "material" ADD CONSTRAINT "material_narx_guruh_id_narx_guruh_id_fk"
    FOREIGN KEY ("narx_guruh_id") REFERENCES "public"."narx_guruh"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Narx qoidasi — tur × daraja ────────────────────────────────────────
--
-- `mijoz_turi_id` va `filial_id` IXTIYORIY — mavjud naqsh
-- (`material_tur_narx`, `material_filial_narx`): yozuv bo'lsa shu
-- narx, bo'lmasa umumiysi. Shu tufayli TZ 6.2 va 20.9 imkoniyatlari
-- saqlanadi, lekin farq bo'lmagan joyga qator yozilmaydi.

CREATE TABLE IF NOT EXISTS "mahsulot_narx" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mahsulot_tur_id" bigint NOT NULL,
	"narx_guruh_id" bigint NOT NULL,
	"mijoz_turi_id" bigint,
	"filial_id" bigint,
	"hisoblash_usuli" text DEFAULT 'MAYDON' NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "mahsulot_narx_usul"
	  CHECK ("mahsulot_narx"."hisoblash_usuli" IN ('MAYDON','ENI','BO''YI','DONA'))
);

DO $$ BEGIN
  ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_mahsulot_tur_id_mahsulot_tur_id_fk"
    FOREIGN KEY ("mahsulot_tur_id") REFERENCES "public"."mahsulot_tur"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_narx_guruh_id_narx_guruh_id_fk"
    FOREIGN KEY ("narx_guruh_id") REFERENCES "public"."narx_guruh"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_mijoz_turi_id_mijoz_turi_id_fk"
    FOREIGN KEY ("mijoz_turi_id") REFERENCES "public"."mijoz_turi"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "mahsulot_narx" ADD CONSTRAINT "mahsulot_narx_filial_id_filial_id_fk"
    FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ⚠️ `coalesce` bilan: Postgresda NULL lar bir-biriga TENG EMAS,
--    oddiy unique index ikkita «hammaga» qatorini o'tkazib yuborardi.
CREATE UNIQUE INDEX IF NOT EXISTS "mahsulot_narx_bitta" ON "mahsulot_narx"
  USING btree ("mahsulot_tur_id","narx_guruh_id",coalesce("mijoz_turi_id", 0),coalesce("filial_id", 0));

CREATE INDEX IF NOT EXISTS "mahsulot_narx_tur"
  ON "mahsulot_narx" USING btree ("mahsulot_tur_id","faol");

-- ─── Bosqichlar ─────────────────────────────────────────────────────────
--
-- `dan` va `gacha` ning BIRLIGI qoidaning `hisoblash_usuli` iga bog'liq:
-- `MAYDON` da kv.m, `ENI`/`BO'YI` da metr, `DONA` da dona.
-- `gacha` bo'sh = CHEKSIZ — oxirgi bosqich doim shunday, aks holda
-- katta buyurtmaga narx topilmasdi.

CREATE TABLE IF NOT EXISTS "mahsulot_narx_bosqich" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mahsulot_narx_id" bigint NOT NULL,
	"dan" numeric(10, 2) DEFAULT '0' NOT NULL,
	"gacha" numeric(10, 2),
	"narx" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"tartib" integer DEFAULT 0 NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "narx_bosqich_dan" CHECK ("mahsulot_narx_bosqich"."dan" >= 0),
	CONSTRAINT "narx_bosqich_gacha"
	  CHECK ("mahsulot_narx_bosqich"."gacha" IS NULL
	         OR "mahsulot_narx_bosqich"."gacha" > "mahsulot_narx_bosqich"."dan"),
	CONSTRAINT "narx_bosqich_narx" CHECK ("mahsulot_narx_bosqich"."narx" >= 0),
	CONSTRAINT "narx_bosqich_valyuta" CHECK ("mahsulot_narx_bosqich"."valyuta" IN ('SOM','USD'))
);

DO $$ BEGIN
  ALTER TABLE "mahsulot_narx_bosqich" ADD CONSTRAINT "mahsulot_narx_bosqich_mahsulot_narx_id_mahsulot_narx_id_fk"
    FOREIGN KEY ("mahsulot_narx_id") REFERENCES "public"."mahsulot_narx"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "narx_bosqich_qoida"
  ON "mahsulot_narx_bosqich" USING btree ("mahsulot_narx_id","dan");

-- ─── Qo'shimchalar ──────────────────────────────────────────────────────
--
-- Ikki xil qo'shimcha bor va farqi MUHIM:
--   material_id TO'LDIRILGAN — material yeydi, ombordan yechiladi
--                              («usti shabalik» — mato ketadi)
--   material_id BO'SH        — faqat pul qo'shadi (o'rnatish haqi)

CREATE TABLE IF NOT EXISTS "mahsulot_qoshimcha" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mahsulot_tur_id" bigint NOT NULL,
	"nom" text NOT NULL,
	"hisoblash_usuli" text DEFAULT 'QATIY' NOT NULL,
	"narx" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"material_id" bigint,
	"formula" text,
	"almashtirish_guruh_id" bigint,
	"tartib" integer DEFAULT 0 NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "qoshimcha_nom" CHECK (length(btrim("mahsulot_qoshimcha"."nom")) > 0),
	CONSTRAINT "qoshimcha_usul"
	  CHECK ("mahsulot_qoshimcha"."hisoblash_usuli" IN ('QATIY','MAYDON','ENI','BO''YI')),
	CONSTRAINT "qoshimcha_narx" CHECK ("mahsulot_qoshimcha"."narx" >= 0),
	CONSTRAINT "qoshimcha_valyuta" CHECK ("mahsulot_qoshimcha"."valyuta" IN ('SOM','USD')),
	-- Material bor, formula yo'q — jim xato bo'lardi: ombordan nechta
	-- yechishni hech kim bilmaydi va qo'shimcha «bepul» material yeb ketardi.
	CONSTRAINT "qoshimcha_material_formula"
	  CHECK (("mahsulot_qoshimcha"."material_id" IS NULL
	          AND "mahsulot_qoshimcha"."almashtirish_guruh_id" IS NULL)
	         OR ("mahsulot_qoshimcha"."formula" IS NOT NULL
	             AND length(btrim("mahsulot_qoshimcha"."formula")) > 0))
);

DO $$ BEGIN
  ALTER TABLE "mahsulot_qoshimcha" ADD CONSTRAINT "mahsulot_qoshimcha_mahsulot_tur_id_mahsulot_tur_id_fk"
    FOREIGN KEY ("mahsulot_tur_id") REFERENCES "public"."mahsulot_tur"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "mahsulot_qoshimcha" ADD CONSTRAINT "mahsulot_qoshimcha_material_id_material_id_fk"
    FOREIGN KEY ("material_id") REFERENCES "public"."material"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "mahsulot_qoshimcha" ADD CONSTRAINT "mahsulot_qoshimcha_almashtirish_guruh_id_almashtirish_guruh_id_fk"
    FOREIGN KEY ("almashtirish_guruh_id") REFERENCES "public"."almashtirish_guruh"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "qoshimcha_tur"
  ON "mahsulot_qoshimcha" USING btree ("mahsulot_tur_id","faol");

-- ─── Buyurtmada tanlangan qo'shimcha ────────────────────────────────────
--
-- Nom va narx NUSXA bo'lib yoziladi (2.3-invariant): qo'shimchaning
-- narxi o'zgarsa yoki o'chirilsa, eski buyurtma o'zgarmaydi.

CREATE TABLE IF NOT EXISTS "pozitsiya_qoshimcha" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"buyurtma_pozitsiya_id" bigint NOT NULL,
	"mahsulot_qoshimcha_id" bigint NOT NULL,
	"nom_snapshot" text NOT NULL,
	"narx_snapshot" numeric(14, 2) NOT NULL,
	"material_id" bigint,
	"miqdor" numeric(10, 4),
	"birlik" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "pozitsiya_qoshimcha_narx" CHECK ("pozitsiya_qoshimcha"."narx_snapshot" >= 0),
	CONSTRAINT "pozitsiya_qoshimcha_miqdor"
	  CHECK (("pozitsiya_qoshimcha"."material_id" IS NULL
	          AND "pozitsiya_qoshimcha"."miqdor" IS NULL)
	         OR ("pozitsiya_qoshimcha"."miqdor" IS NOT NULL
	             AND "pozitsiya_qoshimcha"."miqdor" > 0
	             AND "pozitsiya_qoshimcha"."birlik" IS NOT NULL))
);

DO $$ BEGIN
  ALTER TABLE "pozitsiya_qoshimcha" ADD CONSTRAINT "pozitsiya_qoshimcha_buyurtma_pozitsiya_id_buyurtma_pozitsiya_id_fk"
    FOREIGN KEY ("buyurtma_pozitsiya_id") REFERENCES "public"."buyurtma_pozitsiya"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "pozitsiya_qoshimcha" ADD CONSTRAINT "pozitsiya_qoshimcha_mahsulot_qoshimcha_id_mahsulot_qoshimcha_id_fk"
    FOREIGN KEY ("mahsulot_qoshimcha_id") REFERENCES "public"."mahsulot_qoshimcha"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "pozitsiya_qoshimcha" ADD CONSTRAINT "pozitsiya_qoshimcha_material_id_material_id_fk"
    FOREIGN KEY ("material_id") REFERENCES "public"."material"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "pozitsiya_qoshimcha_poz"
  ON "pozitsiya_qoshimcha" USING btree ("buyurtma_pozitsiya_id");
