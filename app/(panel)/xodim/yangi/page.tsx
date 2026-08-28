import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { rolRoyxati, xodimFiliallari } from '../malumot';
import { BOSH_XODIM, XodimFormasi } from '../forma';
import { xodimYaratAmali } from '../amal';

export const dynamic = 'force-dynamic';

export default async function YangiXodim() {
  const f = await sahifaRuxsati('xodim.yarat');

  const [filiallar, rollar] = await Promise.all([xodimFiliallari(), rolRoyxati()]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/xodim" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Xodimlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yangi xodim
        </h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <XodimFormasi
          amal={xodimYaratAmali}
          qiymatlar={{ ...BOSH_XODIM, filialId: String(f.filialId) }}
          filiallar={filiallar}
          rollar={rollar}
          tugmaMatni="Saqlash"
        />
      </div>
    </div>
  );
}
