'use client';

import { useActionState, useState } from 'react';
import { xaridYopAmali, type YopishHolati } from './amal';

const BOSH: YopishHolati = { xato: null, saqlandi: false };

/**
 * Buyurtmani yopish («qolgani kelmaydi») yoki bekor qilish.
 *
 * ⚠️ Sabab shart. Bekor — faqat hech narsa kelmagan bo'lsa (server
 *    ham tekshiradi).
 */
export function XaridYopishFormasi({ xaridId, bekorBolarmi }: { xaridId: number; bekorBolarmi: boolean }) {
  const [holat, yubor, kutilmoqda] = useActionState(xaridYopAmali, BOSH);
  const [ochiq, setOchiq] = useState(false);
  if (holat.saqlandi) return null;

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          setOchiq(true);
        }}
        className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm hover:bg-fon"
      >
        Yopish / bekor qilish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex w-full flex-col gap-2 rounded-karta border border-chegara bg-sirt p-4">
      <input type="hidden" name="xaridId" value={xaridId} />
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="qaror" value="YOPILDI" defaultChecked />
          Yopish — qolgani kelmaydi
        </label>
        <label className={`flex items-center gap-1.5 ${bekorBolarmi ? '' : 'opacity-50'}`}>
          <input type="radio" name="qaror" value="BEKOR" disabled={!bekorBolarmi} />
          Bekor qilish — buyurtma bo&apos;lmadi
        </label>
      </fieldset>
      <input
        name="sabab"
        required
        maxLength={300}
        placeholder="Sabab: masalan «zavodda tugadi», «boshqa joydan oldik»"
        aria-label="Sabab"
        className="rounded-maydon border border-chegara-quyuq bg-sirt px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brend/25"
      />
      {holat.xato !== null && (
        <p role="alert" className="text-[13px] text-belgi-qizil">
          {holat.xato}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-3 py-1.5 text-[13px] font-medium text-tugma-matn hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Tasdiqlash'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOchiq(false);
          }}
          className="px-3 py-1.5 text-[13px] text-matn-kuchsiz hover:text-matn"
        >
          Bekor
        </button>
      </div>
    </form>
  );
}
