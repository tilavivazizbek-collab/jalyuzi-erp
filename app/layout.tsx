import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './global.css';

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

export default function AsosiyQatlam({ children }: { children: ReactNode }) {
  // QISM 1 §19 — interfeys tili o'zbek (lotin)
  return (
    <html lang="uz" className={inter.variable}>
      <body className="bg-sirt text-matn antialiased">{children}</body>
    </html>
  );
}
