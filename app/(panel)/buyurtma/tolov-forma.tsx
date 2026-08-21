'use client';

/**
 * TZ 3.12 — buyurtma to'lovi.
 *
 * «Bir nechta usul birga: naqd + karta. Har qator — usul, summa,
 *  valyuta.»
 *
 * ⚠️ TZ 12.2 — karta to'lovi qaysi sotuvchi sotgan bo'lsa ham
 *    TO'G'RIDAN-TO'G'RI admin kassasiga tushadi. Ro'yxat serverdan
 *    shunday keladi, sotuvchi tanlab o'tirmaydi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { tolovAmali } from './tolov-amal';
import { BOSH_TOLOV } from './holat';

export interface TolovKassasi {
  readonly id: number;
  readonly nom: string;
  readonly turi: string;
  readonly valyuta: string;
}

interface Qator {
  readonly kalit: number;
  kassaId: string;
  summa: string;
}

let keyingiKalit = 0;
const yangiQator = (kassaId: string): Qator => {
  keyingiKalit += 1;
  return { kalit: keyingiKalit, kassaId, summa: '' };
};

export function TolovFormasi({
  buyurtmaId,
  qarz,
  valyuta,
  kassalar,
}: {
  buyurtmaId: number;
  qarz: string;
  valyuta: string;
  kassalar: readonly TolovKassasi[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(tolovAmali, BOSH_TOLOV);
  const [qatorlar, qatorlarniOzgartir] = useState<Qator[]>(() => [
    yangiQator(String(kassalar[0]?.id ?? '')),
  ]);

  const son = (x: string): number => {
    const n = Number(x.trim());
    return Number.isFinite(n) ? n : 0;
  };

  const jami = qatorlar.reduce((y, q) => y + son(q.summa), 0);
  const qolgan = Number(qarz) - jami;

  const yuborilajak = qatorlar
    .filter((q) => q.kassaId !== '' && son(q.summa) > 0)
    .map((q) => ({
      kassaId: Number(q.kassaId),
      summa: son(q.summa).toFixed(2),
      valyuta: kassalar.find((k) => k.id === Number(q.kassaId))?.valyuta ?? valyuta,
    }));

  if (kassalar.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Sizning kassangiz yo&apos;q — to&apos;lov qabul qilib bo&apos;lmaydi.
        Admin kassa ochib berishi kerak (12.2).
      </p>
    );
  }

  return (
    <form action={yubor} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="buyurtmaId" value={buyurtmaId} />
      <input type="hidden" name="qatorlar" value={JSON.stringify(yuborilajak)} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-200">
          To&apos;lov qabul qilindi.
          {holat.qarz !== null && Number(holat.qarz) > 0 && (
            <span className="ml-1">
              Qolgan qarz: <b className="raqam">{pulKorsat(som(holat.qarz))}</b>
            </span>
          )}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {qatorlar.map((q, i) => (
          <div key={q.kalit} className="flex items-center gap-2">
            <select
              value={q.kassaId}
              onChange={(e) => {
                qatorlarniOzgartir((o) =>
                  o.map((x, j) => (i === j ? { ...x, kassaId: e.target.value } : x)),
                );
              }}
              className={`${kirishUslubi(false)} w-56`}
            >
              {kassalar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.turi === 'KARTA' ? 'Karta (admin kassasi)' : k.nom} · {k.valyuta}
                </option>
              ))}
            </select>

            <input
              value={q.summa}
              onChange={(e) => {
                qatorlarniOzgartir((o) =>
                  o.map((x, j) => (i === j ? { ...x, summa: e.target.value } : x)),
                );
              }}
              inputMode="decimal"
              placeholder="summa"
              className={`${kirishUslubi(false)} w-36`}
            />

            {qatorlar.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  qatorlarniOzgartir((o) => o.filter((_, j) => j !== i));
                }}
                className="text-xs text-slate-400 hover:text-red-700"
              >
                olib tashlash
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          qatorlarniOzgartir((o) => [...o, yangiQator(String(kassalar[0]?.id ?? ''))]);
        }}
        className="self-start text-sm text-slate-500 underline underline-offset-2 hover:text-slate-900"
      >
        + Usul qo&apos;shish
      </button>

      <dl className="grid max-w-xs grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-slate-500">Qarz</dt>
        <dd className="raqam">{pulKorsat(som(qarz))}</dd>
        <dt className="text-slate-500">Kiritildi</dt>
        <dd className="raqam">{pulKorsat(som(jami.toFixed(2)))}</dd>
        <dt className="border-t border-slate-200 pt-1 font-medium">Qoladi</dt>
        <dd
          className={`raqam border-t border-slate-200 pt-1 font-semibold ${
            qolgan > 0 ? 'text-amber-800' : ''
          }`}
        >
          {pulKorsat(som(qolgan.toFixed(2)))}
        </dd>
      </dl>

      {qolgan > 0 && (
        <p className="text-xs text-amber-800">
          To&apos;lov to&apos;liq emas — qolgan summa qarzga yoziladi (3.12).
        </p>
      )}

      <Maydon nom="izoh" yorliq="Izoh" izoh="Ixtiyoriy">
        <input id="izoh" name="izoh" className={`${kirishUslubi(false)} max-w-md`} />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda || yuborilajak.length === 0}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {kutilmoqda ? 'Saqlanmoqda…' : "To'lovni qabul qilish"}
      </button>
    </form>
  );
}
