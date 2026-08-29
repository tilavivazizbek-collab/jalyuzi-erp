'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../../modal';
import { MijozGuruhFormasi } from './forma';

/** «+ Yangi guruh» — modal oynada, ro'yxatni yo'qotmasdan. */
export function MijozGuruhQoshish() {
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
        + Yangi guruh
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha="Yangi mijoz guruhi"
        bolalar={
          <MijozGuruhFormasi
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
