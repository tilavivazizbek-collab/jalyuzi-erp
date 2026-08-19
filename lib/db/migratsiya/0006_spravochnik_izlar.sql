-- QISM 3 §0.1 — `yaratdi_id BIGINT NOT NULL REFERENCES xodim(id)`
--
-- 0001 dagi bilan bir xil sabab: Drizzle sxemasida bu tashqi kalitlar
-- yo'q, chunki `izlar` yordamchisi jadvalga bog'lanmagan. Spravochnik
-- jadvallarida halqa yo'q, shuning uchun DEFERRABLE ham shart emas.
--
-- ON DELETE CASCADE YO'Q (QISM 1 §6.3).

--> statement-breakpoint
ALTER TABLE "almashtirish_guruh" ADD CONSTRAINT "almashtirish_guruh_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "almashtirish_guruh" ADD CONSTRAINT "almashtirish_guruh_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "material_filial_narx" ADD CONSTRAINT "material_filial_narx_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "material_filial_narx" ADD CONSTRAINT "material_filial_narx_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_tur" ADD CONSTRAINT "mahsulot_tur_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_tur" ADD CONSTRAINT "mahsulot_tur_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_slot" ADD CONSTRAINT "mahsulot_slot_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_slot" ADD CONSTRAINT "mahsulot_slot_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_parametr" ADD CONSTRAINT "mahsulot_parametr_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_parametr" ADD CONSTRAINT "mahsulot_parametr_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_aksessuar" ADD CONSTRAINT "mahsulot_aksessuar_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mahsulot_aksessuar" ADD CONSTRAINT "mahsulot_aksessuar_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mijoz" ADD CONSTRAINT "mijoz_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "mijoz" ADD CONSTRAINT "mijoz_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "yetkazib_beruvchi" ADD CONSTRAINT "yetkazib_beruvchi_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "yetkazib_beruvchi" ADD CONSTRAINT "yetkazib_beruvchi_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
