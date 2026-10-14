'use server';

/**
 * T-06 — avtomatik qarz eslatmasi qoidasi. 2026-10-14.
 * ⚠️ Mijozlarga xabar ketishini belgilaydi — faqat sozlamani o'zgartira
 *    oladigan admin (`sozlama.ozgartir`).
 */

import { revalidatePath } from 'next/cache';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { qarzEslatmaQoidasiniTekshir } from '@/lib/domain/qarz-eslatma';
import { matnMaydon } from '../../forma-yordamchi';
import { qarzEslatmaQoidasiniSaqla } from '../qarz-eslatma';

export interface EslatmaQoidaHolati {
  readonly xato: string | null;
  readonly xabar: string | null;
}

export async function eslatmaQoidasiAmali(_o: EslatmaQoidaHolati, forma: FormData): Promise<EslatmaQoidaHolati> {
  const f = await ruxsatTalab('sozlama.ozgartir');
  const q = qarzEslatmaQoidasiniTekshir(matnMaydon(forma, 'birinchi'), matnMaydon(forma, 'takror'));
  if (q === null) return { xato: 'Kunlarni butun son bilan kiriting: 0–90 va 1–90', xabar: null };
  await qarzEslatmaQoidasiniSaqla(q, f.xodimId, f.filialId);
  revalidatePath('/mijoz/qarzdorlik');
  return {
    xato: null,
    xabar: q.birinchiKun === 0 ? 'Avtomatik eslatma o‘chirildi' : 'Saqlandi',
  };
}
