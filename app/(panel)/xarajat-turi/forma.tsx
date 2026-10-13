'use client';

/**
 * Xarajat turi — bitta maydon (nomi). 0066, 2026-10-13.
 * ⚠️ Kassa formasidagi «+ Yangi tur» modal ham, ro'yxat sahifasi ham
 *    shu formani ochadi (§2.2).
 */

import { useActionState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { BekorQilish, useSaqlanganda } from '../modal-forma';
import type { YaratilganYozuv } from '../modal-holat';
import { xarajatTuriYaratAmali } from './amal';
import { BOSH_XARAJAT_TURI_HOLATI, type XarajatTuriHolati } from './holat';

export function XarajatTuriFormasi({
  saqlandi,
  bekor,
}: {
  saqlandi: (y: YaratilganYozuv) => void;
  bekor: () => void;
}) {
  const [holat, yubor, kutilmoqda] = useActionState<XarajatTuriHolati, FormData>(
    xarajatTuriYaratAmali,
    BOSH_XARAJAT_TURI_HOLATI,
  );
  useSaqlanganda(holat.yaratildi, saqlandi);

  return (
    <form action={yubor} className="flex flex-col gap-4">
      {holat.xato !== null && (
        <p role="alert" className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}
      <Maydon nom="xarajatTuriNom" yorliq="Nomi" izoh="foyda-zararda shu nom bilan chiqadi — «Ijara», «Elektr», «Reklama»">
        <input id="xarajatTuriNom" name="nom" required autoFocus maxLength={120} className={kirishUslubi(false)} />
      </Maydon>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        <BekorQilish yol="/xarajat-turi" bekor={bekor} />
      </div>
    </form>
  );
}
