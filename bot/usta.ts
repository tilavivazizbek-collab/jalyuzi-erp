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
import { ishniOl, tugatdim, type KesimKirimi } from '@/lib/amal/ish';
import { qaytaKesishSora } from '@/lib/amal/qayta-kesish';
import { pozitsiyaStavkasi } from '@/lib/amal/stavka';
import { birMartaBajar, sessiyaOl, sessiyaYoz } from '@/lib/amal/bot';
import { amalKaliti, qoldiqOqi, qoldiqYaroqlimi, tasdiqmi } from '@/lib/domain/bot';
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
/**
 * ⚠️ EKSPORT QILINGAN — `test/integratsiya/ekran-sorovlari.test.ts`
 *    uni haqiqiy bazada chaqiradi.
 *
 *    2026-09-03: bu so'rov uchta mavjud bo'lmagan ustunga murojaat
 *    qilardi va usta «Umumiy navbat» ni bosgan HAR SAFAR yiqilardi.
 *    Hech qanday test uni ko'rmasdi: `tsc` SQL ni o'qimaydi, ekran
 *    so'rovlari testi esa faqat `app/` ni qamrardi. Endi bot
 *    so'rovlari ham o'sha testda.
 */
export async function navbat(filialId: number): Promise<readonly NavbatQatori[]> {
  return ulanishOl()<NavbatQatori[]>`
    /*
     * 2026-09-03 — bu so'rov MAVJUD BO'LMAGAN uchta ustunga murojaat
     * qilardi va usta "Umumiy navbat" ni bosganda har safar yiqilardi:
     *
     *   p.muddat        -> muddat buyurtma.tayyorlik_sana da (3.13)
     *   pm.pozitsiya_id -> pozitsiya_material.buyurtma_pozitsiya_id
     *   pa.pozitsiya_id -> pozitsiya_aksessuar.buyurtma_pozitsiya_id
     *
     * tsc SQL ni ko'rmaydi (QOIDALAR 7-bo'lim), ekran-sorovlari testi
     * esa faqat app dagi malumot.ts fayllarini qamraydi — shuning uchun
     * xato faqat botni ochgan usta oldida chiqardi.
     */
    SELECT p.id AS pozitsiya_id, b.raqam, p.tartib,
           mt.nom AS tur, p.eni_sm, p.boyi_sm,
           b.tayyorlik_sana::text AS muddat,
           (SELECT string_agg(ms.nom || ': ' || m.nom, ' · ' ORDER BY ms.tartib)
              FROM pozitsiya_material pm
              JOIN mahsulot_slot ms ON ms.id = pm.slot_id
              JOIN material m       ON m.id = pm.material_id
             WHERE pm.buyurtma_pozitsiya_id = p.id) AS matolar,
           (SELECT string_agg(m.nom, ' · ' ORDER BY m.nom)
              FROM pozitsiya_aksessuar pa
              JOIN material m ON m.id = pa.material_id
             WHERE pa.buyurtma_pozitsiya_id = p.id) AS aksessuarlar
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b       ON b.id = p.buyurtma_id
    JOIN mahsulot_tur mt  ON mt.id = p.mahsulot_tur_id
    WHERE b.ishlab_chiqaruvchi_filial_id = ${filialId}
      AND p.holat IN ('TASDIQLANGAN', 'FILIALGA_YUBORILDI')
      AND p.usta_id IS NULL
    ORDER BY b.tayyorlik_sana NULLS LAST, b.raqam, p.tartib
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

// ─── 13.8 · Tugatganlarim ─────────────────────────────────────────────────

/**
 * TZ 13.8 — «Tugatganlarim: tarix.»
 *
 * ⚠️ Narx KO'RSATILMAYDI (13.8) — faqat ish va uning haqi. Usta
 *    mahsulot qanchaga sotilganini bilmaydi.
 */
export async function tugatganlarimniKorsat(
  ctx: BotKontekst,
  ustaId: number,
): Promise<void> {
  const q = await ulanishOl()<
    {
      raqam: string;
      tartib: number;
      tur: string;
      sana: Date | null;
      haq: string | null;
    }[]
  >`
    SELECT b.raqam, p.tartib, mt.nom AS tur,
           (SELECT MAX(a.sana) FROM audit_jurnal a
             WHERE a.obyekt_turi = 'buyurtma_pozitsiya'
               AND a.obyekt_id = p.id AND a.amal = 'TUGATDIM') AS sana,
           (SELECT SUM(h.summa)::text FROM xodim_harakat h
             WHERE h.manba_turi = 'buyurtma_pozitsiya'
               AND h.manba_id = p.id AND h.turi = 'HAQ') AS haq
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b      ON b.id = p.buyurtma_id
    JOIN mahsulot_tur mt ON mt.id = p.mahsulot_tur_id
    WHERE p.usta_id = ${ustaId}
      AND p.holat NOT IN ('TASDIQLANGAN','FILIALGA_YUBORILDI','ISHLAB_CHIQARILMOQDA')
    ORDER BY p.ozgartirildi DESC NULLS LAST
    LIMIT 15`;

  if (q.length === 0) {
    await ctx.reply('Hali tugatilgan ish yo‘q.', {
      reply_markup: ustaMenyusi().reply_markup,
    });
    return;
  }

  const qatorlar = q.map((i) => {
    const haq =
      i.haq === null ? '' : ` · ${pulKorsat(som(i.haq))}`;
    const sana =
      i.sana === null ? '' : ` · ${new Intl.DateTimeFormat('uz-UZ').format(i.sana)}`;
    return `${i.raqam} · poz. ${String(i.tartib)} — ${i.tur}${haq}${sana}`;
  });

  await ctx.reply(['✔️ *TUGATGANLARIM*', '', ...qatorlar].join('\n'), {
    parse_mode: 'Markdown',
    reply_markup: ustaMenyusi().reply_markup,
  });
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

  /**
   * ⚠️ 2026-09-03 — bu yerda 'ISH_HAQI' qidirilardi va usta
   *    «Hisoblangan haq: 0» ni ko'rardi.
   *
   *    'ISH_HAQI' — bu XARAJAT moddasi (12.1), xodim harakati emas.
   *    `xodim_harakat.turi` da haq 'HAQ' bo'lib yotadi (10.4), qayta
   *    kesishda bekor qilingani esa 'HAQ_BEKOR' bo'lib MANFIY
   *    yoziladi (Q-15) — shuning uchun u shu yerda qo'shiladi.
   */
  const haq = olish('HAQ') + olish('HAQ_BEKOR');
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

// ─── 13.8 · «Tugatdim» suhbati ────────────────────────────────────────────

/**
 * ⚠️ NEGA SUHBAT KERAK
 *
 *    «Tugatdim» bitta tugma emas: TZ 7.6 bo'yicha usta HAR MATO
 *    uchun qolgan bo'lak o'lchamini aytishi kerak. Rollo da ikki
 *    mato, Dikke da uchta — har biri o'z bo'lagidan kesiladi.
 *
 *    Shuning uchun tugma bosilganda savol boshlanadi va javoblar
 *    sessiyada yig'iladi. Hammasi yig'ilgach BITTA tranzaksiyada
 *    ombordan yechiladi (2.1-invariant).
 *
 * ⚠️ 2026-09-03 gacha bu tugma UMUMAN ISHLAMASDI: `ish_tugat`
 *    uchun `bot.action` yozilmagan edi. Usta bosardi — hech narsa
 *    bo'lmasdi.
 */

/** Sessiyada saqlanadigan bitta mato. */
interface TugatilayotganMato {
  readonly bandId: number;
  readonly nom: string;
  readonly kod: string;
  /** Band qilingan bo'lak turi — manba shundan olinadi (7.6) */
  readonly turi: string;
  readonly eniM: number;
  readonly boyiM: number;
}

interface TugatdimHolati {
  readonly pozitsiyaId: number;
  readonly matolar: readonly TugatilayotganMato[];
  readonly joriy: number;
  readonly kesimlar: readonly KesimKirimi[];
}

/** Sessiyadagi JSON — turlar TEKSHIRILADI, ishonilmaydi. */
function tugatdimHolatiniOqi(xom: Record<string, unknown>): TugatdimHolati | null {
  const pozitsiyaId = xom.pozitsiyaId;
  const matolar = xom.matolar;
  const joriy = xom.joriy;
  const kesimlar = xom.kesimlar;

  if (typeof pozitsiyaId !== 'number' || !Array.isArray(matolar)) return null;
  if (typeof joriy !== 'number' || !Array.isArray(kesimlar)) return null;

  return {
    pozitsiyaId,
    matolar: matolar as readonly TugatilayotganMato[],
    joriy,
    kesimlar: kesimlar as readonly KesimKirimi[],
  };
}

/** Navbatdagi mato haqida savol. */
function qoldiqSavoli(m: TugatilayotganMato, tartib: number, jami: number): string {
  const raqam = jami > 1 ? ` (${String(tartib + 1)}/${String(jami)})` : '';
  return (
    `🧵 *${m.nom}*${raqam}\n` +
    `Bo‘lak: ${m.kod} · ${String(m.eniM)} × ${String(m.boyiM)} m\n\n` +
    `Qolgan bo‘lak o‘lchami?\n${MATN.usta.qoldiqNamuna}`
  );
}

/**
 * TZ 13.8 — «Tugatdim» bosilganda suhbat boshlanadi.
 *
 * ⚠️ Ruxsat SHU YERDA qayta tekshiriladi (§9.4): tugma ma'lumotini
 *    qo'lda yuborish mumkin, shuning uchun ish AYNAN shu ustada
 *    ekani so'rovda tasdiqlanadi.
 */
export async function tugatdimniBoshla(
  ctx: BotKontekst,
  ustaId: number,
  telegramId: number,
  pozitsiyaId: number,
): Promise<void> {
  const sql = ulanishOl();

  const p = await sql<{ id: number }[]>`
    SELECT id FROM buyurtma_pozitsiya
    WHERE id = ${pozitsiyaId} AND usta_id = ${ustaId}
      AND holat = 'ISHLAB_CHIQARILMOQDA'`;

  if (p[0] === undefined) {
    await ctx.reply(MATN.usta.ishSizdaEmas, {
      reply_markup: ustaMenyusi().reply_markup,
    });
    return;
  }

  const bandlar = await sql<
    {
      band_id: number;
      nom: string;
      kod: string;
      turi: string;
      eni_m: string | null;
      boyi_m: string | null;
    }[]
  >`
    SELECT bd.id AS band_id, m.nom, bo.kod, bo.turi,
           bo.eni_m::text, bo.boyi_m::text
    FROM band bd
    JOIN bolak bo   ON bo.id = bd.bolak_id
    JOIN material m ON m.id = bo.material_id
    WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId} AND bd.holat = 'FAOL'
    ORDER BY bd.id`;

  if (bandlar.length === 0) {
    await ctx.reply(MATN.usta.bandYoq, {
      reply_markup: ustaMenyusi().reply_markup,
    });
    return;
  }

  const matolar: TugatilayotganMato[] = bandlar.map((b) => ({
    bandId: b.band_id,
    nom: b.nom,
    kod: b.kod,
    turi: b.turi,
    eniM: Number(b.eni_m ?? 0),
    boyiM: Number(b.boyi_m ?? 0),
  }));

  await sessiyaYoz(
    sql,
    telegramId,
    {
      qadam: 'TUGATDIM',
      holat: { pozitsiyaId, matolar, joriy: 0, kesimlar: [] },
    },
    ustaId,
  );

  await ctx.reply(MATN.usta.tugatdimBoshlandi);
  await ctx.reply(qoldiqSavoli(matolar[0] as TugatilayotganMato, 0, matolar.length), {
    parse_mode: 'Markdown',
  });
}

/**
 * Usta o'lcham yozganda chaqiriladi.
 *
 * @returns qabul qilindimi — `false` bo'lsa matn boshqa oqimga o'tadi
 */
export async function tugatdimMatniniQabulQil(
  ctx: BotKontekst,
  ustaId: number,
  telegramId: number,
  matn: string,
): Promise<boolean> {
  const sql = ulanishOl();
  const sessiya = await sessiyaOl(sql, telegramId);
  if (sessiya.qadam !== 'TUGATDIM') return false;

  const h = tugatdimHolatiniOqi(sessiya.holat);
  if (h === null) {
    await sessiyaYoz(sql, telegramId, { qadam: 'BOSH', holat: {} }, ustaId);
    return false;
  }

  const mato = h.matolar[h.joriy];
  if (mato === undefined) {
    await sessiyaYoz(sql, telegramId, { qadam: 'BOSH', holat: {} }, ustaId);
    return false;
  }

  // §2.2 — o'qish qoidasi DOMAINDA, bu yerda takrorlanmaydi
  if (!qoldiqYaroqlimi(matn)) {
    await ctx.reply(MATN.usta.qoldiqNotogri);
    return true;
  }

  const kesimlar: KesimKirimi[] = [
    ...h.kesimlar,
    {
      bandId: mato.bandId,
      /**
       * ⚠️ Manba band qilingan bo'lakning TURIDAN olinadi.
       *
       *    Saytda usta uni ro'yxatdan tanlaydi, botda esa har mato
       *    uchun qo'shimcha savol suhbatni ikki barobar uzaytirardi.
       *    Bu qiymat ombor hisobiga TA'SIR QILMAYDI — u faqat
       *    jurnaldagi izohga tushadi.
       */
      manba: mato.turi === 'RULON' ? 'RULON' : 'OSTATKA',
      /**
       * ⚠️ Usta «ha» desa qoldiq YUBORILMAYDI — tizim uni o'zi
       *    hisoblaydi (7.4). O'lcham yozsa, u YON KESMA hisoblanadi
       *    va tizim taklifidan ustun turadi.
       *
       *    Botda ikki o'lchovni matn bilan so'rash suhbatni ikki
       *    barobar uzaytirardi va usta baribir xato yozardi.
       */
      qoldiqlar: tasdiqmi(matn)
        ? undefined
        : (() => {
            const q = qoldiqOqi(matn);
            return {
              manbaQoldiq: null,
              kesma: q.saqlansinmi ? { eniM: q.eniM, boyiM: q.boyiM } : null,
              kesmaSaqlansinmi: q.saqlansinmi,
            };
          })(),
    },
  ];

  const keyingi = h.joriy + 1;

  // Yana mato bormi — keyingisini so'raymiz
  if (keyingi < h.matolar.length) {
    await sessiyaYoz(
      sql,
      telegramId,
      {
        qadam: 'TUGATDIM',
        holat: { pozitsiyaId: h.pozitsiyaId, matolar: h.matolar, joriy: keyingi, kesimlar },
      },
      ustaId,
    );

    await ctx.reply(
      qoldiqSavoli(h.matolar[keyingi] as TugatilayotganMato, keyingi, h.matolar.length),
      { parse_mode: 'Markdown' },
    );
    return true;
  }

  // Hammasi yig'ildi — BITTA tranzaksiyada yechiladi
  await sessiyaYoz(sql, telegramId, { qadam: 'BOSH', holat: {} }, ustaId);

  await ishniTugatish(
    ctx,
    {
      pozitsiyaId: h.pozitsiyaId,
      kesimlar,
      /** Botda ogohlantirish ko'rsatilmaydi — 11.7.7 hisobotiga tushadi */
      ogohTasdiqlandi: false,
      izoh: null,
    },
    ustaId,
    telegramId,
  );

  return true;
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

  bot.hears(MATN.usta.tugatganlarim, (ctx) =>
    xavfsiz(ctx, async () => {
      const u = await ustaOl(ctx);
      if (u === null) return;
      await tugatganlarimniKorsat(ctx, u.xodimId);
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
   * TZ 13.8 — «Tugatdim».
   *
   * ⚠️ 2026-09-03 gacha bu ishlov beruvchi UMUMAN YO'Q edi: tugma
   *    chizilardi, bosilardi va hech narsa bo'lmasdi. Usta ishni
   *    faqat saytdan yakunlay olardi.
   *
   * Qolgan bo'lak o'lchami keyingi xabarlarda keladi (har mato
   * uchun bittadan), shuning uchun suhbat sessiyaga yoziladi.
   */
  bot.action(/^ish_tugat:(\d+)$/, (ctx) =>
    xavfsiz(ctx, async () => {
      await ctx.answerCbQuery();
      const u = await ustaOl(ctx);
      const tg = ctx.from?.id;
      if (u === null || tg === undefined) return;

      await tugatdimniBoshla(ctx, u.xodimId, tg, Number(ctx.match[1]));
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
 *    Shuning uchun kirim to'liq bo'lib keladi: HAR MATO uchun
 *    bittadan qator (`kesimlar`).
 *
 * ⚠️ Bu funksiya hozircha CHAQIRILMAYDI: botda `ish_tugat`
 *    tugmasi uchun `bot.action` yozilmagan (2026-09-03 auditi).
 *    Amal saytdan ishlaydi.
 *
 * ⚠️ 13.10 — tugma ikki marta bosilsa ikkinchi marta material
 *    YECHILMAYDI: kalit `amal_kaliti` da turadi.
 */
export async function ishniTugatish(
  ctx: BotKontekst,
  kirim: Parameters<typeof tugatdim>[1],
  ustaId: number,
  telegramId: number,
): Promise<void> {
  const sql = ulanishOl();

  const { natija, takrormi } = await birMartaBajar(
    sql,
    amalKaliti('ish_tugat', telegramId, kirim.pozitsiyaId),
    () => tugatdim(sql, kirim, ustaId),
  );

  if (takrormi) {
    await ctx.reply(TAKROR.tugatdim, {
      reply_markup: ustaMenyusi().reply_markup,
    });
    return;
  }

  const qatorlar = ['✅ Ish tugatildi.'];

  // Har mato alohida: Rollo da ikkita, Dikke da uchta qoldiq bo'ladi
  for (const k of natija.kesimlar) {
    if (k.yangiKodlar.length > 0) {
      qatorlar.push(`Qoldiq (${k.manbaBolakKod}): ${k.yangiKodlar.join(' · ')}`);
    }
    if (k.chiqindiKvM > 0) {
      qatorlar.push(`Chiqindi (${k.manbaBolakKod}): ${k.chiqindiKvM.toFixed(2)} kv.m`);
    }
  }

  await ctx.reply(qatorlar.join('\n'), {
    reply_markup: ustaMenyusi().reply_markup,
  });
}
