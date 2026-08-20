'use client';

/**
 * TZ 7.10 · QISM 1 §1 — boshlang'ich qoldiq.
 *
 * ⚠️ Bu XARID EMAS. Mol allaqachon kelgan va to'langan, shuning uchun
 *    formada yetkazib beruvchi ham, to'lov muddati ham yo'q va
 *    yetkazib beruvchi qarziga tegilmaydi (QABUL S2.6).
 *
 * ⚠️ Q-05 — kv.m KIRITILMAYDI: rulon uchun eni va bo'yi alohida.
 */

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../../maydon';
import { boshlangichAmali } from '../inventarizatsiya/amal';
import { BOSH_HOLAT } from '../inventarizatsiya/holat';

interface Olcham {
  /** Ro'yxat o'zgarganda React qatorni adashtirmasligi uchun barqaror kalit */
  readonly kalit: number;
  eniM: string;
  boyiM: string;
}

let keyingiKalit = 0;
const yangiOlcham = (): Olcham => {
  keyingiKalit += 1;
  return { kalit: keyingiKalit, eniM: '', boyiM: '' };
};

export function BoshlangichFormasi({
  materialId,
  materialNomi,
  rulon,
  birlikNomi,
}: {
  materialId: number;
  materialNomi: string;
  rulon: boolean;
  birlikNomi: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(boshlangichAmali, BOSH_HOLAT);
  const [olchamlar, olchamlarniOzgartir] = useState<Olcham[]>(() => [yangiOlcham()]);

  const yoz = (i: number, maydon: keyof Olcham, qiymat: string): void => {
    olchamlarniOzgartir((o) =>
      o.map((x, j) => (i === j ? { ...x, [maydon]: qiymat } : x)),
    );
  };

  const tayyor = olchamlar
    .map((o) => ({ eniM: Number(o.eniM), boyiM: Number(o.boyiM) }))
    .filter((o) => Number.isFinite(o.eniM) && Number.isFinite(o.boyiM) && o.eniM > 0 && o.boyiM > 0);

  return (
    <form action={yubor} className="flex max-w-xl flex-col gap-6">
      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="bolaklar" value={JSON.stringify(rulon ? tayyor : [])} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <b>{materialNomi}</b>
        <span className="mt-1 block text-xs text-slate-500">
          Tizimga o&apos;tish qoldig&apos;i. Yetkazib beruvchi qarziga
          tegilmaydi — bu xarid emas.
        </span>
      </p>

      {rulon ? (
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Rulonlar</p>
          <p className="mb-3 text-xs text-slate-500">
            Har rulon alohida qator: eni × bo&apos;yi, metrda. Kv.m tizim
            hisoblaydi (Q-05).
          </p>

          <div className="flex flex-col gap-2">
            {olchamlar.map((o, i) => (
              <div key={o.kalit} className="flex items-center gap-2">
                <input
                  value={o.eniM}
                  onChange={(e) => {
                    yoz(i, 'eniM', e.target.value);
                  }}
                  inputMode="decimal"
                  className={`${kirishUslubi(false)} w-24`}
                  placeholder="eni"
                />
                <span className="text-slate-400">×</span>
                <input
                  value={o.boyiM}
                  onChange={(e) => {
                    yoz(i, 'boyiM', e.target.value);
                  }}
                  inputMode="decimal"
                  className={`${kirishUslubi(false)} w-24`}
                  placeholder="bo'yi"
                />
                <span className="text-xs text-slate-400">m</span>
                {olchamlar.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      olchamlarniOzgartir((x) => x.filter((_, j) => j !== i));
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
              olchamlarniOzgartir((x) => [...x, yangiOlcham()]);
            }}
            className="mt-2 text-sm text-slate-500 underline underline-offset-2 hover:text-slate-900"
          >
            + Rulon qo&apos;shish
          </button>
        </div>
      ) : (
        <Maydon
          nom="miqdor"
          yorliq={`Miqdor (${birlikNomi})`}
          izoh="Omborda hozir turgan miqdor"
          xato={holat.maydonlar.miqdor}
        >
          <input
            id="miqdor"
            name="miqdor"
            inputMode="decimal"
            className={kirishUslubi(holat.maydonlar.miqdor !== undefined)}
          />
        </Maydon>
      )}

      <Maydon
        nom="tannarxBirlik"
        yorliq={`Tannarx — 1 ${rulon ? 'kv.m' : birlikNomi} uchun`}
        izoh="Sarflash birligi uchun tannarx (P-20)"
        xato={holat.maydonlar.tannarxBirlik}
      >
        <input
          id="tannarxBirlik"
          name="tannarxBirlik"
          inputMode="decimal"
          className={kirishUslubi(holat.maydonlar.tannarxBirlik !== undefined)}
          placeholder="masalan 78000"
        />
      </Maydon>

      <Maydon nom="izoh" yorliq="Izoh" izoh="Ixtiyoriy" xato={holat.maydonlar.izoh}>
        <input
          id="izoh"
          name="izoh"
          className={kirishUslubi(holat.maydonlar.izoh !== undefined)}
          placeholder="Tizimga o'tish qoldig'i"
        />
      </Maydon>

      <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-900 ring-1 ring-amber-200">
        Bir material uchun <b>bir marta</b> kiritiladi. Ikkinchi urinish rad
        etiladi — aks holda tizimga o&apos;tish qoldig&apos;i ikki barobar
        bo&apos;lib ketardi.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Kiritilmoqda…' : 'Qoldiqni kiritish'}
        </button>
        <Link
          href={`/ombor/${String(materialId)}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
