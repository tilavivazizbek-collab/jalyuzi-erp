'use client';

/**
 * app/(panel)/guruh-forma.tsx — almashtirish guruhi (TZ 5.6).
 *
 * ⚠️ Guruhda BITTA maydon bor — nomi. Shuning uchun unga alohida
 *    sahifa qilinmagan: u faqat modal oynada, material yoki
 *    mahsulot turi kiritilayotganda ochiladi.
 */

import { useActionState } from 'react';
import { Maydon, kirishUslubi } from './maydon';
import { BekorQilish, useSaqlanganda } from './modal-forma';
import { guruhModalYaratAmali } from './tez-amal';
import { BOSH_GURUH_HOLATI, type GuruhHolati } from './guruh-holat';
import type { YaratilganYozuv } from './modal-holat';

export function GuruhFormasi({
  boshNom = '',
  saqlandi,
  bekor,
}: {
  boshNom?: string;
  saqlandi: (y: YaratilganYozuv) => void;
  bekor: () => void;
}) {
  const [holat, yubor, kutilmoqda] = useActionState<GuruhHolati, FormData>(
    guruhModalYaratAmali,
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
        nom="guruhNom"
        yorliq="Nomi"
        izoh="sotuvda shu nom chiqadi — «To'rli matolar» kabi"
      >
        <input
          id="guruhNom"
          name="nom"
          defaultValue={boshNom}
          required
          autoFocus
          className={kirishUslubi(false)}
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        <BekorQilish yol="/material" bekor={bekor} />
      </div>
    </form>
  );
}
