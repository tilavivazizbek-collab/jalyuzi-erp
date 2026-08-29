'use client';

/**
 * «Qoldiqni to'g'rilash» tugmasi — FAQAT ADMIN ko'radi.
 *
 * ⚠️ Tugmani yashirish himoya emas (§9.4) — server tomonda
 *    `ombor.tuzatish` kodi tekshiriladi. Bu yerda yashirilishi
 *    shunchaki: ruxsati yo'q odamga bosib bo'lmaydigan tugma
 *    ko'rsatishning ma'nosi yo'q.
 */

import { useActionState } from 'react';
import { qoldiqTuzatishAmali, type TuzatishHolati } from './tuzatish-amal';

const BOSH: TuzatishHolati = { xato: null };

export function TuzatishTugmasi({ materialId }: { materialId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(
    qoldiqTuzatishAmali.bind(null, materialId),
    BOSH,
  );

  return (
    <form action={yubor} className="inline-flex flex-col items-start gap-1">
      <button
        type="submit"
        disabled={kutilmoqda}
        className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98] disabled:opacity-60"
      >
        {kutilmoqda ? 'Ochilmoqda…' : "Qoldiqni to'g'rilash"}
      </button>

      {holat.xato !== null && (
        <span role="alert" className="text-[12px] text-belgi-qizil">
          {holat.xato}
        </span>
      )}
    </form>
  );
}
