/**
 * bot/yordamchi.ts — TZ 13.1 · 13.10 · 13.11
 *
 * Botning umumiy qismlari: kontekst turi, xatoni ushlash va xabar
 * yuborish.
 *
 * ⚠️ 13.11 — «Foydalanuvchi botni bloklagan bo'lsa xabar yetib
 *    bormaydi. Bu **qayd etiladi**.» Shu sabab bot hech qachon
 *    to'g'ridan-to'g'ri `ctx.reply` bilan MUHIM xabar yubormaydi:
 *    muhim xabar avval `bot_xabar` ga yoziladi (`xabarYubor`).
 *    Menyu va savol kabi o'tkinchi javoblar oddiy `reply` bilan
 *    ketaveradi — ular yetib bormasa ham hech narsa yo'qolmaydi.
 */

import type { Context, Telegraf } from 'telegraf';
import { ulanishOl } from '@/lib/db';
import {
  xabarNavbatgaQoy,
  xabarYetmadi,
  xabarYuborildi,
} from '@/lib/amal/bot';
import { biznesXatosimi } from '@/lib/xato';
import { MATN } from './matn';

export type BotKontekst = Context;

/** Telegram xabar egasi. Kanal yozuvlarida `from` bo'lmasligi mumkin. */
export function telegramIdOl(ctx: BotKontekst): number | null {
  return ctx.from?.id ?? null;
}

/**
 * TZ 13.11 — muhim xabarni **yozib**, keyin yuboradi.
 *
 * Yetib bormasa `bot_xabar` da `YETMADI` bo'lib qoladi va buyurtma
 * kartochkasida qizil ko'rinadi (6.7). Sotuvchi qo'ng'iroq qiladi.
 *
 * ⚠️ Telegram xatosi bu yerda YUTILADI: xabar yetib bormagani
 *    buyurtmani bekor qilmaydi. Aks holda mijoz botni bloklagani
 *    uchun ishlab chiqarish to'xtardi.
 */
export async function xabarYubor(
  bot: Telegraf,
  kirim: {
    readonly telegramId: number;
    readonly matn: string;
    readonly xodimId?: number | null;
    readonly manbaTuri?: string | null;
    readonly manbaId?: number | null;
  },
  yaratdiId: number,
): Promise<{ yetdimi: boolean }> {
  const sql = ulanishOl();
  const { xabarId } = await xabarNavbatgaQoy(sql, kirim, yaratdiId);

  try {
    await bot.telegram.sendMessage(kirim.telegramId, kirim.matn, {
      parse_mode: 'Markdown',
    });
    await xabarYuborildi(sql, xabarId);
    return { yetdimi: true };
  } catch (x) {
    const sabab = x instanceof Error ? x.message : 'Nomaʼlum Telegram xatosi';
    await xabarYetmadi(sql, xabarId, sabab);
    return { yetdimi: false };
  }
}

/**
 * Har bir tugma va buyruq shu bilan o'raladi.
 *
 * ⚠️ Bot **yiqilmasligi** shart: bitta foydalanuvchining xatosi butun
 *    botni to'xtatsa qolgan hamma ishsiz qoladi. Biznes xatosi
 *    foydalanuvchiga o'z tilida ko'rsatiladi, kutilmagani esa
 *    umumiy xabar bilan yopiladi.
 */
export async function xavfsiz(
  ctx: BotKontekst,
  amal: () => Promise<void>,
): Promise<void> {
  try {
    await amal();
  } catch (x) {
    const matn = biznesXatosimi(x) ? x.message : MATN.xato;
    try {
      await ctx.reply(matn);
    } catch {
      // Javob ham ketmasa — qiladigan ish yo'q, bot yashaydi
    }
  }
}

/** Telegramdagi Markdown belgilaridan qochish. */
export function qochir(matn: string): string {
  return matn.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
