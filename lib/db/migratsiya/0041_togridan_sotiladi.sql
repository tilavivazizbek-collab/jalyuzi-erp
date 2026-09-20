-- TAYYOR MAHSULOT BELGISI — egasi qarori 2026-09-20
--
-- ⚠️ NIMA O'ZGARDI
--
-- Mijoz narxi endi `mahsulot_narx` jadvalidan keladi (0040), ya'ni
-- `material.sotuv_narx` jalyuzi narxiga umuman ta'sir qilmaydi.
-- Egasi: «mahsulot qo'shish sahifasidan sotuv narxini olib
-- tashlaymiz, faqat kelish narxini yozamiz».
--
-- ⚠️ LEKIN USTUN O'CHIRILMAYDI. `sotuv_narx` yana bir joyda
--    ishlatiladi: TAYYOR MAHSULOTNI to'g'ridan-to'g'ri sotish
--    (`app/(panel)/buyurtma/yangi/malumot.ts` — `COALESCE(fn.sotuv_narx,
--    m.sotuv_narx)`). O'lchamsiz, slotsiz savdo: pult, tayyor parda.
--
--    Uni o'chirsak bunday savdo narxsiz qolardi va sotuvchi summani
--    qo'lda yozishiga to'g'ri kelardi.
--
-- Yechim — belgi. Omborchi oddiy mato kiritganda sotuv narxi
-- SO'RALMAYDI; «to'g'ridan-to'g'ri sotiladi» belgilansagina katak
-- ochiladi. Mijoz turi va filial narxlari ham shu belgiga bog'landi.
--
-- Default `false` — mavjud materiallarda katak yopiladi, lekin
-- ularning `sotuv_narx` qiymati JOYIDA QOLADI (2.1-invariant):
-- belgi qo'yilsa qiymat qaytib ko'rinadi.

ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "togridan_sotiladi"
  boolean NOT NULL DEFAULT false;
