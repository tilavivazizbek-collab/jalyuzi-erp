CREATE TABLE "buyurtma" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"raqam" text NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"mijoz_id" bigint,
	"sotuvchi_id" bigint NOT NULL,
	"sotgan_filial_id" bigint NOT NULL,
	"ishlab_chiqaruvchi_filial_id" bigint NOT NULL,
	"manba" text NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"kurs_snapshot" numeric(10, 2),
	"tayyorlik_sana" date,
	"yopildi" timestamp with time zone,
	"nds_stavka" numeric(5, 2) DEFAULT '0',
	"nds_summa" numeric(14, 2) DEFAULT '0',
	"summa_ndssiz" numeric(14, 2),
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "buyurtma_raqam_unique" UNIQUE("raqam"),
	CONSTRAINT "buyurtma_manba" CHECK ("buyurtma"."manba" IN ('SAYT','BOT')),
	CONSTRAINT "buyurtma_valyuta" CHECK ("buyurtma"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "buyurtma_usd_kurs" CHECK ("buyurtma"."valyuta" <> 'USD' OR "buyurtma"."kurs_snapshot" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "buyurtma_pozitsiya" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"buyurtma_id" bigint NOT NULL,
	"tartib" integer NOT NULL,
	"mahsulot_tur_id" bigint NOT NULL,
	"eni_sm" integer NOT NULL,
	"boyi_sm" integer NOT NULL,
	"soni" integer DEFAULT 1 NOT NULL,
	"narx_snapshot" numeric(14, 2) NOT NULL,
	"chegirma_summa" numeric(14, 2) DEFAULT '0',
	"xizmat_haqi" numeric(14, 2) DEFAULT '0',
	"formula_snapshot" jsonb NOT NULL,
	"usta_id" bigint,
	"stavka_snapshot" numeric(14, 2),
	"tugatildi" timestamp with time zone,
	"holat" text NOT NULL,
	"qayta_kesildi_soni" integer DEFAULT 0 NOT NULL,
	"tannarx_snapshot" numeric(14, 2),
	"tayyor_mahsulot" boolean DEFAULT false NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "buyurtma_pozitsiya_holat" CHECK ("buyurtma_pozitsiya"."holat" IN ('TASDIQ_KUTMOQDA','TASDIQLANGAN','MATERIALGA_KUTMOQDA',
                         'FILIALGA_YUBORILDI','ISHLAB_CHIQARILMOQDA',
                         'TAYYOR','TAYYOR_YOLDA','YETIB_KELDI',
                         'TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR')),
	CONSTRAINT "buyurtma_pozitsiya_olcham" CHECK ("buyurtma_pozitsiya"."eni_sm" > 0 AND "buyurtma_pozitsiya"."boyi_sm" > 0),
	CONSTRAINT "buyurtma_pozitsiya_soni" CHECK ("buyurtma_pozitsiya"."soni" > 0)
);
--> statement-breakpoint
CREATE TABLE "pozitsiya_aksessuar" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"buyurtma_pozitsiya_id" bigint NOT NULL,
	"material_id" bigint NOT NULL,
	"soni" numeric(10, 2) NOT NULL,
	"birlik" text NOT NULL,
	"narx_snapshot" numeric(14, 2) NOT NULL,
	"qolda_kiritildi" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pozitsiya_aksessuar_birlik" CHECK ("pozitsiya_aksessuar"."birlik" IN ('KV_M','SM','DONA')),
	CONSTRAINT "pozitsiya_aksessuar_soni" CHECK ("pozitsiya_aksessuar"."soni" > 0)
);
--> statement-breakpoint
CREATE TABLE "pozitsiya_material" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"buyurtma_pozitsiya_id" bigint NOT NULL,
	"slot_id" bigint NOT NULL,
	"material_id" bigint NOT NULL,
	"hisoblangan_miqdor" numeric(10, 4) NOT NULL,
	"tuzatilgan_miqdor" numeric(10, 4),
	"birlik" text NOT NULL,
	"narx_snapshot" numeric(14, 2) NOT NULL,
	CONSTRAINT "pozitsiya_material_birlik" CHECK ("pozitsiya_material"."birlik" IN ('KV_M','SM','DONA')),
	CONSTRAINT "pozitsiya_material_miqdor" CHECK ("pozitsiya_material"."hisoblangan_miqdor" > 0),
	CONSTRAINT "pozitsiya_material_tuzatilgan" CHECK ("pozitsiya_material"."tuzatilgan_miqdor" IS NULL OR "pozitsiya_material"."tuzatilgan_miqdor" > 0)
);
--> statement-breakpoint
CREATE TABLE "qayta_kesish" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"buyurtma_pozitsiya_id" bigint NOT NULL,
	"soragan_usta_id" bigint NOT NULL,
	"sabab" text NOT NULL,
	"izoh" text,
	"rasm_yol" text,
	"holat" text DEFAULT 'SOROV' NOT NULL,
	"hal_qildi_id" bigint,
	"hal_qilindi" timestamp with time zone,
	"ushlanma_summa" numeric(14, 2) DEFAULT '0',
	"haq_saqlandi" boolean DEFAULT false NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "qayta_kesish_sabab" CHECK ("qayta_kesish"."sabab" IN ('OLCHAM_XATO','MATO_YIRTILDI','TIKUV_BUZILDI',
                         'MEXANIZM_NOSOZ','BOSHQA')),
	CONSTRAINT "qayta_kesish_holat" CHECK ("qayta_kesish"."holat" IN ('SOROV','TASDIQLANDI','RAD_ETILDI'))
);
--> statement-breakpoint
ALTER TABLE "buyurtma" ADD CONSTRAINT "buyurtma_mijoz_id_mijoz_id_fk" FOREIGN KEY ("mijoz_id") REFERENCES "public"."mijoz"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyurtma" ADD CONSTRAINT "buyurtma_sotuvchi_id_xodim_id_fk" FOREIGN KEY ("sotuvchi_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyurtma" ADD CONSTRAINT "buyurtma_sotgan_filial_id_filial_id_fk" FOREIGN KEY ("sotgan_filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyurtma" ADD CONSTRAINT "buyurtma_ishlab_chiqaruvchi_filial_id_filial_id_fk" FOREIGN KEY ("ishlab_chiqaruvchi_filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "buyurtma_pozitsiya_buyurtma_id_buyurtma_id_fk" FOREIGN KEY ("buyurtma_id") REFERENCES "public"."buyurtma"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "buyurtma_pozitsiya_mahsulot_tur_id_mahsulot_tur_id_fk" FOREIGN KEY ("mahsulot_tur_id") REFERENCES "public"."mahsulot_tur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "buyurtma_pozitsiya_usta_id_xodim_id_fk" FOREIGN KEY ("usta_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pozitsiya_aksessuar" ADD CONSTRAINT "pozitsiya_aksessuar_buyurtma_pozitsiya_id_buyurtma_pozitsiya_id_fk" FOREIGN KEY ("buyurtma_pozitsiya_id") REFERENCES "public"."buyurtma_pozitsiya"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pozitsiya_aksessuar" ADD CONSTRAINT "pozitsiya_aksessuar_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pozitsiya_material" ADD CONSTRAINT "pozitsiya_material_buyurtma_pozitsiya_id_buyurtma_pozitsiya_id_fk" FOREIGN KEY ("buyurtma_pozitsiya_id") REFERENCES "public"."buyurtma_pozitsiya"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pozitsiya_material" ADD CONSTRAINT "pozitsiya_material_slot_id_mahsulot_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."mahsulot_slot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pozitsiya_material" ADD CONSTRAINT "pozitsiya_material_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qayta_kesish" ADD CONSTRAINT "qayta_kesish_buyurtma_pozitsiya_id_buyurtma_pozitsiya_id_fk" FOREIGN KEY ("buyurtma_pozitsiya_id") REFERENCES "public"."buyurtma_pozitsiya"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qayta_kesish" ADD CONSTRAINT "qayta_kesish_soragan_usta_id_xodim_id_fk" FOREIGN KEY ("soragan_usta_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qayta_kesish" ADD CONSTRAINT "qayta_kesish_hal_qildi_id_xodim_id_fk" FOREIGN KEY ("hal_qildi_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buyurtma_filial_sana" ON "buyurtma" USING btree ("sotgan_filial_id","sana");--> statement-breakpoint
CREATE INDEX "buyurtma_mijoz" ON "buyurtma" USING btree ("mijoz_id");--> statement-breakpoint
CREATE UNIQUE INDEX "buyurtma_pozitsiya_tartib" ON "buyurtma_pozitsiya" USING btree ("buyurtma_id","tartib");--> statement-breakpoint
CREATE INDEX "buyurtma_pozitsiya_holat_idx" ON "buyurtma_pozitsiya" USING btree ("holat");--> statement-breakpoint
CREATE INDEX "buyurtma_pozitsiya_usta" ON "buyurtma_pozitsiya" USING btree ("usta_id");--> statement-breakpoint
CREATE INDEX "pozitsiya_aksessuar_pozitsiya" ON "pozitsiya_aksessuar" USING btree ("buyurtma_pozitsiya_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pozitsiya_material_slot" ON "pozitsiya_material" USING btree ("buyurtma_pozitsiya_id","slot_id");--> statement-breakpoint
CREATE INDEX "qayta_kesish_pozitsiya" ON "qayta_kesish" USING btree ("buyurtma_pozitsiya_id");--> statement-breakpoint
ALTER TABLE "band" ADD CONSTRAINT "band_pozitsiya_fk" FOREIGN KEY ("buyurtma_pozitsiya_id") REFERENCES "public"."buyurtma_pozitsiya"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band" ADD CONSTRAINT "band_pozitsiya_material_fk" FOREIGN KEY ("pozitsiya_material_id") REFERENCES "public"."pozitsiya_material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_buyurtma_pozitsiya_id_buyurtma_pozitsiya_id_fk" FOREIGN KEY ("buyurtma_pozitsiya_id") REFERENCES "public"."buyurtma_pozitsiya"("id") ON DELETE no action ON UPDATE no action;