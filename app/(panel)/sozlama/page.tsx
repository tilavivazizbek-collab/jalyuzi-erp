import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { korxonaMalumotlari, KALIT_TAVSIFI, KORXONA_KALITLARI } from '@/lib/amal/sozlama';
import { SozlamaFormasi } from './forma';

export const dynamic = 'force-dynamic';

/**
 * `/sozlama` — TZ 14.3
 *
 * Korxona rekvizitlari. Chek, kvitansiya, hisob-kitob varaqasi va ish
 * varaqasi shu yerdan o'qiydi — hech qayerda kodga yozilmaydi.
 */
export default async function SozlamaSahifasi() {
  const f = await sahifaRuxsati('sozlama.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'sozlama.ozgartir');

  const joriy = await korxonaMalumotlari(ulanishOl());

  /** Majburiy maydon to'ldirilmagan bo'lsa chek chala chiqadi — ogohlantiriladi */
  const toldirilmagan = KORXONA_KALITLARI.filter(
    (k) => KALIT_TAVSIFI[k].majburiy && joriy[k] === null,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Korxona ma&apos;lumotlari
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Chekning tepasida chiqadigan ma&apos;lumotlar. O&apos;zgartirsangiz keyingi cheklarda
          darrov yangisi chiqadi — eski cheklar o&apos;zgarmaydi.
        </p>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        {toldirilmagan.length > 0 && (
          <p className="mb-4 rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
            To&apos;ldirilmagan:{' '}
            {toldirilmagan.map((k) => KALIT_TAVSIFI[k].nom.toLowerCase()).join(', ')}. Chek shu
            ma&apos;lumotlarsiz chiqadi.
          </p>
        )}

        {ozgartiraOladi ? (
          <SozlamaFormasi joriy={joriy} />
        ) : (
          <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {KORXONA_KALITLARI.map((k) => (
              <div key={k} className="contents">
                <dt className="text-matn-kuchsiz">{KALIT_TAVSIFI[k].nom}</dt>
                <dd>{joriy[k] ?? <span className="text-matn-kuchsiz">—</span>}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
