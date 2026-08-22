/**
 * bot/mijoz.ts — TZ 13.2 · 13.3 · 13.6 · 13.7
 *
 * Mijoz paneli: ro'yxatdan o'tish, menyu, buyurtmalar va balans.
 *
 * ⚠️ Buyurtma OQIMI (13.4) alohida faylda — u eng katta qism va
 *    konstruktordan quriladi.
 */

import { Markup, type Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { ulanishOl } from '@/lib/db';
import { mijozniBogla, sessiyaOl, sessiyaYoz } from '@/lib/amal/bot';
import { mijozStatusi, pozitsiyaXulosasi } from '@/lib/domain/bot';
import type { PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { pulKorsat, som, dollar } from '@/lib/domain/pul';
import { MATN } from './matn';
import { xavfsiz, type BotKontekst } from './yordamchi';

/**
 * ⚠️ Botdan yozilgan yozuvlarning `yaratdi_id` si — TIZIM xodimi.
 *    Mijozning o'zi xodim emas, lekin `yaratdi_id` NOT NULL
 *    (QISM 3 §0.1). Urug'dagi birinchi xodim shu rolni bajaradi.
 */
const TIZIM_XODIM = 1;

/** 13.3 — mijoz menyusi. */
export function mijozMenyusi() {
  return Markup.keyboard([
    [MATN.menyu.katalog, MATN.menyu.buyurtma],
    [MATN.menyu.buyurtmalarim, MATN.menyu.balans],
    [MATN.menyu.boglanish],
  ]).resize();
}

// ─── 13.2 · Ro'yxatdan o'tish ─────────────────────────────────────────────

/**
 * TZ 13.2 — «Telefon **qo'lda yozilmaydi** — faqat Telegram tugmasi
 * orqali. Shunda raqam haqiqiy bo'ladi.»
 */
export async function royxatBoshla(ctx: BotKontekst): Promise<void> {
  const tg = ctx.from?.id;
  if (tg === undefined) return;

  const ism = [ctx.from?.first_name, ctx.from?.last_name]
    .filter((x) => x !== undefined && x !== '')
    .join(' ');

  await sessiyaYoz(
    ulanishOl(),
    tg,
    { qadam: 'TELEFON', holat: { ism } },
    TIZIM_XODIM,
  );

  await ctx.reply(MATN.salom);
  await ctx.reply(
    MATN.telefonSora,
    Markup.keyboard([[Markup.button.contactRequest(MATN.telefonTugma)]])
      .resize()
      .oneTime(),
  );
}

/** Telegram «kontakt» xabari kelganda. */
export async function telefonQabul(
  ctx: BotKontekst,
  telefon: string,
): Promise<void> {
  const tg = ctx.from?.id;
  if (tg === undefined) return;

  const sessiya = await sessiyaOl(ulanishOl(), tg);
  const saqlangan = sessiya.holat.ism;
  const ism =
    typeof saqlangan === 'string' && saqlangan.trim() !== ''
      ? saqlangan
      : (ctx.from?.first_name ?? 'Mijoz');

  await mijozniBogla(ulanishOl(), { telegramId: tg, ism, telefon }, TIZIM_XODIM);
  await sessiyaYoz(ulanishOl(), tg, { qadam: 'BOSH', holat: {} }, TIZIM_XODIM);

  await ctx.reply(MATN.royxatdanOtdi, mijozMenyusi());
}

// ─── 13.6 · Buyurtmalarim ─────────────────────────────────────────────────

interface BuyurtmaQatori {
  readonly raqam: string;
  readonly holatlar: string;
}

/**
 * TZ 13.6 — «Har pozitsiya alohida statusda bo'lishi mumkin (8.2).
 * Botda shunday ko'rsatiladi.»
 *
 * ⚠️ Ichki 12 ta status mijozga CHIQMAYDI — `mijozStatusi` orqali
 *    to'rttaga siqiladi. «Materialga kutmoqda» ayniqsa: bu ichki
 *    muammo, mijozga sabab bo'lmaydi (13.12).
 */
export async function buyurtmalarimKorsat(
  ctx: BotKontekst,
  mijozId: number,
): Promise<void> {
  const q = await ulanishOl()<BuyurtmaQatori[]>`
    SELECT b.raqam,
           string_agg(p.holat, ',' ORDER BY p.tartib) AS holatlar
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    WHERE b.mijoz_id = ${mijozId}
    GROUP BY b.id, b.raqam, b.sana
    ORDER BY b.sana DESC
    LIMIT 10`;

  if (q.length === 0) {
    await ctx.reply(MATN.buyurtmaYoq, mijozMenyusi());
    return;
  }

  const qatorlar = q.map((b) => {
    const holatlar = b.holatlar.split(',') as PozitsiyaHolati[];
    return `*${b.raqam}*\n${pozitsiyaXulosasi(holatlar)}`;
  });

  await ctx.reply(qatorlar.join('\n\n'), {
    parse_mode: 'Markdown',
    reply_markup: mijozMenyusi().reply_markup,
  });
}

// ─── 13.7 · Balans ────────────────────────────────────────────────────────

/**
 * TZ 13.7 — balans 6.8 dagi harakatlar yig'indisi.
 *
 * ⚠️ 2.2-invariant — balans SAQLANMAYDI, `SUM()` bilan hisoblanadi.
 * ⚠️ 1.3-invariant — so'm va dollar **alohida** ko'rsatiladi.
 */
export async function balansKorsat(
  ctx: BotKontekst,
  mijozId: number,
): Promise<void> {
  const sql = ulanishOl();

  const qarz = await sql<{ valyuta: string; summa: string }[]>`
    SELECT valyuta, SUM(summa)::text AS summa
    FROM mijoz_harakat
    WHERE mijoz_id = ${mijozId}
    GROUP BY valyuta`;

  const buyurtmalar = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM buyurtma WHERE mijoz_id = ${mijozId}`;

  const somQarz = qarz.find((x) => x.valyuta === 'SOM')?.summa ?? '0';
  const dollarQarz = qarz.find((x) => x.valyuta === 'USD')?.summa ?? '0';

  const qatorlar = [
    '💰 *BALANSIM*',
    '',
    `📋 Jami buyurtmalar: ${String(buyurtmalar[0]?.n ?? 0)} ta`,
  ];

  if (Number(somQarz) > 0) {
    qatorlar.push(`🔴 Qarz: ${pulKorsat(som(somQarz))}`);
  }
  if (Number(dollarQarz) > 0) {
    qatorlar.push(`🔴 Qarz: ${pulKorsat(dollar(dollarQarz))}`);
  }
  if (Number(somQarz) < 0 || Number(dollarQarz) < 0) {
    // Manfiy — avans (6.8)
    const avansSom = Math.abs(Math.min(Number(somQarz), 0));
    if (avansSom > 0) {
      qatorlar.push(`🟢 Avans: ${pulKorsat(som(avansSom.toFixed(2)))}`);
    }
  }
  if (Number(somQarz) <= 0 && Number(dollarQarz) <= 0) {
    qatorlar.push(MATN.qarzYoq);
  }

  await ctx.reply(qatorlar.join('\n'), {
    parse_mode: 'Markdown',
    reply_markup: mijozMenyusi().reply_markup,
  });
}

// ─── Panelni ulash ────────────────────────────────────────────────────────

export function mijozPaneliniUla(
  bot: Telegraf,
  mijozIdOl: (ctx: BotKontekst) => Promise<number | null>,
): void {
  bot.hears(MATN.menyu.buyurtmalarim, (ctx) =>
    xavfsiz(ctx, async () => {
      const mijozId = await mijozIdOl(ctx);
      if (mijozId === null) {
        await royxatBoshla(ctx);
        return;
      }
      await buyurtmalarimKorsat(ctx, mijozId);
    }),
  );

  bot.hears(MATN.menyu.balans, (ctx) =>
    xavfsiz(ctx, async () => {
      const mijozId = await mijozIdOl(ctx);
      if (mijozId === null) {
        await royxatBoshla(ctx);
        return;
      }
      await balansKorsat(ctx, mijozId);
    }),
  );

  bot.on(message('contact'), (ctx) =>
    xavfsiz(ctx, async () => {
      const telefon = ctx.message.contact.phone_number;
      /**
       * ⚠️ Boshqa odamning kontakti yuborilishi mumkin. Faqat
       *    O'ZINIKI qabul qilinadi — aks holda mijoz begona raqam
       *    bilan ro'yxatdan o'tardi.
       */
      if (ctx.message.contact.user_id !== ctx.from.id) {
        await ctx.reply(MATN.telefonSora);
        return;
      }
      await telefonQabul(ctx, telefon);
    }),
  );
}

/** 13.6 — mijozga ko'rinadigan status matni (xabarlar uchun). */
export function holatMatni(holat: PozitsiyaHolati): string {
  return mijozStatusi(holat);
}
