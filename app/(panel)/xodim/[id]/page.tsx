import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { rolRoyxati, xodimFiliallari, xodimniOl } from '../malumot';
import { XodimFormasi } from '../forma';
import { xodimTahrirlaAmali } from '../amal';
import type { XodimHolati } from '../holat';

export const dynamic = 'force-dynamic';

export default async function XodimTahrirlash({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await sahifaRuxsati('xodim.ozgartir');

  const { id } = await params;
  const xodimId = Number(id);
  if (!Number.isSafeInteger(xodimId) || xodimId <= 0) notFound();

  const [xodim, filiallar, rollar] = await Promise.all([
    xodimniOl(xodimId),
    xodimFiliallari(),
    rolRoyxati(),
  ]);

  if (xodim === null) notFound();

  /**
   * ⚠️ Amal `xodimId` ni oldindan biladi — u forma ma'lumotidan
   *    KELMAYDI. Aks holda brauzerdan boshqa raqam yuborib
   *    boshqa xodimni tahrirlash mumkin bo'lardi (§9.4).
   */
  async function amal(holat: XodimHolati, forma: FormData): Promise<XodimHolati> {
    'use server';
    return xodimTahrirlaAmali(xodimId, holat, forma);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/xodim" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Xodimlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          {xodim.ism}
        </h1>
      </div>

      <div className="rounded-karta border border-chegara bg-sirt p-6">
        <XodimFormasi
          amal={amal}
          qiymatlar={{
            ism: xodim.ism,
            telefon: xodim.telefon,
            filialId: String(xodim.filialId),
            ishgaKirdi: xodim.ishgaKirdi ?? '',
            rolIdlar: xodim.rolIdlar,
          }}
          filiallar={filiallar}
          rollar={rollar}
          tugmaMatni="Saqlash"
          tahrirmi
        />
      </div>
    </div>
  );
}
