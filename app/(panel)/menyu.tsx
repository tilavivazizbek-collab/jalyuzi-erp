'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface MenyuBandi {
  readonly yol: string;
  readonly nom: string;
}

/**
 * Yon menyu.
 *
 * Bandlar SERVERDA filtrlanadi — foydalanuvchida ruxsati yo'q bo'lim
 * bu yerga umuman kelmaydi. Yashirish o'zi himoya emas (§9.4), lekin
 * yopiq eshikni ko'rsatib turishning ham ma'nosi yo'q.
 */
export function Menyu({ bandlar }: { bandlar: readonly MenyuBandi[] }) {
  const yol = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {bandlar.map((b) => {
        const faol = yol === b.yol || yol.startsWith(`${b.yol}/`);
        return (
          <Link
            key={b.yol}
            href={b.yol}
            aria-current={faol ? 'page' : undefined}
            className={`rounded-md px-2.5 py-1.5 text-sm transition ${
              faol
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {b.nom}
          </Link>
        );
      })}
    </nav>
  );
}
