import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { kassaQoldiqlari } from '../malumot';
import { AyirboshlashFormasi, QoldaHodisaFormasi, XarajatFormasi } from '../qolda-forma';

export const dynamic = 'force-dynamic';

export default async function KassaAmallariSahifasi() {
  const f = await sahifaRuxsati('kassa.oz.kor');
  const adminmi = ruxsatBormi(f, 'kassa.barcha.kor');

  const kassalar = await kassaQoldiqlari(f.filialId, f.xodimId, adminmi);
  const royxat = kassalar.map((k) => ({
    id: k.id,
    nom: k.nom,
    turi: k.turi,
    valyuta: k.valyuta,
    xodimId: k.xodimId,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/kassa" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kassa
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Kassa amallari
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Qo&apos;lda kiritiladigan hodisalar. Har biri kassa kitobida «qo&apos;lda» belgisi bilan
          ko&apos;rinadi (12.3).
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Operatsion xarajat</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Ijara, kommunal, internet, yoqilg&apos;i, ta&apos;mirlash, reklama… Bu{' '}
          <b>haqiqiy xarajat</b>: kassadan ham chiqadi, foyda-zararga ham tushadi (12.10).
        </p>
        <XarajatFormasi kassalar={royxat} />
      </section>

      {adminmi && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-matn-ikki">Ayirboshlash</h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Valyuta yoki shakl almashtirish — faqat admin (12.9).
          </p>
          <AyirboshlashFormasi kassalar={royxat} />
        </section>
      )}

      <section>
        <h2 className="mb-1 text-sm font-medium text-matn-ikki">Boshqa kirim va chiqim</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Ro&apos;yxatga tushmagan hodisalar — izoh majburiy (12.5, 12.6).
        </p>
        <QoldaHodisaFormasi kassalar={royxat} adminmi={adminmi} />
      </section>
    </div>
  );
}
