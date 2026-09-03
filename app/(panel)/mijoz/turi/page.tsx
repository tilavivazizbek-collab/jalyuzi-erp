import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { mijozTuriOchirilganSoni, mijozTuriRoyxati } from '@/lib/amal/mijoz-turi';
import { OchirilganlarHavolasi } from '../../ochirilganlar';
import { TurRoyxati } from './royxat';
import { TurQoshish } from './qoshish';

export const dynamic = 'force-dynamic';

/**
 * `/mijoz/turi` — TZ 6.2 · 14.9
 *
 * ⚠️ NEGA KERAK (egasi, 2026-08-30): mijoz turi endi qat'iy
 *    ikkita qiymat emas — «Optom», «Metrajka» kabi turlarni
 *    admin o'zi qo'shadi va HAR TURGA material narxi alohida
 *    qo'yiladi.
 *
 * ⚠️ Guruh (chegirma) ALOHIDA qoladi — egasi shunday so'radi.
 */
export default async function MijozTuriSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('mijoz.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'mijoz.ozgartir');

  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI */
  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';

  const sql = ulanishOl();
  const [qatorlar, ochirilganSoni] = await Promise.all([
    mijozTuriRoyxati(sql, ochirilganlar),
    mijozTuriOchirilganSoni(sql),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/mijoz" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Mijozlar
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Mijoz turlari
          </h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            Har turga mahsulot narxi alohida qo&apos;yiladi — mahsulot kartochkasida
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />
          {ozgartiraOladi && <TurQoshish />}
        </div>
      </div>

      <TurRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </div>
  );
}
