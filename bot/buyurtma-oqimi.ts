/**
 * bot/buyurtma-oqimi.ts — TZ 13.4 · 13.5 · 3.9
 *
 * Mijoz botidagi buyurtma oqimining Telegram tomoni. Mantiq
 * `lib/domain/bot-oqim.ts` da — bu yerda faqat tugma va xabar.
 *
 * ⚠️ 13.4 — «Oqim konstruktordan quriladi, qat'iy emas.» Shuning
 *    uchun ro'yxatlar `lib/amal/katalog.ts` dan keladi va yangi
 *    mahsulot turi botda avtomatik paydo bo'ladi.
 *
 * ⚠️ 13.5 — «**Aniq narx** ko'rsatiladi, taxminiy emas» va mijozning
 *    offseti qo'llanadi (6.3).
 */

import { Markup, type Telegraf } from 'telegraf';
import { ulanishOl } from '@/lib/db';
import { sotuvTurlari, type SotuvTuri } from '@/lib/amal/katalog';
import { buyurtmaRaqamiOl, buyurtmaYarat } from '@/lib/amal/buyurtma';
import { birMartaBajar, sessiyaOl, sessiyaYoz } from '@/lib/amal/bot';
import { amalKaliti } from '@/lib/domain/bot';
import {
  BOSH_QORALAMA,
  aksessuarAlmash,
  bekorQil,
  izohQoy,
  joriySlot,
  keyingiQadam,
  matoTanla,
  olchamQoy,
  orqaga,
  qoralamaOqi,
  savatgaQosh,
  turTanla,
  type PozitsiyaQoralama,
  type Qoralama,
} from '@/lib/domain/bot-oqim';
import { pozitsiyaNarxiniHisobla } from '@/lib/domain/pozitsiya-narxi';
import { mijozOffseti } from '@/lib/domain/mijoz';
import type { SarflashBirligi } from '@/lib/domain/birlik';
import { kesimOlchami } from '@/lib/domain/kesish';
import { pulKorsat, som } from '@/lib/domain/pul';
import { MATN, TAKROR } from './matn';
import { xavfsiz, type BotKontekst } from './yordamchi';
import { mijozMenyusi } from './mijoz';

const TIZIM_XODIM = 1;

// ─── Sessiya ──────────────────────────────────────────────────────────────

async function qoralamaOl(telegramId: number): Promise<Qoralama> {
  const s = await sessiyaOl(ulanishOl(), telegramId);
  return qoralamaOqi(s.holat.qoralama);
}

async function qoralamaYoz(telegramId: number, q: Qoralama): Promise<void> {
  await sessiyaYoz(
    ulanishOl(),
    telegramId,
    { qadam: keyingiQadam(q), holat: { qoralama: q } },
    TIZIM_XODIM,
  );
}

// ─── Mijoz konteksti ──────────────────────────────────────────────────────

interface MijozKonteksti {
  readonly mijozId: number;
  readonly filialId: number;
  readonly tikuvchiFilialId: number;
  readonly offset: ReturnType<typeof mijozOffseti>;
}

/**
 * TZ 20.4 — buyurtmada sotgan va tikkan filial bor. Botda sotuvchi
 * yo'q, shuning uchun **bosh filial** sotgan hisoblanadi (P-38).
 *
 * ⚠️ Tikuvchi filial bosh filialning sozlamasidan olinadi: u o'zi
 *    tikmasa `standart_ishlab_chiqaruvchi_id` ishlaydi (20.4.1).
 */
async function mijozKontekstiOl(mijozId: number): Promise<MijozKonteksti | null> {
  const sql = ulanishOl();

  const f = await sql<
    { id: number; ishlab_chiqaradi: boolean; standart: number | null }[]
  >`
    SELECT id, ishlab_chiqaradi, standart_ishlab_chiqaruvchi_id AS standart
    FROM filial WHERE bosh = true AND faol = true LIMIT 1`;

  const filial = f[0];
  if (filial === undefined) return null;

  const m = await sql<
    { offset_turi: string | null; offset_qiymat: string | null }[]
  >`
    SELECT offset_turi, offset_qiymat FROM mijoz WHERE id = ${mijozId}`;

  return {
    mijozId,
    filialId: filial.id,
    tikuvchiFilialId: filial.ishlab_chiqaradi
      ? filial.id
      : (filial.standart ?? filial.id),
    offset: mijozOffseti({
      offsetTuri: m[0]?.offset_turi ?? null,
      offsetQiymat: m[0]?.offset_qiymat ?? null,
    }),
  };
}

// ─── Narx (13.5) ──────────────────────────────────────────────────────────

/**
 * TZ 13.5 — pozitsiya narxi. Hisob `lib/domain/pozitsiya-narxi.ts` da,
 * ya'ni sayt bilan AYNAN bir xil (§2.2).
 */
function pozitsiyaHisobi(
  p: PozitsiyaQoralama,
  tur: SotuvTuri,
  offset: MijozKonteksti['offset'],
) {
  const slotlar = p.slotlar.map((s) => {
    const slot = tur.slotlar.find((x) => x.id === s.slotId);
    const material = slot?.materiallar.find((m) => m.id === s.materialId);
    return {
      nom: slot?.nom ?? '',
      formula: slot?.formula ?? '0',
      sarflashBirligi: (material?.sarflashBirligi ?? 'KV_M') as SarflashBirligi,
      narx: material?.narx ?? null,
    };
  });

  // Majburiylar avtomatik, ixtiyoriylardan tanlanganlari (13.4)
  const aksessuarlar = tur.aksessuarlar
    .filter((a) => a.majburiy || p.aksessuarlar.includes(a.materialId))
    .map((a) => ({
      nom: a.nom,
      formula: a.formula,
      sarflashBirligi: a.sarflashBirligi as SarflashBirligi,
      narx: a.narx,
      majburiy: a.majburiy,
    }));

  const parametrlar: Record<string, number> = {};
  for (const par of tur.parametrlar) {
    const q = Number(par.standartQiymat ?? '');
    if (Number.isFinite(q)) parametrlar[par.kod] = q;
  }

  return pozitsiyaNarxiniHisobla({
    eniSm: p.eniSm ?? 0,
    boyiSm: p.boyiSm ?? 0,
    soni: 1,
    parametrlar,
    slotlar,
    aksessuarlar,
    offset,
    xizmatHaqi: tur.xizmatHaqi,
  });
}

/** Faqat jami kerak bo'lganda. */
function pozitsiyaNarxi(
  p: PozitsiyaQoralama,
  tur: SotuvTuri,
  offset: MijozKonteksti['offset'],
): string {
  return pozitsiyaHisobi(p, tur, offset).jami;
}

// ─── Qadamni ko'rsatish ───────────────────────────────────────────────────

/**
 * Joriy qadamni chizadi. Bitta joyda turgani muhim: har o'zgarishdan
 * keyin shu funksiya chaqiriladi va foydalanuvchi qayerdaligini
 * doim ko'radi.
 */
export async function qadamniKorsat(
  ctx: BotKontekst,
  q: Qoralama,
  turlar: readonly SotuvTuri[],
  kontekst: MijozKonteksti,
): Promise<void> {
  const qadam = keyingiQadam(q);

  switch (qadam) {
    case 'TUR_TANLASH': {
      if (turlar.length === 0) {
        await ctx.reply(MATN.matoYoq, {
          reply_markup: mijozMenyusi().reply_markup,
        });
        return;
      }
      await ctx.reply(MATN.turTanla, {
        reply_markup: Markup.inlineKeyboard(
          turlar.map((t) => [
            Markup.button.callback(t.nom, `oq_tur:${String(t.id)}`),
          ]),
        ).reply_markup,
      });
      return;
    }

    case 'SLOT_MATO': {
      const slot = joriySlot(q);
      const tur = turlar.find((t) => t.id === q.joriy?.mahsulotTurId);
      const turSlot = tur?.slotlar.find((s) => s.id === slot?.slotId);

      // 13.4 — «Slotda faol mato qolmagan bo'lsa»
      if (turSlot === undefined || turSlot.materiallar.length === 0) {
        await ctx.reply(MATN.matoYoq, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback(MATN.boshqaTur, 'oq_bosh')],
          ]).reply_markup,
        });
        return;
      }

      await ctx.reply(MATN.matoTanla(turSlot.nom), {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          ...turSlot.materiallar.map((m) => [
            Markup.button.callback(
              m.narx === null
                ? m.nom
                : `${m.nom} — ${pulKorsat(som(m.narx))}`,
              `oq_mato:${String(turSlot.id)}:${String(m.id)}`,
            ),
          ]),
          [Markup.button.callback(MATN.orqaga, 'oq_orqaga')],
        ]).reply_markup,
      });
      return;
    }

    case 'ENI':
      await ctx.reply(MATN.eniSora, {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(MATN.orqaga, 'oq_orqaga')],
        ]).reply_markup,
      });
      return;

    case 'BOYI':
      await ctx.reply(MATN.boyiSora, {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(MATN.orqaga, 'oq_orqaga')],
        ]).reply_markup,
      });
      return;

    case 'AKSESSUAR': {
      const tur = turlar.find((t) => t.id === q.joriy?.mahsulotTurId);
      const ixtiyoriy = (tur?.aksessuarlar ?? []).filter((a) => !a.majburiy);

      // Ixtiyoriy aksessuar bo'lmasa qadam o'tkazib yuboriladi
      if (ixtiyoriy.length === 0) {
        await davomEt(ctx, izohQoy(q, ''), turlar, kontekst);
        return;
      }

      const tanlangan = q.joriy?.aksessuarlar ?? [];

      await ctx.reply('Qo‘shimcha aksessuar kerakmi?', {
        reply_markup: Markup.inlineKeyboard([
          ...ixtiyoriy.map((a) => [
            Markup.button.callback(
              `${tanlangan.includes(a.materialId) ? '✅' : '▫️'} ${a.nom}`,
              `oq_aks:${String(a.materialId)}`,
            ),
          ]),
          [Markup.button.callback(MATN.otkazish, 'oq_aks_tayyor')],
          [Markup.button.callback(MATN.orqaga, 'oq_orqaga')],
        ]).reply_markup,
      });
      return;
    }

    case 'IZOH':
      await ctx.reply(MATN.izohSora, {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(MATN.otkazish, 'oq_izoh_otkaz')],
        ]).reply_markup,
      });
      return;

    case 'SAVAT':
      await savatniKorsat(ctx, q, turlar, kontekst);
      return;
  }
}

/** Qoralamani saqlab, keyingi qadamni chizadi. */
async function davomEt(
  ctx: BotKontekst,
  q: Qoralama,
  turlar: readonly SotuvTuri[],
  kontekst: MijozKonteksti,
): Promise<void> {
  const tg = ctx.from?.id;
  if (tg === undefined) return;

  await qoralamaYoz(tg, q);
  await qadamniKorsat(ctx, q, turlar, kontekst);
}

// ─── 13.4, 7-qadam · Savat ────────────────────────────────────────────────

async function savatniKorsat(
  ctx: BotKontekst,
  q: Qoralama,
  turlar: readonly SotuvTuri[],
  kontekst: MijozKonteksti,
): Promise<void> {
  // Yig'ilgan pozitsiya bo'lsa avval savatga qo'shiladi
  const toliq = q.joriy === null ? q : savatgaQosh(q);

  if (toliq.savat.length === 0) {
    await ctx.reply(MATN.savatBosh, {
      reply_markup: mijozMenyusi().reply_markup,
    });
    return;
  }

  const qatorlar: string[] = ['🛒 *SAVAT*', ''];
  let jami = 0;

  toliq.savat.forEach((p, i) => {
    const tur = turlar.find((t) => t.id === p.mahsulotTurId);
    const narx = tur === undefined ? '0' : pozitsiyaNarxi(p, tur, kontekst.offset);
    jami += Number(narx);

    qatorlar.push(
      `${String(i + 1)}. ${p.turNomi} · ${String(p.eniSm)}×${String(p.boyiSm)} sm`,
      `   ${pulKorsat(som(narx))}`,
    );
  });

  qatorlar.push('', `*Jami: ${pulKorsat(som(jami.toFixed(2)))}*`);

  const tg = ctx.from?.id;
  if (tg !== undefined) await qoralamaYoz(tg, toliq);

  await ctx.reply(qatorlar.join('\n'), {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback(MATN.yanaQosh, 'oq_yana')],
      [Markup.button.callback(MATN.savatYubor, 'oq_yubor')],
      [Markup.button.callback(MATN.bekor, 'oq_bekor')],
    ]).reply_markup,
  });
}

// ─── Buyurtmani yuborish ──────────────────────────────────────────────────

/**
 * TZ 13.4, 7-qadam — savat buyurtmaga aylanadi.
 *
 * ⚠️ Q-12 — bot buyurtmasi «Tasdiq kutmoqda» bo'lib tushadi:
 *    `boshHolat('BOT')` shuni beradi. Sotuvchi tasdiqlaydi va
 *    narx o'zgarsa mijozga xabar ketadi (13.5).
 *
 * ⚠️ 13.10 — «Buyurtma yuborish» ikki marta bosilsa IKKINCHI
 *    buyurtma yaratilmaydi: kalit savat holatiga bog'lanadi.
 */
export async function savatniYubor(
  ctx: BotKontekst,
  q: Qoralama,
  turlar: readonly SotuvTuri[],
  kontekst: MijozKonteksti,
  telegramId: number,
): Promise<void> {
  if (q.savat.length === 0) {
    await ctx.reply(MATN.savatBosh, {
      reply_markup: mijozMenyusi().reply_markup,
    });
    return;
  }

  const sql = ulanishOl();

  const pozitsiyalar = q.savat.map((p) => {
    const tur = turlar.find((t) => t.id === p.mahsulotTurId);
    const hisob =
      tur === undefined
        ? null
        : pozitsiyaHisobi(p, tur, kontekst.offset);

    /**
     * ⚠️ Narx qatorlari va buyurtma kirimi AYNI hisobdan quriladi.
     * Alohida hisoblansa mijoz ko'rgan narx bilan bazaga tushgan
     * narx bir-biriga to'g'ri kelmasligi mumkin edi.
     */
    const slotQatorlari = (hisob?.qatorlar ?? []).filter((x) => x.matomi);
    const aksQatorlari = (hisob?.qatorlar ?? []).filter((x) => !x.matomi);

    const slotlar = p.slotlar
      .filter((s) => s.materialId !== null)
      .map((s, i) => {
        const qator = slotQatorlari[i];
        const miqdor = String(qator?.miqdor ?? 0);
        const birlik = qator?.sarflashBirligi ?? 'KV_M';

        return {
          slotId: s.slotId,
          materialId: s.materialId ?? 0,
          hisoblanganMiqdor: miqdor,
          tuzatilganMiqdor: null,
          birlik,
          // TZ 3.6 · 7.6 — band qilish HISOBLANGAN sarflash bo'yicha (P-24)
          kerak: birlik === 'KV_M' ? kesimOlchami(miqdor, p.boyiSm ?? 0) : null,
          narxSnapshot: qator?.birlikNarxi ?? '0',
        };
      });

    const aksessuarlar = (tur?.aksessuarlar ?? [])
      .filter((a) => a.majburiy || p.aksessuarlar.includes(a.materialId))
      .map((a, i) => {
        const qator = aksQatorlari[i];
        return {
          materialId: a.materialId,
          soni: String(qator?.miqdor ?? 0),
          birlik: (qator?.sarflashBirligi ?? 'DONA'),
          narxSnapshot: qator?.birlikNarxi ?? '0',
          // 13.4 — botda qo'lda son kiritilmaydi
          qoldaKiritildi: false,
        };
      });

    return {
      mahsulotTurId: p.mahsulotTurId,
      eniSm: p.eniSm ?? 0,
      boyiSm: p.boyiSm ?? 0,
      soni: 1,
      narxSnapshot: hisob?.jami ?? '0',
      chegirmaSumma: '0',
      xizmatHaqi: tur?.xizmatHaqi ?? '0',
      // TZ 4.10 — konstruktor holati QOTADI
      formulaSnapshot: {
        slotlar: tur?.slotlar.map((s) => ({ id: s.id, formula: s.formula })) ?? [],
        aksessuarlar:
          tur?.aksessuarlar.map((a) => ({
            materialId: a.materialId,
            formula: a.formula,
          })) ?? [],
      },
      slotlar,
      aksessuarlar,
    };
  });

  /**
   * ⚠️ Kalit savat MAZMUNIGA bog'lanadi: bir xil savat ikki marta
   *    yuborilsa ikkinchisi o'tmaydi, lekin mijoz keyin BOSHQA
   *    buyurtma bera olishi kerak.
   */
  const kalit = amalKaliti(
    `buyurtma:${JSON.stringify(q.savat).length.toString()}`,
    telegramId,
    q.savat.length,
  );

  const { natija, takrormi } = await birMartaBajar(sql, kalit, async () => {
    const raqam = await buyurtmaRaqamiOl(sql);
    return buyurtmaYarat(
      sql,
      {
        raqam,
        mijozId: kontekst.mijozId,
        sotganFilialId: kontekst.filialId,
        ishlabChiqaruvchiFilialId: kontekst.tikuvchiFilialId,
        manba: 'BOT',
        valyuta: 'SOM',
        kursSnapshot: null,
        tayyorlikSana: null,
        qarzgaKetadimi: true,
        pozitsiyalar,
      },
      TIZIM_XODIM,
    );
  });

  if (takrormi) {
    await ctx.reply(TAKROR.buyurtma(natija.raqam), {
      reply_markup: mijozMenyusi().reply_markup,
    });
    return;
  }

  await sessiyaYoz(sql, telegramId, { qadam: 'BOSH', holat: {} }, TIZIM_XODIM);

  await ctx.reply(
    `✅ Buyurtmangiz qabul qilindi: *${natija.raqam}*\n\n` +
      MATN.menyu.buyurtmalarim +
      ' bo‘limidan holatini kuzatishingiz mumkin.',
    { parse_mode: 'Markdown', reply_markup: mijozMenyusi().reply_markup },
  );
}

// ─── Ulash ────────────────────────────────────────────────────────────────

export function oqimniUla(
  bot: Telegraf,
  mijozIdOl: (ctx: BotKontekst) => Promise<number | null>,
): void {
  /** Har chaqiruvda kerak bo'ladigan uchlik. */
  async function tayyorla(ctx: BotKontekst): Promise<{
    tg: number;
    q: Qoralama;
    turlar: readonly SotuvTuri[];
    kontekst: MijozKonteksti;
  } | null> {
    const tg = ctx.from?.id;
    const mijozId = await mijozIdOl(ctx);
    if (tg === undefined || mijozId === null) return null;

    const kontekst = await mijozKontekstiOl(mijozId);
    if (kontekst === null) return null;

    return {
      tg,
      q: await qoralamaOl(tg),
      turlar: await sotuvTurlari(kontekst.filialId),
      kontekst,
    };
  }

  bot.hears(MATN.menyu.buyurtma, (ctx) =>
    xavfsiz(ctx, async () => {
      const t = await tayyorla(ctx);
      if (t === null) return;
      await davomEt(ctx, BOSH_QORALAMA, t.turlar, t.kontekst);
    }),
  );

  bot.action(/^oq_tur:(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;

      const turId = Number(ctx.match[1]);
      const tur = t.turlar.find((x) => x.id === turId);
      if (tur === undefined) return;

      await davomEt(
        ctx,
        turTanla(
          t.q,
          { id: tur.id, nom: tur.nom },
          tur.slotlar.map((s) => ({ id: s.id, nom: s.nom })),
        ),
        t.turlar,
        t.kontekst,
      );
    }),
  );

  bot.action(/^oq_mato:(\d+):(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;

      await davomEt(
        ctx,
        matoTanla(t.q, Number(ctx.match[1]), Number(ctx.match[2])),
        t.turlar,
        t.kontekst,
      );
    }),
  );

  bot.action(/^oq_aks:(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;

      await davomEt(
        ctx,
        aksessuarAlmash(t.q, Number(ctx.match[1])),
        t.turlar,
        t.kontekst,
      );
    }),
  );

  bot.action('oq_aks_tayyor', (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;
      await davomEt(ctx, izohQoy(t.q, ''), t.turlar, t.kontekst);
    }),
  );

  bot.action('oq_izoh_otkaz', (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;
      await davomEt(ctx, izohQoy(t.q, ''), t.turlar, t.kontekst);
    }),
  );

  bot.action('oq_orqaga', (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;
      await davomEt(ctx, orqaga(t.q), t.turlar, t.kontekst);
    }),
  );

  bot.action('oq_bosh', (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;
      await davomEt(ctx, { ...t.q, joriy: null }, t.turlar, t.kontekst);
    }),
  );

  bot.action('oq_yana', (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;
      // Savat saqlanadi, yangi pozitsiya boshlanadi
      await davomEt(ctx, { ...t.q, joriy: null }, t.turlar, t.kontekst);
    }),
  );

  bot.action('oq_bekor', (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const tg = ctx.from?.id;
      if (tg === undefined) return;

      await qoralamaYoz(tg, bekorQil());
      await ctx.reply(MATN.bekorQilindi, {
        reply_markup: mijozMenyusi().reply_markup,
      });
    }),
  );

  bot.action('oq_yubor', (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const t = await tayyorla(ctx);
      if (t === null) return;
      await savatniYubor(ctx, t.q, t.turlar, t.kontekst, t.tg);
    }),
  );
}

/**
 * Erkin matn — o'lcham yoki izoh.
 *
 * `true` qaytsa xabar oqimga tegishli va boshqa hech kim
 * ishlatmasligi kerak.
 */
export async function oqimMatniniQabulQil(
  ctx: BotKontekst,
  telegramId: number,
  matn: string,
  mijozId: number,
): Promise<boolean> {
  const q = await qoralamaOl(telegramId);
  const qadam = keyingiQadam(q);

  if (qadam !== 'ENI' && qadam !== 'BOYI' && qadam !== 'IZOH') return false;

  const kontekst = await mijozKontekstiOl(mijozId);
  if (kontekst === null) return false;

  const turlar = await sotuvTurlari(kontekst.filialId);

  if (qadam === 'IZOH') {
    await davomEt(ctx, izohQoy(q, matn), turlar, kontekst);
    return true;
  }

  try {
    await davomEt(ctx, olchamQoy(q, matn, qadam), turlar, kontekst);
  } catch {
    // 13.4 — «Noto'g'ri o'lcham, qaytadan kiriting»
    await ctx.reply(MATN.olchamNotogri);
  }
  return true;
}
