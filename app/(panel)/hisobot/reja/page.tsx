import Link from 'next/link';
import Decimal from 'decimal.js';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi, yigindiQamrov } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { toshkentKuni } from '@/lib/domain/sana';
import {
  bajarilish,
  bajarilishRangi,
  oyBoshi,
  oyNomi,
  oyQosh,
  surat,
  type BajarilishRangi,
} from '@/lib/domain/reja';
import { rejaFaktQatorlari, type RejaFaktQatori } from '../reja-malumot';

export const dynamic = 'force-dynamic';

/**
 * Reja va fakt — TZ 21.6.1 · 21.6.2. 2026-10-13.
 *
 * ⚠️ Qamrov: bosh filialdagi BARCHA qamrovli — korxona va hamma filial;
 *    qolganlar — o'z filiali va uning sotuvchilari.
 * ⚠️ Foyda — moliya ma'lumoti: faqat `hisobot.moliya.kor` bilan (11.10).
 * ⚠️ Joriy oyda «Kutilgan» va «Shu sur'atda» ustunlari (21.6.2).
 */

const pul = (s: string | null): string => (s === null ? '—' : pulKorsat(som(s)));

const RANG: Readonly<Record<BajarilishRangi, { belgi: string; uslub: string }>> = {
  QIZIL: { belgi: '🔴', uslub: 'text-belgi-qizil' },
  SARIQ: { belgi: '🟡', uslub: 'text-belgi-sariq' },
  YASHIL: { belgi: '🟢', uslub: 'text-belgi-yashil' },
};

function Jadval(k: {
  readonly sarlavha: string;
  readonly qatorlar: readonly { readonly q: RejaFaktQatori; readonly reja: string | null; readonly fakt: string }[];
  readonly oy: string;
  readonly bugun: string;
}) {
  const joriy = oyBoshi(k.bugun) === k.oy;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-matn-ikki">{k.sarlavha}</h2>
      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
              <th className="px-3 py-2 font-medium">Kimga</th>
              <th className="px-3 py-2 text-right font-medium">Reja</th>
              <th className="px-3 py-2 text-right font-medium">Fakt</th>
              <th className="px-3 py-2 text-right font-medium">Farq</th>
              <th className="px-3 py-2 text-right font-medium">Bajarilish</th>
              {joriy && <th className="px-3 py-2 text-right font-medium">Kutilgan bugungacha</th>}
              {joriy && <th className="px-3 py-2 text-right font-medium">Shu sur&apos;atda oy oxirida</th>}
            </tr>
          </thead>
          <tbody>
            {k.qatorlar.map(({ q, reja, fakt }) => {
              const foiz = bajarilish(reja, fakt);
              const rang = bajarilishRangi(foiz);
              const s = joriy ? surat({ reja, fakt, oy: k.oy, bugun: k.bugun }) : null;
              const farq = reja === null || new Decimal(reja).isZero() ? null : new Decimal(fakt).minus(reja).toFixed(2);
              return (
                <tr key={q.kalit} className="border-b border-chegara last:border-0">
                  <td className={`px-3 py-2 ${q.turi === 'SOTUVCHI' ? 'pl-6 text-matn-ikki' : 'font-medium text-matn'}`}>
                    {q.nom}
                    {q.ozgargan && (
                      <span
                        title="Reja oy boshlangandan keyin o'zgartirilgan (21.4)"
                        className="ml-2 rounded bg-belgi-sariq-fon px-1.5 py-0.5 text-[11px] text-belgi-sariq"
                      >
                        reja o&apos;zgargan
                      </span>
                    )}
                  </td>
                  <td className="raqam px-3 py-2 text-matn-ikki">{reja === null ? 'reja yo‘q' : pul(reja)}</td>
                  <td className="raqam px-3 py-2 text-matn">{pul(fakt)}</td>
                  <td className="raqam px-3 py-2 text-matn-ikki">
                    {farq === null ? '' : `${new Decimal(farq).isNegative() ? '' : '+'}${pul(farq)}`}
                  </td>
                  <td className={`raqam px-3 py-2 font-medium ${rang === null ? 'text-matn-kuchsiz' : RANG[rang].uslub}`}>
                    {foiz === null || rang === null ? '—' : `${foiz}% ${RANG[rang].belgi}`}
                  </td>
                  {joriy && (
                    <td className="raqam px-3 py-2 text-matn-ikki">
                      {s === null ? '' : (
                        <>
                          {pul(s.kutilgan)}
                          {new Decimal(s.farq).isNegative() && (
                            <span className="block text-[11px] text-belgi-qizil">{pul(new Decimal(s.farq).abs().toFixed(2))} orqada</span>
                          )}
                        </>
                      )}
                    </td>
                  )}
                  {joriy && (
                    <td className="raqam px-3 py-2 text-matn-ikki">
                      {s === null ? '' : `${pul(s.prognoz)} (${s.prognozFoiz}%)`}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function RejaFakt({ searchParams }: { searchParams: Promise<{ oy?: string }> }) {
  const f = await sahifaRuxsati('reja.kor');
  const hammasi = f.boshFilialda && yigindiQamrov(f, 'reja.kor') === 'BARCHA';
  const foydaKorinadi = ruxsatBormi(f, 'hisobot.moliya.kor');
  const bugun = toshkentKuni();
  const { oy: xom } = await searchParams;
  const oy = xom !== undefined && /^\d{4}-\d{2}-01$/.test(xom) ? xom : oyBoshi(bugun);
  const q = await rejaFaktQatorlari(oy, hammasi ? null : [f.filialId]);
  const joriy = oyBoshi(bugun) === oy;

  const tushum = q.map((x) => ({ q: x, reja: x.rejaTushum, fakt: x.faktTushum }));
  const foyda = q
    .filter((x) => x.turi !== 'SOTUVCHI' && x.faktFoyda !== null)
    .map((x) => ({ q: x, reja: x.rejaFoyda, fakt: x.faktFoyda ?? '0' }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Reja va fakt · {oyNomi(oy)}</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Fakt — mijozga TOPSHIRILGAN oy bo&apos;yicha; qaytarish qaytarilgan oyda ayiriladi (21.5).
          {joriy && ` Bugun ${bugun.slice(8, 10)}-kun.`} 🔴 &lt; 80% · 🟡 80–95% · 🟢 ≥ 95%
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-[13px]">
        <Link href={`/hisobot/reja?oy=${oyQosh(oy, -1)}`} className="rounded-maydon border border-chegara bg-sirt px-3 py-1.5 text-matn-ikki hover:text-matn">
          ← {oyNomi(oyQosh(oy, -1))}
        </Link>
        {!joriy && (
          <Link href="/hisobot/reja" className="rounded-maydon border border-chegara bg-sirt px-3 py-1.5 text-matn-ikki hover:text-matn">
            Joriy oy
          </Link>
        )}
        <Link href={`/hisobot/reja?oy=${oyQosh(oy, 1)}`} className="rounded-maydon border border-chegara bg-sirt px-3 py-1.5 text-matn-ikki hover:text-matn">
          {oyNomi(oyQosh(oy, 1))} →
        </Link>
        {ruxsatBormi(f, 'reja.boshqar') && (
          <Link href={`/sozlama/reja?oy=${oy}`} className="ml-auto rounded-maydon border border-chegara bg-sirt px-3 py-1.5 text-matn-ikki hover:text-matn">
            Rejani o&apos;zgartirish →
          </Link>
        )}
      </nav>

      {q.length === 0 ? (
        <p className="rounded-karta border border-chegara bg-sirt px-4 py-6 text-center text-sm text-matn-kuchsiz">
          Bu oyda na reja, na topshirilgan buyurtma bor.
        </p>
      ) : (
        <>
          <Jadval sarlavha="Tushum" qatorlar={tushum} oy={oy} bugun={bugun} />
          {foydaKorinadi && foyda.length > 0 && (
            <Jadval sarlavha="Foyda (filial kesimida — taqsimlangan, 20.17)" qatorlar={foyda} oy={oy} bugun={bugun} />
          )}
        </>
      )}
    </div>
  );
}
