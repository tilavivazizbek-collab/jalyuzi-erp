import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { materialYaratAmali } from '../amal';
import { BOSH_QIYMATLAR, MaterialFormasi, type Guruh } from '../forma';

export const dynamic = 'force-dynamic';

export default async function YangiMaterial() {
  await sahifaRuxsati('material.yarat');

  const guruhlar = await ulanishOl()<Guruh[]>`
    SELECT id, nom FROM almashtirish_guruh WHERE faol = true ORDER BY nom`;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/material" className="text-sm text-slate-500 hover:text-slate-900">
          ← Materiallar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Yangi material</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <MaterialFormasi
          amal={materialYaratAmali}
          qiymatlar={BOSH_QIYMATLAR}
          guruhlar={guruhlar}
          tugmaMatni="Saqlash"
        />
      </div>
    </div>
  );
}
