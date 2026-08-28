'use client';

import { useState } from 'react';
import { Modal } from '../modal';
import { GuruhFormasi } from '../guruh-forma';

/**
 * «+ Yangi guruh» — modal oynada.
 *
 * ⚠️ Forma `guruh-forma.tsx` da: material va mahsulot ekranlaridagi
 *    modal ham AYNAN shuni ochadi (§2.2).
 */
export function GuruhQoshish() {
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
        + Yangi guruh
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha="Yangi guruh"
        bolalar={
          <GuruhFormasi
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
