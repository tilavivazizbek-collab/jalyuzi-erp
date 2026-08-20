ALTER TABLE "inventarizatsiya_qator" DROP CONSTRAINT "inventarizatsiya_qator_inventarizatsiya_id_inventarizatsiya_id_fk";
--> statement-breakpoint
ALTER TABLE "inventarizatsiya_qator" ADD CONSTRAINT "inventarizatsiya_qator_hujjat_fk" FOREIGN KEY ("inventarizatsiya_id") REFERENCES "public"."inventarizatsiya"("id") ON DELETE no action ON UPDATE no action;