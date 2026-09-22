'use server';

/**
 * app/(panel)/buyurtma/tahrir-amal.ts — TZ 8.7
 *
 * Pozitsiyani tahrirlash: o'lcham, mato, aksessuar, narx.
 *
 * ⚠️ MANTIQ TAKRORLANMAYDI (§2.2): bu yerda faqat forma o'qiladi,
 *    ish esa `lib/amal/buyurtma-tahrir.ts` da.
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi (§9.4): server amali
 *    to'g'ridan-to'g'ri chaqirilishi mumkin.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { pozitsiyaniTahrirla } from '@/lib/amal/buyurtma-tahrir';
import { kesimOlchami } from '@/lib/domain/kesish';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { sotuvPozitsiyaSxema } from '@/lib/sxema/sotuv';
import { matnMaydon } from '../forma-yordamchi';
import { xatoXabari } from '../xato-xabari';
import { BOSH_TAHRIR, type TahrirHolati } from './tahrir-holat';

export async function pozitsiyaTahrirAmali(
  pozitsiyaId: number,
  _oldingi: TahrirHolati,
  forma: FormData,
): Promise<TahrirHolati> {
  const f = await ruxsatTalab('buyurtma.tahrirla');

  const xom = ((): unknown => {
    const matn = matnMaydon(forma, 'pozitsiya');
    if (matn === '') return null;
    try {
      return JSON.parse(matn);
    } catch {
      return null;
    }
  })();

  // §2.2 — tekshiruv sotuv formasi bilan BIR XIL sxemada
  const tekshiruv = sotuvPozitsiyaSxema.safeParse(xom);
  if (!tekshiruv.success) {
    return {
      ...BOSH_TAHRIR,
      xato: tekshiruv.error.issues[0]?.message ?? "Ma'lumot noto'g'ri",
    };
  }

  const p = tekshiruv.data;

  if (p.qoshimchaMaterialId !== null) {
    return {
      ...BOSH_TAHRIR,
      xato: "Qo'shimcha buyum tahrirlanmaydi — bekor qilib qaytadan qo'shing",
    };
  }

  try {
    const n = await pozitsiyaniTahrirla(
      ulanishOl(),
      {
        pozitsiyaId,
        eniM: p.eniM,
        boyiM: p.boyiM,
        soni: p.soni,
        narxSnapshot: p.narxSnapshot,
        chegirmaSumma: p.chegirmaSumma,
        xizmatHaqi: p.xizmatHaqi,
        /** 0049 — yorliq va izoh tahrirlanadi */
        yorliq: p.yorliq,
        izoh: p.izoh,
        formulaSnapshot: p.formulaSnapshot,
        slotlar: p.slotlar.map((s) => ({
          slotId: s.slotId,
          materialId: s.materialId,
          hisoblanganMiqdor: s.hisoblanganMiqdor,
          tuzatilganMiqdor: s.tuzatilganMiqdor,
          birlik: s.birlik,
          // TZ 3.6 · 7.6 — band HISOBLANGAN sarflash bo'yicha (P-24); AUDIT 1 — kesish yo'nalishi bilan
          kerak:
            s.birlik === 'KV_M'
              ? kesimOlchami(s.hisoblanganMiqdor, p.boyiM, {
                  koeffitsient: s.koeffitsient ?? 1,
                  yonalish: s.kesishTuri === "BO'YIGA" ? ("BO'YIGA" as const) : ('ENIGA' as const),
                  /** T-12 — kesim BITTA buyum uchun, jami emas */
                  soni: p.soni,
                  /** ⚠️ «DIKKEY» — rulon eni o'zgarmaydi (egasi, 2026-09-20) */
                  kesimEniM: s.kesimEniM ?? null,
                })
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

    revalidatePath('/buyurtma');
    revalidatePath('/ombor');

    return {
      xato: null,
      bajarildi: true,
      materialgaKutmoqda: n.holat === 'MATERIALGA_KUTMOQDA',
      qarzFarqi: n.qarzFarqi === '0.00' ? null : n.qarzFarqi,
    };
  } catch (x) {
    return {
      ...BOSH_TAHRIR,
      xato: await xatoXabari(x, 'buyurtma/tahrir-amal', 'Tahrirlab bo‘lmadi'),
    };
  }
}
