'use client';

/**
 * app/(panel)/daraja/royxat.tsx — mato darajalari (egasi qarori 2026-09-20).
 *
 * ⚠️ Nom JOYIDA tahrirlanadi — darajada bitta maydon bor, uning
 *    uchun butun sahifa ochish ortiqcha ish.
 */

import { useState, useTransition } from 'react';
import { kirishUslubi } from '../maydon';
import { OchirTugma } from '../ochir-tugma';
import { QaytarTugma } from '../ochirilganlar';
import { darajaNominiOzgartir } from './amal';
import type { DarajaQatori } from './malumot';

export function DarajaRoyxati({
  qatorlar,
  ozgartiraOladi,
}: {
  qatorlar: readonly DarajaQatori[];
  ozgartiraOladi: boolean;
}) {
  if (qatorlar.length === 0) {
    return (
      <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
        Hali daraja yo&apos;q. «Oddiy», «O&apos;rta», «Premium» kabi nomlar bilan
        boshlang.
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
          {qatorlar.map((d) => (
            <Qator key={d.id} daraja={d} ozgartiraOladi={ozgartiraOladi} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Qator({
  daraja,
  ozgartiraOladi,
}: {
  daraja: DarajaQatori;
  ozgartiraOladi: boolean;
}) {
  const [tahrir, tahrirniOzgartir] = useState(false);
  const [nom, nomniOzgartir] = useState(daraja.nom);
  const [xato, xatoniOzgartir] = useState<string | null>(null);
  const [kutilmoqda, boshla] = useTransition();

  function saqla(): void {
    boshla(() => {
      void darajaNominiOzgartir(daraja.id, nom).then((n) => {
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
    <tr className={daraja.faol ? '' : 'text-matn-kuchsiz'}>
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
                    nomniOzgartir(daraja.nom);
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
                  nomniOzgartir(daraja.nom);
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
          daraja.nom
        )}
      </td>

      <td className="px-4 py-2.5 text-matn-ikki">
        {/*
          ⚠️ Nechta joyda ishlatilayotgani KO'RSATILADI — odam
             o'chirishga urinib «band» degan xabar olishidan
             oldin biladi.
        */}
        {daraja.materialSoni === 0 && daraja.qoidaSoni === 0 ? (
          <span className="text-matn-kuchsiz">—</span>
        ) : (
          <span className="text-[13px]">
            {daraja.materialSoni > 0 && `${String(daraja.materialSoni)} material`}
            {daraja.materialSoni > 0 && daraja.qoidaSoni > 0 && ' · '}
            {daraja.qoidaSoni > 0 && `${String(daraja.qoidaSoni)} turda narx`}
          </span>
        )}
      </td>

      <td className="px-4 py-2.5">
        {daraja.faol ? (
          <span className="text-belgi-yashil">faol</span>
        ) : (
          <span className="text-matn-kuchsiz">o&apos;chirilgan</span>
        )}
      </td>

      {ozgartiraOladi && (
        <td className="px-4 py-2.5">
          <div className="flex items-center justify-end gap-3">
            {daraja.faol ? (
              <>
                {!tahrir && (
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
                <OchirTugma tur="narxGuruh" id={daraja.id} nom={daraja.nom} ixcham />
              </>
            ) : (
              <QaytarTugma tur="narxGuruh" id={daraja.id} nom={daraja.nom} />
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
