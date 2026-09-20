'use client';

import { useState } from 'react';
import { Modal } from '../modal';
import { NarxGuruhFormasi } from '../narx/guruh-forma';

/**
 * «+ Yangi daraja» — modal oynada.
 *
 * ⚠️ Forma `narx/guruh-forma.tsx` da: narx ekranidagi va material
 *    kartochkasidagi modal ham AYNAN shuni ochadi (§2.2).
 */
export function DarajaQoshish() {
  const [ochiq, ochiqniOzgartir] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
      >
        + Yangi daraja
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha="Yangi mato darajasi"
        izoh="Narx jadvali shu darajalar bo‘yicha to‘ldiriladi"
        bolalar={
          <NarxGuruhFormasi
            saqlandi={() => {
              ochiqniOzgartir(false);
            }}
            bekor={() => {
              ochiqniOzgartir(false);
            }}
          />
        }
      />
    </>
  );
}
