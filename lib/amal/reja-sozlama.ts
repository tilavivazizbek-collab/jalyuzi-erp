/**
 * lib/amal/reja-sozlama.ts — TZ 21.10 · 14.4. 2026-10-13
 *
 * Reja bajarilishi chegaralari va oylik xabar — `sozlama` jadvalida.
 *
 * ⚠️ Korxona rekvizitlaridan (`./sozlama`) ALOHIDA: u yerdagi tekshiruv
 *    matn uchun (chek), bu yerda — son va bayroq.
 * ⚠️ Sozlanmagan bo'lsa standart: 80% · 95% · xabar yuboriladi (21.10).
 * ⚠️ O'zgarish audit jurnaliga tushadi (QISM 1 §10 U-08).
 */

import type postgres from 'postgres';
import Decimal from 'decimal.js';
import { BiznesXato } from '@/lib/xato';
import { BAJARILISH_PAST, BAJARILISH_YAXSHI } from '@/lib/domain/reja';

type Soruvchi = postgres.Sql | postgres.TransactionSql;

export interface RejaSozlamalari {
  readonly past: number;
  readonly yaxshi: number;
  readonly oylikXabar: boolean;
}

export const STANDART_REJA_SOZLAMASI: RejaSozlamalari = {
  past: BAJARILISH_PAST,
  yaxshi: BAJARILISH_YAXSHI,
  oylikXabar: true,
};

const KALIT = {
  past: 'reja_past_chegara',
  yaxshi: 'reja_yaxshi_chegara',
  oylikXabar: 'reja_oylik_xabar',
} as const;

export async function rejaSozlamalari(soruvchi: Soruvchi): Promise<RejaSozlamalari> {
  const q = await soruvchi<{ kalit: string; qiymat: string }[]>`
    SELECT kalit, qiymat FROM sozlama WHERE kalit = ANY(${Object.values(KALIT)})`;
  const x = new Map(q.map((r) => [r.kalit, r.qiymat]));
  const son = (k: string, standart: number): number => {
    const v = x.get(k);
    return v === undefined || !/^\d{1,3}$/.test(v) ? standart : Number(v);
  };
  return {
    past: son(KALIT.past, STANDART_REJA_SOZLAMASI.past),
    yaxshi: son(KALIT.yaxshi, STANDART_REJA_SOZLAMASI.yaxshi),
    oylikXabar: x.get(KALIT.oylikXabar) !== 'yoq',
  };
}

/** ⚠️ Tekshiruv SERVERDA (§9.4): 0 < past < yaxshi ≤ 200, butun foiz */
export function rejaSozlamasiniTekshir(k: { past: string; yaxshi: string; oylikXabar: boolean }): RejaSozlamalari {
  const past = k.past.trim();
  const yaxshi = k.yaxshi.trim();
  if (!/^\d{1,3}$/.test(past) || !/^\d{1,3}$/.test(yaxshi)) {
    throw new BiznesXato('SOZLAMA_NOTOGRI', 'chegaralar butun foiz bo‘lishi kerak (masalan 80 va 95)');
  }
  const p = new Decimal(past);
  const y = new Decimal(yaxshi);
  if (p.lte(0) || y.lte(p) || y.gt(200)) {
    throw new BiznesXato('SOZLAMA_NOTOGRI', `past chegara yaxshidan kichik bo‘lsin: 0 < ${past} < ${yaxshi} ≤ 200`);
  }
  return { past: p.toNumber(), yaxshi: y.toNumber(), oylikXabar: k.oylikXabar };
}

export async function rejaSozlamasiniSaqla(
  ulanish: postgres.Sql,
  yangi: RejaSozlamalari,
  xodimId: number,
  filialId: number,
): Promise<{ ozgardi: boolean }> {
  return ulanish.begin(async (tx) => {
    const eski = await rejaSozlamalari(tx);
    if (eski.past === yangi.past && eski.yaxshi === yangi.yaxshi && eski.oylikXabar === yangi.oylikXabar) {
      return { ozgardi: false };
    }
    const qiymatlar: readonly (readonly [string, string, string])[] = [
      [KALIT.past, String(yangi.past), 'Reja bajarilishi — past chegara, % (🔴 undan past)'],
      [KALIT.yaxshi, String(yangi.yaxshi), 'Reja bajarilishi — yaxshi chegara, % (🟢 shundan yuqori)'],
      [KALIT.oylikXabar, yangi.oylikXabar ? 'ha' : 'yoq', 'Oylik yakun xabari yuborilsinmi'],
    ];
    for (const [kalit, qiymat, izoh] of qiymatlar) {
      await tx`
        INSERT INTO sozlama (kalit, qiymat, turi, guruh, tz_band, izoh, yaratdi_id)
        VALUES (${kalit}, ${qiymat}, 'MATN', 'REJA', '21.10', ${izoh}, ${xodimId})
        ON CONFLICT (kalit) DO UPDATE
          SET qiymat = ${qiymat}, ozgartirildi = now(), ozgartirdi_id = ${xodimId}`;
    }
    await tx`
      INSERT INTO audit_jurnal (xodim_id, filial_id, amal, obyekt_turi, obyekt_id,
                                eski_qiymat, yangi_qiymat, izoh)
      VALUES (${xodimId}, ${filialId}, 'SOZLAMA_OZGARDI', 'sozlama', 0,
              ${tx.json({ ...eski })}, ${tx.json({ ...yangi })}, ${'Reja sozlamalari (21.10)'})`;
    return { ozgardi: true };
  });
}
