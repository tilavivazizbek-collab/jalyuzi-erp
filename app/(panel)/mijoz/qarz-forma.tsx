'use client';

/**
 * TZ 6.9 — mijoz qarzini to'lash.
 *
 * «Bu KASSA KIRIM OYNASINING BIR TURI, alohida oyna emas. Mijoz
 *  kartochkasidan ochilganda mijoz maydoni oldindan to'ldirilgan holda
 *  chiqadi.»
 *
 * ⚠️ «Bitta operatsiyada BITTA VALYUTA. Mijozda so'm ham, dollar ham
 *    qarz bo'lsa — ikkita alohida yozuv.» Shuning uchun valyuta
 *    tanlanadi va bir yuborishda bitta summa ketadi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { qarzTolashAmali } from './qarz-amal';
import { BOSH_QARZ } from './holat';

export interface QarzKassasi {
  readonly id: number;
  readonly nom: string;
  readonly turi: string;
  readonly valyuta: string;
}

export function QarzTolashFormasi({
  mijozId,
  somQarz,
  dollarQarz,
  kassalar,
}: {
  mijozId: number;
  somQarz: string;
  dollarQarz: string;
  kassalar: readonly QarzKassasi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(qarzTolashAmali, BOSH_QARZ);
  const [valyuta, valyutaniOzgartir] = useState<'SOM' | 'USD'>('SOM');

  const mos = kassalar.filter((k) => k.valyuta === valyuta);
  const qarz = valyuta === 'SOM' ? somQarz : dollarQarz;

  if (kassalar.length === 0) {
    return (
      <p className="rounded-karta bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq ">
        Sizning kassangiz yo&apos;q — to&apos;lov qabul qilib bo&apos;lmaydi (12.2).
      </p>
    );
  }

  return (
    <form action={yubor} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="mijozId" value={mijozId} />
      <input type="hidden" name="valyuta" value={valyuta} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil ">
          To&apos;lov qabul qilindi.
          {holat.qolganQarz !== null && (
            <span className="ml-1">
              Qolgan qarz:{' '}
              <b className="raqam">
                {valyuta === 'SOM'
                  ? pulKorsat(som(holat.qolganQarz))
                  : pulKorsat(dollar(holat.qolganQarz))}
              </b>
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Maydon nom="valyuta-tanlov" yorliq="Valyuta">
          <select
            id="valyuta-tanlov"
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

        <Maydon nom="kassaId" yorliq="Kassa">
          <select
            id="kassaId"
            name="kassaId"
            className={`${kirishUslubi(false)} w-56`}
            disabled={mos.length === 0}
          >
            {mos.map((k) => (
              <option key={k.id} value={k.id}>
                {k.turi === 'KARTA' ? 'Karta (admin kassasi)' : k.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="summa" yorliq="Summa">
          <input
            id="summa"
            name="summa"
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
            placeholder={Number(qarz) > 0 ? qarz : '0'}
          />
        </Maydon>
      </div>

      {mos.length === 0 && (
        <p className="text-xs text-belgi-sariq">Bu valyutada kassangiz yo&apos;q.</p>
      )}

      <p className="raqam text-sm text-matn-ikki">
        Joriy qarz: <b>{valyuta === 'SOM' ? pulKorsat(som(qarz)) : pulKorsat(dollar(qarz))}</b>
      </p>

      <Maydon nom="izoh" yorliq="Izoh" izoh="Ixtiyoriy">
        <input id="izoh" name="izoh" className={kirishUslubi(false)} />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda || mos.length === 0}
        className="self-start rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
      >
        {kutilmoqda ? 'Saqlanmoqda…' : "To'lovni qabul qilish"}
      </button>
    </form>
  );
}
