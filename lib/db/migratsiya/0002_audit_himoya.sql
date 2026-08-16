-- QISM 1 §6.5, §10, §16 · TZ 2.4 + AUDIT U-08
--
-- Audit jurnali FAQAT QO'SHILADI. UPDATE va DELETE baza darajasida bloklanadi.
--
-- Nega: §16 «pul amallari — har biri audit jurnalida» degan kafolat jurnal
-- o'zgartirilishi mumkin bo'lsa hech narsani anglatmaydi. Dastur kodidagi
-- tekshiruv yetarli emas — bazaga to'g'ridan-to'g'ri ulangan odam uni chetlab
-- o'tadi.
--
-- Bu funksiya keyinchalik `kassa_yozuv`, `mijoz_harakat`, `xodim_harakat`,
-- `yetkazib_beruvchi_harakat`, `ombor_harakat` jadvallariga ham qo'yiladi
-- (§6.5). Tuzatish faqat storno yozuvi orqali.

--> statement-breakpoint
CREATE OR REPLACE FUNCTION faqat_qoshiladi() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    '% jadvalida % taqiqlanadi — bu jadval faqat qo''shiladi (QISM 1 §6.5). Tuzatish uchun storno yozuvi qo''shing.',
    TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_jurnal_ozgarmas
  BEFORE UPDATE OR DELETE ON "audit_jurnal"
  FOR EACH ROW EXECUTE FUNCTION faqat_qoshiladi();
