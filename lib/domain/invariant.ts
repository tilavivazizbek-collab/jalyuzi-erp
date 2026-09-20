/**
 * lib/domain/invariant.ts — QISM 1 §2.1, §5
 *
 * Ishga tushishda bajariladigan tekshiruvlar. TZ ning invariantlari faqat
 * hujjatda emas, kodda ham ushlanishi kerak; turlar ushlay olmaydigan
 * bir nechta narsa shu yerda tekshiriladi.
 *
 * `next.config.ts` ga emas, chaqiruvchi joyga bog'lanmagan sof funksiya —
 * shuning uchun testdan ham chaqirsa bo'ladi.
 */

import Decimal from 'decimal.js';
import { pulMatn, qosh, som, yaxlitlaNarx } from '@/lib/domain/pul';
import { m, maydon } from '@/lib/domain/birlik';

export interface InvariantNatijasi {
  readonly nom: string;
  readonly ozgan: boolean;
  readonly izoh: string;
}

/**
 * Muhit kutilganidek ishlayotganini tekshiradi. Bular «bo'lishi mumkin emas»
 * turkumidagi tekshiruvlar — biri yiqilsa, sabab kutubxona versiyasi yoki
 * Node sozlamasi almashganida bo'ladi.
 */
export function invariantlarniTekshir(): InvariantNatijasi[] {
  const natija: InvariantNatijasi[] = [];

  const qosh1 = pulMatn(qosh(som('0.1'), som('0.2')));
  natija.push({
    nom: '2.2 · pul aniq qo\'shiladi',
    ozgan: qosh1 === '0.30',
    izoh: `0.1 + 0.2 = ${qosh1}`,
  });

  const yax = pulMatn(yaxlitlaNarx(som(50)));
  natija.push({
    nom: '§3.3 · ROUND_HALF_UP',
    ozgan: yax === '100.00',
    izoh: `50 → ${yax} (100 qadamda)`,
  });

  /**
   * ⚠️ 2026-09-20 — ilgari bu yerda `420 sm = 4.20 m` tekshiruvi turardi.
   *    Endi sm yo'q, o'girish ham yo'q. O'rniga Q-05 tekshiriladi:
   *    maydon HAR DOIM `eni × bo'yi` dan chiqadi va kv.m da bo'ladi.
   */
  const kvMaydon = maydon(m(2.1), m(1.5));
  natija.push({
    nom: "Q-05 · maydon = eni × bo'yi (kv.m)",
    ozgan: kvMaydon === 3.15,
    izoh: `2.10 × 1.50 = ${String(kvMaydon)} kv.m`,
  });

  const aniqlik = new Decimal(1).div(3).toSignificantDigits(20).toString();
  natija.push({
    nom: '§3 · Decimal aniqligi yetarli',
    ozgan: aniqlik.startsWith('0.33333333333333333333'),
    izoh: `1/3 = ${aniqlik}`,
  });

  const vaqtZonasi = Intl.DateTimeFormat().resolvedOptions().timeZone;
  natija.push({
    nom: '§19 · vaqt zonasi Asia/Tashkent',
    ozgan: vaqtZonasi === 'Asia/Tashkent',
    izoh: `TZ = ${vaqtZonasi}`,
  });

  return natija;
}

/** Biror invariant buzilgan bo'lsa xato otadi — dastur ishga tushmasligi kerak. */
export function invariantlarniTalabQil(): void {
  const buzilgan = invariantlarniTekshir().filter((x) => !x.ozgan);
  if (buzilgan.length > 0) {
    const royxat = buzilgan.map((x) => `  · ${x.nom} — ${x.izoh}`).join('\n');
    throw new Error(`Invariant buzilgan, dastur ishga tushmaydi:\n${royxat}`);
  }
}
