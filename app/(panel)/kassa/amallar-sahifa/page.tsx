import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { kassaQoldiqlari } from '../malumot';
import {
  AyirboshlashFormasi,
  QoldaHodisaFormasi,
  XarajatFormasi,
} from '../qolda-forma';

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
        <Link href="/kassa" className="text-sm text-slate-500 hover:text-slate-900">
          ← Kassa
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Kassa amallari</h1>
        <p className="mt-1 text-sm text-slate-500">
          Qo&apos;lda kiritiladigan hodisalar. Har biri kassa kitobida
          «qo&apos;lda» belgisi bilan ko&apos;rinadi (12.3).
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-medium text-slate-700">
          Operatsion xarajat
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Ijara, kommunal, internet, yoqilg&apos;i, ta&apos;mirlash, reklama…
          Bu <b>haqiqiy xarajat</b>: kassadan ham chiqadi, foyda-zararga ham
          tushadi (12.10).
        </p>
        <XarajatFormasi kassalar={royxat} />
      </section>

      {adminmi && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-slate-700">Ayirboshlash</h2>
          <p className="mb-3 text-xs text-slate-500">
            Valyuta yoki shakl almashtirish — faqat admin (12.9).
          </p>
          <AyirboshlashFormasi kassalar={royxat} />
        </section>
      )}

      <section>
        <h2 className="mb-1 text-sm font-medium text-slate-700">
          Boshqa kirim va chiqim
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Ro&apos;yxatga tushmagan hodisalar — izoh majburiy (12.5, 12.6).
        </p>
        <QoldaHodisaFormasi kassalar={royxat} adminmi={adminmi} />
      </section>
    </div>
  );
}
