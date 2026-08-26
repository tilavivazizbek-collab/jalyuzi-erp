import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { KirimFormasi, type MaterialTanlovi, type YetkazibTanlovi } from '../forma';

export const dynamic = 'force-dynamic';

export default async function YangiKirim() {
  await sahifaRuxsati('ombor.kirim.yarat');

  const ulanish = ulanishOl();

  const [materiallar, yetkazuvchilar] = await Promise.all([
    ulanish<
      { id: number; nom: string; hisob_turi: string; kirim_birligi: string }[]
    >`SELECT id, nom, hisob_turi, kirim_birligi FROM material
      WHERE faol = true ORDER BY nom`,
    ulanish<
      { id: number; nom: string; tolov_muddati_kun: number | null; valyuta: string }[]
    >`SELECT id, nom, tolov_muddati_kun, valyuta FROM yetkazib_beruvchi
      WHERE faol = true ORDER BY nom`,
  ]);

  const m: MaterialTanlovi[] = materiallar.map((x) => ({
    id: x.id,
    nom: x.nom,
    hisobTuri: x.hisob_turi,
    kirimBirligi: x.kirim_birligi,
  }));

  const y: YetkazibTanlovi[] = yetkazuvchilar.map((x) => ({
    id: x.id,
    nom: x.nom,
    tolovMuddatiKun: x.tolov_muddati_kun,
    valyuta: x.valyuta,
  }));

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

      <KirimFormasi materiallar={m} yetkazuvchilar={y} />
    </div>
  );
}
