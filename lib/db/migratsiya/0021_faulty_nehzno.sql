CREATE TABLE "bot_sessiya" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"qadam" text DEFAULT 'BOSH' NOT NULL,
	"holat" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tegildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "bot_sessiya_qadam" CHECK ("bot_sessiya"."qadam" IN ('BOSH','ISM_TASDIQ','TELEFON','TUR_TANLASH',
                         'SLOT_MATO','ENI','BOYI','AKSESSUAR','IZOH','SAVAT'))
);
--> statement-breakpoint
CREATE TABLE "bot_xabar" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"xodim_id" bigint,
	"matn" text NOT NULL,
	"holat" text DEFAULT 'NAVBATDA' NOT NULL,
	"manba_turi" text,
	"manba_id" bigint,
	"yuborildi" timestamp with time zone,
	"xato_sabab" text,
	"urinishlar" bigint DEFAULT 0 NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "bot_xabar_holat" CHECK ("bot_xabar"."holat" IN ('NAVBATDA','YUBORILDI','YETMADI')),
	CONSTRAINT "bot_xabar_sabab" CHECK ("bot_xabar"."holat" <> 'YETMADI' OR "bot_xabar"."xato_sabab" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "bot_xabar" ADD CONSTRAINT "bot_xabar_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "public"."xodim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bot_sessiya_telegram" ON "bot_sessiya" USING btree ("telegram_id");--> statement-breakpoint
CREATE INDEX "bot_sessiya_tegildi" ON "bot_sessiya" USING btree ("tegildi");--> statement-breakpoint
CREATE INDEX "bot_xabar_navbat" ON "bot_xabar" USING btree ("holat") WHERE "bot_xabar"."holat" = 'NAVBATDA';--> statement-breakpoint
CREATE INDEX "bot_xabar_manba" ON "bot_xabar" USING btree ("manba_turi","manba_id");