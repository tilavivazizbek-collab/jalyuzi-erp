import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { mijozTahrirlaAmali } from '../amal';
import type { MijozHolati } from '../holat';
import { MijozFormasi, type MijozQiymatlari } from '../forma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly manzil: string | null;
  readonly eslatma: string | null;
  readonly offset_turi: string | null;
  readonly offset_qiymat: string | null;
  readonly qarz_limiti: string | null;
  readonly shaxs_turi: string;
  readonly tashkilot_nomi: string | null;
  readonly inn: string | null;
  readonly yuridik_manzil: string | null;
  readonly bank_nomi: string | null;
  readonly hisob_raqam: string | null;
  readonly mfo: string | null;
  readonly shartnoma_raqam: string | null;
  readonly nds_stavka: string | null;
}

const m = (x: string | null): string => x ?? '';

export default async function MijozTahrirlash({ params }: { params: Promise<{ id: string }> }) {
  await sahifaRuxsati('mijoz.ozgartir');

  const { id } = await params;
  const mijozId = Number(id);
  if (!Number.isSafeInteger(mijozId) || mijozId <= 0) notFound();

  const qatorlar = await ulanishOl()<Qator[]>`SELECT * FROM mijoz WHERE id = ${mijozId}`;
  const mijoz = qatorlar[0];
  if (mijoz === undefined) notFound();

  const qiymatlar: MijozQiymatlari = {
    ism: mijoz.ism,
    telefon: m(mijoz.telefon),
    manzil: m(mijoz.manzil),
    eslatma: m(mijoz.eslatma),
    offsetTuri: m(mijoz.offset_turi),
    offsetQiymat: m(mijoz.offset_qiymat),
    qarzLimiti: m(mijoz.qarz_limiti),
    shaxsTuri: mijoz.shaxs_turi,
    tashkilotNomi: m(mijoz.tashkilot_nomi),
    inn: m(mijoz.inn),
    yuridikManzil: m(mijoz.yuridik_manzil),
    bankNomi: m(mijoz.bank_nomi),
    hisobRaqam: m(mijoz.hisob_raqam),
    mfo: m(mijoz.mfo),
    shartnomaRaqam: m(mijoz.shartnoma_raqam),
    ndsStavka: m(mijoz.nds_stavka),
  };

  const amal = async (holat: MijozHolati, forma: FormData): Promise<MijozHolati> => {
    'use server';
    return mijozTahrirlaAmali(mijozId, holat, forma);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/mijoz" className="text-sm text-slate-500 hover:text-slate-900">
          ← Mijozlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{mijoz.ism}</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <MijozFormasi amal={amal} qiymatlar={qiymatlar} tugmaMatni="O'zgarishlarni saqlash" />
      </div>
    </div>
  );
}
