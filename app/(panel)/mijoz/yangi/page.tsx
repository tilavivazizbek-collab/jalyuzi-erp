import Link from 'next/link';
import { faolTurlar } from '@/lib/amal/mijoz-turi';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mijozYaratAmali } from '../amal';
import { BOSH_QIYMATLAR, MijozFormasi } from '../forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { guruhTanlovlari } from '../guruh/malumot';

export const dynamic = 'force-dynamic';

export default async function YangiMijoz() {
  const f = await sahifaRuxsati('mijoz.yarat');
  const [guruhlar, turlar] = await Promise.all([
    guruhTanlovlari(),
    faolTurlar(ulanishOl()),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/mijoz" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Mijozlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">Yangi mijoz</h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <MijozFormasi
          amal={mijozYaratAmali}
          qiymatlar={BOSH_QIYMATLAR}
          tugmaMatni="Saqlash"
          guruhlar={guruhlar}
          turlar={turlar}
          turQoshaOladi={ruxsatBormi(f, 'mijoz.ozgartir')}
          guruhQoshaOladi={ruxsatBormi(f, 'mijoz.ozgartir')}
        />
      </div>
    </div>
  );
}
