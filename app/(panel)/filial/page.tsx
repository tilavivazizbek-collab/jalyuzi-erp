import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { REJIM_NOMI, rejim } from '@/lib/domain/filial';
import { filialRoyxati } from './malumot';

export const dynamic = 'force-dynamic';

export default async function FilialRoyxati() {
  const f = await sahifaRuxsati('filial.kor');
  const royxat = await filialRoyxati();

  const yarataOladi = ruxsatBormi(f, 'filial.yarat');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Filiallar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Rejim «Sotadi» va «Ishlab chiqaradi» bayroqlaridan kelib chiqadi
            (20.2.1)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/filial/hisob"
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Hisob-kitob
          </Link>
          {yarataOladi && (
            <Link
              href="/filial/yangi"
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Yangi filial
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nomi</th>
              <th className="px-4 py-2.5 font-medium">Rejim</th>
              <th className="px-4 py-2.5 font-medium">Tikuvchi filial</th>
              <th className="px-4 py-2.5 font-medium">Kassa yopiladi</th>
              <th className="px-4 py-2.5 font-medium">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {royxat.map((q) => (
              <tr key={q.id} className={q.faol ? '' : 'text-slate-400'}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/filial/${String(q.id)}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {q.nom}
                  </Link>
                  {q.bosh && (
                    <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                      bosh
                    </span>
                  )}
                  {q.manzil !== null && (
                    <div className="text-xs text-slate-500">{q.manzil}</div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {
                    REJIM_NOMI[
                      rejim({ sotadi: q.sotadi, ishlabChiqaradi: q.ishlabChiqaradi })
                    ]
                  }
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {q.ishlabChiqaradi ? (
                    <span className="text-slate-400">o&apos;zi</span>
                  ) : (
                    (q.standartNomi ?? (
                      <span className="text-red-700">belgilanmagan</span>
                    ))
                  )}
                </td>
                <td className="raqam px-4 py-2.5">
                  {q.kassaYopilishSoati.slice(0, 5)}
                </td>
                <td className="px-4 py-2.5">
                  {q.faol ? (
                    <span className="text-emerald-700">faol</span>
                  ) : (
                    <span className="text-slate-400">nofaol</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
