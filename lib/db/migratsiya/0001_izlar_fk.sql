-- QISM 3 §0.1 — «yaratdi_id BIGINT NOT NULL REFERENCES xodim(id)»
--
-- Bu tashqi kalitlar Drizzle sxemasida emas, qo'lda yoziladi. Sabab: halqa.
--
--   filial.yaratdi_id  → xodim.id
--   xodim.filial_id    → filial.id     ← halqa
--   xodim.yaratdi_id   → xodim.id      ← o'ziga o'zi (birinchi xodim)
--
-- Birinchi filial va birinchi xodim bir-birisiz mavjud bo'la olmaydi.
-- Yechim — DEFERRABLE INITIALLY DEFERRED: tekshiruv har qatordan keyin emas,
-- TRANZAKSIYA OXIRIDA bajariladi. Urug' ikkovini bitta tranzaksiyada yozadi.
--
-- ON DELETE CASCADE YO'Q (QISM 1 §6.3) — pul va ombor tarixi yo'qolmasligi kerak.

--> statement-breakpoint
ALTER TABLE "filial"
  ADD CONSTRAINT "filial_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "filial"
  ADD CONSTRAINT "filial_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "xodim"
  ADD CONSTRAINT "xodim_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "xodim"
  ADD CONSTRAINT "xodim_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "xodim"
  ALTER CONSTRAINT "xodim_filial_id_filial_id_fk" DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "rol"
  ADD CONSTRAINT "rol_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "rol"
  ADD CONSTRAINT "rol_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "xodim_rol"
  ADD CONSTRAINT "xodim_rol_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "xodim_rol"
  ADD CONSTRAINT "xodim_rol_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id")
  DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "rol_ruxsat"
  ADD CONSTRAINT "rol_ruxsat_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "rol_ruxsat"
  ADD CONSTRAINT "rol_ruxsat_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "sessiya"
  ADD CONSTRAINT "sessiya_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "sessiya"
  ADD CONSTRAINT "sessiya_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "sozlama"
  ADD CONSTRAINT "sozlama_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "sozlama"
  ADD CONSTRAINT "sozlama_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kurs_tarix"
  ADD CONSTRAINT "kurs_tarix_yaratdi_id_xodim_id_fk"
  FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kurs_tarix"
  ADD CONSTRAINT "kurs_tarix_ozgartirdi_id_xodim_id_fk"
  FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
