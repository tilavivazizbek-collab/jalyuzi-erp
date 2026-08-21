'use client';

/**
 * TZ 8.17.2 — admin qayta kesish so'rovini hal qiladi.
 *
 * ⚠️ 8.17.8 — «Ikkinchi marta so'ralsa admin buni KO'RADI: bu pozitsiya
 *    2 marta qayta kesilgan, material yo'qotishi 7.20 kv.m · 631 000
 *    so'm.» Shuning uchun oldingi yo'qotish har so'rov yonida turadi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { haqSaqlanishiMumkinmi } from '@/lib/amal/qayta-kesish';
import type { QaytaKesishSababi } from '@/lib/amal/qayta-kesish';
import { qaytaKesishHalAmali } from '../qayta-kesish-amal';
import { BOSH_AMAL } from '../holat';

export function HalQilishFormasi({
  sorovId,
  sabab,
}: {
  sorovId: number;
  sabab: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(qaytaKesishHalAmali, BOSH_AMAL);
  const [haq, haqniOzgartir] = useState(
    haqSaqlanishiMumkinmi(sabab as QaytaKesishSababi),
  );

  return (
    <form action={yubor} className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3">
      <input type="hidden" name="sorovId" value={sorovId} />
      <input type="hidden" name="haqSaqlandi" value={haq ? 'ha' : 'yoq'} />

      {holat.xato !== null && (
        <p role="alert" className="text-sm text-red-700">
          {holat.xato}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Maydon
          nom={`ushlanma-${String(sorovId)}`}
          yorliq="Ushlanma (10.13)"
          izoh="Ish haqi xarajatini kamaytiradi"
        >
          <input
            id={`ushlanma-${String(sorovId)}`}
            name="ushlanma"
            inputMode="decimal"
            defaultValue="0"
            className={`${kirishUslubi(false)} w-32`}
          />
        </Maydon>

        <Maydon nom={`izoh-${String(sorovId)}`} yorliq="Izoh">
          <input
            id={`izoh-${String(sorovId)}`}
            name="izoh"
            className={`${kirishUslubi(false)} w-64`}
          />
        </Maydon>
      </div>

      {/* TZ 8.17.5.1 — Q-15 ning istisnosi */}
      <label className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200">
        <input
          type="checkbox"
          checked={haq}
          onChange={(e) => {
            haqniOzgartir(e.target.checked);
          }}
          className="mt-0.5"
        />
        <span>
          <b>Ustaning aybi emas — haq saqlansin</b>
          <span className="mt-0.5 block text-xs text-slate-600">
            Standart holatda haq <b>bekor qilinadi</b> (Q-15): usta ikki marta
            ishlagan bo'lsa ham bir marta oladi. Material defekti bo'lsa (mato
            yirtildi, mexanizm nosoz) istisno qo&apos;llanadi (8.17.5.1).
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          name="qaror"
          value="TASDIQ"
          disabled={kutilmoqda}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          Tasdiqlash — material qayta yechilsin
        </button>
        <button
          type="submit"
          name="qaror"
          value="RAD"
          disabled={kutilmoqda}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Rad etish
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Tasdiqlansa: birinchi bo&apos;lak chiqindiga ketadi, yangisi band
        qilinadi va pozitsiya «Ishlab chiqarilmoqda» ga qaytadi (8.17.2). Rad
        etilsa pozitsiya o&apos;z holida qoladi (EC-BRK-01).
      </p>
    </form>
  );
}
