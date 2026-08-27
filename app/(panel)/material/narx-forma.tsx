'use client';

/**
 * TZ 20.9.2 — material kartochkasidagi filial narxlari.
 *
 * ```
 * Sotuv narxi (standart)          120 000 so'm / kv.m
 *   Chilonzor                     — standart
 *   Samarqand                     114 000  ⚠️ istisno
 * ```
 *
 * ⚠️ 20.9.1 — «Filial narxi bo'sh bo'lsa standart ishlaydi.» Maydonni
 *    bo'shatib saqlash — istisnoni OLIB TASHLASH, nol qo'yish emas.
 */

import { useActionState, useState } from 'react';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kirishUslubi } from '../maydon';
import { filialNarxiAmali } from './narx-amal';
import { BOSH_NARX } from './narx-holat';

export interface FilialNarxQatori {
  readonly filialId: number;
  readonly filialNomi: string;
  readonly narx: string | null;
}

export function FilialNarxlari({
  materialId,
  standartNarx,
  qatorlar,
}: {
  materialId: number;
  standartNarx: string | null;
  qatorlar: readonly FilialNarxQatori[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Filial narxlari</h2>
        <p className="mt-1 text-xs text-matn-kuchsiz">
          Standart <b>{standartNarx === null ? 'belgilanmagan' : pulKorsat(som(standartNarx))}</b>.
          Bo&apos;sh qoldirilgan filial standartda qoladi — bosh filialda standart o&apos;zgarsa
          unga avtomatik tarqaladi (20.9.1).
        </p>
      </div>

      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-4 py-2.5 font-medium">Filial</th>
              <th className="px-4 py-2.5 font-medium">Narx</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {qatorlar.map((q) => (
              <NarxQatori
                key={q.filialId}
                materialId={materialId}
                qator={q}
                standartNarx={standartNarx}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NarxQatori({
  materialId,
  qator,
  standartNarx,
}: {
  materialId: number;
  qator: FilialNarxQatori;
  standartNarx: string | null;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(filialNarxiAmali, BOSH_NARX);
  const [narx, narxniOzgartir] = useState(qator.narx ?? '');

  const istisnomi = qator.narx !== null;

  return (
    <tr>
      <td className="px-4 py-2.5">{qator.filialNomi}</td>
      <td className="px-4 py-2.5">
        <form action={yubor} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="materialId" value={materialId} />
          <input type="hidden" name="filialId" value={qator.filialId} />

          <input
            name="narx"
            value={narx}
            onChange={(e) => {
              narxniOzgartir(e.target.value);
            }}
            inputMode="decimal"
            placeholder={standartNarx === null ? 'standart yo‘q' : `${standartNarx} (standart)`}
            aria-label={`${qator.filialNomi} narxi`}
            className={`${kirishUslubi(false)} w-40`}
          />

          <button
            type="submit"
            disabled={kutilmoqda}
            className="rounded-maydon bg-brend px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
          >
            {kutilmoqda ? '…' : 'Saqlash'}
          </button>

          {holat.xato !== null && (
            <span role="alert" className="text-xs text-belgi-qizil">
              {holat.xato}
            </span>
          )}
        </form>
      </td>
      <td className="px-4 py-2.5 text-xs">
        {istisnomi ? (
          <span className="text-belgi-sariq">⚠️ istisno</span>
        ) : (
          <span className="text-matn-kuchsiz">standart</span>
        )}
      </td>
    </tr>
  );
}
