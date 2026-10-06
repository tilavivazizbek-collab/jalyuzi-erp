import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { omborMateriallari } from '../../malumot';
import { VaraqaOchFormasi } from './forma';
import { toshkentKuni } from '@/lib/domain/sana';

export const dynamic = 'force-dynamic';

export default async function YangiInventarizatsiya() {
  const f = await sahifaRuxsati('ombor.inventarizatsiya');
  const materiallar = await omborMateriallari(f.filialId);

  const bugun = toshkentKuni();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor/inventarizatsiya" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Inventarizatsiya
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yangi sanash
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Filial #{f.filialId} · admin tasdig&apos;i kutilmaydi (15.1)
        </p>
      </div>

      <VaraqaOchFormasi materiallar={materiallar} bugun={bugun} />
    </div>
  );
}
