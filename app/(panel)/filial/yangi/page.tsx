import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { tikaOladiganFiliallar } from '../malumot';
import { FilialFormasi } from '../filial-forma';

export const dynamic = 'force-dynamic';

export default async function YangiFilial() {
  await sahifaRuxsati('filial.yarat');
  const tikuvchilar = await tikaOladiganFiliallar(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/filial" className="text-sm text-slate-500 hover:text-slate-900">
          ← Filiallar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Yangi filial</h1>
        <p className="mt-1 text-sm text-slate-500">
          Filial ochilgach unga kassa va xodim biriktiriladi (12, 10)
        </p>
      </div>

      <FilialFormasi filial={null} tikuvchilar={tikuvchilar} />
    </div>
  );
}
