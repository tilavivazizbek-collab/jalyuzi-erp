'use client';

/**
 * app/(panel)/modal.tsx — o'rtada ochiladigan oyna.
 *
 * ⚠️ NEGA BROWSERNING O'Z `<dialog>` I
 *
 * Oynani oddiy `<div>` bilan yasash mumkin edi, lekin u holda
 * qo'lda yozish kerak bo'lardi: Escape bilan yopish, fokusni
 * ichkarida ushlab turish (Tab bosganda kursor orqadagi formaga
 * o'tib ketmasligi), orqadagi sahifani ekran o'quvchidan
 * yashirish, oynani eng ustda chizish.
 *
 * Brauzerning `<dialog>` elementi bularning HAMMASINI o'zi
 * qiladi va xatosiz qiladi. Qo'lda yozilgani esa deyarli doim
 * biror joyda buziladi.
 *
 * ⚠️ Fokus qaytishi ham brauzer zimmasida: oyna yopilgach kursor
 *    uni ochgan tugmaga qaytadi. Klaviatura bilan ishlaydigan
 *    odam joyini yo'qotmaydi.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  ochiq,
  yop,
  sarlavha,
  izoh,
  bolalar,
  keng = false,
}: {
  ochiq: boolean;
  yop: () => void;
  sarlavha: string;
  izoh?: string;
  bolalar: ReactNode;
  /** Kengroq forma uchun (masalan material kartochkasi) */
  keng?: boolean;
}) {
  const oyna = useRef<HTMLDialogElement>(null);

  /**
   * ⚠️ Server tomonda `document` yo'q. Portal faqat brauzerda
   *    ochiladi, shuning uchun birinchi chizishdan keyin.
   */
  const [tayyor, tayyorniOzgartir] = useState(false);
  useEffect(() => {
    tayyorniOzgartir(true);
  }, []);

  useEffect(() => {
    const d = oyna.current;
    if (d === null) return;

    if (ochiq && !d.open) {
      /**
       * ⚠️ `showModal()` — `show()` emas. Faqat u fokusni ushlaydi
       *    va orqadagi sahifani «inert» qiladi.
       */
      d.showModal();
    } else if (!ochiq && d.open) {
      d.close();
    }
  }, [ochiq]);

  /**
   * ⚠️ Orqadagi sahifa aylanmasin: oyna ichida uzun forma bo'lsa,
   *    g'ildirak orqadagi ro'yxatni surib yuborardi va odam
   *    oynani yopgach butunlay boshqa joyda turardi.
   */
  useEffect(() => {
    if (!ochiq) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = eski;
    };
  }, [ochiq]);

  if (!tayyor) return null;

  /**
   * ⚠️ MODAL `document.body` GA CHIQARILADI.
   *
   *    Sotuv ekrani butunlay bitta `<form>` ichida turadi. Modal
   *    o'sha joyda chizilsa, uning ichidagi forma FORMA ICHIDAGI
   *    FORMA bo'lib qolardi — bu HTML da taqiqlangan va brauzer
   *    ikkalasini ham buzadi: «Saqlash» bosilganda tashqi forma
   *    yuborilib ketardi.
   */
  return createPortal(
    <dialog
      ref={oyna}
      /**
       * ⚠️ Escape bosilganda brauzer oynani O'ZI yopadi, lekin
       *    React holati ochiq bo'lib qolardi — keyingi safar
       *    tugma bosilganda oyna ochilmasdi. `onCancel` shu
       *    holatni ham yangilaydi.
       */
      onCancel={(e) => {
        e.preventDefault();
        yop();
      }}
      onClose={yop}
      onClick={(e) => {
        /**
         * ⚠️ Tashqariga bosilsa yopiladi. `<dialog>` ning o'zi
         *    butun ekranni egallaydi, ichkaridagi quti esa
         *    kichikroq — shuning uchun aynan DIALOG ning o'ziga
         *    bosilgani tekshiriladi.
         */
        if (e.target === oyna.current) yop();
      }}
      aria-labelledby="modal-sarlavha"
      className={`w-[92vw] rounded-karta border border-chegara bg-sirt p-0 text-matn shadow-xl backdrop:bg-matn/40 ${
        keng ? 'max-w-3xl' : 'max-w-lg'
      }`}
    >
      {/*
        ⚠️ Ichki quti alohida: `<dialog>` ga to'g'ridan-to'g'ri
           `overflow` berilsa Safari da chegara buziladi.
      */}
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-chegara bg-sirt px-5 py-4">
          <div>
            <h2 id="modal-sarlavha" className="text-[15px] font-semibold text-matn">
              {sarlavha}
            </h2>
            {izoh !== undefined && (
              <p className="mt-0.5 text-[12px] text-matn-kuchsiz">{izoh}</p>
            )}
          </div>

          <button
            type="button"
            onClick={yop}
            aria-label="Yopish"
            className="fokus -mr-1 -mt-1 rounded-maydon px-2 py-1 text-[18px] leading-none text-matn-kuchsiz transition-colors hover:bg-fon hover:text-matn"
          >
            ✕
          </button>
        </div>

        {/*
          ⚠️ Ichi FAQAT ochiq bo'lganda chiziladi. Aks holda yarim
             to'ldirilgan forma yopilgandan keyin ham holatida
             qolib ketardi va keyingi safar eski ma'lumot bilan
             ochilardi.
        */}
        <div className="px-5 py-4">{ochiq ? bolalar : null}</div>
      </div>
    </dialog>,
    document.body,
  );
}
