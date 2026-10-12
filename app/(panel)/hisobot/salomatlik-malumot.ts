/**
 * Ma'lumot salomatligi — hisobotlarni buzadigan muammolar bitta joyda.
 * Moliya hisobotlari, 2026-10-12.
 *
 * ⚠️ NEGA: hisobot faqat ma'lumot to'g'ri bo'lsa to'g'ri. Tannarxsiz
 *    sotuv foydani shishiradi, muddatsiz qarz pul prognozidan tushib
 *    qoladi, P-46 kirimida qarz kam yozilgan. Ular har sahifada tarqoq
 *    belgilanadi — bu yerda hammasi sanaladi va tuzatish joyi ko'rsatiladi.
 *
 * ⚠️ FAQAT O'QIYDI. Hech narsani o'zi tuzatmaydi.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { toshkentKuni } from '@/lib/domain/sana';
import { kunOldin } from '../kassa/kitob-filtr';
import { yopilmaganKunlar } from '../kassa/kun-malumot';
import { kirimSummalari } from '../ombor/malumot';
import { yetkazibHolatlari } from '../yetkazib/taqsimot';

export type MuammoDarajasi = 'XAVF' | 'OGOH';

export interface Muammo {
  readonly kod: string;
  readonly daraja: MuammoDarajasi;
  readonly nom: string;
  /** Nima buziladi — egasi tushunadigan tilda */
  readonly tasir: string;
  readonly soni: number;
  /** So'mdagi ta'sir; yo'q bo'lsa `null` */
  readonly summa: string | null;
  readonly havola: string;
  readonly havolaMatni: string;
}

/** Tannarx tekshiruvi oynasi — undan eski sotuvlar hisobotga kam ta'sir qiladi */
const OYNA_KUN = 180;

export async function malumotSalomatligi(filialId: number): Promise<Muammo[]> {
  const sql = ulanishOl();
  const bugun = toshkentKuni();

  const [tannarxsiz, muddatsizMijoz, muddatsizKirim, tolovYozilmadi, kurssiz, dollarXarajat, manfiyKassa, kirimlar, yopilmagan] =
    await Promise.all([
      // 1. Ishi tugagan, lekin materiali yechilmagan pozitsiyalar
      sql<{ n: number; s: string | null }[]>`
        SELECT COUNT(*)::int AS n,
               SUM(p.narx_snapshot - COALESCE(p.chegirma_summa, 0))::numeric(14,2)::text AS s
        FROM buyurtma_pozitsiya p
        JOIN buyurtma b ON b.id = p.buyurtma_id
        WHERE b.sotgan_filial_id = ${filialId}
          AND b.sana >= now() - make_interval(days => ${OYNA_KUN})
          AND p.mahsulot_tur_id IS NOT NULL
          AND p.holat IN ('TAYYOR', 'TAYYOR_YOLDA', 'YETIB_KELDI', 'TOPSHIRILDI')
          AND NOT EXISTS (SELECT 1 FROM ombor_harakat oh
                          WHERE oh.manba_turi = 'buyurtma_pozitsiya' AND oh.manba_id = p.id)`,
      // 2. Qarzi bor, to'lov muddati yo'q mijozlar
      sql<{ n: number; s: string | null }[]>`
        SELECT COUNT(*)::int AS n, SUM(q)::numeric(14,2)::text AS s FROM (
          SELECT m.id, SUM(h.summa) AS q
          FROM mijoz m JOIN mijoz_harakat h ON h.mijoz_id = m.id
          -- ⚠️ Mijoz umumiy, qarz harakati esa filialda — shu filial qarzi
          WHERE m.faol AND m.tolov_muddati_kun IS NULL AND h.valyuta = 'SOM'
            AND h.filial_id = ${filialId}
          GROUP BY m.id HAVING SUM(h.summa) > 0
        ) t`,
      // 3. To'lov muddati yozilmagan kirimlar — qoldiq taqsimotdan (pastda)
      sql<{ id: number }[]>`
        SELECT id FROM kirim
        WHERE filial_id = ${filialId} AND holat = 'FAOL' AND tolov_muddati IS NULL`,
      // 4. Oldindan to'lov yozilmay qolgan buyurtmalar
      sql<{ n: number }[]>`
        SELECT COUNT(DISTINCT a.obyekt_id)::int AS n
        FROM audit_jurnal a JOIN buyurtma b ON b.id = a.obyekt_id
        WHERE a.amal = 'TOLOV_YOZILMADI' AND a.obyekt_turi = 'buyurtma'
          AND b.sotgan_filial_id = ${filialId}
          AND NOT EXISTS (SELECT 1 FROM kassa_yozuv y
                          WHERE y.manba_turi = 'buyurtma' AND y.manba_id = b.id AND y.summa > 0)`,
      // 5. Kursi yozilmagan dollarli buyurtmalar — hisobotda tushum 0
      sql<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM buyurtma
        WHERE sotgan_filial_id = ${filialId} AND valyuta = 'USD' AND kurs_snapshot IS NULL`,
      // 6. Dollarda yozilgan xarajatlar — foyda-zararga kirmaydi
      sql<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM xarajat
        WHERE filial_id = ${filialId} AND valyuta <> 'SOM'`,
      // 7. Qoldig'i manfiy kassalar — jismonan bo'lishi mumkin emas
      sql<{ n: number; s: string | null }[]>`
        SELECT COUNT(*)::int AS n, SUM(q)::numeric(14,2)::text AS s FROM (
          SELECT k.id, SUM(y.summa) AS q FROM kassa k JOIN kassa_yozuv y ON y.kassa_id = k.id
          WHERE k.filial_id = ${filialId} AND k.faol
          GROUP BY k.id HAVING SUM(y.summa) < 0
        ) t`,
      // 8. P-46 — kirim qarzi tekshiruvi uchun
      sql<{ id: number; yozilgan: string }[]>`
        SELECT k.id, SUM(h.summa)::numeric(14,2)::text AS yozilgan
        FROM kirim k JOIN yetkazib_beruvchi_harakat h
          -- Hamma XARID yozuvlari: kelajakdagi tuzatuvchi yozuvlar ham hisobga olinadi
          ON h.manba_turi = 'kirim' AND h.manba_id = k.id AND h.turi = 'XARID'
        WHERE k.filial_id = ${filialId} AND k.holat = 'FAOL'
        GROUP BY k.id`,
      // 9. Yopilmagan kunlar (naqd kassalar, 30 kun)
      sql<{ id: number }[]>`SELECT id FROM kassa WHERE filial_id = ${filialId} AND faol AND turi = 'NAQD'`.then(
        (k) => yopilmaganKunlar(k.map((x) => x.id), kunOldin(bugun, 29), bugun),
      ),
    ]);

  /**
   * Muddatsiz kirim qarzi — QOLDIQ, yozilgani emas. Yetkazib beruvchilar
   * kartochkasi bilan bir xil FIFO taqsimot (taqsimot.ts — bitta joy):
   * qisman to'langan kirim to'langan qismisiz sanaladi.
   */
  const muddatsizIdlar = new Set(muddatsizKirim.map((k) => k.id));
  const kirimQoldigi = new Map<number, Decimal>();
  if (muddatsizIdlar.size > 0) {
    for (const h of (await yetkazibHolatlari(null)).values()) {
      for (const b of h.taqsimot.bandlar) {
        if (b.valyuta !== 'SOM' || b.buyurtmaId === null || !muddatsizIdlar.has(b.buyurtmaId)) continue;
        kirimQoldigi.set(b.buyurtmaId, (kirimQoldigi.get(b.buyurtmaId) ?? new Decimal(0)).plus(b.qolgan));
      }
    }
  }
  const qarzliKirimlar = [...kirimQoldigi.values()].filter((q) => q.gt(0));
  const muddatsizKirimSumma = qarzliKirimlar.reduce((a, q) => a.plus(q), new Decimal(0));

  // P-46: yozilgan qarz ≠ qatorQiymati bo'yicha summa
  const hisob = await kirimSummalari(sql, kirimlar.map((k) => k.id));
  let p46Soni = 0;
  let p46Farq = new Decimal(0);
  for (const k of kirimlar) {
    const togri = new Decimal(hisob.kirimlar.get(k.id) ?? '0');
    const farq = togri.minus(k.yozilgan);
    if (!farq.isZero()) {
      p46Soni += 1;
      p46Farq = p46Farq.plus(farq.abs());
    }
  }

  const n = (x: { n: number }[]): number => x[0]?.n ?? 0;
  const s = (x: { s: string | null }[]): string | null => x[0]?.s ?? null;
  const natija: Muammo[] = [
    {
      kod: 'P46',
      daraja: 'XAVF',
      nom: "Yetkazib beruvchi qarzi noto'g'ri yozilgan kirimlar",
      tasir: "Metr narxli eski kirimlarda qarz kam yozilgan (P-46) — kreditorlik va pul prognozi kam ko'rsatadi",
      soni: p46Soni,
      summa: p46Farq.toFixed(2),
      havola: '/ombor/kirim',
      havolaMatni: 'Kirimlar',
    },
    {
      kod: 'MANFIY_KASSA',
      daraja: 'XAVF',
      nom: "Qoldig'i manfiy kassalar",
      tasir: "Kassada minus pul bo'lmaydi — kirim yozilmay qolgan yoki chiqim ortiqcha yozilgan",
      soni: n(manfiyKassa),
      summa: s(manfiyKassa),
      havola: '/kassa/royxat',
      havolaMatni: 'Kassalar',
    },
    {
      kod: 'TOLOV_YOZILMADI',
      daraja: 'XAVF',
      nom: "Oldindan to'lovi yozilmay qolgan buyurtmalar",
      tasir: "Pul kassada bor, tizimda yo'q — kun yopishda farq chiqadi, mijoz qarzi oshib ko'rinadi",
      soni: n(tolovYozilmadi),
      summa: null,
      havola: '/buyurtma',
      havolaMatni: 'Buyurtmalar',
    },
    {
      kod: 'TANNARXSIZ',
      daraja: 'XAVF',
      nom: "Tannarxi yozilmagan tayyor pozitsiyalar (oxirgi 6 oy)",
      tasir: "Material yechilmagan — bu sotuvlar foyda-zararda 100% foyda bo'lib ko'rinadi",
      soni: n(tannarxsiz),
      summa: s(tannarxsiz),
      havola: '/hisobot/sotuv',
      havolaMatni: 'Sotuv hisoboti',
    },
    {
      kod: 'KURSSIZ',
      daraja: 'XAVF',
      nom: 'Kursi yozilmagan dollarli buyurtmalar',
      tasir: "Hisobotlarda tushumi 0 bo'lib chiqadi",
      soni: n(kurssiz),
      summa: null,
      havola: '/buyurtma',
      havolaMatni: 'Buyurtmalar',
    },
    {
      kod: 'YOPILMAGAN_KUN',
      daraja: 'OGOH',
      nom: 'Yopilmagan kassa kunlari (oxirgi 30 kun)',
      tasir: "Kassir sanagan pul tekshirilmagan — kamomad sezilmay qolishi mumkin",
      soni: yopilmagan.length,
      summa: null,
      havola: '/kassa/kun',
      havolaMatni: 'Kun yopish',
    },
    {
      kod: 'MUDDATSIZ_MIJOZ',
      daraja: 'OGOH',
      nom: "Qarzi bor, to'lov muddati yozilmagan mijozlar",
      tasir: "Bu qarzlar pul prognozida ko'rinmaydi va «muddati o'tgan» bo'lib hech qachon belgilanmaydi",
      soni: n(muddatsizMijoz),
      summa: s(muddatsizMijoz),
      havola: '/mijoz/qarzdorlik',
      havolaMatni: 'Qarzdorlar',
    },
    {
      kod: 'MUDDATSIZ_KIRIM',
      daraja: 'OGOH',
      nom: "To'lov muddati yozilmagan, qarzi bor kirimlar",
      tasir: "Yetkazib beruvchiga to'lov pul prognozida ko'rinmaydi",
      soni: qarzliKirimlar.length,
      summa: muddatsizKirimSumma.toFixed(2),
      havola: '/yetkazib?filtr=qarz',
      havolaMatni: 'Yetkazib beruvchilar',
    },
    {
      kod: 'DOLLAR_XARAJAT',
      daraja: 'OGOH',
      nom: 'Dollarda yozilgan xarajatlar',
      tasir: "Foyda-zararga qo'shilmaydi (so'm va dollar aralashmaydi)",
      soni: n(dollarXarajat),
      summa: null,
      havola: '/hisobot/moliya',
      havolaMatni: 'Moliya',
    },
  ];
  return natija.filter((m) => m.soni > 0);
}
