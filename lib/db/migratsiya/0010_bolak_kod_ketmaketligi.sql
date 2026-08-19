-- QISM 3 §3.1 — «Kod generatsiyasi MARKAZLASHGAN: R- rulon, O- ostatka,
-- D- dona, keyin ketma-ket raqam (filialdan qat'i nazar).»
--
-- Nega ketma-ketlik (sequence), MAX+1 emas:
--
-- MAX+1 bir vaqtda ikki kirim qilinganda bir xil raqam beradi va ikkinchisi
-- yiqiladi. Ketma-ketlik tranzaksiyadan tashqarida ishlaydi — ikki jarayon
-- hech qachon bir raqam olmaydi.
--
-- Bitta umumiy ketma-ketlik: `R-118` va `O-118` bo'lishi mumkin emas,
-- shuning uchun kod butun tizimda noyob bo'lib qoladi.

--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS bolak_kod_seq START WITH 100;
