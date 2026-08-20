/**
 * lib/amal/boshlangich.ts — TZ 7.10 · QISM 1 §1 · 2.2-invariant
 *
 * Boshlang'ich qoldiq — tizimga o'tishda omborda turgan material.
 *
 * «Tizimga o'tishda eski qarz va eski qoldiq ham HARAKAT SIFATIDA
 *  yozilishi shart. Aks holda balans nolga teng chiqadi.» (§1)
 *
 * ⚠️ Yetkazib beruvchi qarziga TEGMAYDI (QABUL S2.6). Bu xarid emas —
 *    mol allaqachon kelgan va allaqachon to'langan. Shuning uchun bu
 *    yerda `yetkazib_beruvchi_id` ham, `kirim` hujjati ham yo'q.
 */

import type postgres from 'postgres';
import { bolakQiymati } from '@/lib/domain/tannarx';
import Decimal from 'decimal.js';
import { nolSom, pulMatn, qosh, som, type Som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

export interface BoshlangichKirimi {
  readonly materialId: number;
  readonly filialId: number;
  /** RULON — har bo'lak alohida */
  readonly bolaklar: readonly { readonly eniM: number; readonly boyiM: number }[];
  /** DONA va CHIZIQLI */
  readonly miqdor: number | null;
  /** P-20 — SARFLASH birligi uchun tannarx (so'm/kv.m, so'm/sm, so'm/dona) */
  readonly tannarxBirlik: string;
  readonly izoh: string | null;
}

export interface BoshlangichNatijasi {
  readonly bolakSoni: number;
  readonly jamiSumma: string;
}

/**
 * TZ 7.10 — boshlang'ich qoldiqni omborga kiritadi.
 *
 * Bitta tranzaksiyada: bo'laklar, ombor jurnali (`BOSHLANGICH`) va audit.
 *
 * ⚠️ Bir material uchun IKKI MARTA kiritilmaydi: aks holda tizimga
 *    o'tish qoldig'i ikki barobar bo'lib ketardi va buni keyin ajratib
 *    olish deyarli imkonsiz.
 */
export async function boshlangichQoldiq(
  ulanish: postgres.Sql,
  kirim: BoshlangichKirimi,
  xodimId: number,
): Promise<BoshlangichNatijasi> {
  if (kirim.bolaklar.length === 0 && kirim.miqdor === null) {
    throw new BiznesXato('KIRIM_BOLAK_YETISHMAYDI', "o'lcham yoki miqdor kerak");
  }

  return ulanish.begin(async (tx) => {
    const materiallar = await tx<
      { id: number; nom: string; hisob_turi: string; sarflash_birligi: string }[]
    >`SELECT id, nom, hisob_turi, sarflash_birligi FROM material
      WHERE id = ${kirim.materialId} AND faol = true`;

    const material = materiallar[0];
    if (material === undefined) {
      throw new BiznesXato('MATERIAL_TOPILMADI', String(kirim.materialId));
    }

    const oldingi = await tx<{ n: number }[]>`
      SELECT COUNT(*)::int AS n
      FROM ombor_harakat oh
      JOIN bolak b ON b.id = oh.bolak_id
      WHERE oh.turi = 'BOSHLANGICH'
        AND oh.filial_id = ${kirim.filialId}
        AND b.material_id = ${kirim.materialId}`;

    if ((oldingi[0]?.n ?? 0) > 0) {
      throw new BiznesXato('BOSHLANGICH_TAKROR', material.nom);
    }

    const rulon = material.hisob_turi === 'RULON';
    // Q-01 — chiziqli material SMDA saqlanadi, jurnalda `miqdor_sm` ustuni
    const smda = material.sarflash_birligi === 'SM';
    const tannarx = som(kirim.tannarxBirlik);

    // Bo'lak turi — RULON bo'lsa har o'lcham alohida, aks holda bitta dona
    const yozilajak = rulon
      ? kirim.bolaklar.map((b) => ({
          turi: 'RULON',
          eniM: b.eniM,
          boyiM: b.boyiM,
          miqdor: null as number | null,
        }))
      : [{ turi: 'DONA', eniM: null, boyiM: null, miqdor: kirim.miqdor }];

    if (yozilajak.length === 0) {
      throw new BiznesXato('KIRIM_BOLAK_YETISHMAYDI', material.nom);
    }

    let jami: Som = nolSom();
    const belgi = `B-${String(Date.now())}`;

    for (const [i, b] of yozilajak.entries()) {
      const kod = `${rulon ? 'R' : 'D'}-${belgi}-${String(i + 1)}`;

      const yangi = await tx<{ id: number }[]>`
        INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                           miqdor, tannarx_birlik_snapshot, holat, yaratdi_id)
        VALUES (${kirim.materialId}, ${kirim.filialId}, ${kod}, ${b.turi},
                ${b.eniM}, ${b.boyiM}, ${b.miqdor}, ${kirim.tannarxBirlik},
                'BOSH', ${xodimId})
        RETURNING id`;

      const bolakId = yangi[0]?.id;
      if (bolakId === undefined) {
        throw new BiznesXato('KIRIM_SAQLANMADI', kod);
      }

      // §2.2 — qiymat bitta funksiyadan chiqadi (P-20 dan keyin)
      const summa = bolakQiymati({
        turi: b.turi,
        eniM: b.eniM,
        boyiM: b.boyiM,
        miqdor: b.miqdor,
        tannarxBirlik: tannarx,
      });

      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                   miqdor_sm, miqdor_dona, tannarx_summa,
                                   manba_turi, izoh, xodim_id)
        VALUES (${kirim.filialId}, ${bolakId}, 'BOSHLANGICH',
                ${
                  b.eniM === null || b.boyiM === null
                    ? null
                    : new Decimal(b.eniM).times(b.boyiM).toFixed(4)
                },
                ${smda ? b.miqdor : null},
                ${smda ? null : b.miqdor},
                ${pulMatn(summa)},
                'boshlangich',
                ${kirim.izoh ?? "Tizimga o'tish qoldig'i"},
                ${xodimId})`;

      // §3.1 — pul JS `number` bilan qo'shilmaydi
      jami = qosh(jami, summa);
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${kirim.filialId}, 'YARATISH', 'material',
              ${kirim.materialId},
              ${tx.json({
                turi: 'BOSHLANGICH',
                bolak_soni: yozilajak.length,
                jami: pulMatn(jami),
              })},
              ${`Boshlang'ich qoldiq — ${material.nom}`})`;

    return { bolakSoni: yozilajak.length, jamiSumma: pulMatn(jami) };
  });
}
