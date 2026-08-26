import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { tikaOladiganFiliallar } from './malumot';
import { turRoyxati, turTafsili } from '@/lib/amal/katalog';
import { SotuvFormasi } from './forma';

export const dynamic = 'force-dynamic';

export default async function SotuvEkrani() {
  const f = await sahifaRuxsati('buyurtma.yarat');

  /**
   * ⚠️ Avval FAQAT tur nomlari yuklanadi. Tafsilot (slot, mato,
   *    aksessuar) tur tanlangandan keyin keladi — sotuvchi bir
   *    vaqtda bitta tur bilan ishlaydi (3.1).
   *
   *    Ilgari hammasi birdan yuklanardi: ~2 mln obyekt, ~230 MB
   *    JSON va sahifa bir daqiqadan ortiq ochilardi.
   */
  const [turlar, filiallar] = await Promise.all([
    turRoyxati(),
    tikaOladiganFiliallar(),
  ]);

  // Ekran bo'sh ochilmasin — birinchi turning tafsiloti darhol keladi
  const birinchiTur =
    turlar[0] === undefined ? null : await turTafsili(turlar[0].id, f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sotuv</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ekran bitta — boshqa sahifaga o&apos;tish shart emas (3.1). Filial #
          {f.filialId}
        </p>
      </div>

      <SotuvFormasi
        turlar={turlar}
        birinchiTur={birinchiTur}
        filiallar={filiallar}
        ozFilialId={f.filialId}
      />
    </div>
  );
}
