-- 0067 · XARAJAT MANBA INDEKSI — unumdorlik auditi. 2026-10-14
--
-- ⚠️ NEGA: pozitsiya ish haqi `manba_turi + manba_id` bo'yicha qidiriladi
--    (tur bo'yicha foyda 11.5.2, filiallararo qarz 22.3, reja fakti 21.5).
--    Indeks yo'q edi — har pozitsiya uchun butun ISH_HAQI ro'yxati
--    ko'rilardi: katta bazada «Sotuv» hisoboti 13 soniya.
--
-- ⚠️ FAQAT QO'SHADI: ma'lumot o'zgarmaydi, qulf qisqa (jadval kichik).
CREATE INDEX IF NOT EXISTS "xarajat_manba" ON "xarajat" USING btree ("manba_turi","manba_id");
