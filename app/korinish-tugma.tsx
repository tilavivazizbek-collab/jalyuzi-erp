'use client';

/**
 * app/korinish-tugma.tsx — KUN / TUN almashtirgichi.
 *
 * ⚠️ UCHTA TUGMA, aylanma kalit EMAS. Aylanma kalitda («bosgan
 *    sari keyingisiga o'tadi») odam «tizim» ga tushib qolsa nima
 *    bo'lganini tushunmaydi: ekran goh o'zgaradi, goh o'zgarmaydi.
 *    Uchta tugmada esa qaysi holat yoqilgani KO'RINIB turadi va
 *    istalganiga bir bosishda boriladi.
 *
 * ⚠️ SAHIFA QAYTA YUKLANMAYDI. Tugma bosilganda ikki ish bo'ladi:
 *    `<html>` dagi atribut almashtiriladi (ekran shu zahoti
 *    o'zgaradi) va cookie yoziladi (keyingi safar shu ko'rinishda
 *    ochiladi). Serverga borilmaydi — masofadagi baza tufayli u
 *    2–3 soniya kutish degani bo'lardi.
 *
 * ⚠️ Boshlang'ich holat SERVERDAN prop bilan keladi. Brauzerda
 *    cookie ni o'qib olish ham mumkin edi, lekin unda serverning
 *    chizgani bilan brauzerning chizgani birinchi lahzada farq
 *    qilib, React ogohlantirish berardi.
 */

import { useState } from 'react';
import {
  KORINISHLAR,
  KORINISH_COOKIE,
  KORINISH_NOMI,
  korinishAtributi,
  type Korinish,
} from './korinish';

/** Sessiya cookie si bilan bir xil — brauzerlar qabul qiladigan eng uzun muddat. */
const COOKIE_UMRI_SONIYA = 400 * 86_400;

/**
 * ⚠️ Belgilar ichkarida chiziladi: §12 — stek o'zgartirilmaydi,
 *    ya'ni belgilar kutubxonasi qo'shilmaydi. Ular oflaynda ham
 *    chiziladi va rangni `currentColor` dan oladi, shuning uchun
 *    faol/nofaol holatda o'z-o'zidan to'g'ri rangga kiradi.
 */
function Belgi({ korinish }: { korinish: Korinish }) {
  const umumiy = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (korinish === 'kun') {
    // Quyosh
    return (
      <svg {...umumiy}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (korinish === 'tun') {
    // Oy
    return (
      <svg {...umumiy}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    );
  }

  // Monitor — kompyuterning o'z sozlamasi
  return (
    <svg {...umumiy}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function KorinishTugmasi({ joriy }: { joriy: Korinish }) {
  const [tanlangan, tanlanganniOzgartir] = useState<Korinish>(joriy);

  function almashtir(yangi: Korinish) {
    tanlanganniOzgartir(yangi);

    /*
     * ⚠️ Atribut O'CHIRILADI, bo'sh qiymatga qo'yilmaydi: CSS da
     *    «atribut yo'q» degani «kompyuterdan so'ra» degani.
     *    `data-korinish=""` esa hech qaysi qoidaga tushmaydi va
     *    ekran kunduzgi holatda qotib qolardi.
     */
    const atribut = korinishAtributi(yangi);
    if (atribut === undefined) {
      document.documentElement.removeAttribute('data-korinish');
    } else {
      document.documentElement.dataset.korinish = atribut;
    }

    /*
     * ⚠️ `SameSite=Lax` — sessiya cookie si bilan bir xil qoida.
     *    `Secure` faqat HTTPS da qo'yiladi: loqal ishlab chiqish
     *    `http://localhost` da boradi va u yerda `Secure` cookie
     *    umuman yozilmaydi.
     */
    const himoya = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${KORINISH_COOKIE}=${yangi}; Path=/; Max-Age=${String(COOKIE_UMRI_SONIYA)}; SameSite=Lax${himoya}`;
  }

  return (
    <div
      role="group"
      aria-label="Ekran ko'rinishi"
      className="inline-flex items-center gap-0.5 rounded-full border border-chegara bg-fon p-0.5"
    >
      {KORINISHLAR.map((k) => {
        const faol = k === tanlangan;
        return (
          <button
            key={k}
            type="button"
            onClick={() => {
              almashtir(k);
            }}
            aria-pressed={faol}
            /*
             * ⚠️ Nom faqat o'qish dasturi va sichqoncha uchun:
             *    yonma-yon uchta so'z yozilsa sarlavha qatori
             *    to'lib ketardi, ayniqsa telefonda.
             */
            title={KORINISH_NOMI[k]}
            /*
             * ⚠️ Faol tugma BO'YALGAN fon oladi, oq emas. Oq
             *    kvadratchaning kulrang lenta ustidagi farqi
             *    juda kichik edi — qaysi ko'rinish yoqilgani
             *    bir qarashda bilinmasdi.
             */
            className={`fokus flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
              faol ? 'bg-brend-fon text-brend' : 'text-matn-kuchsiz hover:text-matn'
            }`}
          >
            <Belgi korinish={k} />
            <span className="sr-only">{KORINISH_NOMI[k]}</span>
          </button>
        );
      })}
    </div>
  );
}
