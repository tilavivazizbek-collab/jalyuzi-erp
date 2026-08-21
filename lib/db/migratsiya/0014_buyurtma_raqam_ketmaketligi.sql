-- TZ 3.14 — buyurtma raqami.
--
-- ⚠️ Raqam SERVERDA beriladi, brauzerdan kelgan qiymatga ishonilmaydi.
--
-- Nega ketma-ketlik (sequence), MAX+1 emas: ikki sotuvchi bir vaqtda
-- sotganda MAX+1 bir xil raqam beradi va ikkinchisi `raqam UNIQUE` ga
-- urilib yiqiladi. Ketma-ketlik tranzaksiyadan tashqarida ishlaydi —
-- ikki jarayon hech qachon bir raqam olmaydi.
--
-- `bolak_kod_seq` bilan bir xil yondashuv (QISM 3 §3.1).

--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS buyurtma_raqam_seq START WITH 1;
