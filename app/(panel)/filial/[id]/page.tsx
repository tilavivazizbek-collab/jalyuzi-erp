import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { REJIM_IZOHI, REJIM_NOMI, rejim } from '@/lib/domain/filial';
import { filialOl, tikaOladiganFiliallar } from '../malumot';
import { FilialFormasi } from '../filial-forma';

export const dynamic = 'force-dynamic';

export default async function FilialKartochkasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await sahifaRuxsati('filial.kor');

  const filialId = Number(id);
  if (!Number.isInteger(filialId) || filialId <= 0) notFound();

  const filial = await filialOl(filialId);
  if (filial === null) notFound();

  const tahrirlayOladi = ruxsatBormi(f, 'filial.ozgartir');
  const tikuvchilar = tahrirlayOladi ? await tikaOladiganFiliallar(filialId) : [];

  const joriyRejim = rejim({
    sotadi: filial.sotadi,
    ishlabChiqaradi: filial.ishlabChiqaradi,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/filial" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Filiallar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          {filial.nom}
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {REJIM_NOMI[joriyRejim]} — {REJIM_IZOHI[joriyRejim]}
        </p>
      </div>

      {tahrirlayOladi ? (
        <FilialFormasi filial={filial} tikuvchilar={tikuvchilar} />
      ) : (
        <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Manzil</dt>
            <dd className="mt-1 text-sm">{filial.manzil ?? '—'}</dd>
          </div>
          <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Telefon</dt>
            <dd className="mt-1 text-sm">{filial.telefon ?? '—'}</dd>
          </div>
          <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Tikuvchi filial</dt>
            <dd className="mt-1 text-sm">
              {filial.ishlabChiqaradi ? "o'zi" : (filial.standartNomi ?? '—')}
            </dd>
          </div>
          <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Kassa yopiladi</dt>
            <dd className="raqam mt-1 text-sm">{filial.kassaYopilishSoati.slice(0, 5)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
