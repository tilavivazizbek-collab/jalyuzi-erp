'use server';

/**
 * app/(panel)/ombor/[id]/tuzatish-amal.ts — TZ 15.1
 *
 * «Qoldiqni to'g'rilash» — admin uchun tezkor yo'l.
 *
 * ⚠️ QOLDIQ USTIDAN YOZILMAYDI.
 *
 *    2.2-invariant: ombordagi miqdor alohida saqlanmaydi, u
 *    harakatlar yig'indisi. Shuning uchun «40 ni 35 qilish»
 *    degani — «−5 harakatini yozish» degani. Aks holda mato
 *    qayerga ketgani hech qachon topilmasdi va tannarx ham
 *    o'zgarmay qolardi.
 *
 * ⚠️ SHU SABABLI INVENTARIZATSIYA MEXANIZMI ISHLATILADI (§2.2).
 *    U farqni hisoblaydi, sababni talab qiladi, tannarx farqini
 *    yozadi va audit jurnaliga tushiradi — hammasi sinalgan.
 *    Yangi «tezkor tuzatish» yozilsa, o'sha mantiq ikkinchi
 *    marta yozilgan bo'lardi.
 *
 *    Bu yerdagi yagona yangilik: varaqa FAQAT SHU MAHSULOT uchun
 *    o'zi ochiladi — admin materiallar ro'yxatidan qidirib
 *    o'tirmaydi.
 */

import { redirect } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { varaqaOch } from '@/lib/amal/inventarizatsiya';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { biznesXatosimi } from '@/lib/xato';

export interface TuzatishHolati {
  readonly xato: string | null;
}

export async function qoldiqTuzatishAmali(
  materialId: number,
  oldingi: TuzatishHolati,
  forma: FormData,
): Promise<TuzatishHolati> {
  /**
   * ⚠️ `oldingi` va `forma` ishlatilmaydi — tugmada maydon yo'q.
   *    Lekin `useActionState` shu ikki parametrni beradi, ularsiz
   *    tur mos kelmaydi.
   */
  void oldingi;
  void forma;

  /** ⚠️ Faqat admin — kod ADMIN rolidan boshqasiga berilmaydi */
  const f = await ruxsatTalab('ombor.tuzatish');

  let varaqaId: number;
  try {
    const n = await varaqaOch(
      ulanishOl(),
      {
        /** Bugungi sana — `YYYY-MM-DD` */
        sana: new Date().toISOString().slice(0, 10),
        filialId: f.filialId,
        materialIdlar: [materialId],
        izoh: "Qoldiqni to'g'rilash",
      },
      f.xodimId,
    );
    varaqaId = n.varaqaId;
  } catch (x) {
    /**
     * ⚠️ Bo'lagi yo'q mahsulotni to'g'irlab bo'lmaydi — sanaydigan
     *    narsa yo'q. Bunday holatda BOSHLANG'ICH QOLDIQ kerak va
     *    xabar aynan shuni aytadi.
     */
    return {
      xato: biznesXatosimi(x)
        ? `${x.message} — omborda bu mahsulotdan bo'lak yo'q. Boshlang'ich qoldiq kiriting.`
        : "To'g'rilashni boshlab bo'lmadi",
    };
  }

  redirect(`/ombor/inventarizatsiya/${String(varaqaId)}`);
}
