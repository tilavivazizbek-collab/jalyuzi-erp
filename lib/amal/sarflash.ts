/**
 * lib/amal/sarflash.ts — TZ 3.5 · 3.6 · §9.4
 *
 * OMBOR SARFLASHI SERVERDA QAYTA HISOBLANADI.
 *
 * ⚠️ NEGA KERAK
 *
 *    `sarflashHisobla` butun tizimda faqat BRAUZERDA chaqilardi
 *    (`forma.tsx`, `tahrir.tsx`). Server esa kelgan raqamni
 *    shunchaki `^\d+(\.\d+)?$` bilan tekshirib bazaga yozardi.
 *
 *    Ikki oqibati bor edi:
 *
 *    1. ESKI SAHIFA. Sotuvchining brauzerida ochiq turgan forma
 *       eski formulani ushlab qoladi. Admin formulani o'zgartirsa,
 *       o'sha sahifadan kelgan buyurtma ESKI sarflash bilan
 *       yoziladi — hech qanday belgi qoldirmasdan.
 *
 *    2. So'rovni qo'lda o'zgartirgan odam ombordan istalgan
 *       miqdorni yechdira olardi (§9.4 — «brauzerdan kelgan
 *       qiymatga ishonilmaydi»).
 *
 * ⚠️ NARX BU YERDA TEKSHIRILMAYDI. TZ 3.8 · 3.11 bo'yicha narxni
 *    sotuvchi QO'LDA qo'yadi — u mijoz bilan kelishilgan. Ombor
 *    sarflashi esa kelishuv emas, FORMULA natijasi.
 *
 * ⚠️ Formula BAZADAN olinadi, `formula_snapshot` dan emas: snapshot
 *    ham brauzerdan keladi. Snapshotdan faqat sotuvchi kiritgan
 *    PARAMETR qiymatlari olinadi — ular haqiqiy kirish ma'lumoti.
 */

import type postgres from 'postgres';
import { sm, type SarflashBirligi } from '@/lib/domain/birlik';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { BiznesXato } from '@/lib/xato';

/** Har birlik uchun ruxsat etilgan farq — o'nlik yaxlitlash uchun */
const BAGRIKENGLIK: Record<SarflashBirligi, number> = {
  KV_M: 0.0002,
  SM: 0.02,
  DONA: 0,
};

export interface TekshirilayotganSlot {
  readonly slotId: number;
  readonly materialId: number;
  readonly hisoblanganMiqdor: string;
  readonly birlik: string;
}

export interface TekshirilayotganPozitsiya {
  readonly mahsulotTurId: number;
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly soni: number;
  /** Sotuvchi kiritgan parametr qiymatlari shu yerda (4.10) */
  readonly formulaSnapshot: unknown;
  readonly slotlar: readonly TekshirilayotganSlot[];
}

/** `formula_snapshot` — brauzerdan kelgan JSON, shakli TEKSHIRILADI */
function parametrlarniOqi(xom: unknown): Map<string, number> {
  const natija = new Map<string, number>();
  if (typeof xom !== 'object' || xom === null) return natija;

  const p = (xom as { parametrlar?: unknown }).parametrlar;
  if (!Array.isArray(p)) return natija;

  for (const q of p as { kod?: unknown; qiymat?: unknown }[]) {
    if (typeof q.kod !== 'string') continue;
    const son = Number(q.qiymat);
    if (!Number.isFinite(son)) continue;
    natija.set(q.kod.toUpperCase(), son);
  }
  return natija;
}

/**
 * TZ 3.5 — pozitsiyaning har slot sarflashini qayta hisoblab,
 * kelgan raqam bilan solishtiradi.
 *
 * Mos kelmasa amal RAD ETILADI: sotuvchi sahifani yangilab qayta
 * kiritadi. Jimgina to'g'rilash XAVFLIROQ bo'lardi — sotuvchi
 * ekranda bir narxni ko'rib, bazaga boshqa miqdor tushardi.
 */
export async function sarflashniTekshir(
  tx: postgres.TransactionSql,
  p: TekshirilayotganPozitsiya,
): Promise<void> {
  // Qo'shimcha buyum — formulasi ham, sloti ham yo'q (3.10)
  if (p.slotlar.length === 0) return;

  const slotlar = await tx<{ id: number; nom: string; formula: string }[]>`
    SELECT id, nom, formula FROM mahsulot_slot
    WHERE mahsulot_tur_id = ${p.mahsulotTurId} AND faol = true`;

  const formulalar = new Map(slotlar.map((s) => [s.id, s]));

  const parametrlar = await tx<{ kod: string; standart_qiymat: string | null }[]>`
    SELECT kod, standart_qiymat::text FROM mahsulot_parametr
    WHERE mahsulot_tur_id = ${p.mahsulotTurId} AND faol = true`;

  /**
   * ⚠️ Faqat MAHSULOT TURIGA tegishli parametrlar qabul qilinadi.
   *    Aks holda so'rovga o'ylab topilgan kod qo'shib, formulani
   *    boshqa yo'lga burish mumkin bo'lardi.
   */
  const kelgan = parametrlarniOqi(p.formulaSnapshot);
  const qiymatlar: Record<string, number> = {};
  for (const par of parametrlar) {
    const q = kelgan.get(par.kod.toUpperCase());
    qiymatlar[par.kod.toUpperCase()] =
      q ?? (par.standart_qiymat === null ? 0 : Number(par.standart_qiymat));
  }

  const asos = standartQiymatlar(
    sm(p.eniSm),
    sm(p.boyiSm),
    p.soni,
    qiymatlar,
  );

  // Materialning sarflash birligi ham BAZADAN — brauzerdan emas
  const materiallar = await tx<{ id: number; sarflash_birligi: string }[]>`
    SELECT id, sarflash_birligi FROM material
    WHERE id = ANY(${p.slotlar.map((s) => s.materialId)})`;
  const birliklar = new Map(materiallar.map((m) => [m.id, m.sarflash_birligi]));

  for (const s of p.slotlar) {
    const slot = formulalar.get(s.slotId);
    if (slot === undefined) {
      throw new BiznesXato('SARFLASH_MOS_EMAS', `slot ${String(s.slotId)} bu mahsulotga tegishli emas`);
    }

    const birlik = birliklar.get(s.materialId);
    if (birlik === undefined) {
      throw new BiznesXato('MATERIAL_TOPILMADI', String(s.materialId));
    }
    if (birlik !== s.birlik) {
      throw new BiznesXato(
        'SARFLASH_MOS_EMAS',
        `${slot.nom}: birlik ${s.birlik} emas, ${birlik}`,
      );
    }

    const kutilgan = Number(
      sarflashHisobla(slot.formula, asos, birlik as SarflashBirligi),
    );
    const berilgan = Number(s.hisoblanganMiqdor);
    const farq = Math.abs(kutilgan - berilgan);

    if (farq > BAGRIKENGLIK[birlik as SarflashBirligi]) {
      throw new BiznesXato(
        'SARFLASH_MOS_EMAS',
        `${slot.nom}: kutilgan ${kutilgan.toFixed(4)}, kelgan ${berilgan.toFixed(4)}`,
      );
    }
  }
}
