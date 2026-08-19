import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { materialTahrirlaAmali } from '../amal';
import type { FormaHolati } from '../holat';
import { MaterialFormasi, type Guruh, type MaterialQiymatlari } from '../forma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  readonly hisob_turi: string;
  readonly kirim_birligi: string;
  readonly sarflash_birligi: string;
  readonly koeffitsient: string;
  readonly sotuv_narx: string | null;
  readonly sotuv_valyuta: string;
  readonly min_ustama_foiz: string | null;
  readonly yaroqsiz_chegara_m: string | null;
  readonly kam_ishlatiladigan_m: string | null;
  readonly kam_qoldiq_chegara_m: string | null;
  readonly standart_rulon_eni_m: string | null;
  readonly almashtirish_guruh_id: number | null;
  readonly yaxlitlash_qadami: string | null;
}

/** `NUMERIC` bazadan matn bo'lib keladi; bo'sh maydon formada '' bo'ladi. */
const m = (x: string | null): string => x ?? '';

export default async function MaterialTahrirlash({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await sahifaRuxsati('material.ozgartir');

  const { id } = await params;
  const materialId = Number(id);
  if (!Number.isSafeInteger(materialId) || materialId <= 0) notFound();

  const ulanish = ulanishOl();
  const qatorlar = await ulanish<Qator[]>`SELECT * FROM material WHERE id = ${materialId}`;
  const material = qatorlar[0];
  if (material === undefined) notFound();

  const guruhlar = await ulanish<Guruh[]>`
    SELECT id, nom FROM almashtirish_guruh WHERE faol = true ORDER BY nom`;

  const qiymatlar: MaterialQiymatlari = {
    nom: material.nom,
    hisobTuri: material.hisob_turi,
    kirimBirligi: material.kirim_birligi,
    sarflashBirligi: material.sarflash_birligi,
    koeffitsient: material.koeffitsient,
    sotuvNarx: m(material.sotuv_narx),
    sotuvValyuta: material.sotuv_valyuta,
    minUstamaFoiz: m(material.min_ustama_foiz),
    yaroqsizChegaraM: m(material.yaroqsiz_chegara_m),
    kamIshlatiladiganM: m(material.kam_ishlatiladigan_m),
    kamQoldiqChegaraM: m(material.kam_qoldiq_chegara_m),
    standartRulonEniM: m(material.standart_rulon_eni_m),
    almashtirishGuruhId:
      material.almashtirish_guruh_id === null ? '' : String(material.almashtirish_guruh_id),
    yaxlitlashQadami: m(material.yaxlitlash_qadami),
  };

  const amal = async (holat: FormaHolati, forma: FormData): Promise<FormaHolati> => {
    'use server';
    return materialTahrirlaAmali(materialId, holat, forma);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/material" className="text-sm text-slate-500 hover:text-slate-900">
          ← Materiallar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{material.nom}</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <MaterialFormasi
          amal={amal}
          qiymatlar={qiymatlar}
          guruhlar={guruhlar}
          tugmaMatni="O'zgarishlarni saqlash"
        />
      </div>
    </div>
  );
}
