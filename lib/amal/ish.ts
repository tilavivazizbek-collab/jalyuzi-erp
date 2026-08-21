/**
 * lib/amal/ish.ts — TZ 7.6 · 8.5 · 8.6 · 8.8 · 8.9 · 10.10
 *                   2.1 · 2.2 · 2.3-invariant · TZ 2.4
 *
 * Ustaning ish oqimi: ishni olish, «Tugatdim», qaytarib olish, bekor
 * qilish.
 *
 * ⚠️ TZ 8.5 — «Admin ustani taqsimlamaydi. Tasdiqlangan pozitsiya
 *    umumiy navbatga tushadi va usta botdan O'ZI oladi. Ikki usta bitta
 *    pozitsiyani birga olsa — birinchi so'rov oladi, ikkinchisiga
 *    "bu ish allaqachon olingan" qaytariladi.»
 *
 *    Shuning uchun ishni olish `FOR UPDATE` bilan qulflanadi va holat
 *    SHARTI bilan yangilanadi — poyga baza darajasida yopiladi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import {
  kesimBalansi,
  kesimQatorlari,
  type Chegaralar,
  type Qoldiq,
} from '@/lib/domain/kesish';
import {
  navbatdami,
  otishniTekshir,
  qaytaribOlinadimi,
  tugatilgandan,
  bekorQilinadimi,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import { bandniBoshatTx } from './band';
import { BiznesXato } from '@/lib/xato';

interface PozitsiyaQatori {
  readonly id: number;
  readonly holat: string;
  readonly usta_id: number | null;
  readonly buyurtma_id: number;
  readonly sotgan_filial_id: number;
  readonly ishlab_chiqaruvchi_filial_id: number;
}

async function pozitsiyaniQulfla(
  tx: postgres.TransactionSql,
  pozitsiyaId: number,
): Promise<PozitsiyaQatori> {
  const q = await tx<PozitsiyaQatori[]>`
    SELECT p.id, p.holat, p.usta_id, p.buyurtma_id,
           b.sotgan_filial_id, b.ishlab_chiqaruvchi_filial_id
    FROM buyurtma_pozitsiya p
    JOIN buyurtma b ON b.id = p.buyurtma_id
    WHERE p.id = ${pozitsiyaId}
    FOR UPDATE OF p`;

  const p = q[0];
  if (p === undefined) throw new BiznesXato('POZITSIYA_TOPILMADI', String(pozitsiyaId));
  return p;
}

// ─── TZ 8.5 · Ishni olish ─────────────────────────────────────────────────

/**
 * TZ 8.5 — usta navbatdan ishni oladi.
 *
 * ⚠️ Stavka SHU PAYTDA qotadi (10.10, 2.3-invariant): admin keyin
 *    stavkani o'zgartirsa, boshlangan ish eski stavkada qoladi.
 */
export async function ishniOl(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  ustaId: number,
  stavka: string,
): Promise<{ olindi: boolean }> {
  return ulanish.begin(async (tx) => {
    const p = await pozitsiyaniQulfla(tx, pozitsiyaId);

    if (!navbatdami(p.holat as PozitsiyaHolati)) {
      // 8.5 — «bu ish allaqachon olingan»
      throw new BiznesXato('ISH_ALLAQACHON_OLINGAN', p.holat);
    }

    otishniTekshir(p.holat as PozitsiyaHolati, 'ISHLAB_CHIQARILMOQDA');

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = 'ISHLAB_CHIQARILMOQDA', usta_id = ${ustaId},
          stavka_snapshot = ${stavka},
          ozgartirildi = now(), ozgartirdi_id = ${ustaId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${ustaId}, ${p.ishlab_chiqaruvchi_filial_id}, 'ISH_OLINDI',
              'buyurtma_pozitsiya', ${pozitsiyaId},
              ${tx.json({ holat: p.holat, usta_id: p.usta_id })},
              ${tx.json({ holat: 'ISHLAB_CHIQARILMOQDA', usta_id: ustaId, stavka })},
              ${'Usta ishni navbatdan oldi'})`;

    return { olindi: true };
  });
}

// ─── TZ 8.6 · Ishni qaytarib olish ────────────────────────────────────────

/**
 * TZ 8.6 — «Admin ishni qaytarib ola oladi... FAQAT "Ishlab
 * chiqarilmoqda" holatida. Stavkani ADMIN QO'LDA kiritadi — usta ishning
 * bir qismini bajargan bo'lishi mumkin. Sabab majburiy.»
 */
export async function ishniQaytaribOl(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  tolanadiganStavka: string,
  sabab: string,
  adminId: number,
): Promise<{ eskiUstaId: number | null }> {
  if (sabab.trim() === '') {
    throw new BiznesXato('ISH_SABAB_KERAK', 'qaytarib olish sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const p = await pozitsiyaniQulfla(tx, pozitsiyaId);

    if (!qaytaribOlinadimi(p.holat as PozitsiyaHolati)) {
      throw new BiznesXato('POZITSIYA_OTISH_MUMKIN_EMAS', p.holat);
    }

    // 20.5 — pozitsiya umumiy navbatga qaytadi
    const qaytish: PozitsiyaHolati =
      p.sotgan_filial_id === p.ishlab_chiqaruvchi_filial_id
        ? 'TASDIQLANGAN'
        : 'FILIALGA_YUBORILDI';

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = ${qaytish}, usta_id = NULL,
          stavka_snapshot = ${tolanadiganStavka},
          ozgartirildi = now(), ozgartirdi_id = ${adminId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${adminId}, ${p.ishlab_chiqaruvchi_filial_id}, 'ISH_QAYTARIB_OLINDI',
              'buyurtma_pozitsiya', ${pozitsiyaId},
              ${tx.json({ holat: p.holat, usta_id: p.usta_id })},
              ${tx.json({ holat: qaytish, tolanadigan_stavka: tolanadiganStavka })},
              ${sabab.trim()})`;

    return { eskiUstaId: p.usta_id };
  });
}

// ─── TZ 7.6 · «Tugatdim» ──────────────────────────────────────────────────

export type KesimManbasi = 'OSTATKA' | 'RULON';

export interface TugatdimKirimi {
  readonly pozitsiyaId: number;
  /** TZ 7.6 — usta manbani tasdiqlaydi yoki o'zgartiradi */
  readonly manba: KesimManbasi;
  /** Usta tuzatgan qolgan bo'lak o'lchami (egrilik uchun 5–10 sm oddiy) */
  readonly qoldiq: Qoldiq;
  /**
   * TZ 7.6 — «Ostatka bor turib rulon tanlansa OGOHLANTIRISH.»
   * Usta ogohlantirishni ko'rib davom etganini bildiradi.
   */
  readonly ogohTasdiqlandi: boolean;
  readonly izoh: string | null;
}

export interface TugatdimNatijasi {
  readonly holat: PozitsiyaHolati;
  /** Kesilgan bo'lak kodi */
  readonly manbaBolakKod: string;
  readonly mahsulotgaKvM: number;
  readonly ostatkaKvM: number;
  readonly chiqindiKvM: number;
  /** Yangi qoldiq kesma kodi — chiqindi bo'lsa null */
  readonly yangiOstatkaKod: string | null;
}

/**
 * TZ 7.6 — usta «Tugatdim» bosadi.
 *
 * Bitta tranzaksiyada (CLAUDE.md §3):
 *   1. Band qilingan bo'lak topiladi va qulflanadi
 *   2. Kesim UCH QATOR bo'lib ombor jurnaliga tushadi (7.6)
 *   3. Manba bo'lak `ISHLATILDI` bo'ladi, band yopiladi
 *   4. Qoldiq saqlansa — YANGI bo'lak, tannarxi OTASIDAN meros (EC-OMB-06)
 *   5. Pozitsiya `TAYYOR` yoki `TAYYOR_YOLDA` (20.5)
 *
 * ⚠️ Aniq bo'lak raqami USTADAN so'ralmaydi (7.6): «usta o'nlab bo'lak
 *    orasidan qaysi birini olganini har safar qayd etsa — bu ortiqcha
 *    ish va u baribir bajarmaydi». Tizim band qilingan bo'lakni oladi.
 */
export async function tugatdim(
  ulanish: postgres.Sql,
  kirim: TugatdimKirimi,
  chegaralar: Chegaralar,
  xodimId: number,
): Promise<TugatdimNatijasi> {
  return ulanish.begin(async (tx) => {
    const p = await pozitsiyaniQulfla(tx, kirim.pozitsiyaId);

    if (p.holat !== 'ISHLAB_CHIQARILMOQDA') {
      throw new BiznesXato('POZITSIYA_OTISH_MUMKIN_EMAS', p.holat);
    }

    // Band qilingan bo'lak — 7.6: tizim o'zi topadi
    const bandlar = await tx<
      {
        band_id: number;
        bolak_id: number;
        kod: string;
        turi: string;
        eni_m: string;
        boyi_m: string;
        material_id: number;
        tannarx_birlik_snapshot: string;
        tannarx_valyuta_snapshot: string;
      }[]
    >`
      SELECT bd.id AS band_id, bo.id AS bolak_id, bo.kod, bo.turi,
             bo.eni_m, bo.boyi_m, bo.material_id,
             bo.tannarx_birlik_snapshot, bo.tannarx_valyuta_snapshot
      FROM band bd
      JOIN bolak bo ON bo.id = bd.bolak_id
      WHERE bd.buyurtma_pozitsiya_id = ${kirim.pozitsiyaId} AND bd.holat = 'FAOL'
      ORDER BY bd.id
      FOR UPDATE OF bo`;

    const band = bandlar[0];
    if (band === undefined) {
      throw new BiznesXato('BAND_TOPILMADI', String(kirim.pozitsiyaId));
    }

    const manbaBolak = {
      id: band.bolak_id,
      kod: band.kod,
      turi: band.turi as 'RULON' | 'OSTATKA',
      eniM: Number(band.eni_m),
      boyiM: Number(band.boyi_m),
      qismanOchilgan: false,
    };

    // §2.2 — uch qator qoidasi DOMAINDA, bu yerda takrorlanmaydi
    const kesim = kesimQatorlari(manbaBolak, kirim.qoldiq, chegaralar);
    if (!kesimBalansi(kesim)) {
      throw new BiznesXato('KESIM_NOTOGRI', 'kesim balansi to\'g\'ri kelmadi');
    }

    const tannarx = new Decimal(band.tannarx_birlik_snapshot);
    const filialId = p.ishlab_chiqaruvchi_filial_id;

    /** P-20 — tannarx SARFLASH birligida, summa maydonga ko'paytiriladi. */
    const summa = (kvM: number): string => tannarx.times(kvM).toFixed(2);

    // ── 1-qator: manbadan chiqdi (7.6) ──
    // Jurnalga MANFIY tushadi — bo'lak ombordan chiqmoqda (2.2-invariant)
    const chiqdiKvM = Number(kesim.qatorlar.find((q) => q.turi === 'KESIM')?.kvM ?? 0);
    await tx`
      INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                 tannarx_summa, manba_turi, manba_id, izoh, xodim_id)
      VALUES (${filialId}, ${band.bolak_id}, 'KESIM',
              ${(-chiqdiKvM).toFixed(4)}, ${summa(-chiqdiKvM)},
              'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
              ${`${kirim.manba} dan kesildi${kirim.izoh === null ? '' : ` — ${kirim.izoh}`}`},
              ${xodimId})`;

    // Manba bo'lak ombordan chiqadi
    await tx`
      UPDATE bolak SET holat = 'ISHLATILDI', buyurtma_pozitsiya_id = ${kirim.pozitsiyaId},
                       ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${band.bolak_id}`;

    await tx`
      UPDATE band SET holat = 'ISHLATILDI', ozgartirildi = now(),
                      ozgartirdi_id = ${xodimId}
      WHERE id = ${band.band_id}`;

    // ── 2-qator: qoldiq kesma ──
    const ostatka = kesim.qatorlar.find((q) => q.turi === 'OSTATKA');
    let yangiKod: string | null = null;

    if ((ostatka?.kvM ?? 0) > 0 && ostatka?.eniM !== null && ostatka?.boyiM !== null) {
      const yangi = await tx<{ id: number; kod: string }[]>`
        INSERT INTO bolak (material_id, filial_id, kod, turi, eni_m, boyi_m,
                           ota_bolak_id, tannarx_birlik_snapshot,
                           tannarx_valyuta_snapshot, holat, yaratdi_id)
        VALUES (${band.material_id}, ${filialId},
                'O-' || nextval('bolak_kod_seq'), 'OSTATKA',
                ${ostatka?.eniM ?? 0}, ${ostatka?.boyiM ?? 0},
                ${band.bolak_id},
                -- EC-OMB-06 — tannarx OTASIDAN meros oladi, qayta hisoblanmaydi
                ${band.tannarx_birlik_snapshot}, ${band.tannarx_valyuta_snapshot},
                'BOSH', ${xodimId})
        RETURNING id, kod`;

      yangiKod = yangi[0]?.kod ?? null;

      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                   tannarx_summa, manba_turi, manba_id, xodim_id)
        VALUES (${filialId}, ${yangi[0]?.id ?? 0}, 'OSTATKA',
                ${(ostatka?.kvM ?? 0).toFixed(4)}, ${summa(ostatka?.kvM ?? 0)},
                'buyurtma_pozitsiya', ${kirim.pozitsiyaId}, ${xodimId})`;
    }

    // ── 3-qator: chiqindi — HAQIQIY YO'QOTISH (7.6) ──
    const chiqindi = kesim.qatorlar.find((q) => q.turi === 'CHIQINDI');
    if ((chiqindi?.kvM ?? 0) > 0) {
      await tx`
        INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_kv_m,
                                   tannarx_summa, manba_turi, manba_id, izoh,
                                   xodim_id)
        VALUES (${filialId}, ${band.bolak_id}, 'CHIQINDI',
                ${(chiqindi?.kvM ?? 0).toFixed(4)}, ${summa(chiqindi?.kvM ?? 0)},
                'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
                ${kesim.qoldiqDarajasi === 'YAROQSIZ' ? 'Yaroqsiz qoldiq (7.5)' : null},
                ${xodimId})`;
    }

    // ── Pozitsiya holati (20.5) ──
    const yangiHolat = tugatilgandan(
      p.sotgan_filial_id,
      p.ishlab_chiqaruvchi_filial_id,
    );
    otishniTekshir('ISHLAB_CHIQARILMOQDA', yangiHolat);

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = ${yangiHolat}, tugatildi = now(),
          -- 3.15.4 — tayyor mahsulot sotilsa tannarx kerak bo'ladi
          tannarx_snapshot = ${summa(kesim.mahsulotgaKvM)},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'TUGATDIM', 'buyurtma_pozitsiya',
              ${kirim.pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({
                holat: yangiHolat,
                manba: kirim.manba,
                manba_bolak: band.kod,
                mahsulotga_kv_m: kesim.mahsulotgaKvM,
                ostatka_kv_m: ostatka?.kvM ?? 0,
                chiqindi_kv_m: chiqindi?.kvM ?? 0,
                // 7.6 · 11.7.7 — «ostatka turgan holda rulon ochildi»
                ogoh_tasdiqlandi: kirim.ogohTasdiqlandi,
              })},
              ${kirim.izoh})`;

    return {
      holat: yangiHolat,
      manbaBolakKod: band.kod,
      mahsulotgaKvM: kesim.mahsulotgaKvM,
      ostatkaKvM: ostatka?.kvM ?? 0,
      chiqindiKvM: chiqindi?.kvM ?? 0,
      yangiOstatkaKod: yangiKod,
    };
  });
}

// ─── TZ 8.8 · Bekor qilish ────────────────────────────────────────────────

/**
 * TZ 8.8 — «Bekor qilish — FAQAT KESISHDAN OLDIN. Material tegilmagan,
 * zarar yo'q, to'langan pul to'liq qaytariladi.»
 *
 * Band qilingan material bo'shatiladi (7.3 · Q-06).
 */
export async function pozitsiyaniBekorQil(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  sabab: string,
  xodimId: number,
): Promise<{ boshatilganBand: number }> {
  if (sabab.trim() === '') {
    throw new BiznesXato('ISH_SABAB_KERAK', 'bekor qilish sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const p = await pozitsiyaniQulfla(tx, pozitsiyaId);

    if (!bekorQilinadimi(p.holat as PozitsiyaHolati)) {
      throw new BiznesXato('POZITSIYA_OTISH_MUMKIN_EMAS', p.holat);
    }
    otishniTekshir(p.holat as PozitsiyaHolati, 'BEKOR');

    // Q-06 — band bo'shatiladi, sabab bilan
    const boshatilgan = await bandniBoshatTx(tx, pozitsiyaId, 'BEKOR', xodimId, sabab);

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = 'BEKOR', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${p.sotgan_filial_id}, 'BEKOR', 'buyurtma_pozitsiya',
              ${pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({ holat: 'BEKOR', boshatilgan_band: boshatilgan })},
              ${sabab.trim()})`;

    return { boshatilganBand: boshatilgan };
  });
}
