/**
 * bot/ishga.ts — TZ 13.1 · 13.11
 *
 * **Bitta bot dasturi, uchta panel.** `/start` bosilganda Telegram ID
 * xodimlar bazasida tekshiriladi va tegishli panel ochiladi.
 *
 * ⚠️ Bot **uzoq so'rov** (long polling) rejimida ishlaydi, webhook
 *    emas. Sabab: QISM 1 «`docker compose up` bilan loqal to'liq
 *    ishlashi shart», webhook esa ochiq internet manzilini talab
 *    qiladi va loqal muhitda ishlamaydi. Ishlab chiqarishda ham
 *    uzoq so'rov yetarli — kuniga bir necha yuz xabar.
 *
 * ⚠️ 13.11 — «Bot butunlay ishlamay qolsa ishlab chiqarish
 *    to'xtamasligi kerak.» Shuning uchun bot ALOHIDA jarayon:
 *    yiqilsa sayt ishlayveradi.
 */

import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { ulanishOl } from '@/lib/db';
import { botKimligi, sessiyaOl } from '@/lib/amal/bot';
import { muhitOqi } from '@/lib/muhit';
import { MATN } from './matn';
import { xavfsiz } from './yordamchi';
import { mijozMenyusi, mijozPaneliniUla, royxatBoshla } from './mijoz';
import { brakSababiQabul, ustaMenyusi, ustaPaneliniUla } from './usta';
import { adminMenyusi, adminPaneliniUla } from './admin';
import { yuboruvchiniBoshla } from './yuboruvchi';
import { oqimMatniniQabulQil, oqimniUla } from './buyurtma-oqimi';

export function botYarat(): Telegraf {
  const muhit = muhitOqi();
  const bot = new Telegraf(muhit.TELEGRAM_BOT_TOKEN);

  // ── 13.1 · /start — kim ekanini aniqlab, panel ochadi ──────────────────
  bot.start((ctx) =>
    xavfsiz(ctx, async () => {
      const tg = ctx.from.id;
      const kim = await botKimligi(ulanishOl(), tg);

      switch (kim.panel) {
        case 'ADMIN':
          await ctx.reply('Admin paneli', {
            reply_markup: adminMenyusi().reply_markup,
          });
          return;

        case 'USTA':
          await ctx.reply('Usta paneli', {
            reply_markup: ustaMenyusi().reply_markup,
          });
          return;

        case 'MIJOZ':
          // Ro'yxatdan o'tmagan bo'lsa — 13.2 oqimi
          if (kim.mijozId === null) {
            await royxatBoshla(ctx);
            return;
          }
          await ctx.reply('Asosiy menyu', {
            reply_markup: mijozMenyusi().reply_markup,
          });
          return;
      }
    }),
  );

  /**
   * Panellarni ulash tartibi muhim emas: har biri O'Z tugmalarini
   * eshitadi va boshqa paneldagi odam ularni ko'rmaydi.
   *
   * ⚠️ Lekin ruxsat baribir HAR CHAQIRUVDA qayta tekshiriladi
   *    (§9.4): tugma matnini qo'lda yozib yuborish mumkin.
   */
  mijozPaneliniUla(bot, async (ctx) => {
    const tg = ctx.from?.id;
    if (tg === undefined) return null;
    return (await botKimligi(ulanishOl(), tg)).mijozId;
  });

  /**
   * 13.4 — buyurtma oqimi. Mijoz paneli ulangandan KEYIN turadi:
   * «📝 Buyurtma berish» tugmasini shu modul eshitadi.
   */
  oqimniUla(bot, async (ctx) => {
    const tg = ctx.from?.id;
    if (tg === undefined) return null;
    return (await botKimligi(ulanishOl(), tg)).mijozId;
  });

  ustaPaneliniUla(bot, async (ctx) => {
    const tg = ctx.from?.id;
    if (tg === undefined) return null;

    const kim = await botKimligi(ulanishOl(), tg);
    // 13.8 — «roli USTA bo'lishi kerak»
    if (!kim.rollar.includes('USTA') || kim.xodimId === null) return null;
    return { xodimId: kim.xodimId, filialId: kim.filialId ?? 0 };
  });

  adminPaneliniUla(bot, async (ctx) => {
    const tg = ctx.from?.id;
    if (tg === undefined) return null;

    const kim = await botKimligi(ulanishOl(), tg);
    if (!kim.rollar.includes('ADMIN') || kim.xodimId === null) return null;
    return { xodimId: kim.xodimId, filialId: kim.filialId ?? 0 };
  });

  /**
   * Erkin matn — suhbat qadamiga qarab yo'naltiriladi.
   *
   * ⚠️ Eng oxirida turadi: tugmalar allaqachon ushlangan bo'ladi.
   *    Aks holda «📋 Umumiy navbat» matni ham shu yerga tushardi.
   */
  bot.on(message('text'), (ctx) =>
    xavfsiz(ctx, async () => {
      const tg = ctx.from.id;
      const sessiya = await sessiyaOl(ulanishOl(), tg);

      const kim = await botKimligi(ulanishOl(), tg);

      // 13.8 — qayta kesish sababi kutilmoqda
      if (sessiya.qadam === 'IZOH' && 'brakPozitsiyaId' in sessiya.holat) {
        if (kim.xodimId !== null) {
          const bajarildi = await brakSababiQabul(
            ctx,
            kim.xodimId,
            tg,
            ctx.message.text,
          );
          if (bajarildi) return;
        }
      }

      // 13.4 — o'lcham yoki izoh kutilmoqda
      if (kim.mijozId !== null) {
        const oqimga = await oqimMatniniQabulQil(
          ctx,
          tg,
          ctx.message.text,
          kim.mijozId,
        );
        if (oqimga) return;
      }

      await ctx.reply(MATN.tushunmadim);
    }),
  );

  return bot;
}

/**
 * Botni ishga tushiradi.
 *
 * ⚠️ `SIGINT`/`SIGTERM` da to'xtatiladi: Telegram bir vaqtda bitta
 *    uzoq so'rovga ruxsat beradi va toza to'xtamasa keyingi ishga
 *    tushirish «409 Conflict» beradi.
 */
export async function botniIshgaTushir(): Promise<void> {
  const bot = botYarat();

  /**
   * 13.9 — bildirishnoma yuboruvchisi. Biznes amallari xabarni
   * navbatga qo'yadi, u shu yerdan Telegramga ketadi (§2.1).
   */
  const yuboruvchiniToxtat = yuboruvchiniBoshla(bot);

  process.once('SIGINT', () => {
    yuboruvchiniToxtat();
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => {
    yuboruvchiniToxtat();
    bot.stop('SIGTERM');
  });

  await bot.launch();
}
