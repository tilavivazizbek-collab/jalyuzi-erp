'use client';

/**
 * app/(panel)/yuklanish.tsx — bosilgan ZAHOTI ko'rinadigan javob.
 *
 * ⚠️ Muammo: havola bosilganda hech narsa o'zgarmasdi. Sahifa
 *    skeleti faqat server javob bera boshlaganda chiqadi — masofadagi
 *    bazada bu bir necha soniya. Oradagi jimlikda odam «bosilmadi»
 *    deb o'ylab qayta bosardi.
 *
 * ⚠️ `useLinkStatus` — Next.js ning rasmiy yo'li. U bosilgan zahoti
 *    `pending` beradi, sahifa kelishini kutmaydi.
 */

import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import type { ReactNode } from 'react';

/**
 * Yuqoridagi ingichka chiziq — sahifa yuklanayotganini bildiradi.
 *
 * ⚠️ Chiziq oxirigacha bormaydi, 90% da to'xtaydi: sahifa kelganda
 *    u yo'qoladi. Aks holda «tugadi» deb ko'rsatib, keyin yana
 *    kutishga majbur qilardi.
 */
function Chiziq() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <span className="block h-full w-full origin-left animate-[yuklanish_1.2s_ease-out_forwards] bg-brend" />
    </span>
  );
}

/** Bosilgan havolaning O'ZI ham kuchsizlashadi — qaysi biri bosilgani ko'rinadi. */
function Kuchsizlanish() {
  const { pending } = useLinkStatus();
  return pending ? 'opacity-60' : '';
}

/**
 * Menyu havolasi.
 *
 * Bosilganda ikki narsa darhol bo'ladi:
 *   1. Yuqorida chiziq yuguradi
 *   2. Bosilgan band kuchsizlashadi
 */
export function MenyuHavolasi({
  href,
  faol,
  onClick,
  children,
}: {
  href: string;
  faol: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={faol ? 'page' : undefined}
      className={`fokus rounded-maydon px-2.5 py-[7px] text-[13px] transition-colors ${
        faol
          ? 'bg-brend font-medium text-white'
          : 'text-matn-ikki hover:bg-brend-fon hover:text-brend'
      }`}
    >
      <Chiziq />
      <Belgi>{children}</Belgi>
    </Link>
  );
}

/** Ichkarida turadi, chunki `useLinkStatus` faqat `Link` ichida ishlaydi. */
function Belgi({ children }: { children: ReactNode }) {
  const kuchsiz = Kuchsizlanish();
  return <span className={`block transition-opacity ${kuchsiz}`}>{children}</span>;
}

/**
 * Oddiy havola — jadval qatoridagi, kartochkadagi va boshqalar.
 *
 * ⚠️ Bu ham chiziqni ishga tushiradi: qaysi havola bosilishidan
 *    qat'i nazar, odam tizim javob berayotganini ko'radi.
 */
export function Havola({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      <Chiziq />
      <Belgi>{children}</Belgi>
    </Link>
  );
}
