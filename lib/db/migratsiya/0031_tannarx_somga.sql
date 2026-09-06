-- TZ 9.6 · 1.3-invariant — OMBOR TANNARXI DOIM SO'MDA
--
-- ⚠️ NIMA TUZATILMOQDA
--
-- Dollarga olingan material kirim qilinganda bo'lakning tannarxi
-- DOLLARDA saqlanardi (`bolak.tannarx_valyuta_snapshot = 'USD'`).
-- TZ 9.6 esa «tannarx kirim kunidagi kursda QOTADI» deydi — ya'ni u
-- kirim kuniyoq so'mga o'girilishi kerak edi.
--
-- Oqibati (2026-09-03 auditi):
--   · ombor qiymati hisobotida bunday bo'laklar UMUMAN ko'rinmasdi
--     (so'rovlarda `WHERE tannarx_valyuta_snapshot = 'SOM'` filtri bor)
--   · turlar bo'yicha foyda hisobotida esa 4 (dollar) va 50 000 (so'm)
--     bitta ustunda QO'SHILARDI — foyda haqiqatdan ancha yuqori chiqardi
--
-- Kod endi tannarxni kirim paytida so'mga o'giradi (`lib/amal/kirim.ts`).
-- Bu migratsiya ESKI yozuvlarni ham o'sha holatga keltiradi.
--
-- ⚠️ KURS QAYERDAN OLINADI
--
-- Bo'lakning O'Z kirimidan (`kirim.kurs_snapshot`) — u sotib olingan
-- kunda qotgan va o'zgarmaydi. Kesimdan chiqqan qoldiq bo'laklarda
-- kirim yo'q, shuning uchun ota-bo'laklar zanjiri bo'ylab yuqoriga
-- chiqib, ildizning kursi topiladi (`WITH RECURSIVE`).
--
-- ⚠️ NIMA TEGILMAYDI
--
-- Hujjatning o'zi: `kirim.valyuta`, `kirim_qator.narx_birlik`,
-- `kirim.transport_summa` va yetkazib beruvchiga qarz DOLLARDA
-- qoladi — sotuvchi 4 $/m deb kelishgan va qarz ham dollarda (9.2).
-- So'mga faqat OMBOR tomoni o'giriladi.
--
-- ⚠️ TARTIB MUHIM: bo'laklar ENG OXIRIDA o'giriladi, chunki qolgan
-- qadamlar `tannarx_valyuta_snapshot = 'USD'` belgisiga tayanadi.
--
-- ⚠️ IDEMPOTENT: faqat 'USD' qatorlar tegiladi va ular darhol 'SOM' ga
-- o'tadi. Ikkinchi yurishda hech narsa topilmaydi.
--
-- ⚠️ Har buyruq O'Z ichida to'liq — vaqtinchalik jadval ATAYLAB
-- ishlatilmadi: migratsiya bitta tranzaksiyada yurishiga tayanib
-- qolmaslik uchun.

--> statement-breakpoint

-- ── 1. Ombor jurnali ─────────────────────────────────────────────────────
--
-- ⚠️ `ombor_harakat` da UPDATE TAQIQ (QISM 1 §6.5) va u trigger bilan
--    himoyalangan. Bu yerda trigger VAQTINCHA o'chiriladi.
--
--    Nega storno yozuvi emas: storno HODISA yozuvi — u ombordan
--    nimadir chiqqanini yoki kirganini bildiradi. Bu yerda esa hech
--    qanday hodisa bo'lmagan: faqat O'LCHOV BIRLIGI xato edi (dollar
--    o'rniga so'm). Storno qo'shilsa jurnalda bo'lmagan harakat paydo
--    bo'lardi va miqdor ustunlari ham buzilardi (`ombor_harakat_olchov`
--    cheklovi bo'sh miqdorli qatorga ruxsat bermaydi).
--
--    Miqdorlar TEGILMAYDI — faqat pul ustuni o'giriladi.
ALTER TABLE ombor_harakat DISABLE TRIGGER ombor_harakat_ozgarmas;

--> statement-breakpoint
WITH RECURSIVE zanjir AS (
  SELECT b.id AS bolak_id, b.kirim_qator_id, b.ota_bolak_id
  FROM bolak b
  WHERE b.tannarx_valyuta_snapshot = 'USD'

  UNION ALL

  SELECT z.bolak_id, ota.kirim_qator_id, ota.ota_bolak_id
  FROM zanjir z
  JOIN bolak ota ON ota.id = z.ota_bolak_id
  WHERE z.kirim_qator_id IS NULL
),
kurslar AS (
  SELECT z.bolak_id, k.kurs_snapshot AS kurs
  FROM zanjir z
  JOIN kirim_qator kq ON kq.id = z.kirim_qator_id
  JOIN kirim k        ON k.id = kq.kirim_id
  WHERE z.kirim_qator_id IS NOT NULL
    AND k.kurs_snapshot IS NOT NULL
)
UPDATE ombor_harakat oh
SET tannarx_summa = ROUND(oh.tannarx_summa * ku.kurs, 2)
FROM kurslar ku
WHERE ku.bolak_id = oh.bolak_id;

--> statement-breakpoint
ALTER TABLE ombor_harakat ENABLE TRIGGER ombor_harakat_ozgarmas;

--> statement-breakpoint

-- ── 2. Pozitsiya tannarxi (3.15.4) ───────────────────────────────────────
--
-- ⚠️ Faqat BARCHA manba bo'lagi dollarda va BIR XIL kursda bo'lgan
--    pozitsiyalar. Aralash pozitsiya (bir mato dollardan, ikkinchisi
--    so'mdan) bo'lsa qaysi kurs bilan o'girishni bilib bo'lmaydi — u
--    tegilmaydi. Sinov ma'lumotlari tozalangandan keyin (2026-08-28)
--    bunday qator bo'lishi kutilmaydi.
WITH RECURSIVE zanjir AS (
  SELECT b.id AS bolak_id, b.kirim_qator_id, b.ota_bolak_id
  FROM bolak b
  WHERE b.tannarx_valyuta_snapshot = 'USD'

  UNION ALL

  SELECT z.bolak_id, ota.kirim_qator_id, ota.ota_bolak_id
  FROM zanjir z
  JOIN bolak ota ON ota.id = z.ota_bolak_id
  WHERE z.kirim_qator_id IS NULL
),
kurslar AS (
  SELECT z.bolak_id, k.kurs_snapshot AS kurs
  FROM zanjir z
  JOIN kirim_qator kq ON kq.id = z.kirim_qator_id
  JOIN kirim k        ON k.id = kq.kirim_id
  WHERE z.kirim_qator_id IS NOT NULL
    AND k.kurs_snapshot IS NOT NULL
),
yagona AS (
  SELECT b.buyurtma_pozitsiya_id AS pozitsiya_id, MIN(ku.kurs) AS kurs
  FROM bolak b
  JOIN kurslar ku ON ku.bolak_id = b.id
  WHERE b.buyurtma_pozitsiya_id IS NOT NULL
  GROUP BY b.buyurtma_pozitsiya_id
  HAVING MIN(ku.kurs) = MAX(ku.kurs)
     AND COUNT(*) = (
       SELECT COUNT(*) FROM bolak b2
       WHERE b2.buyurtma_pozitsiya_id = b.buyurtma_pozitsiya_id
     )
)
UPDATE buyurtma_pozitsiya p
SET tannarx_snapshot = ROUND(p.tannarx_snapshot * y.kurs, 2)
FROM yagona y
WHERE y.pozitsiya_id = p.id
  AND p.tannarx_snapshot IS NOT NULL;

--> statement-breakpoint

-- ── 3. Bo'laklarning o'zi — ENG OXIRIDA ──────────────────────────────────
WITH RECURSIVE zanjir AS (
  SELECT b.id AS bolak_id, b.kirim_qator_id, b.ota_bolak_id
  FROM bolak b
  WHERE b.tannarx_valyuta_snapshot = 'USD'

  UNION ALL

  SELECT z.bolak_id, ota.kirim_qator_id, ota.ota_bolak_id
  FROM zanjir z
  JOIN bolak ota ON ota.id = z.ota_bolak_id
  WHERE z.kirim_qator_id IS NULL
),
kurslar AS (
  SELECT z.bolak_id, k.kurs_snapshot AS kurs
  FROM zanjir z
  JOIN kirim_qator kq ON kq.id = z.kirim_qator_id
  JOIN kirim k        ON k.id = kq.kirim_id
  WHERE z.kirim_qator_id IS NOT NULL
    AND k.kurs_snapshot IS NOT NULL
)
UPDATE bolak b
SET tannarx_birlik_snapshot = ROUND(b.tannarx_birlik_snapshot * ku.kurs, 4),
    tannarx_valyuta_snapshot = 'SOM'
FROM kurslar ku
WHERE ku.bolak_id = b.id
  AND b.tannarx_valyuta_snapshot = 'USD';

--> statement-breakpoint

-- ── 4. Kursi topilmaganlar ───────────────────────────────────────────────
--
-- Dollarli kirimda kurs MAJBURIY (`kirim_usd_kurs` cheklovi), shuning
-- uchun bu holat bo'lmasligi kerak. Agar baribir qolsa — jimgina
-- o'tkazib yuborilmaydi, migratsiya TO'XTAYDI va odam qaraydi.
DO $$
DECLARE qolgan integer;
BEGIN
  SELECT COUNT(*) INTO qolgan
  FROM bolak WHERE tannarx_valyuta_snapshot = 'USD';

  IF qolgan > 0 THEN
    RAISE EXCEPTION
      'Kursi topilmagan % ta dollarli bo''lak qoldi — qo''lda tekshiring (TZ 9.6)',
      qolgan;
  END IF;
END $$;
