'use client';

/**
 * TZ 8.6 · 8.8 — pozitsiya ustidagi amallar.
 *
 * ⚠️ Ikkalasida ham SABAB majburiy va u audit jurnalida qoladi. Bir
 *    bosishda bajarilmaydi: material bo'shashi va ustaning haqqi
 *    o'zgarishi — qaytmas oqibatlar.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { bekorAmali, qaytaribOlishAmali } from './amal';
import { BOSH_AMAL } from './holat';

/** TZ 8.8 — bekor qilish faqat kesishdan oldin. */
export function BekorTugmasi({ pozitsiyaId }: { pozitsiyaId: number }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(bekorAmali, BOSH_AMAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-slate-500 underline underline-offset-2 hover:text-red-700"
      >
        Bekor qilish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-red-700">
          {holat.xato}
        </span>
      )}

      <Maydon nom={`bekor-${String(pozitsiyaId)}`} yorliq="Bekor qilish sababi">
        <input
          id={`bekor-${String(pozitsiyaId)}`}
          name="sabab"
          className={`${kirishUslubi(false)} w-64`}
          placeholder="Masalan: mijoz voz kechdi"
        />
      </Maydon>

      <p className="text-xs text-slate-500">
        Band qilingan material omborga qaytadi (7.3 · Q-06).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Bekor qilinmoqda…' : 'Ha, bekor qilinsin'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}

/** TZ 8.6 — admin ishni ustadan qaytarib oladi. */
export function QaytaribOlishTugmasi({
  pozitsiyaId,
  ustaIsmi,
}: {
  pozitsiyaId: number;
  ustaIsmi: string | null;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(qaytaribOlishAmali, BOSH_AMAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-900"
      >
        Ishni qaytarib olish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-red-700">
          {holat.xato}
        </span>
      )}

      <p className="text-xs text-slate-600">
        {ustaIsmi ?? 'Usta'} ishning bir qismini bajargan bo&apos;lishi mumkin —
        to&apos;lanadigan summani <b>o&apos;zingiz</b> kiritasiz (8.6).
      </p>

      <Maydon nom={`stavka-${String(pozitsiyaId)}`} yorliq="To'lanadigan summa">
        <input
          id={`stavka-${String(pozitsiyaId)}`}
          name="stavka"
          inputMode="decimal"
          className={`${kirishUslubi(false)} w-40`}
          placeholder="0"
        />
      </Maydon>

      <Maydon nom={`sabab-${String(pozitsiyaId)}`} yorliq="Sabab">
        <input
          id={`sabab-${String(pozitsiyaId)}`}
          name="sabab"
          className={`${kirishUslubi(false)} w-64`}
          placeholder="Masalan: usta aloqaga chiqmayapti"
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Qaytarilmoqda…' : 'Navbatga qaytarish'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}
