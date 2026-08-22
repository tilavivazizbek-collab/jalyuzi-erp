-- TZ 20.7 · 22.9 — 6-bosqich himoyasi va ketma-ketligi.
--
-- 1. `kochirish_raqam_seq` — hujjat raqami SERVERDA beriladi.
--    `buyurtma_raqam_seq` (0014) bilan bir xil sabab: ikki omborchi bir
--    vaqtda jo'natsa `MAX+1` bir xil raqam berardi.
--
-- 2. `filial_harakat` da `UPDATE` va `DELETE` TAQIQ (22.9.1).
--    Bu jadval uchinchi qarz turining tayanchi: balans hech qayerda
--    saqlanmaydi, `SUM()` dan chiqadi (2.2-invariant). Bir qatorni
--    o'zgartirish balansni jimgina buzadi. Tuzatish faqat yangi yozuv:
--
--      xato summa   → QOLDA_TUZATISH (22.3.3)
--      qaytarish    → QAYTARISH (22.3.4)
--
-- 3. `kochirish` — QISM 3 §0.1 dagi `yaratdi_id` tashqi kalitlari.

--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS kochirish_raqam_seq START WITH 1;

--> statement-breakpoint
CREATE TRIGGER filial_harakat_ozgarmas
  BEFORE UPDATE OR DELETE ON filial_harakat
  FOR EACH ROW EXECUTE FUNCTION balans_ozgarmas();

--> statement-breakpoint
ALTER TABLE "kochirish" ADD CONSTRAINT "kochirish_yaratdi_id_xodim_id_fk" FOREIGN KEY ("yaratdi_id") REFERENCES "xodim"("id");
--> statement-breakpoint
ALTER TABLE "kochirish" ADD CONSTRAINT "kochirish_ozgartirdi_id_xodim_id_fk" FOREIGN KEY ("ozgartirdi_id") REFERENCES "xodim"("id");
