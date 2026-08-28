import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { guruhRoyxati } from './malumot';
import { GuruhRoyxati } from './royxat';
import { GuruhQoshish } from './qoshish';

export const dynamic = 'force-dynamic';

/**
 * TZ 5.6 — almashtirish guruhlari.
 *
 * ⚠️ Bu sahifa ILGARI YO'Q edi. Guruh faqat material
 *    kartochkasidagi modal orqali yaratilardi, keyin uni
 *    tahrirlash ham, o'chirish ham mumkin emasdi.
 */
export default async function GuruhSahifasi() {
  const f = await sahifaRuxsati('material.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'material.ozgartir');

  const qatorlar = await guruhRoyxati();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Guruhlar
          </h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            Sotuvda mato tanlanganda shu guruhdagi variantlar chiqadi
          </p>
        </div>

        {ozgartiraOladi && <GuruhQoshish />}
      </div>

      <GuruhRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </div>
  );
}
