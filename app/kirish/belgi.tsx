/**
 * Brend belgisi — jalyuzi panjaralari.
 *
 * ⚠️ Rasm fayli EMAS, SVG: har o'lchamda tiniq chiqadi, rangni
 *    dizayn tizimidan oladi va yuklanishini kutish kerak emas.
 *
 * ⚠️ Shakl mahsulotning o'zidan olingan — gorizontal panjaralar.
 *    Umumiy «quticha» belgisidan ko'ra korxona nima qilishini
 *    aytadi.
 */
export function BrendBelgisi({ olcham = 40 }: { olcham?: number }) {
  return (
    <svg
      width={olcham}
      height={olcham}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Jalyuzi ERP"
    >
      <rect width="40" height="40" rx="10" fill="var(--color-brend)" />
      {/*
        Panjaralar — yuqoridan pastga qarab kengayadi.

        ⚠️ Panjara rangi `oq` EMAS, `tugma-matn`. Tunda brend
           kvadrati yorishadi va oq panjara uning ustida yo'qolib
           ketardi — belgi bo'm-bo'sh siyohrang kvadratga
           aylanardi. `tugma-matn` tunda qoraga o'tadi va
           panjaralar ko'rinib turadi.
      */}
      <rect
        x="10"
        y="11"
        width="20"
        height="3"
        rx="1.5"
        fill="var(--color-tugma-matn)"
        opacity="0.55"
      />
      <rect
        x="10"
        y="17"
        width="20"
        height="3"
        rx="1.5"
        fill="var(--color-tugma-matn)"
        opacity="0.75"
      />
      <rect x="10" y="23" width="20" height="3" rx="1.5" fill="var(--color-tugma-matn)" />
      {/* Tortqich */}
      <rect
        x="27"
        y="26"
        width="2"
        height="5"
        rx="1"
        fill="var(--color-tugma-matn)"
        opacity="0.75"
      />
    </svg>
  );
}
