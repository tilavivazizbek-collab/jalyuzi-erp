/**
 * lib/amal/bot.ts — TZ 13.1 · 13.2 · 13.4 · 13.10 · 13.11
 *
 * Bot tranzaksiyalari: kim ekanini aniqlash, ro'yxatdan o'tkazish,
 * suhbat holati, xabar navbati va takrorlanishdan himoya.
 *
 * ⚠️ 13.1 — «Bot hech qachon yagona interfeys emas.» Bu yerda bot
 *    uchun **maxsus** mantiq yozilmaydi: buyurtma `buyurtmaYarat`,
 *    ish `ishniOl`/`tugatdim` orqali o'tadi. Bot faqat ularni
 *    chaqiradi.
 */

import type postgres from 'postgres';
import { panelTanla, type BotPaneli } from '@/lib/domain/bot';
import type { TizimliRol } from '@/lib/ruxsat/tekshir';
import { BiznesXato } from '@/lib/xato';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

// ─── 13.1 · Kim bu ─────────────────────────────────────────────────────────

export interface BotKimligi {
  readonly panel: BotPaneli;
  readonly xodimId: number | null;
  readonly filialId: number | null;
  readonly mijozId: number | null;
  readonly rollar: readonly TizimliRol[];
}

/**
 * TZ 13.1 — «`/start` bosilganda Telegram ID xodimlar bazasida
 * tekshiriladi.»
 *
 * ⚠️ Avval XODIM qidiriladi: bir odam ham xodim, ham mijoz bo'lishi
 *    mumkin (usta o'ziga jalyuzi buyurtma qilsa). Shunda unga ishchi
 *    paneli ochiladi — u botga ish uchun kiradi.
 */
export async function botKimligi(
  soruvchi: Soruvchi,
  telegramId: number,
): Promise<BotKimligi> {
  const xodimlar = await soruvchi<
    { id: number; filial_id: number; rol_kod: string | null }[]
  >`
    SELECT x.id, x.filial_id, r.kod AS rol_kod
    FROM xodim x
    LEFT JOIN xodim_rol xr ON xr.xodim_id = x.id
    LEFT JOIN rol r        ON r.id = xr.rol_id AND r.faol = true
    WHERE x.telegram_id = ${telegramId} AND x.faol = true`;

  if (xodimlar[0] !== undefined) {
    const rollar = xodimlar
      .map((x) => x.rol_kod)
      .filter((k): k is TizimliRol => k !== null);

    return {
      panel: panelTanla(rollar),
      xodimId: xodimlar[0].id,
      filialId: xodimlar[0].filial_id,
      mijozId: null,
      rollar,
    };
  }

  const mijozlar = await soruvchi<{ id: number }[]>`
    SELECT id FROM mijoz WHERE telegram_id = ${telegramId} AND faol = true`;

  return {
    panel: 'MIJOZ',
    xodimId: null,
    filialId: null,
    mijozId: mijozlar[0]?.id ?? null,
    rollar: [],
  };
}

// ─── 13.2 · Mijoz ro'yxatdan o'tadi ───────────────────────────────────────

/**
 * TZ 13.2 — «Dublikat tekshiruvi **faqat telefon** bo'yicha ishlaydi.
 * Telefon topilsa — mavjud mijozga bog'lanadi, yangisi yaratilmaydi.»
 *
 * ⚠️ TZ 6.5 ism bo'yicha ham bloklaydi, botda bu qoida
 *    **qo'llanmaydi**: Telegram ismlari doim takrorlanadi («Aziz»,
 *    «Dilshod») va ikkinchi «Aziz» bazaga umuman tusha olmasdi.
 *
 * ⚠️ Telefon Telegram tugmasi orqali keladi — qo'lda yozilmaydi.
 *    Shu sabab raqam haqiqiy bo'ladi.
 */
export async function mijozniBogla(
  ulanish: postgres.Sql,
  kirim: {
    readonly telegramId: number;
    readonly ism: string;
    readonly telefon: string;
  },
  xodimId: number,
): Promise<{ mijozId: number; yangimi: boolean }> {
  const ism = kirim.ism.trim();
  const telefon = kirim.telefon.trim();

  if (ism === '') throw new BiznesXato('MIJOZ_ISM_KERAK');
  if (telefon === '') throw new BiznesXato('MIJOZ_TELEFON_KERAK');

  return ulanish.begin(async (tx) => {
    // 1 — shu Telegram allaqachon bog'langanmi
    const bogliq = await tx<{ id: number }[]>`
      SELECT id FROM mijoz WHERE telegram_id = ${kirim.telegramId}`;
    if (bogliq[0] !== undefined) {
      return { mijozId: bogliq[0].id, yangimi: false };
    }

    // 2 — telefon bo'yicha mavjud mijoz (13.2)
    const telefonli = await tx<{ id: number; telegram_id: number | null }[]>`
      SELECT id, telegram_id FROM mijoz WHERE telefon = ${telefon}
      FOR UPDATE`;

    const mavjud = telefonli[0];
    if (mavjud !== undefined) {
      /**
       * ⚠️ Boshqa Telegram allaqachon bog'langan bo'lsa ustidan
       *    yozilmaydi: bu telefon egasi almashgani yoki xato
       *    kiritilgani bo'lishi mumkin. Sotuvchi qo'lda hal qiladi.
       */
      if (mavjud.telegram_id !== null) {
        throw new BiznesXato('MIJOZ_TELEFON_BAND', telefon);
      }

      await tx`
        UPDATE mijoz
        SET telegram_id = ${kirim.telegramId},
            ozgartirildi = now(), ozgartirdi_id = ${xodimId}
        WHERE id = ${mavjud.id}`;

      await tx`
        INSERT INTO audit_jurnal (xodim_id, amal, obyekt_turi, obyekt_id,
                                  yangi_qiymat, izoh)
        VALUES (${xodimId}, 'BOT_BOGLANDI', 'mijoz', ${mavjud.id},
                ${tx.json({ telegramId: kirim.telegramId })},
                ${'Botdan telefon bo‘yicha topildi (13.2)'})`;

      return { mijozId: mavjud.id, yangimi: false };
    }

    // 3 — yangi mijoz. Ismni keyin sotuvchi to'g'rilaydi (13.2)
    const yangi = await tx<{ id: number }[]>`
      INSERT INTO mijoz (ism, telefon, telegram_id, yaratdi_id)
      VALUES (${ism}, ${telefon}, ${kirim.telegramId}, ${xodimId})
      RETURNING id`;

    const mijozId = yangi[0]?.id;
    if (mijozId === undefined) throw new BiznesXato('MIJOZ_SAQLANMADI');

    await tx`
      INSERT INTO audit_jurnal (xodim_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, 'YARATISH', 'mijoz', ${mijozId},
              ${tx.json({ ism, telefon, telegramId: kirim.telegramId })},
              ${'Botdan ro‘yxatdan o‘tdi (13.2)'})`;

    return { mijozId, yangimi: true };
  });
}

// ─── 13.4 · Suhbat holati ─────────────────────────────────────────────────

export interface BotSessiyasi {
  readonly qadam: string;
  readonly holat: Record<string, unknown>;
}

/** Sessiya yo'q bo'lsa BOSH qadam qaytadi — alohida yaratish shart emas. */
export async function sessiyaOl(
  soruvchi: Soruvchi,
  telegramId: number,
): Promise<BotSessiyasi> {
  const q = await soruvchi<{ qadam: string; holat: unknown }[]>`
    SELECT qadam, holat FROM bot_sessiya WHERE telegram_id = ${telegramId}`;

  const s = q[0];
  if (s === undefined) return { qadam: 'BOSH', holat: {} };

  return {
    qadam: s.qadam,
    holat:
      typeof s.holat === 'object' && s.holat !== null
        ? (s.holat as Record<string, unknown>)
        : {},
  };
}

/**
 * Sessiyani yozadi.
 *
 * ⚠️ `bot_sessiya` — joriy holat, harakat jadvali emas. Shuning uchun
 *    `UPDATE` ruxsat etiladi: har qadamda yangi qator yozilsa jadval
 *    ma'nosiz o'sardi va hech kimga kerak bo'lmasdi.
 */
export async function sessiyaYoz(
  soruvchi: Soruvchi,
  telegramId: number,
  sessiya: BotSessiyasi,
  xodimId: number,
): Promise<void> {
  await soruvchi`
    INSERT INTO bot_sessiya (telegram_id, qadam, holat, yaratdi_id)
    VALUES (${telegramId}, ${sessiya.qadam},
            ${soruvchi.json(sessiya.holat as never)}, ${xodimId})
    ON CONFLICT (telegram_id) DO UPDATE
    SET qadam = EXCLUDED.qadam, holat = EXCLUDED.holat,
        tegildi = now(), ozgartirildi = now(), ozgartirdi_id = ${xodimId}`;
}

/** 13.4 — «Bekor qilish» butun savatni tozalaydi. */
export async function sessiyaTozala(
  soruvchi: Soruvchi,
  telegramId: number,
  xodimId: number,
): Promise<void> {
  await sessiyaYoz(soruvchi, telegramId, { qadam: 'BOSH', holat: {} }, xodimId);
}

// ─── 13.11 · Xabar navbati ────────────────────────────────────────────────

/**
 * TZ 13.11 — xabar avval **yozib qo'yiladi**, keyin yuboriladi.
 *
 * ⚠️ Teskarisi bo'lsa Telegram javob bermay qolganda xabar yo'qolardi
 *    va hech kim bilmasdi. Yozuv qolgani uchun buyurtma kartochkasida
 *    qizil holatda ko'rinadi va qayta yuborish mumkin (6.7).
 *
 * ⚠️ 2.1-invariant — yuborish tranzaksiyani USHLAB TURMAYDI. Bu
 *    funksiya faqat navbatga qo'yadi; yuborish keyin, alohida.
 */
export async function xabarNavbatgaQoy(
  soruvchi: Soruvchi,
  kirim: {
    readonly telegramId: number;
    readonly matn: string;
    readonly xodimId?: number | null;
    readonly manbaTuri?: string | null;
    readonly manbaId?: number | null;
  },
  yaratdiId: number,
): Promise<{ xabarId: number }> {
  const q = await soruvchi<{ id: number }[]>`
    INSERT INTO bot_xabar (telegram_id, xodim_id, matn, manba_turi, manba_id,
                           yaratdi_id)
    VALUES (${kirim.telegramId}, ${kirim.xodimId ?? null}, ${kirim.matn},
            ${kirim.manbaTuri ?? null}, ${kirim.manbaId ?? null}, ${yaratdiId})
    RETURNING id`;

  const xabarId = q[0]?.id;
  if (xabarId === undefined) throw new BiznesXato('XABAR_SAQLANMADI');
  return { xabarId };
}

/** Yuborilgan deb belgilaydi. */
export async function xabarYuborildi(
  soruvchi: Soruvchi,
  xabarId: number,
): Promise<void> {
  await soruvchi`
    UPDATE bot_xabar
    SET holat = 'YUBORILDI', yuborildi = now(),
        urinishlar = urinishlar + 1
    WHERE id = ${xabarId}`;
}

/**
 * 13.11 — yetib bormadi. Sabab MAJBURIY: baza cheklovi ham shuni
 * talab qiladi, chunki sababsiz yozuv sotuvchiga hech narsa aytmaydi.
 */
export async function xabarYetmadi(
  soruvchi: Soruvchi,
  xabarId: number,
  sabab: string,
): Promise<void> {
  const tozalangan = sabab.trim() === '' ? 'Nomaʼlum sabab' : sabab.trim();

  await soruvchi`
    UPDATE bot_xabar
    SET holat = 'YETMADI', xato_sabab = ${tozalangan},
        urinishlar = urinishlar + 1
    WHERE id = ${xabarId}`;
}

// ─── 13.10 · Takrorlanishdan himoya ───────────────────────────────────────

/**
 * TZ 13.10 · 12.3 — «bir xil kalit ikkinchi marta kelsa saqlangan
 * natija qaytariladi».
 *
 * ⚠️ Bu **UI qulayligi emas, haqiqiy himoya**: Telegram bir xil
 *    xabarni qayta yuborishi mumkin va foydalanuvchi tugmani ikki
 *    marta bosadi. Kalitsiz ikkinchi bosish ikkinchi buyurtma
 *    yaratardi.
 *
 * ⚠️ Kalit AVVAL yoziladi — `INSERT ... ON CONFLICT DO NOTHING`.
 *    Qator qo'shilmasa demak amal allaqachon bajarilgan va saqlangan
 *    natija qaytariladi. Ikki bosish bir vaqtda kelsa ham ikkinchisi
 *    yozuvni ololmaydi.
 */
export async function birMartaBajar<T>(
  ulanish: postgres.Sql,
  kalit: string,
  amal: () => Promise<T>,
): Promise<{ natija: T; takrormi: boolean }> {
  const bor = await ulanish<{ natija: unknown }[]>`
    SELECT natija FROM amal_kaliti WHERE kalit = ${kalit}`;

  if (bor[0] !== undefined) {
    return { natija: bor[0].natija as T, takrormi: true };
  }

  const natija = await amal();

  /**
   * Amal bajarilgach kalit yoziladi. Poyga bo'lsa `DO NOTHING`
   * ikkinchisini jim o'tkazadi — lekin bu paytda amal ikki marta
   * bajarilgan bo'lardi, shuning uchun ATOMARLIK amalning o'zida
   * bo'lishi shart (masalan `band_bitta` indeksi, 8.5).
   */
  await ulanish`
    INSERT INTO amal_kaliti (kalit, natija)
    VALUES (${kalit}, ${ulanish.json(natija as never)})
    ON CONFLICT (kalit) DO NOTHING`;

  return { natija, takrormi: false };
}
