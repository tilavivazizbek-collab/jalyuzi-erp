'use client';

/**
 * TZ 8.4 — botdan kelgan pozitsiyani sotuvchi tasdiqlaydi.
 *
 * Tasdiqlangan zahoti material band qilinadi (7.3). Topilmasa pozitsiya
 * «Materialga kutmoqda» ga tushadi va kirim bo'lgach avtomatik qaytadi
 * (8.12) — shuning uchun bu xato emas, xabar.
 */

import { useActionState } from 'react';
import { tasdiqlashAmali } from './amal';
import { BOSH_HOLAT } from './holat';

export function TasdiqlashTugmasi({ pozitsiyaId }: { pozitsiyaId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(tasdiqlashAmali, BOSH_HOLAT);

  return (
    <form action={yubor} className="flex items-center gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-red-700">
          {holat.xato}
        </span>
      )}
      {holat.materialgaKutmoqda && (
        <span className="text-xs text-amber-800">
          material topilmadi — navbatga qaytadi (8.12)
        </span>
      )}

      <button
        type="submit"
        disabled={kutilmoqda}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {kutilmoqda ? 'Tasdiqlanmoqda…' : 'Tasdiqlash'}
      </button>
    </form>
  );
}
