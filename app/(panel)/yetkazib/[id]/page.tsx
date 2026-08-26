import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { yetkazibTahrirlaAmali } from '../amal';
import type { FormaHolati } from '../holat';
import { YetkazibFormasi, type YetkazibQiymatlari } from '../forma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly nom: string;
  readonly nima_yetkazadi: string | null;
  readonly kontakt_shaxs: string | null;
  readonly telefon: string | null;
  readonly qoshimcha_telefon: string | null;
  readonly manzil: string | null;
  readonly bank_nomi: string | null;
  readonly hisob_raqam: string | null;
  readonly inn: string | null;
  readonly mfo: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly valyuta: string;
  readonly eslatma: string | null;
}

const m = (x: string | null): string => x ?? '';

export default async function YetkazibTahrirlash({ params }: { params: Promise<{ id: string }> }) {
  await sahifaRuxsati('yetkazib.ozgartir');

  const { id } = await params;
  const yetkazibId = Number(id);
  if (!Number.isSafeInteger(yetkazibId) || yetkazibId <= 0) notFound();

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT * FROM yetkazib_beruvchi WHERE id = ${yetkazibId}`;
  const y = qatorlar[0];
  if (y === undefined) notFound();

  const qiymatlar: YetkazibQiymatlari = {
    nom: y.nom,
    nimaYetkazadi: m(y.nima_yetkazadi),
    kontaktShaxs: m(y.kontakt_shaxs),
    telefon: m(y.telefon),
    qoshimchaTelefon: m(y.qoshimcha_telefon),
    manzil: m(y.manzil),
    bankNomi: m(y.bank_nomi),
    hisobRaqam: m(y.hisob_raqam),
    inn: m(y.inn),
    mfo: m(y.mfo),
    tolovMuddatiKun: y.tolov_muddati_kun === null ? '' : String(y.tolov_muddati_kun),
    valyuta: y.valyuta,
    eslatma: m(y.eslatma),
  };

  const amal = async (holat: FormaHolati, forma: FormData): Promise<FormaHolati> => {
    'use server';
    return yetkazibTahrirlaAmali(yetkazibId, holat, forma);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/yetkazib" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Yetkazib beruvchilar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">{y.nom}</h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <YetkazibFormasi amal={amal} qiymatlar={qiymatlar} tugmaMatni="O'zgarishlarni saqlash" />
      </div>
    </div>
  );
}
