import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { kirimMateriallari, kirimYetkazuvchilari } from '../../malumot';
import { KirimFormasi } from '../forma';

export const dynamic = 'force-dynamic';

export default async function YangiKirim() {
  const f = await sahifaRuxsati('ombor.kirim.yarat');
  // §9.4 — tugmani yashirish himoya emas, server amali ham tekshiradi
  const yetkazibQoshaOladi = ruxsatBormi(f, 'yetkazib.yarat');
  const materialQoshaOladi = ruxsatBormi(f, 'material.yarat');

  const [materiallar, yetkazuvchilar] = await Promise.all([
    kirimMateriallari(),
    kirimYetkazuvchilari(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Ombor
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Kirim hujjati
        </h1>
        <p className="mt-1 text-xs text-matn-kuchsiz">
          Kirimda faqat xomashyo kiritiladi — tayyor mahsulot emas, chunki har buyurtma individual
          o&apos;lchamda tayyorlanadi (7.2).
        </p>
      </div>

      <KirimFormasi
        materiallar={materiallar}
        yetkazuvchilar={yetkazuvchilar}
        yetkazibQoshaOladi={yetkazibQoshaOladi}
        materialQoshaOladi={materialQoshaOladi}
      />
    </div>
  );
}
