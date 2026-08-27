/**
 * lib/amal/filial-narx.ts — TZ 20.9 · Q-28
 *
 * Material narxining filial istisnosi.
 *
 * ⚠️ Q-28 — «standart umumiy, filial o'zgartirishi mumkin». Qator YO'Q
 *    bo'lsa standart narx ishlaydi (20.9.1). Shuning uchun «standartga
 *    qaytarish» — bu qatorni o'chirish, nol yozish EMAS.
 *
 * ⚠️ Bu spravochnik jadvali (harakat emas), shuning uchun §6.5 dagi
 *    «DELETE yo'q» qoidasi tegmaydi: narx istisnosi balans emas, uning
 *    tarixi `audit_jurnal` da qoladi (2.4).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';

export interface FilialNarxi {
  readonly filialId: number;
  readonly filialNomi: string;
  /** `null` — istisno yo'q, standart ishlaydi */
  readonly narx: string | null;
}

/** 20.9.2 — material kartochkasidagi ro'yxat: har filial va uning narxi. */
export async function filialNarxlari(
  ulanish: postgres.Sql,
  materialId: number,
): Promise<readonly FilialNarxi[]> {
  const q = await ulanish<
    { filial_id: number; filial_nomi: string; narx: string | null }[]
  >`
    SELECT f.id AS filial_id, f.nom AS filial_nomi, n.sotuv_narx::text AS narx
    FROM filial f
    LEFT JOIN material_filial_narx n
           ON n.material_id = ${materialId} AND n.filial_id = f.id
    WHERE f.faol = true
    ORDER BY f.bosh DESC, f.nom`;

  return q.map((r) => ({
    filialId: r.filial_id,
    filialNomi: r.filial_nomi,
    narx: r.narx,
  }));
}

/**
 * TZ 20.9.1 — filial narxini belgilash yoki olib tashlash.
 *
 * `narx === null` — istisno olib tashlanadi va filial standart narxga
 * qaytadi. «Bosh filialda standart o'zgarsa, o'z narxini qo'ymagan
 * filiallarga avtomatik tarqaladi» — aynan shu tufayli ishlaydi.
 */
export async function filialNarxiBelgila(
  ulanish: postgres.Sql,
  kirim: {
    readonly materialId: number;
    readonly filialId: number;
    readonly narx: string | null;
  },
  xodimId: number,
): Promise<{ ozgardimi: boolean }> {
  if (kirim.narx !== null && new Decimal(kirim.narx).isNegative()) {
    throw new BiznesXato('PUL_NOTOGRI', 'filial narxi');
  }

  return ulanish.begin(async (tx) => {
    const material = await tx<
      { nom: string; sotuv_narx: string | null; sotuv_valyuta: string }[]
    >`
      SELECT nom, sotuv_narx::text, sotuv_valyuta
      FROM material WHERE id = ${kirim.materialId}`;
    if (material[0] === undefined) {
      throw new BiznesXato('MATERIAL_TOPILMADI', String(kirim.materialId));
    }

    const eski = await tx<{ sotuv_narx: string }[]>`
      SELECT sotuv_narx::text FROM material_filial_narx
      WHERE material_id = ${kirim.materialId} AND filial_id = ${kirim.filialId}`;

    const eskiNarx = eski[0]?.sotuv_narx ?? null;

    /**
     * Hech narsa o'zgarmadi — jurnalni behuda to'ldirmaymiz.
     *
     * ⚠️ Taqqoslash MATN bilan emas, SON bilan: baza `NUMERIC(14,2)` ni
     *    `113000.00` bo'lib qaytaradi, formadan esa `113000` keladi.
     *    Matn taqqoslansa har saqlash «o'zgardi» bo'lib chiqardi.
     */
    const birxil =
      eskiNarx === null
        ? kirim.narx === null
        : kirim.narx !== null && new Decimal(eskiNarx).equals(kirim.narx);

    if (birxil) return { ozgardimi: false };

    if (kirim.narx === null) {
      await tx`
        DELETE FROM material_filial_narx
        WHERE material_id = ${kirim.materialId} AND filial_id = ${kirim.filialId}`;
    } else {
      await tx`
        /*
         * ⚠️ Valyuta MATERIALDAN meros olinadi. Q-28: filial narxni
         *   o'zgartira oladi, lekin VALYUTANI emas — chet mato
         *   filialda birdan so'mga aylanib qolmasligi kerak.
         *   Aks holda ikkalasi aralashib ketardi (1.3-invariant).
         */
        INSERT INTO material_filial_narx (material_id, filial_id, sotuv_narx,
                                          valyuta, yaratdi_id)
        VALUES (${kirim.materialId}, ${kirim.filialId}, ${kirim.narx},
                ${material[0]?.sotuv_valyuta ?? 'SOM'}, ${xodimId})
        ON CONFLICT (material_id, filial_id)
        DO UPDATE SET sotuv_narx = EXCLUDED.sotuv_narx,
                      valyuta = EXCLUDED.valyuta,
                      ozgartirildi = now(), ozgartirdi_id = ${xodimId}`;
    }

    // 2.4 — narx o'zgarishi har doim jurnalda qoladi
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${kirim.filialId}, 'NARX_OZGARTIRISH', 'material',
              ${kirim.materialId},
              ${tx.json({ filialNarxi: eskiNarx })},
              ${tx.json({ filialNarxi: kirim.narx })},
              ${material[0].nom})`;

    return { ozgardimi: true };
  });
}
