import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mahsulotTahrirlaAmali } from '../amal';
import type { KonstruktorHolati } from '../holat';
import {
  MahsulotFormasi,
  type AksessuarQatori,
  type MahsulotQiymatlari,
  type ParametrQatori,
  type SlotQatori,
} from '../forma';
import { guruhlarniOl, materiallarniOl } from '../malumot';

export const dynamic = 'force-dynamic';

export default async function MahsulotTahrirlash({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await sahifaRuxsati('mahsulot.ozgartir');

  const { id } = await params;
  const turId = Number(id);
  if (!Number.isSafeInteger(turId) || turId <= 0) notFound();

  const ulanish = ulanishOl();

  const turlar = await ulanish<
    {
      id: number;
      nom: string;
      xizmat_haqi: string | null;
      tartib: number;
      oynada_korinadi: boolean;
      botda_korinadi: boolean;
    }[]
  >`SELECT id, nom, xizmat_haqi, tartib, oynada_korinadi, botda_korinadi
    FROM mahsulot_tur WHERE id = ${turId}`;
  const tur = turlar[0];
  if (tur === undefined) notFound();

  const [slotlar, parametrlar, aksessuarlar, guruhlar, materiallar] = await Promise.all([
    ulanish<
      { nom: string; formula: string; majburiy: boolean; almashtirish_guruh_id: number | null }[]
    >`SELECT nom, formula, majburiy, almashtirish_guruh_id
      FROM mahsulot_slot WHERE mahsulot_tur_id = ${turId} AND faol = true
      ORDER BY tartib, id`,
    ulanish<
      { kod: string; nom: string; standart_qiymat: string | null }[]
    >`SELECT kod, nom, standart_qiymat FROM mahsulot_parametr
      WHERE mahsulot_tur_id = ${turId} AND faol = true ORDER BY kod`,
    ulanish<
      { material_id: number; formula: string; majburiy: boolean }[]
    >`SELECT material_id, formula, majburiy FROM mahsulot_aksessuar
      WHERE mahsulot_tur_id = ${turId} AND faol = true ORDER BY id`,
    guruhlarniOl(),
    materiallarniOl(),
  ]);

  const qiymatlar: MahsulotQiymatlari = {
    nom: tur.nom,
    xizmatHaqi:
      tur.xizmat_haqi === null || Number(tur.xizmat_haqi) === 0 ? '' : tur.xizmat_haqi,
    tartib: String(tur.tartib),
    oynadaKorinadi: tur.oynada_korinadi,
    botdaKorinadi: tur.botda_korinadi,
    slotlar: slotlar.map(
      (s): SlotQatori => ({
        nom: s.nom,
        formula: s.formula,
        majburiy: s.majburiy,
        almashtirishGuruhId: s.almashtirish_guruh_id,
      }),
    ),
    parametrlar: parametrlar.map(
      (p): ParametrQatori => ({
        kod: p.kod,
        nom: p.nom,
        standartQiymat: p.standart_qiymat ?? '0',
      }),
    ),
    aksessuarlar: aksessuarlar.map(
      (a): AksessuarQatori => ({
        materialId: a.material_id,
        formula: a.formula,
        majburiy: a.majburiy,
      }),
    ),
  };

  const amal = async (
    holat: KonstruktorHolati,
    forma: FormData,
  ): Promise<KonstruktorHolati> => {
    'use server';
    return mahsulotTahrirlaAmali(turId, holat, forma);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/mahsulot" className="text-sm text-slate-500 hover:text-slate-900">
          ← Mahsulot turlari
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{tur.nom}</h1>
        <p className="mt-1 text-xs text-slate-500">
          Tahrirlansa eski buyurtmalar o&apos;zgarmaydi — ular o&apos;z formulasi bilan
          qotib qolgan (4.10, 2.3-invariant).
        </p>
      </div>

      <MahsulotFormasi
        amal={amal}
        qiymatlar={qiymatlar}
        guruhlar={guruhlar}
        materiallar={materiallar}
        tugmaMatni="O'zgarishlarni saqlash"
      />
    </div>
  );
}
