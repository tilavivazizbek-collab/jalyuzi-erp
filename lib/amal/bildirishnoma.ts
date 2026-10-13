/**
 * lib/amal/bildirishnoma.ts — TZ 13.9 · 13.6 · 13.11 · 2.1-invariant
 *
 * Bildirishnomani KIMGA yuborishni hal qiladi va navbatga qo'yadi.
 *
 * ⚠️ 2.1-invariant — xabar biznes tranzaksiyasining ICHIDA yoziladi,
 *    lekin YUBORILMAYDI. Yuborish keyin, alohida (`bot/yuboruvchi`).
 *    Aks holda Telegram sekin javob berganda buyurtma tranzaksiyasi
 *    qulflanib qolardi.
 *
 * ⚠️ Matn `lib/domain/bildirishnoma.ts` da — sof funksiya, sinaladi.
 *    Bu fayl faqat kimga borishini biladi.
 */

import type postgres from 'postgres';
import { xabarNavbatgaQoy } from './bot';
import type { AdminHodisasi } from '@/lib/domain/bildirishnoma';
import { VAQT_ZONASI } from '@/lib/domain/sana';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

/**
 * TZ 13.9 — bildirishnoma **adminlarga** boradi.
 *
 * ⚠️ Q-25 — faqat SHU filial adminlariga. Boshqa filialning qayta
 *    kesish so'rovi bu odamga tegishli emas va u hal qila olmaydi.
 *
 * ⚠️ Telegrami ulanmagan admin ro'yxatga tushmaydi: unga yuborib
 *    bo'lmaydi. Bu jim yo'qotish emas — sayt baribir hammasini
 *    ko'rsatadi (13.1: «bot yagona interfeys emas»).
 */
export async function filialAdminlari(
  soruvchi: Soruvchi,
  filialId: number,
): Promise<readonly { xodimId: number; telegramId: number }[]> {
  const q = await soruvchi<{ id: number; telegram_id: number }[]>`
    SELECT DISTINCT x.id, x.telegram_id
    FROM xodim x
    JOIN xodim_rol xr ON xr.xodim_id = x.id
    JOIN rol r        ON r.id = xr.rol_id
    WHERE x.filial_id = ${filialId}
      AND x.faol = true
      AND x.telegram_id IS NOT NULL
      AND r.kod = 'ADMIN'
      AND r.faol = true`;

  return q.map((x) => ({ xodimId: x.id, telegramId: x.telegram_id }));
}

/**
 * Adminlarga bildirishnoma yozadi.
 *
 * Nechta xabar navbatga tushgani qaytadi — nol bo'lsa demak bu
 * filialda Telegrami ulangan admin yo'q.
 */
export async function adminlarniOgohlantir(
  soruvchi: Soruvchi,
  kirim: {
    readonly filialId: number;
    readonly hodisa: AdminHodisasi;
    readonly matn: string;
    readonly manbaTuri?: string | null;
    readonly manbaId?: number | null;
  },
  yaratdiId: number,
): Promise<{ yozildi: number }> {
  const adminlar = await filialAdminlari(soruvchi, kirim.filialId);

  for (const a of adminlar) {
    await xabarNavbatgaQoy(
      soruvchi,
      {
        telegramId: a.telegramId,
        matn: kirim.matn,
        xodimId: a.xodimId,
        manbaTuri: kirim.manbaTuri ?? kirim.hodisa.toLowerCase(),
        manbaId: kirim.manbaId ?? null,
      },
      yaratdiId,
    );
  }

  return { yozildi: adminlar.length };
}

/** Rejalashtirilgan xabarlar shu xodim nomidan yoziladi (bot/mijoz.ts dagi kabi) */
const TIZIM_XODIM = 1;

/**
 * Rejalashtirilgan (cron) xabar — har filial adminlariga KUNIGA BIR MARTA.
 * LOYIHA §13, 2026-10-13.
 *
 * ⚠️ BITTA JOY: kechki hisobot, kam qoldiq, to'lov muddati, kechikkan
 *    buyurtmalar — hammasi shu orqali. Cron qayta chaqirsa (yoki bir
 *    necha marta) ikkinchi xabar ketmaydi: bugun shu `manbaTuri` bilan
 *    shu filialga yozilgan xabar bo'lsa, o'tkaziladi.
 * ⚠️ Telegrami ulangan admin yo'q filialda `matnYasa` CHAQIRILMAYDI —
 *    og'ir hisob behuda takrorlanmasin.
 * ⚠️ `matnYasa` `null` qaytarsa — aytadigan gap yo'q (kam qoldiq yo'q),
 *    xabar yozilmaydi.
 *
 * @param qoshimchaShart qaysi filiallar (masalan, kassa yopilish soati o'tgani)
 */
export async function kunigaBirMartaOgohlantir(
  sql: postgres.Sql,
  k: {
    readonly hodisa: AdminHodisasi;
    readonly manbaTuri: string;
    readonly bugun: string;
    readonly qoshimchaShart?: postgres.PendingQuery<postgres.Row[]>;
    readonly matnYasa: (filialId: number) => Promise<string | null>;
  },
): Promise<{ filiallar: number; xabarlar: number }> {
  const filiallar = await sql<{ id: number }[]>`
    SELECT f.id FROM filial f
    WHERE f.faol AND f.ochirildi IS NULL
      ${k.qoshimchaShart ?? sql``}
      AND NOT EXISTS (
        SELECT 1 FROM bot_xabar x
        WHERE x.manba_turi = ${k.manbaTuri} AND x.manba_id = f.id
          AND (x.yaratildi AT TIME ZONE ${VAQT_ZONASI})::date = ${k.bugun}::date)
    ORDER BY f.id`;

  let xabarlar = 0;
  let soni = 0;
  for (const f of filiallar) {
    if ((await filialAdminlari(sql, f.id)).length === 0) continue;
    const matn = await k.matnYasa(f.id);
    if (matn === null) continue;
    const { yozildi } = await adminlarniOgohlantir(
      sql,
      { filialId: f.id, hodisa: k.hodisa, matn, manbaTuri: k.manbaTuri, manbaId: f.id },
      TIZIM_XODIM,
    );
    xabarlar += yozildi;
    if (yozildi > 0) soni += 1;
  }
  return { filiallar: soni, xabarlar };
}

/**
 * TZ 13.6 — mijozga xabar.
 *
 * ⚠️ Telegrami yo'q mijozga xabar yozilmaydi — u botdan
 *    ro'yxatdan o'tmagan. Sotuvchi telefon qiladi (13.11).
 */
export async function mijozniOgohlantir(
  soruvchi: Soruvchi,
  kirim: {
    readonly mijozId: number;
    readonly matn: string;
    readonly manbaTuri?: string | null;
    readonly manbaId?: number | null;
  },
  yaratdiId: number,
): Promise<{ yozildi: boolean }> {
  const q = await soruvchi<{ telegram_id: number }[]>`
    SELECT telegram_id FROM mijoz
    WHERE id = ${kirim.mijozId} AND faol = true AND telegram_id IS NOT NULL`;

  const telegramId = q[0]?.telegram_id;
  if (telegramId === undefined) return { yozildi: false };

  await xabarNavbatgaQoy(
    soruvchi,
    {
      telegramId,
      matn: kirim.matn,
      xodimId: null,
      manbaTuri: kirim.manbaTuri ?? 'mijoz',
      manbaId: kirim.manbaId ?? kirim.mijozId,
    },
    yaratdiId,
  );

  return { yozildi: true };
}

/**
 * TZ 13.11 · 6.7 — yetib bormagan xabarlar.
 *
 * Buyurtma kartochkasidagi «Eslatmalar» tabi shu ro'yxatni
 * ko'rsatadi: sotuvchi qizil holatni ko'rib qo'ng'iroq qiladi.
 */
export async function yetmaganXabarlar(
  soruvchi: Soruvchi,
  kirim: { readonly manbaTuri: string; readonly manbaId: number },
): Promise<
  readonly {
    readonly id: number;
    readonly matn: string;
    readonly sabab: string | null;
    readonly urinishlar: number;
  }[]
> {
  const q = await soruvchi<
    { id: number; matn: string; xato_sabab: string | null; urinishlar: string }[]
  >`
    SELECT id, matn, xato_sabab, urinishlar::text
    FROM bot_xabar
    WHERE manba_turi = ${kirim.manbaTuri}
      AND manba_id = ${kirim.manbaId}
      AND holat = 'YETMADI'
    ORDER BY yaratildi DESC`;

  return q.map((x) => ({
    id: x.id,
    matn: x.matn,
    sabab: x.xato_sabab,
    urinishlar: Number(x.urinishlar),
  }));
}

/**
 * 13.11 — «qayta yuborish tugmasi». Xabar navbatga qaytariladi.
 *
 * ⚠️ Yangi qator YARATILMAYDI: urinishlar soni saqlanib qolsin va
 *    bir xabar necha marta urinilgani ko'rinsin.
 *
 * ⚠️ Oldingi xato sababi ham SAQLANADI: yana yiqilsa ustidan
 *    yoziladi, muvaffaqiyatli ketsa esa tarixda «avval nima
 *    bo'lgani» qolib qo'yadi.
 */
export async function xabarniQaytaYubor(
  soruvchi: Soruvchi,
  xabarId: number,
): Promise<void> {
  await soruvchi`
    UPDATE bot_xabar
    SET holat = 'NAVBATDA'
    WHERE id = ${xabarId} AND holat = 'YETMADI'`;
}
