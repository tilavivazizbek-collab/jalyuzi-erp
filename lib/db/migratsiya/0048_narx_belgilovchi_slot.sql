-- 0048 · NARXNI QAYSI SLOT BELGILAYDI — egasi qarori 2026-09-22
--
-- ⚠️ EGASI: «men slotda belgilayman».
--
-- ⚠️ MUAMMO NIMA EDI
--
--    Mijoz narxi mato DARAJASIDAN keladi (2026-09-20). Lekin
--    QAYSI matodan? Kod uch joyda bir xil TAXMIN qilardi:
--
--        1) birinchi KV_M (mato) sloti, darajasi bor bo'lsa
--        2) topilmasa — darajasi bor birinchi material
--
--    Bu ikki holatda buziladi:
--
--      KUN-TUN (zebra)   ikkita mato sloti bor. «Birinchisi»
--                        degani SLOT TARTIBI degani. Admin
--                        slotlarni joyini almashtirsa yoki
--                        ikkinchi matoga boshqa daraja qo'yilsa,
--                        narx SABABSIZ o'zgaradi va ekranda
--                        hech qanday iz qolmaydi.
--
--      KARNIZGA DARAJA   2026-09-22 dan karnizga ham daraja
--                        qo'yiladi («ko'p olganga arzonroq»).
--                        Mato sloti bo'lmagan yoki matosiga
--                        daraja qo'yilmagan turda narx KARNIZ
--                        darajasidan izlanadi — butunlay boshqa
--                        jadval.
--
-- ⚠️ ESKI MA'LUMOT O'ZGARMAYDI
--
--    Ustun `false` bilan tug'iladi. Belgi qo'yilmagan turda kod
--    avvalgidek ishlaydi (birinchi darajali mato). Ya'ni bu
--    migratsiya birorta mavjud buyurtmaning yoki narxning
--    qiymatini o'zgartirmaydi — faqat YANGI imkoniyat ochadi.
--
-- ⚠️ QOIDANING O'ZI BU YERDA EMAS
--
--    `lib/domain/narx-qoidasi.ts` → `darajaliSlotniTop()`.
--    Shu migratsiya bilan birga sotuv ekrani, server tekshiruvi
--    va bot — uchalasi ham o'sha bitta funksiyaga o'tkazildi.
--    Ilgari qoida uch joyda alohida yozilgan edi (CLAUDE.md §3
--    «bir mantiq — bir joyda» buzilgan holat).

ALTER TABLE "mahsulot_slot"
  ADD COLUMN IF NOT EXISTS "narx_belgilaydi" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "mahsulot_slot"."narx_belgilaydi" IS
  'Mijoz narxi SHU slotga tanlangan materialning darajasidan hisoblanadi. '
  'Bir turda faqat bitta slotda true bo''lishi mumkin. false bo''lsa — '
  'eski xulq: birinchi darajali mato, topilmasa birinchi darajali material.';

-- ⚠️ QISMAN unique: belgilanmagan slotlar cheklanmaydi, belgilangani
--    esa har turda BITTA bo'ladi. Aks holda «qaysi biri» degan savol
--    qaytib kelardi va biz aynan shundan qutulyapmiz.
CREATE UNIQUE INDEX IF NOT EXISTS "mahsulot_slot_narx_bitta"
  ON "mahsulot_slot" ("mahsulot_tur_id")
  WHERE "narx_belgilaydi";
