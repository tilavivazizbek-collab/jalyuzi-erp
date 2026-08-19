'use client';

import type { ReactNode } from 'react';

/**
 * Forma maydoni — yorliq, kirish maydoni, izoh yoki xato.
 *
 * Uch modulda bir xil yozilgan edi (§2.2). Xato bo'lsa izoh o'rniga
 * xato ko'rsatiladi: ikkalasi birga chiqsa foydalanuvchi qaysi biriga
 * qarashni bilmaydi.
 */
export function Maydon({
  nom,
  yorliq,
  izoh,
  xato,
  children,
}: {
  nom: string;
  yorliq: string;
  izoh?: string;
  xato?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={nom}>
      <span className="text-sm font-medium text-slate-700">{yorliq}</span>
      {children}
      {xato !== undefined ? (
        <span className="text-xs text-red-700">{xato}</span>
      ) : izoh !== undefined ? (
        <span className="text-xs text-slate-500">{izoh}</span>
      ) : null}
    </label>
  );
}

/** Barcha forma maydoni uchun bir xil ko'rinish. */
export const KIRISH_USLUBI =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10';

/** Xato bo'lsa chegara qizaradi. */
export function kirishUslubi(xatoBormi: boolean): string {
  return `${KIRISH_USLUBI} ${xatoBormi ? 'border-red-400' : 'border-slate-300'}`;
}
