'use client';

import { useState } from 'react';
import { Modal } from '../modal';
import { XarajatTuriFormasi } from './forma';

/** «+ Yangi tur» — modal oynada; forma kassa formasidagi bilan bitta (§2.2) */
export function XarajatTuriQoshish() {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const yop = (): void => {
    ochiqniOzgartir(false);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98]"
      >
        + Yangi tur
      </button>
      <Modal
        ochiq={ochiq}
        yop={yop}
        sarlavha="Yangi xarajat turi"
        bolalar={<XarajatTuriFormasi saqlandi={yop} bekor={yop} />}
      />
    </>
  );
}
