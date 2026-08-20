'use client';

/**
 * TZ 7.12 — kirim hujjatini storno qilish.
 *
 * ⚠️ Bu qo'lda bajariladigan, qaytmas amal: hujjatdagi BARCHA material
 *    qaytariladi, o'sha rulonlardan allaqachon kesilgan bo'lsa ham.
 *    Qoldiq manfiyga tushishi mumkin (2.5-invariant) — ekranda shu
 *    ochiq aytiladi, keyin sabab so'raladi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { kirimStornoAmali } from '../chiqim/amal';
import { BOSH_HOLAT } from '../chiqim/holat';

export function StornoFormasi({
  kirimId,
  raqam,
  omborda,
  ishlatilgan,
}: {
  kirimId: number;
  raqam: string;
  omborda: number;
  ishlatilgan: number;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(kirimStornoAmali, BOSH_HOLAT);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
      >
        Storno qilish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="kirimId" value={kirimId} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <b>{raqam}</b> to&apos;liq storno qilinadi.
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          <li>Omborda turgan {omborda} ta bo&apos;lak chiqariladi</li>
          {ishlatilgan > 0 && (
            <li>
              {ishlatilgan} ta bo&apos;lak allaqachon ishlatilgan — qoldiq{' '}
              <b>manfiyga tushadi</b> va admin tuzatgunicha shunday turadi
              (2.5-invariant)
            </li>
          )}
          <li>
            Kesilgan buyurtmalarga <b>tegilmaydi</b> — ular o&apos;z tannarxi
            bilan qotgan (2.3-invariant)
          </li>
        </ul>
      </div>

      <Maydon
        nom="sabab"
        yorliq="Storno sababi"
        izoh="Auditda va hujjatda qoladi — aniq yozing"
        xato={holat.maydonlar.sabab}
      >
        <input
          id="sabab"
          name="sabab"
          className={kirishUslubi(holat.maydonlar.sabab !== undefined)}
          placeholder="Masalan: hujjat ikki marta kiritilgan"
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Storno qilinmoqda…' : 'Ha, storno qilinsin'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
