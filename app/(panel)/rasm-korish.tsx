'use client';

/**
 * app/(panel)/rasm-korish.tsx — rasmni kattalashtirib ko'rish.
 *
 * ⚠️ NEGA KERAK (egasi, 2026-08-29): «matoning rasmini ochib
 *    ko'rmoqchi bo'lsam, u rasmdan qaytib chiqib bo'lmayapti».
 *
 *    Ilgari rasm YANGI OYNADA ochilardi (`target="_blank"`) —
 *    brauzer o'sha manzilga o'tib ketardi va u yerda faqat rasm
 *    turardi: na sarlavha, na tugma. Telefonda esa orqaga
 *    qaytish tugmasi ham har doim ko'rinmaydi.
 *
 *    Endi rasm SHU SAHIFANING ustida ochiladi va uch xil yo'l
 *    bilan yopiladi: «Yopish» tugmasi, Escape tugmasi, rasmning
 *    yonini bosish. Sotuvchi mijoz oldida turib adashib
 *    qolmasin (3.3).
 */

import { useState } from 'react';
import { Modal } from './modal';

export function RasmKorish({
  manzil,
  nom,
  olcham = 'size-12',
}: {
  manzil: string;
  /** Mijozga ko'rsatiladigan nom — modal sarlavhasi ham shu */
  nom: string;
  /** Kichik rasmning o'lchami — Tailwind sinfi */
  olcham?: string;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        title="Kattalashtirish"
        aria-label={`${nom} — rasmini kattalashtirish`}
        className="fokus block w-fit rounded-maydon transition-transform active:scale-[0.97]"
      >
        <img
          src={manzil}
          alt={nom}
          loading="lazy"
          className={`${olcham} rounded-maydon border border-chegara object-cover`}
        />
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha={nom}
        keng
        bolalar={
          <div className="flex flex-col items-center gap-4">
            {/*
              ⚠️ Balandlik ekranga bog'liq: uzun rasm modaldan
                 chiqib ketib, «Yopish» tugmasi ko'rinmay
                 qolmasligi kerak.
            */}
            <img
              src={manzil}
              alt={nom}
              className="max-h-[65vh] w-auto max-w-full rounded-karta border border-chegara object-contain"
            />

            <button
              type="button"
              onClick={() => {
                ochiqniOzgartir(false);
              }}
              className="fokus rounded-maydon bg-brend px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
            >
              Yopish
            </button>
          </div>
        }
      />
    </>
  );
}
