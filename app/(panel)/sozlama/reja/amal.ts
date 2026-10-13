'use server';

/**
 * Rejalar — saqlash va nusxa. TZ 21.3 · 21.4 · QISM 1 §9.4. 2026-10-13
 *
 * ⚠️ Brauzerdan kelgan kalitga ishonilmaydi: qamrovdan tashqari qator
 *    (boshqa filial, korxona) jimgina TASHLAB YUBORILMAYDI — rad etiladi.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { biznesXatosimi } from '@/lib/xato';
import { kutilmaganXatoniYoz } from '@/lib/xato-jurnal';
import { otganOydanNusxa, rejalarniSaqla, type RejaQatori } from '@/lib/amal/reja';
import { REJA_TURLARI, rejaSummasiniOqi, type RejaTuri } from '@/lib/domain/reja';
import { matnMaydon } from '../../forma-yordamchi';
import { xatoXabari } from '../../xato-xabari';
import { qamrovdami, rejaQamrovi } from './malumot';
import type { RejaHolati } from './holat';

const turimi = (x: string): x is RejaTuri => (REJA_TURLARI as readonly string[]).includes(x);

export async function rejaAmali(oldingi: RejaHolati, forma: FormData): Promise<RejaHolati> {
  const f = await ruxsatTalab('reja.boshqar');
  const q = rejaQamrovi(f);
  const urinish = oldingi.urinish + 1;
  const oy = matnMaydon(forma, 'oy');
  const xato = (matn: string): RejaHolati => ({ xato: matn, xabar: null, urinish });

  try {
    if (matnMaydon(forma, 'amal') === 'nusxa') {
      const foiz = matnMaydon(forma, 'foiz').trim() === '' ? '0' : matnMaydon(forma, 'foiz').trim();
      if (!/^-?\d{1,3}(\.\d{1,2})?$/.test(foiz)) return xato('Foizni son bilan kiriting, masalan 10');
      if (!q.korxona) return xato('O‘tgan oydan nusxani faqat bosh admin oladi');
      const { qoshildi } = await otganOydanNusxa(ulanishOl(), { oy, foiz }, f.xodimId);
      revalidatePath('/sozlama/reja');
      return { xato: null, xabar: `Nusxa olindi: ${String(qoshildi)} ta reja`, urinish };
    }

    // Maydonlar: «t|KORXONA|0|0» — tushum, «f|...» — foyda
    const qatorlar = new Map<string, { turi: RejaTuri; filialId: number | null; xodimId: number | null; tushum: string | null; foyda: string | null }>();
    for (const [nom, qiymat] of forma.entries()) {
      const m = /^([tf])\|([A-Z]+)\|(\d+)\|(\d+)$/.exec(nom);
      if (m === null || typeof qiymat !== 'string') continue;
      const [, ustun, turi, fid, xid] = m;
      if (turi === undefined || !turimi(turi)) continue;
      const filialId = Number(fid) === 0 ? null : Number(fid);
      if (!qamrovdami(q, turi, filialId)) return xato('Bu rejani o‘zgartirishga ruxsat yo‘q');
      const summa = rejaSummasiniOqi(qiymat);
      if (summa === undefined) return xato(`Summa noto‘g‘ri: «${qiymat}»`);
      const kalit = `${turi}|${String(fid)}|${String(xid)}`;
      const eski = qatorlar.get(kalit) ?? { turi, filialId, xodimId: Number(xid) === 0 ? null : Number(xid), tushum: null, foyda: null };
      qatorlar.set(kalit, ustun === 't' ? { ...eski, tushum: summa } : { ...eski, foyda: summa });
    }

    const r = await rejalarniSaqla(
      ulanishOl(),
      { oy, sabab: matnMaydon(forma, 'sabab'), qatorlar: [...qatorlar.values()] satisfies RejaQatori[] },
      f.xodimId,
    );
    revalidatePath('/sozlama/reja');
    return {
      xato: null,
      xabar:
        r.qoshildi + r.ozgardi === 0
          ? 'O‘zgarish yo‘q'
          : `Saqlandi: ${String(r.qoshildi)} ta yangi, ${String(r.ozgardi)} ta o‘zgardi`,
      urinish,
    };
  } catch (x) {
    if (!biznesXatosimi(x)) await kutilmaganXatoniYoz(x, 'reja');
    return xato(await xatoXabari(x, 'sozlama/reja/amal', 'Rejani saqlab bo‘lmadi'));
  }
}
