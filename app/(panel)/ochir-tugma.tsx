'use client';

/**
 * app/(panel)/ochir-tugma.tsx — o'chirish tugmasi.
 *
 * ⚠️ IKKI BOSQICH. Birinchi bosish tasdiq so'raydi, ikkinchisi
 *    o'chiradi. `confirm()` ishlatilmaydi: u brauzerni to'xtatib
 *    qo'yadi va telefonda xunuk chiqadi.
 *
 * ⚠️ Ishlatilayotgan yozuv o'chirilmaydi va SABAB ko'rsatiladi —
 *    «o'chirib bo'lmadi» degan quruq xabar odamni boshi berk
 *    ko'chaga olib borardi. «Omborda 4 ta bo'lak bor» desa,
 *    u nima qilishni biladi.
 */

import { useState, useTransition } from 'react';
import { ochirAmali } from './ochir-amal';
import type { OchiriladiganTur } from '@/lib/amal/nofaol';

export function OchirTugma({
  tur,
  id,
  nom,
  ixcham = false,
  ochirildi,
}: {
  tur: OchiriladiganTur;
  id: number;
  /** Tasdiq savolida ko'rsatiladi — odam nimani o'chirayotganini bilsin */
  nom: string;
  /** Jadval katagi uchun — kichikroq */
  ixcham?: boolean;
  /** O'chirilgach ro'yxatni yangilash uchun */
  ochirildi?: () => void;
}) {
  const [soralmoqda, soralmoqdaOzgartir] = useState(false);
  const [sabab, sababniOzgartir] = useState<string | null>(null);
  const [kutilmoqda, boshla] = useTransition();

  function ochir(): void {
    boshla(() => {
      void ochirAmali(tur, id).then((n) => {
        if (n.holat === 'OCHIRILDI') {
          soralmoqdaOzgartir(false);
          sababniOzgartir(null);
          ochirildi?.();
          return;
        }
        sababniOzgartir(n.sabab);
      });
    });
  }

  if (sabab !== null) {
    return (
      <div className="flex flex-col gap-1.5 rounded-maydon bg-belgi-sariq-fon px-3 py-2">
        <p role="alert" className="text-[12px] text-belgi-sariq">
          <b>{nom}</b> o&apos;chirilmadi — {sabab}
        </p>
        <button
          type="button"
          onClick={() => {
            sababniOzgartir(null);
            soralmoqdaOzgartir(false);
          }}
          className="fokus self-start rounded-maydon px-1 text-[12px] text-matn-kuchsiz hover:text-matn"
        >
          Tushunarli
        </button>
      </div>
    );
  }

  if (soralmoqda) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-matn-ikki">
          <b>{nom}</b> o&apos;chirilsinmi?
        </span>
        <button
          type="button"
          disabled={kutilmoqda}
          onClick={ochir}
          className="fokus rounded-maydon bg-belgi-qizil px-2.5 py-1 text-[12px] font-medium text-white transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? "O'chirilmoqda…" : 'Ha'}
        </button>
        <button
          type="button"
          onClick={() => {
            soralmoqdaOzgartir(false);
          }}
          className="fokus rounded-maydon px-2 py-1 text-[12px] text-matn-kuchsiz transition-colors hover:text-matn"
        >
          Yo&apos;q
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        soralmoqdaOzgartir(true);
      }}
      aria-label={`${nom} — o'chirish`}
      className={`fokus rounded-maydon text-matn-kuchsiz transition-colors hover:bg-belgi-qizil-fon hover:text-belgi-qizil ${
        ixcham ? 'px-1.5 py-0.5 text-[12px]' : 'px-2 py-1 text-[13px]'
      }`}
    >
      O&apos;chirish
    </button>
  );
}
