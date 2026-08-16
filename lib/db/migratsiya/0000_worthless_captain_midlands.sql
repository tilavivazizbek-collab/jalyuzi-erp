CREATE TABLE "filial" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"manzil" text,
	"telefon" text,
	"sotadi" boolean DEFAULT true NOT NULL,
	"ishlab_chiqaradi" boolean DEFAULT true NOT NULL,
	"standart_ishlab_chiqaruvchi_id" bigint,
	"kassa_yopilish_soati" time DEFAULT '20:00' NOT NULL,
	"bosh" boolean DEFAULT false NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "filial_ishlab_chiqaruvchi_kerak" CHECK ("filial"."ishlab_chiqaradi" = true OR "filial"."standart_ishlab_chiqaruvchi_id" IS NOT NULL),
	CONSTRAINT "filial_ozi_ozgaga_emas" CHECK ("filial"."standart_ishlab_chiqaruvchi_id" IS NULL OR "filial"."standart_ishlab_chiqaruvchi_id" <> "filial"."id")
);
--> statement-breakpoint
CREATE TABLE "rol" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"tizimli" boolean DEFAULT false NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "rol_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "rol_ruxsat" (
	"rol_id" bigint NOT NULL,
	"ruxsat_kod" text NOT NULL,
	"qamrov" text DEFAULT 'OZ_FILIALI' NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "rol_ruxsat_rol_id_ruxsat_kod_pk" PRIMARY KEY("rol_id","ruxsat_kod"),
	CONSTRAINT "rol_ruxsat_qamrov" CHECK ("rol_ruxsat"."qamrov" IN ('OZ_FILIALI','BARCHA'))
);
--> statement-breakpoint
CREATE TABLE "ruxsat" (
	"kod" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"guruh" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessiya" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"xodim_id" bigint NOT NULL,
	"token_hash" text NOT NULL,
	"amal_qiladi" timestamp with time zone NOT NULL,
	"bekor_qilindi" timestamp with time zone,
	"ip" text,
	"qurilma" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "sessiya_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "xodim" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"filial_id" bigint NOT NULL,
	"ism" text NOT NULL,
	"telefon" text NOT NULL,
	"parol_hash" text,
	"telegram_id" bigint,
	"ishga_kirdi" timestamp,
	"ishdan_chiqdi" timestamp,
	"xato_urinish" bigint DEFAULT 0 NOT NULL,
	"bloklangan" timestamp with time zone,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "xodim_telefon_unique" UNIQUE("telefon"),
	CONSTRAINT "xodim_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "xodim_rol" (
	"xodim_id" bigint NOT NULL,
	"rol_id" bigint NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "xodim_rol_xodim_id_rol_id_pk" PRIMARY KEY("xodim_id","rol_id")
);
--> statement-breakpoint
CREATE TABLE "amal_kaliti" (
	"kalit" text PRIMARY KEY NOT NULL,
	"natija" jsonb NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_jurnal" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" timestamp with time zone DEFAULT now() NOT NULL,
	"xodim_id" bigint NOT NULL,
	"filial_id" bigint,
	"amal" text NOT NULL,
	"obyekt_turi" text NOT NULL,
	"obyekt_id" bigint NOT NULL,
	"eski_qiymat" jsonb,
	"yangi_qiymat" jsonb,
	"izoh" text,
	"ip" text
);
--> statement-breakpoint
CREATE TABLE "kurs_tarix" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sana" date NOT NULL,
	"qiymat" numeric(10, 2) NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint
);
--> statement-breakpoint
CREATE TABLE "sozlama" (
	"kalit" text PRIMARY KEY NOT NULL,
	"qiymat" text NOT NULL,
	"turi" text NOT NULL,
	"guruh" text NOT NULL,
	"tz_band" text,
	"izoh" text,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint
);
--> statement-breakpoint
ALTER TABLE "filial" ADD CONSTRAINT "filial_standart_ishlab_chiqaruvchi_id_filial_id_fk" FOREIGN KEY ("standart_ishlab_chiqaruvchi_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_ruxsat" ADD CONSTRAINT "rol_ruxsat_rol_id_rol_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."rol"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_ruxsat" ADD CONSTRAINT "rol_ruxsat_ruxsat_kod_ruxsat_kod_fk" FOREIGN KEY ("ruxsat_kod") REFERENCES "public"."ruxsat"("kod") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessiya" ADD CONSTRAINT "sessiya_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xodim" ADD CONSTRAINT "xodim_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xodim_rol" ADD CONSTRAINT "xodim_rol_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xodim_rol" ADD CONSTRAINT "xodim_rol_rol_id_rol_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."rol"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_jurnal" ADD CONSTRAINT "audit_jurnal_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_jurnal" ADD CONSTRAINT "audit_jurnal_filial_id_filial_id_fk" FOREIGN KEY ("filial_id") REFERENCES "public"."filial"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "filial_bitta_bosh" ON "filial" USING btree ("bosh") WHERE "filial"."bosh" = true;--> statement-breakpoint
CREATE INDEX "sessiya_xodim" ON "sessiya" USING btree ("xodim_id","amal_qiladi");--> statement-breakpoint
CREATE INDEX "xodim_filial" ON "xodim" USING btree ("filial_id");--> statement-breakpoint
CREATE INDEX "xodim_rol_rol" ON "xodim_rol" USING btree ("rol_id");--> statement-breakpoint
CREATE INDEX "audit_obyekt" ON "audit_jurnal" USING btree ("obyekt_turi","obyekt_id");--> statement-breakpoint
CREATE INDEX "audit_sana" ON "audit_jurnal" USING btree ("sana");--> statement-breakpoint
CREATE INDEX "audit_xodim" ON "audit_jurnal" USING btree ("xodim_id","sana");--> statement-breakpoint
CREATE UNIQUE INDEX "kurs_sana" ON "kurs_tarix" USING btree ("sana");