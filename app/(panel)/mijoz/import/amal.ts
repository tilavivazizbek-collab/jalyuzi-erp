'use server';

/**
 * Mijozlarni CSV dan import — egasi auditi 2026-10-06.
 *
 * ⚠️ HAR QATOR ODDIY «Mijoz qo'shish» BILAN BIR XIL yo'ldan o'tadi:
 *    `mijozSxema` (telefon, INN, limit shakli) va `mijozYarat`
 *    (dublikat nazorati, tranzaksiya). Import uchun alohida, yumshoqroq
 *    tekshiruv YO'Q — aks holda bazaga forma o'tkazmaydigan yozuv
 *    tushardi.
 *
 * ⚠️ Har qator O'Z tranzaksiyasida: bitta xato qator qolganlarini
 *    to'xtatmaydi, natijada qaysi qator nima bo'lgani ko'rsatiladi.
 *
 * ⚠️ QARZ IMPORT QILINMAYDI. Boshlang'ich qarz pul harakati — u kassa
 *    jurnali va audit bilan alohida kiritiladi, CSV dan emas.
 */

import { revalidatePath } from 'next/cache';
import { ulanishOl } from '@/lib/db';
import { ruxsatTalab } from '@/lib/kirish/joriy';
import { mijozYarat } from '@/lib/amal/mijoz';
import { mijozSxema } from '@/lib/sxema/mijoz';
import { csvOqi, sarlavhaKaliti } from '@/lib/domain/csv';
import { xatoXabari } from '../../xato-xabari';
import { matnMaydon } from '../../forma-yordamchi';

const ENG_KOP_QATOR = 2000;

/** Sarlavha → forma maydoni. Bir nechta yozilishi qabul qilinadi */
const USTUNLAR: Record<string, readonly string[]> = {
  ism: ['ism', 'ismi', 'fio', 'mijoz', 'nomi', 'ismfamiliya'],
  telefon: ['telefon', 'tel', 'telefonraqami', 'phone'],
  manzil: ['manzil', 'adres', 'address'],
  tashkilotNomi: ['tashkilot', 'tashkilotnomi', 'firma', 'kompaniya'],
  inn: ['inn', 'stir'],
  qarzLimiti: ['qarzlimiti', 'limit'],
  eslatma: ['eslatma', 'izoh'],
  manba: ['manba', 'qayerdankeldi'],
  tolovMuddatiKun: ['tolovmuddati', 'tolovmuddatikun', 'muddat'],
};

/** Formada bor, CSV da yo'q maydonlar — bo'sh satr bo'lib boradi */
const HAMMA_MAYDON = [
  'ism', 'telefon', 'manzil', 'eslatma', 'mijozGuruhId', 'mijozTuriId', 'offsetTuri',
  'offsetQiymat', 'qarzLimiti', 'shaxsTuri', 'tashkilotNomi', 'inn', 'yuridikManzil',
  'bankNomi', 'hisobRaqam', 'mfo', 'shartnomaRaqam', 'shartnomaSana', 'ndsStavka',
  'tolovMuddatiKun', 'masulXodimId', 'manba',
] as const;

export interface ImportQatori {
  /** CSV dagi qator raqami (sarlavha — 1) */
  readonly raqam: number;
  readonly ism: string;
  readonly natija: 'SAQLANDI' | 'TEKSHIRILDI' | 'DUBLIKAT' | 'XATO';
  readonly izoh: string | null;
}

export interface ImportHolati {
  readonly xato: string | null;
  readonly qatorlar: readonly ImportQatori[];
  readonly sinov: boolean;
}

export async function mijozImportAmali(
  _oldingi: ImportHolati,
  forma: FormData,
): Promise<ImportHolati> {
  const f = await ruxsatTalab('mijoz.yarat');
  const sinov = matnMaydon(forma, 'sinov') === '1';
  const jadval = csvOqi(matnMaydon(forma, 'matn'));

  const sarlavha = jadval[0];
  if (sarlavha === undefined || jadval.length < 2) {
    return { xato: 'Kamida sarlavha va bitta qator kerak', qatorlar: [], sinov };
  }
  if (jadval.length - 1 > ENG_KOP_QATOR) {
    return {
      xato: `Bir martada ko'pi bilan ${String(ENG_KOP_QATOR)} qator — faylni bo'lib yuklang`,
      qatorlar: [],
      sinov,
    };
  }

  /** Har maydon nechanchi ustunda */
  const joy = new Map<string, number>();
  sarlavha.forEach((s, i) => {
    const k = sarlavhaKaliti(s);
    for (const [maydon, nomlar] of Object.entries(USTUNLAR)) {
      if (nomlar.includes(k) && !joy.has(maydon)) joy.set(maydon, i);
    }
  });
  if (!joy.has('ism')) {
    return {
      xato: "«Ism» ustuni topilmadi. Birinchi qator sarlavha bo'lsin: Ism; Telefon; Manzil …",
      qatorlar: [],
      sinov,
    };
  }

  const natijalar: ImportQatori[] = [];
  for (const [i, q] of jadval.slice(1).entries()) {
    const kirim: Record<string, string> = {};
    for (const m of HAMMA_MAYDON) {
      const j = joy.get(m);
      kirim[m] = j === undefined ? '' : (q[j] ?? '');
    }
    const raqam = i + 2;
    const ism = kirim['ism'] ?? '';

    const t = mijozSxema.safeParse(kirim);
    if (!t.success) {
      natijalar.push({
        raqam,
        ism,
        natija: 'XATO',
        izoh: t.error.issues.map((x) => x.message).join('; '),
      });
      continue;
    }
    if (sinov) {
      natijalar.push({ raqam, ism, natija: 'TEKSHIRILDI', izoh: null });
      continue;
    }
    try {
      const n = await mijozYarat(ulanishOl(), t.data, f.xodimId);
      natijalar.push(
        n.holat === 'DUBLIKAT'
          ? {
              raqam,
              ism,
              natija: 'DUBLIKAT',
              izoh: `bor: ${n.dublikat.mavjud?.ism ?? '—'} (${n.dublikat.sabab === 'TELEFON' ? 'telefon' : 'ism'} bir xil)`,
            }
          : { raqam, ism, natija: 'SAQLANDI', izoh: null },
      );
    } catch (x) {
      natijalar.push({
        raqam,
        ism,
        natija: 'XATO',
        izoh: await xatoXabari(x, 'mijoz/import', 'Saqlab bo‘lmadi'),
      });
    }
  }

  if (!sinov) revalidatePath('/mijoz');
  return { xato: null, qatorlar: natijalar, sinov };
}
