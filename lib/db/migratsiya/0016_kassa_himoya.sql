-- QISM 1 §6.5 · QISM 3 §0.3 — balans jadvallarida UPDATE va DELETE TAQIQ
--
-- Bu to'rt jadval 2.2-invariantning tayanchi: balans HECH QAYERDA
-- saqlanmaydi, u shu jadvallarning `SUM()` idan chiqadi.
--
-- Bitta qatorni o'zgartirish balansni JIMGINA buzadi va uni keyin topib
-- bo'lmaydi. Tuzatish faqat YANGI YOZUV bilan:
--
--   kassa_yozuv    → storno yozuvi (12.15)
--   xodim_harakat  → QOLDA_TUZATISH yoki HAQ_BEKOR (10.14)
--   mijoz_harakat  → QAYTARISH yoki TOLOV
--
-- `ombor_harakat` va `audit_jurnal` dagi bilan bir xil himoya (P-06).

--> statement-breakpoint
CREATE OR REPLACE FUNCTION balans_ozgarmas() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% o''zgartirilmaydi va o''chirilmaydi — tuzatish uchun yangi yozuv qo''shing (QISM 1 §6.5)', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint
CREATE TRIGGER kassa_yozuv_ozgarmas
  BEFORE UPDATE OR DELETE ON kassa_yozuv
  FOR EACH ROW EXECUTE FUNCTION balans_ozgarmas();

--> statement-breakpoint
CREATE TRIGGER xodim_harakat_ozgarmas
  BEFORE UPDATE OR DELETE ON xodim_harakat
  FOR EACH ROW EXECUTE FUNCTION balans_ozgarmas();

--> statement-breakpoint
CREATE TRIGGER mijoz_harakat_ozgarmas
  BEFORE UPDATE OR DELETE ON mijoz_harakat
  FOR EACH ROW EXECUTE FUNCTION balans_ozgarmas();

--> statement-breakpoint
CREATE TRIGGER yetkazib_harakat_ozgarmas
  BEFORE UPDATE OR DELETE ON yetkazib_beruvchi_harakat
  FOR EACH ROW EXECUTE FUNCTION balans_ozgarmas();

--> statement-breakpoint
-- QISM 3 §0.1 — `yaratdi_id` / `xodim_id` tashqi kalitlari
ALTER TABLE "kassa" ADD CONSTRAINT "kassa_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kassa_yozuv" ADD CONSTRAINT "kassa_yozuv_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "xodim_harakat" ADD CONSTRAINT "xodim_harakat_yozdi_fk" FOREIGN KEY ("xodim_yozdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mijoz_harakat" ADD CONSTRAINT "mijoz_harakat_mijoz_fk" FOREIGN KEY ("mijoz_id") REFERENCES "mijoz"("id");
--> statement-breakpoint
ALTER TABLE "mijoz_harakat" ADD CONSTRAINT "mijoz_harakat_xodim_fk" FOREIGN KEY ("xodim_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "yetkazib_beruvchi_harakat" ADD CONSTRAINT "yetkazib_harakat_kim_fk" FOREIGN KEY ("yetkazib_beruvchi_id") REFERENCES "yetkazib_beruvchi"("id");
--> statement-breakpoint
ALTER TABLE "yetkazib_beruvchi_harakat" ADD CONSTRAINT "yetkazib_harakat_xodim_fk" FOREIGN KEY ("xodim_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "xarajat" ADD CONSTRAINT "xarajat_xodim_fk" FOREIGN KEY ("xodim_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "stavka" ADD CONSTRAINT "stavka_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "topshiriq" ADD CONSTRAINT "topshiriq_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kassa_kun" ADD CONSTRAINT "kassa_kun_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
