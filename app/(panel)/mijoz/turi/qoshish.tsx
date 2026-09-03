'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../../modal';
import { TurFormasi } from './forma';

/** «+ Yangi tur» — modal oynada, ro'yxatni yo'qotmasdan */
export function TurQoshish() {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
      >
        + Yangi tur
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha="Yangi mijoz turi"
        izoh="Har turga material narxini alohida qo'yish mumkin"
        bolalar={
          <TurFormasi
            saqlandi={() => {
              ochiqniOzgartir(false);
              router.refresh();
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
