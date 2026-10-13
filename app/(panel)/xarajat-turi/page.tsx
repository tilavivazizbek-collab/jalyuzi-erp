import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { xarajatTuriRoyxati } from './malumot';
import { XarajatTuriRoyxati } from './royxat';
import { XarajatTuriQoshish } from './qoshish';

export const dynamic = 'force-dynamic';

/**
 * Xarajat turlari — egasi o'zi qo'shadi (QAMROV «4-qadam», 0066). 2026-10-13.
 *
 * ⚠️ Tur — «Operatsion xarajat» ning ichki bo'linishi. Tizim moddalari
 *    (ish haqi, kurs farqi, kassa farqi…) bu yerda emas — ular hisobot
 *    qoidalariga bog'langan.
 */
export default async function XarajatTurlari() {
  const f = await sahifaRuxsati('sozlama.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'sozlama.ozgartir');
  const qatorlar = await xarajatTuriRoyxati();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Xarajat turlari</h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            Kassadan «Operatsion» xarajat yozilganda tur tanlanadi —{' '}
            <Link href="/hisobot/moliya" className="text-brend hover:underline">
              foyda-zararda
            </Link>{' '}
            operatsion xarajat shu turlar bo&apos;yicha bo&apos;linib ko&apos;rinadi.
          </p>
        </div>
        {ozgartiraOladi && <XarajatTuriQoshish />}
      </div>
      <XarajatTuriRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </div>
  );
}
