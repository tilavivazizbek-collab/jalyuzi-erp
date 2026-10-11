-- 0064 · KASSA FARQI XARAJAT MODDASI
--        Egasi qarori 2026-10-11: kun yopishdagi kamomad korxona xarajatiga
--
-- ⚠️ NEGA: kassir sanagan pul hisoblangandan farq qilsa, farq faqat
--    `kassa_kun` ga yozilardi — kassa qoldig'i esa hisoblanganicha qolib,
--    yo'q pul «bor» bo'lib ko'rinardi. Endi kun yopilganda farq kassa
--    yozuvi + shu moddadagi xarajat bo'lib tushadi (ortiqcha — manfiy).
--
-- ⚠️ FAQAT QO'SHADI: cheklovga yangi qiymat. Eski yozuvlarga tegmaydi.

ALTER TABLE "xarajat" DROP CONSTRAINT IF EXISTS "xarajat_modda";
ALTER TABLE "xarajat" ADD CONSTRAINT "xarajat_modda" CHECK ("modda" IN (
  'ISH_HAQI', 'TRANSPORT_BOJXONA', 'OMBOR_BRAKI', 'ISHLAB_CHIQARISH_BRAKI', 'CHIQINDI',
  'KURS_FARQI', 'YETKAZIB_BERUVCHI_DEFEKTI', 'UMIDSIZ_QARZ', 'BANK_KOMISSIYASI', 'OPERATSION',
  'INVENTARIZATSIYA_FARQI', 'YAXLITLASH', 'XODIM_BALANSI_HISOBDAN', 'FILIALLARARO_TRANSPORT',
  'BOSHQA', 'KASSA_FARQI'
));
