import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kirimHujjatlari } from '../malumot';

export const dynamic = 'force-dynamic';

export default async function KirimRoyxati() {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const kirimQilaOladi = ruxsatBormi(f, 'ombor.kirim.yarat');

  const hujjatlar = await kirimHujjatlari(f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/ombor" className="text-sm text-slate-500 hover:text-slate-900">
            ← Ombor qoldig&apos;i
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Kirim hujjatlari</h1>
          <p className="mt-1 text-sm text-slate-500">
            Filial #{f.filialId} · oxirgi {hujjatlar.length} ta
          </p>
        </div>
        {kirimQilaOladi && (
          <Link
            href="/ombor/kirim/yangi"
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Yangi kirim
          </Link>
        )}
      </div>

      {hujjatlar.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Hali kirim hujjati yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Raqam</th>
                <th className="px-4 py-2.5 font-medium">Sana</th>
                <th className="px-4 py-2.5 font-medium">Yetkazib beruvchi</th>
                <th className="px-4 py-2.5 text-right font-medium">Qator</th>
                <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hujjatlar.map((h) => {
                const storno = h.holat === 'STORNO';
                return (
                  <tr key={h.id} className={storno ? 'text-slate-400' : ''}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/ombor/kirim/${String(h.id)}`}
                        className="font-mono text-xs underline underline-offset-2 hover:text-slate-900"
                      >
                        {h.raqam}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{h.sana}</td>
                    <td className="px-4 py-2.5">{h.yetkazibNomi}</td>
                    <td className="raqam px-4 py-2.5">{h.qatorSoni}</td>
                    <td className={`raqam px-4 py-2.5 ${storno ? 'line-through' : ''}`}>
                      {h.valyuta === 'SOM' ? pulKorsat(som(h.jamiSumma)) : `${h.jamiSumma} $`}
                    </td>
                    <td className="px-4 py-2.5">
                      {storno ? (
                        <span className="text-red-700">storno</span>
                      ) : (
                        <span className="text-emerald-700">faol</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
