'use client';

/**
 * Rejalar formasi — TZ 21.3. 2026-10-13.
 * ⚠️ Hamma qator BIR yuborishda saqlanadi (bir tranzaksiya).
 */

import { useActionState } from 'react';
import { enterYuborilmasin } from '../../forma-yordamchi';
import { kirishUslubi } from '../../maydon';
import { rejaAmali } from './amal';
import { BOSH_REJA_HOLATI } from './holat';

export interface FormaQatori {
  readonly kalit: string;
  readonly nom: string;
  readonly izoh?: string;
  readonly tushum: string;
  /** `null` — foyda ustuni yo'q (sotuvchi) */
  readonly foyda: string | null;
  readonly ozgargan: boolean;
}

export interface FormaBolimi {
  readonly nom: string;
  readonly qatorlar: readonly FormaQatori[];
  /** 21.3.1 — yig'indi tekshiruvi qatori (bo'lsa) */
  readonly tekshiruv?: { readonly matn: string; readonly teng: boolean } | null;
}

const KATAK = `${kirishUslubi(false)} raqam w-40`;

export function RejaFormasi(k: {
  readonly oy: string;
  readonly bolimlar: readonly FormaBolimi[];
  readonly sababKerak: boolean;
  readonly nusxa: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(rejaAmali, BOSH_REJA_HOLATI);

  return (
    <div className="flex flex-col gap-6">
      {holat.xato !== null && (
        <p role="alert" className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}
      {holat.xabar !== null && holat.xato === null && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">{holat.xabar}</p>
      )}

      {k.nusxa && (
        <form action={yubor} onKeyDown={enterYuborilmasin} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="oy" value={k.oy} />
          <input type="hidden" name="amal" value="nusxa" />
          <label className="flex flex-col gap-1 text-sm text-matn-ikki">
            O&apos;tgan oydan nusxa, ustiga %
            <input name="foiz" defaultValue="0" inputMode="decimal" className={`${kirishUslubi(false)} w-24`} />
          </label>
          <button
            disabled={kutilmoqda}
            className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm text-matn-ikki hover:bg-fon disabled:opacity-60"
          >
            Qo&apos;llash
          </button>
          <span className="text-xs text-matn-kuchsiz">Qo&apos;yilgan reja ustidan yozilmaydi</span>
        </form>
      )}

      <form action={yubor} onKeyDown={enterYuborilmasin} className="flex flex-col gap-6">
        <input type="hidden" name="oy" value={k.oy} />
        {k.bolimlar.map((b) => (
          <section key={b.nom} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-matn-ikki">{b.nom}</h2>
            <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-chegara text-left text-xs text-matn-kuchsiz">
                    <th className="px-3 py-2 font-medium">Kimga</th>
                    <th className="px-3 py-2 font-medium">Tushum, so&apos;m</th>
                    <th className="px-3 py-2 font-medium">Foyda, so&apos;m</th>
                  </tr>
                </thead>
                <tbody>
                  {b.qatorlar.map((q) => (
                    <tr key={`${q.kalit}-${String(holat.urinish)}`} className="border-b border-chegara last:border-0">
                      <td className="px-3 py-2 text-matn">
                        {q.nom}
                        {q.izoh !== undefined && <span className="ml-1 text-xs text-matn-kuchsiz">({q.izoh})</span>}
                        {q.ozgargan && (
                          <span
                            title="Oy boshlangandan keyin o'zgartirilgan (21.4)"
                            className="ml-2 rounded bg-belgi-sariq-fon px-1.5 py-0.5 text-[11px] text-belgi-sariq"
                          >
                            oy ichida o&apos;zgardi
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          name={`t|${q.kalit}`}
                          defaultValue={q.tushum}
                          inputMode="decimal"
                          aria-label={`${q.nom} — tushum`}
                          className={KATAK}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        {q.foyda === null ? (
                          <span className="text-xs text-matn-kuchsiz">—</span>
                        ) : (
                          <input
                            name={`f|${q.kalit}`}
                            defaultValue={q.foyda}
                            inputMode="decimal"
                            aria-label={`${q.nom} — foyda`}
                            className={KATAK}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {b.tekshiruv !== undefined && b.tekshiruv !== null && (
              <p className={`text-xs ${b.tekshiruv.teng ? 'text-belgi-yashil' : 'text-belgi-qizil'}`}>
                {b.tekshiruv.teng ? '✓' : '⚠️'} {b.tekshiruv.matn}
              </p>
            )}
          </section>
        ))}

        {k.sababKerak && (
          <label className="flex max-w-md flex-col gap-1 text-sm text-matn-ikki">
            O&apos;zgartirish sababi (oy boshlangan — majburiy, jurnalga yoziladi)
            <input name="sabab" maxLength={300} className={kirishUslubi(false)} />
          </label>
        )}

        <div>
          <button
            disabled={kutilmoqda}
            className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-tugma-matn disabled:opacity-60"
          >
            {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}
