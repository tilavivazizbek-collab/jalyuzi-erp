CREATE TABLE "almashtirish_guruh" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint
);
--> statement-breakpoint
CREATE TABLE "mahsulot_aksessuar" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mahsulot_tur_id" bigint NOT NULL,
	"material_id" bigint NOT NULL,
	"formula" text NOT NULL,
	"majburiy" boolean DEFAULT true NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint
);
--> statement-breakpoint
CREATE TABLE "mahsulot_parametr" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mahsulot_tur_id" bigint NOT NULL,
	"kod" text NOT NULL,
	"nom" text NOT NULL,
	"standart_qiymat" numeric(10, 2),
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "mahsulot_parametr_kod_shakli" CHECK ("mahsulot_parametr"."kod" ~ '^[A-Z][A-Z0-9_'']*$')
);
--> statement-breakpoint
CREATE TABLE "mahsulot_slot" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mahsulot_tur_id" bigint NOT NULL,
	"nom" text NOT NULL,
	"tartib" integer DEFAULT 0 NOT NULL,
	"majburiy" boolean DEFAULT true NOT NULL,
	"almashtirish_guruh_id" bigint,
	"formula" text NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint
);
--> statement-breakpoint
CREATE TABLE "mahsulot_tur" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"xizmat_haqi" numeric(14, 2) DEFAULT '0',
	"tartib" integer DEFAULT 0 NOT NULL,
	"oynada_korinadi" boolean DEFAULT true NOT NULL,
	"botda_korinadi" boolean DEFAULT true NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "mahsulot_tur_xizmat_haqi_manfiy_emas" CHECK ("mahsulot_tur"."xizmat_haqi" IS NULL OR "mahsulot_tur"."xizmat_haqi" >= 0)
);
--> statement-breakpoint
CREATE TABLE "material" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"hisob_turi" text NOT NULL,
	"kirim_birligi" text NOT NULL,
	"sarflash_birligi" text NOT NULL,
	"koeffitsient" numeric(10, 4) DEFAULT '1' NOT NULL,
	"sotuv_narx" numeric(14, 2),
	"sotuv_valyuta" text DEFAULT 'SOM' NOT NULL,
	"min_ustama_foiz" numeric(6, 2),
	"yaroqsiz_chegara_m" numeric(6, 2),
	"kam_ishlatiladigan_m" numeric(6, 2),
	"kam_qoldiq_chegara_m" numeric(6, 2),
	"standart_rulon_eni_m" numeric(6, 2),
	"almashtirish_guruh_id" bigint,
	"yaxlitlash_qadami" numeric(8, 2),
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "material_hisob_turi" CHECK ("material"."hisob_turi" IN ('RULON','CHIZIQLI','DONA','KV_M')),
	CONSTRAINT "material_sarflash_birligi" CHECK ("material"."sarflash_birligi" IN ('SM','KV_M','DONA')),
	CONSTRAINT "material_valyuta" CHECK ("material"."sotuv_valyuta" IN ('SOM','USD')),
	CONSTRAINT "material_koeffitsient_musbat" CHECK ("material"."koeffitsient" > 0),
	CONSTRAINT "material_narx_manfiy_emas" CHECK ("material"."sotuv_narx" IS NULL OR "material"."sotuv_narx" >= 0)
);
--> statement-breakpoint
CREATE TABLE "material_filial_narx" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"material_id" bigint NOT NULL,
	"filial_id" bigint NOT NULL,
	"sotuv_narx" numeric(14, 2) NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "material_filial_narx_manfiy_emas" CHECK ("material_filial_narx"."sotuv_narx" >= 0)
);
--> statement-breakpoint
CREATE TABLE "mijoz" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ism" text NOT NULL,
	"telefon" text,
	"telegram_id" bigint,
	"manzil" text,
	"offset_turi" text,
	"offset_qiymat" numeric(14, 2),
	"qarz_limiti" numeric(14, 2),
	"eslatma" text,
	"shaxs_turi" text DEFAULT 'JISMONIY' NOT NULL,
	"tashkilot_nomi" text,
	"inn" text,
	"yuridik_manzil" text,
	"bank_nomi" text,
	"hisob_raqam" text,
	"mfo" text,
	"shartnoma_raqam" text,
	"shartnoma_sana" date,
	"nds_tolovchi" boolean DEFAULT false NOT NULL,
	"nds_stavka" numeric(5, 2),
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "mijoz_telefon_unique" UNIQUE("telefon"),
	CONSTRAINT "mijoz_telegram_id_unique" UNIQUE("telegram_id"),
	CONSTRAINT "mijoz_shaxs_turi" CHECK ("mijoz"."shaxs_turi" IN ('JISMONIY','YURIDIK')),
	CONSTRAINT "mijoz_offset_turi" CHECK ("mijoz"."offset_turi" IS NULL OR "mijoz"."offset_turi" IN ('FOIZ','SOM','USD')),
	CONSTRAINT "mijoz_offset_toliq" CHECK (("mijoz"."offset_turi" IS NULL AND "mijoz"."offset_qiymat" IS NULL)
          OR ("mijoz"."offset_turi" IS NOT NULL AND "mijoz"."offset_qiymat" IS NOT NULL)),
	CONSTRAINT "mijoz_yuridik_toliq" CHECK ("mijoz"."shaxs_turi" <> 'YURIDIK'
          OR ("mijoz"."tashkilot_nomi" IS NOT NULL AND "mijoz"."inn" IS NOT NULL
              AND "mijoz"."yuridik_manzil" IS NOT NULL)),
	CONSTRAINT "mijoz_limit_manfiy_emas" CHECK ("mijoz"."qarz_limiti" IS NULL OR "mijoz"."qarz_limiti" >= 0)
);
--> statement-breakpoint
CREATE TABLE "yetkazib_beruvchi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"telefon" text,
	"manzil" text,
	"tolov_muddati_kun" integer,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"eslatma" text,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "yetkazib_beruvchi_valyuta" CHECK ("yetkazib_beruvchi"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "yetkazib_beruvchi_muddat" CHECK ("yetkazib_beruvchi"."tolov_muddati_kun" IS NULL OR "yetkazib_beruvchi"."tolov_muddati_kun" >= 0)
);
--> statement-breakpoint
ALTER TABLE "mahsulot_aksessuar" ADD CONSTRAINT "mahsulot_aksessuar_mahsulot_tur_id_mahsulot_tur_id_fk" FOREIGN KEY ("mahsulot_tur_id") REFERENCES "public"."mahsulot_tur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahsulot_aksessuar" ADD CONSTRAINT "mahsulot_aksessuar_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahsulot_parametr" ADD CONSTRAINT "mahsulot_parametr_mahsulot_tur_id_mahsulot_tur_id_fk" FOREIGN KEY ("mahsulot_tur_id") REFERENCES "public"."mahsulot_tur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahsulot_slot" ADD CONSTRAINT "mahsulot_slot_mahsulot_tur_id_mahsulot_tur_id_fk" FOREIGN KEY ("mahsulot_tur_id") REFERENCES "public"."mahsulot_tur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahsulot_slot" ADD CONSTRAINT "mahsulot_slot_almashtirish_guruh_id_almashtirish_guruh_id_fk" FOREIGN KEY ("almashtirish_guruh_id") REFERENCES "public"."almashtirish_guruh"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_almashtirish_guruh_id_almashtirish_guruh_id_fk" FOREIGN KEY ("almashtirish_guruh_id") REFERENCES "public"."almashtirish_guruh"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_filial_narx" ADD CONSTRAINT "material_filial_narx_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_filial_narx" ADD CONSTRAINT "material_filial_narx_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mahsulot_aksessuar_bitta" ON "mahsulot_aksessuar" USING btree ("mahsulot_tur_id","material_id");--> statement-breakpoint
CREATE INDEX "mahsulot_aksessuar_material" ON "mahsulot_aksessuar" USING btree ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mahsulot_parametr_kod" ON "mahsulot_parametr" USING btree ("mahsulot_tur_id","kod");--> statement-breakpoint
CREATE INDEX "mahsulot_slot_tur" ON "mahsulot_slot" USING btree ("mahsulot_tur_id","tartib");--> statement-breakpoint
CREATE INDEX "material_guruh" ON "material" USING btree ("almashtirish_guruh_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_filial_narx_bitta" ON "material_filial_narx" USING btree ("material_id","filial_id");--> statement-breakpoint
CREATE INDEX "mijoz_ism" ON "mijoz" USING btree ("ism");