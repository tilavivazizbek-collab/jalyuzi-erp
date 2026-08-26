'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export interface MenyuBandi {
  readonly yol: string;
  readonly nom: string;
}

export interface MenyuGuruhi {
  readonly nom: string;
  readonly bandlar: readonly MenyuBandi[];
}

/**
 * Chap yon menyu.
 *
 * ⚠️ Ilgari 16 ta bo'lim sarlavhada BIR QATORDA turardi: ular
 *    o'ralib ketardi, guruhsiz edi va qaysi biri qaysi ishga
 *    tegishli ekani bilinmasdi.
 *
 *    Endi chap panelda va GURUHLANGAN: kunlik ish · ombor · pul ·
 *    ma'lumotnoma. Odam «kirim qayerda?» deb butun ro'yxatni
 *    o'qib chiqmaydi.
 *
 * ⚠️ Bandlar SERVERDA filtrlanadi — ruxsati yo'q bo'lim bu yerga
 *    umuman kelmaydi. Yashirish o'zi himoya emas (§9.4), lekin
 *    yopiq eshikni ko'rsatib turishning ham ma'nosi yo'q.
 */
export function Menyu({ guruhlar }: { guruhlar: readonly MenyuGuruhi[] }) {
  const yol = usePathname();
  const [ochiq, ochiqniOzgartir] = useState(false);

  const hammaBand = guruhlar.flatMap((g) => g.bandlar);

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
        <div className="flex flex-col gap-6 px-3 py-5">
          {guruhlar.map((g) => (
            <div key={g.nom} className="flex flex-col gap-0.5">
              {/*
                ⚠️ Guruh sarlavhasi mayda va kuchsiz: u YO'L
                   KO'RSATADI, e'tibor tortmaydi. E'tibor bandlarda
                   bo'lishi kerak.
              */}
              <p className="mb-1 px-2.5 text-[11px] font-medium tracking-[0.04em] text-matn-kuchsiz uppercase">
                {g.nom}
              </p>

              {g.bandlar.map((b) => {
                const faol = eng === b.yol && eng !== '';
                return (
                  <Link
                    key={b.yol}
                    href={b.yol}
                    onClick={() => {
                      ochiqniOzgartir(false);
                    }}
                    aria-current={faol ? 'page' : undefined}
                    className={`rounded-[6px] px-2.5 py-[7px] text-[13px] transition-colors ${
                      faol
                        ? 'bg-brend-fon font-medium text-brend'
                        : 'text-matn-ikki hover:bg-fon hover:text-matn'
                    }`}
                  >
                    {b.nom}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
