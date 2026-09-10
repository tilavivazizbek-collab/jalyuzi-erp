'use client';

/**
 * ⚠️ IKKI BOSISH. Birinchisi tasdiq so'raydi, ikkinchisi o'chiradi.
 *    `confirm()` ishlatilmaydi — u brauzerni to'xtatib qo'yadi va
 *    telefonda xunuk chiqadi (`ochir-tugma.tsx` bilan bir xil
 *    naqsh).
 */

import { useState, useTransition } from 'react';
import { stavkaniOchirAmali } from './amal';

export function StavkaOchirTugmasi({
  mahsulotTurId,
  filialId,
  xodimId,
  amalQiladiDan,
  nom,
}: {
  mahsulotTurId: number;
  filialId: number | null;
  xodimId: number | null;
  amalQiladiDan: string;
  /** Tasdiq savolida ko'rsatiladi — odam nimani o'chirayotganini bilsin */
  nom: string;
}) {
  const [soralmoqda, soralmoqdaOzgartir] = useState(false);
  const [xato, xatoniOzgartir] = useState<string | null>(null);
  const [kutilmoqda, boshla] = useTransition();

  if (xato !== null) {
    return <span className="text-xs text-belgi-qizil">{xato}</span>;
  }

  if (!soralmoqda) {
    return (
      <button
        type="button"
        onClick={() => {
          soralmoqdaOzgartir(true);
        }}
        className="fokus rounded-[6px] px-2 py-1 text-xs text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
      >
        o&apos;chirish
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      <span className="text-xs text-matn-kuchsiz">{nom}?</span>
      <button
        type="button"
        disabled={kutilmoqda}
        onClick={() => {
          boshla(() => {
            void stavkaniOchirAmali({
              mahsulotTurId,
              filialId,
              xodimId,
              amalQiladiDan,
            }).then((n) => {
              if (n.xato !== null) xatoniOzgartir(n.xato);
            });
          });
        }}
        className="fokus rounded-[6px] bg-belgi-qizil-fon px-2 py-1 text-xs font-medium text-belgi-qizil disabled:opacity-60"
      >
        ha
      </button>
      <button
        type="button"
        onClick={() => {
          soralmoqdaOzgartir(false);
        }}
        className="fokus rounded-[6px] px-2 py-1 text-xs text-matn-kuchsiz"
      >
        yo&apos;q
      </button>
    </span>
  );
}
