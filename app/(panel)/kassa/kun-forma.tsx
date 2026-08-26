'use client';

/**
 * TZ 12.17 — kun yopish.
 *
 * ⚠️ «Farq bo'lsa izoh MAJBURIY, lekin yopish BLOKLANMAYDI. Sotuvchini
 *    uyiga qo'ymay turib bo'lmaydi.»
 *
 *    Shuning uchun izoh maydoni faqat farq chiqqanda majburiy bo'ladi
 *    va tugma hech qachon o'chmaydi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kunniYopAmali } from './amal';
import { BOSH_KUN } from './holat';

export interface KunKorinishi {
  readonly kassaId: number;
  readonly kassaNomi: string;
  readonly sana: string;
  readonly boshlangich: string;
  readonly kirim: string;
  readonly chiqim: string;
  readonly hisoblangan: string;
  readonly yopilganmi: boolean;
}

export function KunYopishFormasi({ kun }: { kun: KunKorinishi }) {
  const [holat, yubor, kutilmoqda] = useActionState(kunniYopAmali, BOSH_KUN);
  const [sanaldi, sanaldiniOzgartir] = useState('');

  const son = (x: string): number | null => {
    const t = x.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const s = son(sanaldi);
  const farq = s === null ? null : s - Number(kun.hisoblangan);
  const izohKerak = farq !== null && farq !== 0;

  if (kun.yopilganmi) {
    return (
      <p className="rounded-karta bg-belgi-yashil-fon px-4 py-3 text-sm text-belgi-yashil ">
        <b>{kun.kassaNomi}</b> — {kun.sana} kuni yopilgan. Bu sanaga yangi yozuv kiritib
        bo&apos;lmaydi (12.17). Kerak bo&apos;lsa admin qayta ochadi.
      </p>
    );
  }

  return (
    <form action={yubor} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="kassaId" value={kun.kassaId} />
      <input type="hidden" name="sana" value={kun.sana} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      {holat.yopildi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil ">
          Kun yopildi.
          {holat.farq !== null && Number(holat.farq) !== 0 && (
            <span className="ml-1">
              Farq: <b className="raqam">{pulKorsat(som(holat.farq))}</b>
            </span>
          )}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <dt className="text-matn-kuchsiz">Ertalabki qoldiq</dt>
        <dd className="raqam">{pulKorsat(som(kun.boshlangich))}</dd>
        <dt className="text-matn-kuchsiz">Kirim</dt>
        <dd className="raqam text-belgi-yashil">{pulKorsat(som(kun.kirim))}</dd>
        <dt className="text-matn-kuchsiz">Chiqim</dt>
        <dd className="raqam text-belgi-qizil">{pulKorsat(som(kun.chiqim))}</dd>
        <dt className="border-t border-chegara pt-1.5 font-medium">Tizim bo&apos;yicha</dt>
        <dd className="raqam border-t border-chegara pt-1.5 font-semibold">
          {pulKorsat(som(kun.hisoblangan))}
        </dd>
      </dl>

      <Maydon nom="sanaldi" yorliq="Haqiqatda sanadim">
        <input
          id="sanaldi"
          name="sanaldi"
          value={sanaldi}
          onChange={(e) => {
            sanaldiniOzgartir(e.target.value);
          }}
          inputMode="decimal"
          className={kirishUslubi(false)}
          placeholder={kun.hisoblangan}
        />
      </Maydon>

      {farq !== null && (
        <p
          className={`raqam text-sm ${
            farq === 0 ? 'text-matn-kuchsiz' : farq < 0 ? 'text-belgi-qizil' : 'text-belgi-sariq'
          }`}
        >
          Farq: {pulKorsat(som(farq.toFixed(2)))}
          {farq < 0 && ' — yetishmaydi'}
          {farq > 0 && ' — ortiqcha'}
        </p>
      )}

      <Maydon
        nom="izoh"
        yorliq={izohKerak ? 'Izoh (majburiy)' : 'Izoh'}
        izoh={izohKerak ? 'Farq bor — izohsiz yopilmaydi, lekin yopish bloklanmaydi' : undefined}
      >
        <textarea id="izoh" name="izoh" rows={2} className={kirishUslubi(false)} />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda || s === null}
        className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brend-quyuq disabled:opacity-50"
      >
        {kutilmoqda ? 'Yopilmoqda…' : 'Kunni yopish'}
      </button>
    </form>
  );
}
