import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { kassaQoldiqlari, xodimKartochkasi, XODIM_HARAKAT_NOMI } from '../../malumot';
import { IshHaqiFormasi } from '../../ish-haqi-forma';

export const dynamic = 'force-dynamic';

export default async function XodimKartochkasiSahifasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const f = await sahifaRuxsati('kassa.barcha.kor');
  const tolayOladi = ruxsatBormi(f, 'kassa.ish.haqi');

  const { id } = await params;
  const xodimId = Number(id);
  if (!Number.isSafeInteger(xodimId) || xodimId <= 0) notFound();

  const [k, kassalar] = await Promise.all([
    xodimKartochkasi(xodimId, f.filialId),
    kassaQoldiqlari(f.filialId, f.xodimId, true),
  ]);

  if (k === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/kassa" className="text-sm text-slate-500 hover:text-slate-900">
          ← Kassa
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{k.ism}</h1>
      </div>

      {/* ── 10.16 · Balans bloki ── */}
      <dl className="grid max-w-lg grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <dt className="text-slate-500">Jami ishlagan</dt>
        <dd className="raqam">{pulKorsat(som(k.jamiIshlagan))}</dd>
        <dt className="text-slate-500">Jami olgan</dt>
        <dd className="raqam">{pulKorsat(som(k.jamiOlgan))}</dd>
        <dt className="border-t border-slate-200 pt-1.5 font-medium">Balans</dt>
        <dd
          className={`raqam border-t border-slate-200 pt-1.5 font-semibold ${
            Number(k.somBalans) < 0 ? 'text-red-700' : ''
          }`}
        >
          {pulKorsat(som(k.somBalans))}
        </dd>
        {Number(k.dollarBalans) !== 0 && (
          <>
            <dt className="text-slate-500">Dollar balansi</dt>
            <dd className={`raqam ${Number(k.dollarBalans) < 0 ? 'text-red-700' : ''}`}>
              {pulKorsat(dollar(k.dollarBalans))}
            </dd>
          </>
        )}
      </dl>

      {tolayOladi && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-slate-700">
            Ish haqi to&apos;lash
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Kassadan pul chiqadi, lekin xarajat yozilmaydi — haq allaqachon
            «Tugatdim» da xarajat bo&apos;lgan (12.1).
          </p>
          <IshHaqiFormasi
            xodimId={k.xodimId}
            somBalans={k.somBalans}
            dollarBalans={k.dollarBalans}
            kassalar={kassalar}
          />
        </section>
      )}

      {/* ── 10.3 · Harakatlar ── */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-700">Balans harakati</h2>
        {k.harakatlar.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Harakat yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Turi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {k.harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 text-slate-600">
                      {h.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">
                      {XODIM_HARAKAT_NOMI[h.turi] ?? h.turi}
                    </td>
                    <td
                      className={`raqam px-4 py-2.5 font-medium ${
                        Number(h.summa) < 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {h.valyuta === 'SOM'
                        ? pulKorsat(som(h.summa))
                        : pulKorsat(dollar(h.summa))}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {h.izoh ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
