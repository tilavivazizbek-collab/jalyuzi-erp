import Link from 'next/link';
import { kirganBolishiShart, sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { guruhOchirilganSoni, guruhRoyxati } from './malumot';
import { OchirilganlarHavolasi } from '../ochirilganlar';
import { GuruhRoyxati } from './royxat';
import { GuruhQoshish } from './qoshish';
import { mijozGuruhOchirilganSoni, mijozGuruhRoyxati } from '../mijoz/guruh/malumot';
import { MijozGuruhRoyxati } from '../mijoz/guruh/royxat';
import { MijozGuruhQoshish } from '../mijoz/guruh/qoshish';

export const dynamic = 'force-dynamic';

/**
 * Guruhlar — BITTA sahifada (egasi, QAMROV «5-qadam», 2026-10-14).
 *
 * Ikki xil guruh, ikki tab:
 *   · Mahsulot guruhlari — TZ 5.6 almashtirish: sotuvda mato tanlanganda
 *     shu guruhdagi variantlar chiqadi;
 *   · Mijoz guruhlari — TZ 6.3 chegirma: guruh chegirmasi shu guruhdagi
 *     barcha mijozga qo'llanadi.
 *
 * ⚠️ Har tab O'Z ruxsati bilan (material.kor / mijoz.kor) — sotuvchi
 *    mijoz guruhini ko'radi, material guruhini ko'rmasligi mumkin.
 *    Komponentlar va amallar o'z joyida qoldi (§2.2) — faqat sahifa bitta.
 * ⚠️ Eski `/mijoz/guruh` shu yerga (`?tur=mijoz`) yo'naltiriladi.
 */

type Tur = 'material' | 'mijoz';

export default async function GuruhlarSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await kirganBolishiShart();
  const materialKor = ruxsatBormi(f, 'material.kor');
  const mijozKor = ruxsatBormi(f, 'mijoz.kor');
  // Ikkalasi ham yo'q — odatdagi «ruxsat yo'q» sahifasi
  if (!materialKor && !mijozKor) await sahifaRuxsati('material.kor');

  const sp = await searchParams;
  const sorandi: Tur = sp['tur'] === 'mijoz' ? 'mijoz' : 'material';
  const tur: Tur = sorandi === 'mijoz' ? (mijozKor ? 'mijoz' : 'material') : materialKor ? 'material' : 'mijoz';
  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI */
  const ochirilganlar = sp['ochirilgan'] === '1';

  const tablar: readonly { kod: Tur; nom: string; bor: boolean }[] = [
    { kod: 'material', nom: 'Mahsulot guruhlari', bor: materialKor },
    { kod: 'mijoz', nom: 'Mijoz guruhlari', bor: mijozKor },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Guruhlar</h1>
        <p className="mt-0.5 text-[13px] text-matn-ikki">
          {tur === 'material'
            ? 'Sotuvda mato tanlanganda shu guruhdagi variantlar chiqadi'
            : 'Guruh chegirmasi shu guruhdagi barcha mijozga qo‘llanadi'}
        </p>
      </div>

      <nav className="flex gap-2" aria-label="Guruh turi">
        {tablar
          .filter((t) => t.bor)
          .map((t) => (
            <Link
              key={t.kod}
              href={`/guruh?tur=${t.kod}`}
              aria-current={t.kod === tur ? 'page' : undefined}
              className={`fokus rounded-maydon border px-3 py-1.5 text-[13px] transition-colors ${
                t.kod === tur
                  ? 'border-brend bg-brend text-tugma-matn'
                  : 'border-chegara bg-sirt text-matn-ikki hover:text-matn'
              }`}
            >
              {t.nom}
            </Link>
          ))}
      </nav>

      {tur === 'material' ? (
        <MaterialGuruhlari ochirilganlar={ochirilganlar} ozgartiraOladi={ruxsatBormi(f, 'material.ozgartir')} />
      ) : (
        <MijozGuruhlari ochirilganlar={ochirilganlar} ozgartiraOladi={ruxsatBormi(f, 'mijoz.ozgartir')} />
      )}
    </div>
  );
}

async function MaterialGuruhlari({ ochirilganlar, ozgartiraOladi }: { ochirilganlar: boolean; ozgartiraOladi: boolean }) {
  const [qatorlar, ochirilganSoni] = await Promise.all([guruhRoyxati(ochirilganlar), guruhOchirilganSoni()]);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-3">
        <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />
        {ozgartiraOladi && <GuruhQoshish />}
      </div>
      <GuruhRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </section>
  );
}

async function MijozGuruhlari({ ochirilganlar, ozgartiraOladi }: { ochirilganlar: boolean; ozgartiraOladi: boolean }) {
  const [qatorlar, ochirilganSoni] = await Promise.all([
    mijozGuruhRoyxati(ochirilganlar),
    mijozGuruhOchirilganSoni(),
  ]);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-3">
        <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />
        {ozgartiraOladi && <MijozGuruhQoshish />}
      </div>
      <MijozGuruhRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </section>
  );
}
