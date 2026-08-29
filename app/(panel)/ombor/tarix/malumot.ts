/**
 * app/(panel)/ombor/tarix/malumot.ts — TZ 7.11
 *
 * Ombor tarixi — HAR HARAKAT bitta ro'yxatda: kirim, kesim,
 * qoldiq kesma, chiqindi, ko'chirish, inventarizatsiya, storno.
 *
 * ⚠️ «Qoldiq alohida saqlanmaydi — shu jadvalning yig'indisi»
 *    (2.2-invariant). Ya'ni bu ro'yxat — ombor qoldig'ining
 *    TO'LIQ izohi: qoldiq nega shunday ekanini shu yerdan
 *    bir boshdan ko'rish mumkin.
 *
 * ⚠️ Faqat O'Z FILIALI. Boshqa filialning ombori — boshqa
 *    odamning javobgarligi (20.6).
 */

import { ulanishOl } from '@/lib/db';

export interface TarixQatori {
  readonly id: number;
  readonly sana: Date;
  readonly turi: string;
  readonly materialId: number;
  readonly materialNomi: string;
  readonly bolakKod: string;
  readonly miqdorKvM: number | null;
  readonly miqdorSm: number | null;
  readonly miqdorDona: number | null;
  readonly tannarxSumma: string;
  readonly izoh: string | null;
  readonly xodimIsmi: string;
}

export interface TarixFiltri {
  /** `YYYY-MM-DD` yoki bo'sh */
  readonly dan: string;
  readonly gacha: string;
  readonly materialId: number | null;
  readonly turi: string;
}

export const BOSH_FILTR: TarixFiltri = {
  dan: '',
  gacha: '',
  materialId: null,
  turi: '',
};

/** Bir sahifada nechta qator — ko'p bo'lsa ekran og'irlashadi */
export const SAHIFA_HAJMI = 50;

export interface TarixNatijasi {
  readonly qatorlar: readonly TarixQatori[];
  /** Keyingi sahifa bormi — jami sanamaymiz, bitta ortiq o'qiymiz */
  readonly davomiBor: boolean;
}

/**
 * ⚠️ JAMI SONI HISOBLANMAYDI.
 *
 *    `count(*)` har sahifada butun jadvalni sanaydi va yillar
 *    o'tib bu sekinlashadi. Odamga «jami 41 812 ta» degan raqam
 *    ham kerak emas — unga «keyingisi bormi» kerak. Shuning
 *    uchun bitta ortiq qator o'qiymiz.
 */
export async function omborTarixi(
  filialId: number,
  filtr: TarixFiltri,
  sahifa = 0,
): Promise<TarixNatijasi> {
  const sql = ulanishOl();

  const qatorlar = await sql<
    {
      id: number;
      sana: Date;
      turi: string;
      material_id: number;
      material_nomi: string;
      bolak_kod: string;
      miqdor_kv_m: string | null;
      miqdor_sm: string | null;
      miqdor_dona: number | null;
      tannarx_summa: string;
      izoh: string | null;
      xodim_ismi: string;
    }[]
  >`
    SELECT oh.id, oh.sana, oh.turi,
           m.id AS material_id, m.nom AS material_nomi,
           b.kod AS bolak_kod,
           oh.miqdor_kv_m, oh.miqdor_sm, oh.miqdor_dona,
           oh.tannarx_summa, oh.izoh, x.ism AS xodim_ismi
    FROM ombor_harakat oh
    JOIN bolak b ON b.id = oh.bolak_id
    JOIN material m ON m.id = b.material_id
    JOIN xodim x ON x.id = oh.xodim_id
    WHERE oh.filial_id = ${filialId}
      ${filtr.dan === '' ? sql`` : sql`AND oh.sana >= ${filtr.dan}::date`}
      ${
        filtr.gacha === ''
          ? sql``
          : /* ⚠️ «gacha» KUNNING OXIRIGACHA — odam 31-dekabr yozsa,
                  o'sha kunning yozuvlari ham kirishi kerak */
            sql`AND oh.sana < (${filtr.gacha}::date + 1)`
      }
      ${filtr.materialId === null ? sql`` : sql`AND m.id = ${filtr.materialId}`}
      ${filtr.turi === '' ? sql`` : sql`AND oh.turi = ${filtr.turi}`}
    ORDER BY oh.sana DESC, oh.id DESC
    LIMIT ${SAHIFA_HAJMI + 1} OFFSET ${sahifa * SAHIFA_HAJMI}`;

  const davomiBor = qatorlar.length > SAHIFA_HAJMI;

  return {
    davomiBor,
    qatorlar: qatorlar.slice(0, SAHIFA_HAJMI).map((q) => ({
      id: q.id,
      sana: q.sana,
      turi: q.turi,
      materialId: q.material_id,
      materialNomi: q.material_nomi,
      bolakKod: q.bolak_kod,
      miqdorKvM: q.miqdor_kv_m === null ? null : Number(q.miqdor_kv_m),
      miqdorSm: q.miqdor_sm === null ? null : Number(q.miqdor_sm),
      miqdorDona: q.miqdor_dona,
      tannarxSumma: q.tannarx_summa,
      izoh: q.izoh,
      xodimIsmi: q.xodim_ismi,
    })),
  };
}

export interface TarixMateriali {
  readonly id: number;
  readonly nom: string;
}

/**
 * Filtr ro'yxati — faqat SHU FILIALDA harakati bo'lgan material.
 *
 * ⚠️ Butun material ro'yxati emas: 200 ta materialdan omborda
 *    30 tasi bo'lsa, qolgan 170 tasi tanlovni to'ldirib turadi
 *    va hech qachon natija bermaydi.
 */
export async function tarixMateriallari(filialId: number): Promise<TarixMateriali[]> {
  return await ulanishOl()<TarixMateriali[]>`
    SELECT DISTINCT m.id, m.nom
    FROM ombor_harakat oh
    JOIN bolak b ON b.id = oh.bolak_id
    JOIN material m ON m.id = b.material_id
    WHERE oh.filial_id = ${filialId}
    ORDER BY m.nom`;
}
