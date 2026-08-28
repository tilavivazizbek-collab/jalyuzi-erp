'use client';

/**
 * app/(panel)/rasm-yuklash.tsx — katalog rasmini yuklash.
 *
 * ⚠️ RASM BRAUZERDA KICHIKLASHTIRILADI.
 *
 *    Telefondan olingan rasm 4–8 MB bo'ladi. Uni shundayligicha
 *    yuborsak: yuklash sekin, baza shishadi, sotuv ekrani
 *    og'irlashadi.
 *
 *    Serverda kichiklashtirish uchun `sharp` kabi kutubxona
 *    kerak — u yangi bog'liqlik va u operatsion tizimga bog'langan.
 *    Brauzerda esa `canvas` bepul: kutubxona kerak emas va
 *    tarmoqqa ham kam yuk tushadi.
 *
 * ⚠️ `webp` — bir xil sifatda `jpeg` dan ~30% kichik. Barcha
 *    zamonaviy brauzer qo'llab-quvvatlaydi.
 */

import { useRef, useState } from 'react';

/** Eng katta eni — katalog uchun yetarli, ortig'i keraksiz og'irlik */
const ENG_KATTA_ENI = 800;
const SIFAT = 0.82;

/** Foydalanuvchi tanlagan faylni kichraytirib `data:` matnga o'giradi */
async function kichiklashtir(fayl: File): Promise<string> {
  const manba = await createImageBitmap(fayl);

  const nisbat = Math.min(1, ENG_KATTA_ENI / manba.width);
  const eni = Math.round(manba.width * nisbat);
  const boyi = Math.round(manba.height * nisbat);

  const kanvas = document.createElement('canvas');
  kanvas.width = eni;
  kanvas.height = boyi;

  const kontekst = kanvas.getContext('2d');
  if (kontekst === null) throw new Error('canvas ochilmadi');

  kontekst.drawImage(manba, 0, 0, eni, boyi);
  manba.close();

  return kanvas.toDataURL('image/webp', SIFAT);
}

export function RasmYuklash({
  nom,
  /** Mavjud rasm manzili — `null` bo'lsa rasm yo'q */
  joriyManzil,
  yorliq = 'Rasm',
}: {
  /** Forma shu nom bilan yuboradi (`data:` matn) */
  nom: string;
  joriyManzil: string | null;
  yorliq?: string;
}) {
  const [korinish, korinishniOzgartir] = useState<string | null>(joriyManzil);
  const [qiymat, qiymatniOzgartir] = useState('');
  const [xato, xatoniOzgartir] = useState<string | null>(null);
  const [ishlanmoqda, ishlanmoqdaOzgartir] = useState(false);
  const kirish = useRef<HTMLInputElement>(null);

  async function tanlandi(fayl: File | undefined): Promise<void> {
    if (fayl === undefined) return;

    if (!fayl.type.startsWith('image/')) {
      xatoniOzgartir('Bu rasm emas');
      return;
    }

    ishlanmoqdaOzgartir(true);
    xatoniOzgartir(null);

    try {
      const kichik = await kichiklashtir(fayl);
      qiymatniOzgartir(kichik);
      korinishniOzgartir(kichik);
    } catch {
      xatoniOzgartir("Rasmni o'qib bo'lmadi");
    } finally {
      ishlanmoqdaOzgartir(false);
    }
  }

  function olibTashla(): void {
    /**
     * ⚠️ Bo'sh matn EMAS, `OCHIR` belgisi: bo'sh matn «rasm
     *    o'zgarmadi» degani, `OCHIR` esa «rasmni olib tashla».
     *    Farqi bo'lmasa rasmni o'chirib bo'lmasdi.
     */
    qiymatniOzgartir('OCHIR');
    korinishniOzgartir(null);
    if (kirish.current !== null) kirish.current.value = '';
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-matn-ikki">{yorliq}</span>

      <input type="hidden" name={nom} value={qiymat} />

      <div className="flex items-start gap-3">
        {korinish === null ? (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-maydon border border-dashed border-chegara-quyuq text-[11px] text-matn-kuchsiz">
            rasm yo&apos;q
          </div>
        ) : (
          /*
            ⚠️ `next/image` EMAS: bu yerdagi manba `data:` matn
               (hali yuklanmagan rasm) yoki bizning API yo'limiz.
               Next optimizatori ikkalasini ham qayta ishlay
               olmaydi va foydasi yo'q — rasm allaqachon kichik.
          */
          <img
            src={korinish}
            alt=""
            className="size-20 shrink-0 rounded-maydon border border-chegara object-cover"
          />
        )}

        <div className="flex flex-col gap-1.5">
          <input
            ref={kirish}
            type="file"
            accept="image/*"
            onChange={(e) => {
              void tanlandi(e.target.files?.[0]);
            }}
            className="block text-[12px] text-matn-ikki file:mr-2 file:rounded-maydon file:border file:border-chegara-quyuq file:bg-sirt file:px-2.5 file:py-1 file:text-[12px] file:text-matn-ikki hover:file:bg-fon"
          />

          {ishlanmoqda && (
            <span className="text-[12px] text-matn-kuchsiz">tayyorlanmoqda…</span>
          )}

          {korinish !== null && !ishlanmoqda && (
            <button
              type="button"
              onClick={olibTashla}
              className="fokus self-start rounded-maydon px-1 text-[12px] text-matn-kuchsiz transition-colors hover:text-belgi-qizil"
            >
              Olib tashlash
            </button>
          )}

          {xato !== null && (
            <span role="alert" className="text-[12px] text-belgi-qizil">
              {xato}
            </span>
          )}

          <span className="text-[12px] text-matn-kuchsiz">
            Rasm avtomatik kichiklashtiriladi
          </span>
        </div>
      </div>
    </div>
  );
}
