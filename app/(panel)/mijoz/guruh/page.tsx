import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { OchirilganlarHavolasi } from '../../ochirilganlar';
import { mijozGuruhOchirilganSoni, mijozGuruhRoyxati } from './malumot';
import { MijozGuruhRoyxati } from './royxat';
import { MijozGuruhQoshish } from './qoshish';

export const dynamic = 'force-dynamic';

/**
 * `/mijoz/guruh` — TZ 6.3
 *
 * ⚠️ NEGA KERAK (egasi, 2026-08-29): «chegirma uchun: ulgurji,
 *    doimiy, VIP». Ilgari chegirma har mijozning kartochkasida
 *    alohida turardi — ulgurjichilarga −10% berish uchun yuzta
 *    kartochkani qo'lda o'zgartirish kerak edi.
 */
export default async function MijozGuruhSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('mijoz.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'mijoz.ozgartir');

  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI */
  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';

  const [qatorlar, ochirilganSoni] = await Promise.all([
    mijozGuruhRoyxati(ochirilganlar),
    mijozGuruhOchirilganSoni(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/mijoz" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Mijozlar
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Mijoz guruhlari
          </h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            Guruh chegirmasi shu guruhdagi barcha mijozga qo&apos;llanadi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />
          {ozgartiraOladi && <MijozGuruhQoshish />}
        </div>
      </div>

      <MijozGuruhRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </div>
  );
}
