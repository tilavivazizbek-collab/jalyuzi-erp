'use client';

/**
 * app/(panel)/guruh/royxat.tsx — TZ 5.6
 *
 * ⚠️ Nom JOYIDA tahrirlanadi — alohida sahifaga o'tish shart emas.
 *    Guruhda bitta maydon bor, uning uchun butun sahifa ochish
 *    ortiqcha ish.
 */

import { useState, useTransition } from 'react';
import { kirishUslubi } from '../maydon';
import { OchirTugma } from '../ochir-tugma';
import { guruhNominiOzgartir } from './amal';
import type { GuruhQatori } from './malumot';

export function GuruhRoyxati({
  qatorlar,
  ozgartiraOladi,
}: {
  qatorlar: readonly GuruhQatori[];
  ozgartiraOladi: boolean;
}) {
  if (qatorlar.length === 0) {
    return (
      <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
        Hali guruh yo&apos;q.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-sm">
        <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
          <tr>
            <th className="px-4 py-2.5 font-medium">Nomi</th>
            <th className="px-4 py-2.5 font-medium">Ishlatilmoqda</th>
            <th className="px-4 py-2.5 font-medium">Holat</th>
            {ozgartiraOladi && <th className="px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
          {qatorlar.map((g) => (
            <Qator key={g.id} guruh={g} ozgartiraOladi={ozgartiraOladi} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Qator({
  guruh,
  ozgartiraOladi,
}: {
  guruh: GuruhQatori;
  ozgartiraOladi: boolean;
}) {
  const [tahrir, tahrirniOzgartir] = useState(false);
  const [nom, nomniOzgartir] = useState(guruh.nom);
  const [xato, xatoniOzgartir] = useState<string | null>(null);
  const [kutilmoqda, boshla] = useTransition();

  function saqla(): void {
    boshla(() => {
      void guruhNominiOzgartir(guruh.id, nom).then((n) => {
        if (n.xato !== null) {
          xatoniOzgartir(n.xato);
          return;
        }
        xatoniOzgartir(null);
        tahrirniOzgartir(false);
      });
    });
  }

  return (
    <tr className={guruh.faol ? '' : 'text-matn-kuchsiz'}>
      <td className="px-4 py-2.5 font-medium">
        {tahrir ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={nom}
                autoFocus
                onChange={(e) => {
                  nomniOzgartir(e.target.value);
                  xatoniOzgartir(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saqla();
                  }
                  if (e.key === 'Escape') {
                    nomniOzgartir(guruh.nom);
                    tahrirniOzgartir(false);
                  }
                }}
                className={`${kirishUslubi(xato !== null)} w-56 py-1.5`}
              />
              <button
                type="button"
                disabled={kutilmoqda}
                onClick={saqla}
                className="fokus rounded-maydon bg-brend px-2.5 py-1 text-[12px] font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
              >
                {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
              <button
                type="button"
                onClick={() => {
                  nomniOzgartir(guruh.nom);
                  xatoniOzgartir(null);
                  tahrirniOzgartir(false);
                }}
                className="fokus rounded-maydon px-2 py-1 text-[12px] text-matn-kuchsiz hover:text-matn"
              >
                Bekor
              </button>
            </div>
            {xato !== null && (
              <p role="alert" className="text-[12px] text-belgi-qizil">
                {xato}
              </p>
            )}
          </div>
        ) : (
          guruh.nom
        )}
      </td>

      <td className="px-4 py-2.5 text-matn-ikki">
        {/*
          ⚠️ Nechta joyda ishlatilayotgani KO'RSATILADI — odam
             o'chirishga urinib «band» degan xabar olishidan
             oldin biladi.
        */}
        {guruh.materialSoni === 0 && guruh.slotSoni === 0 ? (
          <span className="text-matn-kuchsiz">—</span>
        ) : (
          <span className="text-[13px]">
            {guruh.materialSoni > 0 && `${String(guruh.materialSoni)} material`}
            {guruh.materialSoni > 0 && guruh.slotSoni > 0 && ' · '}
            {guruh.slotSoni > 0 && `${String(guruh.slotSoni)} mahsulot turi`}
          </span>
        )}
      </td>

      <td className="px-4 py-2.5">
        {guruh.faol ? (
          <span className="text-belgi-yashil">faol</span>
        ) : (
          <span className="text-matn-kuchsiz">o&apos;chirilgan</span>
        )}
      </td>

      {ozgartiraOladi && (
        <td className="px-4 py-2.5">
          <div className="flex items-center justify-end gap-3">
            {!tahrir && guruh.faol && (
              <button
                type="button"
                onClick={() => {
                  tahrirniOzgartir(true);
                }}
                className="fokus rounded-maydon px-1 text-matn-ikki transition-colors hover:text-matn"
              >
                Tahrirlash
              </button>
            )}
            {guruh.faol && (
              <OchirTugma tur="guruh" id={guruh.id} nom={guruh.nom} ixcham />
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
