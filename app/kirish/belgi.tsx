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
      {/* Panjaralar — yuqoridan pastga qarab kengayadi */}
      <rect x="10" y="11" width="20" height="3" rx="1.5" fill="white" opacity="0.55" />
      <rect x="10" y="17" width="20" height="3" rx="1.5" fill="white" opacity="0.75" />
      <rect x="10" y="23" width="20" height="3" rx="1.5" fill="white" />
      {/* Tortqich */}
      <rect x="27" y="26" width="2" height="5" rx="1" fill="white" opacity="0.75" />
    </svg>
  );
}
