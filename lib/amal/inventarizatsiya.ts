/**
 * lib/amal/inventarizatsiya.ts — TZ 15.1 · 2.1 · 2.2 · 2.5-invariant · TZ 2.4
 *
 * Sanash varaqasi: ochish, yakunlash.
 *
 * ⚠️ Kim qiladi: OMBORCHI o'zi. Admin tasdig'i KUTILMAYDI (15.1) —
 *    hisobdan chiqarish bilan bir xil qoida (7.10). Nazorat keyin:
 *    adminga xabar va audit jurnali.
 *
 * ⚠️ Ombor uchta yo'l bilan kamayishi mumkin: hisobdan chiqarish,
 *    qo'lda korrektsiya, inventarizatsiya. Uchalasi ham omborchi
 *    qo'lida. Shuning uchun har qadam auditga tushadi (15.1).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { som, pulMatn, type Som } from '@/lib/domain/pul';
import {
  varaqaYakuni,
  type InventarizatsiyaSababi,
  type SanashNatijasi,
  type SanashQatori,
} from '@/lib/domain/inventarizatsiya';
import { BiznesXato } from '@/lib/xato';

export interface VaraqaQatori {
  readonly qatorId: number;
  readonly bolakId: number;
  readonly kod: string;
  readonly turi: string;
  readonly materialNomi: string;
  readonly sarflashBirligi: string;
  readonly tizimdaEniM: number | null;
  readonly tizimdaBoyiM: number | null;
  readonly tizimdaMiqdor: number | null;
  readonly haqiqatdaEniM: number | null;
  readonly haqiqatdaBoyiM: number | null;
  readonly haqiqatdaMiqdor: number | null;
  readonly band: boolean;
  readonly yolda: boolean;
  readonly tannarx: string;
  readonly sabab: string | null;
  readonly izoh: string | null;
}

export interface Varaqa {
  readonly id: number;
  readonly sana: string;
  readonly holat: string;
  readonly farqSumma: string | null;
  readonly izoh: string | null;
  readonly qatorlar: readonly VaraqaQatori[];
}

interface BolakQatori {
  readonly id: number;
  readonly kod: string;
  readonly turi: string;
  readonly holat: string;
  readonly eni_m: string | null;
  readonly boyi_m: string | null;
  readonly miqdor: string | null;
  readonly tannarx_birlik_snapshot: string;
}

/**
 * TZ 15.1 — varaqa ochish.
 *
 * «To'liq va qisman. Butun omborni sanash shart emas — inventarizatsiya
 *  TANLANGAN materiallar bo'yicha ham o'tkaziladi.»
 *
 * `materialIdlar` bo'sh bo'lsa — butun filial ombori.
 *
 * ⚠️ Qatorlar SHU PAYTDAGI holat bilan qotib qoladi (2.3-invariant):
 *    varaqa chop etilgandan keyin bo'lak band qilinsa ham, sanash
 *    o'sha payt ko'rilgan songa solishtiriladi.
 */
export async function varaqaOch(
  ulanish: postgres.Sql,
  kirim: {
    readonly sana: string;
    readonly filialId: number;
    readonly materialIdlar: readonly number[];
    readonly izoh: string | null;
  },
  xodimId: number,
): Promise<{ varaqaId: number; qatorSoni: number }> {
  return ulanish.begin(async (tx) => {
    const hammasi = kirim.materialIdlar.length === 0;

    const bolaklar = await tx<BolakQatori[]>`
      SELECT b.id, b.kod, b.turi, b.holat, b.eni_m, b.boyi_m, b.miqdor,
             b.tannarx_birlik_snapshot
      FROM bolak b
      WHERE b.filial_id = ${kirim.filialId}
        AND b.faol = true
        AND b.holat IN ('BOSH', 'BAND', 'YOLDA')
        ${hammasi ? tx`` : tx`AND b.material_id = ANY(${kirim.materialIdlar as number[]})`}
      ORDER BY b.material_id, b.kod`;

    if (bolaklar.length === 0) {
      throw new BiznesXato('INV_BOSH', 'sanaladigan bo\'lak topilmadi');
    }

    const h = await tx<{ id: number }[]>`
      INSERT INTO inventarizatsiya (sana, filial_id, holat, izoh, yaratdi_id)
      VALUES (${kirim.sana}, ${kirim.filialId}, 'OCHIQ', ${kirim.izoh}, ${xodimId})
      RETURNING id`;

    const varaqaId = h[0]?.id;
    if (varaqaId === undefined) {
      throw new BiznesXato('INV_TOPILMADI', 'varaqa yaratilmadi');
    }

    for (const b of bolaklar) {
      await tx`
        INSERT INTO inventarizatsiya_qator
          (inventarizatsiya_id, bolak_id, tizimda_eni_m, tizimda_boyi_m,
           tizimda_miqdor, band, yolda)
        VALUES (${varaqaId}, ${b.id}, ${b.eni_m}, ${b.boyi_m}, ${b.miqdor},
                ${b.holat === 'BAND'}, ${b.holat === 'YOLDA'})`;
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${kirim.filialId}, 'YARATISH', 'inventarizatsiya',
              ${varaqaId},
              ${tx.json({ qator_soni: bolaklar.length, qisman: !hammasi })},
              ${kirim.izoh})`;

    return { varaqaId, qatorSoni: bolaklar.length };
  });
}

export interface SanashKiritmasi {
  readonly qatorId: number;
  readonly eniM: number | null;
  readonly boyiM: number | null;
  readonly miqdor: number | null;
  readonly sabab: InventarizatsiyaSababi | null;
  readonly izoh: string | null;
}

export interface YakunNatijasi {
  readonly varaqaId: number;
  readonly sanalgan: number;
  readonly farqli: number;
  /** Manfiy = xarajat (15.1) */
  readonly jamiFarq: Som;
  /** 2.5-invariant — qoldiq manfiyga tushgan bo'laklar */
  readonly manfiyQoldiq: readonly string[];
}

/**
 * TZ 15.1 — varaqani yakunlash.
 *
 * Bitta tranzaksiyada (CLAUDE.md §3):
 *   1. Har qatorning farqi hisoblanadi (domain)
 *   2. Farq bo'lsa — ombor jurnaliga `INVENTARIZATSIYA` yozuvi
 *   3. Bo'lak o'lchami HAQIQIY songa tenglashadi
 *   4. Varaqa `YAKUNLANDI` bo'ladi, jami farq yoziladi
 *   5. Audit jurnali
 *
 * ⚠️ Bo'lak o'lchami O'ZGARADI — bu `_snapshot` emas, joriy holat.
 *    Tarix ombor jurnalida qoladi (2.2-invariant).
 */
export async function varaqaYakunla(
  ulanish: postgres.Sql,
  varaqaId: number,
  kiritmalar: readonly SanashKiritmasi[],
  xodimId: number,
): Promise<YakunNatijasi> {
  return ulanish.begin(async (tx) => {
    const hujjatlar = await tx<
      { id: number; filial_id: number; holat: string }[]
    >`SELECT id, filial_id, holat FROM inventarizatsiya
      WHERE id = ${varaqaId} FOR UPDATE`;

    const hujjat = hujjatlar[0];
    if (hujjat === undefined) throw new BiznesXato('INV_TOPILMADI', String(varaqaId));
    if (hujjat.holat !== 'OCHIQ') {
      throw new BiznesXato('INV_YAKUNLANGAN', hujjat.holat);
    }

    const qatorlar = await tx<
      {
        id: number;
        bolak_id: number;
        kod: string;
        turi: string;
        tizimda_eni_m: string | null;
        tizimda_boyi_m: string | null;
        tizimda_miqdor: string | null;
        band: boolean;
        yolda: boolean;
        tannarx_birlik_snapshot: string;
        sarflash_birligi: string;
      }[]
    >`
      SELECT iq.id, iq.bolak_id, b.kod, b.turi,
             iq.tizimda_eni_m, iq.tizimda_boyi_m, iq.tizimda_miqdor,
             iq.band, iq.yolda, b.tannarx_birlik_snapshot, m.sarflash_birligi
      FROM inventarizatsiya_qator iq
      JOIN bolak b ON b.id = iq.bolak_id
      JOIN material m ON m.id = b.material_id
      WHERE iq.inventarizatsiya_id = ${varaqaId}
      ORDER BY iq.id
      FOR UPDATE OF b`;

    const kiritmaBoyicha = new Map(kiritmalar.map((k) => [k.qatorId, k]));

    const juftlar = qatorlar.map((q) => {
      const k = kiritmaBoyicha.get(q.id);
      const qator: SanashQatori = {
        bolakId: q.bolak_id,
        kod: q.kod,
        turi: q.turi,
        tizimdaEniM: q.tizimda_eni_m === null ? null : Number(q.tizimda_eni_m),
        tizimdaBoyiM: q.tizimda_boyi_m === null ? null : Number(q.tizimda_boyi_m),
        tizimdaMiqdor: q.tizimda_miqdor === null ? null : Number(q.tizimda_miqdor),
        tannarxBirlik: som(q.tannarx_birlik_snapshot),
        band: q.band,
        yolda: q.yolda,
      };
      const natija: SanashNatijasi = {
        eniM: k?.eniM ?? null,
        boyiM: k?.boyiM ?? null,
        miqdor: k?.miqdor ?? null,
        sabab: k?.sabab ?? null,
        izoh: k?.izoh ?? null,
      };
      return { qator, natija, qatorId: q.id, smda: q.sarflash_birligi === 'SM' };
    });

    // §2.2 — farq va sabab tekshiruvi DOMAIN da, SQL da takrorlanmaydi
    const yakun = varaqaYakuni(juftlar);

    const manfiy: string[] = [];

    for (const [i, f] of yakun.qatorlar.entries()) {
      const j = juftlar[i];
      if (j === undefined) continue;

      await tx`
        UPDATE inventarizatsiya_qator
        SET haqiqatda_eni_m = ${j.natija.eniM},
            haqiqatda_boyi_m = ${j.natija.boyiM},
            haqiqatda_miqdor = ${j.natija.miqdor},
            farq_kv_m = ${f.farqKvM.toFixed(4)},
            farq_summa = ${pulMatn(f.farqSumma)},
            sabab = ${j.natija.sabab},
            izoh = ${j.natija.izoh}
        WHERE id = ${j.qatorId}`;

      if (!f.ozgardimi) continue;

      const dona = j.qator.turi === 'DONA';

      // 2.2-invariant — qoldiq jurnalning yig'indisi, shuning uchun
      // farq JURNALGA tushadi, bo'lakka emas.
      // Q-01 — chiziqli material SMDA yuritiladi, `miqdor_dona` INTEGER
      // bo'lgani uchun kasrli sm u yerga umuman sig'maydi.
      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                   miqdor_sm, miqdor_dona, tannarx_summa,
                                   manba_turi, manba_id, izoh, xodim_id)
        VALUES (${hujjat.filial_id}, ${j.qator.bolakId}, 'INVENTARIZATSIYA',
                ${dona ? null : f.farqKvM.toFixed(4)},
                ${dona && j.smda ? f.farqKvM.toFixed(2) : null},
                ${dona && !j.smda ? f.farqKvM.toNumber() : null},
                ${pulMatn(f.farqSumma)},
                'inventarizatsiya', ${varaqaId},
                ${j.natija.izoh === null ? j.natija.sabab : `${String(j.natija.sabab)} — ${j.natija.izoh}`},
                ${xodimId})`;

      // Bo'lak HAQIQIY songa tenglashadi
      if (dona) {
        await tx`
          UPDATE bolak SET miqdor = ${j.natija.miqdor},
                           ozgartirildi = now(), ozgartirdi_id = ${xodimId}
          WHERE id = ${j.qator.bolakId}`;
      } else {
        await tx`
          UPDATE bolak SET eni_m = ${j.natija.eniM}, boyi_m = ${j.natija.boyiM},
                           ozgartirildi = now(), ozgartirdi_id = ${xodimId}
          WHERE id = ${j.qator.bolakId}`;
      }

      // 2.5-invariant — manfiy qoldiq RUXSAT ETILADI, lekin ko'rsatiladi
      const yangi = dona
        ? new Decimal(j.natija.miqdor ?? 0)
        : new Decimal(j.natija.eniM ?? 0).times(j.natija.boyiM ?? 0);
      if (yangi.isNegative()) manfiy.push(j.qator.kod);
    }

    await tx`
      UPDATE inventarizatsiya
      SET holat = 'YAKUNLANDI', farq_summa = ${pulMatn(yakun.jamiFarq)},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${varaqaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${hujjat.filial_id}, 'YAKUNLASH', 'inventarizatsiya',
              ${varaqaId},
              ${tx.json({ holat: 'OCHIQ' })},
              ${tx.json({
                holat: 'YAKUNLANDI',
                sanalgan: yakun.sanalgan,
                farqli: yakun.farqli,
                jami_farq: pulMatn(yakun.jamiFarq),
              })},
              ${`Inventarizatsiya yakunlandi — ${String(yakun.farqli)} qatorda farq`})`;

    return {
      varaqaId,
      sanalgan: yakun.sanalgan,
      farqli: yakun.farqli,
      jamiFarq: yakun.jamiFarq,
      manfiyQoldiq: manfiy,
    };
  });
}
