'use client';

/**
 * TZ 7.10 — hisobdan chiqarishni bekor qilish.
 *
 * ⚠️ Sabab MAJBURIY: u teskari yozuvning izohiga tushadi va auditda
 *    qoladi. Shuning uchun bir bosishda emas — avval sabab so'raladi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { chiqimBekorAmali } from './amal';
import { BOSH_HOLAT } from './holat';

export function BekorTugmasi({ harakatId, bolakKod }: { harakatId: number; bolakKod: string }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(chiqimBekorAmali, BOSH_HOLAT);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
      >
        Bekor qilish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="harakatId" value={harakatId} />

      {holat.xato !== null && (
        <p role="alert" className="text-xs text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      <Maydon
        nom={`izoh-${String(harakatId)}`}
        yorliq={`${bolakKod} — bekor qilish sababi`}
        xato={holat.maydonlar.izoh}
      >
        <input
          id={`izoh-${String(harakatId)}`}
          name="izoh"
          className={kirishUslubi(holat.maydonlar.izoh !== undefined)}
          placeholder="Masalan: adashib boshqa rulon tanlangan"
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? 'Qaytarilmoqda…' : 'Omborga qaytarish'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-matn-kuchsiz hover:text-matn"
        >
          Yopish
        </button>
      </div>

      <p className="text-xs text-matn-kuchsiz">
        Eski yozuv o&apos;chirilmaydi — teskari yozuv qo&apos;shiladi (§6.5).
      </p>
    </form>
  );
}
