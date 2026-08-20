'use client';

/**
 * TZ 15.1 — «To'liq va qisman. Butun omborni sanash shart emas.»
 *
 * Hech narsa tanlanmasa — butun ombor.
 */

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../../../maydon';
import { varaqaOchAmali } from '../amal';
import { BOSH_HOLAT } from '../holat';

export interface TanlanadiganMaterial {
  readonly id: number;
  readonly nom: string;
  readonly bolakSoni: number;
}

export function VaraqaOchFormasi({
  materiallar,
  bugun,
}: {
  materiallar: readonly TanlanadiganMaterial[];
  bugun: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(varaqaOchAmali, BOSH_HOLAT);
  const [tanlangan, tanlangannIOzgartir] = useState<readonly number[]>([]);

  const almashtir = (id: number): void => {
    tanlangannIOzgartir((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  };

  const jamiBolak = materiallar
    .filter((m) => tanlangan.length === 0 || tanlangan.includes(m.id))
    .reduce((s, m) => s + m.bolakSoni, 0);

  return (
    <form action={yubor} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="materialIdlar" value={JSON.stringify(tanlangan)} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      <Maydon nom="sana" yorliq="Sana" xato={holat.maydonlar.sana}>
        <input
          id="sana"
          name="sana"
          type="date"
          defaultValue={bugun}
          className={kirishUslubi(holat.maydonlar.sana !== undefined)}
        />
      </Maydon>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Materiallar</p>
        <p className="mb-3 text-xs text-slate-500">
          Hech narsa tanlanmasa — <b>butun ombor</b> sanaladi. Bir nechtasini
          tanlab qisman ham o&apos;tkazish mumkin (15.1).
        </p>

        {materiallar.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Omborda sanaladigan bo&apos;lak yo&apos;q.
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {materiallar.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-b-0 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={tanlangan.includes(m.id)}
                  onChange={() => {
                    almashtir(m.id);
                  }}
                />
                <span className="flex-1">{m.nom}</span>
                <span className="raqam text-xs text-slate-500">
                  {m.bolakSoni} ta bo&apos;lak
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Maydon nom="izoh" yorliq="Izoh" izoh="Ixtiyoriy" xato={holat.maydonlar.izoh}>
        <input
          id="izoh"
          name="izoh"
          className={kirishUslubi(holat.maydonlar.izoh !== undefined)}
          placeholder="Masalan: oylik sanoq"
        />
      </Maydon>

      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
        Varaqada <b>{jamiBolak}</b> ta qator bo&apos;ladi. Har bo&apos;lak
        o&apos;z qatorida, o&apos;lchami bilan — «48 kv.m bor» degan javob
        hech narsani tekshirmaydi (15.1).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda || materiallar.length === 0}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {kutilmoqda ? 'Ochilmoqda…' : 'Varaqani ochish'}
        </button>
        <Link
          href="/ombor/inventarizatsiya"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
