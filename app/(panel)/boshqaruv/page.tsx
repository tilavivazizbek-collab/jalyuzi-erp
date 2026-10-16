import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { ruxsatBormi, ruxsatTekshir } from '@/lib/ruxsat/tekshir';
import Decimal from 'decimal.js';
import { GURUHLAR, RUXSATLAR, RUXSAT_KODLARI } from '@/lib/ruxsat/kodlar';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { oyBoshi } from '@/lib/domain/reja';
import { toshkentKuni } from '@/lib/domain/sana';
import { dashboardRejasi } from '../hisobot/reja-malumot';
import { OyRejasi } from './oy-rejasi';
import { ulanishOl } from '@/lib/db';
import { rejaSozlamalari } from '@/lib/amal/reja-sozlama';
import {
  KorsatkichKartasi,
  PulBelgisi,
  QarzBelgisi,
  QutiBelgisi,
  SavatBelgisi,
} from '../korsatkich';
import { kimIshlamoqda, kunKorsatkichlari } from './malumot';
import { diqqatBandlari } from './diqqat';
import { oylikTrend } from './trend';
import { TrendGrafik } from './trend-grafik';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

/**
 * Boshqaruv — egasi ertalab birinchi ochadigan ekran.
 *
 * ⚠️ To'liq dashboard 8-bosqichda quriladi (TZ 11). Hozircha
 *    to'rt raqam va ruxsat kartochkasi.
 *
 * ⚠️ Raqamlar YUQORIDA. Egasi ekranga qaraydi va uch soniyada
 *    «bugun qanday ketyapti» degan savolga javob oladi. Ruxsat
 *    ro'yxati pastda — u kunda bir marta ham kerak bo'lmaydi.
 */
export default async function BoshqaruvSahifasi() {
  const f = await kirganBolishiShart();

  const bugun = toshkentKuni();
  const [kim, k, reja, chegara, diqqat, trend] = await Promise.all([
    kimIshlamoqda(f.xodimId, f.filialId),
    kunKorsatkichlari(f.filialId),
    // TZ 21.7 — oy rejasi birinchi qatorda
    dashboardRejasi(f, oyBoshi(bugun)),
    rejaSozlamalari(ulanishOl()),
    // TZ 11.3 — ikkinchi qator: diqqat talab qiladi (ruxsatga qarab)
    diqqatBandlari(f),
    // TZ 11.3 — uchinchi qator: oylik trend (har blok o'z ruxsatiga qarab)
    oylikTrend(f),
  ]);
  const foiz = (j: string, o: string): string | null => {
    const oo = new Decimal(o);
    if (oo.isZero()) return null;
    const f2 = new Decimal(j).minus(oo).div(oo.abs()).times(100);
    return `${f2.gte(0) ? '+' : '−'}${f2.abs().toFixed(1)}%`;
  };

  /**
   * ⚠️ Qarz MANFIY bo'lsa — bu avans (6.8), qarz emas. Egasiga
   *    «−200 000 qarz» deb ko'rsatish chalkashtiradi.
   */
  const qarz = new Decimal(k.mijozQarzi);
  const qarzUsd = new Decimal(k.mijozQarziUsd);

  /**
   * ⚠️ Dollar qatori faqat NOL BO'LMAGANDA chiqadi.
   *
   *    Egasining ishi asosan so'mda. Har kartada doim «$ 0.00»
   *    turishi diqqatni oladi va foydasi yo'q.
   *
   *    Valyutalar QO'SHILMAYDI (1.3) — dollar alohida qator bo'lib
   *    ko'rinadi. Ilgari u umuman ko'rinmasdi: uchta so'rov
   *    `valyuta = 'SOM'` bilan filtrlangan edi.
   */
  // ⚠️ Pul Decimal orqali (pulKorsat) — ilgari Number().toLocaleString edi
  const usdQatori = (matn: string): string | null => {
    const n = new Decimal(matn).abs();
    return n.gte('0.005') ? `$ ${pulKorsat(dollar(n.toFixed(2)))}` : null;
  };

  return (
    <div className="flex flex-col gap-7">
      {/* ── Kim, qayerda ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">{kim.ism}</h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            {kim.filialNomi}
            {f.boshFilialda && ' · bosh filial'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {f.rollar.map((r) => (
            <span
              key={r.nom}
              className="rounded-full bg-brend-fon px-2.5 py-1 text-[12px] font-medium text-brend"
            >
              {r.nom}
            </span>
          ))}
        </div>
      </div>

      {/* ── TZ 21.7 · Oy rejasi — birinchi qator ─────────────────── */}
      {reja !== null && (
        <OyRejasi
          r={reja}
          bugun={bugun}
          hisobotHavolasi={ruxsatBormi(f, 'reja.kor')}
          qoyishHavolasi={ruxsatBormi(f, 'reja.boshqar')}
          chegara={chegara}
        />
      )}

      {/* ── To'rt raqam ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KorsatkichKartasi
          sarlavha="Bugungi tushum"
          qiymat={pulKorsat(som(k.bugungiTushum))}
          ikkinchiQiymat={usdQatori(k.bugungiTushumUsd)}
          izoh="Kassaga kirgan pul"
          rang="kok"
          belgi={<SavatBelgisi />}
        />

        <KorsatkichKartasi
          sarlavha="Kassa qoldig'i"
          qiymat={pulKorsat(som(k.kassaQoldigi))}
          ikkinchiQiymat={usdQatori(k.kassaQoldigiUsd)}
          izoh="Hozir kassalarda"
          rang="yashil"
          belgi={<PulBelgisi />}
        />

        <KorsatkichKartasi
          sarlavha={qarz.gte(0) || qarzUsd.gt(0) ? 'Mijozlar qarzi' : 'Mijozlar avansi'}
          qiymat={pulKorsat(som(qarz.abs().toFixed(2)))}
          ikkinchiQiymat={usdQatori(k.mijozQarziUsd)}
          izoh={qarz.gte(0) ? 'Yig‘ilishi kerak' : 'Oldindan olingan'}
          rang={qarz.gt(0) ? 'qizil' : 'yashil'}
          belgi={<QarzBelgisi />}
        />

        <KorsatkichKartasi
          sarlavha="Ochiq buyurtma"
          qiymat={String(k.ochiqBuyurtma)}
          izoh="Yopilmagan"
          rang="sariq"
          belgi={<QutiBelgisi />}
        />
      </div>

      {/* ── TZ 11.3 · Diqqat talab qiladi — raqam va havola ──────────── */}
      {diqqat.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-matn">Diqqat talab qiladi</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {diqqat.map((d) => (
              <Link
                key={d.nom}
                href={d.havola}
                className={`fokus flex flex-col rounded-karta border px-4 py-3 transition-colors hover:bg-fon ${
                  d.soni === 0
                    ? 'border-chegara bg-sirt'
                    : d.xavf
                      ? 'border-belgi-qizil/30 bg-belgi-qizil-fon'
                      : 'border-belgi-sariq/30 bg-belgi-sariq-fon'
                }`}
              >
                <span
                  className={`text-2xl font-semibold tabular-nums ${
                    d.soni === 0 ? 'text-matn-kuchsiz' : d.xavf ? 'text-belgi-qizil' : 'text-belgi-sariq'
                  }`}
                >
                  {d.soni}
                </span>
                <span className="mt-0.5 text-[13px] text-matn">{d.nom}</span>
                {d.izoh !== null && <span className="text-[12px] text-matn-ikki">{d.izoh}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── TZ 11.3 · Oylik trend ───────────────────────────────── */}
      {(trend.tushum !== null || trend.foyda !== null || trend.kreditor !== null) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-matn">Oylik trend</h2>
          <div className="grid gap-4 xl:grid-cols-3">
            {trend.tushum !== null && (
              <div className="rounded-karta border border-chegara bg-sirt p-4 xl:col-span-2">
                <p className="text-[13px] text-matn-ikki">Tushum — oy boshidan</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-matn">
                  {pulKorsat(som(trend.tushum.joriy))}
                  {foiz(trend.tushum.joriy, trend.tushum.otganShuKungacha) !== null && (
                    <span className="ml-2 text-[13px] font-normal text-matn-ikki">
                      {foiz(trend.tushum.joriy, trend.tushum.otganShuKungacha)} o&apos;tgan oyning shu kunigacha (
                      {pulKorsat(som(trend.tushum.otganShuKungacha))})
                    </span>
                  )}
                </p>
                <div className="mt-3">
                  <TrendGrafik kunlar={trend.tushum.kunlar} />
                </div>
                <p className="mt-1 text-[12px] text-matn-kuchsiz">
                  O&apos;tgan oy jami: {pulKorsat(som(trend.tushum.otganJami))}. Kunma-kun jadval —{' '}
                  <Link href="/hisobot/sotuv" className="text-brend hover:underline">
                    Sotuv hisoboti
                  </Link>
                  .
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {trend.foyda !== null && (
                <div className="rounded-karta border border-chegara bg-sirt p-4">
                  <p className="text-[13px] text-matn-ikki">Sof foyda — bu oy</p>
                  <p
                    className={`mt-1 text-xl font-semibold tabular-nums ${trend.foyda.joriy.startsWith('-') ? 'text-belgi-qizil' : 'text-matn'}`}
                  >
                    {pulKorsat(som(trend.foyda.joriy))}
                  </p>
                  <p className="text-[12px] text-matn-ikki">
                    O&apos;tgan oy: {pulKorsat(som(trend.foyda.otgan))} ·{' '}
                    <Link href="/hisobot/moliya" className="text-brend hover:underline">
                      foyda-zarar
                    </Link>
                  </p>
                </div>
              )}
              {trend.kreditor !== null && (
                <div className="rounded-karta border border-chegara bg-sirt p-4">
                  <p className="text-[13px] text-matn-ikki">Yetkazib beruvchilarga qarzimiz</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-matn">
                    {pulKorsat(som(trend.kreditor.som))}
                  </p>
                  {usdQatori(trend.kreditor.usd) !== null && (
                    <p className="text-[13px] tabular-nums text-matn-ikki">{usdQatori(trend.kreditor.usd)}</p>
                  )}
                  <p className="text-[12px] text-matn-ikki">
                    Mijozlar qarzi — yuqoridagi kartada ·{' '}
                    <Link href="/yetkazib?filtr=qarz" className="text-brend hover:underline">
                      ro&apos;yxat
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {trend.topMahsulot !== null && (
              <TopRoyxat
                sarlavha="Top-5 mahsulot — bu oy"
                qatorlar={trend.topMahsulot.map((t) => ({ nom: t.nom, izoh: `${String(t.soni)} dona`, summa: t.tushum }))}
              />
            )}
            {trend.topMijoz !== null && (
              <TopRoyxat
                sarlavha="Top-5 mijoz — bu oy"
                qatorlar={trend.topMijoz.map((m) => ({ nom: m.nom, izoh: null, summa: m.tushum }))}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Ruxsatlar ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-matn">Sizga ochiq amallar</h2>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            Barcha rollaringiz yig&apos;indisi (10.3)
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {GURUHLAR.map((guruh) => {
            const kodlar = RUXSAT_KODLARI.filter((x) => RUXSATLAR[x].guruh === guruh);
            const natijalar = kodlar.map((x) => ({
              kod: x,
              natija: ruxsatTekshir(f, x),
            }));
            const ochiq = natijalar.filter((x) => x.natija.ruxsat).length;

            return (
              <div
                key={guruh}
                className="flex flex-col rounded-karta border border-chegara bg-sirt"
              >
                <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3">
                  <h3 className="text-[13px] font-semibold text-matn">{guruh}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      ochiq === 0
                        ? 'bg-fon text-matn-kuchsiz'
                        : 'bg-belgi-yashil-fon text-belgi-yashil'
                    }`}
                  >
                    {ochiq} / {kodlar.length}
                  </span>
                </div>

                <ul className="flex flex-col gap-1.5 px-5 pb-4">
                  {natijalar.map(({ kod, natija }) => (
                    <li key={kod} className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className={natija.ruxsat ? 'text-matn-ikki' : 'text-matn-kuchsiz'}>
                        {natija.ruxsat ? '' : '· '}
                        {RUXSATLAR[kod].nom}
                      </span>

                      {natija.ruxsat && natija.qamrov === 'BARCHA' && (
                        <span className="shrink-0 rounded-full bg-brend-fon px-1.5 py-0.5 text-[10px] font-medium text-brend">
                          barcha
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TopRoyxat({
  sarlavha,
  qatorlar,
}: {
  sarlavha: string;
  qatorlar: readonly { nom: string; izoh: string | null; summa: string }[];
}) {
  return (
    <div className="rounded-karta border border-chegara bg-sirt p-4">
      <p className="mb-2 text-[13px] text-matn-ikki">{sarlavha}</p>
      {qatorlar.length === 0 ? (
        <p className="text-[13px] text-matn-kuchsiz">Bu oyda sotuv yo&apos;q.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {qatorlar.map((q, i) => (
            <li key={`${q.nom}-${String(i)}`} className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate text-matn">
                <span className="mr-1.5 text-matn-kuchsiz">{i + 1}.</span>
                {q.nom}
                {q.izoh !== null && <span className="ml-1 text-matn-kuchsiz">· {q.izoh}</span>}
              </span>
              <span className="shrink-0 tabular-nums text-matn">{pulKorsat(som(q.summa))}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
