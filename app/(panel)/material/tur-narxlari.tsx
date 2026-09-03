'use client';

/**
 * app/(panel)/material/tur-narxlari.tsx — TZ 5.4 · 6.2 · 5.8
 *
 * Mijoz turi bo'yicha narxlar — DINAMIK maydonlar.
 *
 * ⚠️ Egasi (2026-08-30): «yangi tur qo'shilsa material formasi
 *    KOD O'ZGARISHISIZ yangi maydonni ko'rsatishi kerak».
 *
 *    Shuning uchun maydonlar ro'yxati serverdan keladi —
 *    bu yerda hech qanday qattiq nom yo'q.
 */

import { useState } from 'react';
import { kirishUslubi } from '../maydon';
import { som, pulKorsat } from '@/lib/domain/pul';
import type { TurNarxi } from '@/lib/amal/tur-narx';

/**
 * Narx tannarxdan pastmi — TZ 5.8.
 *
 * ⚠️ HAR TUR ALOHIDA tekshiriladi. Ilgari bitta umumiy
 *    ogohlantirish bo'lardi va «Metrajka» narxi tannarxdan past
 *    bo'lgani standart narx tekshiruvi ostida yashirinib
 *    ketardi.
 */
function pastmi(narx: string, tannarx: string | null): boolean {
  if (tannarx === null || narx.trim() === '') return false;
  const n = Number(narx);
  const t = Number(tannarx);
  return Number.isFinite(n) && Number.isFinite(t) && t > 0 && n < t;
}

export function TurNarxlari({
  turlar,
  tannarx,
  standartNarx,
}: {
  turlar: readonly TurNarxi[];
  /** Oxirgi kirimdagi tannarx — 5.8 ogohlantirishi uchun */
  tannarx: string | null;
  /** Standart narx — bo'sh tur shunga tushadi */
  standartNarx: string;
}) {
  const [narxlar, narxlarniOzgartir] = useState<Record<number, string>>(() =>
    Object.fromEntries(turlar.map((t) => [t.mijozTuriId, t.narx ?? ''])),
  );

  if (turlar.length === 0) {
    return (
      <p className="text-xs text-matn-kuchsiz">
        Mijoz turlari hali qo&apos;shilmagan — «Mijozlar → Mijoz turlari» dan qo&apos;shing.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-matn-kuchsiz">
        Bo&apos;sh qoldirilgan tur <b>standart narxda</b> sotiladi. Faqat standart narx
        majburiy.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {turlar.map((t) => {
          const qiymat = narxlar[t.mijozTuriId] ?? '';
          const past = pastmi(qiymat, tannarx);

          return (
            <div key={t.mijozTuriId} className="flex flex-col gap-1">
              <label
                htmlFor={`turNarx_${String(t.mijozTuriId)}`}
                className="text-sm font-medium text-matn-ikki"
              >
                {t.turNomi}
              </label>

              <input
                id={`turNarx_${String(t.mijozTuriId)}`}
                name={`turNarx_${String(t.mijozTuriId)}`}
                value={qiymat}
                onChange={(e) => {
                  narxlarniOzgartir((x) => ({ ...x, [t.mijozTuriId]: e.target.value }));
                }}
                inputMode="decimal"
                placeholder={standartNarx === '' ? 'standart' : standartNarx}
                className={kirishUslubi(past)}
              />

              {/* Valyuta turdan emas, materialdan — bitta materialda bitta valyuta */}
              <input
                type="hidden"
                name={`turValyuta_${String(t.mijozTuriId)}`}
                value={t.valyuta}
              />

              {/*
                ⚠️ 5.8 — «bloklamaydi, ogohlantiradi». Egasi
                   ba'zan ataylab zararga sotadi (ombor tozalash),
                   shuning uchun to'sib qo'yilmaydi.
              */}
              {past && tannarx !== null && (
                <p className="text-[12px] text-belgi-sariq">
                  {t.turNomi} narxi ({pulKorsat(som(qiymat))}) tannarxdan (
                  {pulKorsat(som(tannarx))}) past
                </p>
              )}

              {!past && qiymat.trim() === '' && (
                <p className="text-[12px] text-matn-kuchsiz">standart narx ishlaydi</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
