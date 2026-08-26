/**
 * bot/yuboruvchi.ts — TZ 13.9 · 13.11 · 2.1-invariant
 *
 * Navbatdagi xabarlarni Telegramga yuboradi.
 *
 * ⚠️ Nega alohida: biznes amali xabarni faqat **yozadi** (§2.1 —
 *    tranzaksiya Telegramni kutib turmaydi). Yuborish shu yerda,
 *    tranzaksiyadan tashqarida bo'ladi. Telegram sekin javob bersa
 *    yoki umuman javob bermasa, buyurtma va pul harakati baribir
 *    yozilib bo'lgan.
 *
 * ⚠️ 13.11 — yetib bormagan xabar YO'QOLMAYDI: `YETMADI` bo'lib
 *    sabab bilan qoladi va buyurtma kartochkasida ko'rinadi (6.7).
 */

import { Markup, type Telegraf } from 'telegraf';
import { ulanishOl } from '@/lib/db';
import { xabarYetmadi, xabarYuborildi } from '@/lib/amal/bot';
import { MATN } from './matn';

/** Bir yurishda nechta xabar olinadi. */
const BIR_YURISHDA = 20;

/** Ikki yurish orasidagi tanaffus. */
const TANAFFUS_MS = 5_000;

interface NavbatXabari {
  readonly id: number;
  readonly telegram_id: number;
  readonly matn: string;
  readonly manba_turi: string | null;
  readonly manba_id: number | null;
}

/**
 * TZ 13.9 — «qayta kesish so'rovi» va «pul topshirildi» xabarlariga
 * tugma qo'shiladi. Qolganlari faqat xabar.
 *
 * ⚠️ Tugma xabar YOZILGANDA emas, YUBORILGANDA quriladi: tugma —
 *    Telegramning ko'rinish qismi, bazada saqlanadigan narsa emas.
 */
function tugmalar(x: NavbatXabari) {
  if (x.manba_id === null) return undefined;

  if (x.manba_turi === 'qayta_kesish') {
    return Markup.inlineKeyboard([
      Markup.button.callback(MATN.admin.tasdiqla, `brak_ha:${String(x.manba_id)}`),
      Markup.button.callback(MATN.admin.radEt, `brak_yoq:${String(x.manba_id)}`),
    ]).reply_markup;
  }

  if (x.manba_turi === 'topshiriq') {
    return Markup.inlineKeyboard([
      Markup.button.callback(
        MATN.admin.tasdiqla,
        `topshiriq_ha:${String(x.manba_id)}`,
      ),
    ]).reply_markup;
  }

  return undefined;
}

/**
 * Navbatdagi xabarlarni bir marta yuborib chiqadi.
 *
 * Nechta yuborilgani va nechtasi yetmagani qaytadi.
 */
export async function navbatniYubor(
  bot: Telegraf,
): Promise<{ yuborildi: number; yetmadi: number }> {
  const sql = ulanishOl();

  /**
   * ⚠️ `FOR UPDATE SKIP LOCKED` — bot ikki nusxada ishlab qolsa
   *    bir xabar ikki marta yuborilmasin. Holat darhol
   *    o'zgartiriladi: ikkinchi nusxa uni ko'rmaydi.
   */
  const xabarlar = await sql<NavbatXabari[]>`
    SELECT id, telegram_id, matn, manba_turi, manba_id
    FROM bot_xabar
    WHERE holat = 'NAVBATDA'
    ORDER BY yaratildi
    LIMIT ${BIR_YURISHDA}
    FOR UPDATE SKIP LOCKED`;

  let yuborildi = 0;
  let yetmadi = 0;

  for (const x of xabarlar) {
    try {
      await bot.telegram.sendMessage(x.telegram_id, x.matn, {
        parse_mode: 'Markdown',
        reply_markup: tugmalar(x),
      });
      await xabarYuborildi(sql, x.id);
      yuborildi += 1;
    } catch (xato) {
      /**
       * ⚠️ Xato YUTILADI va keyingi xabarga o'tiladi: bitta
       *    bloklangan foydalanuvchi butun navbatni to'xtatmasligi
       *    kerak (13.11).
       */
      const sabab =
        xato instanceof Error ? xato.message : 'Nomaʼlum Telegram xatosi';
      await xabarYetmadi(sql, x.id, sabab);
      yetmadi += 1;
    }
  }

  return { yuborildi, yetmadi };
}

/**
 * Yuboruvchini davomiy ishga tushiradi.
 *
 * ⚠️ `setInterval` EMAS, `setTimeout` zanjiri: oldingi yurish
 *    tugamasdan yangisi boshlanib, bir xabar ikki marta ketmasin.
 */
export function yuboruvchiniBoshla(bot: Telegraf): () => void {
  let toxtadi = false;
  let taymer: NodeJS.Timeout | null = null;

  const yurish = (): void => {
    if (toxtadi) return;

    navbatniYubor(bot)
      .catch(() => {
        // Baza uzilgan bo'lsa keyingi yurishda qayta urinadi
      })
      .finally(() => {
        if (!toxtadi) taymer = setTimeout(yurish, TANAFFUS_MS);
      });
  };

  yurish();

  return () => {
    toxtadi = true;
    if (taymer !== null) clearTimeout(taymer);
  };
}
