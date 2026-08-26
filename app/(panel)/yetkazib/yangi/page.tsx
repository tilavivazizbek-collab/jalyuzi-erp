import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { yetkazibYaratAmali } from '../amal';
import { BOSH_QIYMATLAR, YetkazibFormasi } from '../forma';

export const dynamic = 'force-dynamic';

export default async function YangiYetkazib() {
  await sahifaRuxsati('yetkazib.yarat');

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/yetkazib" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Yetkazib beruvchilar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yangi yetkazib beruvchi
        </h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <YetkazibFormasi
          amal={yetkazibYaratAmali}
          qiymatlar={BOSH_QIYMATLAR}
          tugmaMatni="Saqlash"
        />
      </div>
    </div>
  );
}
