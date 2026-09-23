import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { mahsulotTahrirlaAmali } from '../amal';
import type { KonstruktorHolati } from '../holat';
import {
  MahsulotFormasi,
  type AksessuarQatori,
  type MahsulotQiymatlari,
  type ParametrQatori,
  type SlotQatori,
  type TanlovQatori,
  type OrnatishQatori,
  type VariantQatori,
} from '../forma';
import { guruhlarniOl, materiallarniOl } from '../malumot';

export const dynamic = 'force-dynamic';

export default async function MahsulotTahrirlash({ params }: { params: Promise<{ id: string }> }) {
  const f = await sahifaRuxsati('mahsulot.ozgartir');
  // §9.4 — tugmani yashirish himoya emas, server amali ham tekshiradi
  const guruhQoshaOladi = ruxsatBormi(f, 'material.ozgartir');
  const materialQoshaOladi = ruxsatBormi(f, 'material.yarat');

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
      rasm_bormi: boolean;
      ozgartirildi: string | null;
      min_eni_m: string | null;
      maks_eni_m: string | null;
      min_boyi_m: string | null;
      maks_boyi_m: string | null;
    }[]
  >`SELECT id, nom, xizmat_haqi, tartib, oynada_korinadi, botda_korinadi,
           min_eni_m::text, maks_eni_m::text, min_boyi_m::text, maks_boyi_m::text,
           /* ⚠️ Rasmning O'ZI olinmaydi — u alohida yo'ldan keladi */
           (rasm IS NOT NULL) AS rasm_bormi,
           to_char(ozgartirildi, 'YYYYMMDDHH24MISS') AS ozgartirildi
    FROM mahsulot_tur WHERE id = ${turId}`;
  const tur = turlar[0];
  if (tur === undefined) notFound();

  const [
    slotlar,
    parametrlar,
    aksessuarlar,
    guruhlar,
    materiallar,
    tanlovQatorlari,
    variantQatorlari,
    ornatishQatorlari,
  ] = await Promise.all([
    ulanish<
      { nom: string; formula: string; majburiy: boolean; almashtirish_guruh_id: number | null;
        koeffitsient: string; kesish_turi: string;
        kesim_eni_m: string | null; narx_belgilaydi: boolean }[]
    >`SELECT nom, formula, majburiy, almashtirish_guruh_id, koeffitsient::text,
             kesish_turi, kesim_eni_m::text, narx_belgilaydi
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
    /**
     * TANLOVLAR va VARIANTLAR — 0052.
     *
     * ⚠️ Ikkita alohida so'rov: variantlar tanlov bo'yicha
     *    guruhlanadi. `JOIN` bilan bitta so'rov qilinsa tanlov
     *    qatorlari takrorlanardi va ularni qayta yig'ish kerak
     *    bo'lardi — o'sha ishning o'zi.
     */
    ulanish<
      { id: number; kod: string | null; nom: string; majburiy: boolean }[]
    >`SELECT id, kod, nom, majburiy FROM mahsulot_tanlov
      WHERE mahsulot_tur_id = ${turId} AND faol = true
      ORDER BY tartib, id`,
    ulanish<
      {
        tanlov_id: number;
        nom: string;
        qiymat: string | null;
        narx: string | null;
      }[]
    >`SELECT v.tanlov_id, v.nom, v.qiymat::text, v.narx::text
      FROM mahsulot_tanlov_variant v
      JOIN mahsulot_tanlov t ON t.id = v.tanlov_id
      WHERE t.mahsulot_tur_id = ${turId} AND t.faol = true AND v.faol = true
      ORDER BY v.tartib, v.id`,
    /**
     * O'RNATISH TURLARI — 0053.
     *
     * ⚠️ `::text` — `numeric` postgres.js dan MATN bo'lib keladi
     *    (P-13). `Number()` ni forma o'zi qiladi.
     */
    ulanish<
      {
        nom: string;
        eni_qoshimcha_m: string;
        boyi_qoshimcha_m: string;
        standartmi: boolean;
      }[]
    >`SELECT nom, eni_qoshimcha_m::text, boyi_qoshimcha_m::text, standartmi
      FROM mahsulot_ornatish
      WHERE mahsulot_tur_id = ${turId} AND faol = true
      ORDER BY tartib, id`,
  ]);

  const qiymatlar: MahsulotQiymatlari = {
    nom: tur.nom,
    xizmatHaqi: tur.xizmat_haqi === null || Number(tur.xizmat_haqi) === 0 ? '' : tur.xizmat_haqi,
    /** 0051 — `null` bo'lsa katak BO'SH turadi («chegara yo'q») */
    minEniM: tur.min_eni_m ?? '',
    maksEniM: tur.maks_eni_m ?? '',
    minBoyiM: tur.min_boyi_m ?? '',
    maksBoyiM: tur.maks_boyi_m ?? '',
    tartib: String(tur.tartib),
    oynadaKorinadi: tur.oynada_korinadi,
    botdaKorinadi: tur.botda_korinadi,
    slotlar: slotlar.map((s): SlotQatori => ({
      nom: s.nom,
      formula: s.formula,
      majburiy: s.majburiy,
      almashtirishGuruhId: s.almashtirish_guruh_id,
      koeffitsient: Number(s.koeffitsient),
      kesishTuri: s.kesish_turi === "BO'YIGA" ? ("BO'YIGA" as const) : ('ENIGA' as const),
      /** ⚠️ `null` — qat'iy eni yo'q, formadagi katak BO'SH turadi */
      kesimEniM: s.kesim_eni_m ?? '',
      /** Egasi qarori 2026-09-22 — mijoz narxini shu slot belgilaydimi (0048) */
      narxBelgilaydi: s.narx_belgilaydi,
    })),
    parametrlar: parametrlar.map((p): ParametrQatori => ({
      kod: p.kod,
      nom: p.nom,
      standartQiymat: p.standart_qiymat ?? '0',
    })),
    /** 0053 — oyna o'lchamidan tayyor o'lchamga o'tish qoidalari */
    ornatishlar: ornatishQatorlari.map((o): OrnatishQatori => ({
      nom: o.nom,
      eniQoshimchaM: o.eni_qoshimcha_m,
      boyiQoshimchaM: o.boyi_qoshimcha_m,
      standartmi: o.standartmi,
    })),
    /** 0052 — tanlovlar variantlari bilan birga yig'iladi */
    tanlovlar: tanlovQatorlari.map((t): TanlovQatori => ({
      kod: t.kod ?? '',
      nom: t.nom,
      majburiy: t.majburiy,
      variantlar: variantQatorlari
        .filter((v) => v.tanlov_id === t.id)
        .map((v): VariantQatori => ({
          nom: v.nom,
          /** ⚠️ `null` — katak BO'SH turadi, nol emas */
          qiymat: v.qiymat ?? '',
          narx: v.narx ?? '',
        })),
    })),
    aksessuarlar: aksessuarlar.map((a): AksessuarQatori => ({
      materialId: a.material_id,
      formula: a.formula,
      majburiy: a.majburiy,
    })),
  };

  const amal = async (holat: KonstruktorHolati, forma: FormData): Promise<KonstruktorHolati> => {
    'use server';
    return mahsulotTahrirlaAmali(turId, holat, forma);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/mahsulot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Turlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">{tur.nom}</h1>
        <p className="mt-1 text-xs text-matn-kuchsiz">
          Tahrirlansa eski buyurtmalar o&apos;zgarmaydi — ular o&apos;z formulasi bilan qotib qolgan
          (4.10, 2.3-invariant).
        </p>
      </div>

      <MahsulotFormasi
        amal={amal}
        qiymatlar={qiymatlar}
        guruhlar={guruhlar}
        guruhQoshaOladi={guruhQoshaOladi}
        materialQoshaOladi={materialQoshaOladi}
        materiallar={materiallar}
        tugmaMatni="O'zgarishlarni saqlash"
        rasmManzili={
          tur.rasm_bormi
            ? `/api/rasm/mahsulot/${String(turId)}?v=${tur.ozgartirildi ?? ''}`
            : null
        }
      />
    </div>
  );
}
