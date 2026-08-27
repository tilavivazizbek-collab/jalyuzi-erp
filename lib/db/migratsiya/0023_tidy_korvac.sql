ALTER TABLE "material" ADD COLUMN "kutilayotgan_kelish_narx" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "material" ADD COLUMN "kutilayotgan_kelish_valyuta" text DEFAULT 'SOM' NOT NULL;--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_kelish_valyuta" CHECK ("material"."kutilayotgan_kelish_valyuta" IN ('SOM','USD'));--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_kelish_narx_manfiy_emas" CHECK ("material"."kutilayotgan_kelish_narx" IS NULL OR "material"."kutilayotgan_kelish_narx" >= 0);