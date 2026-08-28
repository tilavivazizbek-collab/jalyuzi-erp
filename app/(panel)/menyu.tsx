'use client';

import { usePathname } from 'next/navigation';
import { MenyuHavolasi } from './yuklanish';
import { useState } from 'react';

export interface MenyuBandi {
  readonly yol: string;
  readonly nom: string;
}

/**
 * Chap yon menyu.
 *
 * ⚠️ BITTA RO'YXAT, guruhlarsiz. Guruh sarlavhalari («Ish»,
 *    «Ombor», «Pul») joy egallardi va odam baribir kerakli bandni
 *    ko'zi bilan qidirardi — egasi ularni olib tashlashni so'radi.
 *
 *    Tartib chastota bo'yicha: eng ko'p ochiladigan ekran tepada
 *    (`layout.tsx` dagi `BANDLAR`).
 *
 * ⚠️ Bandlar SERVERDA filtrlanadi — ruxsati yo'q bo'lim bu yerga
 *    umuman kelmaydi. Yashirish o'zi himoya emas (§9.4), lekin
 *    yopiq eshikni ko'rsatib turishning ham ma'nosi yo'q.
 */
export function Menyu({ bandlar }: { bandlar: readonly MenyuBandi[] }) {
  const yol = usePathname();
  const [ochiq, ochiqniOzgartir] = useState(false);

  const hammaBand = bandlar;

  /**
   * ⚠️ Aniqrog'i yutadi: `/ombor/kirim` ochilganda «Ombor» ham,
   *    «Kirimlar» ham yonib turmasin.
   */
  const eng = hammaBand
    .filter((d) => yol === d.yol || yol.startsWith(`${d.yol}/`))
    .reduce<string>((u, d) => (d.yol.length > u.length ? d.yol : u), '');

  return (
    <>
      {/* Mobil — ochish tugmasi */}
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(!ochiq);
        }}
        className="fokus fixed top-3 left-3 z-30 rounded-[6px] border border-chegara bg-sirt px-3 py-2 text-[13px] font-medium text-matn-ikki lg:hidden"
        aria-expanded={ochiq}
      >
        {ochiq ? 'Yopish' : 'Menyu'}
      </button>

      {/* Mobilda menyu ochilganda orqa fon */}
      {ochiq && (
        <button
          type="button"
          aria-label="Menyuni yopish"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="fixed inset-0 z-30 bg-matn/20 lg:hidden"
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto border-r border-chegara bg-sirt transition-transform lg:translate-x-0 ${
          ochiq ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-0.5 px-3 py-5">
          {bandlar.map((b) => {
            const faol = eng === b.yol && eng !== '';
            return (
              <MenyuHavolasi
                key={b.yol}
                href={b.yol}
                faol={faol}
                onClick={() => {
                  ochiqniOzgartir(false);
                }}
              >
                {b.nom}
              </MenyuHavolasi>
            );
          })}
        </div>
      </nav>
    </>
  );
}
