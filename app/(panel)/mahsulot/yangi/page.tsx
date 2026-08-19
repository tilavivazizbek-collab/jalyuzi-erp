import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mahsulotYaratAmali } from '../amal';
import { BOSH_QIYMATLAR, MahsulotFormasi } from '../forma';
import { guruhlarniOl, materiallarniOl } from '../malumot';

export const dynamic = 'force-dynamic';

export default async function YangiMahsulot() {
  await sahifaRuxsati('mahsulot.yarat');

  const [guruhlar, materiallar] = await Promise.all([guruhlarniOl(), materiallarniOl()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/mahsulot" className="text-sm text-slate-500 hover:text-slate-900">
          ← Mahsulot turlari
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Yangi mahsulot turi</h1>
      </div>

      <MahsulotFormasi
        amal={mahsulotYaratAmali}
        qiymatlar={BOSH_QIYMATLAR}
        guruhlar={guruhlar}
        materiallar={materiallar}
        tugmaMatni="Saqlash"
      />
    </div>
  );
}
