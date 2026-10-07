import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { kirimMateriallari, kirimYetkazuvchilari } from '../../malumot';
import { yoldaXaritasi } from '../malumot';
import { XaridFormasi } from '../forma';

export const dynamic = 'force-dynamic';

/**
 * ⚠️ `?material=1,2,3` — material kartochkasidan (va keyin «kam qolgan»
 *    ro'yxatidan) shu materiallar bilan ochiladi. Noto'g'ri raqam
 *    jimgina tashlab yuboriladi.
 */
export default async function YangiXarid({
  searchParams,
}: {
  searchParams: Promise<{ material?: string | string[]; yetkazib?: string }>;
}) {
  const f = await sahifaRuxsati('ombor.kirim.yarat');
  const [materiallar, yetkazuvchilar, yolda] = await Promise.all([
    kirimMateriallari(),
    kirimYetkazuvchilari(),
    yoldaXaritasi(f.filialId),
  ]);
  const sp = await searchParams;
  /**
   * ⚠️ Ikki shakl: `?material=1,2` (kartochka) va `?material=1&material=2`
   *    («Buyurtma kerak» ro'yxatidagi belgilash formasi).
   */
  const xomMaterial = Array.isArray(sp.material) ? sp.material.join(',') : (sp.material ?? '');
  const yetkazibXom = Number(sp.yetkazib);
  const boshYetkazibId = yetkazuvchilar.some((y) => y.id === yetkazibXom) ? yetkazibXom : null;
  const boshMaterialIdlar = [
    ...new Set(
      xomMaterial
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((n) => Number.isSafeInteger(n) && n > 0),
    ),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor/xarid" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Xarid buyurtmalari
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yangi xarid buyurtmasi
        </h1>
        <p className="mt-1 text-xs text-matn-kuchsiz">
          Buyurtma omborga ham, qarzga ham tegmaydi — ular mol kelib, kirim qilinganda yoziladi.
        </p>
      </div>
      <XaridFormasi
        materiallar={materiallar}
        yetkazuvchilar={yetkazuvchilar}
        yolda={Object.fromEntries(yolda)}
        boshMaterialIdlar={boshMaterialIdlar}
        boshYetkazibId={boshYetkazibId}
      />
    </div>
  );
}
