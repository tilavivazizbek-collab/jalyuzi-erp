/**
 * lib/amal/xarid.ts — xarid buyurtmasi (0063). Ombor auditi 2026-10-07, 7-band.
 *
 * ⚠️ PUL YO'Q. Buyurtma qarz ham, tannarx ham, qoldiq ham yozmaydi —
 *    bular faqat kirim bilan (7.9, 9.2). Shuning uchun buyurtma
 *    jadvaliga UPDATE ruxsat (harakat jadvali emas); har qaror audit
 *    jurnaliga tushadi.
 *
 * ⚠️ «Qancha keldi» SAQLANMAYDI — `lib/domain/xarid.ts` FAOL kirimlardan
 *    hisoblaydi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';

export interface XaridQatorKirimi {
  readonly materialId: number;
  /** Kirim birligida, `numeric` matn */
  readonly miqdor: string;
  /** Kelishilgan narx, buyurtma valyutasida; `null` — kelganda aniqlanadi */
  readonly narxBirlik: string | null;
  /** Narx nimaga: rulonga, metrga, kv.m ga (7.9) */
  readonly narxAsosi: 'BIRLIK' | 'METR' | 'KV_M';
}

export interface XaridKirimi {
  readonly filialId: number;
  readonly yetkazibBeruvchiId: number;
  readonly sana: string;
  readonly kutilganSana: string | null;
  readonly valyuta: 'SOM' | 'USD';
  readonly izoh: string | null;
  readonly qatorlar: readonly XaridQatorKirimi[];
}

const bosh = (x: string | null): string | null =>
  x === null || x.trim() === '' ? null : x.trim();

export async function xaridYarat(
  ulanish: postgres.Sql,
  k: XaridKirimi,
  xodimId: number,
): Promise<{ id: number; raqam: string }> {
  if (k.qatorlar.length === 0) throw new BiznesXato('XARID_BOSH');
  const idlar = k.qatorlar.map((q) => q.materialId);
  if (new Set(idlar).size !== idlar.length) throw new BiznesXato('XARID_TAKROR_MATERIAL');
  for (const q of k.qatorlar) {
    if (!new Decimal(q.miqdor).gt(0)) throw new BiznesXato('XARID_BOSH', 'miqdor noldan katta bo‘lsin');
  }

  return ulanish.begin(async (tx) => {
    const y = await tx<{ id: number }[]>`
      SELECT id FROM yetkazib_beruvchi WHERE id = ${k.yetkazibBeruvchiId} AND faol`;
    if (y[0] === undefined) throw new BiznesXato('YETKAZIB_TOPILMADI', String(k.yetkazibBeruvchiId));

    const m = await tx<{ id: number }[]>`
      SELECT id FROM material WHERE id = ANY(${idlar}) AND faol`;
    if (m.length !== idlar.length) {
      const bor = new Set(m.map((x) => x.id));
      throw new BiznesXato('MATERIAL_TOPILMADI', String(idlar.find((i) => !bor.has(i)) ?? ''));
    }

    const h = await tx<{ id: number; raqam: string }[]>`
      INSERT INTO xarid_buyurtma (raqam, filial_id, yetkazib_beruvchi_id, sana, kutilgan_sana,
                                  valyuta, izoh, yaratdi_id)
      VALUES ('XB-' || nextval('xarid_buyurtma_raqam_seq'), ${k.filialId}, ${k.yetkazibBeruvchiId},
              ${k.sana}, ${k.kutilganSana}, ${k.valyuta}, ${bosh(k.izoh)}, ${xodimId})
      RETURNING id, raqam`;
    const hujjat = h[0];
    if (hujjat === undefined) throw new BiznesXato('XARID_TOPILMADI');

    for (const q of k.qatorlar) {
      await tx`
        INSERT INTO xarid_buyurtma_qator (xarid_buyurtma_id, material_id, miqdor, narx_birlik,
                                          narx_asosi, yaratdi_id)
        VALUES (${hujjat.id}, ${q.materialId}, ${q.miqdor}, ${q.narxBirlik}, ${q.narxAsosi}, ${xodimId})`;
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${k.filialId}, 'YARATISH', 'xarid_buyurtma', ${hujjat.id},
              ${tx.json({ qatorlar: k.qatorlar.length })}, ${`${hujjat.raqam} yaratildi`})`;
    return hujjat;
  });
}

/**
 * Buyurtmani yopish yoki bekor qilish.
 *
 * - `YOPILDI` — «qolgani kelmaydi» (kam keldi, yetkazib beruvchida tugadi).
 *   Kelgani kirimda qoladi.
 * - `BEKOR` — buyurtma umuman bo'lmadi. ⚠️ Bog'langan FAOL kirim bo'lsa
 *   bekor qilinmaydi: mol kelgan, hujjat yolg'on bo'lib qolardi.
 *
 * ⚠️ Sabab SHART — ikkalasi ham «nega kutmayapmiz» degan savolga javob.
 */
export async function xaridniYop(
  ulanish: postgres.Sql,
  k: {
    readonly id: number;
    readonly filialId: number;
    readonly qaror: 'YOPILDI' | 'BEKOR';
    readonly sabab: string;
  },
  xodimId: number,
): Promise<void> {
  const sabab = k.sabab.trim();
  if (sabab === '') throw new BiznesXato('XARID_SABAB_KERAK');

  await ulanish.begin(async (tx) => {
    const b = await tx<{ raqam: string; holat: string }[]>`
      SELECT raqam, holat FROM xarid_buyurtma
      WHERE id = ${k.id} AND filial_id = ${k.filialId}
      FOR UPDATE`;
    const hujjat = b[0];
    if (hujjat === undefined) throw new BiznesXato('XARID_TOPILMADI', String(k.id));
    if (hujjat.holat !== 'OCHIQ') throw new BiznesXato('XARID_YOPIQ', hujjat.raqam);

    if (k.qaror === 'BEKOR') {
      const kirim = await tx<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM kirim
        WHERE xarid_buyurtma_id = ${k.id} AND holat = 'FAOL'`;
      if ((kirim[0]?.n ?? 0) > 0) throw new BiznesXato('XARID_KIRIM_BOR', hujjat.raqam);
    }

    await tx`
      UPDATE xarid_buyurtma
         SET holat = ${k.qaror}, yopish_sabab = ${sabab}, yopildi = now(), yopdi_id = ${xodimId},
             ozgartirildi = now(), ozgartirdi_id = ${xodimId}
       WHERE id = ${k.id}`;
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${k.filialId}, 'TAHRIRLASH', 'xarid_buyurtma', ${k.id},
              ${tx.json({ holat: 'OCHIQ' })}, ${tx.json({ holat: k.qaror })},
              ${`${hujjat.raqam}: ${sabab}`})`;
  });
}

/**
 * Kirim buyurtmaga bog'lanishidan oldin — `kirimYarat` tranzaksiyasi
 * ICHIDA chaqiriladi.
 *
 * ⚠️ `FOR UPDATE` — shu payt boshqa odam buyurtmani yopayotgan bo'lsa,
 *    kirim yopilgan buyurtmaga bog'lanib qolmaydi.
 */
export async function xaridKirimgaMosmiTx(
  tx: postgres.TransactionSql,
  k: { readonly id: number; readonly filialId: number; readonly yetkazibBeruvchiId: number },
): Promise<void> {
  const b = await tx<{ raqam: string; holat: string; yetkazib_beruvchi_id: number }[]>`
    SELECT raqam, holat, yetkazib_beruvchi_id FROM xarid_buyurtma
    WHERE id = ${k.id} AND filial_id = ${k.filialId}
    FOR UPDATE`;
  const hujjat = b[0];
  if (hujjat === undefined) throw new BiznesXato('XARID_TOPILMADI', String(k.id));
  if (hujjat.holat !== 'OCHIQ') throw new BiznesXato('XARID_YOPIQ', hujjat.raqam);
  if (hujjat.yetkazib_beruvchi_id !== k.yetkazibBeruvchiId) {
    throw new BiznesXato('XARID_YETKAZIB_FARQ', hujjat.raqam);
  }
}
