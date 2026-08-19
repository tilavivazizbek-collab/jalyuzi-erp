import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { telefonKorsat } from '@/lib/domain/telefon';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  readonly nima_yetkazadi: string | null;
  readonly kontakt_shaxs: string | null;
  readonly telefon: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly valyuta: string;
  readonly faol: boolean;
}

export default async function YetkazibRoyxati() {
  const f = await sahifaRuxsati('yetkazib.kor');
  const yarataOladi = ruxsatBormi(f, 'yetkazib.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'yetkazib.ozgartir');

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT id, nom, nima_yetkazadi, kontakt_shaxs, telefon,
           tolov_muddati_kun, valyuta, faol
    FROM yetkazib_beruvchi ORDER BY faol DESC, nom`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Yetkazib beruvchilar</h1>
          <p className="mt-1 text-sm text-slate-500">
            {qatorlar.length} ta · qarzi umumiy, filialga bog&apos;lanmagan (Q-26)
          </p>
        </div>
        {yarataOladi && (
          <Link
            href="/yetkazib/yangi"
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Qo&apos;shish
          </Link>
        )}
      </div>

      {qatorlar.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Hali yetkazib beruvchi yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomi</th>
                <th className="px-4 py-2.5 font-medium">Nima yetkazadi</th>
                <th className="px-4 py-2.5 font-medium">Kontakt</th>
                <th className="px-4 py-2.5 font-medium">To&apos;lov muddati</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qatorlar.map((y) => (
                <tr key={y.id} className={y.faol ? '' : 'bg-slate-50 text-slate-400'}>
                  <td className="px-4 py-2.5 font-medium">
                    {y.nom}
                    {!y.faol && <span className="ml-2 text-xs">(nofaol)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {y.nima_yetkazadi ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {y.kontakt_shaxs ?? ''}
                    {y.telefon !== null && (
                      <span className="ml-2 text-slate-500">{telefonKorsat(y.telefon)}</span>
                    )}
                    {y.kontakt_shaxs === null && y.telefon === null && (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {y.tolov_muddati_kun === null ? (
                      <span className="text-slate-400">standart</span>
                    ) : (
                      `${String(y.tolov_muddati_kun)} kun`
                    )}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/yetkazib/${String(y.id)}`} className="text-slate-600 hover:text-slate-900">
                        Tahrirlash
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
