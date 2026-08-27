'use client';

/**
 * app/(panel)/tanlov.tsx — ro'yxat + «shu yerda yangi qo'shish».
 *
 * ⚠️ Muammo: sotuvchi buyurtma yozayotib «bu yetkazib beruvchi
 *    ro'yxatda yo'q ekan» deb qolardi. Uni qo'shish uchun boshqa
 *    sahifaga o'tish, formani tashlab ketish va qaytib kelib
 *    hammasini qaytadan terish kerak edi.
 *
 *    Endi ro'yxat ostida «+ Yangi» turadi: nom yoziladi, qo'shiladi
 *    va DARHOL tanlanadi. Forma joyida qoladi.
 *
 * ⚠️ Ruxsat SERVERDA tekshiriladi (§9.4). Bu yerdagi `qoshaOladi`
 *    faqat tugmani yashiradi — himoya emas.
 */

import { useState, useTransition } from 'react';
import { Maydon, kirishUslubi } from './maydon';

export interface TanlovBandi {
  readonly id: number;
  readonly nom: string;
}

export type TezYaratish = (
  nom: string,
) => Promise<{ id: number; nom: string } | { xato: string }>;

/**
 * Nomdan tashqari yana bitta tanlov so'raydigan qo'shish.
 *
 * ⚠️ Material uchun kerak: o'lchov birligisiz material ombordan
 *    noto'g'ri yechiladi va keyin tuzatib bo'lmaydi (5.3).
 */
export type TezYaratishIkki = (
  nom: string,
  ikkinchi: string,
) => Promise<{ id: number; nom: string } | { xato: string }>;

export interface IkkinchiMaydon {
  readonly yorliq: string;
  readonly bandlar: readonly { readonly qiymat: string; readonly nom: string }[];
  readonly boshlangich: string;
}

/**
 * «+ Yangi» tugmasi va uning ochiladigan qatori.
 *
 * ⚠️ Alohida qism: bir xil xatti-harakat ikki joyda kerak —
 *    to'liq maydonda (TanlovYokiYangi) va tor jadval katagida
 *    (mahsulot slotlari). Nusxa ko'chirish taqiq (§2.2).
 */
export function TezQoshish({
  yangiYorliq,
  yarat,
  yaratIkki,
  ikkinchi,
  qoshildi,
  ixcham = false,
}: {
  yangiYorliq: string;
  /** Faqat nom so'raydigan qo'shish */
  yarat?: TezYaratish;
  /** Nom + ikkinchi tanlov so'raydigan qo'shish */
  yaratIkki?: TezYaratishIkki;
  ikkinchi?: IkkinchiMaydon;
  qoshildi: (band: TanlovBandi) => void;
  /** Tor joyda — kichik shrift, kamroq bo'shliq */
  ixcham?: boolean;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [yangiNom, yangiNomniOzgartir] = useState('');
  const [ikkinchiQiymat, ikkinchiniOzgartir] = useState(ikkinchi?.boshlangich ?? '');
  const [xato, xatoniOzgartir] = useState<string | null>(null);
  const [kutilmoqda, boshla] = useTransition();

  function qosh(): void {
    const t = yangiNom.trim();
    if (t === '') {
      xatoniOzgartir('Nom kiritilmagan');
      return;
    }

    const ish =
      yaratIkki === undefined
        ? yarat?.(t)
        : yaratIkki(t, ikkinchiQiymat);

    if (ish === undefined) return;

    boshla(() => {
      void ish.then((n) => {
        if ('xato' in n) {
          xatoniOzgartir(n.xato);
          return;
        }

        qoshildi(n);
        yangiNomniOzgartir('');
        xatoniOzgartir(null);
        ochiqniOzgartir(false);
      });
    });
  }

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className={`fokus self-start rounded-maydon px-1 py-0.5 font-medium text-brend transition-colors hover:underline ${
          ixcham ? 'text-[11px]' : 'text-[12px]'
        }`}
      >
        + {yangiYorliq}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-maydon border border-chegara bg-fon p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={yangiNom}
          autoFocus
          onChange={(e) => {
            yangiNomniOzgartir(e.target.value);
            xatoniOzgartir(null);
          }}
          onKeyDown={(e) => {
            /**
             * ⚠️ Enter FORMANI yubormasligi kerak — u faqat yangi
             *    yozuvni qo'shadi. Aks holda yarim to'ldirilgan
             *    material saqlanib ketardi.
             */
            if (e.key === 'Enter') {
              e.preventDefault();
              qosh();
            }
            if (e.key === 'Escape') ochiqniOzgartir(false);
          }}
          placeholder="Nomi"
          aria-label={yangiYorliq}
          className={`${kirishUslubi(false)} flex-1 ${ixcham ? 'py-1.5' : ''}`}
        />

        {/*
          ⚠️ Ikkinchi maydon TANLOV bo'lib turadi, matn emas. Material
             uchun bu o'lchov birligi: uni erkin yozib bo'lmaydi,
             chunki noto'g'ri birlik ombor hisobini buzadi (5.3).
        */}
        {ikkinchi !== undefined && (
          <select
            value={ikkinchiQiymat}
            onChange={(e) => {
              ikkinchiniOzgartir(e.target.value);
            }}
            aria-label={ikkinchi.yorliq}
            className={`${kirishUslubi(false)} w-40 shrink-0 ${ixcham ? 'py-1.5' : ''}`}
          >
            {ikkinchi.bandlar.map((b) => (
              <option key={b.qiymat} value={b.qiymat}>
                {b.nom}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          disabled={kutilmoqda}
          onClick={qosh}
          className="fokus rounded-maydon bg-brend px-3 py-2 text-[13px] font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Qo‘shilmoqda…' : 'Qo‘shish'}
        </button>

        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
            xatoniOzgartir(null);
          }}
          className="fokus rounded-maydon px-2.5 py-2 text-[13px] text-matn-kuchsiz transition-colors hover:text-matn"
        >
          Bekor
        </button>
      </div>

      {xato !== null && (
        <p role="alert" className="text-[12px] text-belgi-qizil">
          {xato}
        </p>
      )}
    </div>
  );
}

export function TanlovYokiYangi({
  nom,
  yorliq,
  izoh,
  bandlar,
  boshlangich,
  boshMatn = '— tanlanmagan —',
  yangiYorliq,
  qoshaOladi,
  yarat,
}: {
  /** `name` — forma shu nom bilan yuboradi */
  nom: string;
  yorliq: string;
  izoh?: string;
  bandlar: readonly TanlovBandi[];
  boshlangich?: string;
  boshMatn?: string;
  /** «Yangi guruh» kabi — oldiga «+» qo'yiladi */
  yangiYorliq: string;
  qoshaOladi: boolean;
  yarat: TezYaratish;
}) {
  const [royxat, royxatniOzgartir] = useState<readonly TanlovBandi[]>(bandlar);
  const [tanlangan, tanlanganniOzgartir] = useState(boshlangich ?? '');

  return (
    <Maydon nom={nom} yorliq={yorliq} izoh={izoh}>
      <div className="flex flex-col gap-2">
        <select
          id={nom}
          name={nom}
          value={tanlangan}
          onChange={(e) => {
            tanlanganniOzgartir(e.target.value);
          }}
          className={kirishUslubi(false)}
        >
          <option value="">{boshMatn}</option>
          {royxat.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.nom}
            </option>
          ))}
        </select>

        {qoshaOladi && (
          <TezQoshish
            yangiYorliq={yangiYorliq}
            yarat={yarat}
            qoshildi={(n) => {
              /**
               * ⚠️ Yangi yozuv ro'yxatga qo'shiladi VA darhol
               *    tanlanadi. Aks holda odam uni qo'shib, keyin
               *    yana qidirib tanlashi kerak bo'lardi.
               */
              royxatniOzgartir((r) => [...r, n]);
              tanlanganniOzgartir(String(n.id));
            }}
          />
        )}
      </div>
    </Maydon>
  );
}
