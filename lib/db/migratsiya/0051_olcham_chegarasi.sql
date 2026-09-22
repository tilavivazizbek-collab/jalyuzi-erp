-- 0051 · MAHSULOT TURINING O'LCHAM CHEGARASI — egasi qarori 2026-09-22
--
-- ⚠️ MUAMMO NIMA EDI
--
--    Sotuv ekranida o'lcham uchun hech qanday chegara yo'q edi:
--    yagona tekshiruv «noldan katta va 1000 metrdan kichik».
--
--    Ya'ni sotuvchi 4 metrli rulon parda yozsa, tizim uni qabul
--    qilardi: savat to'lardi, narx hisoblanardi, mijozdan oldindan
--    to'lov olinardi, buyurtma ishlab chiqarishga tushardi.
--
--    Muammo USTANING oldida chiqardi: rulon vali 4 metrda o'z
--    og'irligidan egiladi va bunday mahsulotni qilib bo'lmaydi.
--    O'shanda mato kesilgan (qaytmaydi), karniz kesilgan
--    (qaytmaydi), usta bir kun ishlagan (haqi to'lanadi), mijozga
--    pul qaytariladi. Hammasini sotuv paytida bir soniyada
--    to'xtatish mumkin edi.
--
-- ⚠️ EGASI QARORI: chegaradan chiqqan buyurtma BUTUNLAY
--    TO'XTATILADI. Narxdan farqi shu: narx mijoz bilan kelishiladi
--    (TZ 3.8 · 3.11), jismoniy chegara esa kelishilmaydi.
--
-- ⚠️ TO'RTALASI HAM IXTIYORIY — `NULL` degani «chegara yo'q».
--
--    Egasi raqamlarni ustasidan so'rab, turlarni bittalab
--    to'ldiradi. To'ldirilmagan turda tizim avvalgidek
--    ishlayveradi. Majburiy qilinsa mavjud turlar SHU ZAHOTI
--    sotilmay qolardi.
--
-- ⚠️ MAVJUD BUYURTMALARGA TEGMAYDI. Chegara faqat YANGI pozitsiya
--    qo'shilganda tekshiriladi. Eski buyurtmalar o'z o'lchamida
--    qoladi va ishlab chiqarishda davom etadi — aks holda chegara
--    kiritilgan kuni yarim ish to'xtab qolardi.
--
-- ⚠️ Qoidaning O'ZI bu yerda emas: `lib/domain/olcham-chegarasi.ts`.
--    Sotuv ekrani, server tekshiruvi va bot — uchalasi ham o'sha
--    bitta funksiyani chaqiradi.

ALTER TABLE "mahsulot_tur"
  ADD COLUMN IF NOT EXISTS "min_eni_m"  numeric(6,2),
  ADD COLUMN IF NOT EXISTS "maks_eni_m"  numeric(6,2),
  ADD COLUMN IF NOT EXISTS "min_boyi_m" numeric(6,2),
  ADD COLUMN IF NOT EXISTS "maks_boyi_m" numeric(6,2);

-- Manfiy yoki nol chegara ma'nosiz: «eng katta eni 0» degan tur
-- hech qachon sotilmasdi va sababi ko'rinmasdi.
ALTER TABLE "mahsulot_tur" DROP CONSTRAINT IF EXISTS "mahsulot_tur_olcham_musbat";
ALTER TABLE "mahsulot_tur" ADD CONSTRAINT "mahsulot_tur_olcham_musbat"
  CHECK (
    ("min_eni_m"  IS NULL OR "min_eni_m"  > 0) AND
    ("maks_eni_m"  IS NULL OR "maks_eni_m"  > 0) AND
    ("min_boyi_m" IS NULL OR "min_boyi_m" > 0) AND
    ("maks_boyi_m" IS NULL OR "maks_boyi_m" > 0)
  );

-- ⚠️ «Eng kichik 2.50, eng katta 2.00» bo'lsa HECH BIR o'lcham
--    o'tmaydi va tur butunlay sotilmay qoladi. Ekranda ham
--    aytiladi (`chegaralarMantiqiymi`), lekin bazada ham to'siq
--    turadi: bot va kelajakdagi import yo'llari ekranni chetlab
--    o'tishi mumkin.
ALTER TABLE "mahsulot_tur" DROP CONSTRAINT IF EXISTS "mahsulot_tur_olcham_tartibi";
ALTER TABLE "mahsulot_tur" ADD CONSTRAINT "mahsulot_tur_olcham_tartibi"
  CHECK (
    ("min_eni_m"  IS NULL OR "maks_eni_m"  IS NULL OR "min_eni_m"  <= "maks_eni_m") AND
    ("min_boyi_m" IS NULL OR "maks_boyi_m" IS NULL OR "min_boyi_m" <= "maks_boyi_m")
  );

COMMENT ON COLUMN "mahsulot_tur"."maks_eni_m" IS
  'Mexanizm ko''taradigan eng katta eni, metrda. NULL — chegara yo''q. '
  'Chegaraning O''ZI o''tadi: 2.80 degani 2.80 m li parda qilinadi.';
