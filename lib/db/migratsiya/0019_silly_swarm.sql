CREATE TABLE "filial_harakat" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"kimdan_filial_id" bigint NOT NULL,
	"kimga_filial_id" bigint NOT NULL,
	"turi" text NOT NULL,
	"summa" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"kurs_snapshot" numeric(10, 2),
	"manba_turi" text,
	"manba_id" bigint,
	"qolda_ozgartirildi" boolean DEFAULT false NOT NULL,
	"ozgartirish_sabab" text,
	"izoh" text,
	"xodim_id" bigint NOT NULL,
	CONSTRAINT "filial_harakat_turi" CHECK ("filial_harakat"."turi" IN ('TAYYOR_MAHSULOT','MATERIAL_KOCHIRISH',
                        'PUL_TOPSHIRISH','TOLOV','QAYTARISH','QOLDA_TUZATISH')),
	CONSTRAINT "filial_harakat_filiallar" CHECK ("filial_harakat"."kimdan_filial_id" <> "filial_harakat"."kimga_filial_id"),
	CONSTRAINT "filial_harakat_valyuta" CHECK ("filial_harakat"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "filial_harakat_summa" CHECK ("filial_harakat"."summa" <> 0),
	CONSTRAINT "filial_harakat_usd_kurs" CHECK ("filial_harakat"."valyuta" <> 'USD' OR "filial_harakat"."kurs_snapshot" IS NOT NULL),
	CONSTRAINT "filial_harakat_qolda_sabab" CHECK ("filial_harakat"."qolda_ozgartirildi" = false OR "filial_harakat"."ozgartirish_sabab" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "kochirish" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"raqam" text NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"kimdan_filial_id" bigint NOT NULL,
	"kimga_filial_id" bigint NOT NULL,
	"holat" text DEFAULT 'SOROV' NOT NULL,
	"jonatdi_id" bigint,
	"jonatildi" timestamp with time zone,
	"qabul_qildi_id" bigint,
	"qabul_qilindi" timestamp with time zone,
	"qarz_summa" numeric(14, 2),
	"qarz_qolda" boolean DEFAULT false NOT NULL,
	"qarz_sabab" text,
	"bekor_sabab" text,
	"izoh" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "kochirish_raqam_unique" UNIQUE("raqam"),
	CONSTRAINT "kochirish_holat" CHECK ("kochirish"."holat" IN ('SOROV','YOLDA','QABUL','BEKOR')),
	CONSTRAINT "kochirish_filiallar" CHECK ("kochirish"."kimdan_filial_id" <> "kochirish"."kimga_filial_id"),
	CONSTRAINT "kochirish_qarz_sabab" CHECK ("kochirish"."qarz_qolda" = false OR "kochirish"."qarz_sabab" IS NOT NULL),
	CONSTRAINT "kochirish_bekor_sabab" CHECK ("kochirish"."holat" <> 'BEKOR' OR "kochirish"."bekor_sabab" IS NOT NULL),
	CONSTRAINT "kochirish_jonatdi" CHECK ("kochirish"."holat" IN ('SOROV','BEKOR')
          OR ("kochirish"."jonatdi_id" IS NOT NULL AND "kochirish"."jonatildi" IS NOT NULL)),
	CONSTRAINT "kochirish_qabul" CHECK ("kochirish"."holat" <> 'QABUL'
          OR ("kochirish"."qabul_qildi_id" IS NOT NULL AND "kochirish"."qabul_qilindi" IS NOT NULL)),
	CONSTRAINT "kochirish_qarz_manfiy_emas" CHECK ("kochirish"."qarz_summa" IS NULL OR "kochirish"."qarz_summa" >= 0)
);
--> statement-breakpoint
CREATE TABLE "kochirish_qator" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kochirish_id" bigint NOT NULL,
	"bolak_id" bigint NOT NULL,
	"tannarx_summa_snapshot" numeric(14, 2) NOT NULL,
	"eni_m_snapshot" numeric(8, 2),
	"boyi_m_snapshot" numeric(8, 2),
	"miqdor_snapshot" numeric(10, 2),
	"haqiqiy_eni_m" numeric(8, 2),
	"haqiqiy_boyi_m" numeric(8, 2),
	"haqiqiy_miqdor" numeric(10, 2),
	"olchov_izoh" text,
	CONSTRAINT "kochirish_qator_tannarx" CHECK ("kochirish_qator"."tannarx_summa_snapshot" >= 0)
);
--> statement-breakpoint
ALTER TABLE "filial_harakat" ADD CONSTRAINT "filial_harakat_kimdan_filial_id_filial_id_fk" FOREIGN KEY ("kimdan_filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filial_harakat" ADD CONSTRAINT "filial_harakat_kimga_filial_id_filial_id_fk" FOREIGN KEY ("kimga_filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filial_harakat" ADD CONSTRAINT "filial_harakat_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kochirish" ADD CONSTRAINT "kochirish_kimdan_filial_id_filial_id_fk" FOREIGN KEY ("kimdan_filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kochirish" ADD CONSTRAINT "kochirish_kimga_filial_id_filial_id_fk" FOREIGN KEY ("kimga_filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kochirish" ADD CONSTRAINT "kochirish_jonatdi_id_xodim_id_fk" FOREIGN KEY ("jonatdi_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kochirish" ADD CONSTRAINT "kochirish_qabul_qildi_id_xodim_id_fk" FOREIGN KEY ("qabul_qildi_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kochirish_qator" ADD CONSTRAINT "kochirish_qator_kochirish_id_kochirish_id_fk" FOREIGN KEY ("kochirish_id") REFERENCES "public"."kochirish"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kochirish_qator" ADD CONSTRAINT "kochirish_qator_bolak_id_bolak_id_fk" FOREIGN KEY ("bolak_id") REFERENCES "public"."bolak"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "filial_harakat_manba" ON "filial_harakat" USING btree ("manba_turi","manba_id","turi") WHERE "filial_harakat"."manba_turi" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "filial_harakat_kimdan" ON "filial_harakat" USING btree ("kimdan_filial_id","sana");--> statement-breakpoint
CREATE INDEX "filial_harakat_kimga" ON "filial_harakat" USING btree ("kimga_filial_id","sana");--> statement-breakpoint
CREATE INDEX "kochirish_kimdan" ON "kochirish" USING btree ("kimdan_filial_id","sana");--> statement-breakpoint
CREATE INDEX "kochirish_kimga" ON "kochirish" USING btree ("kimga_filial_id","sana");--> statement-breakpoint
CREATE INDEX "kochirish_holat_idx" ON "kochirish" USING btree ("holat");--> statement-breakpoint
CREATE UNIQUE INDEX "kochirish_qator_bolak" ON "kochirish_qator" USING btree ("kochirish_id","bolak_id");--> statement-breakpoint
CREATE INDEX "kochirish_qator_hujjat" ON "kochirish_qator" USING btree ("kochirish_id");--> statement-breakpoint
CREATE INDEX "kochirish_qator_bolak_idx" ON "kochirish_qator" USING btree ("bolak_id");