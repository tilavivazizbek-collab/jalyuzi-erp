'use server';

/**
 * app/(panel)/buyurtma/yangi/amal.ts — TZ 3.14 · 20.4 · QISM 1 §9.4
 *
 * ⚠️ Buyurtma raqami SERVERDA beriladi — brauzerdan kelgan raqamga
 *    ishonib bo'lmaydi va ikki sotuvchi bir vaqtda sotganda to'qnashuv
 *    chiqardi. Ketma-ketlik bazada (QISM 3 §3.1 dagi `bolak_kod_seq`
 *    bilan bir xil yondashuv).
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import {
  buyurtmaRaqamiOl,
  buyurtmaYarat,
  type PozitsiyaKirimi,
} from '@/lib/amal/buyurtma';
import { turTafsili, type SotuvTuri } from '@/lib/amal/katalog';
import { kesimOlchami } from '@/lib/domain/kesish';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { sotuvSxema } from '@/lib/sxema/sotuv';
import { matnMaydon, maydonXatolari, FORMA_XATO_XABARI } from '../../forma-yordamchi';
import { biznesXatosimi } from '@/lib/xato';
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

  const pozitsiyalar: PozitsiyaKirimi[] = d.pozitsiyalar.map((p) => ({
    mahsulotTurId: p.mahsulotTurId,
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
        qarzgaKetadimi: d.qarzgaKetadimi,
        pozitsiyalar,
      },
      f.xodimId,
    );

    revalidatePath('/ombor');
    revalidatePath('/buyurtma');

    return {
      xato: null,
      maydonlar: {},
      // Q-03 — material yetmagan pozitsiyalar sotuvchiga AYTILADI
      materialgaKutmoqda: n.pozitsiyalar
        .map((p, i) => (p.holat === 'MATERIALGA_KUTMOQDA' ? i + 1 : 0))
        .filter((x) => x > 0),
      buyurtmaRaqam: n.raqam,
    };
  } catch (x) {
    return {
      xato: biznesXatosimi(x) ? x.message : 'Buyurtma saqlanmadi',
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
