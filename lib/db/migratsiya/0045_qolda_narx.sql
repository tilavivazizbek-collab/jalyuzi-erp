-- 0045 · NARX QO'LDA QO'YILGANMI — egasi topshirig'i 2026-09-21
--
-- ⚠️ MUAMMO
--
--    Ombor sarflashi serverda QAYTA HISOBLANADI (§9.4): sotuvchining
--    brauzerida ochiq turgan eski sahifa eski formulani ushlab
--    qolmasin deb. Narxga esa tegilmasdi — izohda sabab ham
--    yozilgan: «uni sotuvchi qo'lda qo'yadi, u mijoz bilan
--    kelishilgan».
--
--    Bu 2026-09-20 gacha TO'G'RI edi: o'shanda narx materiallardan
--    yig'ilardi. Endi narx EGASINING JADVALIDAN keladi va qo'lda
--    o'zgartirish ALOHIDA amal. Ya'ni:
--
--      · sotuvchi tegmagan bo'lsa  → jadvaldagi narx bo'lishi shart
--      · tekkan bo'lsa             → bu KO'RINISHI shart
--
--    Hozir ikkalasi ham farqlanmaydi. Egasi narxni o'zgartirsa,
--    ochiq turgan sahifa ESKI narxni jimgina yozadi.
--
-- ⚠️ BLOKLAMAYDI. TZ 3.8 · 3.11 — narx mijoz bilan kelishiladi va
--    sotuvchi uni o'zgartira oladi. Bu ustun taqiq emas, IZ:
--    keyin «qaysi buyurtma jadvaldagidan boshqa narxda ketdi»
--    degan savolga javob beradi.

ALTER TABLE "buyurtma_pozitsiya"
  ADD COLUMN IF NOT EXISTS "qolda_narx" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "buyurtma_pozitsiya"."qolda_narx" IS
  'Narx jadvaldagidan FARQ QILADI — sotuvchi qo''lda qo''ygan yoki '
  'sahifa eskirgan. Server saqlashda o''zi hisoblab belgilaydi.';

-- Hisobot va ro'yxat shu ustun bo'yicha filtrlaydi
CREATE INDEX IF NOT EXISTS "buyurtma_pozitsiya_qolda_narx"
  ON "buyurtma_pozitsiya" ("qolda_narx")
  WHERE "qolda_narx" = true;
