-- 0065 · REJALAR — TZ 21 (Q-22, Q-27). 2026-10-13
--
-- ⚠️ NEGA: tizim faqat FAKTni ko'rsatadi — «qancha bo'lishi kerak edi»
--    degan raqam yo'q. Reja shu raqamni beradi, hisobotlarga bajarilish
--    foizi qo'shiladi (21.1).
--
-- ⚠️ KIMGA (21.2): korxona va filial — tushum + foyda; sotuvchi — faqat
--    tushum. USTAGA REJA YO'Q (mahsulot o'lchami har xil, dona adolatsiz).
--
-- ⚠️ HOZIRCHA OYLIK. Choraklik/yillik — oylar yig'indisi (alohida yillik
--    reja keyin, kerak bo'lsa).
--
-- ⚠️ O'ZGARTIRISH (21.4): qator yangilanadi, eski qiymat va SABAB audit
--    jurnaliga tushadi (`lib/amal/reja.ts`). Oy boshlangach o'zgarsa —
--    `oy_ichida_ozgardi` belgisi: «oy oxirida rejani tushirib "bajardik"
--    deyish» hisobotda ko'rinib turadi.
--
-- ⚠️ FAQAT QO'SHADI — mavjud jadvallarga tegmaydi.

CREATE TABLE IF NOT EXISTS "reja" (
  "id" bigserial PRIMARY KEY,
  -- Oyning birinchi kuni
  "oy" date NOT NULL,
  "turi" text NOT NULL,
  "filial_id" bigint REFERENCES "filial"("id"),
  "xodim_id" bigint REFERENCES "xodim"("id"),
  -- So'mda. NULL yoki 0 — «reja yo'q» (EC-REJ-01, EC-REJ-06)
  "tushum" numeric(14, 2),
  "foyda" numeric(14, 2),
  "oy_ichida_ozgardi" boolean NOT NULL DEFAULT false,
  "yaratildi" timestamp with time zone NOT NULL DEFAULT now(),
  "yaratdi_id" bigint NOT NULL REFERENCES "xodim"("id"),
  "ozgartirildi" timestamp with time zone,
  "ozgartirdi_id" bigint REFERENCES "xodim"("id"),
  CONSTRAINT "reja_turi" CHECK ("turi" IN ('KORXONA', 'FILIAL', 'SOTUVCHI')),
  CONSTRAINT "reja_oy_boshi" CHECK (EXTRACT(DAY FROM "oy") = 1),
  CONSTRAINT "reja_musbat" CHECK (("tushum" IS NULL OR "tushum" >= 0) AND ("foyda" IS NULL OR "foyda" >= 0)),
  -- Korxona — filialsiz; filial — filial bilan; sotuvchi — filial VA xodim bilan
  -- (EC-REJ-03: boshqa filialga ko'chgan sotuvchining eski rejasi eski filialda)
  CONSTRAINT "reja_kimga" CHECK (
    ("turi" = 'KORXONA' AND "filial_id" IS NULL AND "xodim_id" IS NULL)
    OR ("turi" = 'FILIAL' AND "filial_id" IS NOT NULL AND "xodim_id" IS NULL)
    OR ("turi" = 'SOTUVCHI' AND "filial_id" IS NOT NULL AND "xodim_id" IS NOT NULL)
  ),
  -- 21.2 — sotuvchiga foyda rejasi qo'yilmaydi
  CONSTRAINT "reja_sotuvchi_foydasiz" CHECK ("turi" <> 'SOTUVCHI' OR "foyda" IS NULL)
);

-- Bir oyda bir kimga BITTA reja (NULL lar COALESCE bilan teng sanaladi)
CREATE UNIQUE INDEX IF NOT EXISTS "reja_bitta"
  ON "reja" ("oy", "turi", COALESCE("filial_id", 0), COALESCE("xodim_id", 0));
