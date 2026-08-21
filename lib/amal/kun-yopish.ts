/**
 * lib/amal/kun-yopish.ts — TZ 12.17 · K-09 · 2.1 · 2.2-invariant
 *
 * «Kassaning yuragi. Har sotuvchi o'z kassasini yopadi.»
 *
 * ⚠️ TZ 12.17 — «Yopilgan kunga ORQADAN YOZUV QO'SHIB BO'LMAYDI. Aks
 *    holda kechagi farqni bugun "tuzatib" qo'yish mumkin bo'ladi va
 *    butun mexanizm ma'nosini yo'qotadi.»
 *
 * ⚠️ «Farq bo'lsa izoh MAJBURIY, lekin yopish BLOKLANMAYDI. Sotuvchini
 *    uyiga qo'ymay turib bo'lmaydi.»
 */

import type postgres from 'postgres';
import { kunFarqi, kunHisobi } from '@/lib/domain/balans';
import { pulMatn, som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

/**
 * `Sql` ham, `TransactionSql` ham so'rov yubora oladi.
 *
 * ⚠️ `as unknown as` kastini ishlatmaslik uchun ATAYLAB union: kast
 *    turlar himoyasini o'chiradi va keyin xato jimgina o'tib ketadi.
 */
export type Soruvchi = postgres.Sql | postgres.TransactionSql;

export interface KunHolati {
  readonly kassaId: number;
  readonly kassaNomi: string;
  readonly valyuta: string;
  readonly sana: string;
  readonly boshlangich: string;
  readonly kirim: string;
  readonly chiqim: string;
  readonly hisoblangan: string;
  readonly yopilganmi: boolean;
}

/**
 * TZ 12.17 — kun oxiridagi hisob.
 *
 * ⚠️ 2.2-invariant — boshlang'ich qoldiq SAQLANMAYDI: u shu sanagacha
 *    bo'lgan barcha yozuvning yig'indisi. Aks holda ikki manba paydo
 *    bo'lardi va ular ajralib ketishi mumkin edi.
 */
export async function kunHolati(
  ulanish: Soruvchi,
  kassaId: number,
  sana: string,
): Promise<KunHolati> {
  const k = await ulanish<{ nom: string; valyuta: string }[]>`
    SELECT nom, valyuta FROM kassa WHERE id = ${kassaId}`;

  const kassa = k[0];
  if (kassa === undefined) throw new BiznesXato('KASSA_TOPILMADI', String(kassaId));

  const q = await ulanish<
    { boshlangich: string; kirim: string; chiqim: string }[]
  >`
    SELECT
      COALESCE(SUM(summa) FILTER (WHERE sana::date < ${sana}::date), 0)::text
        AS boshlangich,
      COALESCE(SUM(summa) FILTER (WHERE sana::date = ${sana}::date AND summa > 0), 0)::text
        AS kirim,
      COALESCE(ABS(SUM(summa) FILTER (WHERE sana::date = ${sana}::date AND summa < 0)), 0)::text
        AS chiqim
    FROM kassa_yozuv WHERE kassa_id = ${kassaId}`;

  const r = q[0] ?? { boshlangich: '0', kirim: '0', chiqim: '0' };

  // §2.2 — hisob DOMAINDA, bu yerda takrorlanmaydi
  const h = kunHisobi(som(r.boshlangich), som(r.kirim), som(r.chiqim));

  const yopiq = await ulanish<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_kun
    WHERE kassa_id = ${kassaId} AND sana = ${sana} AND yopildi IS NOT NULL`;

  return {
    kassaId,
    kassaNomi: kassa.nom,
    valyuta: kassa.valyuta,
    sana,
    boshlangich: pulMatn(h.boshlangich),
    kirim: pulMatn(h.kirim),
    chiqim: pulMatn(h.chiqim),
    hisoblangan: pulMatn(h.hisoblangan),
    yopilganmi: (yopiq[0]?.n ?? 0) > 0,
  };
}

export interface YopishNatijasi {
  readonly kunId: number;
  readonly hisoblangan: string;
  readonly sanaldi: string;
  readonly farq: string;
  readonly farqBormi: boolean;
}

/**
 * TZ 12.17 — kunni yopadi.
 *
 * ⚠️ Farq bo'lsa IZOH MAJBURIY — lekin bu yopishni BLOKLAMAYDI, faqat
 *    izohsiz yopib bo'lmaydi. Farqning o'zi normal hodisa.
 */
export async function kunniYop(
  ulanish: postgres.Sql,
  kirim: {
    readonly kassaId: number;
    readonly sana: string;
    readonly sanaldi: string;
    readonly izoh: string | null;
  },
  xodimId: number,
): Promise<YopishNatijasi> {
  return ulanish.begin(async (tx) => {
    const bor = await tx<{ id: number; yopildi: Date | null }[]>`
      SELECT id, yopildi FROM kassa_kun
      WHERE kassa_id = ${kirim.kassaId} AND sana = ${kirim.sana}
      FOR UPDATE`;

    if (bor[0]?.yopildi !== null && bor[0]?.yopildi !== undefined) {
      throw new BiznesXato('KUN_YOPILGAN', kirim.sana);
    }

    const h = await kunHolati(tx, kirim.kassaId, kirim.sana);

    const farq = kunFarqi(som(h.hisoblangan), som(kirim.sanaldi));
    const farqBormi = Number(pulMatn(farq)) !== 0;

    // TZ 12.17 — farq bo'lsa izoh MAJBURIY
    if (farqBormi && (kirim.izoh === null || kirim.izoh.trim() === '')) {
      throw new BiznesXato('KUN_IZOH_KERAK', pulMatn(farq));
    }

    const yangi = await tx<{ id: number }[]>`
      INSERT INTO kassa_kun (kassa_id, sana, boshlangich, kirim, chiqim,
                             hisoblangan, sanaldi, farq, yopildi, yopdi_id,
                             izoh, yaratdi_id)
      VALUES (${kirim.kassaId}, ${kirim.sana}, ${h.boshlangich}, ${h.kirim},
              ${h.chiqim}, ${h.hisoblangan}, ${kirim.sanaldi}, ${pulMatn(farq)},
              now(), ${xodimId}, ${kirim.izoh}, ${xodimId})
      ON CONFLICT (kassa_id, sana) DO UPDATE
        SET boshlangich = EXCLUDED.boshlangich, kirim = EXCLUDED.kirim,
            chiqim = EXCLUDED.chiqim, hisoblangan = EXCLUDED.hisoblangan,
            sanaldi = EXCLUDED.sanaldi, farq = EXCLUDED.farq,
            yopildi = now(), yopdi_id = ${xodimId}, izoh = EXCLUDED.izoh,
            ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      RETURNING id`;

    const kunId = yangi[0]?.id;
    if (kunId === undefined) throw new BiznesXato('KUN_SAQLANMADI', kirim.sana);

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId},
              (SELECT filial_id FROM kassa WHERE id = ${kirim.kassaId}),
              'KUN_YOPILDI', 'kassa_kun', ${kunId},
              ${tx.json({
                sana: kirim.sana,
                hisoblangan: h.hisoblangan,
                sanaldi: kirim.sanaldi,
                farq: pulMatn(farq),
              })},
              ${kirim.izoh})`;

    return {
      kunId,
      hisoblangan: h.hisoblangan,
      sanaldi: kirim.sanaldi,
      farq: pulMatn(farq),
      farqBormi,
    };
  });
}

/**
 * TZ 12.17 — «Yopilgan kunga ORQADAN YOZUV QO'SHIB BO'LMAYDI.»
 *
 * Kassa yozuvi qo'shishdan oldin chaqiriladi.
 */
export async function kunYopiqmi(
  ulanish: Soruvchi,
  kassaId: number,
  sana: string,
): Promise<boolean> {
  const q = await ulanish<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM kassa_kun
    WHERE kassa_id = ${kassaId} AND sana = ${sana} AND yopildi IS NOT NULL`;
  return (q[0]?.n ?? 0) > 0;
}

/**
 * TZ 12.17 — «Kerak bo'lsa ADMIN kunni qayta ochadi — sabab MAJBURIY,
 * audit jurnaliga tushadi.»
 */
export async function kunniQaytaOch(
  ulanish: postgres.Sql,
  kunId: number,
  sabab: string,
  adminId: number,
): Promise<void> {
  if (sabab.trim() === '') {
    throw new BiznesXato('KUN_IZOH_KERAK', 'qayta ochish sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const q = await tx<{ id: number; kassa_id: number; yopildi: Date | null }[]>`
      SELECT id, kassa_id, yopildi FROM kassa_kun WHERE id = ${kunId} FOR UPDATE`;

    const k = q[0];
    if (k === undefined) throw new BiznesXato('KUN_TOPILMADI', String(kunId));
    if (k.yopildi === null) throw new BiznesXato('KUN_YOPILMAGAN', String(kunId));

    await tx`
      UPDATE kassa_kun
      SET yopildi = NULL, qayta_ochildi = now(),
          ozgartirildi = now(), ozgartirdi_id = ${adminId}
      WHERE id = ${kunId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${adminId},
              (SELECT filial_id FROM kassa WHERE id = ${k.kassa_id}),
              'KUN_QAYTA_OCHILDI', 'kassa_kun', ${kunId},
              ${tx.json({ yopildi: true })},
              ${tx.json({ yopildi: false })},
              ${sabab.trim()})`;
  });
}
