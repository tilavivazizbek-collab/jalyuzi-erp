'use client';

/**
 * Oylik tushum — oy boshidan yig'ilib boruvchi, o'tgan oy bilan. TZ 11.3. 2026-10-17
 *
 * ⚠️ NEGA YIG'ILIB BORUVCHI: kunlik tushum sakrab turadi (bir kun 0, ertasi
 *    katta buyurtma) va ikki oyni ustma-ust qo'yganda o'qib bo'lmaydi. Yig'ilgan
 *    chiziq «o'tgan oyning shu kunidan oldindamizmi» degan savolga bir qarashda
 *    javob beradi.
 * ⚠️ Bitta o'q (so'm). Ikki qator: bu oy — brend, yaxlit; o'tgan oy —
 *    solishtirma token, uzuq. Rangdan tashqari chiziq turi va chiziq oxiridagi
 *    yozuv ham ajratadi (rang ko'rlik va chop etish uchun).
 * ⚠️ Kursor bilan: vertikal chiziq va kun bo'yicha ikki qiymat.
 */

import { useState } from 'react';
import { pulKorsat, som } from '@/lib/domain/pul';
import type { TrendKuni } from './trend';

const KENG = 720;
const BALAND = 220;
const CHAP = 64;
const ONG = 76;
const TEPA = 12;
const PAST = 26;

const pul = (x: string): string => pulKorsat(som(x));
const qisqa = (n: number): string => {
  const a = Math.abs(n);
  return a >= 1e9 ? `${(a / 1e9).toFixed(1)} mlrd` : a >= 1e6 ? `${(a / 1e6).toFixed(1)} mln` : a >= 1e3 ? `${(a / 1e3).toFixed(0)} ming` : a.toFixed(0);
};

export function TrendGrafik({ kunlar }: { kunlar: readonly TrendKuni[] }) {
  const [tanlangan, setTanlangan] = useState<number | null>(null);
  if (kunlar.length < 2) return null;

  // ⚠️ Faqat CHIZISH uchun son (piksel); summa matni Decimal'dan keladi
  const qiymatlar = kunlar.flatMap((k) => [k.joriy, k.otgan]).filter((v): v is string => v !== null).map(Number);
  const eng = Math.max(1, ...qiymatlar) * 1.08;
  const x = (i: number): number => CHAP + (i / (kunlar.length - 1)) * (KENG - CHAP - ONG);
  const y = (v: number): number => TEPA + ((eng - v) / eng) * (BALAND - TEPA - PAST);
  const yol = (kalit: 'joriy' | 'otgan'): string => {
    let d = '';
    kunlar.forEach((k, i) => {
      const v = k[kalit];
      if (v === null) return;
      d += `${d === '' ? 'M' : 'L'}${x(i).toFixed(1)},${y(Number(v)).toFixed(1)} `;
    });
    return d.trim();
  };
  const oxirgi = (kalit: 'joriy' | 'otgan'): { i: number; v: number } | null => {
    for (let i = kunlar.length - 1; i >= 0; i--) {
      const v = kunlar[i]?.[kalit];
      if (v !== null && v !== undefined) return { i, v: Number(v) };
    }
    return null;
  };
  const oxJ = oxirgi('joriy');
  const oxO = oxirgi('otgan');
  const belgilar = [eng, eng / 2, 0].map((v) => ({ v, py: y(v) }));
  const xBelgilar = [1, 10, 20, kunlar.length].filter((d, i, a) => a.indexOf(d) === i && d <= kunlar.length);
  const t = tanlangan === null ? null : kunlar[tanlangan];
  const yO = oxO === null ? 0 : y(oxO.v);
  // «Bu oy» yozuvi o'tgan oy chizig'iga tegmasin — bo'sh tomonga qo'yiladi
  const otganShuKun = oxJ === null ? null : kunlar[oxJ.i]?.otgan;
  const otganTepadami =
    oxJ !== null && otganShuKun !== null && otganShuKun !== undefined && Number(otganShuKun) >= oxJ.v;
  // Ma'lumot oynasi kursorning TESKARI tomonida — chiziq va yozuvni yopmasin
  const chapda = tanlangan !== null && tanlangan > kunlar.length / 2;

  return (
    <figure className="relative">
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-matn-ikki">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-brend" /> Bu oy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-grafik-solishtirma" /> O&apos;tgan oy
        </span>
      </div>
      <svg
        viewBox={`0 0 ${String(KENG)} ${String(BALAND)}`}
        className="w-full"
        role="img"
        aria-label="Oy boshidan yig'ilgan tushum: bu oy va o'tgan oy"
        onMouseLeave={() => {
          setTanlangan(null);
        }}
      >
        {belgilar.map((b) => (
          <g key={b.v}>
            <line x1={CHAP} x2={KENG - ONG} y1={b.py} y2={b.py} className="stroke-chegara" strokeWidth={1} />
            <text x={CHAP - 8} y={b.py + 4} textAnchor="end" className="fill-matn-kuchsiz text-[11px]">
              {qisqa(b.v)}
            </text>
          </g>
        ))}
        {xBelgilar.map((d) => (
          <text key={d} x={x(d - 1)} y={BALAND - 6} textAnchor="middle" className="fill-matn-kuchsiz text-[11px]">
            {d}
          </text>
        ))}

        <path d={yol('otgan')} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-grafik-solishtirma" />
        <path d={yol('joriy')} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-brend" />

        {/* To'g'ridan-to'g'ri yozuvlar — rangga tayanmaslik uchun */}
        {oxJ !== null && (
          <>
            <circle cx={x(oxJ.i)} cy={y(oxJ.v)} r={4} className="fill-brend stroke-sirt" strokeWidth={2} />
            {/* Yozuv chiziq TUGAGAN nuqtada — oy o'rtasida tugasa ham */}
            {/* Chap-yuqori (bu oy chizig'i pastda, kelajak tomonida o'tgan oy chizig'i bor);
                o'tgan oy tepada bo'lsa — chap-past */}
            <text
              x={x(oxJ.i) - 8}
              y={y(oxJ.v) + (otganTepadami ? 18 : -10)}
              textAnchor="end"
              className="fill-matn text-[11px] font-medium"
            >
              Bu oy
            </text>
          </>
        )}
        {oxO !== null && (
          <text x={KENG - ONG + 6} y={yO + 4} className="fill-matn-ikki text-[11px]">
            O&apos;tgan oy
          </text>
        )}

        {tanlangan !== null && (
          <line
            x1={x(tanlangan)}
            x2={x(tanlangan)}
            y1={TEPA}
            y2={BALAND - PAST}
            className="stroke-matn-kuchsiz"
            strokeWidth={1}
          />
        )}

        {/* Kursor maydoni — chiziqdan kengroq (har kun uchun ustun) */}
        {kunlar.map((k, i) => (
          <rect
            key={k.kun}
            x={x(i) - (KENG - CHAP - ONG) / (kunlar.length - 1) / 2}
            y={TEPA}
            width={(KENG - CHAP - ONG) / (kunlar.length - 1)}
            height={BALAND - TEPA - PAST}
            fill="transparent"
            onMouseEnter={() => {
              setTanlangan(i);
            }}
          />
        ))}
      </svg>

      {t !== null && t !== undefined && (
        <div
          className={`pointer-events-none absolute top-8 ${chapda ? 'left-16' : 'right-20'} rounded-maydon border border-chegara bg-sirt px-3 py-2 text-xs shadow-sm`}
        >
          <p className="font-medium text-matn">{t.kun}-kungacha</p>
          <p className="text-matn-ikki">
            Bu oy: <span className="raqam text-matn">{t.joriy === null ? '—' : pul(t.joriy)}</span>
          </p>
          <p className="text-matn-ikki">
            O&apos;tgan oy: <span className="raqam text-matn">{t.otgan === null ? '—' : pul(t.otgan)}</span>
          </p>
        </div>
      )}
    </figure>
  );
}
