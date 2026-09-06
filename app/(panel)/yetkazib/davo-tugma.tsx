'use client';

/**
 * TZ 9.9 — da'voni hal qiladigan ikki tugma.
 *
 * ⚠️ Ikkalasining PUL OQIMI BOSHQACHA, shuning uchun ikkalasi ham
 *    tasdiq so'raydi:
 *
 *      «Qabul qildi»  → yetkazib beruvchi qarzi KAMAYADI
 *      «O'zimizga»    → XARAJAT yoziladi, qarz o'zgarmaydi
 */

import { useActionState, useState } from 'react';
import { davoAmali } from './davo-amal';
import { BOSH_DAVO } from './davo-holat';
import { kirishUslubi } from '../maydon';

export function DavoTugmalari({
  qatorId,
  materialNomi,
}: {
  qatorId: number;
  materialNomi: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(
    davoAmali.bind(null, qatorId),
    BOSH_DAVO,
  );
  const [ochiq, ochiqniOzgartir] = useState<'QABUL' | 'OZIMIZGA' | null>(null);

  if (holat.bajarildi) {
    return <span className="text-[13px] text-belgi-yashil">{holat.xabar}</span>;
  }

  if (ochiq === null) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir('QABUL');
          }}
          className="fokus rounded-maydon border border-chegara px-2.5 py-1 text-[12px] text-matn-ikki transition-colors hover:border-belgi-yashil hover:text-belgi-yashil"
        >
          Qabul qildi
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir('OZIMIZGA');
          }}
          className="fokus rounded-maydon border border-chegara px-2.5 py-1 text-[12px] text-matn-ikki transition-colors hover:border-belgi-qizil hover:text-belgi-qizil"
        >
          O&apos;zimizga
        </button>
      </div>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="qaror" value={ochiq} />

      <p className="text-[12px] text-matn-ikki">
        {ochiq === 'QABUL' ? (
          <>
            <b>{materialNomi}</b> uchun qarzimiz kamayadi.
          </>
        ) : (
          <>
            <b>{materialNomi}</b> zarari <b>bizda qoladi</b> — xarajatga tushadi.
          </>
        )}
      </p>

      {holat.xato !== null && (
        <span role="alert" className="text-[12px] text-belgi-qizil">
          {holat.xato}
        </span>
      )}

      <input
        name="izoh"
        placeholder="izoh (ixtiyoriy)"
        className={`${kirishUslubi(false)} text-[12px]`}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-3 py-1 text-[12px] font-medium text-white disabled:opacity-60"
        >
          {kutilmoqda ? '…' : 'Tasdiqlash'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(null);
          }}
          className="fokus rounded-maydon px-2 py-1 text-[12px] text-matn-kuchsiz"
        >
          Bekor
        </button>
      </div>
    </form>
  );
}
