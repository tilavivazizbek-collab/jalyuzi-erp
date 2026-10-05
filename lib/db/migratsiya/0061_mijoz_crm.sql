-- 0061 · MIJOZ — QARZ NAZORATI VA SOTUVCHI ISHI
--        Egasi auditi 2026-10-06 («hammasini qo'shib to'g'rila»)
--
-- ⚠️ FAQAT QO'SHADI — hech narsa tashlanmaydi, eski kod ishlayveradi.
--    Shuning uchun deploydan OLDIN ham, KEYIN ham qo'llash xavfsiz.
--
-- ⚠️ NIMA QO'SHILADI:
--      mijoz.tolov_muddati_kun   — qarz necha kunda to'lanishi kerak
--      mijoz.masul_xodim_id      — mijoz qaysi sotuvchiga biriktirilgan
--      mijoz.manba               — qayerdan keldi (Instagram, tavsiya…)
--      mijoz_kontakt             — firmadagi odamlar: rahbar, buxgalter
--      mijoz_muloqot             — qo'ng'iroq, uchrashuv, va'da tarixi
--
-- ⚠️ Hammasi IXTIYORIY. Bo'sh muddat = muddat nazorati yo'q
--    (CLAUDE.md §14a — katak quriladi, raqam egasidan so'ralmaydi).

ALTER TABLE "mijoz" ADD COLUMN IF NOT EXISTS "tolov_muddati_kun" integer;
ALTER TABLE "mijoz" ADD COLUMN IF NOT EXISTS "masul_xodim_id" bigint
  REFERENCES "xodim"("id");
ALTER TABLE "mijoz" ADD COLUMN IF NOT EXISTS "manba" text;

/*
 * ⚠️ Muddat 0 dan katta va bir yildan oshmaydi. 0 kun «darhol» degani
 *    — buni bo'sh muddat emas, qarzga sotmaslik hal qiladi.
 */
ALTER TABLE "mijoz" ADD CONSTRAINT "mijoz_tolov_muddati"
  CHECK ("tolov_muddati_kun" IS NULL
         OR ("tolov_muddati_kun" > 0 AND "tolov_muddati_kun" <= 365));

CREATE INDEX IF NOT EXISTS "mijoz_masul" ON "mijoz" ("masul_xodim_id")
  WHERE "masul_xodim_id" IS NOT NULL;

-- ─── Kontakt shaxslar ─────────────────────────────────────────────────────
/*
 * ⚠️ B2B mijozda bitta telefon yetmaydi: buyurtmani usta beradi,
 *    hisob-kitobni buxgalter qiladi, kelishuvni rahbar. Asosiy telefon
 *    `mijoz.telefon` da qoladi — bot mijozni SHU raqam bilan taniydi.
 */
CREATE TABLE IF NOT EXISTS "mijoz_kontakt" (
  "id" bigserial PRIMARY KEY,
  "mijoz_id" bigint NOT NULL REFERENCES "mijoz"("id"),
  "ism" text NOT NULL,
  "lavozim" text,
  "telefon" text,
  "izoh" text,
  "faol" boolean NOT NULL DEFAULT true,
  "ochirildi" timestamp with time zone,
  "yaratildi" timestamp with time zone NOT NULL DEFAULT now(),
  "yaratdi_id" bigint NOT NULL REFERENCES "xodim"("id"),
  "ozgartirildi" timestamp with time zone,
  "ozgartirdi_id" bigint REFERENCES "xodim"("id")
);
CREATE INDEX IF NOT EXISTS "mijoz_kontakt_mijoz" ON "mijoz_kontakt" ("mijoz_id", "faol");

-- ─── Muloqot tarixi va va'dalar ───────────────────────────────────────────
/*
 * ⚠️ VA'DA — qarz undirishning asosiy quroli. «Juma kuni 2 mln
 *    to'layman» degan gap yozilmasa, juma kuni hech kim eslamaydi.
 *    Sana kelganda kartochka va qarzdorlik hisobotida ko'rinadi.
 *
 * ⚠️ PUL JADVALI EMAS — va'da summasi qarzga tegmaydi. Qarzni faqat
 *    `mijoz_harakat` o'zgartiradi (2.2-invariant). Shuning uchun bu
 *    yerda `bajarildi` ni UPDATE qilish mumkin — harakat jadvali qoidasi
 *    (§3 «UPDATE yo'q») pul harakatiga tegishli.
 */
CREATE TABLE IF NOT EXISTS "mijoz_muloqot" (
  "id" bigserial PRIMARY KEY,
  "mijoz_id" bigint NOT NULL REFERENCES "mijoz"("id"),
  "sana" timestamp with time zone NOT NULL DEFAULT now(),
  "turi" text NOT NULL,
  "matn" text NOT NULL,
  "vada_sana" date,
  "vada_summa" numeric(14, 2),
  "vada_valyuta" text,
  "bajarildi" boolean NOT NULL DEFAULT false,
  "bajarildi_sana" timestamp with time zone,
  "xodim_id" bigint NOT NULL REFERENCES "xodim"("id"),
  CONSTRAINT "mijoz_muloqot_turi"
    CHECK ("turi" IN ('QONGIROQ', 'UCHRASHUV', 'XABAR', 'IZOH', 'VADA')),
  -- Va'daning sanasi bo'lishi shart — sanasiz va'da eslatilmaydi
  CONSTRAINT "mijoz_muloqot_vada_sanasi"
    CHECK ("turi" <> 'VADA' OR "vada_sana" IS NOT NULL),
  CONSTRAINT "mijoz_muloqot_vada_summa"
    CHECK ("vada_summa" IS NULL OR "vada_summa" > 0),
  CONSTRAINT "mijoz_muloqot_vada_valyuta"
    CHECK ("vada_valyuta" IS NULL OR "vada_valyuta" IN ('SOM', 'USD')),
  CONSTRAINT "mijoz_muloqot_vada_toliq"
    CHECK (("vada_summa" IS NULL) = ("vada_valyuta" IS NULL))
);
CREATE INDEX IF NOT EXISTS "mijoz_muloqot_mijoz" ON "mijoz_muloqot" ("mijoz_id", "sana");
CREATE INDEX IF NOT EXISTS "mijoz_muloqot_ochiq_vada" ON "mijoz_muloqot" ("vada_sana")
  WHERE "turi" = 'VADA' AND NOT "bajarildi";
