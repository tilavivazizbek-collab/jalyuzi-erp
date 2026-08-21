import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { HOLAT_NOMI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { buyurtmalar, FILTR_NOMI, type BuyurtmaFiltri } from './malumot';

export const dynamic = 'force-dynamic';

const FILTRLAR = Object.keys(FILTR_NOMI) as BuyurtmaFiltri[];

export default async function BuyurtmalarRoyxati({
  searchParams,
}: {
  searchParams: Promise<{ filtr?: string }>;
}) {
  const f = await sahifaRuxsati('buyurtma.kor');
  const sotaOladi = ruxsatBormi(f, 'buyurtma.yarat');

  const { filtr } = await searchParams;
  const joriy: BuyurtmaFiltri = FILTRLAR.includes(filtr as BuyurtmaFiltri)
    ? (filtr as BuyurtmaFiltri)
    : 'HAMMASI';

  const royxat = await buyurtmalar(f.filialId, joriy);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Buyurtmalar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Buyurtmaning umumiy statusi yo&apos;q — holat har pozitsiyada (8.2)
          </p>
        </div>
        {sotaOladi && (
          <Link
            href="/sotuv"
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Yangi buyurtma
          </Link>
        )}
      </div>

      {/* TZ 8.15 — filtrlar */}
      <nav className="flex flex-wrap gap-1.5">
        {FILTRLAR.map((x) => (
          <Link
            key={x}
            href={x === 'HAMMASI' ? '/buyurtma' : `/buyurtma?filtr=${x}`}
            className={`rounded-md px-2.5 py-1.5 text-sm transition ${
              x === joriy
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {FILTR_NOMI[x]}
          </Link>
        ))}
      </nav>

      {royxat.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Bu filtrda buyurtma yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Chek №</th>
                <th className="px-4 py-2.5 font-medium">Sana</th>
                <th className="px-4 py-2.5 font-medium">Mijoz</th>
                <th className="px-4 py-2.5 font-medium">Manba</th>
                <th className="px-4 py-2.5 font-medium">Holatlar</th>
                <th className="px-4 py-2.5 font-medium">Muddat</th>
                <th className="px-4 py-2.5 text-right font-medium">Jami</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {royxat.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/buyurtma/${String(b.id)}`}
                      className="font-mono text-xs underline underline-offset-2 hover:text-slate-900"
                    >
                      {b.raqam}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {b.sana.toLocaleDateString('uz-UZ', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    {b.mijozIsmi ?? (
                      <span className="text-slate-400">mijozsiz</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{b.manba}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap gap-1.5 text-xs">
                      {Object.entries(b.holatlar).map(([h, n]) => (
                        <span
                          key={h}
                          className={`rounded px-1.5 py-0.5 ${
                            h === 'MATERIALGA_KUTMOQDA'
                              ? 'bg-amber-100 text-amber-900'
                              : h === 'TOPSHIRILDI'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {n} {HOLAT_NOMI[h as PozitsiyaHolati] ?? h}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {b.tayyorlikSana ?? (
                      <span className="text-slate-400">kiritilmagan</span>
                    )}
                  </td>
                  <td className="raqam px-4 py-2.5 font-medium">
                    {b.valyuta === 'SOM' ? pulKorsat(som(b.jami)) : `${b.jami} $`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Muddati kiritilmagan buyurtma «kechikkan» hisoblanmaydi (3.13) — u
        alohida ustunda ko&apos;rinadi.
      </p>
    </div>
  );
}
