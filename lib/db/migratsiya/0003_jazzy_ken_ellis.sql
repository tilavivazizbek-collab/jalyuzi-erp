ALTER TABLE "rol" ADD COLUMN "kod" text;--> statement-breakpoint
ALTER TABLE "rol" ADD CONSTRAINT "rol_kod_unique" UNIQUE("kod");--> statement-breakpoint
ALTER TABLE "rol" ADD CONSTRAINT "rol_tizimli_kod" CHECK (("rol"."tizimli" = false AND "rol"."kod" IS NULL) OR ("rol"."tizimli" = true AND "rol"."kod" IS NOT NULL));