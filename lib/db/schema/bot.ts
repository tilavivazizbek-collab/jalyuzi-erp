/**
 * lib/db/schema/bot.ts — TZ 13 · 13.4 · 13.10 · 13.11
 *
 * Telegram bot jadvallari.
 *
 * ⚠️ 13.1 — «Bot hech qachon yagona interfeys emas.» Bu jadvallar
 *    faqat bot **suhbatini** saqlaydi; buyurtma, ish va pul baribir
 *    o'sha `lib/amal/` funksiyalari orqali yoziladi. Bot ishlamay
 *    qolsa ish saytdan davom etadi (13.11).
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { id, izlar } from './ustunlar';
import { xodim } from './asos';

// ─── 13.4 · bot_sessiya — suhbat holati ───────────────────────────────────

/** Mijoz botidagi buyurtma oqimining bosqichlari (13.4). */
export const BOT_QADAMLARI = [
  'BOSH',
  'ISM_TASDIQ',
  'TELEFON',
  'TUR_TANLASH',
  'SLOT_MATO',
  'ENI',
  'BOYI',
  'AKSESSUAR',
  'IZOH',
  'SAVAT',
] as const;

/**
 * TZ 13.4 — bot oqimi ko'p bosqichli va **savati bor**: bitta
 * buyurtmada bir nechta pozitsiya bo'lishi mumkin (3.9).
 *
 * ⚠️ Holat xotirada emas, BAZADA saqlanadi. Sabab: bot qayta ishga
 *    tushsa yoki ikkinchi nusxada yursa, foydalanuvchi yarim yo'lda
 *    qolib ketmasin.
 *
 * ⚠️ Bu **harakat jadvali emas** — joriy holat. Shuning uchun
 *    `UPDATE` ruxsat etiladi (§6.5 taqig'i pul va qoldiq
 *    jadvallariga tegishli). Buyurtmaning o'zi baribir
 *    `buyurtmaYarat` orqali yoziladi va o'sha yerda audit qoladi.
 */
export const botSessiya = pgTable(
  'bot_sessiya',
  {
    id: id(),
    /** Telegram foydalanuvchi raqami — bir odam bitta sessiya */
    telegramId: bigint('telegram_id', { mode: 'number' }).notNull(),
    qadam: text('qadam').notNull().default('BOSH'),

    /**
     * Yarim yig'ilgan pozitsiya va savat.
     *
     * ⚠️ `jsonb` — chunki tuzilma **konstruktordan** keladi (4-bo'lim,
     *    13.4): yangi mahsulot turi qo'shilsa botda avtomatik paydo
     *    bo'ladi. Qat'iy ustunlar bilan har yangi tur migratsiya
     *    talab qilardi.
     */
    holat: jsonb('holat').notNull().default(sql`'{}'::jsonb`),

    /** Oxirgi harakat — eskirgan sessiyalarni tozalash uchun */
    tegildi: timestamp('tegildi', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    ...izlar,
  },
  (t) => [
    uniqueIndex('bot_sessiya_telegram').on(t.telegramId),
    check(
      'bot_sessiya_qadam',
      sql`${t.qadam} IN ('BOSH','ISM_TASDIQ','TELEFON','TUR_TANLASH',
                         'SLOT_MATO','ENI','BOYI','AKSESSUAR','IZOH','SAVAT')`,
    ),
    index('bot_sessiya_tegildi').on(t.tegildi),
  ],
);

// ─── 13.11 · bot_xabar — yuborilgan va yetib bormagan xabarlar ────────────

export const XABAR_HOLATLARI = ['NAVBATDA', 'YUBORILDI', 'YETMADI'] as const;

/**
 * TZ 13.11 — «Foydalanuvchi botni bloklagan bo'lsa xabar yetib
 * bormaydi. Bu **qayd etiladi**» va buyurtma kartochkasida qizil
 * holatda ko'rinadi, qayta yuborish tugmasi bilan.
 *
 * ⚠️ Xabar shu jadvalga yozilib, keyin yuboriladi — teskarisi emas.
 *    Aks holda Telegram javob bermay qolsa xabar yo'qolardi va
 *    hech kim bilmasdi.
 *
 * ⚠️ 2.1-invariant — xabar yuborish buyurtma tranzaksiyasini
 *    USHLAB TURMAYDI: yozuv tranzaksiya ichida, yuborish esa
 *    keyin. Telegram sekin javob bersa buyurtma qulflanib
 *    qolmaydi.
 */
export const botXabar = pgTable(
  'bot_xabar',
  {
    id: id(),
    telegramId: bigint('telegram_id', { mode: 'number' }).notNull(),
    /** Kimga tegishli — sotuvchiga «qo'ng'iroq qiling» deyish uchun */
    xodimId: bigint('xodim_id', { mode: 'number' }).references(() => xodim.id),

    matn: text('matn').notNull(),
    holat: text('holat').notNull().default('NAVBATDA'),

    /** Nima haqida — buyurtma kartochkasida ko'rsatish uchun (6.7) */
    manbaTuri: text('manba_turi'),
    manbaId: bigint('manba_id', { mode: 'number' }),

    yuborildi: timestamp('yuborildi', { withTimezone: true }),
    /** Telegram bergan sabab — «bot bloklangan» va boshqalar */
    xatoSabab: text('xato_sabab'),
    urinishlar: bigint('urinishlar', { mode: 'number' }).notNull().default(0),
    ...izlar,
  },
  (t) => [
    check(
      'bot_xabar_holat',
      sql`${t.holat} IN ('NAVBATDA','YUBORILDI','YETMADI')`,
    ),
    // Yetmagan xabar sababsiz qolmaydi — 13.11 shuni talab qiladi
    check(
      'bot_xabar_sabab',
      sql`${t.holat} <> 'YETMADI' OR ${t.xatoSabab} IS NOT NULL`,
    ),
    index('bot_xabar_navbat').on(t.holat).where(sql`${t.holat} = 'NAVBATDA'`),
    index('bot_xabar_manba').on(t.manbaTuri, t.manbaId),
  ],
);
