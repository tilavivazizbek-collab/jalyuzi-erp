-- TZ 12.3 — qo'lda kiritilgan kassa yozuvi uchun manba raqami.
--
-- «Qo'lda kiritilgan yozuvda manba "qo'lda" bo'ladi va u hech qaysi
--  modulga ta'sir qilmaydi.»
--
-- Lekin `(manba_turi, manba_id, qator)` uchligi baribir NOYOB bo'lishi
-- shart (P-26). Qo'lda kiritilgan yozuvning tabiiy manbasi yo'q,
-- shuning uchun ketma-ketlik beriladi.
--
-- Nega MAX+1 emas: ikki sotuvchi bir vaqtda xarajat kiritsa MAX+1 bir
-- xil raqam berardi va ikkinchisi indeksga urilib yiqilardi.
-- `bolak_kod_seq` va `buyurtma_raqam_seq` bilan bir xil yondashuv.

--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS qolda_manba_seq START WITH 1;
