import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ImportFormasi } from './forma';

export const dynamic = 'force-dynamic';

/** Mijozlarni Excel/CSV dan import — egasi auditi 2026-10-06 */
export default async function MijozImport() {
  await sahifaRuxsati('mijoz.yarat');
  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div>
        <Link href="/mijoz" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Mijozlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Mijozlarni import qilish
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Birinchi qator — sarlavha. Tanilgan ustunlar: Ism (majburiy), Telefon, Manzil,
          Tashkilot, INN, Qarz limiti, To&apos;lov muddati, Manba, Izoh. Har qator oddiy «Mijoz
          qo&apos;shish» kabi tekshiriladi; bor mijoz qayta yozilmaydi. Qarz import qilinmaydi.
        </p>
      </div>
      <ImportFormasi />
    </div>
  );
}
