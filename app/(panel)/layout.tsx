import type { ReactNode } from 'react';
import { kirganBolishiShart } from '@/lib/kirish/joriy';
import { chiqishAmali } from './chiqish/amal';

export const dynamic = 'force-dynamic';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="font-semibold tracking-tight">Jalyuzi ERP</span>

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
