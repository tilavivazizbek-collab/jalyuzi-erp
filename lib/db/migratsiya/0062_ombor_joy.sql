-- 0062 · OMBORDA SAQLASH JOYI (stellaj / qator / polka)
--        Ombor auditi 2026-10-07, 6-band
--
-- ⚠️ NEGA: tizim «falon bo'lakni kes» deydi, omborchi esa rulonni
--    izlab vaqt yo'qotadi. Joy yozilsa — usta va omborchi uni darhol
--    topadi; QR yorliq skanerlanganda ham joyi ko'rinadi.
--
-- ⚠️ FAQAT QO'SHADI. `bolak.joy_id` ixtiyoriy — joyi yozilmagan bo'lak
--    avvalgidek ishlaydi. Deploydan oldin ham, keyin ham xavfsiz.
--
-- ⚠️ JOY — RO'YXATDAN, erkin matn EMAS. «A-1», «a1», «A 1» bir joy
--    bo'lib qolmasin. Har filialda o'z ro'yxati (Q-25 — o'z ombori).

CREATE TABLE IF NOT EXISTS "ombor_joy" (
  "id" bigserial PRIMARY KEY,
  "filial_id" bigint NOT NULL REFERENCES "filial"("id"),
  "nom" text NOT NULL,
  "izoh" text,
  "tartib" integer NOT NULL DEFAULT 0,
  "faol" boolean NOT NULL DEFAULT true,
  "ochirildi" timestamp with time zone,
  "yaratildi" timestamp with time zone NOT NULL DEFAULT now(),
  "yaratdi_id" bigint NOT NULL REFERENCES "xodim"("id"),
  "ozgartirildi" timestamp with time zone,
  "ozgartirdi_id" bigint REFERENCES "xodim"("id"),
  CONSTRAINT "ombor_joy_nom_bosh" CHECK (length(trim("nom")) > 0)
);

/*
 * ⚠️ Bir filialda bir xil nomli ikki FAOL joy bo'lmaydi — kichik-katta
 *    harf va chetdagi bo'sh joy farq qilmaydi. Nofaol joy nomi qayta
 *    ishlatilishi mumkin (qisman indeks).
 */
CREATE UNIQUE INDEX IF NOT EXISTS "ombor_joy_nom_bitta"
  ON "ombor_joy" ("filial_id", lower(trim("nom"))) WHERE "faol";

ALTER TABLE "bolak" ADD COLUMN IF NOT EXISTS "joy_id" bigint REFERENCES "ombor_joy"("id");
CREATE INDEX IF NOT EXISTS "bolak_joy" ON "bolak" ("joy_id") WHERE "joy_id" IS NOT NULL;
