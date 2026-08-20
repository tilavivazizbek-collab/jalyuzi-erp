import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { omborMateriallari } from '../../malumot';
import { VaraqaOchFormasi } from './forma';

export const dynamic = 'force-dynamic';

export default async function YangiInventarizatsiya() {
  const f = await sahifaRuxsati('ombor.inventarizatsiya');
  const materiallar = await omborMateriallari(f.filialId);

  const bugun = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/ombor/inventarizatsiya"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Inventarizatsiya
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Yangi sanash</h1>
        <p className="mt-1 text-sm text-slate-500">
          Filial #{f.filialId} · admin tasdig&apos;i kutilmaydi (15.1)
        </p>
      </div>

      <VaraqaOchFormasi materiallar={materiallar} bugun={bugun} />
    </div>
  );
}
