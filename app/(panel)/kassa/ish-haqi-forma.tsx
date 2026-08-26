'use client';

/**
 * TZ 10.15 — ish haqi va avans to'lovi.
 *
 * ⚠️ «Balansdan ko'p berilsa BLOKLANMAYDI — bu avans hisoblanadi,
 *    balans manfiyga tushadi.» Shuning uchun forma summani balans bilan
 *    solishtirmaydi, faqat joriy balansni ko'rsatadi.
 *
 * ⚠️ TZ 12.1 — bu to'lov XARAJAT EMAS: haq allaqachon «Tugatdim» da
 *    xarajat bo'lgan (10.10).
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { ishHaqiAmali } from './ish-haqi-amal';
import { BOSH_ISH_HAQI } from './holat';

export interface IshHaqiKassasi {
  readonly id: number;
  readonly nom: string;
  readonly turi: string;
  readonly valyuta: string;
}

export function IshHaqiFormasi({
  xodimId,
  somBalans,
  dollarBalans,
  kassalar,
}: {
  xodimId: number;
  somBalans: string;
  dollarBalans: string;
  kassalar: readonly IshHaqiKassasi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(ishHaqiAmali, BOSH_ISH_HAQI);
  const [kassaId, kassaniOzgartir] = useState(String(kassalar[0]?.id ?? ''));
  const [balansValyutasi, balansValyutasiniOzgartir] = useState<'SOM' | 'USD'>('SOM');
  const [summa, summaniOzgartir] = useState('');

  const kassa = kassalar.find((k) => k.id === Number(kassaId));
  const tolovValyutasi = kassa?.valyuta ?? 'SOM';
  const kursKerak = tolovValyutasi !== balansValyutasi;
  const balans = balansValyutasi === 'SOM' ? somBalans : dollarBalans;

  if (kassalar.length === 0) {
    return (
      <p className="rounded-karta bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq ">
        Kassa yo&apos;q — to&apos;lov qilib bo&apos;lmaydi (12.2).
      </p>
    );
  }

  return (
    <form action={yubor} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="xodimId" value={xodimId} />
      <input type="hidden" name="valyuta" value={tolovValyutasi} />
      <input type="hidden" name="balansValyutasi" value={balansValyutasi} />

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
          To&apos;lov saqlandi.
          {holat.balansdan !== null && kursKerak && (
            <span className="ml-1">
              Balansdan <b className="raqam">{holat.balansdan}</b> yechildi (10.5).
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Maydon nom="kassaId" yorliq="Kassa">
          <select
            id="kassaId"
            name="kassaId"
            value={kassaId}
            onChange={(e) => {
              kassaniOzgartir(e.target.value);
            }}
            className={`${kirishUslubi(false)} w-56`}
          >
            {kassalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="balans-valyuta" yorliq="Balans valyutasi">
          <select
            id="balans-valyuta"
            value={balansValyutasi}
            onChange={(e) => {
              balansValyutasiniOzgartir(e.target.value === 'USD' ? 'USD' : 'SOM');
            }}
            className={`${kirishUslubi(false)} w-32`}
          >
            <option value="SOM">So&apos;m</option>
            <option value="USD">Dollar</option>
          </select>
        </Maydon>

        <Maydon nom="summa" yorliq={`Summa (${tolovValyutasi})`}>
          <input
            id="summa"
            name="summa"
            value={summa}
            onChange={(e) => {
              summaniOzgartir(e.target.value);
            }}
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>
      </div>

      {kursKerak && (
        <Maydon
          nom="kurs"
          yorliq="Kurs"
          izoh="To'lov va balans valyutasi har xil — kurs majburiy (10.5)"
        >
          <input
            id="kurs"
            name="kurs"
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
            placeholder="13200"
          />
        </Maydon>
      )}

      <label className="flex items-center gap-2.5 text-sm">
        <input type="checkbox" name="avansmi" value="ha" />
        <span>
          Avans (oy o&apos;rtasida) — balans manfiyga tushishi mumkin, bu bloklanmaydi (10.15)
        </span>
      </label>

      <p className="raqam text-sm text-matn-ikki">
        Joriy balans:{' '}
        <b className={Number(balans) < 0 ? 'text-belgi-qizil' : ''}>
          {balansValyutasi === 'SOM' ? pulKorsat(som(balans)) : pulKorsat(dollar(balans))}
        </b>
      </p>

      <Maydon nom="izoh" yorliq="Izoh" izoh="Ixtiyoriy">
        <input id="izoh" name="izoh" className={kirishUslubi(false)} />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda || summa.trim() === ''}
        className="self-start rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brend-quyuq disabled:opacity-50"
      >
        {kutilmoqda ? 'Saqlanmoqda…' : "To'lash"}
      </button>
    </form>
  );
}
