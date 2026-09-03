'use client';

import { useState, useTransition } from 'react';
import { chopEtishniYoz } from './amal';

/**
 * «Chop etish» — brauzerning chop etish oynasini ochadi.
 *
 * ⚠️ Chop etilganda faqat `.chek` bloki qog'ozga tushadi (global.css
 *    dagi `@media print`). Menyu, tugmalar va sarlavha chiqmaydi.
 *
 * ⚠️ Tugmaning o'zi ham chop etilmaydi — u `.chek` dan tashqarida.
 */
export function ChopTugmasi({ buyurtmaId }: { buyurtmaId: number }) {
  const [kutilmoqda, boshla] = useTransition();
  const [yozildi, yozildiOzgartir] = useState(false);

  return (
    <button
      type="button"
      disabled={kutilmoqda}
      onClick={() => {
        /**
         * ⚠️ Jurnal yozuvi chop etishni KUTMAYDI: `window.print()`
         *    brauzerni to'xtatib turadi va server javobi kelguncha
         *    kutilsa, sotuvchi tugmani ikki marta bosardi.
         */
        if (!yozildi) {
          yozildiOzgartir(true);
          boshla(() => {
            void chopEtishniYoz(buyurtmaId);
          });
        }
        window.print();
      }}
      className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
    >
      Chop etish
    </button>
  );
}
