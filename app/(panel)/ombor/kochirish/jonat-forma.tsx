'use client';

/**
 * TZ 20.7.1 — 2-qadam: beruvchi filial omborchisi bo'laklarni tanlaydi.
 *
 * ⚠️ 22.4.1 — qarz summasi tannarx bo'yicha AVTOMATIK chiqadi. Omborchi
 *    odatda hech narsa yozmaydi. O'zgartirilsa — sabab majburiy
 *    (EC-FQ-06) va audit jurnaliga tushadi.
 */

import { enterYuborilmasin } from '../../forma-yordamchi';
import { useActionState, useMemo, useState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kochirishJonatAmali } from './amal';
import { BOSH_KOCHIRISH } from './holat';
import type { TanlanadiganBolak } from './malumot';

export function JonatishFormasi({
  kochirishId,
  bolaklar,
}: {
  kochirishId: number;
  bolaklar: readonly TanlanadiganBolak[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(kochirishJonatAmali, BOSH_KOCHIRISH);
  const [tanlangan, tanlanganniOzgartir] = useState<readonly number[]>([]);
  const [qoldaMi, qoldaMiOzgartir] = useState(false);
  const [qarzSumma, qarzSummaniOzgartir] = useState('');

  const tannarxJami = useMemo(
    () =>
      bolaklar
        .filter((b) => tanlangan.includes(b.id))
        .reduce((y, b) => y + Number(b.tannarxSumma), 0),
    [bolaklar, tanlangan],
  );

  function almashtir(id: number): void {
    tanlanganniOzgartir((eski) =>
      eski.includes(id) ? eski.filter((x) => x !== id) : [...eski, id],
    );
  }

  return (
    <form action={yubor} onKeyDown={enterYuborilmasin} className="flex flex-col gap-4">
      <input type="hidden" name="kochirishId" value={kochirishId} />
      <input type="hidden" name="bolakIdlar" value={JSON.stringify(tanlangan)} />
      {qoldaMi && <input type="hidden" name="qarzSumma" value={qarzSumma} />}

      {holat.xato !== null && (
        <p role="alert" className="text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="w-10 px-4 py-2.5" />
              <th className="px-4 py-2.5 font-medium">Kod</th>
              <th className="px-4 py-2.5 font-medium">Mahsulot</th>
              <th className="px-4 py-2.5 font-medium">O&apos;lcham</th>
              <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {bolaklar.map((b) => (
              <tr key={b.id} className={tanlangan.includes(b.id) ? 'bg-fon' : ''}>
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={tanlangan.includes(b.id)}
                    onChange={() => {
                      almashtir(b.id);
                    }}
                    aria-label={`${b.kod} tanlash`}
                  />
                </td>
                <td className="raqam px-4 py-2.5">{b.kod}</td>
                <td className="px-4 py-2.5">{b.materialNomi}</td>
                <td className="raqam px-4 py-2.5">{b.olcham}</td>
                <td className="raqam px-4 py-2.5 text-right">{pulKorsat(som(b.tannarxSumma))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 rounded-karta border border-chegara bg-sirt p-4">
        <p className="raqam text-sm">
          Tannarx bo&apos;yicha: <b>{pulKorsat(som(tannarxJami.toFixed(2)))}</b>
        </p>

        <label className="flex items-center gap-2 text-sm text-matn-ikki">
          <input
            type="checkbox"
            checked={qoldaMi}
            onChange={(e) => {
              qoldaMiOzgartir(e.target.checked);
              if (e.target.checked && qarzSumma === '') {
                qarzSummaniOzgartir(tannarxJami.toFixed(2));
              }
            }}
          />
          Summani qo&apos;lda o&apos;zgartiraman
        </label>

        {qoldaMi && (
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <Maydon nom="qarz-summa" yorliq="Qarz summasi" xato={holat.maydonlar['qarzSumma']}>
              <input
                id="qarz-summa"
                value={qarzSumma}
                onChange={(e) => {
                  qarzSummaniOzgartir(e.target.value);
                }}
                inputMode="decimal"
                className={`${kirishUslubi(false)} w-40`}
              />
            </Maydon>

            <Maydon nom="qarzSabab" yorliq="Sabab (majburiy)" xato={holat.maydonlar['qarzSabab']}>
              <input
                id="qarzSabab"
                name="qarzSabab"
                className={`${kirishUslubi(false)} w-72`}
                placeholder="Nega standart summadan farq qiladi"
              />
            </Maydon>
          </div>
        )}

        <p className="mt-1 text-xs text-matn-kuchsiz">
          Ichki ustama qo&apos;yilmaydi: aks holda mato hali sotilmagan bo&apos;lsa ham korxona
          darajasida soxta foyda paydo bo&apos;ladi (22.4.2).
        </p>
      </div>

      <button
        type="submit"
        disabled={kutilmoqda || tanlangan.length === 0}
        className="self-start rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
      >
        {kutilmoqda ? "Jo'natilmoqda…" : `Jo'natish (${String(tanlangan.length)} bo'lak)`}
      </button>
    </form>
  );
}
