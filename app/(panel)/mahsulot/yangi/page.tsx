import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { mahsulotYaratAmali } from '../amal';
import { BOSH_QIYMATLAR, MahsulotFormasi } from '../forma';
import { guruhlarniOl, materiallarniOl } from '../malumot';

export const dynamic = 'force-dynamic';

export default async function YangiMahsulot() {
  const f = await sahifaRuxsati('mahsulot.yarat');
  // §9.4 — tugmani yashirish himoya emas, server amali ham tekshiradi
  const guruhQoshaOladi = ruxsatBormi(f, 'material.ozgartir');
  const materialQoshaOladi = ruxsatBormi(f, 'material.yarat');

  const [guruhlar, materiallar] = await Promise.all([guruhlarniOl(), materiallarniOl()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/mahsulot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Turlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Yangi tur
        </h1>
      </div>

      <MahsulotFormasi
        amal={mahsulotYaratAmali}
        qiymatlar={BOSH_QIYMATLAR}
        guruhlar={guruhlar}
        guruhQoshaOladi={guruhQoshaOladi}
        materialQoshaOladi={materialQoshaOladi}
        materiallar={materiallar}
        tugmaMatni="Saqlash"
      />
    </div>
  );
}
