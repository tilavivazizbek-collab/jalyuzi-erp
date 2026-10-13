/**
 * Kechki hisobot — kun yakuni Telegramda. 2026-10-12.
 *
 * ⚠️ Sof funksiya: matn shu yerda (bildirishnoma matnlari kabi, §5.1).
 *    Raqamlar `hisobot/kechki-malumot.ts` dan keladi — hammasi saytdagi
 *    hisobotlar bilan BIR XIL manbadan (pul prognozi, salomatlik, nazorat).
 * ⚠️ Nol qatorlar chiqarilmaydi — egasi telefonda qisqa xabar o'qiydi.
 *    Ogohlantirishlar oxirida, faqat bor bo'lsa.
 */

import Decimal from 'decimal.js';
import { pulKorsat, som } from '@/lib/domain/pul';

export interface KechkiKirimi {
  readonly sana: string;
  readonly buyurtmaSoni: number;
  readonly buyurtmaSumma: string;
  /** K1–K4: mijozlardan */
  readonly mijozdanTushdi: string;
  /** C1–C3: yetkazib beruvchi, transport */
  readonly yetkazibgaTolandi: string;
  /** C4, C5, C7, C10, C13: ish haqi, avans, xarajat */
  readonly xarajat: string;
  readonly kassadaPul: string;
  /** Keyingi 7 kun — muddati keladigan */
  readonly kutilayotganKirim: string;
  readonly kutilayotganChiqim: string;
  readonly muddatiOtganQarz: string;
  /** Pul prognozi — birinchi manfiy kun (odatdagi oqim bilan) */
  readonly pulYetmaydi: { readonly sana: string; readonly qoldiq: string } | null;
  /** Bugungi odatdan tashqari amallar: nom → soni */
  readonly nazorat: readonly { readonly nom: string; readonly soni: number }[];
  readonly malumotMuammosi: number;
}

const pul = (s: string): string => `${pulKorsat(som(s))} so'm`;
const bor = (s: string): boolean => !new Decimal(s).isZero();
/** `2026-10-25` → `25.10` */
const qisqaSana = (s: string): string => `${s.slice(8, 10)}.${s.slice(5, 7)}`;

export function kechkiHisobotMatni(k: KechkiKirimi): string {
  // Filial nomi — umumiy sarlavhada (filialliMatn, TZ 20.14.3)
  const q: string[] = [`📊 Kun yakuni — ${qisqaSana(k.sana)}.${k.sana.slice(0, 4)}`, ''];

  q.push(
    k.buyurtmaSoni === 0
      ? 'Bugun yangi buyurtma yo‘q'
      : `🧾 Yangi buyurtmalar: ${String(k.buyurtmaSoni)} ta — ${pul(k.buyurtmaSumma)}`,
  );

  const pulQatorlar: string[] = [];
  if (bor(k.mijozdanTushdi)) pulQatorlar.push(`• Mijozlardan tushdi: ${pul(k.mijozdanTushdi)}`);
  if (bor(k.yetkazibgaTolandi)) pulQatorlar.push(`• Yetkazib beruvchilarga: ${pul(k.yetkazibgaTolandi)}`);
  if (bor(k.xarajat)) pulQatorlar.push(`• Ish haqi va xarajat: ${pul(k.xarajat)}`);
  pulQatorlar.push(`• Kassalarda: ${pul(k.kassadaPul)}`);
  q.push('', '💰 Pul', ...pulQatorlar);

  if (bor(k.kutilayotganKirim) || bor(k.kutilayotganChiqim)) {
    q.push('', '📅 Keyingi 7 kun');
    if (bor(k.kutilayotganKirim)) q.push(`• Mijozlardan kutilmoqda: ${pul(k.kutilayotganKirim)}`);
    if (bor(k.kutilayotganChiqim)) q.push(`• To‘lashimiz kerak: ${pul(k.kutilayotganChiqim)}`);
  }

  const ogoh: string[] = [];
  if (k.pulYetmaydi !== null) {
    ogoh.push(`• ${qisqaSana(k.pulYetmaydi.sana)} da pul yetmaydi (${pul(k.pulYetmaydi.qoldiq)})`);
  }
  if (bor(k.muddatiOtganQarz)) ogoh.push(`• Muddati o‘tgan mijoz qarzi: ${pul(k.muddatiOtganQarz)}`);
  if (k.malumotMuammosi > 0) {
    ogoh.push(`• Hisobotni buzadigan ma’lumot muammosi: ${String(k.malumotMuammosi)} ta`);
  }
  if (ogoh.length > 0) q.push('', '⚠️ E’tibor bering', ...ogoh);

  if (k.nazorat.length > 0) {
    q.push('', '🔎 Odatdan tashqari amallar', ...k.nazorat.map((n) => `• ${n.nom}: ${String(n.soni)}`));
  }

  q.push('', 'Batafsil — saytda: Hisobotlar → Moliya');
  return q.join('\n');
}
