'use server';

/**
 * app/(panel)/buyurtma/yangi/amal.ts — TZ 3.14 · 20.4 · QISM 1 §9.4
 *
 * ⚠️ Buyurtma raqami SERVERDA beriladi — brauzerdan kelgan raqamga
 *    ishonib bo'lmaydi va ikki sotuvchi bir vaqtda sotganda to'qnashuv
 *    chiqardi. Ketma-ketlik bazada (QISM 3 §3.1 dagi `bolak_kod_seq`
 *    bilan bir xil yondashuv).
 */

import { xatoXabari } from '../../xato-xabari';
import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import {
  buyurtmaRaqamiOl,
  buyurtmaYarat,
  type PozitsiyaKirimi,
} from '@/lib/amal/buyurtma';
import { turTafsili, type SotuvTuri } from '@/lib/amal/katalog';
import { buyurtmaTolovi } from '@/lib/amal/tolov';
import { pozitsiyaQosh } from '@/lib/amal/buyurtma-tahrir';
import { kesimOlchami } from '@/lib/domain/kesish';
import {
  buyurtmaNarxi,
  chegirmaHisobla,
  chegirmaniTaqsimla,
} from '@/lib/domain/narx';
import { ayir, kattami, manfiy, pulMatn, som, type Som } from '@/lib/domain/pul';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { sotuvSxema } from '@/lib/sxema/sotuv';
import { matnMaydon, maydonXatolari, FORMA_XATO_XABARI } from '../../forma-yordamchi';
import type { SotuvHolati } from './holat';

function jsonOqi(forma: FormData, nom: string): unknown {
  const matn = matnMaydon(forma, nom);
  if (matn === '') return null;
  try {
    return JSON.parse(matn);
  } catch {
    return null;
  }
}

export async function buyurtmaYaratAmali(
  _oldingi: SotuvHolati,
  forma: FormData,
): Promise<SotuvHolati> {
  const f = await ruxsatTalab('buyurtma.yarat');

  const tekshiruv = sotuvSxema.safeParse(jsonOqi(forma, 'buyurtma'));

  if (!tekshiruv.success) {
    const birinchi = tekshiruv.error.issues[0];
    return {
      xato: birinchi?.message ?? FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      materialgaKutmoqda: [],
      buyurtmaRaqam: null,
    };
  }

  const d = tekshiruv.data;
  const sql = ulanishOl();

  /**
   * TZ 3.11 — KELISHILGAN SUMMA.
   *
   * ⚠️ Sotuvchi butun savatga bitta summa aytadi («600 mingga
   *    kelishdik»), baza esa chegirmani HAR POZITSIYADA saqlaydi.
   *    Farq shu yerda hisoblanib pozitsiyalarga taqsimlanadi.
   *
   * ⚠️ Ilgari bu maydon ekranda «chegirma 78 400» deb ko'rinar,
   *    bazaga esa 0 yozilardi: mijozga to'liq narx qarz bo'lib
   *    tushardi. Endi chegirma chekda ham, qarzda ham, hisobotda
   *    ham bir xil ko'rinadi.
   *
   * ⚠️ Hisob BRAUZERGA ishonmaydi — narxlar serverdagi ro'yxatdan
   *    olinadi (§9.4).
   */
  const narxlar = d.pozitsiyalar.map((p) => som(p.narxSnapshot));
  const chegirmalar: readonly Som[] =
    d.kelishilganSumma === null
      ? narxlar.map(() => som(0))
      : (() => {
          // §2.2 — chegirma qoidasi domainda, bu yerda takrorlanmaydi
          const c = chegirmaHisobla(
            buyurtmaNarxi(narxlar),
            som(d.kelishilganSumma),
            null,
          );
          const belgili = c.turi === 'QOSHIMCHA' ? manfiy(c.summa) : c.summa;
          return chegirmaniTaqsimla(narxlar, belgili);
        })();

  const pozitsiyalar: PozitsiyaKirimi[] = d.pozitsiyalar.map((p, i) => ({
    mahsulotTurId: p.mahsulotTurId,
    /**
     * ⚠️ QO'SHIMCHA BUYUM — mijoz «uydagi mexanizm buzilgan,
     *    bittasini alohida olay» desa (3.10). U tayyorlanmaydi,
     *    ombordan darhol yechiladi.
     *
     * ⚠️ Ilgari bu maydon shu ro'yxatga QO'SHILMAGAN edi: forma uni
     *    yuborardi, server esa jimgina tashlab yuborardi va bazadagi
     *    `pozitsiya_turi_yoki_material` cheklovi buyurtmani rad
     *    etardi.
     */
    qoshimchaMaterialId: p.qoshimchaMaterialId,
    eniSm: p.eniSm,
    boyiSm: p.boyiSm,
    soni: p.soni,
    narxSnapshot: p.narxSnapshot,
    // TZ 3.11 — kelishilgan summadan chiqqan ulush
    chegirmaSumma: pulMatn(chegirmalar[i] ?? som(0)),
    xizmatHaqi: p.xizmatHaqi,
    formulaSnapshot: p.formulaSnapshot,
    slotlar: p.slotlar.map((s) => ({
      slotId: s.slotId,
      materialId: s.materialId,
      hisoblanganMiqdor: s.hisoblanganMiqdor,
      tuzatilganMiqdor: s.tuzatilganMiqdor,
      birlik: s.birlik,
      // TZ 3.6 · 7.6 — band qilish HISOBLANGAN sarflash bo'yicha (P-24)
      kerak: s.birlik === 'KV_M' ? kesimOlchami(s.hisoblanganMiqdor, p.boyiSm) : null,
      narxSnapshot: s.narxSnapshot,
    })),
    aksessuarlar: p.aksessuarlar.map((a) => ({
      materialId: a.materialId,
      soni: a.soni,
      birlik: a.birlik,
      narxSnapshot: a.narxSnapshot,
      qoldaKiritildi: a.qoldaKiritildi,
    })),
  }));

  /**
   * ⚠️ To'lov BUYURTMADAN OLDIN tekshiriladi: summa yoki kassa
   *    xato bo'lsa, buyurtma umuman yaratilmaydi va sotuvchi
   *    yarim ish bilan qolmaydi.
   */
  const tolovSumma = matnMaydon(forma, 'oldindanTolov').trim();
  const tolovKassaId = Number(matnMaydon(forma, 'tolovKassaId'));

  let tolov: { kassaId: number; summa: string; valyuta: 'SOM' | 'USD' } | null = null;
  if (tolovSumma !== '' && Number(tolovSumma) > 0) {
    if (!/^\d+(\.\d{1,2})?$/.test(tolovSumma)) {
      return {
        xato: "To'lov summasi noto'g'ri",
        maydonlar: {},
        materialgaKutmoqda: [],
        buyurtmaRaqam: null,
      };
    }
    if (!Number.isSafeInteger(tolovKassaId) || tolovKassaId <= 0) {
      return {
        xato: "To'lov uchun kassa tanlanmagan",
        maydonlar: {},
        materialgaKutmoqda: [],
        buyurtmaRaqam: null,
      };
    }
    tolov = { kassaId: tolovKassaId, summa: tolovSumma, valyuta: d.valyuta };
  }

  /**
   * TZ 3.10 — QARZGA KETADIMI, SERVER O'ZI HAL QILADI.
   *
   * ⚠️ Brauzerdan kelgan bayroqqa ishonilmaydi (§9.4): server amali
   *    to'g'ridan-to'g'ri chaqirilishi mumkin. Chegirmadan keyingi
   *    summa to'lovdan katta bo'lsa — qarz qoladi va mijoz
   *    MAJBURIY bo'ladi.
   *
   * ⚠️ Tekshiruv `buyurtmaYarat` ichida, tranzaksiya OCHILISHIDAN
   *    OLDIN otiladi: buyurtma ham, to'lov ham yaratilmaydi.
   *    Ilgari buyurtma saqlanar, to'lov esa rad etilardi va naqd
   *    pul tizimga tushmay qolardi.
   */
  const tolanadigan = ayir(buyurtmaNarxi(narxlar), buyurtmaNarxi(chegirmalar));
  const tolangan = tolov === null ? som(0) : som(tolov.summa);
  const qarzgaKetadimi = kattami(tolanadigan, tolangan);

  try {
    const raqam = await buyurtmaRaqamiOl(sql);

    const n = await buyurtmaYarat(
      sql,
      {
        raqam,
        mijozId: d.mijozId,
        sotganFilialId: f.filialId,
        ishlabChiqaruvchiFilialId: d.ishlabChiqaruvchiFilialId,
        // Q-12 — saytdan kiritilgan buyurtma darhol tasdiqlangan
        manba: 'SAYT',
        valyuta: d.valyuta,
        kursSnapshot: d.kursSnapshot,
        tayyorlikSana: d.tayyorlikSana,
        qarzgaKetadimi,
        pozitsiyalar,
      },
      f.xodimId,
    );

    /**
     * OLDINDAN TO'LOV — TZ 12.5 (K1).
     *
     * ⚠️ Egasi (2026-08-30): «mijoz to'lov qilishi uchun input
     *    hech qayerda yo'q». Mijoz buyurtma berayotganda odatda
     *    oldindan to'laydi; ilgari buni yozish uchun buyurtmani
     *    saqlab, kartochkasini ochib, «To'lov» tugmasini bosish
     *    kerak edi — uch qadam, ko'pincha unutilardi.
     *
     * ⚠️ ALOHIDA TRANZAKSIYA. To'lov yiqilsa buyurtma qoladi va
     *    xabar aytiladi: buyurtma bekor bo'lgandan ko'ra, to'lovni
     *    kartochkadan qayta kiritish yengilroq.
     */
    let tolovXatosi: string | null = null;
    if (tolov !== null) {
      try {
        await buyurtmaTolovi(
          sql,
          {
            buyurtmaId: n.buyurtmaId,
            qatorlar: [tolov],
            izoh: 'Buyurtma berilganda',
            /**
             * TZ 12.3 — buyurtma raqami noyob, oldindan to'lov esa
             * unga BIR MARTA yoziladi. Shu sabab kalit ham shundan
             * quriladi: qayta yuborilgan forma ikkinchi yozuv
             * yarata olmaydi.
             */
            kalit: `tolov:buyurtma:${String(n.buyurtmaId)}:oldindan`,
          },
          f.xodimId,
          'K1',
        );
        revalidatePath('/kassa');
      } catch (x) {
        tolovXatosi = await xatoXabari(
          x,
          'buyurtma/yangi/amal-tolov',
          `Buyurtma ${n.raqam} saqlandi, lekin to'lov yozilmadi`,
        );
      }
    }

    revalidatePath('/ombor');
    revalidatePath('/buyurtma');

    return {
      xato: tolovXatosi,
      maydonlar: {},
      // Q-03 — material yetmagan pozitsiyalar sotuvchiga AYTILADI
      materialgaKutmoqda: n.pozitsiyalar
        .map((p, i) => (p.holat === 'MATERIALGA_KUTMOQDA' ? i + 1 : 0))
        .filter((x) => x > 0),
      buyurtmaRaqam: n.raqam,
    };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/yangi/amal', 'Buyurtma saqlanmadi'),
      maydonlar: {},
      materialgaKutmoqda: [],
      buyurtmaRaqam: null,
    };
  }
}

// ─── TZ 3.2 · Turni tanlagach tafsilotini yuklash ─────────────────────────

/**
 * Bitta turning slot, parametr va aksessuarlarini qaytaradi.
 *
 * ⚠️ Ilgari sotuv ekrani HAMMA turni hamma matosi bilan yuklardi.
 *    Guruhsiz mato har slotga biriktirilgani uchun bu ~2 mln obyekt
 *    va ~230 MB JSON berardi. Endi tanlangan tur kerak bo'lganda
 *    keladi — natija bir xil, yuk yuzlab barobar kam.
 *
 * ⚠️ Ruxsat SHU YERDA ham tekshiriladi (§9.4): server amali
 *    to'g'ridan-to'g'ri chaqirilishi mumkin.
 */
export async function turTafsiliAmali(turId: number): Promise<SotuvTuri | null> {
  const f = await ruxsatTalab('buyurtma.yarat');

  if (!Number.isSafeInteger(turId) || turId <= 0) return null;

  return turTafsili(turId, f.filialId);
}

// ─── TZ 8.7 · Mavjud buyurtmaga pozitsiya qo'shish ───────────────────────

/**
 * TZ 8.7 — «Mijoz ertasi kuni "yana bittasi kerak" desa — mavjud
 * buyurtmaga qo'shiladi, yangi buyurtma ochilmaydi.»
 *
 * ⚠️ SOTUV EKRANI QAYTA ISHLATILADI (§2.2): pozitsiya yig'ish —
 *    tur, slot, mato, aksessuar, narx — bir joyda turadi. Ikkinchi
 *    ekran yozilsa formula bir joyda o'zgarib, ikkinchisida
 *    eskirib qolardi.
 *
 * ⚠️ Mijoz, filial va valyuta MAVJUD buyurtmadan olinadi — ular
 *    qayta so'ralmaydi va o'zgartirilmaydi.
 */
export async function pozitsiyalarQoshAmali(
  buyurtmaId: number,
  _oldingi: SotuvHolati,
  forma: FormData,
): Promise<SotuvHolati> {
  const f = await ruxsatTalab('buyurtma.tahrirla');

  const tekshiruv = sotuvSxema.safeParse(jsonOqi(forma, 'buyurtma'));

  if (!tekshiruv.success) {
    const birinchi = tekshiruv.error.issues[0];
    return {
      xato: birinchi?.message ?? FORMA_XATO_XABARI,
      maydonlar: maydonXatolari(tekshiruv.error.issues),
      materialgaKutmoqda: [],
      buyurtmaRaqam: null,
    };
  }

  const d = tekshiruv.data;
  const sql = ulanishOl();

  /**
   * ⚠️ Chegirma bu yerda TAQSIMLANMAYDI: kelishilgan summa butun
   *    savatga aytiladi, bu yerda esa mavjud buyurtmaga qo'shimcha
   *    qator qo'shilmoqda. Chegirma kerak bo'lsa pozitsiya narxi
   *    qo'lda kiritiladi (3.8).
   */
  try {
    const kutmoqda: number[] = [];

    for (const [i, p] of d.pozitsiyalar.entries()) {
      const n = await pozitsiyaQosh(
        sql,
        buyurtmaId,
        {
          mahsulotTurId: p.mahsulotTurId,
          qoshimchaMaterialId: p.qoshimchaMaterialId,
          eniSm: p.eniSm,
          boyiSm: p.boyiSm,
          soni: p.soni,
          narxSnapshot: p.narxSnapshot,
          chegirmaSumma: p.chegirmaSumma,
          xizmatHaqi: p.xizmatHaqi,
          formulaSnapshot: p.formulaSnapshot,
          slotlar: p.slotlar.map((s) => ({
            slotId: s.slotId,
            materialId: s.materialId,
            hisoblanganMiqdor: s.hisoblanganMiqdor,
            tuzatilganMiqdor: s.tuzatilganMiqdor,
            birlik: s.birlik,
            // TZ 3.6 · 7.6 — band HISOBLANGAN sarflash bo'yicha (P-24)
            kerak:
              s.birlik === 'KV_M'
                ? kesimOlchami(s.hisoblanganMiqdor, p.boyiSm)
                : null,
            narxSnapshot: s.narxSnapshot,
          })),
          aksessuarlar: p.aksessuarlar.map((a) => ({
            materialId: a.materialId,
            soni: a.soni,
            birlik: a.birlik,
            narxSnapshot: a.narxSnapshot,
            qoldaKiritildi: a.qoldaKiritildi,
          })),
        },
        f.xodimId,
      );

      if (n.holat === 'MATERIALGA_KUTMOQDA') kutmoqda.push(i + 1);
    }

    revalidatePath('/buyurtma');
    revalidatePath('/ombor');

    return {
      xato: null,
      maydonlar: {},
      materialgaKutmoqda: kutmoqda,
      buyurtmaRaqam: null,
    };
  } catch (x) {
    return {
      xato: await xatoXabari(x, 'buyurtma/yangi/qosh', "Pozitsiya qo'shilmadi"),
      maydonlar: {},
      materialgaKutmoqda: [],
      buyurtmaRaqam: null,
    };
  }
}
