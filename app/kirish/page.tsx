import { redirect } from 'next/navigation';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { KirishFormasi } from './forma';

export const dynamic = 'force-dynamic';

export default async function KirishSahifasi() {
  // Kirgan odam kirish sahifasini ko'rmasin
  if ((await joriyFoydalanuvchi()) !== null) redirect('/boshqaruv');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Jalyuzi ERP</h1>
          <p className="mt-1 text-sm text-slate-500">Tizimga kirish</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <KirishFormasi />
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
          Usta saytga kirmaydi — Telegram botdan foydalanadi.
          <br />
          Parolni unutsangiz adminga murojaat qiling.
        </p>
      </div>
    </main>
  );
}
