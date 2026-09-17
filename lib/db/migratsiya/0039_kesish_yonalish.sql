-- AUDIT 1-TOPILMA — KESISH YO'NALISHI (2026-09-17)
--
-- ⚠️ NIMA ETISHMAYDI
--
-- `MAYDON × K` ko'paytiruvchisi kesim to'rtburchagida doim ENIGA
-- tushar edi: 180×220 ×2 → 3.6 × 2.2 keng rulon izlanar, real
-- rulonlar (2.0–3.0 m) sig'masdi. Mato esa rulondan bo'y bo'ylab
-- tortiladi — ikki qavat / rapportli naqsh bo'y bo'ylab kesiladi
-- (1.8 × 4.4).
--
-- Yechim — mahsulot_slot ga ikkita ustun:
--
--   koeffitsient  «nechta marta» (default 1 — oddiy sarf)
--   kesish_turi   ENIGA | BO'YIGA (default ENIGA — avvalgi xulq)
--
-- Defaultlar eski xatti-harakatni SAQLAYDI — yangi tur yaratish
-- shart emas, mavjud turlar avvalgidek kesiladi.

ALTER TABLE "mahsulot_slot" ADD COLUMN "koeffitsient" numeric(8, 2) NOT NULL DEFAULT '1';
ALTER TABLE "mahsulot_slot" ADD COLUMN "kesish_turi" text NOT NULL DEFAULT 'ENIGA';