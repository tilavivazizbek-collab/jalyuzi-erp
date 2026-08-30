'use client';

import { useActionState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { kursAmali } from './amal';
import { BOSH_KURS_HOLATI } from './holat';

export function KursFormasi({ joriy }: { joriy: string | null }) {
  const [holat, yubor, kutilmoqda] = useActionState(kursAmali, BOSH_KURS_HOLATI);

  return (
    <form
      /**
       * ⚠️ Saqlangach forma qayta chiziladi (React 19) va katak
       *    tozalanadi. Bu yerda shu TO'G'RI: kurs saqlandi, endi
       *    ekranda «Bugungi kurs» yangi raqam bilan turadi.
       */
      action={yubor}
      className="flex max-w-md flex-col gap-4"
    >
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      {holat.saqlandi && holat.xato === null && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">
          Kurs saqlandi — endi hamma ekranda shu kurs ishlatiladi.
        </p>
      )}

      <Maydon
        nom="qiymat"
        yorliq="Bugungi kurs"
        izoh={joriy === null ? 'hali belgilanmagan' : `hozir: ${joriy}`}
      >
        <input
          id="qiymat"
          name="qiymat"
          inputMode="decimal"
          required
          defaultValue={joriy ?? ''}
          placeholder="masalan 12800"
          className={kirishUslubi(holat.xato !== null)}
        />
      </Maydon>

      <div>
        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Kursni belgilash'}
        </button>
      </div>
    </form>
  );
}
