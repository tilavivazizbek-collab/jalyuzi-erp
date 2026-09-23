'use client';

/**
 * app/(panel)/narx/guruh-forma.tsx — mato darajasi (egasi qarori 2026-09-20).
 *
 * ⚠️ Darajada BITTA maydon bor — nomi. Shuning uchun unga alohida
 *    sahifa qilinmagan: u narx ekranidagi modal oynada ochiladi.
 *
 * ⚠️ Bu ALMASHTIRISH GURUHI EMAS. Almashtirish guruhi «slotda qaysi
 *    materiallar chiqadi» degan savolga javob beradi, daraja esa —
 *    «ulardan qaysi biri qimmat».
 */

import { useActionState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { BekorQilish, useSaqlanganda } from '../modal-forma';
import { narxGuruhYaratAmali } from './amal';
import { BOSH_GURUH_HOLATI, type GuruhHolati } from '../guruh-holat';
import type { YaratilganYozuv } from '../modal-holat';

export function NarxGuruhFormasi({
  saqlandi,
  bekor,
}: {
  saqlandi: (y: YaratilganYozuv) => void;
  bekor: () => void;
}) {
  const [holat, yubor, kutilmoqda] = useActionState<GuruhHolati, FormData>(
    narxGuruhYaratAmali,
    BOSH_GURUH_HOLATI,
  );

  useSaqlanganda(holat.yaratildi, saqlandi);

  return (
    <form action={yubor} className="flex flex-col gap-4">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      <Maydon
        nom="narxGuruhNom"
        yorliq="Daraja nomi"
        izoh="«Oddiy», «O‘rta», «Premium» — narx jadvalida shu nom chiqadi"
      >
        <input
          id="narxGuruhNom"
          name="nom"
          required
          autoFocus
          className={kirishUslubi(false)}
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        <BekorQilish yol="/narx" bekor={bekor} />
      </div>
    </form>
  );
}
