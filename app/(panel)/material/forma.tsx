'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { BOSH_HOLAT, type FormaHolati } from './holat';
import {
  HISOB_TURI_NOMI,
  HISOB_TURLARI,
  SARFLASH_BIRLIGI_NOMI,
  SARFLASH_BIRLIKLARI,
  koeffitsientIzohi,
  type SarflashBirligi,
} from '@/lib/sxema/material';

export interface Guruh {
  readonly id: number;
  readonly nom: string;
}

export interface MaterialQiymatlari {
  readonly nom: string;
  readonly hisobTuri: string;
  readonly kirimBirligi: string;
  readonly sarflashBirligi: string;
  readonly koeffitsient: string;
  readonly sotuvNarx: string;
  readonly sotuvValyuta: string;
  readonly minUstamaFoiz: string;
  readonly yaroqsizChegaraM: string;
  readonly kamIshlatiladiganM: string;
  readonly kamQoldiqChegaraM: string;
  readonly standartRulonEniM: string;
  readonly almashtirishGuruhId: string;
  readonly yaxlitlashQadami: string;
}

export const BOSH_QIYMATLAR: MaterialQiymatlari = {
  nom: '',
  hisobTuri: 'RULON',
  kirimBirligi: 'rulon',
  sarflashBirligi: 'KV_M',
  koeffitsient: '1',
  sotuvNarx: '',
  sotuvValyuta: 'SOM',
  minUstamaFoiz: '',
  yaroqsizChegaraM: '',
  kamIshlatiladiganM: '',
  kamQoldiqChegaraM: '',
  standartRulonEniM: '',
  almashtirishGuruhId: '',
  yaxlitlashQadami: '',
};

const kirish =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10';

function Maydon({
  nom,
  yorliq,
  izoh,
  xato,
  children,
}: {
  nom: string;
  yorliq: string;
  izoh?: string;
  xato?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={nom}>
      <span className="text-sm font-medium text-slate-700">{yorliq}</span>
      {children}
      {xato !== undefined ? (
        <span className="text-xs text-red-700">{xato}</span>
      ) : izoh !== undefined ? (
        <span className="text-xs text-slate-500">{izoh}</span>
      ) : null}
    </label>
  );
}

export function MaterialFormasi({
  amal,
  qiymatlar,
  guruhlar,
  tugmaMatni,
}: {
  amal: (holat: FormaHolati, forma: FormData) => Promise<FormaHolati>;
  qiymatlar: MaterialQiymatlari;
  guruhlar: readonly Guruh[];
  tugmaMatni: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);
  const [kirimBirligi, setKirimBirligi] = useState(qiymatlar.kirimBirligi);
  const [sarflash, setSarflash] = useState<SarflashBirligi>(
    qiymatlar.sarflashBirligi as SarflashBirligi,
  );

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const chegara = (nom: string): string =>
    `${kirish} ${x(nom) !== undefined ? 'border-red-400' : 'border-slate-300'}`;

  return (
    <form action={yubor} className="flex flex-col gap-6">
      {holat.xato !== null && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200">
          {holat.xato}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Maydon nom="nom" yorliq="Nomi" xato={x('nom')}>
            <input id="nom" name="nom" defaultValue={qiymatlar.nom} required className={chegara('nom')} />
          </Maydon>
        </div>

        <Maydon nom="hisobTuri" yorliq="Hisob turi" izoh="TZ 5.2" xato={x('hisobTuri')}>
          <select id="hisobTuri" name="hisobTuri" defaultValue={qiymatlar.hisobTuri} className={chegara('hisobTuri')}>
            {HISOB_TURLARI.map((t) => (
              <option key={t} value={t}>
                {HISOB_TURI_NOMI[t]}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="almashtirishGuruhId" yorliq="Almashtirish guruhi" izoh="TZ 5.6 — sotuvda shu guruh chiqadi">
          <select
            id="almashtirishGuruhId"
            name="almashtirishGuruhId"
            defaultValue={qiymatlar.almashtirishGuruhId}
            className={chegara('almashtirishGuruhId')}
          >
            <option value="">— tanlanmagan —</option>
            {guruhlar.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="kirimBirligi" yorliq="Kirim birligi" izoh="ombor qanday qabul qiladi" xato={x('kirimBirligi')}>
          <input
            id="kirimBirligi"
            name="kirimBirligi"
            defaultValue={qiymatlar.kirimBirligi}
            onChange={(e) => { setKirimBirligi(e.target.value); }}
            required
            className={chegara('kirimBirligi')}
          />
        </Maydon>

        <Maydon nom="sarflashBirligi" yorliq="Sarflash birligi" izoh="buyurtmada qanday yechiladi">
          <select
            id="sarflashBirligi"
            name="sarflashBirligi"
            defaultValue={qiymatlar.sarflashBirligi}
            onChange={(e) => { setSarflash(e.target.value as SarflashBirligi); }}
            className={chegara('sarflashBirligi')}
          >
            {SARFLASH_BIRLIKLARI.map((b) => (
              <option key={b} value={b}>
                {SARFLASH_BIRLIGI_NOMI[b]}
              </option>
            ))}
          </select>
        </Maydon>

        <div className="sm:col-span-2">
          <Maydon
            nom="koeffitsient"
            yorliq="Koeffitsient"
            izoh={koeffitsientIzohi(kirimBirligi, sarflash)}
            xato={x('koeffitsient')}
          >
            <input
              id="koeffitsient"
              name="koeffitsient"
              defaultValue={qiymatlar.koeffitsient}
              required
              inputMode="decimal"
              className={chegara('koeffitsient')}
            />
          </Maydon>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Narx</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Maydon
            nom="sotuvNarx"
            yorliq="Sotuv narxi"
            izoh={`1 ${SARFLASH_BIRLIGI_NOMI[sarflash === 'SM' ? 'SM' : sarflash]} uchun`}
            xato={x('sotuvNarx')}
          >
            <input id="sotuvNarx" name="sotuvNarx" defaultValue={qiymatlar.sotuvNarx} inputMode="decimal" className={chegara('sotuvNarx')} />
          </Maydon>

          <Maydon nom="sotuvValyuta" yorliq="Valyuta">
            <select id="sotuvValyuta" name="sotuvValyuta" defaultValue={qiymatlar.sotuvValyuta} className={chegara('sotuvValyuta')}>
              <option value="SOM">so&apos;m</option>
              <option value="USD">dollar</option>
            </select>
          </Maydon>

          <Maydon nom="minUstamaFoiz" yorliq="Min. ustama %" izoh="bo'sh → sozlamadagi standart" xato={x('minUstamaFoiz')}>
            <input id="minUstamaFoiz" name="minUstamaFoiz" defaultValue={qiymatlar.minUstamaFoiz} inputMode="decimal" className={chegara('minUstamaFoiz')} />
          </Maydon>
        </div>
        {sarflash === 'SM' && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
            Chiziqli material <b>santimetrda</b> sarflanadi, narxi esa <b>1 metr</b> uchun
            yoziladi. Tizim o&apos;zi ÷100 qiladi (Q-01).
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Chegaralar</h2>
        <p className="mb-3 text-xs text-slate-500">
          Ostatka chegaralari <b>eni bo&apos;yicha, metrda</b> (5.5). Kam qoldiq chegarasi —
          uzunlik bo&apos;yicha (Q-10).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Maydon nom="yaroqsizChegaraM" yorliq="Yaroqsiz (m)" izoh="standart 0.5" xato={x('yaroqsizChegaraM')}>
            <input id="yaroqsizChegaraM" name="yaroqsizChegaraM" defaultValue={qiymatlar.yaroqsizChegaraM} inputMode="decimal" className={chegara('yaroqsizChegaraM')} />
          </Maydon>
          <Maydon nom="kamIshlatiladiganM" yorliq="Kam ishlatiladigan (m)" izoh="standart 1.0" xato={x('kamIshlatiladiganM')}>
            <input id="kamIshlatiladiganM" name="kamIshlatiladiganM" defaultValue={qiymatlar.kamIshlatiladiganM} inputMode="decimal" className={chegara('kamIshlatiladiganM')} />
          </Maydon>
          <Maydon nom="kamQoldiqChegaraM" yorliq="Kam qoldiq (m)" xato={x('kamQoldiqChegaraM')}>
            <input id="kamQoldiqChegaraM" name="kamQoldiqChegaraM" defaultValue={qiymatlar.kamQoldiqChegaraM} inputMode="decimal" className={chegara('kamQoldiqChegaraM')} />
          </Maydon>
          <Maydon nom="standartRulonEniM" yorliq="Standart rulon eni (m)" izoh="bo'sh → oxirgi kirimdan" xato={x('standartRulonEniM')}>
            <input id="standartRulonEniM" name="standartRulonEniM" defaultValue={qiymatlar.standartRulonEniM} inputMode="decimal" className={chegara('standartRulonEniM')} />
          </Maydon>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : tugmaMatni}
        </button>
        <Link href="/material" className="text-sm text-slate-600 hover:text-slate-900">
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
