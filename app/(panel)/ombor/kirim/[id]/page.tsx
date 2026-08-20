import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kirimTafsiloti } from '../../malumot';
import { StornoFormasi } from '../storno-forma';

export const dynamic = 'force-dynamic';

export default async function KirimTafsili({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const stornoQilaOladi = ruxsatBormi(f, 'ombor.storno');

  const { id } = await params;
  const kirimId = Number(id);
  if (!Number.isSafeInteger(kirimId) || kirimId <= 0) notFound();

  const h = await kirimTafsiloti(kirimId, f.filialId);
  if (h === null) notFound();

  const storno = h.holat === 'STORNO';
  const pul = (x: string): string => (h.valyuta === 'SOM' ? pulKorsat(som(x)) : `${x} $`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor/kirim" className="text-sm text-slate-500 hover:text-slate-900">
          ← Kirim hujjatlari
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{h.raqam}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {h.sana} · {h.yetkazibNomi} · {h.valyuta}
        </p>
      </div>

      {storno && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 ring-1 ring-red-200">
          <b>Storno qilingan.</b> {h.stornoSabab ?? ''} — hujjat tarixda qoladi,
          o&apos;chirilmaydi (§6.5).
        </p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-700">Qatorlar</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Material</th>
                <th className="px-4 py-2.5 text-right font-medium">Miqdor</th>
                <th className="px-4 py-2.5 text-right font-medium">Narx</th>
                <th className="px-4 py-2.5 text-right font-medium">Transport ulushi</th>
                <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                <th className="px-4 py-2.5 text-right font-medium">Brak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {h.qatorlar.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-2.5">{q.materialNomi}</td>
                  <td className="raqam px-4 py-2.5">{q.miqdorKirim}</td>
                  <td className="raqam px-4 py-2.5">{pul(q.narxBirlik)}</td>
                  <td className="raqam px-4 py-2.5">{pul(q.transportUlush)}</td>
                  <td className="raqam px-4 py-2.5 font-medium">{pul(q.tannarxBirlik)}</td>
                  <td className="raqam px-4 py-2.5">
                    {q.defektMiqdor === 0 ? '—' : q.defektMiqdor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Tannarx = narx + transport ulushi; brak SON bo&apos;yicha bo&apos;linmaydi
          (7.9 · P-17).
        </p>
      </section>

      <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <dt className="text-slate-500">Transport</dt>
        <dd className="raqam">{pul(h.transportSumma)}</dd>
        <dt className="text-slate-500">Bojxona</dt>
        <dd className="raqam">{pul(h.bojxonaSumma)}</dd>
        <dt className="text-slate-500">Omborda turgan bo&apos;lak</dt>
        <dd className="raqam">{h.omborda}</dd>
        <dt className="text-slate-500">Ishlatilgan bo&apos;lak</dt>
        <dd className="raqam">{h.ishlatilgan}</dd>
      </dl>

      {stornoQilaOladi && !storno && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-700">Storno (7.12)</h2>
          <StornoFormasi
            kirimId={h.id}
            raqam={h.raqam}
            omborda={h.omborda}
            ishlatilgan={h.ishlatilgan}
          />
        </section>
      )}
    </div>
  );
}
