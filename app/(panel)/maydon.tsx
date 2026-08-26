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
      <span className="text-sm font-medium text-matn-ikki">{yorliq}</span>
      {children}
      {xato !== undefined ? (
        <span className="text-xs text-belgi-qizil">{xato}</span>
      ) : izoh !== undefined ? (
        <span className="text-xs text-matn-kuchsiz">{izoh}</span>
      ) : null}
    </label>
  );
}

/** Barcha forma maydoni uchun bir xil ko'rinish. */
export const KIRISH_USLUBI =
  'w-full rounded-maydon border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25';

/** Xato bo'lsa chegara qizaradi. */
export function kirishUslubi(xatoBormi: boolean): string {
  return `${KIRISH_USLUBI} ${xatoBormi ? 'border-belgi-qizil' : 'border-chegara-quyuq'}`;
}
