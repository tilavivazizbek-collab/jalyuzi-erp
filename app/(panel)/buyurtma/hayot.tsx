'use client';

/**
 * TZ 8.9 · 8.8 · 8.10 — pozitsiyaning oxirgi bosqichlari.
 *
 * Uchta alohida amal:
 *
 * | Amal | Qachon | Mahsulot qayerda |
 * |---|---|---|
 * | Topshirish | tayyor, mijoz oldi | mijozda |
 * | Rad etish | tayyor, mijoz OLMADI | omborda, «sotilmagan tayyor» |
 * | Qaytarish | mijoz olgan, keyin qaytardi | omborda |
 *
 * ⚠️ Ombor qoldig'iga uchalasi ham TEGMAYDI — mato allaqachon kesilgan.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import {
  qaytarishAmali,
  radEtishAmali,
  topshirishAmali,
  yetibKeldiAmali,
} from './amal';
import { BOSH_AMAL } from './holat';

export interface QaytarishKassasi {
  readonly id: number;
  readonly nom: string;
  readonly turi: string;
  readonly valyuta: string;
}

/** TZ 8.9 — qisman topshirish mumkin. */
export function TopshirishTugmasi({ pozitsiyaId }: { pozitsiyaId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(topshirishAmali, BOSH_AMAL);

  return (
    <form action={yubor} className="flex items-center gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-red-700">
          {holat.xato}
        </span>
      )}

      <button
        type="submit"
        disabled={kutilmoqda}
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {kutilmoqda ? 'Topshirilmoqda…' : 'Topshirish'}
      </button>
    </form>
  );
}

/**
 * TZ 20.5.1 — «Yetib keldi» ni SOTGAN FILIAL qo'lda bosadi.
 *
 * ⚠️ Bosilmaguncha mahsulot yo'lda hisoblanadi (20.8).
 */
export function YetibKeldiTugmasi({ pozitsiyaId }: { pozitsiyaId: number }) {
  const [holat, yubor, kutilmoqda] = useActionState(yetibKeldiAmali, BOSH_AMAL);

  return (
    <form action={yubor} className="flex items-center gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-red-700">
          {holat.xato}
        </span>
      )}

      <button
        type="submit"
        disabled={kutilmoqda}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {kutilmoqda ? 'Belgilanmoqda…' : 'Yetib keldi'}
      </button>
    </form>
  );
}

/** TZ 8.8 — mijoz tayyor mahsulotni olmadi. */
export function RadEtishTugmasi({ pozitsiyaId }: { pozitsiyaId: number }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(radEtishAmali, BOSH_AMAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-slate-500 underline underline-offset-2 hover:text-red-700"
      >
        Rad etildi
      </button>
    );
  }

  return (
    <form action={yubor} className="flex flex-col gap-2">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-red-700">
          {holat.xato}
        </span>
      )}

      <Maydon nom={`rad-${String(pozitsiyaId)}`} yorliq="Sabab">
        <input
          id={`rad-${String(pozitsiyaId)}`}
          name="sabab"
          className={`${kirishUslubi(false)} w-64`}
          placeholder="Masalan: mijoz rangi yoqmadi dedi"
        />
      </Maydon>

      <p className="text-xs text-slate-500">
        Mahsulot «sotilmagan tayyor mahsulot» ro&apos;yxatiga tushadi (7.13).
        Ombor qoldig&apos;iga tegilmaydi — mato allaqachon kesilgan.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Rad etilgan deb belgilash'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}

/** TZ 8.10 — mijoz olgan mahsulotni qaytardi. */
export function QaytarishTugmasi({
  pozitsiyaId,
  narx,
  kassalar,
}: {
  pozitsiyaId: number;
  narx: string;
  kassalar: readonly QaytarishKassasi[];
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(qaytarishAmali, BOSH_AMAL);
  const [summa, summaniOzgartir] = useState(narx);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-900"
      >
        Qaytarish
      </button>
    );
  }

  const ushlab = Number(narx) - Number(summa || '0');

  return (
    <form action={yubor} className="flex flex-col gap-3">
      <input type="hidden" name="pozitsiyaId" value={pozitsiyaId} />

      {holat.xato !== null && (
        <span role="alert" className="text-xs text-red-700">
          {holat.xato}
        </span>
      )}

      <p className="text-xs text-slate-600">
        Tizim pozitsiya narxini taklif qiladi — mijoz bilan kelishib
        o&apos;zgartiring. <b>Chegara yo&apos;q</b>, 0 ham kiritish mumkin (8.10).
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <Maydon nom={`qay-summa-${String(pozitsiyaId)}`} yorliq="Qaytariladi">
          <input
            id={`qay-summa-${String(pozitsiyaId)}`}
            name="summa"
            value={summa}
            onChange={(e) => {
              summaniOzgartir(e.target.value);
            }}
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>

        <Maydon
          nom={`qay-yol-${String(pozitsiyaId)}`}
          yorliq="Qarzdan ortiqchasi"
          izoh="Avval mijoz qarzidan chegiriladi"
        >
          <select
            id={`qay-yol-${String(pozitsiyaId)}`}
            name="ortiqchaYoli"
            className={`${kirishUslubi(false)} w-40`}
          >
            <option value="NAQD">Kassadan naqd</option>
            <option value="AVANS">Avans bo&apos;lib qolsin</option>
          </select>
        </Maydon>

        <Maydon nom={`qay-kassa-${String(pozitsiyaId)}`} yorliq="Kassa">
          <select
            id={`qay-kassa-${String(pozitsiyaId)}`}
            name="kassaId"
            className={`${kirishUslubi(false)} w-48`}
          >
            <option value="">— kerak emas —</option>
            {kassalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>
        </Maydon>
      </div>

      {ushlab > 0 && (
        <p className="raqam text-xs text-amber-800">
          Ushlab qolinadi: {pulKorsat(som(ushlab.toFixed(2)))} — hisobotda
          «qaytarishdan ushlab qolindi» bo&apos;lib chiqadi (11.4.1)
        </p>
      )}

      <Maydon nom={`qay-izoh-${String(pozitsiyaId)}`} yorliq="Izoh (majburiy)">
        <input
          id={`qay-izoh-${String(pozitsiyaId)}`}
          name="izoh"
          className={`${kirishUslubi(false)} w-full max-w-md`}
          placeholder="Nima bo'ldi"
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Qaytarishni rasmiylashtirish'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}
