'use client';

import { useActionState, useState } from 'react';
import { kirishAmali } from './amal';
import { BOSHLANGICH_HOLAT } from './holat';

/**
 * Kirish formasi.
 *
 * ⚠️ Maydon balandligi 44px — sotuvchi telefonda ham kiritadi.
 *    Barmoq uchun 44px eng kam o'lcham hisoblanadi.
 *
 * ⚠️ Matn o'lchami 16px: mobil brauzerlar undan kichik maydonga
 *    bosilganda sahifani kattalashtirib yuboradi va foydalanuvchi
 *    qo'lda qaytarib kichiklashtiradi.
 */
const MAYDON =
  'fokus h-11 w-full rounded-[6px] border border-chegara-quyuq bg-sirt px-3 ' +
  'text-base text-matn placeholder:text-matn-kuchsiz transition-colors';

export function KirishFormasi() {
  const [holat, amal, kutilmoqda] = useActionState(kirishAmali, BOSHLANGICH_HOLAT);
  const [parolKorinsin, parolniAlmash] = useState(false);

  return (
    <form action={amal} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="telefon" className="text-[13px] font-medium text-matn-ikki">
          Telefon raqami
        </label>
        <input
          id="telefon"
          name="telefon"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          defaultValue={holat.telefon}
          placeholder="+998 90 123 45 67"
          required
          autoFocus
          aria-invalid={holat.xato !== null}
          className={MAYDON}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="parol" className="text-[13px] font-medium text-matn-ikki">
          Parol
        </label>

        {/*
          ⚠️ «Ko'rsatish» tugmasi — telefonda parol terish oson emas
             va noto'g'ri terilgani bilinmay qoladi. Odam parolni
             ko'ra olsa, qayta-qayta urinib hisobini BLOKLAB
             qo'ymaydi (§8 — 5 urinishdan keyin 15 daqiqa blok).
        */}
        <div className="relative">
          <input
            id="parol"
            name="parol"
            type={parolKorinsin ? 'text' : 'password'}
            autoComplete="current-password"
            required
            aria-invalid={holat.xato !== null}
            className={`${MAYDON} pr-16`}
          />
          <button
            type="button"
            onClick={() => {
              parolniAlmash(!parolKorinsin);
            }}
            className="absolute top-0 right-0 h-11 rounded-r-[6px] px-3 text-[13px] font-medium text-matn-kuchsiz transition-colors hover:text-matn-ikki"
            aria-label={parolKorinsin ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
          >
            {parolKorinsin ? 'Yashirish' : 'Ko‘rsatish'}
          </button>
        </div>
      </div>

      {/*
        ⚠️ Xato maydonlardan KEYIN, tugmadan OLDIN turadi: odam
           tugmani bosgach ko'zi shu yerga tushadi. Yuqorida tursa
           uzun formada ko'rinmay qolardi.
      */}
      {holat.xato !== null && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[6px] bg-qizil-fon px-3 py-2.5 text-[13px] text-qizil ring-1 ring-qizil/20"
        >
          <span aria-hidden="true">⚠</span>
          <span>{holat.xato}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={kutilmoqda}
        className="mt-1 h-11 rounded-[6px] bg-brend text-base font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:cursor-not-allowed disabled:opacity-60"
      >
        {kutilmoqda ? 'Tekshirilmoqda…' : 'Kirish'}
      </button>
    </form>
  );
}
