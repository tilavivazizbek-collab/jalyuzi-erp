'use client';

/**
 * LOYIHA T-04 — sotuv paytida kesim ko'rinishi. 2026-10-14
 *
 * «Bu kesimdan 0.60 × 2.00 ostatka qoladi» — mijoz bilan o'lchamni 5 sm
 * o'zgartirib kelishilsa butun bo'lak saqlanadi.
 *
 * ⚠️ Faqat MASLAHAT: hech narsa band qilinmaydi va bloklanmaydi. Bo'lakni
 *    orada boshqa buyurtma olishi mumkin — haqiqiy kesimni usta oladi.
 */

import { useEffect, useRef, useState } from 'react';
import type { KesimKorinishi, KorinishManbasi } from '@/lib/domain/kesish';
import { kesimKorinishiAmali, type KesimSorovi } from './amal';

const MANBA_NOMI: Record<KorinishManbasi, string> = {
  OSTATKA: 'ostatka',
  OCHILGAN_RULON: 'ochilgan rulon',
  YANGI_RULON: 'yangi rulon',
};

const o = (x: { eniM: number; boyiM: number }): string => `${x.eniM.toFixed(2)} × ${x.boyiM.toFixed(2)}`;

type Holat =
  | { readonly tur: 'KUTILMOQDA' }
  | {
      readonly tur: 'TAYYOR';
      readonly kerak: { eniM: number; boyiM: number };
      readonly natija: KesimKorinishi | null;
    }
  | { readonly tur: 'YOQ' };

export function KesimKorinishSatri({ sorov }: { sorov: KesimSorovi }) {
  const [holat, holatniOzgartir] = useState<Holat>({ tur: 'KUTILMOQDA' });
  /** Eski javob yangisining ustiga yozilmasin — faqat oxirgi so'rov hisoblanadi */
  const oxirgi = useRef(0);
  const kalit = JSON.stringify(sorov);

  useEffect(() => {
    const raqam = ++oxirgi.current;
    holatniOzgartir({ tur: 'KUTILMOQDA' });
    const t = setTimeout(() => {
      kesimKorinishiAmali(JSON.parse(kalit) as KesimSorovi)
        .then((j) => {
          if (raqam !== oxirgi.current) return;
          holatniOzgartir(
            j === null ? { tur: 'YOQ' } : { tur: 'TAYYOR', kerak: j.kerak, natija: j.natija },
          );
        })
        .catch(() => {
          if (raqam === oxirgi.current) holatniOzgartir({ tur: 'YOQ' });
        });
    }, 400);
    return () => {
      clearTimeout(t);
    };
  }, [kalit]);

  if (holat.tur === 'YOQ') return null;
  if (holat.tur === 'KUTILMOQDA') {
    return <p className="text-xs text-matn-kuchsiz">Kesim hisoblanmoqda…</p>;
  }

  const n = holat.natija;
  if (n === null) {
    return (
      <p className="text-xs text-belgi-sariq">
        Kesim {o(holat.kerak)} — omborda bunga butun bo&apos;lak yo&apos;q, pozitsiya «Materialga
        kutmoqda» ga tushadi (8.12).
      </p>
    );
  }

  return (
    <p className="text-xs text-matn-ikki">
      ✂ Kesim {o(holat.kerak)} — {MANBA_NOMI[n.manba]}{' '}
      <span className="font-mono">{n.bolakKod}</span> ({o(n.bolak)}) dan
      {n.aniqMos ? (
        <span className="text-belgi-yashil"> — to&apos;liq ishlatiladi, hech narsa qolmaydi</span>
      ) : (
        <>
          {' → qoladi: '}
          {n.qoladi.map((q, i) => (
            <span key={i}>
              {i > 0 && ', '}
              <span
                className={
                  q.daraja === 'YAROQSIZ'
                    ? 'text-belgi-qizil'
                    : q.daraja === 'KAM_ISHLATILADIGAN'
                      ? 'text-belgi-sariq'
                      : ''
                }
              >
                {o(q)}
                {q.daraja === 'YAROQSIZ'
                  ? ' (chiqindi)'
                  : q.daraja === 'KAM_ISHLATILADIGAN'
                    ? ' (kam ishlatiladigan)'
                    : ''}
              </span>
            </span>
          ))}
        </>
      )}
    </p>
  );
}
