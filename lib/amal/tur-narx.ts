/**
 * lib/amal/tur-narx.ts — TZ 5.4 · 6.2
 *
 * Material narxi MIJOZ TURI bo'yicha.
 *
 * ⚠️ `material_filial_narx` bilan BIR XIL NAQSH: yozuv bo'lsa —
 *    shu narx, bo'lmasa standart. Ikkalasi ham ixtiyoriy.
 *
 * ⚠️ Egasi (2026-08-30): «har mijoz turi uchun narx — spravochnikda
 *    nechta faol tur bo'lsa, shuncha maydon avtomatik chiqadi.
 *    Yangi tur qo'shilsa material formasi KOD O'ZGARISHISIZ yangi
 *    maydonni ko'rsatishi kerak».
 *
 *    Shuning uchun narxlar ustun emas, ALOHIDA JADVAL: yangi tur
 *    qo'shilganda migratsiya ham, kod ham o'zgarmaydi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';

export interface TurNarxi {
  readonly mijozTuriId: number;
  readonly turNomi: string;
  readonly narx: string | null;
  readonly valyuta: string;
  /** Tur o'chirilgan bo'lsa ham narx tarixda qoladi (2.3) */
  readonly faol: boolean;
}

/**
 * Material uchun HAR FAOL TURNING narxi.
 *
 * ⚠️ Narx qo'yilmagan tur ham qaytadi (`narx: null`) — forma
 *    bo'sh katak ko'rsatishi kerak, aks holda odam «bu tur
 *    qayerda?» deb hayron bo'lardi.
 */
export async function turNarxlari(
  soruvchi: postgres.Sql,
  materialId: number | null,
): Promise<readonly TurNarxi[]> {
  const q = await soruvchi<
    {
      mijoz_turi_id: number;
      tur_nomi: string;
      narx: string | null;
      valyuta: string;
      faol: boolean;
    }[]
  >`
    SELECT t.id AS mijoz_turi_id, t.nom AS tur_nomi,
           n.sotuv_narx::text AS narx,
           COALESCE(n.valyuta, 'SOM') AS valyuta,
           t.faol
    FROM mijoz_turi t
    LEFT JOIN material_tur_narx n
      ON n.mijoz_turi_id = t.id AND n.material_id = ${materialId}
    WHERE t.faol = true
    ORDER BY t.tartib, t.nom`;

  return q.map((x) => ({
    mijozTuriId: x.mijoz_turi_id,
    turNomi: x.tur_nomi,
    narx: x.narx,
    valyuta: x.valyuta,
    faol: x.faol,
  }));
}

export interface TurNarxKirimi {
  readonly mijozTuriId: number;
  /** Bo'sh — narx olib tashlanadi, standart ishlaydi */
  readonly narx: string | null;
  readonly valyuta: string;
}

/**
 * Material narxlarini turlar bo'yicha yozadi —
 * CHAQIRUVCHINING tranzaksiyasida (P-23).
 *
 * ⚠️ Bo'sh narx — yozuv O'CHIRILADI, nol emas. Nol yozilsa
 *    mahsulot bepul sotilardi; standartga qaytish esa aynan
 *    «bu tur uchun alohida narx yo'q» degani.
 *
 * ⚠️ Bu jadval spravochnik, harakat emas — shuning uchun
 *    `DELETE` mumkin (§3 dagi taqiq harakat jadvallariga
 *    tegishli: pul yoki ombor tarixiga).
 */
export async function turNarxlariniYozTx(
  tx: postgres.TransactionSql,
  materialId: number,
  qatorlar: readonly TurNarxKirimi[],
  xodimId: number,
): Promise<void> {
  for (const q of qatorlar) {
    if (q.narx === null || q.narx === '') {
      await tx`
        DELETE FROM material_tur_narx
        WHERE material_id = ${materialId} AND mijoz_turi_id = ${q.mijozTuriId}`;
      continue;
    }

    if (new Decimal(q.narx).isNegative()) {
      throw new BiznesXato('PUL_NOTOGRI', `tur narxi: ${q.narx}`);
    }

    await tx`
      INSERT INTO material_tur_narx
        (material_id, mijoz_turi_id, sotuv_narx, valyuta, yaratdi_id)
      VALUES (${materialId}, ${q.mijozTuriId}, ${q.narx}, ${q.valyuta}, ${xodimId})
      ON CONFLICT (material_id, mijoz_turi_id) DO UPDATE
        SET sotuv_narx = ${q.narx},
            valyuta = ${q.valyuta},
            ozgartirildi = now(),
            ozgartirdi_id = ${xodimId}`;
  }
}
