import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { qoshimchaMateriallar, tikaOladiganFiliallar } from './malumot';
import { turRoyxati, turTafsili } from '@/lib/amal/katalog';
import { SotuvFormasi } from './forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { joriyKurs } from '@/lib/amal/kurs';
import { ulanishOl } from '@/lib/db';
import { guruhTanlovlari } from '../../mijoz/guruh/malumot';

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
  const [turlar, filiallar, kurs, qoshimchalar, mijozGuruhlari] = await Promise.all([
    turRoyxati(),
    tikaOladiganFiliallar(),
    // 5.4 — dollardagi material narxini so'mga o'girish uchun
    joriyKurs(ulanishOl()),
    // Alohida sotiladigan buyumlar — mexanizm, kronshteyn
    qoshimchaMateriallar(f.filialId),
    guruhTanlovlari(),
  ]);

  // Ekran bo'sh ochilmasin — birinchi turning tafsiloti darhol keladi
  const birinchiTur = turlar[0] === undefined ? null : await turTafsili(turlar[0].id, f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Yangi buyurtma</h1>
        {/*
          ⚠️ «Filial #1» olib tashlandi — raqam sotuvchiga hech
             narsa aytmaydi. Filial nomi sarlavha qatorida turibdi.
        */}
        <p className="mt-0.5 text-[13px] text-matn-ikki">
          Ekran bitta — boshqa sahifaga o&apos;tish shart emas (3.1)
        </p>
      </div>

      <SotuvFormasi
        turlar={turlar}
        birinchiTur={birinchiTur}
        filiallar={filiallar}
        ozFilialId={f.filialId}
        mijozQoshaOladi={ruxsatBormi(f, 'mijoz.yarat')}
        mijozGuruhlari={mijozGuruhlari}
        joriyKurs={kurs}
        qoshimchalar={qoshimchalar}
      />
    </div>
  );
}
