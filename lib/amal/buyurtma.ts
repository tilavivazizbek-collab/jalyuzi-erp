/**
 * lib/amal/buyurtma.ts — TZ 3.9 · 3.10 · 3.12 · 3.14 · 8.3 · 8.4 · 8.12
 *                        20.4.2 · Q-03 · Q-12 · 2.1 · 2.3-invariant
 *
 * Savatdan buyurtma yaratish.
 *
 * ⚠️ BITTA TRANZAKSIYADA (CLAUDE.md §3): buyurtma, pozitsiyalar, har
 *    slotning materiali, aksessuarlar, BAND QILISH va audit. Yarim
 *    yozilgan buyurtma bo'lmaydi — 2.1-invariant.
 *
 * ⚠️ Q-03 · TZ 20.4.2 — material yetishmasligi BUYURTMA BERILAYOTGANDA
 *    aytiladi va tekshiruv ISHLAB CHIQARUVCHI filial ombori bo'yicha
 *    o'tkaziladi. Sotuvchi Chilonzorda, buyurtma Samarqandda tikilsa —
 *    Samarqand ombori qaraladi.
 *
 * ⚠️ TZ 3.6 — ombordan `hisoblangan_miqdor` band qilinadi, sotuvchi
 *    tuzatgan son EMAS. Tuzatilgani faqat narxga tegadi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { bandQilTx, type SlotSorovi } from './band';
import {
  boshHolat,
  otishniTekshir,
  tasdiqdanKeyin,
  type Manba,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import { BiznesXato } from '@/lib/xato';

export interface SlotKirimi {
  readonly slotId: number;
  readonly materialId: number;
  /** Formula hisoblagani — OMBORDAN SHU band qilinadi (3.6) */
  readonly hisoblanganMiqdor: string;
  /** Sotuvchi tuzatgani — faqat narxga tegadi (3.5) */
  readonly tuzatilganMiqdor: string | null;
  readonly birlik: 'KV_M' | 'SM' | 'DONA';
  readonly narxSnapshot: string;
  /** Band qilish uchun kerakli o'lcham — faqat RULON materialda */
  readonly kerak: { readonly eniM: number; readonly boyiM: number } | null;
}

export interface AksessuarKirimi {
  readonly materialId: number;
  readonly soni: string;
  readonly birlik: 'KV_M' | 'SM' | 'DONA';
  readonly narxSnapshot: string;
  /** TZ 3.7 — qo'lda kiritilgan sonni formula ustidan yozmaydi */
  readonly qoldaKiritildi: boolean;
}

export interface PozitsiyaKirimi {
  readonly mahsulotTurId: number;
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly soni: number;
  readonly narxSnapshot: string;
  readonly chegirmaSumma: string;
  readonly xizmatHaqi: string;
  /** TZ 4.10 — konstruktor holati qotadi */
  readonly formulaSnapshot: unknown;
  readonly slotlar: readonly SlotKirimi[];
  readonly aksessuarlar: readonly AksessuarKirimi[];
}

export interface BuyurtmaKirimi {
  readonly raqam: string;
  readonly mijozId: number | null;
  readonly sotganFilialId: number;
  readonly ishlabChiqaruvchiFilialId: number;
  readonly manba: Manba;
  readonly valyuta: 'SOM' | 'USD';
  readonly kursSnapshot: string | null;
  readonly tayyorlikSana: string | null;
  /** TZ 3.12 — to'lov to'liq emas bo'lsa qolgani qarzga yoziladi */
  readonly qarzgaKetadimi: boolean;
  readonly pozitsiyalar: readonly PozitsiyaKirimi[];
}

export interface PozitsiyaNatijasi {
  readonly pozitsiyaId: number;
  readonly holat: PozitsiyaHolati;
  /** TZ 8.12 — band qilinmagan materiallar */
  readonly topilmaganMateriallar: readonly number[];
}

export interface BuyurtmaNatijasi {
  readonly buyurtmaId: number;
  readonly raqam: string;
  readonly pozitsiyalar: readonly PozitsiyaNatijasi[];
  /** Q-03 — hech bo'lmasa bitta pozitsiya materialga kutmoqda */
  readonly materialYetishmadi: boolean;
}

/**
 * TZ 3.14 — buyurtmani saqlaydi.
 *
 * Q-12 — sayt buyurtmasi darhol «Tasdiqlangan», bot buyurtmasi
 * «Tasdiq kutmoqda» bo'lib tushadi. Tasdiqlangan pozitsiya darhol band
 * qilinadi (7.3); tasdiq kutayotgani BAND QILINMAYDI — mijoz hali
 * tasdiqlamagan ishga material ushlab turishning ma'nosi yo'q.
 */
export async function buyurtmaYarat(
  ulanish: postgres.Sql,
  kirim: BuyurtmaKirimi,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<BuyurtmaNatijasi> {
  if (kirim.pozitsiyalar.length === 0) {
    throw new BiznesXato('BUYURTMA_BOSH');
  }

  // TZ 3.10 — «Mahsulot qarzga berilayotgan bo'lsa mijoz tanlash
  // MAJBURIY: tizim qarzni kimdan undirishni bilishi kerak.»
  if (kirim.qarzgaKetadimi && kirim.mijozId === null) {
    throw new BiznesXato('BUYURTMA_MIJOZ_KERAK');
  }

  // AUDIT B-04 · TZ 9.6 — dollarli buyurtmada kurs qotishi shart
  if (kirim.valyuta === 'USD' && kirim.kursSnapshot === null) {
    throw new BiznesXato('KURS_KERAK', 'dollarli buyurtma');
  }

  return ulanish.begin(async (tx) => {
    const b = await tx<{ id: number }[]>`
      INSERT INTO buyurtma (raqam, mijoz_id, sotuvchi_id, sotgan_filial_id,
                            ishlab_chiqaruvchi_filial_id, manba, valyuta,
                            kurs_snapshot, tayyorlik_sana, yaratdi_id)
      VALUES (${kirim.raqam}, ${kirim.mijozId}, ${xodimId}, ${kirim.sotganFilialId},
              ${kirim.ishlabChiqaruvchiFilialId}, ${kirim.manba}, ${kirim.valyuta},
              ${kirim.kursSnapshot}, ${kirim.tayyorlikSana}, ${xodimId})
      RETURNING id`;

    const buyurtmaId = b[0]?.id;
    if (buyurtmaId === undefined) throw new BiznesXato('BUYURTMA_TOPILMADI', kirim.raqam);

    const bosh = boshHolat(kirim.manba);
    const tasdiqlangan = bosh === 'TASDIQLANGAN';

    // 20.5 — filiallar har xil bo'lsa pozitsiya «Filialga yuborildi» bo'ladi
    const tasdiqHolati = tasdiqdanKeyin(
      kirim.sotganFilialId,
      kirim.ishlabChiqaruvchiFilialId,
    );

    const natijalar: PozitsiyaNatijasi[] = [];
    let yetishmadi = false;

    for (const [i, p] of kirim.pozitsiyalar.entries()) {
      if (p.slotlar.length === 0) {
        throw new BiznesXato('BUYURTMA_BOSH', `pozitsiya ${String(i + 1)}`);
      }

      const q = await tx<{ id: number }[]>`
        INSERT INTO buyurtma_pozitsiya (buyurtma_id, tartib, mahsulot_tur_id,
                                        eni_sm, boyi_sm, soni, narx_snapshot,
                                        chegirma_summa, xizmat_haqi,
                                        formula_snapshot, holat, yaratdi_id)
        VALUES (${buyurtmaId}, ${i + 1}, ${p.mahsulotTurId}, ${p.eniSm}, ${p.boyiSm},
                ${p.soni}, ${p.narxSnapshot}, ${p.chegirmaSumma}, ${p.xizmatHaqi},
                ${tx.json(p.formulaSnapshot as never)},
                ${tasdiqlangan ? tasdiqHolati : bosh}, ${xodimId})
        RETURNING id`;

      const pozitsiyaId = q[0]?.id;
      if (pozitsiyaId === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI');

      // Har slot — o'z `pozitsiya_material` qatori (QISM 3 §3.2.1)
      const sorovlar: SlotSorovi[] = [];

      for (const s of p.slotlar) {
        const pm = await tx<{ id: number }[]>`
          INSERT INTO pozitsiya_material (buyurtma_pozitsiya_id, slot_id, material_id,
                                          hisoblangan_miqdor, tuzatilgan_miqdor,
                                          birlik, narx_snapshot)
          VALUES (${pozitsiyaId}, ${s.slotId}, ${s.materialId},
                  ${s.hisoblanganMiqdor}, ${s.tuzatilganMiqdor}, ${s.birlik},
                  ${s.narxSnapshot})
          RETURNING id`;

        const pmId = pm[0]?.id;
        if (pmId === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI');

        if (s.kerak !== null) {
          sorovlar.push({
            pozitsiyaMaterialId: pmId,
            materialId: s.materialId,
            kerak: s.kerak,
            majburiy: true,
          });
        }
      }

      for (const a of p.aksessuarlar) {
        await tx`
          INSERT INTO pozitsiya_aksessuar (buyurtma_pozitsiya_id, material_id,
                                           soni, birlik, narx_snapshot,
                                           qolda_kiritildi)
          VALUES (${pozitsiyaId}, ${a.materialId}, ${a.soni}, ${a.birlik},
                  ${a.narxSnapshot}, ${a.qoldaKiritildi})`;
      }

      // TZ 7.3 — «Pozitsiya "Tasdiqlangan" bo'lgan ZAHOTI tizim mos
      // bo'lakni topadi va band qiladi.» Tasdiq kutayotgani band
      // qilinmaydi.
      let holat: PozitsiyaHolati = tasdiqlangan ? tasdiqHolati : bosh;
      let topilmagan: readonly number[] = [];

      if (tasdiqlangan && sorovlar.length > 0) {
        const band = await bandQilTx(
          tx,
          pozitsiyaId,
          // 20.4.2 — tekshiruv ISHLAB CHIQARUVCHI filialda
          kirim.ishlabChiqaruvchiFilialId,
          sorovlar,
          xodimId,
          hozir,
        );

        if (band.holat === 'MATERIAL_YOQ') {
          // TZ 8.12 — «Usta ishga olmoqchi bo'ldi, material yetmadi»
          // qoidasi Q-03 bilan oldinga surildi: buyurtma berilayotganda
          holat = 'MATERIALGA_KUTMOQDA';
          topilmagan = band.topilmagan;
          yetishmadi = true;

          await tx`
            UPDATE buyurtma_pozitsiya SET holat = 'MATERIALGA_KUTMOQDA'
            WHERE id = ${pozitsiyaId}`;
        }
      }

      natijalar.push({ pozitsiyaId, holat, topilmaganMateriallar: topilmagan });
    }

    // TZ 2.4 — har buyurtma audit jurnalida
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${kirim.sotganFilialId}, 'YARATISH', 'buyurtma',
              ${buyurtmaId},
              ${tx.json({
                raqam: kirim.raqam,
                pozitsiya_soni: kirim.pozitsiyalar.length,
                manba: kirim.manba,
                valyuta: kirim.valyuta,
                tikuvchi_filial: kirim.ishlabChiqaruvchiFilialId,
              })},
              ${`Buyurtma ${kirim.raqam}`})`;

    return {
      buyurtmaId,
      raqam: kirim.raqam,
      pozitsiyalar: natijalar,
      materialYetishmadi: yetishmadi,
    };
  });
}

/**
 * TZ 8.4 — botdan kelgan pozitsiyani sotuvchi tasdiqlaydi.
 *
 * Tasdiqlangan zahoti band qilinadi (7.3). Material yo'q bo'lsa
 * pozitsiya «Materialga kutmoqda» ga tushadi va kirim bo'lgach
 * avtomatik qaytadi (8.12).
 */
export async function pozitsiyaniTasdiqla(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<{ holat: PozitsiyaHolati; topilmagan: readonly number[] }> {
  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        holat: string;
        sotgan_filial_id: number;
        ishlab_chiqaruvchi_filial_id: number;
      }[]
    >`
      SELECT p.id, p.holat, b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${pozitsiyaId}
      FOR UPDATE OF p`;

    const p = q[0];
    if (p === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI', String(pozitsiyaId));

    const yangi = tasdiqdanKeyin(p.sotgan_filial_id, p.ishlab_chiqaruvchi_filial_id);
    // §2.2 — o'tish qoidasi domainda, bu yerda takrorlanmaydi
    otishniTekshir(p.holat as PozitsiyaHolati, yangi);

    const slotlar = await tx<
      { id: number; material_id: number; hisoblangan_miqdor: string; birlik: string }[]
    >`
      SELECT id, material_id, hisoblangan_miqdor, birlik
      FROM pozitsiya_material WHERE buyurtma_pozitsiya_id = ${pozitsiyaId}`;

    // O'lchamni pozitsiyadan olamiz — band qilish METRDA ishlaydi (Q-05)
    const olcham = await tx<{ eni_sm: number; boyi_sm: number }[]>`
      SELECT eni_sm, boyi_sm FROM buyurtma_pozitsiya WHERE id = ${pozitsiyaId}`;

    const eniM = new Decimal(olcham[0]?.eni_sm ?? 0).div(100).toNumber();
    const boyiM = new Decimal(olcham[0]?.boyi_sm ?? 0).div(100).toNumber();

    const sorovlar: SlotSorovi[] = slotlar
      .filter((s) => s.birlik === 'KV_M')
      .map((s) => ({
        pozitsiyaMaterialId: s.id,
        materialId: s.material_id,
        kerak: { eniM, boyiM },
        majburiy: true,
      }));

    const band =
      sorovlar.length === 0
        ? ({ holat: 'BAND_QILINDI', bandlar: [] } as const)
        : await bandQilTx(
            tx,
            pozitsiyaId,
            p.ishlab_chiqaruvchi_filial_id,
            sorovlar,
            xodimId,
            hozir,
          );

    const holat: PozitsiyaHolati =
      band.holat === 'MATERIAL_YOQ' ? 'MATERIALGA_KUTMOQDA' : yangi;

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = ${holat}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${p.sotgan_filial_id}, 'TASDIQLASH', 'buyurtma_pozitsiya',
              ${pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({ holat })},
              ${'Pozitsiya tasdiqlandi'})`;

    return {
      holat,
      topilmagan: band.holat === 'MATERIAL_YOQ' ? band.topilmagan : [],
    };
  });
}
