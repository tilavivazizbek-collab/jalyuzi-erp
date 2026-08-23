/**
 * bot/admin.ts — TZ 13.9
 *
 * Admin paneli. «Admin saytda ishlaydi. Bot **tez javob berish**
 * uchun.»
 *
 * ⚠️ 13.9 — botdan bajariladigan FAQAT IKKI amal: qayta kesishni
 *    tasdiqlash va pul topshirig'ini tasdiqlash. Qolgan hammasi
 *    saytda. Shu sabab bu yerga yangi amal qo'shilmaydi — u saytga
 *    yoziladi.
 */

import { Markup, type Telegraf } from 'telegraf';
import { ulanishOl } from '@/lib/db';
import { qaytaKesishHal } from '@/lib/amal/qayta-kesish';
import { topshiriqniQabulQil } from '@/lib/amal/kassa';
import { birMartaBajar } from '@/lib/amal/bot';
import { amalKaliti } from '@/lib/domain/bot';
import { pulKorsat, som } from '@/lib/domain/pul';
import { MATN, TAKROR } from './matn';
import { xavfsiz, type BotKontekst } from './yordamchi';

/** 13.9 — admin menyusi: uchta ko'rsatkich. */
export function adminMenyusi() {
  return Markup.keyboard([
    [MATN.admin.bugun, MATN.admin.kassa],
    [MATN.admin.ochiq],
  ]).resize();
}

// ─── 13.9 · Ko'rsatkichlar ────────────────────────────────────────────────

/**
 * TZ 13.9 — «Ko'rish uchun: bugungi tushum · kassa qoldig'i · ochiq
 * buyurtmalar soni.»
 *
 * ⚠️ 2.2-invariant — hech qaysi qiymat saqlanmaydi, hammasi `SUM()`.
 * ⚠️ Q-25 — faqat O'Z filiali. Barcha filial hisoboti saytda (20.6.2).
 */
export async function bugungiTushum(
  ctx: BotKontekst,
  filialId: number,
): Promise<void> {
  const q = await ulanishOl()<{ summa: string | null }[]>`
    SELECT SUM(y.summa)::text AS summa
    FROM kassa_yozuv y
    JOIN kassa k ON k.id = y.kassa_id
    WHERE k.filial_id = ${filialId}
      AND y.valyuta = 'SOM'
      AND y.summa > 0
      AND y.sana::date = CURRENT_DATE`;

  const summa = q[0]?.summa ?? '0';
  await ctx.reply(`📊 Bugungi tushum: *${pulKorsat(som(summa))}*`, {
    parse_mode: 'Markdown',
    reply_markup: adminMenyusi().reply_markup,
  });
}

export async function kassaQoldigi(
  ctx: BotKontekst,
  filialId: number,
): Promise<void> {
  const q = await ulanishOl()<{ nom: string; valyuta: string; qoldiq: string }[]>`
    SELECT k.nom, k.valyuta,
           COALESCE(SUM(y.summa), 0)::text AS qoldiq
    FROM kassa k
    LEFT JOIN kassa_yozuv y ON y.kassa_id = k.id
    WHERE k.filial_id = ${filialId} AND k.faol = true
    GROUP BY k.id, k.nom, k.valyuta
    ORDER BY k.nom`;

  if (q.length === 0) {
    await ctx.reply('Kassa yo‘q.', {
      reply_markup: adminMenyusi().reply_markup,
    });
    return;
  }

  const qatorlar = q.map(
    (k) => `${k.nom} · ${k.valyuta}: ${Number(k.qoldiq).toLocaleString('uz-UZ')}`,
  );

  await ctx.reply(['💵 *KASSA QOLDIG‘I*', '', ...qatorlar].join('\n'), {
    parse_mode: 'Markdown',
    reply_markup: adminMenyusi().reply_markup,
  });
}

export async function ochiqBuyurtmalar(
  ctx: BotKontekst,
  filialId: number,
): Promise<void> {
  const q = await ulanishOl()<{ n: number }[]>`
    SELECT COUNT(DISTINCT b.id)::int AS n
    FROM buyurtma b
    JOIN buyurtma_pozitsiya p ON p.buyurtma_id = b.id
    WHERE b.sotgan_filial_id = ${filialId}
      AND p.holat NOT IN ('TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR')`;

  await ctx.reply(`📦 Ochiq buyurtmalar: *${String(q[0]?.n ?? 0)} ta*`, {
    parse_mode: 'Markdown',
    reply_markup: adminMenyusi().reply_markup,
  });
}

// ─── 13.9 · Qayta kesishni tasdiqlash ─────────────────────────────────────

/**
 * TZ 13.9 — bildirishnoma tasdiqlash tugmasi bilan keladi.
 *
 * ⚠️ 8.17.3 — ushlanma va «haq saqlansinmi» qarorlari SAYTDA
 *    qilinadi. Botdan tasdiqlansa ushlanma NOL bo'ladi: admin
 *    keyin xodim kartochkasidan qo'shadi (10.13). Bot tez javob
 *    uchun, batafsil qaror uchun emas.
 */
export function qaytaKesishXabari(sorovId: number, matn: string) {
  return {
    matn,
    tugmalar: Markup.inlineKeyboard([
      Markup.button.callback(MATN.admin.tasdiqla, `brak_ha:${String(sorovId)}`),
      Markup.button.callback(MATN.admin.radEt, `brak_yoq:${String(sorovId)}`),
    ]).reply_markup,
  };
}

// ─── Panelni ulash ────────────────────────────────────────────────────────

export interface AdminKimligi {
  readonly xodimId: number;
  readonly filialId: number;
}

export function adminPaneliniUla(
  bot: Telegraf,
  adminOl: (ctx: BotKontekst) => Promise<AdminKimligi | null>,
): void {
  bot.hears(MATN.admin.bugun, (ctx) =>
    xavfsiz(ctx, async () => {
      const a = await adminOl(ctx);
      if (a === null) return;
      await bugungiTushum(ctx, a.filialId);
    }),
  );

  bot.hears(MATN.admin.kassa, (ctx) =>
    xavfsiz(ctx, async () => {
      const a = await adminOl(ctx);
      if (a === null) return;
      await kassaQoldigi(ctx, a.filialId);
    }),
  );

  bot.hears(MATN.admin.ochiq, (ctx) =>
    xavfsiz(ctx, async () => {
      const a = await adminOl(ctx);
      if (a === null) return;
      await ochiqBuyurtmalar(ctx, a.filialId);
    }),
  );

  // 13.9 — birinchi amal: qayta kesishni hal qilish
  bot.action(/^brak_(ha|yoq):(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const a = await adminOl(ctx);
      const tg = ctx.from?.id;
      if (a === null || tg === undefined) return;

      const tasdiqlansinmi = ctx.match[1] === 'ha';
      const sorovId = Number(ctx.match[2]);

      const { takrormi } = await birMartaBajar(
        ulanishOl(),
        amalKaliti('brak_hal', tg, sorovId),
        () =>
          qaytaKesishHal(
            ulanishOl(),
            {
              sorovId,
              tasdiqlansinmi,
              // 10.13 — ushlanma saytda hal qilinadi
              ushlanmaSumma: '0',
              haqSaqlandi: false,
              izoh: 'Botdan hal qilindi (13.9)',
            },
            a.xodimId,
          ),
      );

      await ctx.reply(
        takrormi
          ? TAKROR.tasdiq
          : tasdiqlansinmi
            ? MATN.admin.tasdiqlandi
            : MATN.admin.radEtildi,
      );
    }),
  );

  // 13.9 — ikkinchi amal: pul topshirig'ini tasdiqlash (12.7)
  bot.action(/^topshiriq_ha:(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const a = await adminOl(ctx);
      const tg = ctx.from?.id;
      if (a === null || tg === undefined) return;

      const topshiriqId = Number(ctx.match[1]);

      const { takrormi } = await birMartaBajar(
        ulanishOl(),
        amalKaliti('topshiriq_qabul', tg, topshiriqId),
        () => topshiriqniQabulQil(ulanishOl(), topshiriqId, a.xodimId),
      );

      await ctx.reply(takrormi ? TAKROR.tasdiq : MATN.admin.tasdiqlandi);
    }),
  );
}
