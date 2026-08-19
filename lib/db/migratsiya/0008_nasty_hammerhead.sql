CREATE TABLE "band" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bolak_id" bigint NOT NULL,
	"buyurtma_pozitsiya_id" bigint NOT NULL,
	"pozitsiya_material_id" bigint NOT NULL,
	"holat" text DEFAULT 'FAOL' NOT NULL,
	"boshatish_sabab" text,
	"boshatish_izoh" text,
	"boshatildi" timestamp with time zone,
	"amal_qiladi" timestamp with time zone NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "band_holat" CHECK ("band"."holat" IN ('FAOL','ISHLATILDI','BOSHATILDI')),
	CONSTRAINT "band_boshatish_sabab" CHECK ("band"."boshatish_sabab" IS NULL
          OR "band"."boshatish_sabab" IN ('IFLOS','TOPILMADI','RANG','MUDDAT','BEKOR','BOSHQA')),
	CONSTRAINT "band_boshatilganda_sabab" CHECK ("band"."holat" <> 'BOSHATILDI' OR "band"."boshatish_sabab" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "bolak" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"material_id" bigint NOT NULL,
	"filial_id" bigint NOT NULL,
	"kod" text NOT NULL,
	"turi" text NOT NULL,
	"eni_m" numeric(8, 2),
	"boyi_m" numeric(8, 2),
	"miqdor" numeric(10, 2),
	"kirim_qator_id" bigint,
	"ota_bolak_id" bigint,
	"buyurtma_pozitsiya_id" bigint,
	"tannarx_birlik_snapshot" numeric(14, 4) NOT NULL,
	"tannarx_valyuta_snapshot" text DEFAULT 'SOM' NOT NULL,
	"holat" text DEFAULT 'BOSH' NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "bolak_kod_unique" UNIQUE("kod"),
	CONSTRAINT "bolak_turi" CHECK ("bolak"."turi" IN ('RULON','OSTATKA','DONA')),
	CONSTRAINT "bolak_holat" CHECK ("bolak"."holat" IN ('BOSH','BAND','YOLDA','ISHLATILDI','BRAK','CHIQINDI')),
	CONSTRAINT "bolak_valyuta" CHECK ("bolak"."tannarx_valyuta_snapshot" IN ('SOM','USD')),
	CONSTRAINT "bolak_olcham_kerak" CHECK (("bolak"."turi" = 'DONA' AND "bolak"."miqdor" IS NOT NULL)
          OR ("bolak"."turi" <> 'DONA' AND "bolak"."eni_m" IS NOT NULL AND "bolak"."boyi_m" IS NOT NULL)),
	CONSTRAINT "bolak_olcham_musbat" CHECK (("bolak"."eni_m" IS NULL OR "bolak"."eni_m" > 0) AND ("bolak"."boyi_m" IS NULL OR "bolak"."boyi_m" > 0)),
	CONSTRAINT "bolak_ota_ozi_emas" CHECK ("bolak"."ota_bolak_id" IS NULL OR "bolak"."ota_bolak_id" <> "bolak"."id")
);
--> statement-breakpoint
CREATE TABLE "kirim" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"raqam" text NOT NULL,
	"sana" date NOT NULL,
	"filial_id" bigint NOT NULL,
	"yetkazib_beruvchi_id" bigint NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"kurs_snapshot" numeric(10, 2),
	"transport_summa" numeric(14, 2) DEFAULT '0' NOT NULL,
	"bojxona_summa" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tolov_muddati" date,
	"holat" text DEFAULT 'FAOL' NOT NULL,
	"storno_sabab" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "kirim_raqam_unique" UNIQUE("raqam"),
	CONSTRAINT "kirim_holat" CHECK ("kirim"."holat" IN ('FAOL','STORNO')),
	CONSTRAINT "kirim_valyuta" CHECK ("kirim"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "kirim_usd_kurs_kerak" CHECK ("kirim"."valyuta" <> 'USD' OR "kirim"."kurs_snapshot" IS NOT NULL),
	CONSTRAINT "kirim_storno_sabab" CHECK ("kirim"."holat" <> 'STORNO' OR "kirim"."storno_sabab" IS NOT NULL),
	CONSTRAINT "kirim_xarajat_manfiy_emas" CHECK ("kirim"."transport_summa" >= 0 AND "kirim"."bojxona_summa" >= 0)
);
--> statement-breakpoint
CREATE TABLE "kirim_qator" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kirim_id" bigint NOT NULL,
	"material_id" bigint NOT NULL,
	"miqdor_kirim" numeric(12, 2) NOT NULL,
	"narx_birlik" numeric(14, 2) NOT NULL,
	"defekt_miqdor" numeric(12, 2) DEFAULT '0' NOT NULL,
	"defekt_turi" text,
	"transport_ulush" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tannarx_birlik" numeric(14, 4) NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "kirim_qator_miqdor" CHECK ("kirim_qator"."miqdor_kirim" > 0),
	CONSTRAINT "kirim_qator_narx" CHECK ("kirim_qator"."narx_birlik" >= 0),
	CONSTRAINT "kirim_qator_defekt" CHECK ("kirim_qator"."defekt_miqdor" >= 0 AND "kirim_qator"."defekt_miqdor" <= "kirim_qator"."miqdor_kirim"),
	CONSTRAINT "kirim_qator_defekt_turi" CHECK ("kirim_qator"."defekt_turi" IS NULL OR "kirim_qator"."defekt_turi" IN ('QAYTARILADI','HISOBDAN_CHIQADI')),
	CONSTRAINT "kirim_qator_defekt_yonalishi" CHECK ("kirim_qator"."defekt_miqdor" = 0 OR "kirim_qator"."defekt_turi" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "ombor_harakat" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"filial_id" bigint NOT NULL,
	"bolak_id" bigint NOT NULL,
	"turi" text NOT NULL,
	"miqdor_kv_m" numeric(10, 4),
	"miqdor_sm" numeric(12, 2),
	"miqdor_dona" integer,
	"tannarx_summa" numeric(14, 2) NOT NULL,
	"manba_turi" text,
	"manba_id" bigint,
	"izoh" text,
	"xodim_id" bigint NOT NULL,
	CONSTRAINT "ombor_harakat_turi" CHECK ("ombor_harakat"."turi" IN ('KIRIM','KESIM','OSTATKA','CHIQINDI','BRAK',
                        'KOCHIRISH_CHIQDI','KOCHIRISH_KIRDI',
                        'INVENTARIZATSIYA','STORNO','BOSHLANGICH')),
	CONSTRAINT "ombor_harakat_olchov" CHECK ("ombor_harakat"."miqdor_kv_m" IS NOT NULL OR "ombor_harakat"."miqdor_sm" IS NOT NULL OR "ombor_harakat"."miqdor_dona" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "band" ADD CONSTRAINT "band_bolak_id_bolak_id_fk" FOREIGN KEY ("bolak_id") REFERENCES "public"."bolak"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_kirim_qator_id_kirim_qator_id_fk" FOREIGN KEY ("kirim_qator_id") REFERENCES "public"."kirim_qator"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_ota_bolak_id_bolak_id_fk" FOREIGN KEY ("ota_bolak_id") REFERENCES "public"."bolak"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kirim" ADD CONSTRAINT "kirim_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kirim" ADD CONSTRAINT "kirim_yetkazib_beruvchi_id_yetkazib_beruvchi_id_fk" FOREIGN KEY ("yetkazib_beruvchi_id") REFERENCES "public"."yetkazib_beruvchi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kirim_qator" ADD CONSTRAINT "kirim_qator_kirim_id_kirim_id_fk" FOREIGN KEY ("kirim_id") REFERENCES "public"."kirim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kirim_qator" ADD CONSTRAINT "kirim_qator_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ombor_harakat" ADD CONSTRAINT "ombor_harakat_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ombor_harakat" ADD CONSTRAINT "ombor_harakat_bolak_id_bolak_id_fk" FOREIGN KEY ("bolak_id") REFERENCES "public"."bolak"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "band_bitta_faol" ON "band" USING btree ("bolak_id") WHERE "band"."holat" = 'FAOL';--> statement-breakpoint
CREATE INDEX "band_pozitsiya" ON "band" USING btree ("buyurtma_pozitsiya_id");--> statement-breakpoint
CREATE INDEX "band_muddat" ON "band" USING btree ("amal_qiladi") WHERE "band"."holat" = 'FAOL';--> statement-breakpoint
CREATE INDEX "bolak_tanlov" ON "bolak" USING btree ("material_id","filial_id","holat","eni_m") WHERE "bolak"."faol" = true AND "bolak"."holat" = 'BOSH';--> statement-breakpoint
CREATE INDEX "bolak_kirim" ON "bolak" USING btree ("kirim_qator_id");--> statement-breakpoint
CREATE INDEX "bolak_ota" ON "bolak" USING btree ("ota_bolak_id");--> statement-breakpoint
CREATE INDEX "kirim_filial_sana" ON "kirim" USING btree ("filial_id","sana");--> statement-breakpoint
CREATE INDEX "kirim_yetkazib" ON "kirim" USING btree ("yetkazib_beruvchi_id");--> statement-breakpoint
CREATE INDEX "kirim_qator_kirim" ON "kirim_qator" USING btree ("kirim_id");--> statement-breakpoint
CREATE INDEX "kirim_qator_material" ON "kirim_qator" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "ombor_harakat_filial_sana" ON "ombor_harakat" USING btree ("filial_id","sana");--> statement-breakpoint
CREATE INDEX "ombor_harakat_bolak" ON "ombor_harakat" USING btree ("bolak_id");--> statement-breakpoint
CREATE INDEX "ombor_harakat_manba" ON "ombor_harakat" USING btree ("manba_turi","manba_id");