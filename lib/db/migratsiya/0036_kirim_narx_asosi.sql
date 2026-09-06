-- TZ 7.9 · 9.11 · 2.3-invariant — KIRIM QATORIDA NARX ASOSI
--
-- ⚠️ NEGA KERAK
--
-- Kirim qatorining narxi uch xil asosda kiritilishi mumkin:
--   BIRLIK — narx bir rulon (yoki quti, shtanga) uchun
--   METR   — narx bir UZUNLIK METRI uchun
--   KV_M   — narx bir KVADRAT METR uchun
--
-- Sotuvchi buni HAR QATORDA alohida tanlaydi (kirim formasi). Lekin
-- tanlangan qiymat HECH QAYERDA SAQLANMASDI: `kirimYarat` uni faqat
-- hisob paytida ishlatib, keyin unutardi.
--
-- ⚠️ NIMA BUZILARDI
--
-- 2026-09-05 da TZ 9.11 (kirim hujjatini tahrirlash) yozilganda
-- ma'lum bo'ldi: tannarxni QAYTA hisoblash uchun o'sha asos kerak,
-- lekin uni tiklashning iloji yo'q. `kirim_tahrir` uni materialning
-- HOZIRGI sozlamasidan o'qishga majbur edi — u esa:
--   1) qatorda tanlangandan boshqa bo'lishi mumkin (default farq
--      qiladi: material `METR`, qator esa `BIRLIK`);
--   2) keyin o'zgartirilgan bo'lishi mumkin.
--
-- Sinovda aynan shu chiqdi: tannarx 120 000 o'rniga 1 020 000 —
-- ya'ni sakkiz baravar. Jimgina, hech qanday xatosiz.
--
-- Endi asos QATORDA, kirim kunida qotib qoladi (2.3-invariant).

--> statement-breakpoint
ALTER TABLE "kirim_qator" ADD COLUMN "narx_asosi" text DEFAULT 'BIRLIK' NOT NULL;

--> statement-breakpoint
ALTER TABLE "kirim_qator" ADD CONSTRAINT "kirim_qator_narx_asosi"
  CHECK ("kirim_qator"."narx_asosi" IN ('BIRLIK','METR','KV_M'));

--> statement-breakpoint
-- ⚠️ ESKI QATORLAR — TIKLANGAN QIYMAT, aniq emas.
--
-- Formada qator materialning o'z sozlamasi bilan ochiladi, shuning
-- uchun eng ehtimolli qiymat — o'sha. Bu faqat KELAJAKDAGI tahrirga
-- ta'sir qiladi: bo'laklarning hozirgi tannarxi allaqachon
-- `bolak.tannarx_birlik_snapshot` da qotgan va o'zgarmaydi.
UPDATE "kirim_qator" kq
   SET "narx_asosi" = m."kirim_narx_asosi"
  FROM "material" m
 WHERE m."id" = kq."material_id"
   AND m."kirim_narx_asosi" IN ('BIRLIK','METR','KV_M');
