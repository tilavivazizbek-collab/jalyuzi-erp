CREATE TABLE "xato_jurnal" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"vaqt" timestamp with time zone DEFAULT now() NOT NULL,
	"digest" text,
	"yol" text,
	"xabar" text NOT NULL,
	"stek" text,
	"xodim_id" bigint
);
--> statement-breakpoint
CREATE INDEX "xato_jurnal_digest" ON "xato_jurnal" USING btree ("digest");--> statement-breakpoint
CREATE INDEX "xato_jurnal_vaqt" ON "xato_jurnal" USING btree ("vaqt");