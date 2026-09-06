'use client';

/**
 * app/(panel)/buyurtma/storno.tsx — TZ 8.8
 *
 * «Storno — XATO: buyurtma umuman bo'lmagan, sotuvchi noto'g'ri
 *  kiritgan. Faqat admin qiladi va hisobotda ALOHIDA ko'rinadi.»
 *
 * ⚠️ Bu tugma BEKOR QILISH tugmasining o'rnini bosmaydi. Mijoz
 *    fikridan qaytgan bo'lsa — bekor qilinadi va bu biznes
 *    ma'lumot bo'lib qoladi. Storno esa yozuvni «bo'lmagan» deb
 *    belgilaydi, shuning uchun ikkalasi bir qopga solinmaydi.
 */

import { useActionState, useState } from 'react';
import { Modal } from '../modal';
import { kirishUslubi } from '../maydon';
import { stornoAmali } from './storno-amal';
import { BOSH_STORNO } from './storno-holat';

export function StornoTugmasi({
  buyurtmaId,
  raqam,
}: {
  buyurtmaId: number;
  raqam: string;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(
    stornoAmali.bind(null, buyurtmaId),
    BOSH_STORNO,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] text-belgi-qizil transition-all hover:bg-belgi-qizil-fon active:scale-[0.98]"
      >
        Storno
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha={`${raqam} — storno`}
        izoh="Xato kiritilgan buyurtmani yozuvdan chiqarish (8.8)"
        bolalar={
          holat.bajarildi ? (
            <div className="flex flex-col gap-4">
              <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-[13px] text-matn">
                {holat.xulosa}
              </p>
              <button
                type="button"
                onClick={() => {
                  ochiqniOzgartir(false);
                }}
                className="fokus self-start rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
              >
                Yopish
              </button>
            </div>
          ) : (
            <form action={yubor} className="flex flex-col gap-4">
              {/*
                ⚠️ Farqi ekranda AYTILADI. Ikkalasi ham «buyurtma
                   yo'qoladi» bo'lib ko'ringani uchun admin
                   adashishi mumkin.
              */}
              <div className="rounded-maydon bg-fon px-3 py-2.5 text-[13px] text-matn-ikki">
                <p>
                  <b>Bekor qilish</b> — mijoz fikridan qaytdi. Bu haqiqiy voqea va
                  hisobotda shunday qoladi.
                </p>
                <p className="mt-1.5">
                  <b>Storno</b> — bunday buyurtma umuman bo&apos;lmagan, xato
                  kiritilgan. Hisobotda alohida ko&apos;rinadi.
                </p>
              </div>

              <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-matn-kuchsiz">
                <li>Barcha pozitsiya bekor bo&apos;ladi, band qilingan mato omborga qaytadi</li>
                <li>Mijoz qarzi qaytariladi — eski yozuv o&apos;chirilmaydi, teskarisi yoziladi</li>
                <li>
                  To&apos;lov olingan bo&apos;lsa storno <b>ishlamaydi</b>: avval kassa yozuvi
                  storno qilinadi (12.15)
                </li>
                <li>Ish boshlangan bo&apos;lsa ham ishlamaydi — u holda bekor qilinadi</li>
              </ul>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">Sabab</span>
                <input
                  name="sabab"
                  required
                  maxLength={300}
                  placeholder="masalan: mijoz raqami adashib kiritilgan"
                  className={kirishUslubi(holat.xato !== null)}
                />
                <span className="text-xs text-matn-kuchsiz">
                  Olti oydan keyin «bu buyurtma nega yo&apos;q?» degan savolga javob shu
                  yerdan topiladi (2.4)
                </span>
              </label>

              {holat.xato !== null && (
                <p role="alert" className="text-[13px] text-belgi-qizil">
                  {holat.xato}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={kutilmoqda}
                  className="fokus rounded-maydon bg-belgi-qizil px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {kutilmoqda ? 'Bajarilmoqda…' : 'Storno qilish'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ochiqniOzgartir(false);
                  }}
                  className="fokus rounded-maydon px-2 py-2 text-sm text-matn-kuchsiz hover:text-matn"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          )
        }
      />
    </>
  );
}
