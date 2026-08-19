'use client';

import { useActionState } from 'react';
import { kirishAmali } from './amal';
import { BOSHLANGICH_HOLAT } from './holat';

export function KirishFormasi() {
  const [holat, amal, kutilmoqda] = useActionState(kirishAmali, BOSHLANGICH_HOLAT);

  return (
    <form action={amal} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Telefon raqami</span>
        <input
          name="telefon"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          defaultValue={holat.telefon}
          placeholder="+998 90 123 45 67"
          required
          autoFocus
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none
                     focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Parol</span>
        <input
          name="parol"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none
                     focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </label>

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      <button
        type="submit"
        disabled={kutilmoqda}
        className="mt-1 rounded-lg bg-slate-900 px-4 py-2.5 text-base font-medium text-white
                   transition hover:bg-slate-800 disabled:opacity-60"
      >
        {kutilmoqda ? 'Tekshirilmoqda…' : 'Kirish'}
      </button>
    </form>
  );
}
