import { redirect } from 'next/navigation';
import { joriyFoydalanuvchi } from '@/lib/kirish/joriy';
import { KirishFormasi } from './forma';
import { BrendBelgisi } from './belgi';

export const dynamic = 'force-dynamic';

export default async function KirishSahifasi() {
  // Kirgan odam kirish sahifasini ko'rmasin
  if ((await joriyFoydalanuvchi()) !== null) redirect('/boshqaruv');

  return (
    <main className="flex min-h-screen flex-col bg-fon">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[380px]">
          {/*
            ⚠️ Brend belgisi va nom — sahifada korxona KIMLIGI
               ko'rinishi kerak. Ilgari faqat matn bor edi va sahifa
               har qanday tizimga o'xshardi.
          */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <BrendBelgisi olcham={44} />
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-matn">
                Jalyuzi ERP
              </h1>
              <p className="mt-1 text-[13px] text-matn-ikki">
                Ishlab chiqarish va savdo boshqaruvi
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-chegara bg-sirt p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <KirishFormasi />
          </div>

        </div>
      </div>

      <footer className="pb-6 text-center text-xs text-matn-kuchsiz">
        Jalyuzi ERP
      </footer>
    </main>
  );
}
