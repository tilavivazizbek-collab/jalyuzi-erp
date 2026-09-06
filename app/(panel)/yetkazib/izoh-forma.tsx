'use client';

/** TZ 9.7 — izoh qo'shish. Qo'shilgach ro'yxat yangilanadi. */

import { useActionState } from 'react';
import { izohQoshAmali } from './izoh-amal';
import { BOSH_IZOH } from './izoh-holat';
import { kirishUslubi } from '../maydon';

export function IzohFormasi({ yetkazibBeruvchiId }: { yetkazibBeruvchiId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(
    izohQoshAmali.bind(null, yetkazibBeruvchiId),
    BOSH_IZOH,
  );

  return (
    <form action={yubor} className="flex flex-col gap-2">
      {holat.xato !== null && (
        <p role="alert" className="text-[13px] text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      <textarea
        name="matn"
        rows={2}
        placeholder="Masalan: narxni ko'tardi, keyingi safar boshqasidan olamiz"
        className={`${kirishUslubi(false)} resize-y`}
      />

      <button
        type="submit"
        disabled={kutilmoqda}
        className="fokus self-start rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-60"
      >
        {kutilmoqda ? 'Saqlanmoqda…' : "Izoh qo'shish"}
      </button>
    </form>
  );
}
