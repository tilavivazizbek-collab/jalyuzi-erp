'use client';

/**
 * Pul prognozi grafigi — 30 kun, ikki chiziq. 2026-10-12.
 *
 * ⚠️ Bitta o'q (so'm). Nol chizig'i ajratilgan, manfiy hudud — qizil fon:
 *    pul yetmaydigan kun ko'zga darhol tashlanadi.
 * ⚠️ Ranglar tokenlardan (`text-*` → currentColor) — kun/tun ikkalasida.
 * ⚠️ Kursor bilan: vertikal chiziq va kun ma'lumoti (ikki qiymat ham).
 */

import { useState } from 'react';
import { pulKorsat, som } from '@/lib/domain/pul';

export interface GrafikKuni {
  readonly sana: string;
  readonly malum: string;
  readonly odatdagi: string;
}

const KENG = 720;
const BALAND = 240;
const CHAP = 64;
const ONG = 12;
const TEPA = 12;
const PAST = 28;

const pul = (x: string): string => pulKorsat(som(x));
const qisqa = (n: number): string => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(1)} mlrd` : a >= 1e6 ? `${(a / 1e6).toFixed(1)} mln` : a >= 1e3 ? `${(a / 1e3).toFixed(0)} ming` : a.toFixed(0);
  return n < 0 ? `−${s}` : s;
};

export function PrognozGrafik({ kunlar }: { kunlar: readonly GrafikKuni[] }) {
  const [tanlangan, setTanlangan] = useState<number | null>(null);
  if (kunlar.length < 2) return null;

  // ⚠️ Faqat CHIZISH uchun son (piksel); summa matni Decimal'dan keladi
  const qiymatlar = kunlar.flatMap((k) => [Number(k.malum), Number(k.odatdagi)]);
  const eng = Math.max(0, ...qiymatlar);
  const kam = Math.min(0, ...qiymatlar);
  const oraliq = eng - kam || 1;
  const yuqori = eng + oraliq * 0.08;
  const quyi = kam - (kam < 0 ? oraliq * 0.08 : 0);
  const x = (i: number): number => CHAP + (i / (kunlar.length - 1)) * (KENG - CHAP - ONG);
  const y = (v: number): number => TEPA + ((yuqori - v) / (yuqori - quyi)) * (BALAND - TEPA - PAST);
  const yol = (kalit: 'malum' | 'odatdagi'): string =>
    kunlar.map((k, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(Number(k[kalit])).toFixed(1)}`).join(' ');
  const nol = y(0);
  const belgilar = [yuqori, (yuqori + quyi) / 2, quyi].map((v) => ({ v, py: y(v) }));
  const t = tanlangan === null ? null : kunlar[tanlangan];

  return (
    <figure className="relative">
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-matn-ikki">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-brend" /> Odatdagi oqim bilan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-matn-kuchsiz" /> Faqat
          ma&apos;lum to&apos;lovlar
        </span>
      </div>
      <svg
        viewBox={`0 0 ${String(KENG)} ${String(BALAND)}`}
        className="w-full"
        role="img"
        aria-label="Keyingi 30 kunlik pul qoldig'i prognozi"
        onMouseLeave={() => {
          setTanlangan(null);
        }}
      >
        {/* Manfiy hudud — pul yetmaydi */}
        {nol < BALAND - PAST && (
          <rect
            x={CHAP}
            y={nol}
            width={KENG - CHAP - ONG}
            height={BALAND - PAST - nol}
            className="fill-belgi-qizil-fon"
          />
        )}
        {belgilar.map((b) => (
          <g key={b.py}>
            <line x1={CHAP} x2={KENG - ONG} y1={b.py} y2={b.py} className="stroke-chegara" strokeWidth={1} />
            <text x={CHAP - 6} y={b.py + 4} textAnchor="end" className="fill-matn-kuchsiz text-[10px]">
              {qisqa(b.v)}
            </text>
          </g>
        ))}
        <line x1={CHAP} x2={KENG - ONG} y1={nol} y2={nol} className="stroke-matn-ikki" strokeWidth={1.5} />
        <path d={yol('malum')} fill="none" className="stroke-matn-kuchsiz" strokeWidth={2} strokeDasharray="5 4" />
        <path d={yol('odatdagi')} fill="none" className="stroke-brend" strokeWidth={2} />
        {[0, Math.floor((kunlar.length - 1) / 2), kunlar.length - 1].map((i) => (
          <text key={i} x={x(i)} y={BALAND - 8} textAnchor="middle" className="fill-matn-kuchsiz text-[10px]">
            {kunlar[i]?.sana.slice(5) ?? ''}
          </text>
        ))}
        {tanlangan !== null && t !== null && t !== undefined && (
          <g>
            <line x1={x(tanlangan)} x2={x(tanlangan)} y1={TEPA} y2={BALAND - PAST} className="stroke-matn-kuchsiz" strokeWidth={1} />
            <circle cx={x(tanlangan)} cy={y(Number(t.odatdagi))} r={4} className="fill-brend stroke-sirt" strokeWidth={2} />
          </g>
        )}
        {/* Sichqoncha uchun kun ustunlari — chiziqdan kengroq nishon */}
        {kunlar.map((k, i) => (
          <rect
            key={k.sana}
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
      {t !== undefined && t !== null && tanlangan !== null && (
        <div
          className="pointer-events-none absolute top-8 rounded-maydon border border-chegara bg-sirt px-3 py-2 text-xs shadow"
          style={{ left: `${String(Math.min(75, (x(tanlangan) / KENG) * 100))}%` }}
        >
          <p className="font-medium text-matn">{t.sana}</p>
          <p className="text-matn-ikki">Odatdagi oqim bilan: <b className="raqam">{pul(t.odatdagi)}</b></p>
          <p className="text-matn-ikki">Faqat ma&apos;lum: <b className="raqam">{pul(t.malum)}</b></p>
        </div>
      )}
    </figure>
  );
}
