'use client';

/**
 * app/(panel)/buyurtma/holat-tuzat.tsx — TZ 8.3 · 2.4
 *
 * «Holatni to'g'rilash» — faqat admin.
 *
 * ⚠️ Ekran OQIBATINI OLDINDAN AYTADI. Egasining qarori
 *    (2026-09-05): odatdagi tugmalar hamma uchun, bu esa alohida
 *    yo'l — sabab majburiy va nima buzilishi yozib qo'yiladi.
 */

import { useActionState, useState } from 'react';
import { Modal } from '../modal';
import { kirishUslubi } from '../maydon';
import { HOLAT_NOMI, POZITSIYA_HOLATLARI, type PozitsiyaHolati } from '@/lib/domain/buyurtma';
import { tuzatishMumkinmi } from '@/lib/amal/holat-tuzat';
import { holatTuzatishAmali } from './holat-tuzat-amal';
import { BOSH_HOLAT_TUZATISH } from './holat-tuzat-holat';

export function HolatTuzatishTugmasi({
  pozitsiyaId,
  tartib,
  joriyHolat,
  buyurtmaRaqam,
}: {
  pozitsiyaId: number;
  tartib: number;
  joriyHolat: string;
  buyurtmaRaqam: string;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(
    holatTuzatishAmali.bind(null, pozitsiyaId),
    BOSH_HOLAT_TUZATISH,
  );

  /**
   * ⚠️ Ro'yxat DOMENDAN keladi (§2.2). Uch holat yo'q: ularga
   *    o'tish yon ta'sir talab qiladi va uni qo'lda bajarib
   *    bo'lmaydi — `lib/amal/holat-tuzat.ts` da sababi yozilgan.
   */
  const tanlanadigan = POZITSIYA_HOLATLARI.filter(
    (h) => tuzatishMumkinmi(h) && h !== joriyHolat,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="fokus rounded-maydon border border-chegara px-2.5 py-1 text-[12px] text-matn-kuchsiz transition-colors hover:border-belgi-sariq hover:text-belgi-sariq"
      >
        Holatni to&apos;g&apos;rilash
      </button>

      <Modal
        ochiq={ochiq}
        yop={() => {
          ochiqniOzgartir(false);
        }}
        sarlavha={`${buyurtmaRaqam} · ${String(tartib)}-pozitsiya`}
        izoh="Holatni qo'lda to'g'rilash (8.3)"
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
              <p className="rounded-maydon bg-fon px-3 py-2.5 text-[13px] text-matn-ikki">
                Hozirgi holat: <b>{HOLAT_NOMI[joriyHolat as PozitsiyaHolati] ?? joriyHolat}</b>
              </p>

              {/*
                ⚠️ Nima QILINMASLIGI ochiq aytiladi. Bu tugma holatni
                   o'zgartiradi, ish emas: mato o'z-o'zidan kesilmaydi
                   va ustaga haq yozilmaydi.
              */}
              <div className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-[13px] text-matn">
                <p className="font-medium">Bu faqat YORLIQNI o&apos;zgartiradi.</p>
                <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-matn-ikki">
                  <li>Mato ombordan yechilmaydi va omborga qaytmaydi</li>
                  <li>Ustaga haq hisoblanmaydi</li>
                  <li>Mijozga xabar ketmaydi</li>
                  <li>Yopiq holatga o&apos;tsa band qilingan mato bo&apos;shatiladi</li>
                </ul>
                <p className="mt-1.5 text-matn-ikki">
                  Ish haqiqatan bajarilgan bo&apos;lsa —{' '}
                  <b>«Ishga oldim»</b> va <b>«Tugatdim»</b> ishlatiladi.
                </p>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">Yangi holat</span>
                <select name="yangiHolat" required className={kirishUslubi(false)}>
                  <option value="">— tanlang —</option>
                  {tanlanadigan.map((h) => (
                    <option key={h} value={h}>
                      {HOLAT_NOMI[h]}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-matn-kuchsiz">
                  «Tikilmoqda» va «Tayyor» ro&apos;yxatda yo&apos;q — ularga haqiqiy
                  amal orqali o&apos;tiladi, aks holda ombor va ish haqi buziladi.
                </span>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-matn-ikki">Sabab</span>
                <input
                  name="sabab"
                  required
                  maxLength={300}
                  placeholder="masalan: mahsulot mijozga berilgan, tizimda qolib ketgan"
                  className={kirishUslubi(holat.xato !== null)}
                />
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
                  className="fokus rounded-maydon bg-belgi-sariq px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {kutilmoqda ? 'Bajarilmoqda…' : "To'g'rilash"}
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
