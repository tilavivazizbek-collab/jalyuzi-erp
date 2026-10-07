-- 0063 · XARID BUYURTMASI (yetkazib beruvchiga zakaz)
--        Ombor auditi 2026-10-07, 7-band
--
-- ⚠️ NEGA: hozir kirim mol KELGANDA birinchi marta yoziladi. Kim
--    nimani, qancha, qachonga buyurtma qilgani — omborchining
--    daftarida yoki Telegramda. Oqibat: «mato yo'lda» degan narsa
--    tizimda yo'q, kam kelgani (10 rulon so'rab 7 tasi keldi) hech
--    kim sezmaydi, bir matoni ikki kishi ikki marta buyurtma qiladi.
--
-- ⚠️ PUL YOZILMAYDI. Buyurtma — niyat, hujjat emas: qarz, tannarx,
--    qoldiq faqat KIRIM bilan o'zgaradi (7.9, 9.2). Bu yerdagi narx —
--    kelishilgan narx, kirimga faqat oldindan to'ldirib beriladi.
--
-- ⚠️ KELGAN MIQDOR SAQLANMAYDI — har safar FAOL kirimlardan
--    hisoblanadi. Kirim storno bo'lsa, buyurtma o'zi «kelmagan»ga
--    qaytadi; ikki joyda yozilgan son bir-biridan ajrab qolmaydi.
--
-- ⚠️ FAQAT QO'SHADI. `kirim.xarid_buyurtma_id` ixtiyoriy — buyurtmasiz
--    kirim avvalgidek ishlaydi. Deploydan oldin ham, keyin ham xavfsiz.

CREATE SEQUENCE IF NOT EXISTS "xarid_buyurtma_raqam_seq";

CREATE TABLE IF NOT EXISTS "xarid_buyurtma" (
  "id" bigserial PRIMARY KEY,
  "raqam" text NOT NULL UNIQUE,
  "filial_id" bigint NOT NULL REFERENCES "filial"("id"),
  "yetkazib_beruvchi_id" bigint NOT NULL REFERENCES "yetkazib_beruvchi"("id"),
  "sana" date NOT NULL,
  "kutilgan_sana" date,
  "valyuta" text NOT NULL DEFAULT 'SOM',
  "izoh" text,
  "holat" text NOT NULL DEFAULT 'OCHIQ',
  "yopish_sabab" text,
  "yopildi" timestamp with time zone,
  "yopdi_id" bigint REFERENCES "xodim"("id"),
  "yaratildi" timestamp with time zone NOT NULL DEFAULT now(),
  "yaratdi_id" bigint NOT NULL REFERENCES "xodim"("id"),
  "ozgartirildi" timestamp with time zone,
  "ozgartirdi_id" bigint REFERENCES "xodim"("id"),
  CONSTRAINT "xarid_buyurtma_holat" CHECK ("holat" IN ('OCHIQ', 'YOPILDI', 'BEKOR')),
  CONSTRAINT "xarid_buyurtma_valyuta" CHECK ("valyuta" IN ('SOM', 'USD')),
  -- Yopilgan yoki bekor qilingan buyurtmaning sababi va kim qilgani AYTILADI
  CONSTRAINT "xarid_buyurtma_yopish" CHECK (
    "holat" = 'OCHIQ'
    OR ("yopish_sabab" IS NOT NULL AND "yopildi" IS NOT NULL AND "yopdi_id" IS NOT NULL)
  ),
  CONSTRAINT "xarid_buyurtma_kutilgan" CHECK ("kutilgan_sana" IS NULL OR "kutilgan_sana" >= "sana")
);

CREATE INDEX IF NOT EXISTS "xarid_buyurtma_filial_holat" ON "xarid_buyurtma" ("filial_id", "holat");
CREATE INDEX IF NOT EXISTS "xarid_buyurtma_yetkazib" ON "xarid_buyurtma" ("yetkazib_beruvchi_id");

CREATE TABLE IF NOT EXISTS "xarid_buyurtma_qator" (
  "id" bigserial PRIMARY KEY,
  "xarid_buyurtma_id" bigint NOT NULL REFERENCES "xarid_buyurtma"("id"),
  "material_id" bigint NOT NULL REFERENCES "material"("id"),
  -- Kirim birligida (rulon, shtanga, quti) — kirim qatori bilan bir xil
  "miqdor" numeric(12, 2) NOT NULL,
  -- Kelishilgan narx, buyurtma valyutasida. Bo'sh — narx kelganda aniqlanadi
  "narx_birlik" numeric(14, 2),
  -- Narx nimaga: rulonga (BIRLIK), metrga (METR) yoki kv.m ga — kirim qatori bilan bir xil (7.9)
  "narx_asosi" text NOT NULL DEFAULT 'BIRLIK',
  "izoh" text,
  "yaratildi" timestamp with time zone NOT NULL DEFAULT now(),
  "yaratdi_id" bigint NOT NULL REFERENCES "xodim"("id"),
  "ozgartirildi" timestamp with time zone,
  "ozgartirdi_id" bigint REFERENCES "xodim"("id"),
  CONSTRAINT "xarid_buyurtma_qator_miqdor" CHECK ("miqdor" > 0),
  CONSTRAINT "xarid_buyurtma_qator_narx" CHECK ("narx_birlik" IS NULL OR "narx_birlik" >= 0),
  CONSTRAINT "xarid_buyurtma_qator_asos" CHECK ("narx_asosi" IN ('BIRLIK', 'METR', 'KV_M'))
);

/*
 * ⚠️ Bir buyurtmada bir material — BITTA qator. Kelgan miqdor material
 *    bo'yicha hisoblanadi; ikki qator bo'lsa qaysi biriga tushganini
 *    aytib bo'lmasdi.
 */
CREATE UNIQUE INDEX IF NOT EXISTS "xarid_buyurtma_qator_bitta"
  ON "xarid_buyurtma_qator" ("xarid_buyurtma_id", "material_id");

ALTER TABLE "kirim" ADD COLUMN IF NOT EXISTS "xarid_buyurtma_id" bigint REFERENCES "xarid_buyurtma"("id");
CREATE INDEX IF NOT EXISTS "kirim_xarid_buyurtma" ON "kirim" ("xarid_buyurtma_id")
  WHERE "xarid_buyurtma_id" IS NOT NULL;
