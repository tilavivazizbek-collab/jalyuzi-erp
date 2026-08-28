import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { kassaFiliallari, kassaXodimlari } from '../malumot';
import { KassaYaratFormasi } from '../yarat-forma';
import { kassaYaratAmali } from '../yarat-amal';

export const dynamic = 'force-dynamic';

export default async function YangiKassa() {
  const f = await sahifaRuxsati('kassa.yarat');

  const [filiallar, xodimlar] = await Promise.all([kassaFiliallari(), kassaXodimlari()]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/kassa" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kassa
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yangi kassa
        </h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <KassaYaratFormasi
          amal={kassaYaratAmali}
          filiallar={filiallar}
          xodimlar={xodimlar}
          ozFilialId={f.filialId}
        />
      </div>
    </div>
  );
}
