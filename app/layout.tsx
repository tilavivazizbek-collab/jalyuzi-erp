import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './global.css';

export const metadata: Metadata = {
  title: 'Jalyuzi ERP',
  description: 'Jalyuzi ishlab chiqarish korxonasi boshqaruv tizimi',
};

export default function AsosiyQatlam({ children }: { children: ReactNode }) {
  // QISM 1 §19 — interfeys tili o'zbek (lotin)
  return (
    <html lang="uz">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
