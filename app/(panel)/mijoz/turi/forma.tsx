'use client';

/**
 * app/(panel)/mijoz/turi/forma.tsx — TZ 6.2 · 14.9
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { useSaqlanganda, BekorQilish } from '../../modal-forma';
import type { YaratilganYozuv } from '../../modal-holat';
import { turYaratAmali } from './amal';
import { BOSH_TUR_HOLATI, type TurHolati } from './holat';

export interface TurQiymatlari {
  readonly nom: string;
  readonly soliqKerak: boolean;
  readonly tartib: string;
}

export const BOSH_QIYMATLAR: TurQiymatlari = {
  nom: '',
  soliqKerak: false,
  tartib: '',
};

export function TurFormasi({
  amal = turYaratAmali,
  qiymatlar = BOSH_QIYMATLAR,
  tugmaMatni = 'Saqlash',
  saqlandi,
  bekor,
}: {
  amal?: (holat: TurHolati, forma: FormData) => Promise<TurHolati>;
  qiymatlar?: TurQiymatlari;
  tugmaMatni?: string;
  saqlandi?: (y: YaratilganYozuv) => void;
  bekor?: () => void;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_TUR_HOLATI);
  const [soliq, soliqniOzgartir] = useState(qiymatlar.soliqKerak);

  useSaqlanganda(holat.yaratildi, saqlandi);

  const x = (nom: string): string | undefined => holat.maydonlar[nom];

  return (
    <form action={yubor} className="flex flex-col gap-4">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      <Maydon nom="nom" yorliq="Tur nomi" izoh="masalan: Optom, Metrajka" xato={x('nom')}>
        <input
          id="nom"
          name="nom"
          defaultValue={qiymatlar.nom}
          required
          className={kirishUslubi(x('nom') !== undefined)}
        />
      </Maydon>

      <Maydon
        nom="tartib"
        yorliq="Tartib"
        izoh="kichik raqam tepada turadi"
        xato={x('tartib')}
      >
        <input
          id="tartib"
          name="tartib"
          defaultValue={qiymatlar.tartib}
          inputMode="numeric"
          className={kirishUslubi(x('tartib') !== undefined)}
        />
      </Maydon>

      {/*
        ⚠️ Bu belgi TURNING XUSUSIYATI, nomi emas.

           «Yuridik» degan nom bo'yicha tekshirilsa, «Optom»
           turidagi yuridik mijozdan INN so'ralmay qolardi va
           unga faktura yozib bo'lmasdi. Shuning uchun admin
           «Optom (yuridik)» turini ham yarata oladi.
      */}
      <label className="flex items-start gap-2.5 rounded-karta border border-chegara p-3">
        <input
          type="checkbox"
          name="soliqKerak"
          value="ha"
          checked={soliq}
          onChange={(e) => {
            soliqniOzgartir(e.target.checked);
          }}
          className="mt-0.5 size-4"
        />
        <span className="text-sm">
          <span className="font-medium text-matn">Soliq ma&apos;lumotlari so&apos;ralsin</span>
          <span className="mt-0.5 block text-xs text-matn-kuchsiz">
            Bu turdagi mijozdan tashkilot nomi, INN va yuridik manzil talab qilinadi —
            faktura yozish uchun kerak
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : tugmaMatni}
        </button>
        <BekorQilish yol="/mijoz/turi" bekor={bekor} />
      </div>
    </form>
  );
}
