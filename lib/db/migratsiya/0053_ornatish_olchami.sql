-- 0053 · O'RNATISH TURI VA OYNA O'LCHAMI — egasi holati 2026-09-23
--
-- ⚠️ NEGA KERAK
--
--    Zamerchi OYNANI o'lchaydi. Tizim esa TAYYOR JALYUZI o'lchamini
--    kutadi. Bu ikkisi hech qachon teng emas:
--
--      oyna USTIGA  → eni + 10 sm, bo'yi + 15 sm
--      oyna ICHIGA  → eni −  1 sm, bo'yi −  1 sm
--      dikkey, pol  → bo'yi − 1.5 sm
--
--    Shu paytgacha bu farqni SOTUVCHI boshida hisoblardi. Jalyuzi
--    biznesida peredelkaning birinchi sababi aynan shu: ikki
--    santimetr xato = mato ham, mexanizm ham kesilgan, usta bir kun
--    ishlagan, mijoz esa kutmoqda.
--
--    Va bu xato HECH QAYERDA ushlanmaydi: 0051 o'lcham chegarasi
--    ham o'tkazib yuboradi, chunki ikki santimetr chegarani buzmaydi.
--
-- ⚠️ `eni_m` / `boyi_m` MA'NOSI O'ZGARMAYDI — ular DOIM tayyor
--    jalyuzi o'lchami. Narx ham, formula ham, kesim ham, band
--    qilish ham o'sha-o'sha ishlayveradi. Oyna o'lchami QO'SHIMCHA
--    yozuv: u hech qayerda hisobga kirmaydi, faqat saqlanadi va
--    ko'rsatiladi.
--
--    Shuning uchun bu migratsiya mavjud buyurtmalarga tegmaydi va
--    o'rnatish turi belgilanmagan tur avvalgidek ishlayveradi:
--    sotuvchi tayyor o'lchamni o'zi yozaveradi.
--
-- ⚠️ USTA OXIRGI SO'ZNI AYTADI (egasining o'z gapi):
--    «usta yana o'zgartirmoqchi bo'lsa xohishicha o'zgartiraveradi
--     inputni, agar o'zgartirmasa eski holatida saqlanadi».
--    Shuning uchun `olcham_qolda` bayrog'i bor: hisoblangan o'lcham
--    ustidan yozilgan bo'lsa, keyingi hisob uni QAYTA BOSMAYDI.

-- ─── O'rnatish turi ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mahsulot_ornatish" (
  "id"               bigserial PRIMARY KEY,
  "mahsulot_tur_id"  bigint NOT NULL REFERENCES "mahsulot_tur"("id"),
  "nom"              text NOT NULL,
  -- ⚠️ MANFIY BO'LADI: proyomga o'rnatishda o'lcham KAMAYADI.
  --    Shuning uchun CHECK yo'q — faqat tayyor o'lcham noldan
  --    katta chiqishi dasturda tekshiriladi.
  "eni_qoshimcha_m"  numeric(6, 2) NOT NULL DEFAULT 0,
  "boyi_qoshimcha_m" numeric(6, 2) NOT NULL DEFAULT 0,
  -- Sotuv ekrani shu bilan ochiladi
  "standartmi"       boolean NOT NULL DEFAULT false,
  "tartib"           integer NOT NULL DEFAULT 0,
  -- ⚠️ O'CHIRILMAYDI, FAOLSIZLANTIRILADI: eski buyurtmalar unga
  --    havola qiladi (0052 dagi variant bilan bir xil naqsh)
  "faol"             boolean NOT NULL DEFAULT true,
  "yaratilgan"       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "mahsulot_ornatish_tur_idx"
  ON "mahsulot_ornatish" ("mahsulot_tur_id")
  WHERE "faol";

-- ⚠️ BITTA STANDART: ikkitasi bo'lsa sotuv ekrani qaysi biri bilan
--    ochilishini aytib bo'lmasdi va u SO'ROVNING TARTIBIGA qarab
--    o'zgarardi — ya'ni kunda bir xil, ertaga boshqa.
CREATE UNIQUE INDEX IF NOT EXISTS "mahsulot_ornatish_standart_uniq"
  ON "mahsulot_ornatish" ("mahsulot_tur_id")
  WHERE "standartmi" AND "faol";

COMMENT ON TABLE "mahsulot_ornatish" IS
  'Oyna o''lchamidan tayyor jalyuzi o''lchamiga o''tish qoidasi (0053).';
COMMENT ON COLUMN "mahsulot_ornatish"."eni_qoshimcha_m" IS
  'Tayyor eni = oyna eni + shu son. Proyomga o''rnatishda MANFIY.';

-- ─── Pozitsiyada oyna o'lchami ──────────────────────────────────

ALTER TABLE "buyurtma_pozitsiya"
  ADD COLUMN IF NOT EXISTS "oyna_eni_m"        numeric(6, 2),
  ADD COLUMN IF NOT EXISTS "oyna_boyi_m"       numeric(6, 2),
  ADD COLUMN IF NOT EXISTS "ornatish_id"       bigint REFERENCES "mahsulot_ornatish"("id"),
  -- ⚠️ SNAPSHOT (2.3-invariant): o'rnatish turi ertaga
  --    o'zgartirilsa yoki faolsizlantirilsa ham, BU buyurtma
  --    qaysi qoida bilan hisoblangani o'zgarmasin.
  ADD COLUMN IF NOT EXISTS "ornatish_nom"      text,
  ADD COLUMN IF NOT EXISTS "ornatish_eni_m"    numeric(6, 2),
  ADD COLUMN IF NOT EXISTS "ornatish_boyi_m"   numeric(6, 2),
  -- ⚠️ Usta tayyor o'lchamni QO'LDA yozgan bo'lsa true. O'shanda
  --    oyna o'lchami o'zgarsa ham tayyor o'lcham qayta hisoblanmaydi.
  ADD COLUMN IF NOT EXISTS "olcham_qolda"      boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "buyurtma_pozitsiya"."oyna_eni_m" IS
  'Zamerchi o''lchagan OYNA eni. Hisobga kirmaydi — eni_m tayyor jalyuzi o''lchami (0053).';
COMMENT ON COLUMN "buyurtma_pozitsiya"."olcham_qolda" IS
  'Tayyor o''lcham qo''lda yozilgan — qayta hisoblanmaydi (0053).';
