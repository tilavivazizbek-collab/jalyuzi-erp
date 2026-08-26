'use client';

/**
 * TZ 6.10 — umidsiz qarzni hisobdan chiqarish.
 *
 * ⚠️ «Mijoz keyin kelib to'lasa — pul kassaga "boshqa kirim" sifatida
 *    kiritiladi... lekin BALANSIGA QO'SHILMAYDI, qarz allaqachon
 *    yopilgan.»
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { umidsizQarzAmali } from './qarz-amal';
import { BOSH_UMIDSIZ } from './holat';

export function UmidsizQarzFormasi({
  mijozId,
  somQarz,
  dollarQarz,
}: {
  mijozId: number;
  somQarz: string;
  dollarQarz: string;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(umidsizQarzAmali, BOSH_UMIDSIZ);
  const [valyuta, valyutaniOzgartir] = useState<'SOM' | 'USD'>('SOM');

  const qarz = valyuta === 'SOM' ? somQarz : dollarQarz;

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="self-start text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-belgi-qizil"
      >
        Qarzni hisobdan chiqarish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex max-w-lg flex-col gap-3">
      <input type="hidden" name="mijozId" value={mijozId} />
      <input type="hidden" name="valyuta" value={valyuta} />

      {holat.xato !== null && (
        <p role="alert" className="text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil ">
          Qarz hisobdan chiqarildi.
        </p>
      )}

      <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-xs text-belgi-sariq ">
        Bu <b>haqiqiy xarajat</b>: pul kelmadi, lekin qarz yopiladi va foyda-zararga «umidsiz qarz»
        bo&apos;lib tushadi (12.1). Mijoz keyin kelib to&apos;lasa — pul «boshqa kirim» bo&apos;lib
        kiritiladi, balansga qo&apos;shilmaydi (6.10).
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <Maydon nom="u-valyuta" yorliq="Valyuta">
          <select
            id="u-valyuta"
            value={valyuta}
            onChange={(e) => {
              valyutaniOzgartir(e.target.value === 'USD' ? 'USD' : 'SOM');
            }}
            className={`${kirishUslubi(false)} w-32`}
          >
            <option value="SOM">So&apos;m</option>
            <option value="USD">Dollar</option>
          </select>
        </Maydon>

        <Maydon nom="u-summa" yorliq="Summa">
          <input
            id="u-summa"
            name="summa"
            inputMode="decimal"
            defaultValue={Number(qarz) > 0 ? qarz : ''}
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>
      </div>

      <Maydon nom="u-sabab" yorliq="Sabab (majburiy)">
        <input
          id="u-sabab"
          name="sabab"
          className={kirishUslubi(false)}
          placeholder="Masalan: bir yil qidirildi, aloqa yo'q"
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-belgi-qizil px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-95 disabled:opacity-60"
        >
          {kutilmoqda ? 'Bajarilmoqda…' : 'Hisobdan chiqarish'}
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
