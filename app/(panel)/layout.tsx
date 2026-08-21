import type { ReactNode } from 'react';
import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import type { RuxsatKod } from '@/lib/ruxsat/kodlar';
import { chiqishAmali } from './chiqish/amal';
import { Menyu, type MenyuBandi } from './menyu';

export const dynamic = 'force-dynamic';

/** Menyu bandi va uni ochadigan ruxsat. */
const BANDLAR: readonly (MenyuBandi & { kod: RuxsatKod | null })[] = [
  { yol: '/boshqaruv', nom: 'Boshqaruv', kod: null },
  { yol: '/sotuv', nom: 'Sotuv', kod: 'buyurtma.yarat' },
  { yol: '/buyurtma', nom: 'Buyurtmalar', kod: 'buyurtma.kor' },
  { yol: '/buyurtma/qayta-kesish', nom: 'Qayta kesish', kod: 'buyurtma.brak' },
  { yol: '/ombor', nom: 'Ombor', kod: 'ombor.qoldiq.kor' },
  { yol: '/ombor/kirim', nom: 'Kirimlar', kod: 'ombor.qoldiq.kor' },
  { yol: '/ombor/inventarizatsiya', nom: 'Inventarizatsiya', kod: 'ombor.inventarizatsiya' },
  { yol: '/kassa', nom: 'Kassa', kod: 'kassa.oz.kor' },
  { yol: '/material', nom: 'Materiallar', kod: 'material.kor' },
  { yol: '/mahsulot', nom: 'Mahsulot turlari', kod: 'mahsulot.kor' },
  { yol: '/mijoz', nom: 'Mijozlar', kod: 'mijoz.kor' },
  { yol: '/yetkazib', nom: 'Yetkazib beruvchilar', kod: 'yetkazib.kor' },
];

/**
 * Himoyalangan qismning qatlami.
 *
 * QISM 1 §9.4 — tekshiruv SERVERDA. Bu qatlam ostidagi har sahifa
 * `kirganBolishiShart()` dan o'tadi; kirmagan odam bu yergacha yetib
 * kelmaydi.
 */
export default async function PanelQatlami({ children }: { children: ReactNode }) {
  const foydalanuvchi = await kirganBolishiShart();
  const rollar = foydalanuvchi.rollar.map((r) => r.nom).join(', ');

  const menyu = BANDLAR.filter(
    (b) => b.kod === null || ruxsatBormi(foydalanuvchi, b.kod),
  ).map(({ yol, nom }) => ({ yol, nom }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold tracking-tight">Jalyuzi ERP</span>
            <Menyu bandlar={menyu} />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">{rollar === '' ? 'rolsiz' : rollar}</span>
            <form action={chiqishAmali}>
              <button
                type="submit"
                className="rounded-md px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Chiqish
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
