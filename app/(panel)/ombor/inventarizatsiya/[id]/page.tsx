import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { INV_SABAB_NOMI, type InventarizatsiyaSababi } from '@/lib/domain/inventarizatsiya';
import { varaqaTafsiloti } from '../../malumot';
import { VaraqaFormasi } from '../varaqa-forma';

export const dynamic = 'force-dynamic';

const sababNomi = (x: string | null): string => {
  if (x === null) return '—';
  return INV_SABAB_NOMI[x as InventarizatsiyaSababi] ?? x;
};

export default async function VaraqaSahifasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const f = await sahifaRuxsati('ombor.inventarizatsiya');

  const { id } = await params;
  const varaqaId = Number(id);
  if (!Number.isSafeInteger(varaqaId) || varaqaId <= 0) notFound();

  const v = await varaqaTafsiloti(varaqaId, f.filialId);
  if (v === null) notFound();

  const ochiq = v.holat === 'OCHIQ';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/ombor/inventarizatsiya"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Inventarizatsiya
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Sanash varaqasi — {v.sana}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {v.kim} · {v.satrlar.length} ta qator
          {v.izoh !== null && ` · ${v.izoh}`}
        </p>
      </div>

      {ochiq ? (
        <VaraqaFormasi
          varaqaId={v.id}
          satrlar={v.satrlar.map((s) => ({
            qatorId: s.qatorId,
            kod: s.kod,
            turi: s.turi,
            materialNomi: s.materialNomi,
            sarflashBirligi: s.sarflashBirligi,
            tizimdaEniM: s.tizimdaEniM,
            tizimdaBoyiM: s.tizimdaBoyiM,
            tizimdaMiqdor: s.tizimdaMiqdor,
            band: s.band,
            yolda: s.yolda,
          }))}
        />
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <b>Yakunlangan.</b> Jami farq:{' '}
            <span
              className={
                v.farqSumma !== null && Number(v.farqSumma) < 0
                  ? 'raqam font-semibold text-red-700'
                  : 'raqam font-semibold'
              }
            >
              {v.farqSumma === null ? '—' : pulKorsat(som(v.farqSumma))}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Farq foyda-zarar hisobotiga xarajat bo&apos;lib tushadi. Ortiqcha
              chiqsa — daromad emas, xarajat kamayishi (15.1).
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Material</th>
                  <th className="px-3 py-2.5 font-medium">Bo&apos;lak</th>
                  <th className="px-3 py-2.5 text-right font-medium">Tizimda</th>
                  <th className="px-3 py-2.5 text-right font-medium">Haqiqatda</th>
                  <th className="px-3 py-2.5 text-right font-medium">Farq</th>
                  <th className="px-3 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-3 py-2.5 font-medium">Sabab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {v.satrlar.map((s) => {
                  const dona = s.turi === 'DONA';
                  const birlik = dona
                    ? s.sarflashBirligi === 'SM'
                      ? 'sm'
                      : 'dona'
                    : 'kv.m';
                  const sanaldi = dona
                    ? s.haqiqatdaMiqdor !== null
                    : s.haqiqatdaEniM !== null && s.haqiqatdaBoyiM !== null;

                  return (
                    <tr key={s.qatorId} className={sanaldi ? '' : 'text-slate-400'}>
                      <td className="px-3 py-2">{s.materialNomi}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.kod}
                        {s.band && <span className="ml-2 text-amber-700">band</span>}
                        {s.yolda && <span className="ml-2 text-slate-500">yo&apos;lda</span>}
                      </td>
                      <td className="raqam px-3 py-2 whitespace-nowrap">
                        {dona
                          ? `${String(s.tizimdaMiqdor ?? 0)} ${birlik}`
                          : `${(s.tizimdaEniM ?? 0).toFixed(2)} × ${(s.tizimdaBoyiM ?? 0).toFixed(2)} m`}
                      </td>
                      <td className="raqam px-3 py-2 whitespace-nowrap">
                        {!sanaldi
                          ? 'sanalmagan'
                          : dona
                            ? `${String(s.haqiqatdaMiqdor ?? 0)} ${birlik}`
                            : `${(s.haqiqatdaEniM ?? 0).toFixed(2)} × ${(s.haqiqatdaBoyiM ?? 0).toFixed(2)} m`}
                      </td>
                      <td
                        className={`raqam px-3 py-2 ${
                          s.farqKvM !== null && s.farqKvM < 0 ? 'text-red-700' : ''
                        }`}
                      >
                        {s.farqKvM === null || s.farqKvM === 0
                          ? '—'
                          : `${s.farqKvM > 0 ? '+' : ''}${s.farqKvM.toFixed(2)} ${birlik}`}
                      </td>
                      <td className="raqam px-3 py-2">
                        {s.farqSumma === null || Number(s.farqSumma) === 0
                          ? '—'
                          : pulKorsat(som(s.farqSumma))}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {sababNomi(s.sabab)}
                        {s.izoh !== null && (
                          <span className="block text-slate-400">{s.izoh}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
