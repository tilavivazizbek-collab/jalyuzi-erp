'use client';

/**
 * app/(panel)/error.tsx — kutilmagan xato ekrani.
 *
 * ⚠️ NEGA KERAK
 *
 *    Ilgari server tomonda xato bo'lsa oq ekran va inglizcha
 *    «Application error: a server-side exception has occurred»
 *    chiqardi. Egasi undan hech narsa tushunmasdi va menga
 *    faqat «xato chiqdi» deya olardi — qaysi ekran, qanday
 *    xato, bilib bo'lmasdi.
 *
 *    Endi: o'zbekcha xabar, DIGEST raqami (u serverdagi
 *    jurnalda aynan shu xatoni topadi) va «qayta urinish»
 *    tugmasi.
 *
 * ⚠️ Xato matni ISHLAB CHIQARISHDA ko'rsatilmaydi — Next uni
 *    ataylab yashiradi, chunki ichida baza yo'li yoki so'rov
 *    matni bo'lishi mumkin. Digest esa xavfsiz.
 */

import { useEffect } from 'react';

export default function PanelXatosi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Brauzer konsoliga — dasturchi ochsa to'liq ko'radi
    console.error('Panel xatosi:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-karta border border-chegara bg-sirt p-6">
      <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-matn">
        Bu ekranni ochib bo&apos;lmadi
      </h1>

      <p className="text-sm text-matn-ikki">
        Ma&apos;lumot yuklanayotganda xato yuz berdi. Kiritilgan ma&apos;lumotlaringizga
        hech narsa bo&apos;lmadi — ular joyida.
      </p>

      {error.digest !== undefined && (
        <p className="text-[13px] text-matn-kuchsiz">
          Xato raqami: <b className="raqam select-all">{error.digest}</b>
          <br />
          Shu raqamni dasturchiga yuborsangiz, xato aynan topiladi.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
        >
          Qayta urinish
        </button>
        <a href="/boshqaruv" className="text-sm text-matn-ikki hover:text-matn">
          Boshqaruvga qaytish
        </a>
      </div>
    </div>
  );
}
