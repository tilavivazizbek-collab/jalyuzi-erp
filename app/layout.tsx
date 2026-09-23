import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import './global.css';
import { KORINISH_COOKIE, korinishAtributi, korinishTekshir } from './korinish';

/**
 * ⚠️ `next/font` shriftni QURISH PAYTIDA o'z serverimizga yuklaydi.
 *    Ishlaganda Google ga so'rov ketmaydi — `docker compose up`
 *    bilan loqal to'liq ishlaydi (QISM 1).
 *
 * ⚠️ `display: swap` — shrift kelmaguncha tizim shrifti ko'rinadi.
 *    Sotuvchi bo'sh ekranga qarab turmaydi.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Jalyuzi ERP',
  description: 'Jalyuzi ishlab chiqarish korxonasi boshqaruv tizimi',
};

export default async function AsosiyQatlam({ children }: { children: ReactNode }) {
  /**
   * KUN yoki TUN — SERVERDA hal qilinadi.
   *
   * ⚠️ NEGA SERVERDA: agar tanlovni brauzerdagi skript qo'ysa,
   *    sahifa avval kunduzgi holda chizilib, keyin tunga o'tardi —
   *    har ochilganda ko'zni uradigan oq chaqnash. Atribut HTML
   *    bilan birga kelsa, birinchi chizishning o'zi to'g'ri
   *    bo'ladi.
   *
   * ⚠️ Tanlov qilinmagan bo'lsa atribut umuman qo'yilmaydi va
   *    ko'rinishni kompyuterning o'z sozlamasi hal qiladi
   *    (`app/global.css` — `color-scheme: light dark`).
   */
  const saqlagich = await cookies();
  const korinish = korinishTekshir(saqlagich.get(KORINISH_COOKIE)?.value);

  // QISM 1 §19 — interfeys tili o'zbek (lotin)
  return (
    <html lang="uz" className={inter.variable} data-korinish={korinishAtributi(korinish)}>
      <body className="bg-sirt text-matn antialiased">{children}</body>
    </html>
  );
}
