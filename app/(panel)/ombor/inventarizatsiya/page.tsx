import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { varaqalar } from '../malumot';

export const dynamic = 'force-dynamic';

const HOLAT_NOMI: Record<string, string> = {
  OCHIQ: 'ochiq',
  YAKUNLANDI: 'yakunlangan',
  STORNO: 'storno',
};

export default async function InventarizatsiyaRoyxati() {
  const f = await sahifaRuxsati('ombor.inventarizatsiya');
  const royxat = await varaqalar(f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/ombor" className="text-sm text-slate-500 hover:text-slate-900">
            ← Ombor qoldig&apos;i
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Inventarizatsiya</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tizim ko&apos;rsatgan qoldiq bilan omborda turgan miqdorni
            solishtirish (15.1)
          </p>
        </div>
        <Link
          href="/ombor/inventarizatsiya/yangi"
          className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Yangi sanash
        </Link>
      </div>

      {royxat.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Hali inventarizatsiya o&apos;tkazilmagan.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Sana</th>
                <th className="px-4 py-2.5 font-medium">Kim</th>
                <th className="px-4 py-2.5 text-right font-medium">Qator</th>
                <th className="px-4 py-2.5 text-right font-medium">Farq chiqqan</th>
                <th className="px-4 py-2.5 text-right font-medium">Jami farq</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {royxat.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/ombor/inventarizatsiya/${String(v.id)}`}
                      className="underline underline-offset-2 hover:text-slate-900"
                    >
                      {v.sana}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{v.kim}</td>
                  <td className="raqam px-4 py-2.5">{v.qatorSoni}</td>
                  <td className="raqam px-4 py-2.5">{v.farqli}</td>
                  <td
                    className={`raqam px-4 py-2.5 ${
                      v.farqSumma !== null && Number(v.farqSumma) < 0 ? 'text-red-700' : ''
                    }`}
                  >
                    {v.farqSumma === null ? '—' : pulKorsat(som(v.farqSumma))}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        v.holat === 'OCHIQ' ? 'text-amber-700' : 'text-slate-500'
                      }
                    >
                      {HOLAT_NOMI[v.holat] ?? v.holat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Ombor uchta yo&apos;l bilan kamayadi: hisobdan chiqarish, qo&apos;lda
        tuzatish, inventarizatsiya. Uchalasi ham omborchi qo&apos;lida —
        shuning uchun bu ro&apos;yxat nazorat vositasi (15.1).
      </p>
    </div>
  );
}
