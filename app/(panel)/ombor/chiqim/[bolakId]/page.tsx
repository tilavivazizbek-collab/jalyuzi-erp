import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { chiqimBolagi } from '../../malumot';
import { hisobdanChiqarAmali } from '../amal';
import { ChiqimFormasi } from '../forma';

export const dynamic = 'force-dynamic';

const HOLAT_NOMI: Record<string, string> = {
  BOSH: "bo'sh",
  BAND: 'band',
  YOLDA: "yo'lda",
};

export default async function HisobdanChiqarish({
  params,
}: {
  params: Promise<{ bolakId: string }>;
}) {
  const f = await sahifaRuxsati('ombor.chiqim');

  const { bolakId } = await params;
  const id = Number(bolakId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const bolak = await chiqimBolagi(id, f.filialId);
  if (bolak === null) notFound();

  // Ishlatilgan, brak yoki chiqindi bo'lak ikkinchi marta chiqarilmaydi
  if (HOLAT_NOMI[bolak.holat] === undefined) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Hisobdan chiqarish
        </h1>
        <p className="rounded-karta bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq ">
          <b>{bolak.kod}</b> omborda emas — hozirgi holati «{bolak.holat}». Bunday bo&apos;lak qayta
          chiqarilmaydi.
        </p>
        <Link
          href={`/ombor/${String(bolak.materialId)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          ← Material kartochkasi
        </Link>
      </div>
    );
  }

  const qaytish = `/ombor/${String(bolak.materialId)}`;
  const olcham =
    bolak.eniM !== null && bolak.boyiM !== null
      ? `${bolak.eniM.toFixed(2)} × ${bolak.boyiM.toFixed(2)} m`
      : bolak.miqdor !== null
        ? `${String(bolak.miqdor)} ${bolak.sarflashBirligi === 'SM' ? 'sm' : 'dona'}`
        : '—';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={qaytish} className="text-sm text-matn-kuchsiz hover:text-matn">
          ← {bolak.materialNomi}
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Hisobdan chiqarish
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Omborda buzilgan material (7.10). Yetkazib beruvchi defekti kirimda, ishlab chiqarish
          braki buyurtmada yuritiladi.
        </p>
      </div>

      <ChiqimFormasi
        amal={hisobdanChiqarAmali}
        qaytish={qaytish}
        bolak={{
          id: bolak.id,
          kod: bolak.kod,
          materialNomi: bolak.materialNomi,
          olcham,
          holat: HOLAT_NOMI[bolak.holat] ?? bolak.holat,
          zararMatni: pulKorsat(som(bolak.zarar)),
          kirimRaqam: bolak.kirimRaqam,
        }}
      />
    </div>
  );
}
