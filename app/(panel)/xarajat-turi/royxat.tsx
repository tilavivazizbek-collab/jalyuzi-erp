'use client';

/**
 * Xarajat turlari ro'yxati — nom JOYIDA tahrirlanadi (guruh ro'yxati kabi).
 * 0066, 2026-10-13.
 */

import { useState, useTransition } from 'react';
import { kirishUslubi } from '../maydon';
import { OchirTugma } from '../ochir-tugma';
import { pulKorsat, som } from '@/lib/domain/pul';
import { xarajatTuriNominiOzgartirAmali } from './amal';
import type { XarajatTuriQatori } from './malumot';

export function XarajatTuriRoyxati({
  qatorlar,
  ozgartiraOladi,
}: {
  qatorlar: readonly XarajatTuriQatori[];
  ozgartiraOladi: boolean;
}) {
  if (qatorlar.length === 0) {
    return (
      <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
        Hali xarajat turi yo&apos;q. Masalan: Ijara, Elektr va gaz, Internet va aloqa, Reklama, Transport.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-sm">
        <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
          <tr>
            <th className="px-4 py-2.5 font-medium">Nomi</th>
            <th className="px-4 py-2.5 text-right font-medium">Shu oy, so&apos;m</th>
            <th className="px-4 py-2.5 text-right font-medium">Yozuvlar</th>
            {ozgartiraOladi && <th className="px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-chegara">
          {qatorlar.map((q) => (
            <Qator key={q.id} q={q} ozgartiraOladi={ozgartiraOladi} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Qator({ q, ozgartiraOladi }: { q: XarajatTuriQatori; ozgartiraOladi: boolean }) {
  const [tahrir, tahrirniOzgartir] = useState(false);
  const [nom, nomniOzgartir] = useState(q.nom);
  const [xato, xatoniOzgartir] = useState<string | null>(null);
  const [kutilmoqda, boshla] = useTransition();

  function saqla(): void {
    boshla(() => {
      void xarajatTuriNominiOzgartirAmali(q.id, nom).then((n) => {
        xatoniOzgartir(n.xato);
        if (n.xato === null) tahrirniOzgartir(false);
      });
    });
  }

  function bekor(): void {
    nomniOzgartir(q.nom);
    xatoniOzgartir(null);
    tahrirniOzgartir(false);
  }

  return (
    <tr>
      <td className="px-4 py-2.5 font-medium text-matn">
        {tahrir ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={nom}
                autoFocus
                maxLength={120}
                onChange={(e) => {
                  nomniOzgartir(e.target.value);
                  xatoniOzgartir(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saqla();
                  }
                  if (e.key === 'Escape') bekor();
                }}
                className={`${kirishUslubi(xato !== null)} w-56 py-1.5`}
              />
              <button
                type="button"
                disabled={kutilmoqda}
                onClick={saqla}
                className="fokus rounded-maydon bg-brend px-2.5 py-1 text-[12px] font-medium text-tugma-matn disabled:opacity-60"
              >
                {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
              <button
                type="button"
                onClick={bekor}
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
          q.nom
        )}
      </td>
      <td className="raqam px-4 py-2.5 text-matn-ikki">{pulKorsat(som(q.shuOy))}</td>
      <td className="raqam px-4 py-2.5 text-matn-ikki">{q.soni}</td>
      {ozgartiraOladi && (
        <td className="px-4 py-2.5 text-right">
          <div className="flex justify-end gap-2">
            {!tahrir && (
              <button
                type="button"
                onClick={() => {
                  tahrirniOzgartir(true);
                }}
                className="fokus rounded-maydon px-2 py-1 text-[12px] text-matn-ikki hover:text-matn"
              >
                Nomini o&apos;zgartirish
              </button>
            )}
            <OchirTugma tur="xarajatTuri" id={q.id} nom={q.nom} ixcham />
          </div>
        </td>
      )}
    </tr>
  );
}
