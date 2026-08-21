import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { sotuvTurlari, tikaOladiganFiliallar } from './malumot';
import { SotuvFormasi } from './forma';

export const dynamic = 'force-dynamic';

export default async function SotuvEkrani() {
  const f = await sahifaRuxsati('buyurtma.yarat');

  const [turlar, filiallar] = await Promise.all([
    sotuvTurlari(f.filialId),
    tikaOladiganFiliallar(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sotuv</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ekran bitta — boshqa sahifaga o&apos;tish shart emas (3.1). Filial #
          {f.filialId}
        </p>
      </div>

      <SotuvFormasi turlar={turlar} filiallar={filiallar} ozFilialId={f.filialId} />
    </div>
  );
}
