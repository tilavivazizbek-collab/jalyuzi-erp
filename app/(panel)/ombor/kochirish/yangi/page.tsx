import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { boshqaFiliallar } from '../malumot';
import { SorovFormasi } from '../sora-forma';

export const dynamic = 'force-dynamic';

export default async function YangiKochirish() {
  const f = await sahifaRuxsati('ombor.kochirish.yarat');
  const filiallar = await boshqaFiliallar(f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor/kochirish" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Ko&apos;chirishlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Material so&apos;rash
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Boshqa filialdan material so&apos;rash (20.7.1)
        </p>
      </div>

      {filiallar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Boshqa faol filial yo&apos;q.
        </p>
      ) : (
        <SorovFormasi filiallar={filiallar} />
      )}
    </div>
  );
}
