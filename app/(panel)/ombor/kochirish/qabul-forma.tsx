'use client';

/**
 * TZ 20.7.1 — 3-qadam: qabul qiluvchi filial tasdiqlaydi.
 *
 * ⚠️ EC-FQ-03 — «haqiqiy o'lcham kichik chiqsa qarz haqiqiy o'lcham
 *    bo'yicha». O'lchov kiritilsa bo'lakning o'lchami tuzatiladi;
 *    tannarx BIRLIGI o'zgarmaydi (20.7.3).
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kochirishBekorAmali, kochirishQabulAmali } from './amal';
import { BOSH_KOCHIRISH } from './holat';
import type { KochirishBolagi } from './malumot';

interface Tuzatish {
  readonly bolakId: number;
  readonly eniM: string | null;
  readonly boyiM: string | null;
  readonly miqdor: string | null;
  readonly izoh: string;
}

export function QabulFormasi({
  kochirishId,
  qatorlar,
}: {
  kochirishId: number;
  qatorlar: readonly KochirishBolagi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(kochirishQabulAmali, BOSH_KOCHIRISH);
  const [olchovli, olchovliniOzgartir] = useState<Record<number, Tuzatish>>({});

  const tuzatishlar = Object.values(olchovli).filter((t) => t.izoh.trim() !== '');

  function yangila(bolakId: number, ozgarish: Partial<Tuzatish>): void {
    olchovliniOzgartir((eski) => ({
      ...eski,
      [bolakId]: {
        bolakId,
        eniM: eski[bolakId]?.eniM ?? null,
        boyiM: eski[bolakId]?.boyiM ?? null,
        miqdor: eski[bolakId]?.miqdor ?? null,
        izoh: eski[bolakId]?.izoh ?? '',
        ...ozgarish,
      },
    }));
  }

  return (
    <form action={yubor} className="flex flex-col gap-4">
      <input type="hidden" name="kochirishId" value={kochirishId} />
      <input type="hidden" name="tuzatishlar" value={JSON.stringify(tuzatishlar)} />

      {holat.xato !== null && (
        <p role="alert" className="text-sm text-red-700">
          {holat.xato}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Kod</th>
              <th className="px-4 py-2.5 font-medium">Material</th>
              <th className="px-4 py-2.5 font-medium">Jo&apos;natilgan</th>
              <th className="px-4 py-2.5 font-medium">Haqiqiy o&apos;lcham</th>
              <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {qatorlar.map((q) => (
              <tr key={q.bolakId}>
                <td className="raqam px-4 py-2.5">{q.kod}</td>
                <td className="px-4 py-2.5">{q.materialNomi}</td>
                <td className="raqam px-4 py-2.5">
                  {q.turi === 'DONA'
                    ? (q.miqdor ?? '—')
                    : `${q.eniM ?? '—'} × ${q.boyiM ?? '—'} m`}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {q.turi === 'DONA' ? (
                      <input
                        aria-label={`${q.kod} miqdor`}
                        placeholder={q.miqdor ?? ''}
                        inputMode="decimal"
                        className={`${kirishUslubi(false)} w-24`}
                        onChange={(e) => {
                          yangila(q.bolakId, {
                            miqdor: e.target.value === '' ? null : e.target.value,
                          });
                        }}
                      />
                    ) : (
                      <>
                        <input
                          aria-label={`${q.kod} eni`}
                          placeholder={q.eniM ?? ''}
                          inputMode="decimal"
                          className={`${kirishUslubi(false)} w-20`}
                          onChange={(e) => {
                            yangila(q.bolakId, {
                              eniM: e.target.value === '' ? null : e.target.value,
                            });
                          }}
                        />
                        <span className="text-xs text-slate-400">×</span>
                        <input
                          aria-label={`${q.kod} bo'yi`}
                          placeholder={q.boyiM ?? ''}
                          inputMode="decimal"
                          className={`${kirishUslubi(false)} w-20`}
                          onChange={(e) => {
                            yangila(q.bolakId, {
                              boyiM: e.target.value === '' ? null : e.target.value,
                            });
                          }}
                        />
                      </>
                    )}
                    <input
                      aria-label={`${q.kod} izoh`}
                      placeholder="izoh"
                      className={`${kirishUslubi(false)} w-40`}
                      onChange={(e) => {
                        yangila(q.bolakId, { izoh: e.target.value });
                      }}
                    />
                  </div>
                </td>
                <td className="raqam px-4 py-2.5 text-right">
                  {pulKorsat(som(q.tannarxSumma))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
        O&apos;lchov faqat <b>farq bo&apos;lsa</b> kiritiladi — izoh yozilmasa
        tuzatish hisobga olinmaydi. Qabul qilinganda filiallararo qarz
        yoziladi (22.4.4).
      </p>

      <button
        type="submit"
        disabled={kutilmoqda}
        className="self-start rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {kutilmoqda ? 'Qabul qilinmoqda…' : 'Qabul qilish'}
      </button>
    </form>
  );
}

/** EC-FQ-02 — bekor qilish: qarz yozilmaydi, bo'laklar qaytadi. */
export function BekorFormasi({ kochirishId }: { kochirishId: number }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(kochirishBekorAmali, BOSH_KOCHIRISH);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="self-start text-xs text-slate-500 underline underline-offset-2 hover:text-red-700"
      >
        Bekor qilish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex max-w-md flex-col gap-3">
      <input type="hidden" name="kochirishId" value={kochirishId} />

      {holat.xato !== null && (
        <p role="alert" className="text-sm text-red-700">
          {holat.xato}
        </p>
      )}

      <Maydon nom="sabab" yorliq="Sabab (majburiy)" xato={holat.maydonlar['sabab']}>
        <input
          id="sabab"
          name="sabab"
          className={kirishUslubi(false)}
          placeholder="Masalan: yo'lda mashina buzildi"
        />
      </Maydon>

      <p className="text-xs text-slate-500">
        Yo&apos;ldagi bo&apos;laklar beruvchi filialga qaytadi, qarz
        yozilmaydi (EC-FQ-02).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Bekor qilinmoqda…' : 'Bekor qilish'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}
