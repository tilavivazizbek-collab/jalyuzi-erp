'use client';

import { useActionState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { enterYuborilmasin } from '../forma-yordamchi';
import { sozlamaAmali } from './amal';
import { BOSH_SOZLAMA_HOLATI } from './holat';
import { KALIT_TAVSIFI, KORXONA_KALITLARI, type KorxonaMalumotlari } from '@/lib/amal/sozlama';

/** Har maydon uchun brauzer yordami — tekshiruv baribir serverda (§9.4) */
const KATAK: Readonly<Record<string, { placeholder: string; maxLength: number }>> = {
  korxona_nom: { placeholder: 'Jalyuzi Servis MCHJ', maxLength: 200 },
  korxona_manzil: { placeholder: 'Toshkent sh., Chilonzor t., 12-uy', maxLength: 200 },
  korxona_telefon: { placeholder: '+998 90 123 45 67', maxLength: 200 },
  bot_username: { placeholder: 'jalyuzi_bot', maxLength: 32 },
  filial_kod: { placeholder: '14', maxLength: 2 },
};

export function SozlamaFormasi({ joriy }: { joriy: KorxonaMalumotlari }) {
  const [holat, yubor, kutilmoqda] = useActionState(sozlamaAmali, BOSH_SOZLAMA_HOLATI);

  return (
    <form action={yubor} onKeyDown={enterYuborilmasin} className="flex max-w-md flex-col gap-4">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      {holat.saqlandi && holat.xato === null && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">
          Saqlandi — endi chekda shu ma&apos;lumotlar chiqadi.
        </p>
      )}

      {KORXONA_KALITLARI.map((kalit) => (
        <Maydon
          /**
           * ⚠️ `key` da urinish raqami bor: React 19 forma
           *    yuborilgach maydonlarni tozalaydi, kalit
           *    o'zgarsa `defaultValue` qayta qo'llanadi.
           */
          key={`${kalit}-${String(holat.urinish ?? 0)}`}
          nom={kalit}
          yorliq={
            KALIT_TAVSIFI[kalit].majburiy
              ? KALIT_TAVSIFI[kalit].nom
              : `${KALIT_TAVSIFI[kalit].nom} (ixtiyoriy)`
          }
          izoh={KALIT_TAVSIFI[kalit].izoh}
        >
          <input
            id={kalit}
            name={kalit}
            defaultValue={holat.kiritilgan?.[kalit] ?? joriy[kalit] ?? ''}
            placeholder={KATAK[kalit]?.placeholder}
            maxLength={KATAK[kalit]?.maxLength}
            inputMode={kalit === 'filial_kod' ? 'numeric' : undefined}
            className={kirishUslubi(holat.xato !== null)}
          />
        </Maydon>
      ))}

      <div>
        <button
          type="submit"
          disabled={kutilmoqda}
          className="fokus rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}
