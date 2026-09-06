'use client';

/**
 * TZ 9.11 — kirim hujjatining qo'shimcha xarajatini tahrirlash.
 *
 * ⚠️ «Qo'shimcha xarajat (transport hisobi, bojxona to'lovi) ko'pincha
 *    MOLDAN KEYIN keladi» — shuning uchun hujjat saqlangach ham
 *    o'zgartiriladi va tannarx qayta hisoblanadi.
 *
 * ⚠️ Sotilgan mahsulotga TEGILMAYDI (2.3). Buni sotuvchi bilishi
 *    kerak, shuning uchun ekranda ochiq yozilgan.
 */

import { useActionState, useState } from 'react';
import { kirimTahrirAmali } from './tahrir-amal';
import { BOSH_KIRIM_TAHRIR } from './tahrir-holat';
import { kirishUslubi, Maydon } from '../../maydon';

export function KirimTahrirFormasi({
  kirimId,
  transport,
  bojxona,
}: {
  kirimId: number;
  transport: string;
  bojxona: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(
    kirimTahrirAmali.bind(null, kirimId),
    BOSH_KIRIM_TAHRIR,
  );
  const [ochiq, ochiqniOzgartir] = useState(false);

  if (!ochiq) {
    return (
      <div className="flex flex-col gap-2">
        {holat.xabar !== null && (
          <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2 text-[13px] text-belgi-yashil">
            {holat.xabar}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(true);
          }}
          className="fokus self-start rounded-maydon border border-chegara px-3 py-1.5 text-[13px] text-matn-ikki transition-colors hover:border-brend hover:text-brend"
        >
          Qo&apos;shimcha xarajatni o&apos;zgartirish
        </button>
      </div>
    );
  }

  return (
    <form
      action={yubor}
      className="flex max-w-lg flex-col gap-3 rounded-karta border border-chegara bg-sirt px-4 py-4"
    >
      <p className="text-[13px] text-matn-ikki">
        Transport yoki bojxona hisobi keyin kelgan bo&apos;lsa shu yerda
        yoziladi — tannarx qayta hisoblanadi (9.11).
      </p>

      {holat.xato !== null && (
        <p role="alert" className="text-[13px] text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Maydon nom="transport" yorliq="Transport">
          <input
            id="transport"
            name="transport"
            defaultValue={transport}
            inputMode="decimal"
            className={kirishUslubi(false)}
          />
        </Maydon>

        <Maydon nom="bojxona" yorliq="Bojxona">
          <input
            id="bojxona"
            name="bojxona"
            defaultValue={bojxona}
            inputMode="decimal"
            className={kirishUslubi(false)}
          />
        </Maydon>
      </div>

      <Maydon nom="kirim-izoh" yorliq="Izoh" izoh="Ixtiyoriy">
        <input
          id="kirim-izoh"
          name="izoh"
          placeholder="Masalan: transport hisobi keldi"
          className={kirishUslubi(false)}
        />
      </Maydon>

      {/*
        ⚠️ 2.3-invariant ekranda AYTILADI: sotuvchi «nega hammasi
           o'zgarmadi?» deb o'ylamasin.
      */}
      <p className="rounded-maydon bg-fon px-3 py-2 text-[12px] text-matn-kuchsiz">
        Yangi tannarx faqat <b>omborda qolgan</b> materialga qo&apos;llanadi.
        Sotilgan mahsulotlar o&apos;z tannarxi bilan qoladi — o&apos;tgan
        oyning foydasi o&apos;zgarmaydi (2.3).
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {kutilmoqda ? 'Hisoblanmoqda…' : 'Qayta hisoblash'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="fokus rounded-maydon px-2 py-2 text-sm text-matn-kuchsiz"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
