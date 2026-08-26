import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kirimTafsiloti } from '../../malumot';
import { StornoFormasi } from '../storno-forma';

export const dynamic = 'force-dynamic';

export default async function KirimTafsili({ params }: { params: Promise<{ id: string }> }) {
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
        <Link href="/ombor/kirim" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kirim hujjatlari
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">{h.raqam}</h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {h.sana} · {h.yetkazibNomi} · {h.valyuta}
        </p>
      </div>

      {storno && (
        <p className="rounded-karta bg-belgi-qizil-fon px-4 py-3 text-sm text-belgi-qizil ">
          <b>Storno qilingan.</b> {h.stornoSabab ?? ''} — hujjat tarixda qoladi, o&apos;chirilmaydi
          (§6.5).
        </p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-matn-ikki">Qatorlar</h2>
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Material</th>
                <th className="px-4 py-2.5 text-right font-medium">Miqdor</th>
                <th className="px-4 py-2.5 text-right font-medium">Narx</th>
                <th className="px-4 py-2.5 text-right font-medium">Transport ulushi</th>
                <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
                <th className="px-4 py-2.5 text-right font-medium">Brak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara">
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
        <p className="mt-2 text-xs text-matn-kuchsiz">
          Tannarx = narx + transport ulushi; brak SON bo&apos;yicha bo&apos;linmaydi (7.9 · P-17).
        </p>
      </section>

      <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-2 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <dt className="text-matn-kuchsiz">Transport</dt>
        <dd className="raqam">{pul(h.transportSumma)}</dd>
        <dt className="text-matn-kuchsiz">Bojxona</dt>
        <dd className="raqam">{pul(h.bojxonaSumma)}</dd>
        <dt className="text-matn-kuchsiz">Omborda turgan bo&apos;lak</dt>
        <dd className="raqam">{h.omborda}</dd>
        <dt className="text-matn-kuchsiz">Ishlatilgan bo&apos;lak</dt>
        <dd className="raqam">{h.ishlatilgan}</dd>
      </dl>

      {stornoQilaOladi && !storno && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-matn-ikki">Storno (7.12)</h2>
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
