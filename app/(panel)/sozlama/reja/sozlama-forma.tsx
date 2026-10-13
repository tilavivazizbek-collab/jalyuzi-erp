'use client';

/** TZ 21.10 — reja bajarilishi chegaralari va oylik xabar. 2026-10-13 */

import { useActionState } from 'react';
import { enterYuborilmasin } from '../../forma-yordamchi';
import { kirishUslubi } from '../../maydon';
import { rejaSozlamaAmali } from './amal';
import { BOSH_REJA_HOLATI } from './holat';

export function RejaSozlamaFormasi(k: { readonly past: number; readonly yaxshi: number; readonly oylikXabar: boolean }) {
  const [holat, yubor, kutilmoqda] = useActionState(rejaSozlamaAmali, BOSH_REJA_HOLATI);
  return (
    <form
      action={yubor}
      onKeyDown={enterYuborilmasin}
      className="flex flex-col gap-3 rounded-karta border border-chegara bg-sirt px-5 py-4"
    >
      <h2 className="text-sm font-medium text-matn">Bajarilish ranglari va oylik xabar</h2>
      {holat.xato !== null && (
        <p role="alert" className="rounded-maydon bg-belgi-qizil-fon px-3 py-2 text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}
      {holat.xabar !== null && holat.xato === null && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2 text-sm text-belgi-yashil">{holat.xabar}</p>
      )}
      <div key={String(holat.urinish)} className="flex flex-wrap items-end gap-4 text-sm text-matn-ikki">
        <label className="flex flex-col gap-1">
          🔴 undan past, %
          <input name="past" defaultValue={k.past} inputMode="numeric" className={`${kirishUslubi(false)} w-24`} />
        </label>
        <label className="flex flex-col gap-1">
          🟢 shundan yuqori, %
          <input name="yaxshi" defaultValue={k.yaxshi} inputMode="numeric" className={`${kirishUslubi(false)} w-24`} />
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input type="checkbox" name="oylik" value="ha" defaultChecked={k.oylikXabar} />
          Har oyning 1-kuni Telegramga oylik yakun
        </label>
        <button
          disabled={kutilmoqda}
          className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm text-matn-ikki hover:bg-fon disabled:opacity-60"
        >
          Saqlash
        </button>
      </div>
    </form>
  );
}
