CREATE TABLE "inventarizatsiya" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" date NOT NULL,
	"filial_id" bigint NOT NULL,
	"holat" text DEFAULT 'OCHIQ' NOT NULL,
	"farq_summa" numeric(14, 2),
	"izoh" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "inventarizatsiya_holat" CHECK ("inventarizatsiya"."holat" IN ('OCHIQ','YAKUNLANDI','STORNO'))
);
--> statement-breakpoint
CREATE TABLE "inventarizatsiya_qator" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"inventarizatsiya_id" bigint NOT NULL,
	"bolak_id" bigint NOT NULL,
	"tizimda_eni_m" numeric(8, 2),
	"tizimda_boyi_m" numeric(8, 2),
	"tizimda_miqdor" numeric(10, 2),
	"haqiqatda_eni_m" numeric(8, 2),
	"haqiqatda_boyi_m" numeric(8, 2),
	"haqiqatda_miqdor" numeric(10, 2),
	"band" boolean DEFAULT false NOT NULL,
	"yolda" boolean DEFAULT false NOT NULL,
	"farq_kv_m" numeric(10, 4),
	"farq_summa" numeric(14, 2),
	"sabab" text,
	"izoh" text,
	CONSTRAINT "inventarizatsiya_qator_sabab" CHECK ("inventarizatsiya_qator"."sabab" IS NULL OR "inventarizatsiya_qator"."sabab" IN (
            'HISOBGA_OLINMAGAN_CHIQINDI','OLCHOV_XATOSI','YOQOLGAN',
            'NOTOGRI_KIRIM','BOSHQA'))
);
--> statement-breakpoint
ALTER TABLE "inventarizatsiya" ADD CONSTRAINT "inventarizatsiya_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventarizatsiya_qator" ADD CONSTRAINT "inventarizatsiya_qator_inventarizatsiya_id_inventarizatsiya_id_fk" FOREIGN KEY ("inventarizatsiya_id") REFERENCES "public"."inventarizatsiya"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventarizatsiya_qator" ADD CONSTRAINT "inventarizatsiya_qator_bolak_id_bolak_id_fk" FOREIGN KEY ("bolak_id") REFERENCES "public"."bolak"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventarizatsiya_filial_sana" ON "inventarizatsiya" USING btree ("filial_id","sana");--> statement-breakpoint
CREATE UNIQUE INDEX "inventarizatsiya_qator_bir_marta" ON "inventarizatsiya_qator" USING btree ("inventarizatsiya_id","bolak_id");--> statement-breakpoint
CREATE INDEX "inventarizatsiya_qator_bolak" ON "inventarizatsiya_qator" USING btree ("bolak_id");