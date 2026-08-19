import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { ruxsatTekshir } from '@/lib/ruxsat/tekshir';
import { GURUHLAR, RUXSATLAR, RUXSAT_KODLARI } from '@/lib/ruxsat/kodlar';

export const dynamic = 'force-dynamic';

/**
 * 1-bosqich sahifasi: kim kirgani va unga NIMA ochiqligi ko'rinadi.
 *
 * 8-bosqichda bu o'rinni haqiqiy dashboard egallaydi (TZ 11).
 */
export default async function BoshqaruvSahifasi() {
  const f = await kirganBolishiShart();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-xl font-semibold tracking-tight">Boshqaruv</h1>
        <p className="mt-1 text-sm text-slate-500">
          Filial #{f.filialId}
          {f.boshFilialda ? ' · bosh filial' : ''} · {f.rollar.length} rol
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700">Sizga ochiq amallar</h2>
        <p className="mt-1 text-xs text-slate-500">
          Ruxsatlar barcha rollaringiz yig'indisi (TZ 10.3). Qamrov — TZ 20.12.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GURUHLAR.map((guruh) => {
            const kodlar = RUXSAT_KODLARI.filter((k) => RUXSATLAR[k].guruh === guruh);
            return (
              <div key={guruh} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-medium">{guruh}</h3>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {kodlar.map((kod) => {
                    const n = ruxsatTekshir(f, kod);
                    return (
                      <li key={kod} className="flex items-baseline justify-between gap-2 text-sm">
                        <span className={n.ruxsat ? 'text-slate-700' : 'text-slate-400'}>
                          {n.ruxsat ? '☑' : '☐'} {RUXSATLAR[kod].nom}
                        </span>
                        {n.ruxsat && (
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {n.qamrov === 'BARCHA' ? 'barcha filial' : "o'z filiali"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
