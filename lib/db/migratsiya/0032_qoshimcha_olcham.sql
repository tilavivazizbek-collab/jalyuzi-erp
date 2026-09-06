-- TZ 3.10 · QISM 3 §4.2 — QO'SHIMCHA BUYUM QATORI YOZILISHI UCHUN
--
-- ⚠️ NIMA TUZATILMOQDA
--
-- `buyurtma_pozitsiya` da ikkita cheklov BIR-BIRINI INKOR QILARDI:
--
--   buyurtma_pozitsiya_olcham      eni_sm > 0 AND boyi_sm > 0     (0013)
--   pozitsiya_qoshimcha_olchamsiz  eni_sm = 0 AND boyi_sm = 0     (0025)
--
-- Ikkinchisi faqat qo'shimcha buyumga tegadi, birinchisi esa HAMMAGA.
-- Natijada qo'shimcha buyum qatori bazaga UMUMAN tusha olmasdi: qaysi
-- qiymat qo'yilmasin, bittasi baribir buziladi.
--
-- Shu sabab mijoz «uydagi mexanizm buzilgan, bittasini alohida olay»
-- desa, uni saytdan sotib bo'lmasdi — `lib/amal/buyurtma.ts` da bu
-- imkoniyat to'liq yozilgan bo'lsa ham (2026-09-03 auditi).
--
-- ⚠️ YECHIM: o'lcham talabi TAYYOR MAHSULOTGA cheklanadi. Qo'shimcha
-- buyum tayyorlanmaydi va kesilmaydi — unda o'lcham ma'nosiz (3.10),
-- nol qo'yiladi va buni `pozitsiya_qoshimcha_olchamsiz` tekshiradi.
--
-- ⚠️ Mavjud qatorlarga xavf yo'q: hozirgi hamma qator tayyor mahsulot
-- (`qoshimcha_material_id IS NULL`) va ular uchun shart O'ZGARMAYDI.

--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" DROP CONSTRAINT "buyurtma_pozitsiya_olcham";

--> statement-breakpoint
ALTER TABLE "buyurtma_pozitsiya" ADD CONSTRAINT "buyurtma_pozitsiya_olcham"
  CHECK ("buyurtma_pozitsiya"."qoshimcha_material_id" IS NOT NULL
         OR ("buyurtma_pozitsiya"."eni_sm" > 0 AND "buyurtma_pozitsiya"."boyi_sm" > 0));
