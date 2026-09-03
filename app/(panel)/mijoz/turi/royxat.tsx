'use client';

/**
 * app/(panel)/mijoz/turi/royxat.tsx — TZ 6.2 · 14.9
 *
 * ⚠️ Tahrirlash MODAL oynada — ro'yxatdan chiqib ketilmaydi.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../../modal';
import { OchirTugma } from '../../ochir-tugma';
import { QaytarTugma } from '../../ochirilganlar';
import { TurFormasi } from './forma';
import { turTahrirlaAmali } from './amal';
import type { MijozTuriQatori } from '@/lib/amal/mijoz-turi';

export function TurRoyxati({
  qatorlar,
  ozgartiraOladi,
}: {
  qatorlar: readonly MijozTuriQatori[];
  ozgartiraOladi: boolean;
}) {
  if (qatorlar.length === 0) {
    return (
      <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
        Hali tur yo&apos;q.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-sm">
        <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
          <tr>
            <th className="px-4 py-2.5 font-medium">Nomi</th>
            <th className="px-4 py-2.5 font-medium">Soliq ma&apos;lumotlari</th>
            <th className="px-4 py-2.5 font-medium">Ishlatilmoqda</th>
            {ozgartiraOladi && <th className="px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
          {qatorlar.map((t) => (
            <Qator key={t.id} tur={t} ozgartiraOladi={ozgartiraOladi} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Qator({
  tur,
  ozgartiraOladi,
}: {
  tur: MijozTuriQatori;
  ozgartiraOladi: boolean;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const router = useRouter();

  return (
    <tr className={tur.faol ? '' : 'text-matn-kuchsiz'}>
      <td className="px-4 py-2.5 font-medium">{tur.nom}</td>

      <td className="px-4 py-2.5">
        {tur.soliqKerak ? (
          <span className="text-matn-ikki">so&apos;raladi — INN, tashkilot</span>
        ) : (
          <span className="text-matn-kuchsiz">—</span>
        )}
      </td>

      {/*
        ⚠️ Nechta joyda ishlatilayotgani KO'RSATILADI: odam
           nofaol qilishga urinib «band» xabarini olishidan
           oldin biladi.
      */}
      <td className="px-4 py-2.5 text-[13px] text-matn-ikki">
        {tur.mijozSoni === 0 && tur.narxSoni === 0 ? (
          <span className="text-matn-kuchsiz">—</span>
        ) : (
          <>
            {tur.mijozSoni > 0 && `${String(tur.mijozSoni)} mijoz`}
            {tur.mijozSoni > 0 && tur.narxSoni > 0 && ' · '}
            {tur.narxSoni > 0 && `${String(tur.narxSoni)} mahsulotda narx`}
          </>
        )}
      </td>

      {ozgartiraOladi && (
        <td className="px-4 py-2.5">
          <div className="flex items-center justify-end gap-3">
            {tur.faol ? (
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
                <OchirTugma tur="mijozTuri" id={tur.id} nom={tur.nom} ixcham />
              </>
            ) : (
              <QaytarTugma tur="mijozTuri" id={tur.id} nom={tur.nom} />
            )}
          </div>

          <Modal
            ochiq={ochiq}
            yop={() => {
              ochiqniOzgartir(false);
            }}
            sarlavha={`${tur.nom} — tahrirlash`}
            bolalar={
              <TurFormasi
                amal={turTahrirlaAmali.bind(null, tur.id)}
                qiymatlar={{
                  nom: tur.nom,
                  soliqKerak: tur.soliqKerak,
                  tartib: String(tur.tartib),
                }}
                tugmaMatni="O'zgarishlarni saqlash"
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
        </td>
      )}
    </tr>
  );
}
