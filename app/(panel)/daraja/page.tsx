import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { darajaOchirilganSoni, darajaRoyxati } from './malumot';
import { OchirilganlarHavolasi } from '../ochirilganlar';
import { DarajaRoyxati } from './royxat';
import { DarajaQoshish } from './qoshish';

export const dynamic = 'force-dynamic';

/**
 * Mato darajalari — egasi qarori 2026-09-20.
 *
 * ⚠️ Bu sahifa ILGARI YO'Q edi. Daraja faqat «Narxlar va turlar»
 *    dagi modal orqali yaratilardi, keyin uni tahrirlash ham,
 *    o'chirish ham mumkin emasdi — almashtirish guruhida ham aynan
 *    shu muammo bo'lgan va shu tarzda yechilgan.
 */
export default async function DarajaSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('mahsulot.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'narx.standart.ozgartir');

  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI */
  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';

  const [qatorlar, ochirilganSoni] = await Promise.all([
    darajaRoyxati(ochirilganlar),
    darajaOchirilganSoni(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Narx darajalari
          </h1>
          <p className="mt-0.5 text-[13px] text-matn-ikki">
            Mijoz narxi shu darajalarga qarab hisoblanadi —{' '}
            <Link href="/narx" className="text-brend hover:underline">
              Narxlar va turlar
            </Link>{' '}
            sahifasida
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />
          {ozgartiraOladi && <DarajaQoshish />}
        </div>
      </div>

      {/*
        ⚠️ «Guruh» va «daraja» ni ADASHTIRMASLIK uchun izoh shu yerda
           turadi: ikkalasi ham materialga qo'yiladi va nomlari
           o'xshash, lekin butunlay boshqa savolga javob beradi.
      */}
      <p className="rounded-maydon border border-chegara bg-fon-ikki px-4 py-3 text-[13px] text-matn-ikki">
        <b>Guruh</b> — sotuvda qaysi matolar bir-birini almashtiradi
        («mato dikkey», «turba dikkey»).{' '}
        <b>Daraja</b> — o&apos;sha matolardan qaysi biri qimmat
        («Oddiy», «Premium»). Bitta guruhda har xil darajadagi mato turishi
        mumkin.
      </p>

      <DarajaRoyxati qatorlar={qatorlar} ozgartiraOladi={ozgartiraOladi} />
    </div>
  );
}
