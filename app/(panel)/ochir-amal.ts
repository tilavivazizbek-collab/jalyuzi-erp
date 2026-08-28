'use server';

/**
 * app/(panel)/ochir-amal.ts — yozuvni o'chirish (nofaol qilish).
 *
 * ⚠️ Ruxsat SHU YERDA tekshiriladi (§9.4) — har tur o'z kodini
 *    talab qiladi va u `lib/amal/nofaol.ts` da yozilgan.
 *
 * ⚠️ Bitta amal HAMMA tur uchun (§2.2). Sakkizta bir xil amal
 *    yozilsa, biriga tekshiruv qo'shilib qolganlariga
 *    qo'shilmasdi.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import {
  TUR_TAVSIFI,
  nofaolQil,
  qaytar,
  type OchiriladiganTur,
} from '@/lib/amal/nofaol';
import { biznesXatosimi } from '@/lib/xato';

export interface OchirishNatijasi {
  readonly holat: 'OCHIRILDI' | 'BAND' | 'XATO';
  /** `BAND` yoki `XATO` bo'lsa — tushuntirish */
  readonly sabab: string | null;
}

/** Har turning o'z sahifasi — o'chirilgach ro'yxat yangilanadi. */
const YOLLAR: Record<OchiriladiganTur, string> = {
  material: '/material',
  guruh: '/guruh',
  mijoz: '/mijoz',
  yetkazib: '/yetkazib',
  mahsulot: '/mahsulot',
  kassa: '/kassa',
  filial: '/filial',
  xodim: '/xodim',
};

export async function ochirAmali(
  tur: OchiriladiganTur,
  id: number,
): Promise<OchirishNatijasi> {
  const tavsif = TUR_TAVSIFI[tur];
  const f = await ruxsatTalab(tavsif.ruxsat);

  try {
    const n = await nofaolQil(ulanishOl(), tur, id, f.xodimId);
    revalidatePath(YOLLAR[tur]);
    return { holat: n.holat, sabab: n.sabab };
  } catch (x) {
    return {
      holat: 'XATO',
      sabab: biznesXatosimi(x) ? x.message : "O'chirib bo'lmadi",
    };
  }
}

/**
 * O'chirilganni qaytaradi.
 *
 * ⚠️ Kerak: o'chirish qaytarib bo'lmaydigan bo'lsa odam undan
 *    qo'rqadi va keraksiz yozuvlar ro'yxatda to'planib qolaveradi.
 */
export async function qaytarAmali(
  tur: OchiriladiganTur,
  id: number,
): Promise<OchirishNatijasi> {
  const tavsif = TUR_TAVSIFI[tur];
  const f = await ruxsatTalab(tavsif.ruxsat);

  try {
    await qaytar(ulanishOl(), tur, id, f.xodimId);
    revalidatePath(YOLLAR[tur]);
    return { holat: 'OCHIRILDI', sabab: null };
  } catch (x) {
    return {
      holat: 'XATO',
      sabab: biznesXatosimi(x) ? x.message : 'Qaytarib bo\'lmadi',
    };
  }
}
