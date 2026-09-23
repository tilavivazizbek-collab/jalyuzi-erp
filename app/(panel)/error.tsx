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

/**
 * ⚠️ DASTUR YANGILANGANDA CHIQADIGAN XATO — kod xatosi EMAS.
 *
 *    Next.js har yig'ishda server amallariga YANGI identifikator
 *    beradi. Deploy paytida brauzerda ochiq turgan sahifa eskisini
 *    so'raydi va 404 oladi:
 *
 *      UnrecognizedActionError: Server Action "60126…" was not
 *      found on the server
 *
 *    Bu holatda «xato raqami» ham, dasturchi ham kerak emas —
 *    sahifani yangilash yetadi. Umumiy xato xabarini ko'rsatish
 *    esa egasini behuda qo'rqitardi va u menga «sayt buzildi»
 *    deb yozardi (2026-09-20 da aynan shunday bo'ldi).
 */
function dasturYangilandimi(xato: Error): boolean {
  const matn = `${xato.name} ${xato.message}`;
  return (
    matn.includes('UnrecognizedActionError') ||
    matn.includes('Server Action') ||
    matn.includes('Failed to find Server Action')
  );
}

export default function PanelXatosi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /**
     * ⚠️ Dastur yangilangani XATO EMAS — uni «Panel xatosi» deb
     *    yozish jurnalni chalg'itardi va haqiqiy xatolar orasida
     *    yo'qolib ketardi.
     */
    if (dasturYangilandimi(error)) {
      console.info('Dastur yangilandi — sahifani yangilash kerak');
      return;
    }
    // Brauzer konsoliga — dasturchi ochsa to'liq ko'radi
    console.error('Panel xatosi:', error);
  }, [error]);

  /**
   * ⚠️ Dastur yangilangan bo'lsa — boshqa ekran: qo'rqinchli emas,
   *    bitta tugma bilan hal bo'ladi.
   */
  if (dasturYangilandimi(error)) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-karta border border-chegara bg-sirt p-6">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-matn">
          Dastur yangilandi
        </h1>

        <p className="text-sm text-matn-ikki">
          Siz ochgan sahifa eski nusxada qolgan. Yangilasangiz davom etasiz —
          kiritilgan ma&apos;lumotlaringizga hech narsa bo&apos;lmadi.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98]"
        >
          Sahifani yangilash
        </button>
      </div>
    );
  }

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
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98]"
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
