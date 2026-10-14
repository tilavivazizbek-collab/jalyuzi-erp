'use client';

/**
 * T-06 — avtomatik qarz eslatmasi qoidasi (Qarzdorlik sahifasida). 2026-10-14.
 * ⚠️ `'use server'` fayli faqat async funksiya eksport qiladi — boshlang'ich
 *    holat shu yerda.
 */

import { useActionState } from 'react';
import { kirishUslubi } from '../../maydon';
import { eslatmaQoidasiAmali, type EslatmaQoidaHolati } from './eslatma-amal';

const BOSH: EslatmaQoidaHolati = { xato: null, xabar: null };

export function EslatmaQoidaFormasi(k: { readonly birinchiKun: number; readonly takrorKun: number; readonly ozgartiraOladi: boolean }) {
  const [holat, yubor, kutilmoqda] = useActionState(eslatmaQoidasiAmali, BOSH);
  const holatMatni =
    k.birinchiKun === 0
      ? 'Avtomatik eslatma o‘chiq.'
      : `Muddati o‘tgan qarzga Telegram orqali eslatma: muddatdan ${String(k.birinchiKun)} kun keyin, keyin har ${String(k.takrorKun)} kunda (qo‘lda yuborilgani ham hisobga olinadi).`;

  return (
    <section className="flex flex-col gap-2 rounded-karta border border-chegara bg-sirt p-4">
      <h2 className="text-sm font-semibold text-matn">Avtomatik qarz eslatmasi</h2>
      <p className="text-[13px] text-matn-ikki">{holatMatni}</p>
      {k.ozgartiraOladi && (
        <form action={yubor} className="flex flex-wrap items-end gap-3 text-[13px] text-matn-ikki">
          <label className="flex flex-col gap-1">
            Muddatdan necha kun keyin (0 — o‘chiq)
            <input name="birinchi" defaultValue={k.birinchiKun} inputMode="numeric" className={`${kirishUslubi(false)} w-24`} />
          </label>
          <label className="flex flex-col gap-1">
            Necha kunda bir takrorlansin
            <input name="takror" defaultValue={k.takrorKun} inputMode="numeric" className={`${kirishUslubi(false)} w-24`} />
          </label>
          <button
            disabled={kutilmoqda}
            className="rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm hover:bg-fon disabled:opacity-60"
          >
            Saqlash
          </button>
          {holat.xato !== null && (
            <span role="alert" className="text-belgi-qizil">
              {holat.xato}
            </span>
          )}
          {holat.xabar !== null && holat.xato === null && <span className="text-belgi-yashil">{holat.xabar}</span>}
        </form>
      )}
    </section>
  );
}
