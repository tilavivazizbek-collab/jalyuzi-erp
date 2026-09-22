/**
 * lib/amal/narx-tekshir.ts — QISM 1 §9.4 · TZ 3.8 · 3.11 · 6.2 · 20.9
 *
 * Pozitsiya narxini SERVERDA qayta hisoblaydi va brauzerdan kelgani
 * bilan solishtiradi.
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 *    Ombor sarflashi allaqachon serverda qayta hisoblanadi
 *    (`sarflash.ts`, §9.4) — sababi izohda ochiq yozilgan: sotuvchining
 *    brauzerida ochiq turgan ESKI sahifa eski formulani ushlab qoladi.
 *
 *    Narxga esa tegilmasdi. O'sha izohda sabab ham bor edi: «narxni
 *    sotuvchi qo'lda qo'yadi, u mijoz bilan kelishilgan». Bu
 *    2026-09-20 gacha TO'G'RI edi — o'shanda narx materiallardan
 *    yig'ilardi va sotuvchi uni kelishardi.
 *
 *    Endi model boshqa: narx EGASINING JADVALIDAN keladi, qo'lda
 *    o'zgartirish esa alohida amal. Ya'ni ikki holat bor va ular
 *    farqlanishi SHART:
 *
 *      sotuvchi tegmagan  →  jadvaldagi narx bo'lishi kerak
 *      sotuvchi tekkan    →  bu ko'rinishi kerak
 *
 *    Hozirgacha ikkalasi ham bir xil ko'rinardi: egasi narxni
 *    o'zgartirsa, ochiq turgan sahifa eski narxni JIMGINA yozardi.
 *
 * ⚠️ BLOKLAMAYDI. TZ 3.8 · 3.11 — narx mijoz bilan kelishiladi.
 *    Bu modul taqiq emas, IZ qoldiradi: `qolda_narx` belgisi va
 *    audit yozuvi.
 *
 * ⚠️ BAZAGA TEGADI, shuning uchun `lib/amal/` da (domen emas).
 *    Hisobning o'zi `lib/domain/pozitsiya-narxi.ts` da — bu yer
 *    faqat ma'lumot yig'adi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { pozitsiyaNarxiniHisobla } from '@/lib/domain/pozitsiya-narxi';
import { amaldagiOffset } from '@/lib/domain/mijoz';
import { kurs as kursYasa, type Kurs } from '@/lib/domain/pul';
import type { HisoblashUsuli, QoshimchaUsuli } from '@/lib/domain/narx-qoidasi';

type Tranzaksiya = postgres.TransactionSql;

export interface TekshirilayotganNarx {
  readonly mahsulotTurId: number;
  readonly eniM: number;
  readonly boyiM: number;
  readonly soni: number;
  /** Sotuvchi kiritgan narx — solishtiriladigan qiymat */
  readonly narxSnapshot: string;
  readonly xizmatHaqi: string;
  readonly mijozId: number | null;
  readonly filialId: number;
  readonly kursSnapshot: string | null;
  /** Slotlarga tanlangan materiallar — daraja shulardan topiladi */
  readonly materialIdlar: readonly number[];
  /** Mijoz tanlagan qo'shimchalar (`pozitsiya_qoshimcha` ga tushadigan) */
  readonly qoshimchaIdlar: readonly number[];
  /** Konstruktor parametrlari — `formula_snapshot` dan */
  readonly parametrlar: Readonly<Record<string, number>>;
}

export interface NarxTekshiruvi {
  /** Narx jadvaldagidan farq qiladimi */
  readonly qoldami: boolean;
  /** Server hisoblagan narx — `null` bo'lsa qoida topilmadi */
  readonly hisoblangan: string | null;
}

/**
 * ⚠️ TIYIN DARAJASIDAGI FARQ E'TIBORGA OLINMAYDI.
 *
 *    Brauzer va server bir xil `Decimal` bilan hisoblaydi, lekin
 *    yaxlitlash qadami (`yaxlitlaNarx`) va ulushlar tartibi bir
 *    tiyin farq berishi mumkin. Har tiyin uchun «qo'lda qo'yilgan»
 *    deb belgilash ro'yxatni shovqinga aylantirardi va egasi uni
 *    o'qimay qo'yardi.
 *
 *    100 so'm — kassa yaxlitlash qadami (§3.3). Undan kichigi
 *    hisobga olinmaydi.
 */
const BAGRIKENGLIK_SOM = 100;

/**
 * Narxni qayta hisoblaydi.
 *
 * ⚠️ HAMMA MA'LUMOT BAZADAN. Brauzerdan faqat o'lcham, soni va
 *    tanlovlar olinadi — ular haqiqiy kirish ma'lumoti. Narx
 *    qoidasi, bosqichlar, qo'shimcha narxlari va mijoz offseti
 *    bazadan o'qiladi.
 */
export async function narxniTekshir(
  tx: Tranzaksiya,
  k: TekshirilayotganNarx,
): Promise<NarxTekshiruvi> {
  /** Mijoz turi va guruh offseti — TZ 6.2 · 6.3 */
  const mijoz =
    k.mijozId === null
      ? null
      : (
          await tx<
            {
              mijoz_turi_id: number | null;
              offset_turi: string | null;
              offset_qiymat: string | null;
              guruh_offset_turi: string | null;
              guruh_offset_qiymat: string | null;
            }[]
          >`
            SELECT m.mijoz_turi_id, m.offset_turi, m.offset_qiymat::text,
                   g.offset_turi AS guruh_offset_turi,
                   g.offset_qiymat::text AS guruh_offset_qiymat
              FROM mijoz m
              LEFT JOIN mijoz_guruh g ON g.id = m.mijoz_guruh_id
             WHERE m.id = ${k.mijozId}`
        )[0] ?? null;

  const mijozTuriId = mijoz?.mijoz_turi_id ?? null;

  /**
   * DARAJA — MATO SLOTIDAN.
   *
   * ⚠️ 2026-09-21: ekranda ham shunday (`forma.tsx`). Ilgari
   *    «birinchi darajasi bor material» olinardi va bu slot
   *    tartibiga bog'liq edi — karnizga daraja qo'yilgan bo'lsa
   *    narx karniz darajasidan izlanardi.
   */
  const darajalar =
    k.materialIdlar.length === 0
      ? []
      : await tx<{ narx_guruh_id: number | null; sarflash_birligi: string }[]>`
          SELECT narx_guruh_id, sarflash_birligi FROM material
           WHERE id = ANY(${k.materialIdlar})`;

  const narxGuruhId =
    darajalar.find((d) => d.sarflash_birligi === 'KV_M' && d.narx_guruh_id !== null)
      ?.narx_guruh_id ??
    darajalar.find((d) => d.narx_guruh_id !== null)?.narx_guruh_id ??
    null;

  if (narxGuruhId === null) return { qoldami: false, hisoblangan: null };

  /**
   * QOIDANI TANLASH — sotuv ekranidagi tartib AYNAN takrorlanadi:
   *   1. mijoz turi + filial   2. mijoz turi   3. filial   4. umumiy
   */
  const qoidalar = await tx<
    {
      id: number;
      mijoz_turi_id: number | null;
      filial_id: number | null;
      hisoblash_usuli: string;
    }[]
  >`
    SELECT id, mijoz_turi_id, filial_id, hisoblash_usuli
      FROM mahsulot_narx
     WHERE mahsulot_tur_id = ${k.mahsulotTurId}
       AND narx_guruh_id = ${narxGuruhId}
       AND faol = true
       AND (filial_id IS NULL OR filial_id = ${k.filialId})
       AND (mijoz_turi_id IS NULL OR mijoz_turi_id = ${mijozTuriId})`;

  const tanlangan =
    qoidalar.find((q) => q.mijoz_turi_id === mijozTuriId && q.filial_id === k.filialId) ??
    qoidalar.find((q) => q.mijoz_turi_id === mijozTuriId && q.filial_id === null) ??
    qoidalar.find((q) => q.mijoz_turi_id === null && q.filial_id === k.filialId) ??
    qoidalar.find((q) => q.mijoz_turi_id === null && q.filial_id === null);

  if (tanlangan === undefined) return { qoldami: false, hisoblangan: null };

  const bosqichlar = await tx<
    { dan: string; gacha: string | null; narx: string; valyuta: string }[]
  >`
    SELECT dan::text, gacha::text, narx::text, valyuta
      FROM mahsulot_narx_bosqich
     WHERE mahsulot_narx_id = ${tanlangan.id} AND faol = true
     ORDER BY dan`;

  /** Mijoz tanlagan qo'shimchalar — narxi BAZADAN, brauzerdan emas */
  const qoshimchalar =
    k.qoshimchaIdlar.length === 0
      ? []
      : await tx<
          { nom: string; hisoblash_usuli: string; narx: string; valyuta: string }[]
        >`
          SELECT nom, hisoblash_usuli, narx::text, valyuta
            FROM mahsulot_qoshimcha
           WHERE id = ANY(${k.qoshimchaIdlar}) AND faol = true`;

  const kursObyekti: Kurs | null =
    k.kursSnapshot === null ? null : kursYasa(k.kursSnapshot, new Date(), 'JORIY');

  /**
   * ⚠️ OFFSET domen funksiyasidan olinadi — sotuv ekrani ham,
   *    bot ham aynan shuni chaqiradi (§2.2).
   */
  const offset =
    mijoz === null || kursObyekti === null
      ? null
      : amaldagiOffset(
          {
            offsetTuri: mijoz.offset_turi,
            offsetQiymat: mijoz.offset_qiymat,
          },
          {
            offsetTuri: mijoz.guruh_offset_turi,
            offsetQiymat: mijoz.guruh_offset_qiymat,
          },
          kursObyekti,
        );

  const natija = pozitsiyaNarxiniHisobla({
    eniM: k.eniM,
    boyiM: k.boyiM,
    soni: k.soni,
    parametrlar: k.parametrlar,
    slotlar: [],
    aksessuarlar: [],
    qoida: {
      hisoblashUsuli: tanlangan.hisoblash_usuli as HisoblashUsuli,
      bosqichlar: bosqichlar.map((b) => ({
        dan: Number(b.dan),
        gacha: b.gacha === null ? null : Number(b.gacha),
        narx: b.narx,
        valyuta: b.valyuta === 'USD' ? ('USD' as const) : ('SOM' as const),
      })),
    },
    qoshimchalar: qoshimchalar.map((q) => ({
      nom: q.nom,
      hisoblashUsuli: q.hisoblash_usuli as QoshimchaUsuli,
      narx: q.narx,
      valyuta: q.valyuta === 'USD' ? ('USD' as const) : ('SOM' as const),
    })),
    offset,
    kurs: kursObyekti,
    xizmatHaqi: k.xizmatHaqi,
  });

  if (natija.jami === null) return { qoldami: false, hisoblangan: null };

  const farq = new Decimal(natija.jami).minus(new Decimal(k.narxSnapshot)).abs();

  return {
    qoldami: farq.greaterThan(BAGRIKENGLIK_SOM),
    hisoblangan: natija.jami,
  };
}
