'use client';

/**
 * app/(panel)/mijoz/guruh/royxat.tsx — TZ 6.3
 *
 * ⚠️ Tahrirlash MODAL oynada: guruhda to'rtta maydon bor, lekin
 *    ular ro'yxatdan chiqmasdan to'ldiriladi — omborchi ham,
 *    sotuvchi ham ro'yxatni yo'qotmaydi.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../../modal';
import { OchirTugma } from '../../ochir-tugma';
import { QaytarTugma } from '../../ochirilganlar';
import { MijozGuruhFormasi } from './forma';
import type { MijozGuruhQatori } from './malumot';

/** Chegirmani odam o'qiydigan ko'rinishga o'giradi */
export function chegirmaMatni(turi: string | null, qiymat: string | null): string {
  if (turi === null || qiymat === null) return '—';
  const son = Number(qiymat);
  const belgi = son > 0 ? '+' : '';
  return turi === 'FOIZ' ? `${belgi}${String(son)}%` : `${belgi}${String(son)} so'm`;
}

export function MijozGuruhRoyxati({
  qatorlar,
  ozgartiraOladi,
}: {
  qatorlar: readonly MijozGuruhQatori[];
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
            <th className="px-4 py-2.5 font-medium">Guruh</th>
            <th className="px-4 py-2.5 text-right font-medium">Chegirma</th>
            <th className="px-4 py-2.5 text-right font-medium">Mijoz</th>
            <th className="px-4 py-2.5 font-medium">Izoh</th>
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
  guruh: MijozGuruhQatori;
  ozgartiraOladi: boolean;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const router = useRouter();

  return (
    <tr className={guruh.faol ? '' : 'text-matn-kuchsiz'}>
      <td className="px-4 py-2.5 font-medium">{guruh.nom}</td>

      <td className="raqam px-4 py-2.5 text-right">
        {chegirmaMatni(guruh.offsetTuri, guruh.offsetQiymat)}
      </td>

      {/*
        ⚠️ Mijozlar soni KO'RSATILADI — odam o'chirishga urinib
           «band» degan xabar olishidan oldin biladi.
      */}
      <td className="raqam px-4 py-2.5 text-right text-matn-ikki">
        {guruh.mijozSoni === 0 ? <span className="text-matn-kuchsiz">—</span> : guruh.mijozSoni}
      </td>

      <td className="px-4 py-2.5 text-[13px] text-matn-kuchsiz">{guruh.izoh ?? '—'}</td>

      {ozgartiraOladi && (
        <td className="px-4 py-2.5">
          <div className="flex items-center justify-end gap-3">
            {guruh.faol ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    ochiqniOzgartir(true);
                  }}
                  className="fokus rounded-maydon px-1 text-matn-ikki transition-colors hover:text-matn"
                >
                  Tahrirlash
                </button>
                <OchirTugma tur="mijozGuruh" id={guruh.id} nom={guruh.nom} ixcham />

                <Modal
                  ochiq={ochiq}
                  yop={() => {
                    ochiqniOzgartir(false);
                  }}
                  sarlavha={guruh.nom}
                  bolalar={
                    <MijozGuruhFormasi
                      guruhId={guruh.id}
                      qiymatlar={{
                        nom: guruh.nom,
                        offsetTuri: guruh.offsetTuri ?? '',
                        offsetQiymat: guruh.offsetQiymat === null ? '' : String(Number(guruh.offsetQiymat)),
                        izoh: guruh.izoh ?? '',
                      }}
                      saqlandi={() => {
                        ochiqniOzgartir(false);
                        router.refresh();
                      }}
                      bekor={() => {
                        ochiqniOzgartir(false);
                      }}
                    />
                  }
                />
              </>
            ) : (
              <QaytarTugma tur="mijozGuruh" id={guruh.id} nom={guruh.nom} />
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
