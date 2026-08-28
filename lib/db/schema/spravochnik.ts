/**
 * lib/db/schema/spravochnik.ts — QISM 3 §2 · TZ 4, 5, 6, 9, 20.3, 20.9
 *
 * Spravochniklar. Q-26 bo'yicha bularning KO'PI UMUMIY — filialga
 * bog'lanmagan: material nomlari, mahsulot turlari, formulalar, mijozlar,
 * mijoz qarzi, yetkazib beruvchilar.
 *
 * «Ko'k mato» hamma joyda bir xil narsa; mijoz istalgan filialga borishi
 * mumkin va qarzi bitta bo'lishi shart — aks holda bir filialda qarzdor,
 * boshqasida toza bo'lib qoladi (20.3).
 *
 * Filialga bog'lanadigan yagona narsa — NARX ISTISNOSI (`material_filial_narx`,
 * Q-28).
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Rasm — `bytea`.
 *
 * ⚠️ Bir marta e'lon qilinadi va ikki jadvalda ishlatiladi (§2.2).
 */
const baytlar = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});
import { id, izlar, ochirilmaydi } from './ustunlar';
import { filial } from './asos';

// ─── 2.2 · almashtirish_guruh — TZ 5.6 ────────────────────────────────────

/**
 * Bir-birini almashtira oladigan materiallar.
 *
 * TZ 5.6 — «Sotuvda dropdown ochilganda faqat shu guruhdagi variantlar
 * chiqadi: mexanizm bosilganda kronshteyn chiqmaydi.»
 */
export const almashtirishGuruh = pgTable('almashtirish_guruh', {
  id: id(),
  nom: text('nom').notNull(),
  ...ochirilmaydi,
  ...izlar,
});

// ─── 2.1 · material — TZ 5 · Q-01, Q-05, Q-10, Q-14 ───────────────────────

export const HISOB_TURLARI = ['RULON', 'CHIZIQLI', 'DONA', 'KV_M'] as const;
export const SARFLASH_BIRLIKLARI = ['SM', 'KV_M', 'DONA'] as const;

export const material = pgTable(
  'material',
  {
    id: id(),
    nom: text('nom').notNull(),

    /** TZ 5.2 — to'rt xil hisob turi */
    hisobTuri: text('hisob_turi').notNull(),
    /** Ombor qanday qabul qiladi: shtanga, rulon, quti, metr, dona */
    kirimBirligi: text('kirim_birligi').notNull(),
    /** Buyurtmada qanday yechiladi (Q-01: chiziqli material — SM) */
    sarflashBirligi: text('sarflash_birligi').notNull(),

    /**
     * Q-01 — 1 kirim birligida nechta sarflash birligi.
     * metr → 100 · shtanga → 300 · quti (10 × 3 m) → 3000
     */
    koeffitsient: numeric('koeffitsient', { precision: 10, scale: 4 })
      .notNull()
      .default('1'),

    /** TZ 5.4 — mato uchun 1 kv.m, karniz uchun 1 METR, aksessuar uchun 1 dona */
    sotuvNarx: numeric('sotuv_narx', { precision: 14, scale: 2 }),
    sotuvValyuta: text('sotuv_valyuta').notNull().default('SOM'),

    /**
     * Kutilayotgan kelish narxi — yetkazib beruvchi odatda qancha so'raydi.
     *
     * ⚠️ BU TANNARX EMAS. TZ 5.4: «Tannarx qo'lda kiritilmaydi — har
     *    kirim hujjatidan avtomatik keladi.» Haqiqiy tannarx FIFO
     *    bo'yicha `bolak` yozuvlaridan keladi va bu ustun unga
     *    HECH QACHON aralashmaydi.
     *
     *    Bu ustun ikki ish qiladi:
     *      1. kirim formasini oldindan to'ldiradi (omborchi terishi qisqaradi)
     *      2. kartochkada taxminiy ustama % ni ko'rsatadi (5.4)
     *
     *    Ikkalasi ham — QULAYLIK. Pul hisobiga tegmaydi.
     */
    kutilayotganKelishNarx: numeric('kutilayotgan_kelish_narx', {
      precision: 14,
      scale: 2,
    }),
    kutilayotganKelishValyuta: text('kutilayotgan_kelish_valyuta')
      .notNull()
      .default('SOM'),
    /** Bo'sh → sozlamadagi standart (5.4) */
    minUstamaFoiz: numeric('min_ustama_foiz', { precision: 6, scale: 2 }),

    /** TZ 5.5 — ostatka chegaralari, ENI bo'yicha metrda (AUDIT Z-09) */
    yaroqsizChegaraM: numeric('yaroqsiz_chegara_m', { precision: 6, scale: 2 }),
    kamIshlatiladiganM: numeric('kam_ishlatiladigan_m', { precision: 6, scale: 2 }),
    /** Q-10 — kam qoldiq chegarasi UZUNLIK bo'yicha, metrda */
    kamQoldiqChegaraM: numeric('kam_qoldiq_chegara_m', { precision: 6, scale: 2 }),
    /** Q-14 — chegarani kv.m ga o'girish uchun. Bo'sh → oxirgi kirimdan olinadi */
    standartRulonEniM: numeric('standart_rulon_eni_m', { precision: 6, scale: 2 }),

    /**
     * Kirimda oldindan to'ldirish uchun odatdagi rulon uzunligi.
     *
     * ⚠️ Bu HISOBGA TEGMAYDI. Har rulon boshqa uzunlikda keladi —
     *    30 m, 45 m, 22 m — va ombor qoldig'i doim HAQIQIY
     *    o'lchamdan hisoblanadi (7.4, Q-05). Bu maydon faqat
     *    omborchining terishini qisqartiradi: kirim formasi shu
     *    qiymat bilan ochiladi, u kerak bo'lsa o'zgartiradi.
     *
     * ⚠️ Shu sababli `standart_` emas, `odatdagi_` deb ataladi:
     *    «standart» degan so'z uni majburiy qoida deb tushunishga
     *    olib kelardi.
     */
    odatdagiRulonBoyiM: numeric('odatdagi_rulon_boyi_m', { precision: 8, scale: 2 }),


    /**
     * Katalog rasmi — TZ 4.2 · 3.3 · 13 (bot katalogi).
     *
     * ⚠️ NEGA BAZADA, FAYL EMAS
     *
     *    Render bepul rejasida fayl tizimi VAQTINCHALIK: har
     *    deploy da yuklangan rasmlar YO'QOLARDI. Vercel Blob esa
     *    o'z qoidamiz bilan taqiqlangan (platformaga bog'lanmaslik).
     *
     *    Bazada saqlansa: zaxira nusxaga o'zi tushadi, alohida
     *    xizmat kerak emas va `docker compose up` bilan loqal ham
     *    ishlaydi.
     *
     * ⚠️ Rasm yuklanganda KICHIKLASHTIRILADI (eni 800 px). Aks
     *    holda telefondan olingan 5 MB rasm sotuv ekranini
     *    og'irlashtirardi.
     */
    rasm: baytlar('rasm'),
    /** `image/webp` kabi — brauzerga to'g'ri sarlavha berish uchun */
    rasmTuri: text('rasm_turi'),

    almashtirishGuruhId: bigint('almashtirish_guruh_id', { mode: 'number' }).references(
      () => almashtirishGuruh.id,
    ),
    /** Xarid ro'yxati uchun (AUDIT B-08) */
    yaxlitlashQadami: numeric('yaxlitlash_qadami', { precision: 8, scale: 2 }),

    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check('material_hisob_turi', sql`${t.hisobTuri} IN ('RULON','CHIZIQLI','DONA','KV_M')`),
    check('material_sarflash_birligi', sql`${t.sarflashBirligi} IN ('SM','KV_M','DONA')`),
    check('material_valyuta', sql`${t.sotuvValyuta} IN ('SOM','USD')`),
    check(
      'material_kelish_valyuta',
      sql`${t.kutilayotganKelishValyuta} IN ('SOM','USD')`,
    ),
    // Kutilayotgan narx ham manfiy bo'lmaydi
    check(
      'material_kelish_narx_manfiy_emas',
      sql`${t.kutilayotganKelishNarx} IS NULL OR ${t.kutilayotganKelishNarx} >= 0`,
    ),
    // TZ 5.8 — «Bloklaydi: koeffitsient 0 yoki manfiy»
    check('material_koeffitsient_musbat', sql`${t.koeffitsient} > 0`),
    // TZ 5.8 — «Bloklaydi: sotuv narxi manfiy»
    check('material_narx_manfiy_emas', sql`${t.sotuvNarx} IS NULL OR ${t.sotuvNarx} >= 0`),
    index('material_guruh').on(t.almashtirishGuruhId),
  ],
);

// ─── 2.3 · material_filial_narx — TZ 20.9 · Q-28 ──────────────────────────

/**
 * «Standart umumiy, filial o'zgartirishi mumkin» (Q-28).
 * Qator YO'Q → standart narx ishlaydi (20.9.1).
 */
export const materialFilialNarx = pgTable(
  'material_filial_narx',
  {
    id: id(),
    materialId: bigint('material_id', { mode: 'number' })
      .notNull()
      .references(() => material.id),
    filialId: bigint('filial_id', { mode: 'number' })
      .notNull()
      .references(() => filial.id),
    sotuvNarx: numeric('sotuv_narx', { precision: 14, scale: 2 }).notNull(),

    /**
     * ⚠️ Filial narxi ham dollarda bo'lishi mumkin — chet mato
     *    filialda ham dollarda yuritiladi.
     *
     *    Ilgari bu ustun yo'q edi va filial narxi DOIM so'm deb
     *    qabul qilinardi. Material dollarda, filial narxi esa
     *    so'mda bo'lsa — ikkalasi jimgina aralashib ketardi
     *    (1.3-invariant buzilishi).
     */
    valyuta: text('valyuta').notNull().default('SOM'),

    ...izlar,
  },
  (t) => [
    uniqueIndex('material_filial_narx_bitta').on(t.materialId, t.filialId),
    check('material_filial_narx_manfiy_emas', sql`${t.sotuvNarx} >= 0`),
    check('material_filial_narx_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
  ],
);

// ─── 2.4 · mahsulot_tur — TZ 4 ────────────────────────────────────────────

export const mahsulotTur = pgTable(
  'mahsulot_tur',
  {
    id: id(),
    nom: text('nom').notNull(),
    /** TZ 4.7 — ixtiyoriy. Bo'sh qolsa narxga hech narsa qo'shilmaydi */
    xizmatHaqi: numeric('xizmat_haqi', { precision: 14, scale: 2 }).default('0'),
    tartib: integer('tartib').notNull().default(0),

    /**
     * Katalog rasmi — TZ 4.2 · 3.3 · 13 (bot katalogi).
     *
     * ⚠️ NEGA BAZADA, FAYL EMAS
     *
     *    Render bepul rejasida fayl tizimi VAQTINCHALIK: har
     *    deploy da yuklangan rasmlar YO'QOLARDI. Vercel Blob esa
     *    o'z qoidamiz bilan taqiqlangan (platformaga bog'lanmaslik).
     *
     *    Bazada saqlansa: zaxira nusxaga o'zi tushadi, alohida
     *    xizmat kerak emas va `docker compose up` bilan loqal ham
     *    ishlaydi.
     *
     * ⚠️ Rasm yuklanganda KICHIKLASHTIRILADI (eni 800 px). Aks
     *    holda telefondan olingan 5 MB rasm sotuv ekranini
     *    og'irlashtirardi.
     */
    rasm: baytlar('rasm'),
    /** `image/webp` kabi — brauzerga to'g'ri sarlavha berish uchun */
    rasmTuri: text('rasm_turi'),

    oynadaKorinadi: boolean('oynada_korinadi').notNull().default(true),
    botdaKorinadi: boolean('botda_korinadi').notNull().default(true),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check(
      'mahsulot_tur_xizmat_haqi_manfiy_emas',
      sql`${t.xizmatHaqi} IS NULL OR ${t.xizmatHaqi} >= 0`,
    ),
  ],
);

// ─── 2.5 · mahsulot_slot — TZ 4.4 ─────────────────────────────────────────

/**
 * Mahsulot turining material joyi.
 *
 * TZ 5.7 va 3.3 — «Har slot qatorida faqat o'ziga tegishli matolar chiqadi.»
 * Bu `almashtirish_guruh_id` orqali ishlaydi: slot guruhni ko'rsatadi,
 * o'sha guruhdagi materiallar dropdownda chiqadi.
 */
export const mahsulotSlot = pgTable(
  'mahsulot_slot',
  {
    id: id(),
    mahsulotTurId: bigint('mahsulot_tur_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotTur.id),
    nom: text('nom').notNull(),
    tartib: integer('tartib').notNull().default(0),
    majburiy: boolean('majburiy').notNull().default(true),
    almashtirishGuruhId: bigint('almashtirish_guruh_id', { mode: 'number' }).references(
      () => almashtirishGuruh.id,
    ),
    /**
     * TZ 4.5 formulasi matn sifatida saqlanadi, `lib/domain/formula.ts`
     * hisoblaydi. Natija birligi materialning `sarflash_birligi` ga qarab
     * talqin qilinadi (AUDIT B-01).
     */
    formula: text('formula').notNull(),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [index('mahsulot_slot_tur').on(t.mahsulotTurId, t.tartib)],
);

// ─── 2.6 · mahsulot_parametr — TZ 4.3 ─────────────────────────────────────

export const mahsulotParametr = pgTable(
  'mahsulot_parametr',
  {
    id: id(),
    mahsulotTurId: bigint('mahsulot_tur_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotTur.id),
    /** Formulada ishlatiladigan nom: `CHET` */
    kod: text('kod').notNull(),
    nom: text('nom').notNull(),
    /** TZ 5.3 — barcha uzunlik smda */
    standartQiymat: numeric('standart_qiymat', { precision: 10, scale: 2 }),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    uniqueIndex('mahsulot_parametr_kod').on(t.mahsulotTurId, t.kod),
    // Formula tahlilchisi faqat katta harf va apostrofni taniydi
    check('mahsulot_parametr_kod_shakli', sql`${t.kod} ~ '^[A-Z][A-Z0-9_'']*$'`),
  ],
);

// ─── 2.7 · mahsulot_aksessuar — TZ 4.6 ────────────────────────────────────

/**
 * Komplekt qatori.
 *
 * ⚠️ Soni ham FORMULA sifatida saqlanadi: `'4'` — bu ham yaroqli formula
 * (QISM 3 §2.7 ning o'z izohi: `-- 'ENI * 2', '4'`).
 *
 * TZ 4.6 ekranida ikki rejim ko'rinadi («soni yoki formula»), lekin
 * ikkalasi ham shu bitta ustunga yoziladi — ikki nusxa saqlanmaydi.
 */
export const mahsulotAksessuar = pgTable(
  'mahsulot_aksessuar',
  {
    id: id(),
    mahsulotTurId: bigint('mahsulot_tur_id', { mode: 'number' })
      .notNull()
      .references(() => mahsulotTur.id),
    materialId: bigint('material_id', { mode: 'number' })
      .notNull()
      .references(() => material.id),
    formula: text('formula').notNull(),
    /** TZ 4.6 — «Ixtiyoriy aksessuar sotuvda avtomatik kelmaydi» */
    majburiy: boolean('majburiy').notNull().default(true),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    uniqueIndex('mahsulot_aksessuar_bitta').on(t.mahsulotTurId, t.materialId),
    index('mahsulot_aksessuar_material').on(t.materialId),
  ],
);

// ─── 2.8 · mijoz — TZ 6 · Q-23 ────────────────────────────────────────────

export const mijoz = pgTable(
  'mijoz',
  {
    id: id(),
    ism: text('ism').notNull(),
    telefon: text('telefon').unique(),
    telegramId: bigint('telegram_id', { mode: 'number' }).unique(),
    manzil: text('manzil'),

    /** TZ 6.3 — barcha matoga bir xil qo'llanadi, aksessuarga tegmaydi */
    offsetTuri: text('offset_turi'),
    offsetQiymat: numeric('offset_qiymat', { precision: 14, scale: 2 }),

    /** TZ 6.4 — limit DOIM so'mda */
    qarzLimiti: numeric('qarz_limiti', { precision: 14, scale: 2 }),
    eslatma: text('eslatma'),

    // ── Soliq maydonlari — Q-23 («hozirdan yig'iladi») ──
    shaxsTuri: text('shaxs_turi').notNull().default('JISMONIY'),
    tashkilotNomi: text('tashkilot_nomi'),
    inn: text('inn'),
    yuridikManzil: text('yuridik_manzil'),
    bankNomi: text('bank_nomi'),
    hisobRaqam: text('hisob_raqam'),
    mfo: text('mfo'),
    shartnomaRaqam: text('shartnoma_raqam'),
    shartnomaSana: date('shartnoma_sana'),
    ndsTolovchi: boolean('nds_tolovchi').notNull().default(false),
    ndsStavka: numeric('nds_stavka', { precision: 5, scale: 2 }),

    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check('mijoz_shaxs_turi', sql`${t.shaxsTuri} IN ('JISMONIY','YURIDIK')`),
    check(
      'mijoz_offset_turi',
      sql`${t.offsetTuri} IS NULL OR ${t.offsetTuri} IN ('FOIZ','SOM','USD')`,
    ),
    // Turi bor bo'lsa qiymat ham bo'lishi shart, aks holda offset ma'nosiz
    check(
      'mijoz_offset_toliq',
      sql`(${t.offsetTuri} IS NULL AND ${t.offsetQiymat} IS NULL)
          OR (${t.offsetTuri} IS NOT NULL AND ${t.offsetQiymat} IS NOT NULL)`,
    ),
    // QISM 3 §2.8 — yuridik shaxsda uch maydon majburiy
    check(
      'mijoz_yuridik_toliq',
      sql`${t.shaxsTuri} <> 'YURIDIK'
          OR (${t.tashkilotNomi} IS NOT NULL AND ${t.inn} IS NOT NULL
              AND ${t.yuridikManzil} IS NOT NULL)`,
    ),
    check('mijoz_limit_manfiy_emas', sql`${t.qarzLimiti} IS NULL OR ${t.qarzLimiti} >= 0`),
    index('mijoz_ism').on(t.ism),
  ],
);

// ─── 2.9 · yetkazib_beruvchi — TZ 9 ───────────────────────────────────────

export const yetkazibBeruvchi = pgTable(
  'yetkazib_beruvchi',
  {
    id: id(),
    nom: text('nom').notNull(),
    /** TZ 9.3 — «nima yetkazadi» */
    nimaYetkazadi: text('nima_yetkazadi'),

    // ── Aloqa (9.3) ──
    kontaktShaxs: text('kontakt_shaxs'),
    telefon: text('telefon'),
    qoshimchaTelefon: text('qoshimcha_telefon'),
    manzil: text('manzil'),

    // ── To'lov rekvizitlari (9.3) — «to'lov oynasida avtomatik chiqadi» ──
    bankNomi: text('bank_nomi'),
    hisobRaqam: text('hisob_raqam'),
    inn: text('inn'),
    mfo: text('mfo'),

    /** Bo'sh → sozlamadagi standart (9.3). Kirim hujjatiga avtomatik qo'yiladi */
    tolovMuddatiKun: integer('tolov_muddati_kun'),

    /**
     * ⚠️ Bu QARZ valyutasi EMAS.
     *
     * TZ 9.2: «So'm va dollar ALOHIDA turadi... Bitta yetkazib beruvchida
     * IKKALA valyutada qarz bo'lishi mumkin.» Qarz `yetkazib_beruvchi_harakat`
     * jadvalida, har yozuv o'z valyutasi bilan.
     *
     * Bu maydon — yangi kirim hujjatiga qo'yiladigan STANDART valyuta,
     * shunchaki qulaylik uchun.
     */
    valyuta: text('valyuta').notNull().default('SOM'),
    eslatma: text('eslatma'),
    ...ochirilmaydi,
    ...izlar,
  },
  (t) => [
    check('yetkazib_beruvchi_valyuta', sql`${t.valyuta} IN ('SOM','USD')`),
    check(
      'yetkazib_beruvchi_muddat',
      sql`${t.tolovMuddatiKun} IS NULL OR ${t.tolovMuddatiKun} >= 0`,
    ),
  ],
);
