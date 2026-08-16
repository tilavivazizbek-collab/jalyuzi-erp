import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Jalyuzi ERP',
  description: 'Jalyuzi ishlab chiqarish korxonasi boshqaruv tizimi',
};

export default function AsosiyQatlam({ children }: { children: ReactNode }) {
  // QISM 1 §19 — interfeys tili o'zbek (lotin)
  return (
    <html lang="uz">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          margin: 0,
          padding: '2rem',
        }}
      >
        {children}
      </body>
    </html>
  );
}
