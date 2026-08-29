CREATE TABLE "mijoz_guruh" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"offset_turi" text,
	"offset_qiymat" numeric(14, 2),
	"izoh" text,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "mijoz_guruh_offset_turi" CHECK ("mijoz_guruh"."offset_turi" IS NULL OR "mijoz_guruh"."offset_turi" IN ('FOIZ','SOM')),
	CONSTRAINT "mijoz_guruh_offset_toliq" CHECK (("mijoz_guruh"."offset_turi" IS NULL AND "mijoz_guruh"."offset_qiymat" IS NULL)
          OR ("mijoz_guruh"."offset_turi" IS NOT NULL AND "mijoz_guruh"."offset_qiymat" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "mijoz" ADD COLUMN "mijoz_guruh_id" bigint;--> statement-breakpoint
CREATE UNIQUE INDEX "mijoz_guruh_nom" ON "mijoz_guruh" USING btree ("nom");--> statement-breakpoint
ALTER TABLE "mijoz" ADD CONSTRAINT "mijoz_mijoz_guruh_id_mijoz_guruh_id_fk" FOREIGN KEY ("mijoz_guruh_id") REFERENCES "public"."mijoz_guruh"("id") ON DELETE no action ON UPDATE no action;