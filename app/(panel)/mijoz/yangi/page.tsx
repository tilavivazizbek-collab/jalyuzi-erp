import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mijozYaratAmali } from '../amal';
import { BOSH_QIYMATLAR, MijozFormasi } from '../forma';

export const dynamic = 'force-dynamic';

export default async function YangiMijoz() {
  await sahifaRuxsati('mijoz.yarat');

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/mijoz" className="text-sm text-slate-500 hover:text-slate-900">
          ← Mijozlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Yangi mijoz</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <MijozFormasi amal={mijozYaratAmali} qiymatlar={BOSH_QIYMATLAR} tugmaMatni="Saqlash" />
      </div>
    </div>
  );
}
