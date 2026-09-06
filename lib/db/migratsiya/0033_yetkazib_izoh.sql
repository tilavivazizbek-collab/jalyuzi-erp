-- TZ 9.7 — YETKAZIB BERUVCHI IZOHLARI
--
-- ⚠️ NEGA KERAK
--
-- 9.7 dagi «Izohlar» tabi «erkin matn, XODIM VA SANA bilan» deydi.
-- Bazada esa `yetkazib_beruvchi.eslatma` — bitta matn ustuni: yangi
-- izoh eskisini o'chirib yozadi va kim yozgani qolmaydi.
--
-- ⚠️ `eslatma` ustuni O'CHIRILMAYDI (2.1-invariant): unda yozilgan
-- gaplar joyida qoladi va kartochkada ko'rinib turadi. Yangi jadval
-- uning o'rniga emas, YONIGA qo'shiladi.
--
-- ⚠️ Izoh o'chirilmaydi — `faol = false` qilinadi (§3): kim nima
-- deganini keyin inkor qilib bo'lmasin.

--> statement-breakpoint
CREATE TABLE "yetkazib_beruvchi_izoh" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"yetkazib_beruvchi_id" bigint NOT NULL,
	"matn" text NOT NULL,
	"faol" boolean DEFAULT true NOT NULL,
	"ochirildi" timestamp with time zone,
	"yaratildi" timestamp with time zone DEFAULT now() NOT NULL,
	"yaratdi_id" bigint NOT NULL,
	"ozgartirildi" timestamp with time zone,
	"ozgartirdi_id" bigint,
	CONSTRAINT "yetkazib_izoh_matn" CHECK (length(btrim("yetkazib_beruvchi_izoh"."matn")) > 0)
);

--> statement-breakpoint
ALTER TABLE "yetkazib_beruvchi_izoh"
  ADD CONSTRAINT "yetkazib_beruvchi_izoh_yetkazib_beruvchi_id_yetkazib_beruvchi_id_fk"
  FOREIGN KEY ("yetkazib_beruvchi_id")
  REFERENCES "public"."yetkazib_beruvchi"("id")
  ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX "yetkazib_izoh_kim"
  ON "yetkazib_beruvchi_izoh" USING btree ("yetkazib_beruvchi_id", "yaratildi");
