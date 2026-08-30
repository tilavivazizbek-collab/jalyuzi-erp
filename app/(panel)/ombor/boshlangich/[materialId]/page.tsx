import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import { boshlangichBormi, materialSarlavhasi } from '../../malumot';
import { BoshlangichFormasi } from '../forma';

export const dynamic = 'force-dynamic';

export default async function BoshlangichSahifasi({
  params,
  searchParams,
}: {
  params: Promise<{ materialId: string }>;
  searchParams: Promise<{ yangi?: string }>;
}) {
  const f = await sahifaRuxsati('ombor.boshlangich');

  const { materialId } = await params;
  const id = Number(materialId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const m = await materialSarlavhasi(id);
  if (m === null) notFound();

  const bor = await boshlangichBormi(id, f.filialId);

  /** Mahsulot endi qo'shildi va bu yerga o'zi keldi */
  const yangi = (await searchParams).yangi === '1';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={yangi ? '/material' : `/ombor/${String(id)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          ← {yangi ? 'Mahsulotlar' : m.nom}
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Boshlang&apos;ich qoldiq
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {yangi ? (
            <>
              <b>{m.nom}</b> saqlandi. Omborda hozir zahirasi bormi? Bo&apos;lsa shu yerda
              kiriting — aks holda qoldiq nol bo&apos;lib turadi va sotuvda
              &laquo;material yetmadi&raquo; chiqadi.
            </>
          ) : (
            <>
              Tizimga o&apos;tishda omborda turgan material harakat bo&apos;lib yoziladi — aks
              holda balans nolga teng chiqadi.
            </>
          )}
        </p>
      </div>

      {bor ? (
        <p className="max-w-xl rounded-karta bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq ">
          <b>{m.nom}</b> uchun boshlang&apos;ich qoldiq allaqachon kiritilgan. Ikkinchi marta
          kiritilmaydi — qoldiq ikki barobar bo&apos;lib ketardi. Tuzatish kerak bo&apos;lsa
          inventarizatsiya o&apos;tkazing.
        </p>
      ) : (
        <BoshlangichFormasi
          materialId={id}
          materialNomi={m.nom}
          rulon={m.hisobTuri === 'RULON'}
          birlikNomi={
            SARFLASH_BIRLIGI_NOMI[m.sarflashBirligi as SarflashBirligi] ?? m.sarflashBirligi
          }
          yangiMahsulot={yangi}
          boshEni={m.odatdagiEniM ?? ''}
          boshBoyi={m.odatdagiBoyiM ?? ''}
          smda={m.sarflashBirligi === 'SM'}
        />
      )}
    </div>
  );
}
