/**
 * lib/amal/kirim.ts — TZ 7.9 · QISM 1 §7.1 · 2.1-invariant
 *
 * Kirim hujjati — QISM 1 §7.1 dagi «bitta tranzaksiya bo'lishi shart
 * bo'lgan amallar» ro'yxatida:
 *
 *   «Kirim hujjati | bo'laklar yaratiladi + transport taqsimlanadi +
 *                    qarz yoziladi | 7.9, 9.2»
 *
 * Yarim bajarilish 2.1-invariantni buzadi: bo'laklar omborga tushib,
 * tannarx yozilmay qolsa hisob butunlay buziladi.
 *
 * ⚠️ Yetkazib beruvchi qarzi 5-bosqichda qo'shiladi — `yetkazib_beruvchi_harakat`
 *    jadvali o'shanda yaratiladi (QARZLAR T-05).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import {
  birlikTannarxi,
  ustamaniTekshir,
  xarajatniTaqsimla,
  type DefektTuri,
  type KirimQatori,
} from '@/lib/domain/tannarx';
import { nolSom, pulMatn, qosh, som, type Som } from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

/** Rulon uchun har bo'lak o'z o'lchami bilan (7.9). */
export interface BolakOlchami {
  readonly eniM: number;
  readonly boyiM: number;
}

export interface QatorKirimi {
  readonly materialId: number;
  /** Kirim birligidagi miqdor — rulon soni, shtanga soni, dona */
  readonly miqdorKirim: number;
  readonly narxBirlik: string;
  readonly defektMiqdor: number;
  readonly defektTuri: DefektTuri;
  /**
   * RULON hisob turida MAJBURIY — har rulon alohida bo'lak bo'lib
   * omborga tushadi (7.9). Boshqa turlarda bo'sh.
   */
  readonly bolaklar: readonly BolakOlchami[];
}

export interface KirimKirimi {
  readonly raqam: string;
  readonly sana: string;
  readonly filialId: number;
  readonly yetkazibBeruvchiId: number;
  readonly valyuta: 'SOM' | 'USD';
  readonly kursSnapshot: string | null;
  readonly transportSumma: string;
  readonly bojxonaSumma: string;
  readonly tolovMuddati: string | null;
  readonly qatorlar: readonly QatorKirimi[];
}

/** TZ 7.9 — ustama chegaradan past bo'lsa OGOHLANTIRISH, bloklamaydi. */
export interface UstamaOgohlantirishi {
  readonly materialId: number;
  readonly materialNomi: string;
  readonly ustamaFoiz: number;
  readonly chegara: number;
}

export interface KirimNatijasi {
  readonly kirimId: number;
  readonly bolakSoni: number;
  /** «O'zimizdan brakka» ketgan summa — 7.9 xarajat moddasi */
  readonly defektZarari: Som;
  readonly ogohlantirishlar: readonly UstamaOgohlantirishi[];
}

interface MaterialQatori {
  readonly id: number;
  readonly nom: string;
  readonly hisob_turi: string;
  readonly sarflash_birligi: string;
  readonly koeffitsient: string;
  readonly sotuv_narx: string | null;
  readonly min_ustama_foiz: string | null;
}

/** TZ 5.4 — material chegarasi bo'sh qolsa sozlamadagi standart ishlaydi. */
const STANDART_USTAMA_CHEGARASI = 30;

function bolakTuri(hisobTuri: string): 'RULON' | 'OSTATKA' | 'DONA' {
  return hisobTuri === 'RULON' ? 'RULON' : 'DONA';
}

/**
 * Kirim hujjatini saqlaydi.
 *
 * Tartib muhim:
 *   1. Materiallar o'qiladi (tur va chegaralar kerak)
 *   2. Transport + bojxona qatorlarga taqsimlanadi (7.9)
 *   3. Har qator uchun tannarx hisoblanadi (P-17: bo'luvchi to'liq miqdor)
 *   4. Bo'laklar yaratiladi, har biri O'Z tannarxini eslab qoladi (7.8)
 *   5. Har bo'lak uchun `ombor_harakat` yozuvi
 *   6. Ustama tekshiriladi — faqat ogohlantirish (7.9)
 */
export async function kirimYarat(
  ulanish: postgres.Sql,
  kirim: KirimKirimi,
  xodimId: number,
): Promise<KirimNatijasi> {
  if (kirim.qatorlar.length === 0) {
    throw new BiznesXato('KIRIM_BOSH');
  }

  return ulanish.begin(async (tx) => {
    const materialIdlar = kirim.qatorlar.map((q) => q.materialId);
    const materiallar = await tx<MaterialQatori[]>`
      SELECT id, nom, hisob_turi, sarflash_birligi, koeffitsient,
             sotuv_narx, min_ustama_foiz
      FROM material WHERE id = ANY(${materialIdlar}) AND faol = true`;

    const xarita = new Map(materiallar.map((m) => [m.id, m]));
    for (const q of kirim.qatorlar) {
      if (!xarita.has(q.materialId)) {
        throw new BiznesXato('MATERIAL_TOPILMADI', String(q.materialId));
      }
    }

    // ── 2. Qo'shimcha xarajat taqsimoti (7.9) ──
    const xarajat = qosh(som(kirim.transportSumma), som(kirim.bojxonaSumma));
    const domenQatorlar: KirimQatori[] = kirim.qatorlar.map((q, i) => ({
      id: i,
      miqdor: q.miqdorKirim,
      narxBirlik: som(q.narxBirlik),
      defektMiqdor: q.defektMiqdor,
    }));
    const ulushlar = xarajatniTaqsimla(domenQatorlar, xarajat);

    // ── Hujjat sarlavhasi ──
    const hujjat = await tx<{ id: number }[]>`
      INSERT INTO kirim (raqam, sana, filial_id, yetkazib_beruvchi_id, valyuta,
                         kurs_snapshot, transport_summa, bojxona_summa,
                         tolov_muddati, yaratdi_id)
      VALUES (${kirim.raqam}, ${kirim.sana}, ${kirim.filialId},
              ${kirim.yetkazibBeruvchiId}, ${kirim.valyuta}, ${kirim.kursSnapshot},
              ${kirim.transportSumma}, ${kirim.bojxonaSumma},
              ${kirim.tolovMuddati}, ${xodimId})
      RETURNING id`;

    const kirimId = hujjat[0]?.id;
    if (kirimId === undefined) throw new BiznesXato('KIRIM_SAQLANMADI');

    let defektZarari = nolSom();
    let bolakSoni = 0;
    const ogohlantirishlar: UstamaOgohlantirishi[] = [];

    for (const [i, q] of kirim.qatorlar.entries()) {
      const material = xarita.get(q.materialId);
      const ulush = ulushlar.find((u) => u.id === i);
      if (material === undefined || ulush === undefined) continue;

      // ── 3. Tannarx (P-17: bo'luvchi TO'LIQ miqdor) ──
      const tannarx = birlikTannarxi(
        {
          id: i,
          miqdor: q.miqdorKirim,
          narxBirlik: som(q.narxBirlik),
          defektMiqdor: q.defektMiqdor,
        },
        ulush.ulush,
        q.defektTuri,
      );
      defektZarari = qosh(defektZarari, tannarx.defektZarari);

      const qator = await tx<{ id: number }[]>`
        INSERT INTO kirim_qator (kirim_id, material_id, miqdor_kirim, narx_birlik,
                                 defekt_miqdor, defekt_turi, transport_ulush,
                                 tannarx_birlik, yaratdi_id)
        VALUES (${kirimId}, ${q.materialId}, ${q.miqdorKirim}, ${q.narxBirlik},
                ${q.defektMiqdor}, ${q.defektTuri}, ${pulMatn(ulush.ulush)},
                ${pulMatn(tannarx.birlikTannarx)}, ${xodimId})
        RETURNING id`;

      const qatorId = qator[0]?.id;
      if (qatorId === undefined) throw new BiznesXato('KIRIM_SAQLANMADI');

      // ── 4. Bo'laklar ──
      const turi = bolakTuri(material.hisob_turi);

      if (turi === 'RULON') {
        // TZ 7.9 — «Rulon uchun eni va bo'yi MAJBURIY, har rulon alohida yozuv»
        if (q.bolaklar.length !== q.miqdorKirim) {
          throw new BiznesXato(
            'KIRIM_BOLAK_YETISHMAYDI',
            `${material.nom}: ${String(q.miqdorKirim)} ta rulon uchun ` +
              `${String(q.bolaklar.length)} ta o'lcham kiritilgan`,
          );
        }

        for (const olcham of q.bolaklar) {
          await bolakYoz(tx, {
            materialId: q.materialId,
            filialId: kirim.filialId,
            turi: 'RULON',
            eniM: olcham.eniM,
            boyiM: olcham.boyiM,
            miqdor: null,
            kirimQatorId: qatorId,
            tannarx: pulMatn(tannarx.birlikTannarx),
            valyuta: kirim.valyuta,
            xodimId,
            kvM: olcham.eniM * olcham.boyiM,
          });
          bolakSoni += 1;
        }
      } else {
        // DONA va CHIZIQLI — bo'lak yo'q, bitta yozuv bilan hisoblanadi (7.8)
        const koeff = new Decimal(material.koeffitsient);
        const sarflashMiqdori = koeff.times(tannarx.kirimMiqdor).toNumber();

        await bolakYoz(tx, {
          materialId: q.materialId,
          filialId: kirim.filialId,
          turi: 'DONA',
          eniM: null,
          boyiM: null,
          miqdor: sarflashMiqdori,
          kirimQatorId: qatorId,
          tannarx: pulMatn(tannarx.birlikTannarx),
          valyuta: kirim.valyuta,
          xodimId,
          sm: material.sarflash_birligi === 'SM' ? sarflashMiqdori : null,
          dona: material.sarflash_birligi === 'DONA' ? Math.round(sarflashMiqdori) : null,
        });
        bolakSoni += 1;
      }

      // ── 6. Ustama nazorati (7.9) — BLOKLAMAYDI ──
      const chegara =
        material.min_ustama_foiz === null
          ? STANDART_USTAMA_CHEGARASI
          : Number(material.min_ustama_foiz);

      const tekshiruv = ustamaniTekshir(
        material.sotuv_narx === null ? null : som(material.sotuv_narx),
        tannarx.birlikTannarx,
        chegara,
      );

      if (tekshiruv?.pastmi === true) {
        ogohlantirishlar.push({
          materialId: material.id,
          materialNomi: material.nom,
          ustamaFoiz: tekshiruv.ustamaFoiz,
          chegara,
        });
      }
    }

    return { kirimId, bolakSoni, defektZarari, ogohlantirishlar };
  });
}

interface BolakYozuvi {
  readonly materialId: number;
  readonly filialId: number;
  readonly turi: 'RULON' | 'DONA';
  readonly eniM: number | null;
  readonly boyiM: number | null;
  readonly miqdor: number | null;
  readonly kirimQatorId: number;
  readonly tannarx: string;
  readonly valyuta: string;
  readonly xodimId: number;
  readonly kvM?: number;
  readonly sm?: number | null;
  readonly dona?: number | null;
}

/**
 * Bo'lak va uning `ombor_harakat` yozuvi — birga.
 *
 * Kod markazlashgan ketma-ketlikdan olinadi (QISM 3 §3.1): bir vaqtda
 * ikki kirim qilinsa ham raqamlar to'qnashmaydi.
 */
async function bolakYoz(tx: postgres.TransactionSql, b: BolakYozuvi): Promise<void> {
  const prefiks = b.turi === 'RULON' ? 'R' : 'D';

  const yaratilgan = await tx<{ id: number }[]>`
    INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m, miqdor,
                       kirim_qator_id, tannarx_birlik_snapshot,
                       tannarx_valyuta_snapshot, yaratdi_id)
    VALUES (${b.materialId}, ${b.filialId},
            ${prefiks} || '-' || nextval('bolak_kod_seq'),
            ${b.turi}, ${b.eniM}, ${b.boyiM}, ${b.miqdor},
            ${b.kirimQatorId}, ${b.tannarx}, ${b.valyuta}, ${b.xodimId})
    RETURNING id`;

  const bolakId = yaratilgan[0]?.id;
  if (bolakId === undefined) throw new BiznesXato('KIRIM_SAQLANMADI');

  const summa = new Decimal(b.tannarx).times(
    b.turi === 'RULON' ? 1 : (b.miqdor ?? 0),
  );

  await tx`
    INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m, miqdor_sm,
                               miqdor_dona, tannarx_summa, manba_turi, manba_id,
                               xodim_id)
    VALUES (${b.filialId}, ${bolakId}, 'KIRIM', ${b.kvM ?? null}, ${b.sm ?? null},
            ${b.dona ?? null}, ${summa.toFixed(2)}, 'kirim_qator',
            ${b.kirimQatorId}, ${b.xodimId})`;
}
