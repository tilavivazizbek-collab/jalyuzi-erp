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
import { filialliMatn, tugmaliMi, type AdminHodisasi } from '@/lib/domain/bildirishnoma';
import { VAQT_ZONASI } from '@/lib/domain/sana';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

/**
 * TZ 13.9 — bildirishnoma **adminlarga** boradi.
 *
 * ⚠️ TZ 20.14.3 — «Bosh admin barcha filial xabarlarini oladi. Filial
 *    admini faqat o'zinikini.» Bosh admin — bosh filialdagi ADMIN
 *    (`lib/ruxsat/tekshir.ts` dagi ta'rif bilan bir xil). 2026-10-13 gacha
 *    faqat shu filial adminlariga borardi: bosh admin boshqa filialdagi
 *    kassa kamomadi yoki brak haqida bilmasdi.
 *
 * ⚠️ Telegrami ulanmagan admin ro'yxatga tushmaydi: unga yuborib
 *    bo'lmaydi. Bu jim yo'qotish emas — sayt baribir hammasini
 *    ko'rsatadi (13.1: «bot yagona interfeys emas»).
 */
export async function filialAdminlari(
  soruvchi: Soruvchi,
  filialId: number,
  /** `false` — bosh admin nusxasisiz (u umumiy xabarni alohida oladi) */
  boshAdmingaNusxa = true,
): Promise<readonly { xodimId: number; telegramId: number; ozFiliali: boolean }[]> {
  const q = await soruvchi<{ id: number; telegram_id: number; oz: boolean }[]>`
    SELECT DISTINCT x.id, x.telegram_id, (x.filial_id = ${filialId}) AS oz
    FROM xodim x
    JOIN filial xf    ON xf.id = x.filial_id
    JOIN xodim_rol xr ON xr.xodim_id = x.id
    JOIN rol r        ON r.id = xr.rol_id
    WHERE (x.filial_id = ${filialId} OR (${boshAdmingaNusxa} AND xf.bosh))
      AND x.faol = true
      AND x.telegram_id IS NOT NULL
      AND r.kod = 'ADMIN'
      AND r.faol = true`;

  return q.map((x) => ({ xodimId: x.id, telegramId: x.telegram_id, ozFiliali: x.oz }));
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
    /** `false` — bosh adminga nusxa yuborilmaydi (standart — yuboriladi, 20.14.3) */
    readonly boshAdmingaNusxa?: boolean;
  },
  yaratdiId: number,
): Promise<{ yozildi: number }> {
  const adminlar = await filialAdminlari(soruvchi, kirim.filialId, kirim.boshAdmingaNusxa ?? true);
  if (adminlar.length === 0) return { yozildi: 0 };

  // TZ 20.14.3 — xabarda filial nomi (bosh admin qaysi filialdan ekanini bilsin)
  const f = await soruvchi<{ nom: string; faollar: number }[]>`
    SELECT nom, (SELECT COUNT(*)::int FROM filial WHERE faol AND ochirildi IS NULL) AS faollar
    FROM filial WHERE id = ${kirim.filialId}`;
  const matn = filialliMatn(f[0]?.nom ?? '', f[0]?.faollar ?? 1, kirim.matn);

  const manbaTuri = kirim.manbaTuri ?? kirim.hodisa.toLowerCase();
  for (const a of adminlar) {
    /**
     * ⚠️ Bosh adminga BOSHQA filialdan — faqat ma'lumot, TUGMASIZ nusxa.
     *    «Pul topshirildi» ni pulni QO'LIDA olgan odam tasdiqlaydi; bosh
     *    admin Toshkentdan turib Samarqand kassasiga kelmagan pulni
     *    «qabul qildim» deb qo'ya olmasin. Qayta kesish ham — material
     *    o'sha filial omborida. Tugma `manba_turi` bo'yicha quriladi
     *    (`bot/yuboruvchi.ts`) — `_nusxa` uni o'chiradi.
     */
    const nusxa = !a.ozFiliali && tugmaliMi(kirim.hodisa);
    await xabarNavbatgaQoy(
      soruvchi,
      {
        telegramId: a.telegramId,
        matn: nusxa ? `${matn}\n\nℹ️ Tasdiqlash — filial adminida` : matn,
        xodimId: a.xodimId,
        manbaTuri: nusxa ? `${manbaTuri}_nusxa` : manbaTuri,
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
 * ⚠️ BIR VAQTDA BITTA YURISH (advisory lock). Chaqiruvchi javob kechiksa
 *    so'rovni qayta yuboradi (cron-job.org 30 s); ikki yurish bir paytda
 *    «bugun yozilmagan» deb ko'rib, IKKI xabar yozardi — 2026-10-13 testda
 *    ushlandi. Qulf olinmasa — boshqa yurish ishlayapti, darhol chiqiladi.
 *
 * @param qoshimchaShart qaysi filiallar (masalan, kassa yopilish soati o'tgani)
 * @param filialIdlar `undefined` — hamma filial (cron); berilsa faqat shular
 *    (sinov, qo'lda qayta yuborish)
 * @param davrBoshi shu kundan beri yozilgan bo'lsa — qayta yozilmaydi.
 *    Standart — `bugun` (kuniga bir marta). `null` — HECH QACHON qayta
 *    yozilmaydi (oylik xabar: davr `manbaTuri` ichida, «oylik_yakun:2026-09»).
 * @param boshAdmingaNusxa `false` — bosh admin har filial nusxasini olmaydi
 */
export async function kunigaBirMartaOgohlantir(
  sql: postgres.Sql,
  k: {
    readonly hodisa: AdminHodisasi;
    readonly manbaTuri: string;
    readonly bugun: string;
    readonly qoshimchaShart?: postgres.PendingQuery<postgres.Row[]>;
    readonly filialIdlar?: readonly number[];
    readonly davrBoshi?: string | null;
    readonly boshAdmingaNusxa?: boolean;
    readonly matnYasa: (filialId: number) => Promise<string | null>;
  },
): Promise<{ filiallar: number; xabarlar: number; band?: true }> {
  return sql.begin(async (tx) => {
    const qulf = await tx<{ ok: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtext(${`cron:${k.manbaTuri}`})) AS ok`;
    if (qulf[0]?.ok !== true) return { filiallar: 0, xabarlar: 0, band: true as const };

    const filiallar = await tx<{ id: number }[]>`
      SELECT f.id FROM filial f
      WHERE f.faol AND f.ochirildi IS NULL
        ${k.qoshimchaShart ?? tx``}
        ${k.filialIdlar === undefined ? tx`` : tx`AND f.id = ANY(${k.filialIdlar as number[]})`}
        AND NOT EXISTS (
          SELECT 1 FROM bot_xabar x
          WHERE x.manba_turi = ${k.manbaTuri} AND x.manba_id = f.id
            ${k.davrBoshi === null ? tx`` : tx`AND (x.yaratildi AT TIME ZONE ${VAQT_ZONASI})::date >= ${k.davrBoshi ?? k.bugun}::date`})
      ORDER BY f.id`;

    let xabarlar = 0;
    let soni = 0;
    for (const f of filiallar) {
      if ((await filialAdminlari(tx, f.id, k.boshAdmingaNusxa ?? true)).length === 0) continue;
      const matn = await k.matnYasa(f.id);
      if (matn === null) continue;
      const { yozildi } = await adminlarniOgohlantir(
        tx,
        {
          filialId: f.id,
          hodisa: k.hodisa,
          matn,
          manbaTuri: k.manbaTuri,
          manbaId: f.id,
          boshAdmingaNusxa: k.boshAdmingaNusxa ?? true,
        },
        TIZIM_XODIM,
      );
      xabarlar += yozildi;
      if (yozildi > 0) soni += 1;
    }
    return { filiallar: soni, xabarlar };
  });
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
