import Link from 'next/link';
import { RUXSATLAR, ruxsatKodmi } from '@/lib/ruxsat/kodlar';

export const dynamic = 'force-dynamic';

/**
 * Ruxsat yetmaganda ko'rinadigan sahifa.
 *
 * Xodim buzilgan tizim emas, TUSHUNARLI XABAR ko'rishi kerak: nima
 * yetishmayotgani va kimga murojaat qilishi.
 */
export default async function RuxsatYoq({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string }>;
}) {
  const { kod } = await searchParams;
  const nom = kod !== undefined && ruxsatKodmi(kod) ? RUXSATLAR[kod].nom : null;

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Bu bo&apos;limga ruxsatingiz yo&apos;q</h1>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {nom === null ? (
          <>Bu amalni bajarish uchun huquqingiz yetmaydi.</>
        ) : (
          <>
            Kerakli ruxsat: <b>{nom}</b>
          </>
        )}
        <br />
        Kerak bo&apos;lsa administrator ruxsatlar matritsasidan qo&apos;shib beradi.
      </p>

      <Link
        href="/boshqaruv"
        className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Boshqaruvga qaytish
      </Link>
    </div>
  );
}
