-- QISM 1 §6.5 · QISM 3 §0.3 — harakat jadvallarida UPDATE va DELETE TAQIQ
--
-- `ombor_harakat` — bo'lakning butun tarixi. Bir qatorni o'zgartirish
-- ombor hisobini jimgina buzadi va uni keyin topib bo'lmaydi.
-- Tuzatish faqat TESKARI YOZUV (storno) orqali.
--
-- Bu `audit_jurnal` dagi bilan bir xil himoya (P-06).

--> statement-breakpoint
CREATE OR REPLACE FUNCTION ombor_harakat_ozgarmas() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ombor_harakat o''zgartirilmaydi va o''chirilmaydi — tuzatish uchun storno yozuvi qo''shing (QISM 1 §6.5)';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER ombor_harakat_ozgarmas
  BEFORE UPDATE OR DELETE ON ombor_harakat
  FOR EACH ROW EXECUTE FUNCTION ombor_harakat_ozgarmas();

--> statement-breakpoint
-- QISM 3 §0.1 — `yaratdi_id` tashqi kalitlari
ALTER TABLE "kirim" ADD CONSTRAINT "kirim_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kirim" ADD CONSTRAINT "kirim_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kirim_qator" ADD CONSTRAINT "kirim_qator_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kirim_qator" ADD CONSTRAINT "kirim_qator_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "bolak" ADD CONSTRAINT "bolak_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "band" ADD CONSTRAINT "band_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "band" ADD CONSTRAINT "band_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "ombor_harakat" ADD CONSTRAINT "ombor_harakat_xodim_id_xodim_id_fk" FOREIGN KEY ("xodim_id") REFERENCES "xodim"("id");
