import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { kirimMateriallari, kirimYetkazuvchilari } from '../../malumot';
import { tolovKassalari } from '@/app/(panel)/buyurtma/malumot';
import { KirimFormasi } from '../forma';

export const dynamic = 'force-dynamic';

export default async function YangiKirim() {
  const f = await sahifaRuxsati('ombor.kirim.yarat');
  // §9.4 — tugmani yashirish himoya emas, server amali ham tekshiradi
  const yetkazibQoshaOladi = ruxsatBormi(f, 'yetkazib.yarat');
  const materialQoshaOladi = ruxsatBormi(f, 'material.yarat');

  /**
   * ⚠️ TZ 12.6 — to'lov faqat kassasi bor odamda ko'rinadi.
   *    `kassa.tolov` ruxsati yo'q bo'lsa ro'yxat bo'sh keladi va
   *    to'lov qismi umuman chizilmaydi (§9.4).
   */
  const kassalar = ruxsatBormi(f, 'kassa.tolov')
    ? await tolovKassalari(f.filialId, f.xodimId)
    : [];

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
        kassalar={kassalar}
        materiallar={materiallar}
        yetkazuvchilar={yetkazuvchilar}
        yetkazibQoshaOladi={yetkazibQoshaOladi}
        materialQoshaOladi={materialQoshaOladi}
      />
    </div>
  );
}
