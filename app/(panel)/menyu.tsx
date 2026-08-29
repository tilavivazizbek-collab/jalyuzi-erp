'use client';

import { usePathname } from 'next/navigation';
import { MenyuHavolasi } from './yuklanish';
import { useState } from 'react';

export interface MenyuBandi {
  readonly yol: string;
  readonly nom: string;
}

export interface MenyuGuruhi {
  /** Bo'sh nom — guruhsiz band (Boshqaruv, Kassa) */
  readonly nom: string;
  readonly bandlar: readonly MenyuBandi[];
}

/**
 * Chap yon menyu — ICHMA-ICH BO'LIMLAR.
 *
 * ⚠️ Guruh BOSILGANDA ochiladi/yopiladi. Ochiq turgan guruh —
 *    hozir qaysi ekranda turgan bo'lsa o'sha. Odam sahifani
 *    ochganda o'zi qayerdaligini darrov ko'radi.
 *
 * ⚠️ Qo'lda ochilgan/yopilgan holat ESLAB QOLINADI: odam guruhni
 *    yopsa, boshqa sahifaga o'tganda u qayta ochilib ketmasin.
 *
 * ⚠️ Bandlar SERVERDA filtrlanadi — ruxsati yo'q bo'lim bu yerga
 *    umuman kelmaydi. Yashirish o'zi himoya emas (§9.4), lekin
 *    yopiq eshikni ko'rsatib turishning ham ma'nosi yo'q.
 */
export function Menyu({ guruhlar }: { guruhlar: readonly MenyuGuruhi[] }) {
  const yol = usePathname();
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [qolda, qoldaOzgartir] = useState<Record<string, boolean>>({});

  /**
   * ⚠️ Aniqrog'i yutadi: `/buyurtma/yangi` ochilganda «Buyurtmalar
   *    tarixi» ham yonib turmasin. Solishtirish BARCHA guruhlar
   *    bo'ylab — eng uzun mos yo'l g'olib.
   */
  const eng = guruhlar
    .flatMap((g) => g.bandlar)
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
          {guruhlar.map((g) => {
            /** Shu guruh ichida hozirgi sahifa bormi */
            const guruhFaol = g.bandlar.some((b) => b.yol === eng) && eng !== '';

            /** Qo'lda tegilmagan bo'lsa — faol guruh ochiq turadi */
            const yoyilgan = qolda[g.nom] ?? guruhFaol;

            const havolalar = g.bandlar.map((b) => (
              <MenyuHavolasi
                key={b.yol}
                href={b.yol}
                faol={eng === b.yol && eng !== ''}
                onClick={() => {
                  ochiqniOzgartir(false);
                }}
              >
                {b.nom}
              </MenyuHavolasi>
            ));

            /** Guruhsiz band — sarlavhasiz, to'g'ridan-to'g'ri havola */
            if (g.nom === '') {
              return (
                <div key={g.bandlar[0]?.yol ?? g.nom} className="contents">
                  {havolalar}
                </div>
              );
            }

            return (
              <div key={g.nom} className="mt-1.5 first:mt-0">
                <button
                  type="button"
                  onClick={() => {
                    qoldaOzgartir((o) => ({ ...o, [g.nom]: !yoyilgan }));
                  }}
                  aria-expanded={yoyilgan}
                  className={`fokus flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-fon ${
                    guruhFaol ? 'text-matn' : 'text-matn-ikki'
                  }`}
                >
                  <span>{g.nom}</span>
                  {/*
                    ⚠️ Belgi burchak bilan aylanadi — ochiq/yopiq
                       holat bir qarashda ko'rinsin.
                  */}
                  <span
                    aria-hidden
                    className={`text-[10px] text-matn-kuchsiz transition-transform ${
                      yoyilgan ? 'rotate-90' : ''
                    }`}
                  >
                    ▶
                  </span>
                </button>

                {yoyilgan && (
                  <div className="mt-0.5 ml-3 flex flex-col gap-0.5 border-l border-chegara pl-2">
                    {havolalar}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
