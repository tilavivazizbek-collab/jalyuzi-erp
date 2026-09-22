-- 0046 · SOTUVCHINING CHEGIRMA CHEGARASI — egasi topshirig'i 2026-09-21
--
-- ⚠️ MUAMMO
--
--    `CHEGIRMA_LIMITIDAN_OSHDI` audit hodisasi `lib/audit/amallar.ts`
--    da 2026-08 dan beri ta'riflangan va «sotuvchi intizomi»
--    hisobotida SANALADI. Lekin:
--
--      · hodisa hech qayerda YOZILMAGAN
--      · chegirma chegarasi tushunchasining O'ZI yo'q edi
--
--    Ya'ni hisobot har doim «limitdan oshdi: 0» deb turardi va
--    egasi undan «hech kim ortiqcha chegirma bermayapti» degan
--    XATO xulosa chiqarardi.
--
-- ⚠️ BLOKLAMAYDI. Qarz limiti ham bloklamaydi (TZ 6.4: «sotuvchi
--    mustaqil qaror qabul qiladi, tizim BLOKLAMAYDI») — chegirma
--    ham shu qoidaga bo'ysunadi. Bu chegara taqiq emas, O'LCHOV:
--    egasi kim qancha chegirma berayotganini KO'RADI.
--
-- ⚠️ `NULL` — chegara yo'q. Bu standart holat: egasi kerakli
--    sotuvchiga o'zi qo'yadi. Nol qo'yilsa «umuman chegirma
--    berolmaydi» degani bo'ladi va bu boshqa ma'no.

ALTER TABLE "xodim"
  ADD COLUMN IF NOT EXISTS "chegirma_limit_foiz" numeric(5,2);

COMMENT ON COLUMN "xodim"."chegirma_limit_foiz" IS
  'Sotuvchi bera oladigan eng ko''p chegirma, foizda. NULL — chegara '
  'yo''q. Bloklamaydi: oshsa audit jurnaliga yoziladi (TZ 6.4 ruhida).';

ALTER TABLE "xodim" DROP CONSTRAINT IF EXISTS "xodim_chegirma_limit";
ALTER TABLE "xodim" ADD CONSTRAINT "xodim_chegirma_limit"
  CHECK ("chegirma_limit_foiz" IS NULL
         OR ("chegirma_limit_foiz" >= 0 AND "chegirma_limit_foiz" <= 100));
