'use client';

/**
 * TZ 8.6 · 8.8 — pozitsiya ustidagi amallar.
 *
 * ⚠️ Ikkalasida ham SABAB majburiy va u audit jurnalida qoladi. Bir
 *    bosishda bajarilmaydi: material bo'shashi va ustaning haqqi
 *    o'zgarishi — qaytmas oqibatlar.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { bekorAmali, buyurtmaniOchirishAmali, qaytaribOlishAmali } from './amal';
import { BOSH_AMAL } from './holat';

/** TZ 8.8 — bekor qilish faqat kesishdan oldin. */
export function BekorTugmasi({ pozitsiyaId }: { pozitsiyaId: number }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(bekorAmali, BOSH_AMAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-belgi-qizil"
      >
        Bekor qilish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-belgi-qizil">
          {holat.xato}
        </span>
      )}

      <Maydon nom={`bekor-${String(pozitsiyaId)}`} yorliq="Bekor qilish sababi">
        <input
          id={`bekor-${String(pozitsiyaId)}`}
          name="sabab"
          className={`${kirishUslubi(false)} w-64`}
          placeholder="Masalan: mijoz voz kechdi"
        />
      </Maydon>

      <p className="text-xs text-matn-kuchsiz">
        Band qilingan material omborga qaytadi (7.3 · Q-06).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-belgi-qizil px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.98] hover:brightness-95 disabled:opacity-60"
        >
          {kutilmoqda ? 'Bekor qilinmoqda…' : 'Ha, bekor qilinsin'}
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
    </form>
  );
}

/** TZ 8.6 — admin ishni ustadan qaytarib oladi. */
export function QaytaribOlishTugmasi({
  pozitsiyaId,
  ustaIsmi,
}: {
  pozitsiyaId: number;
  ustaIsmi: string | null;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(qaytaribOlishAmali, BOSH_AMAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
      >
        Ishni qaytarib olish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-belgi-qizil">
          {holat.xato}
        </span>
      )}

      <p className="text-xs text-matn-ikki">
        {ustaIsmi ?? 'Usta'} ishning bir qismini bajargan bo&apos;lishi mumkin — to&apos;lanadigan
        summani <b>o&apos;zingiz</b> kiritasiz (8.6).
      </p>

      <Maydon nom={`stavka-${String(pozitsiyaId)}`} yorliq="To'lanadigan summa">
        <input
          id={`stavka-${String(pozitsiyaId)}`}
          name="stavka"
          inputMode="decimal"
          className={`${kirishUslubi(false)} w-40`}
          placeholder="0"
        />
      </Maydon>

      <Maydon nom={`sabab-${String(pozitsiyaId)}`} yorliq="Sabab">
        <input
          id={`sabab-${String(pozitsiyaId)}`}
          name="sabab"
          className={`${kirishUslubi(false)} w-64`}
          placeholder="Masalan: usta aloqaga chiqmayapti"
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? 'Qaytarilmoqda…' : 'Navbatga qaytarish'}
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
    </form>
  );
}

/**
 * TZ 8.8 · 8.15 — BUTUN BUYURTMANI bekor qilish.
 *
 * ⚠️ «O'chirish» EMAS (2.1-invariant): bazadan hech narsa
 *    o'chirilmaydi. Hamma pozitsiya `BEKOR` holatiga o'tadi va band
 *    qilingan material bo'shaydi. Ilgari tugma «o'chirish» deb
 *    atalardi va egasi uni haqiqiy o'chirish deb tushunardi.
 *
 * ⚠️ Pozitsiyani bekor qilishdan FARQI: bu bitta bosishda
 *    buyurtmaning hamma pozitsiyasini bekor qiladi va band
 *    qilingan materialni bo'shatadi. Shuning uchun tugma
 *    kartochkaning pastida, alohida turadi — tasodifan
 *    bosilmasin.
 *
 * ⚠️ Sabab MAJBURIY va audit jurnalida qoladi: keyin
 *    «B-2026-000184 nega o'chirilgan?» degan savolga javob
 *    bo'lishi kerak.
 */
export function BuyurtmaniOchirishTugmasi({ buyurtmaId }: { buyurtmaId: number }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(buyurtmaniOchirishAmali, BOSH_AMAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon border border-chegara px-3 py-1.5 text-[13px] text-matn-kuchsiz transition-colors hover:border-belgi-qizil hover:text-belgi-qizil"
      >
        Butun buyurtmani bekor qilish
      </button>
    );
  }

  return (
    <form
      action={yubor}
      className="flex max-w-md flex-col gap-2 rounded-karta border border-belgi-qizil bg-belgi-qizil-fon px-4 py-3"
    >
      <input type="hidden" name="buyurtmaId" value={buyurtmaId} />

      <p className="text-[13px] font-medium text-belgi-qizil">
        Butun buyurtma bekor qilinsinmi?
      </p>

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-belgi-qizil">
          {holat.xato}
        </span>
      )}

      <Maydon nom={`buyurtma-ochir-${String(buyurtmaId)}`} yorliq="Bekor qilish sababi">
        <input
          id={`buyurtma-ochir-${String(buyurtmaId)}`}
          name="sabab"
          className={`${kirishUslubi(false)} w-full`}
          placeholder="Masalan: xato kiritilgan"
        />
      </Maydon>

      {/*
        ⚠️ Nima bo'lishi OLDINDAN aytiladi. «O'chirish» so'zi
           odamda «yo'q bo'ladi» degan tasavvur uyg'otadi —
           aslida buyurtma tarixda qoladi.
      */}
      <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-matn-ikki">
        <li>Hamma pozitsiya «Bekor» bo&apos;ladi</li>
        <li>Band qilingan material omborga qaytadi</li>
        <li>Buyurtma tarixda qoladi — «Bekor qilingan» filtrida ko&apos;rinadi</li>
      </ul>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-belgi-qizil px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? "O'chirilmoqda…" : "Ha, o'chirilsin"}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-matn-kuchsiz transition-colors hover:text-matn"
        >
          Yo&apos;q
        </button>
      </div>
    </form>
  );
}
