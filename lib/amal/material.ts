/**
 * lib/amal/material.ts — TZ 5 · 2.1-invariant · TZ 2.4
 *
 * Material yaratish, tahrirlash va nofaol qilish.
 *
 * Har o'zgarish AUDIT JURNALIGA tushadi va u yozuv bilan BIR TRANZAKSIYADA
 * yoziladi (QISM 1 §10) — aks holda o'zgarish saqlanib, jurnal yozuvi
 * yozilmay qolishi mumkin.
 */

import type postgres from 'postgres';
import { farqniAjrat, ozgarishBormi, type Qiymatlar } from '@/lib/audit/amallar';
import type { MaterialKirimi } from '@/lib/sxema/material';
import type { RasmNatijasi } from '@/lib/domain/rasm';
import { BiznesXato } from '@/lib/xato';

export interface MaterialQatori {
  readonly id: number;
  readonly nom: string;
  readonly hisob_turi: string;
  readonly kirim_birligi: string;
  readonly sarflash_birligi: string;
  readonly koeffitsient: string;
  readonly sotuv_narx: string | null;
  readonly sotuv_valyuta: string;
  readonly min_ustama_foiz: string | null;
  readonly yaroqsiz_chegara_m: string | null;
  readonly kam_ishlatiladigan_m: string | null;
  readonly kam_qoldiq_chegara_m: string | null;
  readonly standart_rulon_eni_m: string | null;
  readonly odatdagi_rulon_boyi_m: string | null;
  readonly kutilayotgan_kelish_narx: string | null;
  readonly kutilayotgan_kelish_valyuta: string;
  readonly almashtirish_guruh_id: number | null;
  readonly yaxlitlash_qadami: string | null;
  readonly kirim_narx_asosi: string;
  readonly faol: boolean;
}

/** Formaga tushadigan maydonlar — audit farqi shular bo'yicha hisoblanadi. */
function auditQiymatlari(m: MaterialQatori): Qiymatlar {
  return {
    nom: m.nom,
    hisob_turi: m.hisob_turi,
    kirim_birligi: m.kirim_birligi,
    sarflash_birligi: m.sarflash_birligi,
    koeffitsient: m.koeffitsient,
    sotuv_narx: m.sotuv_narx,
    sotuv_valyuta: m.sotuv_valyuta,
    /**
     * ⚠️ Narx o'zgarishi audit jurnaliga TUSHISHI shart — kim,
     *    qachon va nechadan nechaga o'zgartirganini keyin
     *    topib bo'lmasa, narx bahsi hal qilinmaydi.
     */
    kutilayotgan_kelish_narx: m.kutilayotgan_kelish_narx,
    kutilayotgan_kelish_valyuta: m.kutilayotgan_kelish_valyuta,
    min_ustama_foiz: m.min_ustama_foiz,
    yaroqsiz_chegara_m: m.yaroqsiz_chegara_m,
    kam_ishlatiladigan_m: m.kam_ishlatiladigan_m,
    kam_qoldiq_chegara_m: m.kam_qoldiq_chegara_m,
    standart_rulon_eni_m: m.standart_rulon_eni_m,
    odatdagi_rulon_boyi_m: m.odatdagi_rulon_boyi_m,
    almashtirish_guruh_id: m.almashtirish_guruh_id,
    yaxlitlash_qadami: m.yaxlitlash_qadami,
    kirim_narx_asosi: m.kirim_narx_asosi,
  };
}

const yoNull = (x: string | undefined): string | null => x ?? null;

export async function materialYarat(
  ulanish: postgres.Sql,
  kirim: MaterialKirimi,
  xodimId: number,
  rasm: RasmNatijasi | 'OCHIR' | null = null,
): Promise<number> {
  return ulanish.begin(async (tx) => {
    const qator = await tx<{ id: number }[]>`
      INSERT INTO material (
        nom, hisob_turi, kirim_birligi, sarflash_birligi, koeffitsient,
        sotuv_narx, sotuv_valyuta,
        kutilayotgan_kelish_narx, kutilayotgan_kelish_valyuta,
        min_ustama_foiz,
        yaroqsiz_chegara_m, kam_ishlatiladigan_m, kam_qoldiq_chegara_m,
        standart_rulon_eni_m, odatdagi_rulon_boyi_m,
        almashtirish_guruh_id, yaxlitlash_qadami, kirim_narx_asosi,
        yaratdi_id
      ) VALUES (
        ${kirim.nom}, ${kirim.hisobTuri}, ${kirim.kirimBirligi},
        ${kirim.sarflashBirligi}, ${kirim.koeffitsient},
        ${yoNull(kirim.sotuvNarx)}, ${kirim.sotuvValyuta},
        ${yoNull(kirim.kutilayotganKelishNarx)}, ${kirim.kutilayotganKelishValyuta},
        ${yoNull(kirim.minUstamaFoiz)},
        ${yoNull(kirim.yaroqsizChegaraM)}, ${yoNull(kirim.kamIshlatiladiganM)},
        ${yoNull(kirim.kamQoldiqChegaraM)}, ${yoNull(kirim.standartRulonEniM)},
        ${yoNull(kirim.odatdagiRulonBoyiM)},
        ${kirim.almashtirishGuruhId ?? null}, ${yoNull(kirim.yaxlitlashQadami)},
        ${kirim.kirimNarxAsosi},
        ${xodimId}
      ) RETURNING id`;

    const id = qator[0]?.id;

    /**
     * ⚠️ Rasm ALOHIDA yoziladi, lekin AYNI tranzaksiyada: material
     *    saqlanib rasm yozilmay qolsa, odam «rasm yuklandi» deb
     *    o'ylab yurardi (2.1-invariant).
     */
    if (id !== undefined && rasm !== null && rasm !== 'OCHIR') {
      await tx`
        UPDATE material SET rasm = ${rasm.baytlar}, rasm_turi = ${rasm.turi}
        WHERE id = ${id}`;
    }

    if (id === undefined) {
      throw new BiznesXato('MATERIAL_SAQLANMADI');
    }
    return id;
  });
}

export type TahrirNatijasi =
  | { readonly holat: 'SAQLANDI' }
  | { readonly holat: 'OZGARISH_YOQ' }
  | { readonly holat: 'BIRLIK_OZGARMAYDI'; readonly qoldiq: number };

/**
 * TZ 5.3 — «Qoldiq 0 dan katta bo'lsa hisob turi va birliklar
 * O'ZGARTIRILMAYDI — tugma bloklanadi va sabab ko'rsatiladi.»
 *
 * Sabab: qoldiq bir birlikda yozilgan, birlik almashsa raqam ma'nosini
 * yo'qotadi va ombor hisobi buziladi.
 *
 * ⚠️ 3-bosqichgacha `bolak` jadvali yo'q, shuning uchun qoldiq hozircha
 * har doim 0. Jadval paydo bo'lgach shu funksiya uni o'qiy boshlaydi —
 * tekshiruvning O'ZI hozirdan turadi.
 */
async function qoldiqSoni(tx: postgres.TransactionSql, materialId: number): Promise<number> {
  const bor = await tx<{ mavjud: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'bolak'
    ) AS mavjud`;
  if (bor[0]?.mavjud !== true) return 0;

  const q = await tx<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM bolak
    WHERE material_id = ${materialId} AND faol = true`;
  return q[0]?.n ?? 0;
}

export async function materialTahrirla(
  ulanish: postgres.Sql,
  materialId: number,
  kirim: MaterialKirimi,
  xodimId: number,
  filialId: number,
  /**
   * Katalog rasmi — TZ 3.3.
   *
   * ⚠️ `null` — rasm o'zgarmadi, `'OCHIR'` — olib tashlandi.
   *    Zod sxemasidan ALOHIDA keladi: baytlarni matn tekshiruvidan
   *    o'tkazishning ma'nosi yo'q.
   */
  rasm: RasmNatijasi | 'OCHIR' | null = null,
): Promise<TahrirNatijasi> {
  return ulanish.begin(async (tx) => {
    const oldingi = await tx<MaterialQatori[]>`
      SELECT * FROM material WHERE id = ${materialId} FOR UPDATE`;
    const eski = oldingi[0];
    if (eski === undefined) {
      throw new BiznesXato('MATERIAL_TOPILMADI', String(materialId));
    }

    const birlikOzgardi =
      eski.hisob_turi !== kirim.hisobTuri ||
      eski.kirim_birligi !== kirim.kirimBirligi ||
      eski.sarflash_birligi !== kirim.sarflashBirligi ||
      eski.koeffitsient !== kirim.koeffitsient;

    if (birlikOzgardi) {
      const qoldiq = await qoldiqSoni(tx, materialId);
      if (qoldiq > 0) {
        return { holat: 'BIRLIK_OZGARMAYDI', qoldiq } as const;
      }
    }

    await tx`
      UPDATE material SET
        nom = ${kirim.nom},
        hisob_turi = ${kirim.hisobTuri},
        kirim_birligi = ${kirim.kirimBirligi},
        sarflash_birligi = ${kirim.sarflashBirligi},
        koeffitsient = ${kirim.koeffitsient},
        sotuv_narx = ${yoNull(kirim.sotuvNarx)},
        sotuv_valyuta = ${kirim.sotuvValyuta},
        kutilayotgan_kelish_narx = ${yoNull(kirim.kutilayotganKelishNarx)},
        kutilayotgan_kelish_valyuta = ${kirim.kutilayotganKelishValyuta},
        min_ustama_foiz = ${yoNull(kirim.minUstamaFoiz)},
        yaroqsiz_chegara_m = ${yoNull(kirim.yaroqsizChegaraM)},
        kam_ishlatiladigan_m = ${yoNull(kirim.kamIshlatiladiganM)},
        kam_qoldiq_chegara_m = ${yoNull(kirim.kamQoldiqChegaraM)},
        standart_rulon_eni_m = ${yoNull(kirim.standartRulonEniM)},
        odatdagi_rulon_boyi_m = ${yoNull(kirim.odatdagiRulonBoyiM)},
        almashtirish_guruh_id = ${kirim.almashtirishGuruhId ?? null},
        yaxlitlash_qadami = ${yoNull(kirim.yaxlitlashQadami)},
        kirim_narx_asosi = ${kirim.kirimNarxAsosi},
        ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${materialId}`;

    /**
     * ⚠️ Uch holat: `null` — tegilmaydi, `'OCHIR'` — tozalanadi,
     *    aks holda yangisi yoziladi. Ikkinchisisiz rasmni olib
     *    tashlab bo'lmasdi.
     */
    if (rasm === 'OCHIR') {
      await tx`
        UPDATE material SET rasm = NULL, rasm_turi = NULL WHERE id = ${materialId}`;
    } else if (rasm !== null) {
      await tx`
        UPDATE material SET rasm = ${rasm.baytlar}, rasm_turi = ${rasm.turi}
        WHERE id = ${materialId}`;
    }

    const yangilangan = await tx<MaterialQatori[]>`
      SELECT * FROM material WHERE id = ${materialId}`;
    const yangi = yangilangan[0];
    if (yangi === undefined) {
      throw new BiznesXato('MATERIAL_TOPILMADI', String(materialId));
    }

    const eskiQ = auditQiymatlari(eski);
    const yangiQ = auditQiymatlari(yangi);

    if (!ozgarishBormi(eskiQ, yangiQ)) {
      return { holat: 'OZGARISH_YOQ' } as const;
    }

    // TZ 2.4 — «material birligi o'zgarishi» jurnalga tushadigan amallardan
    const farq = farqniAjrat(eskiQ, yangiQ);
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat)
      VALUES (${xodimId}, ${filialId},
              ${birlikOzgardi ? 'MATERIAL_BIRLIGI_OZGARDI' : 'QOLDA_TUZATISH'},
              'material', ${materialId},
              ${tx.json(farq.eski as never)}, ${tx.json(farq.yangi as never)})`;

    return { holat: 'SAQLANDI' } as const;
  });
}
