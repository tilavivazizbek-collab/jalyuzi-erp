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
import { katalogNarxi } from '@/lib/domain/narx';
import { kopaytir, kurs as kursYasa, pulMatn, type Kurs } from '@/lib/domain/pul';
import {
  darajaliSlotniTop,
  pozitsiyaQoidaNarxi,
  qoidaniTop,
  type DarajaliSlot,
  type HisoblashUsuli,
  type QoshimchaUsuli,
} from '@/lib/domain/narx-qoidasi';

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
  /**
   * Slotlarga tanlangan materiallar — daraja shulardan topiladi.
   *
   * ⚠️ `slotId` KERAK: qaysi slot narxni belgilashi admin tomonidan
   *    `mahsulot_slot.narx_belgilaydi` da belgilanadi (0048). Faqat
   *    material id lari bilan buni bilib bo'lmaydi.
   *
   * ⚠️ `slotId` `null` bo'lishi mumkin — qo'lda qo'shilgan qator.
   *    Bunday qatorda belgi yo'q deb qaraladi.
   */
  readonly slotlar: readonly { readonly slotId: number | null; readonly materialId: number }[];
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
   * DARAJA — qaysi slotdan olinishi `darajaliSlotniTop()` da.
   *
   * ⚠️ 2026-09-22: qoida SHU YERDAN OLIB TASHLANDI. Ilgari u sotuv
   *    ekranida, bu yerda va botda uch marta yozilgan edi — biri
   *    o'zgarsa uchtasi uch xil narx berardi (CLAUDE.md §3).
   *
   * ⚠️ Tartib MUHIM: `k.slotlar` ekrandan qanday kelsa shunday
   *    qoladi, chunki belgi qo'yilmagan turda «birinchi mato»
   *    qoidasi ishlaydi va u tartibga tayanadi.
   */
  const materialIdlar = k.slotlar.map((s) => s.materialId);
  const darajalar =
    materialIdlar.length === 0
      ? []
      : await tx<
          { id: number; narx_guruh_id: number | null; sarflash_birligi: string }[]
        >`
          SELECT id, narx_guruh_id, sarflash_birligi FROM material
           WHERE id = ANY(${materialIdlar})`;

  /**
   * ⚠️ BELGILANGAN SLOT TURDAN O'QILADI, kelgan qatorlardan EMAS.
   *
   *    Sotuv ekrani materiali TANLANMAGAN slotni yubormaydi
   *    (`forma.tsx` → `.filter((q) => q.material !== null)`). Agar
   *    belgini faqat kelgan qatorlardan izlasak, mijoz belgilangan
   *    slotga mato tanlamagan holatda server belgini KO'RMAY qolardi
   *    va boshqa slotning darajasidan narx hisoblardi — ekran esa
   *    «narx topilmadi» derdi. Ikki xil natija, ya'ni biz endigina
   *    yopgan teshikning o'zi.
   */
  const belgilangan = await tx<{ id: number }[]>`
    SELECT id FROM mahsulot_slot
     WHERE mahsulot_tur_id = ${k.mahsulotTurId} AND faol = true
       AND narx_belgilaydi
     LIMIT 1`;
  const belgilanganSlotId = belgilangan[0]?.id ?? null;

  const daraja = (materialId: number | undefined) => {
    const m = darajalar.find((d) => d.id === materialId);
    return {
      matomi: m?.sarflash_birligi === 'KV_M',
      narxGuruhId: m?.narx_guruh_id ?? null,
    };
  };

  const narxGuruhId =
    darajaliSlotniTop<DarajaliSlot>(
      belgilanganSlotId === null
        ? k.slotlar.map((s) => ({ narxBelgilaydi: false, ...daraja(s.materialId) }))
        : [
            {
              narxBelgilaydi: true,
              ...daraja(
                k.slotlar.find((s) => s.slotId === belgilanganSlotId)?.materialId,
              ),
            },
          ],
    )?.narxGuruhId ?? null;

  if (narxGuruhId === null) return { qoldami: false, hisoblangan: null };

  /*
   * QOIDANI TANLASH — tanlov DOMAINDA (`qoidaniTop`).
   *
   * ⚠️ Bu tartib ilgari SHU YERDA qo'lda yozilgan edi va
   *    ekrandagi nusxasi undan farq qilardi. Endi ikkalasi ham
   *    bitta funksiyani chaqiradi (CLAUDE.md §3) — §9.4 esa
   *    server baribir QAYTA hisoblashini talab qiladi, shuning
   *    uchun tekshiruvning o'zi joyida qoladi.
   *
   * ⚠️ DARAJAGA UMUMIY QATOR HAM olinadi (0055): turga alohida
   *    qator bo'lmasa o'sha ishlatiladi. Usiz server «narx yo'q»
   *    deb, ekran esa darajadan kelgan narxni ko'rsatib turardi.
   */
  const qoidalar = await tx<
    {
      id: number;
      narx_guruh_id: number;
      mijoz_turi_id: number | null;
      filial_id: number | null;
      hamma_turga: boolean;
      hisoblash_usuli: string;
    }[]
  >`
    SELECT id, narx_guruh_id, mijoz_turi_id, filial_id, hamma_turga,
           hisoblash_usuli
      FROM mahsulot_narx
     WHERE narx_guruh_id = ${narxGuruhId}
       AND faol = true
       AND (mahsulot_tur_id = ${k.mahsulotTurId} OR hamma_turga = true)
       AND (filial_id IS NULL OR filial_id = ${k.filialId})
       AND (mijoz_turi_id IS NULL OR mijoz_turi_id = ${mijozTuriId})`;

  const tanlangan = qoidaniTop(
    qoidalar.map((q) => ({
      ...q,
      narxGuruhId: q.narx_guruh_id,
      mijozTuriId: q.mijoz_turi_id,
      filialId: q.filial_id,
      hammaTurga: q.hamma_turga,
    })),
    { narxGuruhId, mijozTuriId, filialId: k.filialId },
  );

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

// ─── Qo'shimcha buyum narxi ───────────────────────────────────────────────

export interface TekshirilayotganQoshimcha {
  readonly materialId: number;
  /** Sotuvchi kiritgan summa — solishtiriladigan qiymat */
  readonly narxSnapshot: string;
  /** Donalab yoki metrlab sotilgan miqdor */
  readonly miqdor: number;
  /** Kesib sotishda — kesilgan to'rtburchak, metrda */
  readonly eniM: number;
  readonly boyiM: number;
  readonly mijozId: number | null;
  readonly filialId: number;
  readonly kursSnapshot: string | null;
}

/**
 * ALOHIDA SOTILGAN BUYUM NARXINI QAYTA HISOBLAYDI — 2026-09-22.
 *
 * ⚠️ NEGA KERAK
 *
 *    `narxniTekshir` faqat MAHSULOT TURI bor pozitsiyani tekshiradi.
 *    Metrlab kesilgan mato, karniz va donalab sotilgan buyumda tur
 *    yo'q — ular tekshiruvdan butunlay chetda qolardi.
 *
 *    Ya'ni tayyor jalyuzida yopilgan teshik alohida sotuvda ochiq
 *    turardi: egasi narxni o'zgartiradi, sotuvchining brauzerida
 *    ochiq turgan ESKI sahifa eski narxda sotaveradi va hech
 *    qanday iz qolmaydi.
 *
 *    2026-09-22 da «miqdor bo'yicha bosqich» qo'shilgach teshik
 *    kattalashdi: endi u yerda butun bosqich jadvali turibdi.
 *
 * ⚠️ EKRAN BILAN BIR XIL TARTIB (`qoshimcha.tsx`):
 *
 *      1. RULON + daraja bor    → kesim qoidasi (maydon/eni/bo'yi)
 *      2. daraja + MIQDOR qoida → miqdor bosqichi
 *      3. qolgan holatda        → material narxi × miqdor
 *
 *    Tartib farq qilsa tekshiruvning o'zi yolg'on ogohlantirish
 *    berardi va egasi ro'yxatni o'qimay qo'yardi.
 *
 * ⚠️ BLOKLAMAYDI — `narxniTekshir` bilan bir xil qoida.
 */
export async function qoshimchaNarxiniTekshir(
  tx: Tranzaksiya,
  k: TekshirilayotganQoshimcha,
): Promise<NarxTekshiruvi> {
  const m = (
    await tx<
      {
        hisob_turi: string;
        narx_guruh_id: number | null;
        narx: string | null;
        valyuta: string;
      }[]
    >`
      SELECT m.hisob_turi, m.narx_guruh_id,
             COALESCE(tn.sotuv_narx::text, fn.sotuv_narx::text, m.sotuv_narx::text)
               AS narx,
             COALESCE(tn.valyuta, fn.valyuta, m.sotuv_valyuta) AS valyuta
        FROM material m
        LEFT JOIN material_filial_narx fn
               ON fn.material_id = m.id AND fn.filial_id = ${k.filialId}
        LEFT JOIN material_tur_narx tn
               ON tn.material_id = m.id
              AND tn.mijoz_turi_id = (
                SELECT mijoz_turi_id FROM mijoz WHERE id = ${k.mijozId})
       WHERE m.id = ${k.materialId}`
  )[0];

  if (m === undefined) return { qoldami: false, hisoblangan: null };

  const kursObyekti: Kurs | null =
    k.kursSnapshot === null ? null : kursYasa(k.kursSnapshot, new Date(), 'JORIY');

  const kesiladimi = m.hisob_turi === 'RULON';

  /** Daraja qoidasi — mijoz turiga qo'yilgani umumiysidan ustun (6.2) */
  const qoida =
    m.narx_guruh_id === null
      ? undefined
      : (
          await tx<
            { id: number; mijoz_turi_id: number | null; hisoblash_usuli: string }[]
          >`
            SELECT id, mijoz_turi_id, hisoblash_usuli
              FROM mahsulot_narx
             WHERE mahsulot_tur_id IS NULL
               AND narx_guruh_id = ${m.narx_guruh_id}
               AND faol = true
               AND (filial_id IS NULL OR filial_id = ${k.filialId})
               AND (mijoz_turi_id IS NULL
                    OR mijoz_turi_id = (
                      SELECT mijoz_turi_id FROM mijoz WHERE id = ${k.mijozId}))
             ORDER BY (mijoz_turi_id IS NULL), (filial_id IS NULL)`
        )[0];

  if (qoida !== undefined && (kesiladimi || qoida.hisoblash_usuli === 'MIQDOR')) {
    const bosqichlar = await tx<
      { dan: string; gacha: string | null; narx: string; valyuta: string }[]
    >`
      SELECT dan::text, gacha::text, narx::text, valyuta
        FROM mahsulot_narx_bosqich
       WHERE mahsulot_narx_id = ${qoida.id} AND faol = true
       ORDER BY dan`;

    let hisoblangan: string;
    try {
      hisoblangan = pozitsiyaQoidaNarxi({
        qoida: {
          hisoblashUsuli: qoida.hisoblash_usuli as HisoblashUsuli,
          bosqichlar: bosqichlar.map((b) => ({
            dan: Number(b.dan),
            gacha: b.gacha === null ? null : Number(b.gacha),
            narx: b.narx,
            valyuta: b.valyuta === 'USD' ? ('USD' as const) : ('SOM' as const),
          })),
        },
        eniM: k.eniM,
        boyiM: k.boyiM,
        miqdor: k.miqdor,
        qoshimchalar: [],
        /** ⚠️ TZ 6.3 — offset MATOGA, alohida sotuvga qo'llanmaydi */
        offset: null,
        kurs: kursObyekti,
      }).jami;
    } catch {
      /**
       * ⚠️ Bosqich topilmasa JIM O'TILADI. Bu «narx noto'g'ri»
       *    degani emas: egasi o'sha oraliqqa hali bosqich
       *    qo'ymagan bo'lishi mumkin va sotuvchi summani qo'lda
       *    kiritgan. Yolg'on ogohlantirish ro'yxatni shovqinga
       *    aylantirardi.
       */
      return { qoldami: false, hisoblangan: null };
    }

    return {
      qoldami: new Decimal(hisoblangan)
        .minus(new Decimal(k.narxSnapshot))
        .abs()
        .greaterThan(BAGRIKENGLIK_SOM),
      hisoblangan,
    };
  }

  /** Qoida yo'q — materialning o'z narxi × miqdor */
  if (m.narx === null) return { qoldami: false, hisoblangan: null };

  const birlik = katalogNarxi(m.narx, m.valyuta, kursObyekti);
  if (birlik === null) return { qoldami: false, hisoblangan: null };

  const jami = pulMatn(kopaytir(birlik, k.miqdor));

  return {
    qoldami: new Decimal(jami)
      .minus(new Decimal(k.narxSnapshot))
      .abs()
      .greaterThan(BAGRIKENGLIK_SOM),
    hisoblangan: jami,
  };
}
