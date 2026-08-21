/**
 * lib/amal/qayta-kesish.ts — TZ 8.17 · Q-15 · 7.3 · 7.6 · 2.1 · 2.2-invariant
 *
 * Ishlab chiqarish braki: usta kesdi yoki tikdi, mahsulot yaroqsiz chiqdi.
 * Buyurtma bajarilishi kerak — material IKKINCHI MARTA yechiladi.
 *
 * ⚠️ Bu OMBOR BRAKI (7.10) dan boshqa narsa: u yerda material omborda
 *    buzilgan, bu yerda ishlab chiqarish jarayonida. Hisobotda ham
 *    alohida modda (11.4.1) — «chiqindi» ga TUSHMAYDI, chunki chiqindi
 *    odatdagi kesish qoldig'i, bu esa brak (8.17.7).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { bandQilTx, type SlotSorovi } from './band';
import { kesimOlchami } from '@/lib/domain/kesish';
import type { PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { BiznesXato } from '@/lib/xato';

export const QAYTA_KESISH_SABABLARI = [
  'OLCHAM_XATO',
  'MATO_YIRTILDI',
  'TIKUV_BUZILDI',
  'MEXANIZM_NOSOZ',
  'BOSHQA',
] as const;

export type QaytaKesishSababi = (typeof QAYTA_KESISH_SABABLARI)[number];

export const QK_SABAB_NOMI: Record<QaytaKesishSababi, string> = {
  OLCHAM_XATO: "O'lcham xato",
  MATO_YIRTILDI: 'Mato yirtildi',
  TIKUV_BUZILDI: 'Tikuv buzildi',
  MEXANIZM_NOSOZ: 'Mexanizm nosoz',
  BOSHQA: 'Boshqa',
};

/**
 * TZ 8.17.5.1 — «Sabab "mato yirtildi" yoki "mexanizm nosoz" bo'lsa va
 * bu MATERIAL DEFEKTI bo'lsa — usta aybdor emas.»
 *
 * Bu FAQAT taklif: qaror admin qo'lida qoladi (Q-15 standart holatda haq
 * bekor qilinadi). Funksiya adminga qaysi holat istisnoga tushishi
 * mumkinligini ko'rsatadi.
 */
export function haqSaqlanishiMumkinmi(sabab: QaytaKesishSababi): boolean {
  return sabab === 'MATO_YIRTILDI' || sabab === 'MEXANIZM_NOSOZ';
}

export interface SorovKirimi {
  readonly pozitsiyaId: number;
  readonly sabab: QaytaKesishSababi;
  readonly izoh: string | null;
  readonly rasmYol: string | null;
}

/**
 * TZ 8.17.2, 1-qadam — usta botdan so'rov yuboradi.
 *
 * So'rovning o'zi hech narsani o'zgartirmaydi: pozitsiya o'z holida
 * qoladi, admin qaror qilguncha usta ishlayveradi (EC-BRK-01).
 */
export async function qaytaKesishSora(
  ulanish: postgres.Sql,
  kirim: SorovKirimi,
  ustaId: number,
): Promise<{ sorovId: number; oldingiSoni: number }> {
  return ulanish.begin(async (tx) => {
    const q = await tx<
      { holat: string; qayta_kesildi_soni: number; ishlab_chiqaruvchi_filial_id: number }[]
    >`
      SELECT p.holat, p.qayta_kesildi_soni, b.ishlab_chiqaruvchi_filial_id
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${kirim.pozitsiyaId}`;

    const p = q[0];
    if (p === undefined) {
      throw new BiznesXato('POZITSIYA_TOPILMADI', String(kirim.pozitsiyaId));
    }

    // Brak faqat ish boshlangandan keyin bo'ladi
    if (
      p.holat !== 'ISHLAB_CHIQARILMOQDA' &&
      p.holat !== 'TAYYOR' &&
      p.holat !== 'TAYYOR_YOLDA'
    ) {
      throw new BiznesXato('QK_HOLAT_MOS_EMAS', p.holat);
    }

    // Bir vaqtda bitta ochiq so'rov — aks holda admin ikki marta tasdiqlaydi
    const ochiq = await tx<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM qayta_kesish
      WHERE buyurtma_pozitsiya_id = ${kirim.pozitsiyaId} AND holat = 'SOROV'`;
    if ((ochiq[0]?.n ?? 0) > 0) {
      throw new BiznesXato('QK_SOROV_OCHIQ', String(kirim.pozitsiyaId));
    }

    const yangi = await tx<{ id: number }[]>`
      INSERT INTO qayta_kesish (buyurtma_pozitsiya_id, soragan_usta_id, sabab,
                                izoh, rasm_yol, holat, yaratdi_id)
      VALUES (${kirim.pozitsiyaId}, ${ustaId}, ${kirim.sabab}, ${kirim.izoh},
              ${kirim.rasmYol}, 'SOROV', ${ustaId})
      RETURNING id`;

    const sorovId = yangi[0]?.id;
    if (sorovId === undefined) throw new BiznesXato('QK_TOPILMADI');

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${ustaId}, ${p.ishlab_chiqaruvchi_filial_id}, 'QAYTA_KESISH_SOROVI',
              'qayta_kesish', ${sorovId},
              ${tx.json({
                pozitsiya: kirim.pozitsiyaId,
                sabab: kirim.sabab,
                oldingi_soni: p.qayta_kesildi_soni,
              })},
              ${kirim.izoh})`;

    return { sorovId, oldingiSoni: p.qayta_kesildi_soni };
  });
}

export interface HalQilishKirimi {
  readonly sorovId: number;
  readonly tasdiqlansinmi: boolean;
  /** TZ 10.13 — admin brak uchun ustadan summa ushlab qolishi mumkin */
  readonly ushlanmaSumma: string;
  /** TZ 8.17.5.1 — material defekti bo'lsa haq saqlanadi (Q-15 istisnosi) */
  readonly haqSaqlandi: boolean;
  readonly izoh: string | null;
}

export interface HalQilishNatijasi {
  readonly holat: 'TASDIQLANDI' | 'RAD_ETILDI';
  readonly pozitsiyaHolati: PozitsiyaHolati;
  /** EC-BRK-02 — yangi bo'lak topilmadi */
  readonly materialTopilmadi: boolean;
  /** Birinchi kesim chiqindiga ketgan maydon (8.17.4) */
  readonly chiqindiKvM: number;
  /** EC-BRK-03 — adminga ko'rsatiladigan jami son (8.17.8) */
  readonly qaytaKesildiSoni: number;
}

/**
 * TZ 8.17.2, 3-qadam — admin qaror qiladi.
 *
 * Tasdiqlansa BITTA TRANZAKSIYADA:
 *   1. Eski band bo'shaydi (agar qolgan bo'lsa)
 *   2. Birinchi kesim TO'LIQ CHIQINDIGA (8.17.4)
 *   3. Yangi bo'lak topiladi va band qilinadi (7.3)
 *   4. Pozitsiya «Ishlab chiqarilmoqda» ga qaytadi
 *   5. `qayta_kesildi_soni` oshadi (8.17.8)
 *
 * ⚠️ Haq bekor qilish (8.17.5) BU YERDA EMAS — u `xodim_harakat`
 *    jadvaliga tegadi va u 5-bosqichda yaratiladi (T-09). Hozircha
 *    qaror `haq_saqlandi` ustunida yoziladi va ish haqi hisobi shu
 *    ustunga tayanadi.
 */
export async function qaytaKesishHal(
  ulanish: postgres.Sql,
  kirim: HalQilishKirimi,
  adminId: number,
): Promise<HalQilishNatijasi> {
  return ulanish.begin(async (tx) => {
    const sorovlar = await tx<
      {
        id: number;
        buyurtma_pozitsiya_id: number;
        holat: string;
        sabab: string;
      }[]
    >`SELECT id, buyurtma_pozitsiya_id, holat, sabab FROM qayta_kesish
      WHERE id = ${kirim.sorovId} FOR UPDATE`;

    const sorov = sorovlar[0];
    if (sorov === undefined) throw new BiznesXato('QK_TOPILMADI', String(kirim.sorovId));
    if (sorov.holat !== 'SOROV') throw new BiznesXato('QK_ALLAQACHON_HAL', sorov.holat);

    const pozitsiyaId = sorov.buyurtma_pozitsiya_id;

    const pozitsiyalar = await tx<
      {
        holat: string;
        eni_sm: number;
        boyi_sm: number;
        qayta_kesildi_soni: number;
        sotgan_filial_id: number;
        ishlab_chiqaruvchi_filial_id: number;
      }[]
    >`
      SELECT p.holat, p.eni_sm, p.boyi_sm, p.qayta_kesildi_soni,
             b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${pozitsiyaId}
      FOR UPDATE OF p`;

    const p = pozitsiyalar[0];
    if (p === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI', String(pozitsiyaId));

    const filialId = p.ishlab_chiqaruvchi_filial_id;

    // ── EC-BRK-01 — rad etilsa pozitsiya O'Z HOLIDA qoladi ──
    if (!kirim.tasdiqlansinmi) {
      await tx`
        UPDATE qayta_kesish
        SET holat = 'RAD_ETILDI', hal_qildi_id = ${adminId}, hal_qilindi = now(),
            ozgartirildi = now(), ozgartirdi_id = ${adminId}
        WHERE id = ${kirim.sorovId}`;

      await tx`
        INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                  yangi_qiymat, izoh)
        VALUES (${adminId}, ${filialId}, 'QAYTA_KESISH_RAD', 'qayta_kesish',
                ${kirim.sorovId}, ${tx.json({ holat: 'RAD_ETILDI' })}, ${kirim.izoh})`;

      return {
        holat: 'RAD_ETILDI',
        pozitsiyaHolati: p.holat as PozitsiyaHolati,
        materialTopilmadi: false,
        chiqindiKvM: 0,
        qaytaKesildiSoni: p.qayta_kesildi_soni,
      };
    }

    // ── 1–2. Eski band va birinchi kesim ──
    let chiqindiKvM = 0;

    const bandlar = await tx<
      {
        band_id: number;
        bolak_id: number;
        kod: string;
        eni_m: string;
        boyi_m: string;
        material_id: number;
        pozitsiya_material_id: number;
        tannarx_birlik_snapshot: string;
      }[]
    >`
      SELECT bd.id AS band_id, bo.id AS bolak_id, bo.kod, bo.eni_m, bo.boyi_m,
             bo.material_id, bd.pozitsiya_material_id, bo.tannarx_birlik_snapshot
      FROM band bd
      JOIN bolak bo ON bo.id = bd.bolak_id
      WHERE bd.buyurtma_pozitsiya_id = ${pozitsiyaId} AND bd.holat = 'FAOL'
      FOR UPDATE OF bo`;

    /**
     * TZ 8.17.4 — «Birinchi kesimdan chiqqan bo'lak butunligicha yaroqsiz
     * bo'lsa TO'LIQ CHIQINDIGA.»
     *
     * ⚠️ Band hali FAOL bo'lsa — usta «Tugatdim» bosmagan, mato hali
     *    omborda ko'rinadi. U jismonan buzilgan, shuning uchun ombordan
     *    chiqariladi va chiqindiga yoziladi.
     *
     *    Band yo'q bo'lsa (EC-BRK-05) — «Tugatdim» allaqachon bosilgan,
     *    material allaqachon yechilgan va TIKLANMAYDI.
     */
    for (const b of bandlar) {
      const kvM = new Decimal(b.eni_m).times(b.boyi_m);
      const tannarx = new Decimal(b.tannarx_birlik_snapshot);
      chiqindiKvM += kvM.toNumber();

      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                   tannarx_summa, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${filialId}, ${b.bolak_id}, 'CHIQINDI',
                ${kvM.negated().toFixed(4)}, ${tannarx.times(kvM).negated().toFixed(2)},
                'qayta_kesish', ${kirim.sorovId},
                ${`Ishlab chiqarish braki — ${sorov.sabab} (8.17)`},
                ${adminId})`;

      await tx`
        UPDATE bolak SET holat = 'BRAK', ozgartirildi = now(), ozgartirdi_id = ${adminId}
        WHERE id = ${b.bolak_id}`;

      await tx`
        UPDATE band SET holat = 'ISHLATILDI', ozgartirildi = now(),
                        ozgartirdi_id = ${adminId}
        WHERE id = ${b.band_id}`;
    }

    // ── 3. Yangi bo'lak (7.3 · 7.6) ──
    const slotlar = await tx<
      { id: number; material_id: number; hisoblangan_miqdor: string; birlik: string }[]
    >`
      SELECT id, material_id, hisoblangan_miqdor, birlik
      FROM pozitsiya_material WHERE buyurtma_pozitsiya_id = ${pozitsiyaId}`;

    const sorovlarRoyxati: SlotSorovi[] = slotlar
      .filter((s) => s.birlik === 'KV_M')
      .map((s) => ({
        pozitsiyaMaterialId: s.id,
        materialId: s.material_id,
        // P-24 — kesim to'rtburchagi maydondan chiqadi
        kerak: kesimOlchami(s.hisoblangan_miqdor, p.boyi_sm),
        majburiy: true,
      }));

    const band =
      sorovlarRoyxati.length === 0
        ? ({ holat: 'BAND_QILINDI', bandlar: [] } as const)
        : await bandQilTx(tx, pozitsiyaId, filialId, sorovlarRoyxati, adminId);

    // ── 4. Pozitsiya holati ──
    // EC-BRK-02 — mos bo'lak yo'q bo'lsa «Materialga kutmoqda»
    const yangiHolat: PozitsiyaHolati =
      band.holat === 'MATERIAL_YOQ' ? 'MATERIALGA_KUTMOQDA' : 'ISHLAB_CHIQARILMOQDA';

    /**
     * ⚠️ 8.17.8 — «Yangi status kerak emas, pozitsiya "Ishlab
     *    chiqarilmoqda"ga QAYTADI.» Bu TAYYOR → ISHLAB_CHIQARILMOQDA
     *    o'tishini talab qiladi, lekin 8.3 ning oq ro'yxati uni
     *    taqiqlaydi (tayyor mahsulot ishlab chiqarishga qaytmaydi).
     *
     *    Ziddiyat ONGLI ravishda 8.17 foydasiga hal qilindi: qayta
     *    kesish aynan shu holatni yaratish uchun bor va u FAQAT admin
     *    tasdig'i bilan bo'ladi. Shuning uchun bu yerda `otishniTekshir`
     *    chaqirilmaydi — u umumiy oqim uchun (P-25).
     */

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = ${yangiHolat},
          qayta_kesildi_soni = qayta_kesildi_soni + 1,
          tugatildi = NULL,
          ozgartirildi = now(), ozgartirdi_id = ${adminId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      UPDATE qayta_kesish
      SET holat = 'TASDIQLANDI', hal_qildi_id = ${adminId}, hal_qilindi = now(),
          ushlanma_summa = ${kirim.ushlanmaSumma}, haq_saqlandi = ${kirim.haqSaqlandi},
          ozgartirildi = now(), ozgartirdi_id = ${adminId}
      WHERE id = ${kirim.sorovId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${adminId}, ${filialId}, 'QAYTA_KESISH_TASDIQ', 'qayta_kesish',
              ${kirim.sorovId},
              ${tx.json({ pozitsiya_holati: p.holat })},
              ${tx.json({
                pozitsiya_holati: yangiHolat,
                chiqindi_kv_m: chiqindiKvM,
                qayta_kesildi_soni: p.qayta_kesildi_soni + 1,
                ushlanma: kirim.ushlanmaSumma,
                // Q-15 — standart holatda haq BEKOR qilinadi
                haq_saqlandi: kirim.haqSaqlandi,
              })},
              ${kirim.izoh})`;

    return {
      holat: 'TASDIQLANDI',
      pozitsiyaHolati: yangiHolat,
      materialTopilmadi: band.holat === 'MATERIAL_YOQ',
      chiqindiKvM,
      qaytaKesildiSoni: p.qayta_kesildi_soni + 1,
    };
  });
}
