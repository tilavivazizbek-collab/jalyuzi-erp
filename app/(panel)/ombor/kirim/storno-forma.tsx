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
        className="rounded-maydon border border-belgi-qizil/30 px-3.5 py-2 text-sm font-medium text-belgi-qizil transition-colors hover:bg-belgi-qizil-fon"
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
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      <div className="rounded-karta border border-belgi-qizil/25 bg-belgi-qizil-fon px-4 py-3 text-sm text-belgi-qizil">
        <b>{raqam}</b> to&apos;liq storno qilinadi.
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          <li>Omborda turgan {omborda} ta bo&apos;lak chiqariladi</li>
          {ishlatilgan > 0 && (
            <li>
              {ishlatilgan} ta bo&apos;lak allaqachon ishlatilgan — qoldiq <b>manfiyga tushadi</b>{' '}
              va admin tuzatgunicha shunday turadi (2.5-invariant)
            </li>
          )}
          <li>
            Kesilgan buyurtmalarga <b>tegilmaydi</b> — ular o&apos;z tannarxi bilan qotgan
            (2.3-invariant)
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
          className="rounded-maydon bg-belgi-qizil px-4 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:brightness-95 disabled:opacity-60"
        >
          {kutilmoqda ? 'Storno qilinmoqda…' : 'Ha, storno qilinsin'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
