/**
 * lib/amal/kirim-tahrir.ts — TZ 9.11 · 2.3-invariant · TZ 2.4
 *
 * Saqlangan kirim hujjatining QO'SHIMCHA XARAJATINI tahrirlash va
 * tannarxni qayta hisoblash.
 *
 * ⚠️ NEGA KERAK
 *
 *    TZ 9.11: «Qo'shimcha xarajat (transport hisobi, bojxona to'lovi)
 *    ko'pincha MOLDAN KEYIN keladi. Shuning uchun saqlangan kirim
 *    hujjati tahrirlanadi va tannarx qayta hisoblanadi.»
 *
 *    Shu paytgacha bunday imkoniyat yo'q edi: transport hisobi
 *    kelganda omborchi butun kirimni storno qilib qaytadan
 *    kiritishi kerak edi — bo'lak kodlari o'zgarib, ular bilan
 *    bog'langan band va kesimlar uzilardi.
 *
 * ⚠️ FAQAT TRANSPORT VA BOJXONA tahrirlanadi.
 *
 *    Narx yoki miqdorni o'zgartirish bo'laklarni qaytadan yasashni
 *    talab qiladi — bu boshqa amal (storno + yangi kirim). 9.11 esa
 *    aynan «keyin kelgan qo'shimcha xarajat» haqida.
 *
 * ⚠️ SOTILGANGA TEGILMAYDI (9.11 · 2.3-invariant)
 *
 *    «Ular o'z tannarxi bilan qotgan — o'tgan oyning foydasi
 *    o'zgarmaydi.» Yangi tannarx faqat OMBORDA QOLGAN bo'lakka
 *    qo'llanadi: `BOSH` va `BAND`. Ishlatilgan, brak, chiqindi va
 *    yo'ldagi bo'lak tegilmaydi.
 *
 * ⚠️ OMBOR JURNALI O'ZGARMAYDI (§6.5)
 *
 *    Kirim kunidagi yozuv o'sha kunda ma'lum bo'lgan raqamni
 *    saqlaydi — bu tarix. Yangi tannarx bo'lakning o'zida turadi va
 *    keyingi kesimda o'sha yangi raqam jurnalga tushadi.
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import {
  birlikTannarxi,
  bolakUlushi,
  xarajatniTaqsimla,
  type DefektTuri,
  type KirimQatori,
  type NarxAsosi,
} from '@/lib/domain/tannarx';
import {
  dollar,
  kurs,
  ogir,
  pulMatn,
  qosh,
  som,
  type Kurs,
} from '@/lib/domain/pul';
import { BiznesXato } from '@/lib/xato';

export interface KirimTahriri {
  readonly kirimId: number;
  readonly transportSumma: string;
  readonly bojxonaSumma: string;
  readonly izoh: string | null;
}

export interface KirimTahrirNatijasi {
  readonly raqam: string;
  /** Tannarxi yangilangan bo'laklar soni */
  readonly yangilanganBolak: number;
  /** 2.3 — tegilmagan (sotilgan yoki chiqib ketgan) bo'laklar soni */
  readonly tegilmagan: number;
  readonly eskiXarajat: string;
  readonly yangiXarajat: string;
}

interface QatorQatori {
  readonly id: number;
  readonly material_id: number;
  readonly miqdor_kirim: string;
  readonly narx_birlik: string;
  readonly defekt_miqdor: string;
  readonly defekt_turi: string | null;
  readonly narx_asosi: string | null;
  readonly hisob_turi: string;
  readonly koeffitsient: string;
  readonly sarflash_birligi: string;
}

/**
 * TZ 9.11 — qo'shimcha xarajatni o'zgartirib, tannarxni qayta
 * hisoblaydi.
 *
 * ⚠️ Hisob KIRIMDAGI BILAN BIR XIL funksiyalar orqali ketadi
 *    (`xarajatniTaqsimla`, `birlikTannarxi`, `bolakUlushi`) — §2.2.
 *    Nusxa yozilsa taqsimot ikki joyda ikki xil bo'lib qolardi.
 */
export async function kirimniTahrirla(
  ulanish: postgres.Sql,
  kirim: KirimTahriri,
  xodimId: number,
): Promise<KirimTahrirNatijasi> {
  if (new Decimal(kirim.transportSumma).isNegative()) {
    throw new BiznesXato('KIRIM_XARAJAT_MANFIY', kirim.transportSumma);
  }
  if (new Decimal(kirim.bojxonaSumma).isNegative()) {
    throw new BiznesXato('KIRIM_XARAJAT_MANFIY', kirim.bojxonaSumma);
  }

  return ulanish.begin(async (tx) => {
    const h = await tx<
      {
        id: number;
        raqam: string;
        sana: string;
        filial_id: number;
        valyuta: string;
        kurs_snapshot: string | null;
        transport_summa: string;
        bojxona_summa: string;
        holat: string;
      }[]
    >`
      SELECT id, raqam, sana::text, filial_id, valyuta, kurs_snapshot::text,
             transport_summa::text, bojxona_summa::text, holat
      FROM kirim WHERE id = ${kirim.kirimId} FOR UPDATE`;

    const hujjat = h[0];
    if (hujjat === undefined) {
      throw new BiznesXato('KIRIM_TOPILMADI', String(kirim.kirimId));
    }
    if (hujjat.holat !== 'FAOL') {
      throw new BiznesXato('KIRIM_STORNO_QILINGAN', hujjat.raqam);
    }

    const qatorlar = await tx<QatorQatori[]>`
      SELECT kq.id, kq.material_id, kq.miqdor_kirim::text, kq.narx_birlik::text,
             kq.defekt_miqdor::text, kq.defekt_turi,
             -- ⚠️ Asos QATORDAN, materialdan EMAS (0036).
             --    Material sozlamasi keyin o'zgargan bo'lishi mumkin va
             --    u qatorda tanlangandan farq qiladi. Materialdan olinsa
             --    tannarx jimgina sakkiz baravar chiqardi.
             kq.narx_asosi, m.hisob_turi,
             m.koeffitsient::text, m.sarflash_birligi
      FROM kirim_qator kq
      JOIN material m ON m.id = kq.material_id
      WHERE kq.kirim_id = ${kirim.kirimId}
      ORDER BY kq.id`;

    if (qatorlar.length === 0) {
      throw new BiznesXato('KIRIM_TOPILMADI', hujjat.raqam);
    }

    /**
     * ⚠️ Ombor tomoni SO'MDA (9.6 · 0031-migratsiya): dollarli
     *    kirimda narx ham, xarajat ham kirim kunidagi QOTGAN kursda
     *    o'giriladi. Bu yerda ham AYNAN o'sha kurs ishlatiladi —
     *    bugungisi emas, aks holda 2.3-invariant buzilardi.
     */
    const kirimKursi: Kurs | null =
      hujjat.valyuta === 'USD' && hujjat.kurs_snapshot !== null
        ? kurs(hujjat.kurs_snapshot, new Date(hujjat.sana), 'SNAPSHOT')
        : null;

    const somga = (q: string): string =>
      kirimKursi === null ? q : pulMatn(ogir(dollar(q), kirimKursi));

    // ── Har bo'lakning o'lchami — ulush shunga bog'liq ──
    const bolaklar = await tx<
      {
        id: number;
        kirim_qator_id: number;
        turi: string;
        eni_m: string | null;
        boyi_m: string | null;
        miqdor: string | null;
        holat: string;
      }[]
    >`
      SELECT id, kirim_qator_id, turi, eni_m::text, boyi_m::text,
             miqdor::text, holat
      FROM bolak
      WHERE kirim_qator_id = ANY(${qatorlar.map((q) => q.id)}) AND faol = true
      ORDER BY id`;

    // ── Yangi taqsimot — kirimdagi bilan BIR XIL funksiyalar ──
    const xarajat = qosh(
      som(somga(kirim.transportSumma)),
      som(somga(kirim.bojxonaSumma)),
    );

    const jamiBoyi = (qatorId: number): number =>
      bolaklar
        .filter((b) => b.kirim_qator_id === qatorId)
        .reduce((y, b) => y + Number(b.boyi_m ?? 0), 0);

    const jamiKvM = (qatorId: number): number =>
      bolaklar
        .filter((b) => b.kirim_qator_id === qatorId)
        .reduce((y, b) => y + Number(b.eni_m ?? 0) * Number(b.boyi_m ?? 0), 0);

    const domenQatorlar: KirimQatori[] = qatorlar.map((q, i) => ({
      id: i,
      miqdor: Number(q.miqdor_kirim),
      narxBirlik: som(somga(q.narx_birlik)),
      defektMiqdor: Number(q.defekt_miqdor),
      narxAsosi: (q.narx_asosi ?? 'BIRLIK') as NarxAsosi,
      jamiBoyiM: jamiBoyi(q.id),
      jamiKvM: jamiKvM(q.id),
    }));

    const ulushlar = xarajatniTaqsimla(domenQatorlar, xarajat);

    let yangilangan = 0;
    let tegilmagan = 0;

    for (const [i, q] of qatorlar.entries()) {
      const ulush = ulushlar.find((u) => u.id === i);
      const domen = domenQatorlar[i];
      if (ulush === undefined || domen === undefined) continue;

      const tannarx = birlikTannarxi(
        domen,
        ulush.ulush,
        (q.defekt_turi ?? null) as DefektTuri,
      );

      await tx`
        UPDATE kirim_qator
        SET transport_ulush = ${pulMatn(ulush.ulush)},
            tannarx_birlik = ${pulMatn(tannarx.birlikTannarx)}
        WHERE id = ${q.id}`;

      const qatorBolaklari = bolaklar.filter((b) => b.kirim_qator_id === q.id);

      for (const b of qatorBolaklari) {
        let yangiTannarx: string;

        if (b.turi === 'RULON') {
          const maydon = Number(b.eni_m ?? 0) * Number(b.boyi_m ?? 0);
          if (maydon <= 0) {
            tegilmagan += 1;
            continue;
          }

          const rulonNarxi = bolakUlushi({
            asos: domen.narxAsosi ?? 'BIRLIK',
            jamiQiymat: tannarx.jamiQiymat,
            birlikTannarx: tannarx.birlikTannarx,
            jamiBoyiM: domen.jamiBoyiM ?? 0,
            jamiKvM: domen.jamiKvM ?? 0,
            boyiM: Number(b.boyi_m ?? 0),
            maydonKvM: maydon,
          });

          yangiTannarx = new Decimal(pulMatn(rulonNarxi)).div(maydon).toFixed(4);
        } else {
          /** Q-01 — dona va chiziqlida tannarx SARFLASH birligida */
          const koeff = new Decimal(q.koeffitsient);
          yangiTannarx = new Decimal(pulMatn(tannarx.birlikTannarx))
            .div(koeff)
            .toFixed(4);
        }

        /**
         * ⚠️ 2.3-invariant — FAQAT omborda turgan bo'lak yangilanadi.
         *    Ishlatilgani sotilgan mahsulotning tannarxiga kirgan,
         *    uni o'zgartirish o'tgan oyning foydasini buzardi.
         */
        if (b.holat === 'BOSH' || b.holat === 'BAND') {
          await tx`
            UPDATE bolak
            SET tannarx_birlik_snapshot = ${yangiTannarx},
                tannarx_valyuta_snapshot = 'SOM',
                ozgartirildi = now(), ozgartirdi_id = ${xodimId}
            WHERE id = ${b.id}`;
          yangilangan += 1;
        } else {
          tegilmagan += 1;
        }

        /**
         * ⚠️ KESIMDAN TUG'ILGAN BO'LAKLAR HAM YANGILANADI.
         *
         *    Ular `ota_bolak_id` bilan bog'lanadi, `kirim_qator_id`
         *    esa BO'SH bo'ladi (`ish.ts`). Shu sababli yuqoridagi
         *    ro'yxatga TUSHMAYDI — va aynan ular «omborda qolgan
         *    material» ning o'zi: 3 × 30 rulondan kesilgach qolgan
         *    3 × 28 rulon va yon kesma.
         *
         *    Ularsiz TZ 9.11 yarim bajarilardi: transport hisobi
         *    kelgach eng ko'p qoldiq aynan tegilmay qolardi.
         *
         * ⚠️ Tannarx OTASIDAN meros (EC-OMB-06), shuning uchun
         *    avlodga ildizning YANGI raqami qo'yiladi — qayta
         *    taqsimlash yo'q.
         *
         * ⚠️ Bu yerda ham 2.3 amal qiladi: ishlatilgan avlodga
         *    tegilmaydi.
         */
        const avlodlar = await tx<{ id: number }[]>`
          WITH RECURSIVE zanjir AS (
            SELECT id FROM bolak WHERE ota_bolak_id = ${b.id}
            UNION ALL
            SELECT x.id FROM bolak x JOIN zanjir z ON x.ota_bolak_id = z.id
          )
          UPDATE bolak SET tannarx_birlik_snapshot = ${yangiTannarx},
                           tannarx_valyuta_snapshot = 'SOM',
                           ozgartirildi = now(), ozgartirdi_id = ${xodimId}
          WHERE id IN (SELECT id FROM zanjir)
            AND faol = true
            AND holat IN ('BOSH', 'BAND')
          RETURNING id`;

        yangilangan += avlodlar.length;
      }
    }

    await tx`
      UPDATE kirim
      SET transport_summa = ${kirim.transportSumma},
          bojxona_summa = ${kirim.bojxonaSumma},
          ozgartirildi = now(), ozgartirdi_id = ${xodimId}
      WHERE id = ${kirim.kirimId}`;

    const eski = qosh(som(hujjat.transport_summa), som(hujjat.bojxona_summa));
    const yangi = qosh(som(kirim.transportSumma), som(kirim.bojxonaSumma));

    /** TZ 9.11 — «har tahrir audit jurnaliga ESKI VA YANGI qiymat bilan» */
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${hujjat.filial_id}, 'TAHRIRLASH', 'kirim',
              ${kirim.kirimId},
              ${tx.json({
                transport: hujjat.transport_summa,
                bojxona: hujjat.bojxona_summa,
              })},
              ${tx.json({
                transport: kirim.transportSumma,
                bojxona: kirim.bojxonaSumma,
                yangilangan_bolak: yangilangan,
                tegilmagan_bolak: tegilmagan,
              })},
              ${kirim.izoh ?? `Qo'shimcha xarajat tahrirlandi (9.11)`})`;

    return {
      raqam: hujjat.raqam,
      yangilanganBolak: yangilangan,
      tegilmagan,
      eskiXarajat: pulMatn(eski),
      yangiXarajat: pulMatn(yangi),
    };
  });
}
