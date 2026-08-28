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
import { haqHisobla, type StavkaBirligi } from '@/lib/domain/stavka';
import { adminlarniOgohlantir, mijozniOgohlantir } from './bildirishnoma';
import {
  bekorMatni,
  stavkasizIshMatni,
  tayyorMatni,
} from '@/lib/domain/bildirishnoma';
import { pulMatn } from '@/lib/domain/pul';
import {
  navbatdami,
  otishniTekshir,
  qaytaribOlinadimi,
  tugatilgandan,
  bekorQilinadimi,
  type PozitsiyaHolati,
} from '@/lib/domain/buyurtma';
import { bandniBoshatTx } from './band';
import { tayyorMahsulotQarziYozTx } from './filial-harakat';
import { BiznesXato } from '@/lib/xato';
import { donaYech } from './dona-yechish';

interface PozitsiyaQatori {
  readonly id: number;
  readonly holat: string;
  readonly usta_id: number | null;
  readonly buyurtma_id: number;
  readonly eni_sm: number;
  readonly boyi_sm: number;
  readonly stavka_snapshot: string | null;
  readonly stavka_birlik_snapshot: string | null;
  readonly sotgan_filial_id: number;
  readonly ishlab_chiqaruvchi_filial_id: number;
}

async function pozitsiyaniQulfla(
  tx: postgres.TransactionSql,
  pozitsiyaId: number,
): Promise<PozitsiyaQatori> {
  const q = await tx<PozitsiyaQatori[]>`
    SELECT p.id, p.holat, p.usta_id, p.buyurtma_id, p.eni_sm, p.boyi_sm,
           p.stavka_snapshot, p.stavka_birlik_snapshot,
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
  stavkaBirligi: StavkaBirligi = 'DONA',
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
          stavka_snapshot = ${stavka}, stavka_birlik_snapshot = ${stavkaBirligi},
          ozgartirildi = now(), ozgartirdi_id = ${ustaId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${ustaId}, ${p.ishlab_chiqaruvchi_filial_id}, 'ISH_OLINDI',
              'buyurtma_pozitsiya', ${pozitsiyaId},
              ${tx.json({ holat: p.holat, usta_id: p.usta_id })},
              ${tx.json({
                holat: 'ISHLAB_CHIQARILMOQDA',
                usta_id: ustaId,
                stavka,
                stavka_birligi: stavkaBirligi,
              })},
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

    /**
     * ── AKSESSUARLAR OMBORDAN YECHILADI ──
     *
     * ⚠️ 2026-08-28 auditida topilgan xato: aksessuar (kronshteyn,
     *    zanjir, vint) `pozitsiya_aksessuar` ga YOZILARDI, lekin
     *    ombordan HECH QAYERDA yechilmasdi. Mijozdan puli olinardi,
     *    qoldiq esa kamaymasdi — farq har sotuvda ortib borardi.
     *
     * ⚠️ Aynan SHU YERDA, mato bilan birga: mahsulot tayyorlanganda
     *    aksessuar ham ishlatilgan bo'ladi. Tasdiqlashda yechilsa,
     *    bekor qilingan buyurtmadan keyin qaytarish kerak bo'lardi.
     *
     * ⚠️ Yetmasa ISH TO'XTATILMAYDI: usta mahsulotni allaqachon
     *    yasagan. Qoldiq manfiyga tushmaydi — shunchaki yechilmaydi
     *    va jurnalga izoh yoziladi. Buni inventarizatsiya ko'rsatadi.
     */
    const aksessuarlar = await tx<
      { material_id: number; soni: string }[]
    >`
      SELECT material_id, soni::text
      FROM pozitsiya_aksessuar WHERE buyurtma_pozitsiya_id = ${kirim.pozitsiyaId}`;

    for (const a of aksessuarlar) {
      const kerak = Number(a.soni);
      if (!Number.isFinite(kerak) || kerak <= 0) continue;

      const yechim = await donaYech(tx, a.material_id, filialId, kerak);

      if (yechim.holat === 'YETMADI') {
        /**
         * ⚠️ OMBOR JURNALIGA EMAS, AUDIT jurnaliga.
         *
         *    `ombor_harakat` da har yozuv BO'LAKKA bog'langan —
         *    bazaning o'zi shuni talab qiladi. «Hech narsa
         *    yechilmadi» esa harakat emas: ombor jurnalida nol
         *    miqdorli, bo'laksiz yozuv yolg'on iz qoldirardi.
         *
         *    Auditda esa uning o'rni bor: kim, qachon, nima
         *    yetishmadi.
         */
        await tx`
          INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi,
                                    obyekt_id, yangi_qiymat, izoh)
          VALUES (${xodimId}, ${filialId}, 'AKSESSUAR_YETMADI',
                  'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
                  ${tx.json({
                    material_id: a.material_id,
                    kerak,
                    omborda: yechim.mavjud,
                  })},
                  ${`Aksessuar yetmadi: kerak ${String(kerak)}, omborda ${yechim.mavjud}`})`;
        continue;
      }

      for (const partiya of yechim.partiyalar) {
        const olindi = Number(partiya.miqdor);
        await tx`
          INSERT INTO ombor_harakat (filial_id, bolak_id, turi, miqdor_dona,
                                     tannarx_summa, manba_turi, manba_id, izoh,
                                     xodim_id)
          VALUES (${filialId}, ${partiya.bolakId}, 'KESIM',
                  ${-olindi},
                  ${(-olindi * Number(partiya.tannarx)).toFixed(2)},
                  'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
                  'Aksessuar ishlatildi', ${xodimId})`;
      }
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

    /**
     * TZ 13.6 — «Xabar yuboriladi: ... **tayyor bo'lganda**.»
     *
     * ⚠️ Faqat `TAYYOR` da yuboriladi. `TAYYOR_YOLDA` bo'lsa
     *    mahsulot boshqa filialda va mijoz kelib bekorga qaytardi
     *    (13.6 · 20.5). Yetib kelganda alohida xabar ketadi.
     */
    if (yangiHolat === 'TAYYOR') {
      const b = await tx<{ raqam: string; mijoz_id: number | null }[]>`
        SELECT b.raqam, b.mijoz_id
        FROM buyurtma_pozitsiya p
        JOIN buyurtma b ON b.id = p.buyurtma_id
        WHERE p.id = ${kirim.pozitsiyaId}`;

      const mijozId = b[0]?.mijoz_id;
      if (mijozId !== null && mijozId !== undefined) {
        await mijozniOgohlantir(
          tx,
          {
            mijozId,
            matn: tayyorMatni(b[0]?.raqam ?? ''),
            manbaTuri: 'buyurtma_pozitsiya',
            manbaId: kirim.pozitsiyaId,
          },
          xodimId,
        );
      }
    }

    /**
     * TZ 10.10 — «Haq usta "Tugatdim" bosgan payt hisoblanadi. Mahsulot
     * mijozga topshirilishini KUTMAYDI: mijoz umuman kelmasligi mumkin
     * (8.8), ish esa bajarilgan.»
     *
     * ⚠️ TZ 12.1 — bu XARAJAT, lekin KASSADAN PUL CHIQMAYDI. To'lov
     *    alohida hodisa (C4) va u xarajat sanalMAYDI, aks holda bir
     *    xil pul ikki marta hisoblanardi.
     *
     * ⚠️ TZ 10.12 — stavkasi belgilanmagan tur ishlab chiqarishni
     *    to'xtatmaydi: haq 0 bo'ladi va adminga bildirishnoma ketadi.
     */
    const maydonKvM = new Decimal(p.eni_sm).times(p.boyi_sm).div(10_000).toNumber();
    const haq =
      p.stavka_snapshot === null
        ? null
        : haqHisobla(
            p.stavka_snapshot,
            (p.stavka_birlik_snapshot ?? 'DONA') as StavkaBirligi,
            maydonKvM,
          );

    if (haq !== null && p.usta_id !== null && Number(pulMatn(haq)) > 0) {
      await tx`
        INSERT INTO xodim_harakat (xodim_id, filial_id, turi, summa, valyuta,
                                   manba_turi, manba_id, izoh, xodim_yozdi_id)
        VALUES (${p.usta_id}, ${filialId}, 'HAQ', ${pulMatn(haq)}, 'SOM',
                'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
                ${'Tugatdim (10.10)'}, ${xodimId})`;

      // 12.1 — pul chiqmagan xarajat, kassa yozuvi YO'Q
      await tx`
        INSERT INTO xarajat (sana, filial_id, modda, summa, valyuta,
                             kassa_yozuv_id, manba_turi, manba_id, izoh, xodim_id)
        VALUES (current_date, ${filialId}, 'ISH_HAQI', ${pulMatn(haq)}, 'SOM',
                NULL, 'buyurtma_pozitsiya', ${kirim.pozitsiyaId},
                ${'Hisoblangan ish haqi (10.10)'}, ${xodimId})`;
    } else if (p.usta_id !== null) {
      /**
       * TZ 13.9 · 10.12 — «Stavkasiz ish bajarildi» adminga xabar.
       *
       * ⚠️ Bu XATO EMAS, eslatma: ish to'xtamadi, mahsulot tayyor.
       *    Faqat haq 0 bo'ldi va admin uni qo'lda qo'shishi kerak.
       *    Xabar bo'lmasa usta haqsiz qolib ketardi.
       */
      const tafsil = await tx<
        { raqam: string; tur_nomi: string; usta_ismi: string | null }[]
      >`
        SELECT b.raqam, mt.nom AS tur_nomi, u.ism AS usta_ismi
        FROM buyurtma_pozitsiya bp
        JOIN buyurtma b      ON b.id = bp.buyurtma_id
        JOIN mahsulot_tur mt ON mt.id = bp.mahsulot_tur_id
        LEFT JOIN xodim u    ON u.id = bp.usta_id
        WHERE bp.id = ${kirim.pozitsiyaId}`;

      const t = tafsil[0];
      if (t !== undefined) {
        await adminlarniOgohlantir(
          tx,
          {
            filialId,
            hodisa: 'STAVKASIZ_ISH',
            matn: stavkasizIshMatni({
              buyurtmaRaqami: t.raqam,
              turNomi: t.tur_nomi,
              ustaIsmi: t.usta_ismi ?? 'Usta',
            }),
            manbaTuri: 'buyurtma_pozitsiya',
            manbaId: kirim.pozitsiyaId,
          },
          xodimId,
        );
      }
    }

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
                // 10.12 — stavkasi yo'q bo'lsa adminga bildirishnoma
                haq: haq === null ? null : pulMatn(haq),
                stavka_yoq: p.stavka_snapshot === null,
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

    /**
     * TZ 13.6 — «Xabar yuboriladi: ... **bekor qilinganda**.»
     *
     * ⚠️ Sabab ham yuboriladi: mijoz nega bekor bo'lganini
     *    sotuvchidan so'rab o'tirmasin.
     */
    const b = await tx<{ raqam: string; mijoz_id: number | null }[]>`
      SELECT b.raqam, b.mijoz_id
      FROM buyurtma_pozitsiya p
      JOIN buyurtma b ON b.id = p.buyurtma_id
      WHERE p.id = ${pozitsiyaId}`;

    const mijozId = b[0]?.mijoz_id;
    if (mijozId !== null && mijozId !== undefined) {
      await mijozniOgohlantir(
        tx,
        {
          mijozId,
          matn: bekorMatni(b[0]?.raqam ?? '', sabab.trim()),
          manbaTuri: 'buyurtma_pozitsiya',
          manbaId: pozitsiyaId,
        },
        xodimId,
      );
    }

    return { boshatilganBand: boshatilgan };
  });
}

// ─── TZ 8.9 · Topshirish ──────────────────────────────────────────────────

/**
 * TZ 8.9 — «QISMAN TOPSHIRISH MUMKIN. Uchtadan bittasi tayyor bo'lsa,
 * mijoz shuni olib keta oladi. Qolganlari o'z holida qoladi.»
 *
 * ⚠️ «Buyurtma yopiladi, qachonki BARCHA pozitsiya "Topshirilgan",
 *    "Qaytarilgan", "Rad etilgan" yoki "Bekor qilingan" bo'lsa.»
 *
 * ⚠️ Topshirish PULGA TEGMAYDI — to'lov alohida hodisa (3.12, 12.4).
 *    Mijoz qarzga olib ketishi mumkin.
 */
export async function pozitsiyaniTopshir(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  xodimId: number,
): Promise<{ buyurtmaYopildimi: boolean }> {
  return ulanish.begin(async (tx) => {
    const p = await pozitsiyaniQulfla(tx, pozitsiyaId);

    otishniTekshir(p.holat as PozitsiyaHolati, 'TOPSHIRILDI');

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = 'TOPSHIRILDI', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${pozitsiyaId}`;

    /**
     * TZ 22.3.2 — filiallararo qarz AYNAN SHU YERDA tug'iladi.
     *
     * «Tayyor» da emas — mahsulot hali qaytishi mumkin; «Yetib keldi» da
     * ham emas — mijoz rad etishi mumkin (8.8). Faqat mijoz olganda.
     *
     * Bir filial sotgan va tikkan bo'lsa hech narsa yozilmaydi (22.3.5).
     */
    await tayyorMahsulotQarziYozTx(tx, pozitsiyaId, xodimId);

    // 8.9 — barcha pozitsiya yopilgan bo'lsa buyurtma ham yopiladi
    const ochiq = await tx<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM buyurtma_pozitsiya
      WHERE buyurtma_id = ${p.buyurtma_id}
        AND holat NOT IN ('TOPSHIRILDI','QAYTARILGAN','RAD_ETILGAN','BEKOR')`;

    const yopildi = (ochiq[0]?.n ?? 0) === 0;
    if (yopildi) {
      await tx`
        UPDATE buyurtma SET yopildi = now(), ozgartirildi = now(),
                            ozgartirdi_id = ${xodimId}
        WHERE id = ${p.buyurtma_id} AND yopildi IS NULL`;
    }

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${p.sotgan_filial_id}, 'TOPSHIRISH',
              'buyurtma_pozitsiya', ${pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({ holat: 'TOPSHIRILDI', buyurtma_yopildi: yopildi })},
              ${null})`;

    return { buyurtmaYopildimi: yopildi };
  });
}

/**
 * TZ 20.5.1 — «"Yetib keldi" statusini SOTGAN FILIAL QO'LDA bosadi.
 * Bosilmaguncha mahsulot yo'lda hisoblanadi.»
 *
 * ⚠️ 20.8 — tayyor mahsulot ko'chirishga alohida hujjat kerak emas:
 *    pozitsiyaning o'zi kuzatiladi.
 *
 * ⚠️ Ombor qoldig'iga TEGILMAYDI — mato allaqachon kesilgan va
 *    tikuvchi filial jurnalidan chiqqan. Filiallararo qarz esa
 *    «Topshirildi» da yoziladi (22.3.2), bu yerda emas.
 */
export async function pozitsiyaYetibKeldi(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  filialId: number,
  xodimId: number,
): Promise<void> {
  return ulanish.begin(async (tx) => {
    const p = await pozitsiyaniQulfla(tx, pozitsiyaId);

    // Q-25 — qabul qilishni SOTGAN filial bosadi (20.5.1)
    if (p.sotgan_filial_id !== filialId) {
      throw new BiznesXato('POZITSIYA_TOPILMADI', String(pozitsiyaId));
    }

    otishniTekshir(p.holat as PozitsiyaHolati, 'YETIB_KELDI');

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = 'YETIB_KELDI', ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'YETIB_KELDI', 'buyurtma_pozitsiya',
              ${pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({ holat: 'YETIB_KELDI' })},
              ${null})`;
  });
}

/**
 * TZ 8.8 · 8.10 — «RAD ETISH» — mahsulot tayyor, mijoz olishdan bosh
 * tortdi.
 *
 * ⚠️ Bu QAYTARISH EMAS: mijoz mahsulotni umuman olmagan. Ombor
 *    qoldig'iga tegilmaydi (mato kesilgan) va pozitsiya 7.13
 *    «sotilmagan tayyor mahsulot» ro'yxatiga tushadi.
 */
export async function pozitsiyaniRadEt(
  ulanish: postgres.Sql,
  pozitsiyaId: number,
  sabab: string,
  xodimId: number,
): Promise<void> {
  if (sabab.trim() === '') {
    throw new BiznesXato('ISH_SABAB_KERAK', 'rad etish sababi majburiy');
  }

  return ulanish.begin(async (tx) => {
    const p = await pozitsiyaniQulfla(tx, pozitsiyaId);

    otishniTekshir(p.holat as PozitsiyaHolati, 'RAD_ETILGAN');

    await tx`
      UPDATE buyurtma_pozitsiya
      SET holat = 'RAD_ETILGAN',
          -- TZ 7.13 — «sotilmagan tayyor mahsulot» ro'yxatiga tushadi
          tayyor_mahsulot = true,
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${pozitsiyaId}`;

    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${p.sotgan_filial_id}, 'RAD_ETISH',
              'buyurtma_pozitsiya', ${pozitsiyaId},
              ${tx.json({ holat: p.holat })},
              ${tx.json({ holat: 'RAD_ETILGAN', tayyor_mahsulot: true })},
              ${sabab.trim()})`;
  });
}
