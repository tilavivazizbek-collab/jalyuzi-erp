import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { VAQT_ZONASI } from '@/lib/domain/sana';
import { davrMatn, davrTurimi, davrYasa, type DavrTuri } from '@/lib/domain/hisobot/davr';
import { NAZORAT_TAVSIFI, nazoratniGuruhla } from '@/lib/domain/hisobot/nazorat';
import { nazoratHodisalari } from '../nazorat-malumot';

export const dynamic = 'force-dynamic';

/**
 * Nazorat — odatdan tashqari amallar. 2026-10-12.
 *
 * ⚠️ AYBLOV EMAS (TZ 11.5.6): rang «xavf» emas, reyting yo'q, chart yo'q.
 *    Xodimlar ism bo'yicha. Faqat audit huquqi bilan (11.10).
 */

const DAVRLAR: readonly { kod: DavrTuri; nom: string }[] = [
  { kod: 'BUGUN', nom: 'Bugun' },
  { kod: 'HAFTA', nom: 'Hafta' },
  { kod: 'OY', nom: 'Oy' },
  { kod: 'CHORAK', nom: 'Chorak' },
];

/** Bir turda ko'rsatiladigan eng ko'p qator — qolgani soni bilan aytiladi */
const KORSATISH = 100;

const vaqt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: VAQT_ZONASI,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const pul = (s: string): string => pulKorsat(som(s));

export default async function Nazorat({ searchParams }: { searchParams: Promise<{ davr?: string }> }) {
  const f = await sahifaRuxsati('audit.kor');
  const { davr: davrXom } = await searchParams;
  const davrTuri: DavrTuri = davrXom !== undefined && davrTurimi(davrXom) ? davrXom : 'HAFTA';
  const davr = davrYasa(davrTuri, new Date());
  const x = nazoratniGuruhla(await nazoratHodisalari(f.filialId, davr));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Nazorat</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {davrMatn(davr)} · odatdan tashqari amallar. Bu ayblov emas — ko&apos;pi odatiy ish; ro&apos;yxat
          faqat nima bo&apos;lganini ko&apos;rsatadi.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAVRLAR.map((d) => (
          <Link
            key={d.kod}
            href={`/hisobot/nazorat?davr=${d.kod}`}
            className={`fokus rounded-maydon border px-3 py-1.5 text-[13px] transition-colors ${
              d.kod === davrTuri
                ? 'border-brend bg-brend text-tugma-matn'
                : 'border-chegara bg-sirt text-matn-ikki hover:text-matn'
            }`}
          >
            {d.nom}
          </Link>
        ))}
      </div>

      {x.jami === 0 ? (
        <p className="rounded-karta border border-chegara bg-sirt px-4 py-6 text-center text-sm text-matn-kuchsiz">
          Bu davrda odatdan tashqari amal yo&apos;q.
        </p>
      ) : (
        <>
          {/* ── Qisqacha: har tur — soni va summasi ── */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {x.turlar.map((t) => {
              const d = NAZORAT_TAVSIFI[t.turi];
              return (
                <a
                  key={t.turi}
                  href={`#${t.turi}`}
                  className="fokus rounded-karta border border-chegara bg-sirt px-4 py-3 hover:border-chegara-quyuq"
                >
                  <p className="text-xs text-matn-kuchsiz">{d.guruh}</p>
                  <p className="mt-0.5 text-sm font-medium text-matn">{d.nom}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-matn">
                    {t.soni}
                    {t.summa !== null && (
                      <span className="ml-2 text-sm font-normal text-matn-ikki">· {pul(t.summa)} so&apos;m</span>
                    )}
                  </p>
                </a>
              );
            })}
          </section>

          {/* ── Xodim kesimi — ism bo'yicha, reyting emas ── */}
          <section>
            <h2 className="mb-3 text-sm font-medium text-matn-ikki">Xodimlar kesimida</h2>
            <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                    <th className="px-3 py-2 font-medium">Xodim</th>
                    {x.turlar.map((t) => (
                      <th key={t.turi} className="px-3 py-2 text-right font-medium">
                        {NAZORAT_TAVSIFI[t.turi].nom}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-medium">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {x.xodimlar.map((q) => (
                    <tr key={q.xodimId} className="border-b border-chegara last:border-0">
                      <td className="px-3 py-2 text-matn">{q.xodim}</td>
                      {x.turlar.map((t) => (
                        <td key={t.turi} className="raqam px-3 py-2 text-right text-matn-ikki">
                          {q.soni[t.turi] ?? '—'}
                        </td>
                      ))}
                      <td className="raqam px-3 py-2 text-right font-medium text-matn">{q.jami}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Har tur — hodisalar ro'yxati ── */}
          {x.turlar.map((t) => {
            const d = NAZORAT_TAVSIFI[t.turi];
            return (
              <section key={t.turi} id={t.turi} className="scroll-mt-4">
                <h2 className="text-sm font-medium text-matn">
                  {d.nom} — <span className="raqam">{t.soni}</span>
                </h2>
                <p className="mb-2 text-xs text-matn-kuchsiz">{d.izoh}</p>
                <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                  <table className="w-full text-sm">
                    <tbody>
                      {t.hodisalar.slice(0, KORSATISH).map((h, i) => (
                        <tr key={`${String(h.sana.getTime())}-${String(i)}`} className="border-b border-chegara last:border-0">
                          <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-matn-kuchsiz">
                            {vaqt.format(h.sana)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-matn-ikki">{h.xodim}</td>
                          <td className="w-full px-3 py-2 text-matn-ikki">{h.tavsif === '' ? '—' : h.tavsif}</td>
                          <td className="raqam whitespace-nowrap px-3 py-2 text-right text-matn">
                            {h.summa === null ? '' : pul(h.summa)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            {h.havola !== null && (
                              <Link href={h.havola} className="text-[13px] text-brend hover:underline">
                                Ochish →
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {t.hodisalar.length > KORSATISH && (
                  <p className="mt-1 text-xs text-matn-kuchsiz">
                    Yana {t.hodisalar.length - KORSATISH} ta — davrni qisqartiring.
                  </p>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
