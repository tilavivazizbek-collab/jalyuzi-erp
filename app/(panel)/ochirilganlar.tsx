'use client';

/**
 * app/(panel)/ochirilganlar.tsx — o'chirilgan yozuvlarni ko'rsatish
 * va qaytarish.
 *
 * ⚠️ O'CHIRILGAN YOZUV RO'YXATDA KO'RINMAYDI.
 *
 *    Ilgari u faqat kulrang bo'lib turardi. Egasi: «o'chirilgan
 *    mahsulotlar, mijozlar — faqat rangi o'zgarib qolyapti, o'zi
 *    ham uchsin».
 *
 *    To'g'ri: o'chirilgan narsa ro'yxatni to'ldirib turmasligi
 *    kerak — ayniqsa bir yildan keyin ular o'nlab bo'ladi.
 *
 * ⚠️ LEKIN QAYTARISH YO'LI QOLADI. Odam adashib o'chirsa, uni
 *    qaytara olishi kerak. Shuning uchun o'chirilganlar bor
 *    bo'lsagina kichik havola chiqadi.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { qaytarAmali } from './ochir-amal';
import type { OchiriladiganTur } from '@/lib/amal/nofaol';

/**
 * «O'chirilganlar (3)» havolasi.
 *
 * ⚠️ Manzil orqali ishlaydi (`?ochirilgan=1`), brauzer holati
 *    orqali emas: sahifa yangilansa ham holat saqlanadi va
 *    havolani boshqasiga yuborish mumkin.
 */
export function OchirilganlarHavolasi({
  soni,
  korsatilmoqda,
}: {
  soni: number;
  korsatilmoqda: boolean;
}) {
  const router = useRouter();

  /** ⚠️ Yo'q bo'lsa havola ham yo'q — ekran keraksiz narsa bilan to'lmasin */
  if (soni === 0 && !korsatilmoqda) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const u = new URL(window.location.href);
        if (korsatilmoqda) u.searchParams.delete('ochirilgan');
        else u.searchParams.set('ochirilgan', '1');
        router.push(`${u.pathname}${u.search}`);
      }}
      className="fokus rounded-maydon px-1.5 py-0.5 text-[12px] text-matn-kuchsiz transition-colors hover:text-matn hover:underline"
    >
      {korsatilmoqda ? 'Yashirish' : `O‘chirilganlar (${String(soni)})`}
    </button>
  );
}

export function QaytarTugma({
  tur,
  id,
  nom,
}: {
  tur: OchiriladiganTur;
  id: number;
  nom: string;
}) {
  const [xato, xatoniOzgartir] = useState<string | null>(null);
  const [kutilmoqda, boshla] = useTransition();
  const router = useRouter();

  if (xato !== null) {
    return (
      <span role="alert" className="text-[12px] text-belgi-qizil">
        {xato}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={kutilmoqda}
      onClick={() => {
        boshla(() => {
          void qaytarAmali(tur, id).then((n) => {
            if (n.holat === 'XATO') {
              xatoniOzgartir(n.sabab ?? "Qaytarib bo'lmadi");
              return;
            }
            router.refresh();
          });
        });
      }}
      aria-label={`${nom} — qaytarish`}
      className="fokus rounded-maydon px-1.5 py-0.5 text-[12px] text-brend transition-colors hover:underline disabled:opacity-60"
    >
      {kutilmoqda ? 'Qaytarilmoqda…' : 'Qaytarish'}
    </button>
  );
}
