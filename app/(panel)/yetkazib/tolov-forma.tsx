'use client';

/**
 * app/(panel)/yetkazib/tolov-forma.tsx — TZ 9 · 12.6
 *
 * Yetkazib beruvchiga to'lov — qarzni yopish uchun.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { yetkazibTolovAmali } from './tolov-amal';
import { BOSH_TOLOV_HOLATI } from './tolov-holat';

export interface TolovKassasi {
  readonly id: number;
  readonly nom: string;
  readonly valyuta: string;
}

export function YetkazibTolovFormasi({
  yetkazibBeruvchiId,
  kassalar,
  qarzlar,
  joriyKurs,
}: {
  yetkazibBeruvchiId: number;
  kassalar: readonly TolovKassasi[];
  /** Valyuta bo'yicha qarz — tugmani bosishdan oldin ko'rinadi */
  qarzlar: readonly { valyuta: string; qarz: string }[];
  joriyKurs: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(
    yetkazibTolovAmali.bind(null, yetkazibBeruvchiId),
    BOSH_TOLOV_HOLATI,
  );

  /**
   * ⚠️ Valyuta TANLANADI, chunki qarz ikkala valyutada bo'lishi
   *    mumkin (9.1). Kassa ro'yxati o'sha valyutaga qarab
   *    filtrlanadi (1.3-invariant).
   */
  const [valyuta, valyutaniOzgartir] = useState(qarzlar[0]?.valyuta ?? 'SOM');
  const [summa, summaniOzgartir] = useState('');

  const mos = kassalar.filter((k) => k.valyuta === valyuta);
  const qarz = qarzlar.find((q) => q.valyuta === valyuta)?.qarz ?? '0';

  /** Qarzdan ortiq to'lov — avans bo'lib qoladi, bloklanmaydi */
  const ortiq = Number(summa) > 0 && Number(summa) > Number(qarz);

  if (kassalar.length === 0) {
    return (
      <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
        Kassa ochilmagan — to&apos;lovni yozib bo&apos;lmaydi. Avval «Kassa»
        bo&apos;limida kassa oching.
      </p>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-4">
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
          To&apos;lov yozildi — kassadan pul chiqdi, qarz kamaydi.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Maydon nom="summa" yorliq="Summa" izoh={`qarz: ${qarz}`}>
          <input
            id="summa"
            name="summa"
            value={summa}
            onChange={(e) => {
              summaniOzgartir(e.target.value);
            }}
            inputMode="decimal"
            required
            className={kirishUslubi(false)}
          />
        </Maydon>

        <Maydon nom="valyuta" yorliq="Valyuta">
          <select
            id="valyuta"
            name="valyuta"
            value={valyuta}
            onChange={(e) => {
              valyutaniOzgartir(e.target.value);
            }}
            className={kirishUslubi(false)}
          >
            <option value="SOM">so&apos;m</option>
            <option value="USD">$</option>
          </select>
        </Maydon>

        <Maydon nom="kassaId" yorliq="Qaysi kassadan">
          <select id="kassaId" name="kassaId" required className={kirishUslubi(false)}>
            <option value="">— tanlang —</option>
            {mos.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nom}
              </option>
            ))}
          </select>
        </Maydon>

        {/*
          ⚠️ 9.6 — dollarli to'lovda kurs QOTADI: keyin kurs
             o'zgarsa ham bu yozuv o'zgarmaydi.
        */}
        {valyuta === 'USD' && (
          <Maydon nom="kurs" yorliq="Kurs" izoh="to'lov shu kursda qotadi (9.6)">
            <input
              id="kurs"
              name="kurs"
              defaultValue={joriyKurs}
              inputMode="decimal"
              required
              className={kirishUslubi(false)}
            />
          </Maydon>
        )}
      </div>

      {mos.length === 0 && (
        <p className="text-[13px] text-belgi-sariq">
          Bu valyutada kassa yo&apos;q — avval o&apos;sha valyutada kassa oching.
        </p>
      )}

      {ortiq && (
        <p className="text-[13px] text-belgi-sariq">
          To&apos;lov qarzdan ortiq — farqi avans bo&apos;lib qoladi.
        </p>
      )}

      <Maydon nom="izoh" yorliq="Izoh" izoh="ixtiyoriy">
        <input id="izoh" name="izoh" className={kirishUslubi(false)} />
      </Maydon>

      <div>
        <button
          type="submit"
          disabled={kutilmoqda || mos.length === 0}
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Yozilmoqda…' : "To'lovni yozish"}
        </button>
      </div>
    </form>
  );
}
