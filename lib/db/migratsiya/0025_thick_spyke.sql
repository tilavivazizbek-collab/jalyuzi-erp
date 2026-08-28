ALTER TABLE "buyurtma_pozitsiya" ALTER COLUMN "mahsulot_tur_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD COLUMN "qoshimcha_material_id" bigint;--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "buyurtma_pozitsiya_qoshimcha_material_id_material_id_fk" FOREIGN KEY ("qoshimcha_material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_turi_yoki_material" CHECK (("buyurtma_pozitsiya"."mahsulot_tur_id" IS NOT NULL AND "buyurtma_pozitsiya"."qoshimcha_material_id" IS NULL)
           OR ("buyurtma_pozitsiya"."mahsulot_tur_id" IS NULL AND "buyurtma_pozitsiya"."qoshimcha_material_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "pozitsiya_qoshimcha_olchamsiz" CHECK ("buyurtma_pozitsiya"."qoshimcha_material_id" IS NULL
           OR ("buyurtma_pozitsiya"."eni_sm" = 0 AND "buyurtma_pozitsiya"."boyi_sm" = 0));