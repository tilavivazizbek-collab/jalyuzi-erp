import Link from 'next/link';
import Decimal from 'decimal.js';
import { pulKorsat, som } from '@/lib/domain/pul';
import { bajarilish, bajarilishRangi, oyNomi, surat, type BajarilishRangi } from '@/lib/domain/reja';
import type { DashboardRejasi } from '../hisobot/reja-malumot';

/**
 * TZ 21.7 — dashboardning birinchi qatori: «OY REJASI». 2026-10-13.
 * ⚠️ Rang — bajarilish emas, SUR'AT bo'yicha (oy o'rtasida 48% normal):
 *    kutilgandan orqada bo'lsa qizil/sariq, oldinda bo'lsa yashil.
 */

const pul = (s: string): string => pulKorsat(som(s));

const CHIZIQ: Readonly<Record<BajarilishRangi, string>> = {
  QIZIL: 'bg-belgi-qizil',
  SARIQ: 'bg-belgi-sariq',
  YASHIL: 'bg-belgi-yashil',
};

export function OyRejasi(k: {
  readonly r: DashboardRejasi;
  readonly bugun: string;
  readonly hisobotHavolasi: boolean;
  readonly qoyishHavolasi: boolean;
}) {
  const { r } = k;
  if (r.reja === null || new Decimal(r.reja).isZero()) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-karta border border-dashed border-chegara-quyuq bg-sirt px-5 py-4 text-sm">
        <span className="text-matn-ikki">
          {r.sarlavha}: {oyNomi(r.oy)} uchun reja qo&apos;yilmagan
        </span>
        {k.qoyishHavolasi && (
          <Link href={`/sozlama/reja?oy=${r.oy}`} className="text-[13px] text-brend hover:underline">
            Reja qo&apos;yish →
          </Link>
        )}
      </section>
    );
  }

  const foiz = bajarilish(r.reja, r.fakt) ?? '0.0';
  const s = surat({ reja: r.reja, fakt: r.fakt, oy: r.oy, bugun: k.bugun });
  // Sur'at bo'yicha rang: fakt / kutilgan
  const suratRang =
    s === null || new Decimal(s.kutilgan).isZero()
      ? bajarilishRangi(foiz)
      : bajarilishRangi(new Decimal(r.fakt).div(s.kutilgan).times(100).toFixed(1));
  const kenglik = Decimal.min(100, new Decimal(foiz)).toFixed(1);
  const orqada = s !== null && new Decimal(s.farq).isNegative();

  return (
    <section className="flex flex-col gap-3 rounded-karta border border-chegara bg-sirt px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-matn-ikki">
          Oy rejasi · {r.sarlavha.toLowerCase()} · {oyNomi(r.oy)}
        </h2>
        {k.hisobotHavolasi && (
          <Link href="/hisobot/reja" className="text-[13px] text-brend hover:underline">
            Batafsil →
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="relative h-3 flex-1 overflow-hidden rounded-full bg-fon"
          role="progressbar"
          aria-valuenow={Number(kenglik)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Reja bajarilishi ${foiz}%`}
        >
          <div
            className={`h-full rounded-full ${suratRang === null ? 'bg-brend' : CHIZIQ[suratRang]}`}
            style={{ width: `${kenglik}%` }}
          />
          {s !== null && (
            // Bugungacha kutilgan joy — tik
            <div
              className="absolute top-0 h-full w-0.5 bg-matn-ikki"
              style={{ left: `${Decimal.min(100, new Decimal(s.otganFoiz)).toFixed(1)}%` }}
              title={`Bugungacha kutilgan: ${s.otganFoiz}%`}
            />
          )}
        </div>
        <span className="raqam w-16 text-lg font-semibold text-matn">{foiz}%</span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-matn-ikki">
        <span>
          Fakt <b className="raqam text-matn">{pul(r.fakt)}</b> / reja <span className="raqam">{pul(r.reja)}</span>
        </span>
        {s !== null && (
          <span className={orqada ? 'text-belgi-qizil' : 'text-belgi-yashil'}>
            {orqada ? `⚠️ ${pul(new Decimal(s.farq).abs().toFixed(2))} orqada` : `✓ ${pul(s.farq)} oldinda`}
          </span>
        )}
        {s !== null && s.otganKun < s.oyKuni && (
          <span>
            Shu sur&apos;atda oy oxirida: <span className="raqam">{pul(s.prognoz)}</span> ({s.prognozFoiz}%)
          </span>
        )}
      </div>
    </section>
  );
}
