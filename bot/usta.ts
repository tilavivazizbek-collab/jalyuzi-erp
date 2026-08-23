/**
 * bot/usta.ts — TZ 13.8 · 8.5 · 10.13 · 13.10
 *
 * Usta paneli: navbat, ishni olish, tugatish, qayta kesish so'rovi va
 * balans.
 *
 * ⚠️ 13.1 — «Bot yagona interfeys emas»: bu yerdagi har amal
 *    `lib/amal/` funksiyasini chaqiradi. Bot ishlamay qolsa usta
 *    ishini saytdan oladi va tugatadi (13.11).
 *
 * ⚠️ 13.8 — «Narx ko'rsatilmaydi. Faqat ishlab chiqarish
 *    ma'lumotlari.» Usta mahsulot qanchaga sotilganini bilmaydi.
 */

import { Markup, type Telegraf } from 'telegraf';
import { ulanishOl } from '@/lib/db';
import { ishniOl, tugatdim } from '@/lib/amal/ish';
import { qaytaKesishSora } from '@/lib/amal/qayta-kesish';
import { pozitsiyaStavkasi } from '@/lib/amal/stavka';
import { birMartaBajar, sessiyaOl, sessiyaYoz } from '@/lib/amal/bot';
import { amalKaliti } from '@/lib/domain/bot';
import { pulKorsat, som } from '@/lib/domain/pul';
import { MATN, TAKROR } from './matn';
import { xavfsiz, type BotKontekst } from './yordamchi';

const TIZIM_XODIM = 1;

/** 13.8 — usta menyusi. */
export function ustaMenyusi() {
  return Markup.keyboard([
    [MATN.usta.navbat, MATN.usta.ishlarim],
    [MATN.usta.tugatganlarim, MATN.usta.balans],
  ]).resize();
}

// ─── 13.8 · Umumiy navbat ─────────────────────────────────────────────────

interface NavbatQatori {
  readonly pozitsiya_id: number;
  readonly raqam: string;
  readonly tartib: number;
  readonly tur: string;
  readonly eni_sm: number;
  readonly boyi_sm: number;
  readonly muddat: string | null;
  readonly matolar: string | null;
  readonly aksessuarlar: string | null;
}

/**
 * TZ 13.8 — «Umumiy navbat. Admin taqsimlamaydi — usta o'zi
 * oladi (8.5).»
 *
 * ⚠️ 10.12 — stavkasi belgilanmagan tur ham navbatda KO'RINADI.
 *    Ish to'xtamaydi.
 *
 * ⚠️ Q-25 — faqat O'Z filialida tikiladigan ishlar. Boshqa filial
 *    navbatini ko'rish ustaga kerak emas va chalkashtiradi.
 */
async function navbat(filialId: number): Promise<readonly NavbatQatori[]> {
  return ulanishOl()<NavbatQatori[]>`
    SELECT p.id AS pozitsiya_id, b.raqam, p.tartib,
           mt.nom AS tur, p.eni_sm, p.boyi_sm,
           p.muddat::text AS muddat,
           (SELECT string_agg(ms.nom || ': ' || m.nom, ' · ' ORDER BY ms.tartib)
              FROM pozitsiya_material pm
              JOIN mahsulot_slot ms ON ms.id = pm.slot_id
              JOIN material m       ON m.id = pm.material_id
             WHERE pm.pozitsiya_id = p.id) AS matolar,
           (SELECT string_agg(m.nom, ' · ' ORDER BY m.nom)
              FROM pozitsiya_aksessuar pa
              JOIN material m ON m.id = pa.material_id
             WHERE pa.pozitsiya_id = p.id) AS aksessuarlar
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b       ON b.id = p.buyurtma_id
    JOIN mahsulot_tur mt  ON mt.id = p.mahsulot_tur_id
    WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
      AND p.holat IN ('TASDIQLANGAN', 'FILIALGA_YUBORILDI')
      AND p.usta_id IS NULL
    ORDER BY p.muddat NULLS LAST, b.raqam, p.tartib
    LIMIT 20`;
}

function navbatMatni(q: NavbatQatori): string {
  const qatorlar = [
    `*${q.raqam}* · poz. ${String(q.tartib)} — ${q.tur}`,
    `📐 ${String(q.eni_sm)} × ${String(q.boyi_sm)} sm`,
  ];
  if (q.matolar !== null) qatorlar.push(`🧵 ${q.matolar}`);
  if (q.aksessuarlar !== null) qatorlar.push(`🎀 ${q.aksessuarlar}`);
  if (q.muddat !== null) qatorlar.push(`📅 Muddat: ${q.muddat}`);
  return qatorlar.join('\n');
}

export async function navbatniKorsat(
  ctx: BotKontekst,
  filialId: number,
): Promise<void> {
  const qatorlar = await navbat(filialId);

  if (qatorlar.length === 0) {
    await ctx.reply(MATN.usta.navbatBosh, {
      reply_markup: ustaMenyusi().reply_markup,
    });
    return;
  }

  await ctx.reply('🏭 *NAVBAT*', { parse_mode: 'Markdown' });

  for (const q of qatorlar) {
    await ctx.reply(navbatMatni(q), {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        Markup.button.callback(
          MATN.usta.ishniOl,
          `ish_ol:${String(q.pozitsiya_id)}`,
        ),
      ]).reply_markup,
    });
  }
}

// ─── 13.8 · Ishga olaman ──────────────────────────────────────────────────

/**
 * TZ 13.8 — «Ikki usta bir vaqtda bossa — birinchisi oladi,
 * ikkinchisiga *"Bu ish allaqachon olingan"* (8.5).»
 *
 * ⚠️ Poyga BAZADA hal qilinadi (`ishniOl` qulflaydi), bu yerda emas.
 *    Bot faqat xabarni chiroyli qilib beradi.
 *
 * ⚠️ 10.12 — stavka topilmasa ish baribir olinadi, haq 0 bo'ladi.
 */
export async function ishniOlish(
  ctx: BotKontekst,
  pozitsiyaId: number,
  ustaId: number,
  telegramId: number,
): Promise<void> {
  const sql = ulanishOl();
  const stavka = await pozitsiyaStavkasi(sql, pozitsiyaId, ustaId);

  const { natija, takrormi } = await birMartaBajar(
    sql,
    amalKaliti('ish_ol', telegramId, pozitsiyaId),
    () => ishniOl(sql, pozitsiyaId, ustaId, stavka.qiymat, stavka.birlik),
  );

  if (takrormi || !natija.olindi) {
    await ctx.reply(TAKROR.ishniOl);
    return;
  }

  await ctx.reply(
    stavka.topildimi
      ? '✅ Ish sizga biriktirildi.'
      : '✅ Ish sizga biriktirildi.\n\n⚠️ Bu turga stavka belgilanmagan — haq keyin qo‘shiladi (10.12).',
    { reply_markup: ustaMenyusi().reply_markup },
  );
}

// ─── 13.8 · Mening ishlarim ───────────────────────────────────────────────

export async function ishlarimniKorsat(
  ctx: BotKontekst,
  ustaId: number,
): Promise<void> {
  const q = await ulanishOl()<
    {
      pozitsiya_id: number;
      raqam: string;
      tartib: number;
      tur: string;
      eni_sm: number;
      boyi_sm: number;
    }[]
  >`
    SELECT p.id AS pozitsiya_id, b.raqam, p.tartib, mt.nom AS tur,
           p.eni_sm, p.boyi_sm
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b      ON b.id = p.buyurtma_id
    JOIN mahsulot_tur mt ON mt.id = p.mahsulot_tur_id
    WHERE p.usta_id = ${ustaId} AND p.holat = 'ISHLAB_CHIQARILMOQDA'
    ORDER BY b.raqam, p.tartib`;

  if (q.length === 0) {
    await ctx.reply(MATN.usta.ishlarimBosh, {
      reply_markup: ustaMenyusi().reply_markup,
    });
    return;
  }

  for (const i of q) {
    await ctx.reply(
      `*${i.raqam}* · poz. ${String(i.tartib)} — ${i.tur}\n` +
        `📐 ${String(i.eni_sm)} × ${String(i.boyi_sm)} sm`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              MATN.usta.tugatdim,
              `ish_tugat:${String(i.pozitsiya_id)}`,
            ),
          ],
          [
            Markup.button.callback(
              MATN.usta.qaytaKesish,
              `ish_brak:${String(i.pozitsiya_id)}`,
            ),
          ],
        ]).reply_markup,
      },
    );
  }
}

// ─── 13.8 · Balans ────────────────────────────────────────────────────────

/**
 * TZ 13.8 — «**Ushlanmalar ham ko'rinadi.** Yashirilsa usta baribir
 * farqni sezadi va ishonch yo'qoladi.»
 *
 * ⚠️ 2.2-invariant — balans saqlanmaydi, `xodim_harakat` dan
 *    `SUM()` bilan chiqadi.
 */
export async function ustaBalansi(
  ctx: BotKontekst,
  ustaId: number,
): Promise<void> {
  const q = await ulanishOl()<{ turi: string; summa: string }[]>`
    SELECT turi, SUM(summa)::text AS summa
    FROM xodim_harakat
    WHERE xodim_id = ${ustaId} AND valyuta = 'SOM'
    GROUP BY turi`;

  const olish = (turi: string): number =>
    Number(q.find((x) => x.turi === turi)?.summa ?? 0);

  const haq = olish('ISH_HAQI');
  const olingan = Math.abs(olish('TOLOV')) + Math.abs(olish('AVANS'));
  const ushlangan = Math.abs(olish('USHLANMA')) + Math.abs(olish('JARIMA'));

  const jami = q.reduce((s, x) => s + Number(x.summa), 0);

  const qatorlar = [
    '💰 *BALANSIM*',
    '',
    `Hisoblangan haq: ${pulKorsat(som(haq.toFixed(2)))}`,
    `Olganim: ${pulKorsat(som(olingan.toFixed(2)))}`,
  ];

  if (ushlangan > 0) {
    qatorlar.push(`Ushlangan: ${pulKorsat(som(ushlangan.toFixed(2)))}`);
  }

  qatorlar.push('', `🟢 Qolgan: ${pulKorsat(som(jami.toFixed(2)))}`);

  await ctx.reply(qatorlar.join('\n'), {
    parse_mode: 'Markdown',
    reply_markup: ustaMenyusi().reply_markup,
  });
}

// ─── Panelni ulash ────────────────────────────────────────────────────────

export interface UstaKimligi {
  readonly xodimId: number;
  readonly filialId: number;
}

export function ustaPaneliniUla(
  bot: Telegraf,
  ustaOl: (ctx: BotKontekst) => Promise<UstaKimligi | null>,
): void {
  bot.hears(MATN.usta.navbat, (ctx) =>
    xavfsiz(ctx, async () => {
      const u = await ustaOl(ctx);
      if (u === null) return;
      await navbatniKorsat(ctx, u.filialId);
    }),
  );

  bot.hears(MATN.usta.ishlarim, (ctx) =>
    xavfsiz(ctx, async () => {
      const u = await ustaOl(ctx);
      if (u === null) return;
      await ishlarimniKorsat(ctx, u.xodimId);
    }),
  );

  bot.hears(MATN.usta.balans, (ctx) =>
    xavfsiz(ctx, async () => {
      const u = await ustaOl(ctx);
      if (u === null) return;
      await ustaBalansi(ctx, u.xodimId);
    }),
  );

  bot.action(/^ish_ol:(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const u = await ustaOl(ctx);
      const tg = ctx.from?.id;
      if (u === null || tg === undefined) return;

      const pozitsiyaId = Number(ctx.match[1]);
      await ishniOlish(ctx, pozitsiyaId, u.xodimId, tg);
    }),
  );

  /**
   * TZ 13.8 — «Qayta kesish so'rovi: sabab kiritiladi (majburiy)».
   * Sabab keyingi xabarda keladi, shuning uchun sessiyaga yoziladi.
   */
  bot.action(/^ish_brak:(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const tg = ctx.from?.id;
      if (tg === undefined) return;

      await sessiyaYoz(
        ulanishOl(),
        tg,
        { qadam: 'IZOH', holat: { brakPozitsiyaId: Number(ctx.match[1]) } },
        TIZIM_XODIM,
      );
      await ctx.reply(MATN.usta.sababSora);
    }),
  );
}

/**
 * Usta sabab yozganda chaqiriladi.
 *
 * ⚠️ 13.8 — «Material faqat admin tasdiqlaganda yechiladi — so'rov
 *    paytida emas (12.4).» Bu funksiya faqat so'rov yaratadi.
 */
export async function brakSababiQabul(
  ctx: BotKontekst,
  ustaId: number,
  telegramId: number,
  sabab: string,
): Promise<boolean> {
  const sql = ulanishOl();
  const sessiya = await sessiyaOl(sql, telegramId);
  const pozitsiyaId = sessiya.holat.brakPozitsiyaId;

  if (typeof pozitsiyaId !== 'number') return false;

  /**
   * ⚠️ 8.17.2 — `sabab` bu yerda KOD (`OLCHAM_XATO` va boshqalar),
   *    ustaning yozgani esa IZOH. Botda usta erkin yozadi, shuning
   *    uchun kod `BOSHQA` bo'ladi va matn izohga tushadi. Admin
   *    saytda aniq sababni tanlaydi (8.17.3).
   */
  await qaytaKesishSora(
    sql,
    { pozitsiyaId, sabab: 'BOSHQA', izoh: sabab.trim(), rasmYol: null },
    ustaId,
  );
  await sessiyaYoz(sql, telegramId, { qadam: 'BOSH', holat: {} }, TIZIM_XODIM);

  await ctx.reply(MATN.usta.soruvKetdi, {
    reply_markup: ustaMenyusi().reply_markup,
  });
  return true;
}

/**
 * TZ 13.8 — «Tugatdim» → material yechiladi, ostatka yaratiladi, haq
 * hisoblanadi. Amal **atomar** (7.3).
 *
 * ⚠️ 7.6 — usta manbani va qolgan bo'lak o'lchamini TASDIQLAYDI.
 *    Shuning uchun kirim to'liq bo'lib keladi: bot uni suhbatda
 *    yig'adi (`bot/tugatish.ts`).
 *
 * ⚠️ 13.10 — tugma ikki marta bosilsa ikkinchi marta material
 *    YECHILMAYDI: kalit `amal_kaliti` da turadi.
 */
export async function ishniTugatish(
  ctx: BotKontekst,
  kirim: Parameters<typeof tugatdim>[1],
  chegaralar: Parameters<typeof tugatdim>[2],
  ustaId: number,
  telegramId: number,
): Promise<void> {
  const sql = ulanishOl();

  const { natija, takrormi } = await birMartaBajar(
    sql,
    amalKaliti('ish_tugat', telegramId, kirim.pozitsiyaId),
    () => tugatdim(sql, kirim, chegaralar, ustaId),
  );

  if (takrormi) {
    await ctx.reply(TAKROR.tugatdim, {
      reply_markup: ustaMenyusi().reply_markup,
    });
    return;
  }

  const qatorlar = ['✅ Ish tugatildi.'];
  if (natija.yangiOstatkaKod !== null) {
    qatorlar.push(`Qoldiq kesma: ${natija.yangiOstatkaKod}`);
  }
  if (natija.chiqindiKvM > 0) {
    qatorlar.push(`Chiqindi: ${natija.chiqindiKvM.toFixed(2)} kv.m`);
  }

  await ctx.reply(qatorlar.join('\n'), {
    reply_markup: ustaMenyusi().reply_markup,
  });
}
