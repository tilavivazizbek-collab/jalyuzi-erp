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
        <Link href="/kassa" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kassa
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">{k.ism}</h1>
      </div>

      {/* ── 10.16 · Balans bloki ── */}
      <dl className="grid max-w-lg grid-cols-2 gap-x-4 gap-y-1.5 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <dt className="text-matn-kuchsiz">Jami ishlagan</dt>
        <dd className="raqam">{pulKorsat(som(k.jamiIshlagan))}</dd>
        <dt className="text-matn-kuchsiz">Jami olgan</dt>
        <dd className="raqam">{pulKorsat(som(k.jamiOlgan))}</dd>
        <dt className="border-t border-chegara pt-1.5 font-medium">Balans</dt>
        <dd
          className={`raqam border-t border-chegara pt-1.5 font-semibold ${
            Number(k.somBalans) < 0 ? 'text-belgi-qizil' : ''
          }`}
        >
          {pulKorsat(som(k.somBalans))}
        </dd>
        {Number(k.dollarBalans) !== 0 && (
          <>
            <dt className="text-matn-kuchsiz">Dollar balansi</dt>
            <dd className={`raqam ${Number(k.dollarBalans) < 0 ? 'text-belgi-qizil' : ''}`}>
              {pulKorsat(dollar(k.dollarBalans))}
            </dd>
          </>
        )}
      </dl>

      {tolayOladi && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">Ish haqi to&apos;lash</h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Kassadan pul chiqadi, lekin xarajat yozilmaydi — haq allaqachon «Tugatdim» da xarajat
            bo&apos;lgan (12.1).
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
        <h2 className="mb-2 text-sm font-medium text-matn-ikki">Balans harakati</h2>
        {k.harakatlar.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
            Harakat yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Turi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                  <th className="px-4 py-2.5 font-medium">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {k.harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {h.sana.toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">{XODIM_HARAKAT_NOMI[h.turi] ?? h.turi}</td>
                    <td
                      className={`raqam px-4 py-2.5 font-medium ${
                        Number(h.summa) < 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                      }`}
                    >
                      {h.valyuta === 'SOM' ? pulKorsat(som(h.summa)) : pulKorsat(dollar(h.summa))}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-matn-kuchsiz">{h.izoh ?? '—'}</td>
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
