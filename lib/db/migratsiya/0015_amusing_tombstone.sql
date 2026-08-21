CREATE TABLE "kassa" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"filial_id" bigint NOT NULL,
	"xodim_id" bigint,
	"turi" text NOT NULL,
	"valyuta" text NOT NULL,
	"nom" text NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "kassa_turi" CHECK ("kassa"."turi" IN ('NAQD','KARTA','BANK')),
	CONSTRAINT "kassa_valyuta" CHECK ("kassa"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "kassa_karta_admin" CHECK ("kassa"."turi" <> 'KARTA' OR "kassa"."xodim_id" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "kassa_kun" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kassa_id" bigint NOT NULL,
	"sana" date NOT NULL,
	"boshlangich" numeric(14, 2) NOT NULL,
	"kirim" numeric(14, 2) NOT NULL,
	"chiqim" numeric(14, 2) NOT NULL,
	"hisoblangan" numeric(14, 2) NOT NULL,
	"sanaldi" numeric(14, 2),
	"farq" numeric(14, 2),
	"yopildi" timestamp with time zone,
	"yopdi_id" bigint,
	"qayta_ochildi" timestamp with time zone,
	"izoh" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint
);
--> statement-breakpoint
CREATE TABLE "kassa_yozuv" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"kassa_id" bigint NOT NULL,
	"kod" text NOT NULL,
	"summa" numeric(14, 2) NOT NULL,
	"valyuta" text NOT NULL,
	"manba_turi" text NOT NULL,
	"manba_id" bigint NOT NULL,
	"qator" bigint DEFAULT 1 NOT NULL,
	"storno_id" bigint,
	"izoh" text,
	"xodim_id" bigint NOT NULL,
	CONSTRAINT "kassa_yozuv_valyuta" CHECK ("kassa_yozuv"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "kassa_yozuv_summa" CHECK ("kassa_yozuv"."summa" <> 0)
);
--> statement-breakpoint
CREATE TABLE "mijoz_harakat" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"mijoz_id" bigint NOT NULL,
	"filial_id" bigint NOT NULL,
	"turi" text NOT NULL,
	"summa" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"kurs_snapshot" numeric(10, 2),
	"manba_turi" text,
	"manba_id" bigint,
	"izoh" text,
	"xodim_id" bigint NOT NULL,
	CONSTRAINT "mijoz_harakat_turi" CHECK ("mijoz_harakat"."turi" IN ('SOTUV','TOLOV','QAYTARISH','AVANS','UMIDSIZ_QARZ',
                        'BOSHLANGICH')),
	CONSTRAINT "mijoz_harakat_valyuta" CHECK ("mijoz_harakat"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "mijoz_harakat_usd_kurs" CHECK ("mijoz_harakat"."valyuta" <> 'USD' OR "mijoz_harakat"."kurs_snapshot" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "stavka" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mahsulot_tur_id" bigint NOT NULL,
	"filial_id" bigint,
	"xodim_id" bigint,
	"qiymat" numeric(14, 2) NOT NULL,
	"birlik" text NOT NULL,
	"amal_qiladi_dan" date NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "stavka_birlik" CHECK ("stavka"."birlik" IN ('KV_M','DONA')),
	CONSTRAINT "stavka_qiymat" CHECK ("stavka"."qiymat" >= 0)
);
--> statement-breakpoint
CREATE TABLE "topshiriq" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kimdan_kassa_id" bigint NOT NULL,
	"kimga_kassa_id" bigint NOT NULL,
	"summa" numeric(14, 2) NOT NULL,
	"valyuta" text NOT NULL,
	"holat" text DEFAULT 'JONATILDI' NOT NULL,
	"qabul_qildi_id" bigint,
	"qabul_qilindi" timestamp with time zone,
	"izoh" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "topshiriq_holat" CHECK ("topshiriq"."holat" IN ('JONATILDI','QABUL','BEKOR')),
	CONSTRAINT "topshiriq_summa" CHECK ("topshiriq"."summa" > 0),
	CONSTRAINT "topshiriq_valyuta" CHECK ("topshiriq"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "topshiriq_ozgacha" CHECK ("topshiriq"."kimdan_kassa_id" <> "topshiriq"."kimga_kassa_id")
);
--> statement-breakpoint
CREATE TABLE "xarajat" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" date NOT NULL,
	"filial_id" bigint NOT NULL,
	"modda" text NOT NULL,
	"summa" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"kassa_yozuv_id" bigint,
	"manba_turi" text,
	"manba_id" bigint,
	"izoh" text,
	"xodim_id" bigint NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "xarajat_modda" CHECK ("xarajat"."modda" IN ('ISH_HAQI','TRANSPORT_BOJXONA','OMBOR_BRAKI',
                         'ISHLAB_CHIQARISH_BRAKI','CHIQINDI','KURS_FARQI',
                         'YETKAZIB_BERUVCHI_DEFEKTI','UMIDSIZ_QARZ',
                         'BANK_KOMISSIYASI','OPERATSION',
                         'INVENTARIZATSIYA_FARQI','YAXLITLASH',
                         'XODIM_BALANSI_HISOBDAN','FILIALLARARO_TRANSPORT',
                         'BOSHQA')),
	CONSTRAINT "xarajat_valyuta" CHECK ("xarajat"."valyuta" IN ('SOM','USD'))
);
--> statement-breakpoint
CREATE TABLE "xodim_harakat" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"xodim_id" bigint NOT NULL,
	"filial_id" bigint NOT NULL,
	"turi" text NOT NULL,
	"summa" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"kurs_snapshot" numeric(10, 2),
	"manba_turi" text,
	"manba_id" bigint,
	"izoh" text,
	"xodim_yozdi_id" bigint NOT NULL,
	CONSTRAINT "xodim_harakat_turi" CHECK ("xodim_harakat"."turi" IN ('HAQ','AVANS','TOLOV','USHLANMA','JARIMA',
                        'QOLDA_TUZATISH','HAQ_BEKOR','HISOBDAN_CHIQARISH')),
	CONSTRAINT "xodim_harakat_valyuta" CHECK ("xodim_harakat"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "xodim_harakat_usd_kurs" CHECK ("xodim_harakat"."valyuta" <> 'USD' OR "xodim_harakat"."kurs_snapshot" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "yetkazib_beruvchi_harakat" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"yetkazib_beruvchi_id" bigint NOT NULL,
	"filial_id" bigint NOT NULL,
	"turi" text NOT NULL,
	"summa" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"kurs_snapshot" numeric(10, 2),
	"manba_turi" text,
	"manba_id" bigint,
	"izoh" text,
	"xodim_id" bigint NOT NULL,
	CONSTRAINT "yetkazib_harakat_turi" CHECK ("yetkazib_beruvchi_harakat"."turi" IN ('XARID','TOLOV','AVANS','DAVO','BOSHLANGICH')),
	CONSTRAINT "yetkazib_harakat_valyuta" CHECK ("yetkazib_beruvchi_harakat"."valyuta" IN ('SOM','USD')),
	CONSTRAINT "yetkazib_harakat_usd_kurs" CHECK ("yetkazib_beruvchi_harakat"."valyuta" <> 'USD' OR "yetkazib_beruvchi_harakat"."kurs_snapshot" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "kassa" ADD CONSTRAINT "kassa_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kassa" ADD CONSTRAINT "kassa_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kassa_kun" ADD CONSTRAINT "kassa_kun_kassa_id_kassa_id_fk" FOREIGN KEY ("kassa_id") REFERENCES "public"."kassa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kassa_kun" ADD CONSTRAINT "kassa_kun_yopdi_id_xodim_id_fk" FOREIGN KEY ("yopdi_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kassa_yozuv" ADD CONSTRAINT "kassa_yozuv_kassa_id_kassa_id_fk" FOREIGN KEY ("kassa_id") REFERENCES "public"."kassa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kassa_yozuv" ADD CONSTRAINT "kassa_yozuv_storno_id_kassa_yozuv_id_fk" FOREIGN KEY ("storno_id") REFERENCES "public"."kassa_yozuv"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mijoz_harakat" ADD CONSTRAINT "mijoz_harakat_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stavka" ADD CONSTRAINT "stavka_mahsulot_tur_id_mahsulot_tur_id_fk" FOREIGN KEY ("mahsulot_tur_id") REFERENCES "public"."mahsulot_tur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stavka" ADD CONSTRAINT "stavka_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stavka" ADD CONSTRAINT "stavka_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topshiriq" ADD CONSTRAINT "topshiriq_kimdan_kassa_id_kassa_id_fk" FOREIGN KEY ("kimdan_kassa_id") REFERENCES "public"."kassa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topshiriq" ADD CONSTRAINT "topshiriq_kimga_kassa_id_kassa_id_fk" FOREIGN KEY ("kimga_kassa_id") REFERENCES "public"."kassa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topshiriq" ADD CONSTRAINT "topshiriq_qabul_qildi_id_xodim_id_fk" FOREIGN KEY ("qabul_qildi_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xarajat" ADD CONSTRAINT "xarajat_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xarajat" ADD CONSTRAINT "xarajat_kassa_yozuv_id_kassa_yozuv_id_fk" FOREIGN KEY ("kassa_yozuv_id") REFERENCES "public"."kassa_yozuv"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xodim_harakat" ADD CONSTRAINT "xodim_harakat_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xodim_harakat" ADD CONSTRAINT "xodim_harakat_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yetkazib_beruvchi_harakat" ADD CONSTRAINT "yetkazib_beruvchi_harakat_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kassa_bitta" ON "kassa" USING btree ("filial_id","xodim_id","turi","valyuta") WHERE "kassa"."xodim_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "kassa_filial_bitta" ON "kassa" USING btree ("filial_id","turi","valyuta") WHERE "kassa"."xodim_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "kassa_kun_bitta" ON "kassa_kun" USING btree ("kassa_id","sana");--> statement-breakpoint
CREATE UNIQUE INDEX "kassa_yozuv_manba" ON "kassa_yozuv" USING btree ("manba_turi","manba_id","qator");--> statement-breakpoint
CREATE UNIQUE INDEX "kassa_yozuv_storno" ON "kassa_yozuv" USING btree ("storno_id") WHERE "kassa_yozuv"."storno_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "kassa_yozuv_kassa_sana" ON "kassa_yozuv" USING btree ("kassa_id","sana");--> statement-breakpoint
CREATE INDEX "mijoz_harakat_mijoz" ON "mijoz_harakat" USING btree ("mijoz_id","sana");--> statement-breakpoint
CREATE INDEX "stavka_tur" ON "stavka" USING btree ("mahsulot_tur_id","amal_qiladi_dan");--> statement-breakpoint
CREATE INDEX "topshiriq_holat_idx" ON "topshiriq" USING btree ("holat");--> statement-breakpoint
CREATE INDEX "xarajat_filial_sana" ON "xarajat" USING btree ("filial_id","sana");--> statement-breakpoint
CREATE INDEX "xarajat_modda_idx" ON "xarajat" USING btree ("modda");--> statement-breakpoint
CREATE INDEX "xodim_harakat_xodim" ON "xodim_harakat" USING btree ("xodim_id","sana");--> statement-breakpoint
CREATE INDEX "xodim_harakat_manba" ON "xodim_harakat" USING btree ("manba_turi","manba_id");--> statement-breakpoint
CREATE INDEX "yetkazib_harakat_kim" ON "yetkazib_beruvchi_harakat" USING btree ("yetkazib_beruvchi_id","sana");