/**
 * TZ 11.3 — dashboard uchinchi qatori: oylik trend. 2026-10-17
 *
 * «Tushum grafigi (o'tgan oy bilan taqqoslab) · foyda · debitorlik va
 *  kreditorlik · top-5 mahsulot · top-5 mijoz.»
 *
 * ⚠️ YANGI HISOB YO'Q — har raqam o'z hisobotining funksiyasidan:
 *    tushum — buyurtmaTushumi (11.5/11.6 qoidasi), foyda — foydaZarar,
 *    top mahsulot — turBoyichaFoyda, top mijoz — mijozAbc, kreditorlik —
 *    yetkazibHolatlari (ro'yxat sahifasi bilan bir taqsimot).
 * ⚠️ Kun Toshkent vaqtida ajratiladi (AT TIME ZONE).
 * ⚠️ Har blok o'z ruxsatiga qarab (11.3); ruxsat yo'q bo'lsa `null`.
 */

import Decimal from 'decimal.js';
import { ulanishOl } from '@/lib/db';
import { ruxsatBormi, type Foydalanuvchi } from '@/lib/ruxsat/tekshir';
import { davrYasa, oldingiDavr } from '@/lib/domain/hisobot/davr';
import { foydaZarar } from '@/lib/domain/hisobot/foyda-zarar';
import { pulMatn } from '@/lib/domain/pul';
import { VAQT_ZONASI, toshkentKuni } from '@/lib/domain/sana';
import { buyurtmaTushumi, foydaZararMalumoti, mijozAbc, turBoyichaFoyda } from '../hisobot/malumot';
import { yetkazibHolatlari } from '../yetkazib/taqsimot';

export interface TrendKuni {
  /** Oyning kuni, 1 dan */
  readonly kun: number;
  /** Oy boshidan shu kungacha yig'ilgan tushum; kelajak kunlarda `null` */
  readonly joriy: string | null;
  readonly otgan: string | null;
}

export interface OylikTrend {
  readonly tushum: {
    readonly kunlar: readonly TrendKuni[];
    /** Bugungacha */
    readonly joriy: string;
    /** O'tgan oyning SHU KUNIgacha — adolatli taqqoslash */
    readonly otganShuKungacha: string;
    readonly otganJami: string;
  } | null;
  readonly foyda: { readonly joriy: string; readonly otgan: string } | null;
  readonly kreditor: { readonly som: string; readonly usd: string } | null;
  readonly topMahsulot: readonly { readonly nom: string; readonly soni: number; readonly tushum: string }[] | null;
  readonly topMijoz: readonly { readonly nom: string; readonly tushum: string }[] | null;
}

export async function oylikTrend(f: Foydalanuvchi, hozir: Date = new Date()): Promise<OylikTrend> {
  const davr = davrYasa('OY', hozir);
  const oldin = oldingiDavr(davr);
  const sotuv = ruxsatBormi(f, 'hisobot.sotuv.kor');
  const moliya = ruxsatBormi(f, 'hisobot.moliya.kor');

  const [tushum, foyda, kreditor, turlar, mijozlar] = await Promise.all([
    sotuv ? kunlikTushum(f.filialId, davr.boshi, oldin.boshi, davr.oxiri, hozir) : Promise.resolve(null),
    moliya
      ? Promise.all([foydaZararMalumoti(f.filialId, davr), foydaZararMalumoti(f.filialId, oldin)]).then(
          ([j, o]) => ({ joriy: foydaZarar(j).sofFoyda, otgan: foydaZarar(o).sofFoyda }),
        )
      : Promise.resolve(null),
    ruxsatBormi(f, 'yetkazib.kor') ? kreditorlik() : Promise.resolve(null),
    // turBoyichaFoyda tannarxni ham hisoblaydi — bu yerda faqat tushum va soni ko'rsatiladi
    sotuv ? turBoyichaFoyda(f.filialId, davr) : Promise.resolve(null),
    ruxsatBormi(f, 'hisobot.mijoz.kor') ? mijozAbc(f.filialId, davr) : Promise.resolve(null),
  ]);

  return {
    tushum,
    foyda,
    kreditor,
    topMahsulot:
      turlar === null
        ? null
        : [...turlar]
            .sort((a, b) => new Decimal(b.tushum).comparedTo(a.tushum))
            .slice(0, 5)
            .map((t) => ({ nom: t.nom, soni: t.soni, tushum: t.tushum })),
    topMijoz:
      mijozlar === null
        ? null
        : mijozlar.natija.qatorlar.slice(0, 5).map((m) => ({ nom: m.nom, tushum: pulMatn(m.qiymat) })),
  };
}

async function kunlikTushum(
  filialId: number,
  joriyBoshi: Date,
  otganBoshi: Date,
  oxiri: Date,
  hozir: Date,
): Promise<OylikTrend['tushum']> {
  const sql = ulanishOl();
  const q = await sql<{ kun: string; summa: string }[]>`
    WITH pozitsiya AS (${buyurtmaTushumi(sql)})
    SELECT ((b.sana AT TIME ZONE ${VAQT_ZONASI})::date)::text AS kun,
           SUM(COALESCE(pz.summa, 0))::numeric(14,2)::text AS summa
    FROM buyurtma b
    JOIN pozitsiya pz ON pz.buyurtma_id = b.id
    WHERE b.sotgan_filial_id = ${filialId}
      AND b.sana >= ${otganBoshi} AND b.sana < ${oxiri}
    GROUP BY 1`;

  const joriyOy = toshkentKuni(joriyBoshi).slice(0, 7);
  const otganOy = toshkentKuni(otganBoshi).slice(0, 7);
  const bugunKun = Number(toshkentKuni(hozir).slice(8, 10));
  const kunlarSoni = (oy: string): number => {
    const [y, m] = oy.split('-').map(Number);
    return new Date(Date.UTC(y ?? 2000, m ?? 1, 0)).getUTCDate();
  };
  const xarita = new Map(q.map((r) => [r.kun, r.summa]));
  const yigindi = (oy: string, gacha: number): Decimal => {
    let s = new Decimal(0);
    for (let d = 1; d <= gacha; d++) s = s.plus(xarita.get(`${oy}-${String(d).padStart(2, '0')}`) ?? '0');
    return s;
  };

  const uzunlik = Math.max(kunlarSoni(joriyOy), kunlarSoni(otganOy));
  const kunlar: TrendKuni[] = [];
  for (let d = 1; d <= uzunlik; d++) {
    kunlar.push({
      kun: d,
      joriy: d <= bugunKun && d <= kunlarSoni(joriyOy) ? yigindi(joriyOy, d).toFixed(2) : null,
      otgan: d <= kunlarSoni(otganOy) ? yigindi(otganOy, d).toFixed(2) : null,
    });
  }
  return {
    kunlar,
    joriy: yigindi(joriyOy, bugunKun).toFixed(2),
    otganShuKungacha: yigindi(otganOy, Math.min(bugunKun, kunlarSoni(otganOy))).toFixed(2),
    otganJami: yigindi(otganOy, kunlarSoni(otganOy)).toFixed(2),
  };
}

/** Yetkazib beruvchilarga qarzimiz — musbat qoldiqlar, valyuta alohida (1.3) */
async function kreditorlik(): Promise<{ som: string; usd: string }> {
  const jami = { SOM: new Decimal(0), USD: new Decimal(0) };
  for (const h of (await yetkazibHolatlari(null)).values()) {
    for (const v of ['SOM', 'USD'] as const) {
      const q = new Decimal(h.taqsimot.qarz[v]);
      if (q.gt(0)) jami[v] = jami[v].plus(q);
    }
  }
  return { som: jami.SOM.toFixed(2), usd: jami.USD.toFixed(2) };
}
