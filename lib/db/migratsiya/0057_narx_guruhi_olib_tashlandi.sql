-- 0057 · NARX GURUHI (DARAJA) BUTUNLAY OLIB TASHLANDI
--         egasi qarori 2026-09-24
--
-- ⚠️ EGASINING QARORI, MENING TAVSIYAM EMAS
--
--    Men qoldirishni tavsiya qilgan edim va raqam bilan ko'rsatdim:
--
--      daraja bilan      → 3 qator to'ldiriladi
--      darajasiz, turga  → 4 qator, lekin qimmat mato bilan arzon
--                          mato BIR XIL narxda sotiladi
--      har matoga narx   → 32 qator, har yangi mato yana 4 ta
--
--    Egasi buni ko'rib turib «butunlay o'chirasan» dedi. Bu uning
--    biznes qarori: bir turdagi hamma mato endi bir xil narxda
--    sotiladi va matoning qimmat-arzonligi mijoz narxiga TA'SIR
--    QILMAYDI.
--
-- ⚠️ NIMA KETADI
--
--      narx_guruh                      — jadvalning o'zi
--      material.narx_guruh_id          — matoning darajasi
--      mahsulot_narx.narx_guruh_id     — narx qoidasining o'qi
--      mahsulot_slot.narx_belgilaydi   — «qaysi slot darajani beradi»
--
--    Oxirgisi 0048 da aynan daraja uchun qo'shilgan edi va darajasiz
--    hech qanday ma'no bermaydi. Qoldirilsa ekranda ishlamaydigan
--    belgi bo'lib turardi — bu o'chirib yuborishdan ham yomonroq.
--
-- ⚠️ 0055 «DARAJAGA UMUMIY NARX» ham shu bilan ketadi. `hamma_turga`
--    ustuni QOLADI, lekin ma'nosi o'zgaradi: endi u «hamma tur uchun
--    standart narx» degani va darajaga aloqasi yo'q.
--
-- ⚠️ MA'LUMOT YO'QOLADI — ochiq aytiladi. Bitta (tur, mijoz turi,
--    filial) uchligiga bir nechta daraja qatori bo'lsa, ular endi
--    BITTA qatorga tushadi. Shuning uchun pastda ortiqchalari
--    NOFAOL qilinadi (o'chirilmaydi — 2.1-invariant), eng kichik
--    `id` li qator qoladi.
--
--    Egasining bazasida bunday to'qnashuv YO'Q (tekshirildi:
--    2 ta faol qoida, 0 ta to'qnashuv). Sinov bazasida 2 ta bor.

-- ─── 1. To'qnashadigan qatorlarni nofaol qilamiz ─────────────────

/*
 * ⚠️ `ctid` EMAS, `id` bo'yicha: `ctid` jismoniy joylashuv va u
 *    VACUUM dan keyin o'zgaradi — qaysi qator qolgani tasodifga
 *    bog'liq bo'lardi. `id` esa barqaror: eng birinchi kiritilgani
 *    qoladi.
 */
UPDATE "mahsulot_narx_bosqich" SET "faol" = false, "ozgartirildi" = now()
 WHERE "faol" = true
   AND "mahsulot_narx_id" IN (
     SELECT mn."id" FROM "mahsulot_narx" mn
      WHERE mn."faol" = true
        AND mn."id" > (
          SELECT MIN(m2."id") FROM "mahsulot_narx" m2
           WHERE m2."faol" = true
             AND coalesce(m2."mahsulot_tur_id", 0) = coalesce(mn."mahsulot_tur_id", 0)
             AND m2."hamma_turga" = mn."hamma_turga"
             AND coalesce(m2."mijoz_turi_id", 0) = coalesce(mn."mijoz_turi_id", 0)
             AND coalesce(m2."filial_id", 0) = coalesce(mn."filial_id", 0)));

UPDATE "mahsulot_narx" mn SET "faol" = false, "ochirildi" = now(), "ozgartirildi" = now()
 WHERE mn."faol" = true
   AND mn."id" > (
     SELECT MIN(m2."id") FROM "mahsulot_narx" m2
      WHERE m2."faol" = true
        AND coalesce(m2."mahsulot_tur_id", 0) = coalesce(mn."mahsulot_tur_id", 0)
        AND m2."hamma_turga" = mn."hamma_turga"
        AND coalesce(m2."mijoz_turi_id", 0) = coalesce(mn."mijoz_turi_id", 0)
        AND coalesce(m2."filial_id", 0) = coalesce(mn."filial_id", 0));

-- ─── 2. Ustun IXTIYORIY qilinadi ────────────────────────

-- ⚠️ USTUN SHU MIGRATSIYADA O'CHIRILMAYDI — ataylab.
--
--    Jonli saytda hali ESKI kod ishlab turibdi va u `narx_guruh_id`
--    ni o'qiydi. Ustun darhol tashlansa sayt o'sha zahoti yiqilardi.
--
--    Shuning uchun ikki qadam:
--
--      0057 (bu)  — ustun IXTIYORIY bo'ladi. Eski kod ham, yangi
--                   kod ham ishlayveradi: eskisi yozadi, yangisi
--                   yozmaydi va baza norozi bo'lmaydi.
--      0058       — yangi kod deploy bo'lgach ustun TASHLANADI.
--
--    Bu «kengaytir, keyin qis» (expand/contract) tartibi. Usiz
--    deploy bilan migratsiya orasida sayt bir necha daqiqa
--    ishlamasdi.

ALTER TABLE "mahsulot_narx" ALTER COLUMN "narx_guruh_id" DROP NOT NULL;
