'use client';

/**
 * TZ 12.7 · 12.15 — kassa amallari.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { stornoAmali, topshiriqQabulAmali } from './amal';
import { BOSH_HOLAT } from './holat';

/** TZ 12.15 — sabab majburiy, teskari yozuv qo'shiladi. */
export function StornoTugmasi({ yozuvId }: { yozuvId: number }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(stornoAmali, BOSH_HOLAT);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-belgi-qizil"
      >
        Storno
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="yozuvId" value={yozuvId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-belgi-qizil">
          {holat.xato}
        </span>
      )}

      <Maydon nom={`storno-${String(yozuvId)}`} yorliq="Storno sababi">
        <input
          id={`storno-${String(yozuvId)}`}
          name="sabab"
          className={`${kirishUslubi(false)} w-56`}
          placeholder="Masalan: summa xato kiritilgan"
        />
      </Maydon>

      <p className="text-xs text-matn-kuchsiz">
        Eski yozuv o&apos;chirilmaydi — teskari yozuv qo&apos;shiladi (§6.5).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-belgi-qizil px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-95 disabled:opacity-60"
        >
          {kutilmoqda ? 'Bajarilmoqda…' : 'Storno qilish'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-matn-kuchsiz hover:text-matn"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}

/** TZ 12.7 · 12.4 — pul QABULDA ko'chadi. */
export function TopshiriqQabulTugmasi({ topshiriqId }: { topshiriqId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(topshiriqQabulAmali, BOSH_HOLAT);

  return (
    <form action={yubor} className="flex items-center justify-end gap-2">
      <input type="hidden" name="topshiriqId" value={topshiriqId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-belgi-qizil">
          {holat.xato}
        </span>
      )}

      <button
        type="submit"
        disabled={kutilmoqda}
        className="rounded-maydon bg-brend px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brend-quyuq disabled:opacity-60"
      >
        {kutilmoqda ? 'Qabul qilinmoqda…' : 'Qabul qilish'}
      </button>
    </form>
  );
}
