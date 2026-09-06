/**
 * lib/amal/buyurtma-tahrir.ts — TZ 8.7 · 2.1 · 2.4-invariant
 *
 * Buyurtma pozitsiyasini TAHRIRLASH va mavjud buyurtmaga YANGI
 * POZITSIYA qo'shish.
 *
 * ⚠️ NEGA BU FAYL BOR
 *
 *    TZ 8.7: «Pozitsiya "Ishlab chiqarilmoqda" ga o'tmaguncha
 *    tahrirlanadi: rang, o'lcham, aksessuar, narx.»
 *
 *    2026-09-03 auditigacha bu UMUMAN yozilmagan edi. Qoida
 *    (`tahrirlanadimi`) va xato kodi (`POZITSIYA_TAHRIRLANMAYDI`)
 *    turardi, lekin ularni ishlatadigan kod yo'q edi. Sotuvchi
 *    o'lchamni 120 o'rniga 130 deb xato kiritsa, tuzatib bo'lmasdi —
 *    pozitsiyani bekor qilib qaytadan kiritish kerak edi.
 *
 * ⚠️ BITTA TRANZAKSIYADA (CLAUDE.md §3): pozitsiya, slot materiallari,
 *    aksessuarlar, BAND QAYTA HISOBLANISHI, mijoz qarzining tuzatilishi
 *    va audit. Yarim tahrirlangan pozitsiya bo'lmaydi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { bandQilTx, bandniBoshatTx, type SlotSorovi } from './band';
import {
  tahrirlanadimi,
  tasdiqdanKeyin,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import {
  pozitsiyaYozTx,
  type AksessuarKirimi,
  type PozitsiyaKirimi,
  type SlotKirimi,
} from './buyurtma';
import { sarflashniTekshir } from './sarflash';
import { BiznesXato } from '@/lib/xato';

export interface PozitsiyaTahriri {
  readonly pozitsiyaId: number;
  /** TZ 3.4 — o'lcham SANTIMETRDA */
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly soni: number;
  readonly narxSnapshot: string;
  readonly chegirmaSumma: string;
  readonly xizmatHaqi: string;
  readonly formulaSnapshot: unknown;
  readonly slotlar: readonly SlotKirimi[];
  readonly aksessuarlar: readonly AksessuarKirimi[];
}

export interface TahrirNatijasi {
  readonly holat: PozitsiyaHolati;
  /** Band qayta qo'yilganda topilmagan materiallar (8.12) */
  readonly topilmaganMateriallar: readonly number[];
  /** Band qayta hisoblandimi — o'lcham yoki mato o'zgargan bo'lsa */
  readonly bandQaytaQoyildi: boolean;
  /** Mijoz qarziga yozilgan farq (musbat — oshdi, manfiy — kamaydi) */
  readonly qarzFarqi: string;
}

interface EskiQator {
  readonly id: number;
  readonly holat: string;
  readonly buyurtma_id: number;
  readonly mahsulot_tur_id: number | null;
  readonly qoshimcha_material_id: number | null;
  readonly eni_sm: number;
  readonly boyi_sm: number;
  readonly soni: number;
  readonly narx_snapshot: string;
  readonly chegirma_summa: string | null;
  readonly xizmat_haqi: string | null;
  readonly mijoz_id: number | null;
  readonly sotgan_filial_id: number;
  readonly ishlab_chiqaruvchi_filial_id: number;
  readonly valyuta: string;
  readonly kurs_snapshot: string | null;
  readonly raqam: string;
}

/**
 * TZ 8.7 — pozitsiyani tahrirlaydi.
 *
 * ⚠️ QO'SHIMCHA BUYUM TAHRIRLANMAYDI. Uning materiali sotuv paytida
 *    ombordan ALLAQACHON yechilgan (3.10): sonini o'zgartirish
 *    qoldiqni ham tuzatishni talab qiladi va bu boshqa amal.
 *    Kerak bo'lsa qator bekor qilinib qaytadan qo'shiladi.
 */
export async function pozitsiyaniTahrirla(
  ulanish: postgres.Sql,
  kirim: PozitsiyaTahriri,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<TahrirNatijasi> {
  if (kirim.slotlar.length === 0) {
    throw new BiznesXato('BUYURTMA_BOSH', String(kirim.pozitsiyaId));
  }

  return ulanish.begin(async (tx) => {
    const q = await tx<EskiQator[]>`
      SELECT p.id, p.holat, p.buyurtma_id, p.mahsulot_tur_id,
             p.qoshimcha_material_id, p.eni_sm, p.boyi_sm, p.soni,
             p.narx_snapshot::text, p.chegirma_summa::text, p.xizmat_haqi::text,
             b.mijoz_id, b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id,
             b.valyuta, b.kurs_snapshot::text, b.raqam
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${kirim.pozitsiyaId}
      FOR UPDATE OF p`;

    const eski = q[0];
    if (eski === undefined) {
      throw new BiznesXato('POZITSIYA_TOPILMADI', String(kirim.pozitsiyaId));
    }

    // §2.2 — qoida DOMAINDA, bu yerda takrorlanmaydi
    if (!tahrirlanadimi(eski.holat as PozitsiyaHolati)) {
      throw new BiznesXato('POZITSIYA_TAHRIRLANMAYDI', eski.holat);
    }

    if (eski.qoshimcha_material_id !== null) {
      throw new BiznesXato(
        'POZITSIYA_TAHRIRLANMAYDI',
        "qo'shimcha buyum — bekor qilib qaytadan qo'shiladi (3.10)",
      );
    }

    /**
     * §9.4 — TAHRIRDA HAM SARFLASH SERVERDA QAYTA HISOBLANADI.
     *
     * ⚠️ Tahrir ekrani ham o'lchamni o'zgartirib sarflashni
     *    BRAUZERDA qayta hisoblaydi (`tahrir.tsx`). Yaratishda
     *    tekshirib, tahrirda tekshirmaslik teshikni ochiq
     *    qoldirardi — buyurtma yaratilib, keyin tahrirlanardi.
     */
    if (eski.qoshimcha_material_id === null && eski.mahsulot_tur_id !== null) {
      await sarflashniTekshir(tx, {
        mahsulotTurId: eski.mahsulot_tur_id,
        eniSm: kirim.eniSm,
        boyiSm: kirim.boyiSm,
        soni: kirim.soni,
        formulaSnapshot: kirim.formulaSnapshot,
        slotlar: kirim.slotlar,
      });
    }

    // ── Eski slot materiallari — solishtirish va audit uchun ──
    const eskiSlotlar = await tx<
      {
        id: number;
        slot_id: number;
        material_id: number;
        hisoblangan_miqdor: string;
        tuzatilgan_miqdor: string | null;
        birlik: string;
        narx_snapshot: string;
      }[]
    >`
      SELECT id, slot_id, material_id, hisoblangan_miqdor::text,
             tuzatilgan_miqdor::text, birlik, narx_snapshot::text
      FROM pozitsiya_material
      WHERE buyurtma_pozitsiya_id = ${kirim.pozitsiyaId}
      ORDER BY slot_id`;

    /**
     * ⚠️ BAND QAYTA HISOBLANADIMI.
     *
     *    O'lcham yoki matolar o'zgarsa — ha: eski bo'lak endi mos
     *    kelmasligi mumkin. Faqat narx yoki aksessuar o'zgarsa —
     *    yo'q, ombordagi bo'lak o'sha-o'sha.
     */
    const olchamOzgardi =
      eski.eni_sm !== kirim.eniSm || eski.boyi_sm !== kirim.boyiSm;

    const eskiXarita = new Map(eskiSlotlar.map((s) => [s.slot_id, s]));
    const matoOzgardi = kirim.slotlar.some((s) => {
      const e = eskiXarita.get(s.slotId);
      return (
        e === undefined ||
        e.material_id !== s.materialId ||
        new Decimal(e.hisoblangan_miqdor).comparedTo(
          new Decimal(s.hisoblanganMiqdor),
        ) !== 0
      );
    });

    const bandKerak = olchamOzgardi || matoOzgardi;

    // ── Pozitsiyaning o'zi ──
    await tx`
      UPDATE buyurtma_pozitsiya
      SET eni_sm = ${kirim.eniSm}, boyi_sm = ${kirim.boyiSm},
          soni = ${kirim.soni}, narx_snapshot = ${kirim.narxSnapshot},
          chegirma_summa = ${kirim.chegirmaSumma},
          xizmat_haqi = ${kirim.xizmatHaqi},
          formula_snapshot = ${tx.json(kirim.formulaSnapshot as never)},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.pozitsiyaId}`;

    /**
     * ── Slot materiallari ──
     *
     * ⚠️ Qator O'CHIRILMAYDI, YANGILANADI: unga `band` tashqi kalit
     *    bilan bog'langan (§3.2.1). O'chirib qayta yozish bandni
     *    uzib qo'yardi.
     */
    for (const s of kirim.slotlar) {
      const e = eskiXarita.get(s.slotId);

      if (e === undefined) {
        await tx`
          INSERT INTO pozitsiya_material (buyurtma_pozitsiya_id, slot_id, material_id,
                                          hisoblangan_miqdor, tuzatilgan_miqdor,
                                          birlik, narx_snapshot)
          VALUES (${kirim.pozitsiyaId}, ${s.slotId}, ${s.materialId},
                  ${s.hisoblanganMiqdor}, ${s.tuzatilganMiqdor}, ${s.birlik},
                  ${s.narxSnapshot})`;
      } else {
        await tx`
          UPDATE pozitsiya_material
          SET material_id = ${s.materialId},
              hisoblangan_miqdor = ${s.hisoblanganMiqdor},
              tuzatilgan_miqdor = ${s.tuzatilganMiqdor},
              birlik = ${s.birlik},
              narx_snapshot = ${s.narxSnapshot}
          WHERE id = ${e.id}`;
      }
    }

    /**
     * ── Aksessuarlar ──
     *
     * ⚠️ Bularga hech narsa bog'lanmagan va ular pozitsiyaning JORIY
     *    tarkibi (jurnal emas), shuning uchun ro'yxat butunlay
     *    almashtiriladi: aksessuarni OLIB TASHLASH ham tahrirning bir
     *    qismi (8.7).
     */
    await tx`
      DELETE FROM pozitsiya_aksessuar
      WHERE buyurtma_pozitsiya_id = ${kirim.pozitsiyaId}`;

    for (const a of kirim.aksessuarlar) {
      await tx`
        INSERT INTO pozitsiya_aksessuar (buyurtma_pozitsiya_id, material_id,
                                         soni, birlik, narx_snapshot,
                                         qolda_kiritildi)
        VALUES (${kirim.pozitsiyaId}, ${a.materialId}, ${a.soni}, ${a.birlik},
                ${a.narxSnapshot}, ${a.qoldaKiritildi})`;
    }

    // ── Band qayta hisoblanishi (7.3) ──
    let holat = eski.holat as PozitsiyaHolati;
    let topilmagan: readonly number[] = [];

    if (bandKerak) {
      await bandniBoshatTx(
        tx,
        kirim.pozitsiyaId,
        'BOSHQA',
        xodimId,
        'Pozitsiya tahrirlandi (8.7)',
      );

      const yangiSlotlar = await tx<{ id: number; slot_id: number }[]>`
        SELECT id, slot_id FROM pozitsiya_material
        WHERE buyurtma_pozitsiya_id = ${kirim.pozitsiyaId}`;

      const idBoyicha = new Map(yangiSlotlar.map((s) => [s.slot_id, s.id]));

      const sorovlar: SlotSorovi[] = [];
      for (const s of kirim.slotlar) {
        const pmId = idBoyicha.get(s.slotId);
        if (s.kerak === null || pmId === undefined) continue;
        sorovlar.push({
          pozitsiyaMaterialId: pmId,
          materialId: s.materialId,
          kerak: s.kerak,
          majburiy: true,
        });
      }

      if (sorovlar.length > 0) {
        const band = await bandQilTx(
          tx,
          kirim.pozitsiyaId,
          // 20.4.2 — tekshiruv ISHLAB CHIQARUVCHI filialda
          eski.ishlab_chiqaruvchi_filial_id,
          sorovlar,
          xodimId,
          hozir,
        );

        if (band.holat === 'MATERIAL_YOQ') {
          holat = 'MATERIALGA_KUTMOQDA';
          topilmagan = band.topilmagan;
        } else if (eski.holat === 'MATERIALGA_KUTMOQDA') {
          // Material topildi — pozitsiya navbatga qaytadi (8.12)
          holat =
            eski.sotgan_filial_id === eski.ishlab_chiqaruvchi_filial_id
              ? 'TASDIQLANGAN'
              : 'FILIALGA_YUBORILDI';
        }

        if (holat !== eski.holat) {
          await tx`
            UPDATE buyurtma_pozitsiya SET holat = ${holat}
            WHERE id = ${kirim.pozitsiyaId}`;
        }
      }
    }

    /**
     * ── MIJOZ QARZI TUZATILADI (6.8) ──
     *
     * ⚠️ Sotuv qarzi buyurtma yaratilganda `narx − chegirma` bo'yicha
     *    yozilgan. Narx tahrirlansa qarz ESKI raqamda qolib ketardi va
     *    mijoz varaqasi haqiqatdan chetga chiqardi.
     *
     * ⚠️ Eski qator O'ZGARTIRILMAYDI — jurnal (2.2-invariant). Farq
     *    yangi `SOTUV` qatori bo'lib tushadi: musbat bo'lsa qarz
     *    oshadi, manfiy bo'lsa kamayadi.
     */
    const eskiSumma = new Decimal(eski.narx_snapshot).minus(
      eski.chegirma_summa ?? 0,
    );
    const yangiSumma = new Decimal(kirim.narxSnapshot).minus(kirim.chegirmaSumma);
    const farq = yangiSumma.minus(eskiSumma);

    if (eski.mijoz_id !== null && !farq.isZero()) {
      await tx`
        INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                   kurs_snapshot, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${eski.mijoz_id}, ${eski.sotgan_filial_id}, 'SOTUV',
                ${farq.toFixed(2)}, ${eski.valyuta}, ${eski.kurs_snapshot},
                'buyurtma', ${eski.buyurtma_id},
                ${`Buyurtma ${eski.raqam} — pozitsiya tahrirlandi`},
                ${xodimId})`;
    }

    /**
     * TZ 8.7 — «Har tahrir harakatlar tarixiga ESKI VA YANGI QIYMATI
     * bilan yoziladi.»
     */
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${eski.sotgan_filial_id}, 'TAHRIRLASH',
              'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
              ${tx.json({
                eni_sm: eski.eni_sm,
                boyi_sm: eski.boyi_sm,
                soni: eski.soni,
                narx: eski.narx_snapshot,
                chegirma: eski.chegirma_summa,
                xizmat_haqi: eski.xizmat_haqi,
                matolar: eskiSlotlar.map((s) => ({
                  slot_id: s.slot_id,
                  material_id: s.material_id,
                  miqdor: s.hisoblangan_miqdor,
                })),
              })},
              ${tx.json({
                eni_sm: kirim.eniSm,
                boyi_sm: kirim.boyiSm,
                soni: kirim.soni,
                narx: kirim.narxSnapshot,
                chegirma: kirim.chegirmaSumma,
                xizmat_haqi: kirim.xizmatHaqi,
                matolar: kirim.slotlar.map((s) => ({
                  slot_id: s.slotId,
                  material_id: s.materialId,
                  miqdor: s.hisoblanganMiqdor,
                })),
                band_qayta_qoyildi: bandKerak,
                qarz_farqi: farq.toFixed(2),
                holat,
              })},
              ${`Buyurtma ${eski.raqam} — pozitsiya tahrirlandi`})`;

    return {
      holat,
      topilmaganMateriallar: topilmagan,
      bandQaytaQoyildi: bandKerak,
      qarzFarqi: farq.toFixed(2),
    };
  });
}

// ─── TZ 8.7 · Mavjud buyurtmaga YANGI POZITSIYA ──────────────────────────

export interface QoshishNatijasi {
  readonly pozitsiyaId: number;
  readonly tartib: number;
  readonly holat: PozitsiyaHolati;
  readonly topilmaganMateriallar: readonly number[];
  /** Mijoz qarziga qo'shilgan summa */
  readonly qarzgaQoshildi: string;
}

/**
 * TZ 8.7 — «Tasdiqlangan buyurtmaga YANGI POZITSIYA qo'shish mumkin.
 * Mijoz ertasi kuni "yana bittasi kerak" desa — mavjud buyurtmaga
 * qo'shiladi, yangi buyurtma ochilmaydi. Aks holda bitta mijoz,
 * bitta manzil, IKKITA CHEK bo'ladi.»
 *
 * ⚠️ Yozish mantig'i `pozitsiyaYozTx` da — buyurtma yaratish bilan
 *    BITTA joyda (§2.2). Bu funksiya faqat o'rnini topadi: qaysi
 *    buyurtmaga, nechanchi tartibda.
 *
 * ⚠️ YOPILGAN buyurtmaga qo'shilmaydi: cheki chiqarilgan, hisob
 *    yakunlangan. Unda yangi buyurtma ochiladi.
 */
export async function pozitsiyaQosh(
  ulanish: postgres.Sql,
  buyurtmaId: number,
  p: PozitsiyaKirimi,
  xodimId: number,
  hozir: Date = new Date(),
): Promise<QoshishNatijasi> {
  return ulanish.begin(async (tx) => {
    const q = await tx<
      {
        id: number;
        raqam: string;
        mijoz_id: number | null;
        sotgan_filial_id: number;
        ishlab_chiqaruvchi_filial_id: number;
        manba: string;
        valyuta: string;
        kurs_snapshot: string | null;
        yopildi: Date | null;
      }[]
    >`
      SELECT id, raqam, mijoz_id, sotgan_filial_id, ishlab_chiqaruvchi_filial_id,
             manba, valyuta, kurs_snapshot::text, yopildi
      FROM buyurtma WHERE id = ${buyurtmaId} FOR UPDATE`;

    const b = q[0];
    if (b === undefined) throw new BiznesXato('BUYURTMA_TOPILMADI', String(buyurtmaId));

    if (b.yopildi !== null) {
      throw new BiznesXato('BUYURTMA_YOPILGAN', b.raqam);
    }

    /**
     * ⚠️ Tartib QULF OSTIDA olinadi: ikki sotuvchi bir vaqtda
     *    qo'shsa ikkalasi ham bir xil raqamni olib, `(buyurtma,
     *    tartib)` noyobligi buzilardi. Buyurtma yuqorida
     *    `FOR UPDATE` bilan qulflangan.
     */
    const oxirgi = await tx<{ n: number }[]>`
      SELECT COALESCE(MAX(tartib), 0)::int AS n
      FROM buyurtma_pozitsiya WHERE buyurtma_id = ${buyurtmaId}`;

    const tartib = (oxirgi[0]?.n ?? 0) + 1;

    /**
     * ⚠️ Yangi pozitsiya buyurtmaning MANBASIGA emas, TASDIQLANGAN
     *    holatga tushadi: uni sotuvchi qo'lda qo'shmoqda, ya'ni
     *    tasdiq allaqachon bor (Q-12). Botdan kelgan buyurtmaga
     *    ham shu qoida — qo'shayotgan odam sotuvchi.
     */
    const tasdiq = tasdiqdanKeyin(b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id);

    const n = await pozitsiyaYozTx(
      tx,
      p,
      {
        buyurtmaId,
        tartib,
        ishlabChiqaruvchiFilialId: b.ishlab_chiqaruvchi_filial_id,
        boshHolati: tasdiq,
        tasdiqHolati: tasdiq,
        tasdiqlangan: true,
      },
      xodimId,
      hozir,
    );

    /**
     * TZ 6.8 — sotuv qarzni oshiradi. Yangi pozitsiya ham SOTUV:
     * mijoz endi ko'proq qarzdor.
     */
    const summa = new Decimal(p.narxSnapshot).minus(p.chegirmaSumma);

    if (b.mijoz_id !== null && !summa.isZero()) {
      await tx`
        INSERT INTO mijoz_harakat (mijoz_id, filial_id, turi, summa, valyuta,
                                   kurs_snapshot, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${b.mijoz_id}, ${b.sotgan_filial_id}, 'SOTUV',
                ${summa.toFixed(2)}, ${b.valyuta}, ${b.kurs_snapshot},
                'buyurtma', ${buyurtmaId},
                ${`Buyurtma ${b.raqam} — ${String(tartib)}-pozitsiya qo'shildi`},
                ${xodimId})`;
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                yangi_qiymat, izoh)
      VALUES (${xodimId}, ${b.sotgan_filial_id}, 'POZITSIYA_QOSHILDI',
              'buyurtma_pozitsiya', ${n.pozitsiyaId},
              ${tx.json({
                buyurtma: b.raqam,
                tartib,
                narx: p.narxSnapshot,
                holat: n.holat,
              })},
              ${`Mavjud buyurtmaga pozitsiya qo'shildi (8.7)`})`;

    return {
      pozitsiyaId: n.pozitsiyaId,
      tartib,
      holat: n.holat,
      topilmaganMateriallar: n.topilmaganMateriallar,
      qarzgaQoshildi: summa.toFixed(2),
    };
  });
}
