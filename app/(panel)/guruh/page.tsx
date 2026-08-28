import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { guruhOchirilganSoni, guruhRoyxati } from './malumot';
import { OchirilganlarHavolasi } from '../ochirilganlar';
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
export default async function GuruhSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('material.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'material.ozgartir');

  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI */
  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';

  const [qatorlar, ochirilganSoni] = await Promise.all([
    guruhRoyxati(ochirilganlar),
    guruhOchirilganSoni(),
  ]);

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

        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />
          {ozgartiraOladi && <GuruhQoshish />}
        </div>
      </div>

      <GuruhRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </div>
  );
}
