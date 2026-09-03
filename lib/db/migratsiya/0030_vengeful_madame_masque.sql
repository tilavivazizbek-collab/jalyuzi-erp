CREATE TABLE "material_tur_narx" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"material_id" bigint NOT NULL,
	"mijoz_turi_id" bigint NOT NULL,
	"sotuv_narx" numeric(14, 2) NOT NULL,
	"valyuta" text DEFAULT 'SOM' NOT NULL,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "material_tur_narx_manfiy_emas" CHECK ("material_tur_narx"."sotuv_narx" >= 0),
	CONSTRAINT "material_tur_narx_valyuta" CHECK ("material_tur_narx"."valyuta" IN ('SOM','USD'))
);
--> statement-breakpoint
CREATE TABLE "mijoz_turi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"soliq_kerak" boolean DEFAULT false NOT NULL,
	"tartib" integer DEFAULT 0 NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint
);
--> statement-breakpoint
ALTER TABLE "mijoz" ADD COLUMN "mijoz_turi_id" bigint;--> statement-breakpoint
ALTER TABLE "material_tur_narx" ADD CONSTRAINT "material_tur_narx_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_tur_narx" ADD CONSTRAINT "material_tur_narx_mijoz_turi_id_mijoz_turi_id_fk" FOREIGN KEY ("mijoz_turi_id") REFERENCES "public"."mijoz_turi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "material_tur_narx_bitta" ON "material_tur_narx" USING btree ("material_id","mijoz_turi_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mijoz_turi_nom" ON "mijoz_turi" USING btree ("nom");--> statement-breakpoint
ALTER TABLE "mijoz" ADD CONSTRAINT "mijoz_mijoz_turi_id_mijoz_turi_id_fk" FOREIGN KEY ("mijoz_turi_id") REFERENCES "public"."mijoz_turi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- ⚠️ MA'LUMOT KO'CHIRISH — hech bir mijoz tursiz qolmaydi.
--
--    Ilgari tur `shaxs_turi` da ikkita qat'iy qiymat edi. Ular
--    spravochnikka aylanadi va mavjud mijozlar o'z turiga
--    biriktiriladi. Turi yo'q mijoz sotuvda narxsiz qolardi.
INSERT INTO mijoz_turi (nom, soliq_kerak, tartib, yaratdi_id)
VALUES ('Jismoniy', false, 1, 1), ('Yuridik', true, 2, 1)
ON CONFLICT (nom) DO NOTHING;
--> statement-breakpoint
UPDATE mijoz m
SET mijoz_turi_id = t.id
FROM mijoz_turi t
WHERE m.mijoz_turi_id IS NULL
  AND t.nom = CASE WHEN m.shaxs_turi = 'YURIDIK' THEN 'Yuridik' ELSE 'Jismoniy' END;
