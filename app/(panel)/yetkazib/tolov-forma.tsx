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
  const [qarzValyutasi, qarzValyutasiniOzgartir] = useState(
    qarzlar[0]?.valyuta ?? 'SOM',
  );
  /**
   * ⚠️ TZ 9.5 — TO'LOV valyutasi QARZ valyutasidan farq qilishi
   *    mumkin: «Dollar qarzini so'mda to'lash mumkin».
   *
   *    Ilgari bitta tanlov ikkalasini ham bildirardi va shu sabab
   *    dollar qarzini so'mda to'lashning iloji yo'q edi — kurs farqi
   *    (9.6) ham hech qachon tug'ilmasdi (2026-09-03 auditi).
   */
  const [valyuta, valyutaniOzgartir] = useState(qarzlar[0]?.valyuta ?? 'SOM');
  const [summa, summaniOzgartir] = useState('');
  const [kurs, kursniOzgartir] = useState(joriyKurs);

  const mos = kassalar.filter((k) => k.valyuta === valyuta);
  const qarz = qarzlar.find((q) => q.valyuta === qarzValyutasi)?.qarz ?? '0';

  /** 9.5 — so'mda to'lansa qarz `so'm ÷ kurs` bo'yicha kamayadi */
  const krossmi = qarzValyutasi !== valyuta;
  const kursSoni = Number(kurs);
  const yopiladi =
    krossmi && Number(summa) > 0 && Number.isFinite(kursSoni) && kursSoni > 0
      ? (Number(summa) / kursSoni).toFixed(2)
      : null;

  /** Qarzdan ortiq to'lov — avans bo'lib qoladi, bloklanmaydi */
  const ortiq =
    Number(summa) > 0 &&
    Number(yopiladi ?? summa) > Number(qarz);

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

        {/* 9.1 — qarz ikkala valyutada bo'lishi mumkin */}
        <Maydon nom="qarzValyutasi" yorliq="Qaysi qarz">
          <select
            id="qarzValyutasi"
            name="qarzValyutasi"
            value={qarzValyutasi}
            onChange={(e) => {
              qarzValyutasiniOzgartir(e.target.value);
              // To'lov valyutasi odatda qarz bilan bir xil
              valyutaniOzgartir(e.target.value);
            }}
            className={kirishUslubi(false)}
          >
            {qarzlar.map((q) => (
              <option key={q.valyuta} value={q.valyuta}>
                {q.valyuta === 'USD' ? '$ qarz' : "so'm qarz"}
              </option>
            ))}
            {qarzlar.length === 0 && <option value="SOM">so&apos;m qarz</option>}
          </select>
        </Maydon>

        {/* 9.5 — dollar qarzini so'mda to'lash mumkin */}
        <Maydon nom="valyuta" yorliq="Nima bilan to'lanadi">
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
        {(valyuta === 'USD' || krossmi) && (
          <Maydon nom="kurs" yorliq="Kurs" izoh="to'lov shu kursda qotadi (9.6)">
            <input
              id="kurs"
              name="kurs"
              value={kurs}
              onChange={(e) => {
                kursniOzgartir(e.target.value);
              }}
              inputMode="decimal"
              required
              className={kirishUslubi(false)}
            />
          </Maydon>
        )}
      </div>

      {/*
        ⚠️ Sotuvchi qancha qarz yopilishini SAQLASHDAN OLDIN ko'radi:
           kurs adashib yozilsa raqam darrov g'alati chiqadi.
      */}
      {yopiladi !== null && (
        <p className="rounded-maydon bg-fon px-3 py-2 text-[13px] text-matn-ikki">
          Qarzdan <b className="raqam">{yopiladi} $</b> yopiladi (9.5).
          Kurs farqi bo&apos;lsa alohida xarajat bo&apos;lib yoziladi (9.6).
        </p>
      )}

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
