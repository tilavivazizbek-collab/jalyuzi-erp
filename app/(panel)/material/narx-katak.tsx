'use client';

/**
 * app/(panel)/material/narx-katak.tsx — $ va so'm juftligi.
 *
 * ⚠️ EKRANDA IKKALASI, BAZAGA BITTASI.
 *
 *    Egasi «bu mato 50 dollar» deb o'ylaydi, kassir so'mda ishlaydi.
 *    Shuning uchun ikkala katak ham tahrirlanadi va biri o'zgarsa
 *    ikkinchisi kurs bo'yicha qayta hisoblanadi.
 *
 *    Lekin bazaga FAQAT bitta raqam yoziladi. Ikkalasini saqlash
 *    1.3-invariantni buzardi: kurs o'zgargach ikki raqam bir-biriga
 *    to'g'ri kelmay qolardi va hisobot qaysi birini olishi noaniq
 *    bo'lardi.
 *
 * ⚠️ «Yaxlitlash» — egasi so'm narxini qo'lda tekislab olishi uchun.
 *    50 $ × 11 900 = 595 000, lekin u 600 000 ga sotmoqchi. Yoqilsa
 *    ikkala katak ham qotadi va narx SO'MDA saqlanadi: aks holda
 *    ertaga kurs o'zgarganda 600 000 jimgina 605 000 bo'lib ketardi.
 */

import { useState } from 'react';
import type { NARX_MAYDONLARI } from './maydonlar';
import { Maydon, kirishUslubi } from '../maydon';
import {
  hamrohQiymat,
  narxJuftiniYangila,
  saqlanadiganNarx,
  type NarxJufti,
} from '@/lib/domain/narx-kalkulyatori';

/**
 * ⚠️ Nomlar `NARX_MAYDONLARI` dan olinadi va TIP bilan
 *    cheklangan: xato matn yozib bo'lmaydi, `tsc` to'xtatadi.
 */
type NarxMaydoni = (typeof NARX_MAYDONLARI)[number];

export function NarxKatagi({
  nom,
  valyutaNom,
  yorliq,
  izoh,
  boshNarx,
  boshValyuta,
  kurs,
  xato,
  ozgardi,
}: {
  /**
   * Narx yashirin maydonining nomi.
   *
   * ⚠️ 2026-08-29: valyuta maydoni ilgari `${nom}Valyuta` dan
   *    YASALARDI va `sotuvNarxValyuta` chiqardi — sxema esa
   *    `sotuvValyuta` kutardi. Natijada valyuta hech qachon
   *    yetib bormadi va MATERIAL UMUMAN SAQLANMADI: forma
   *    «qizil maydonlarni to'ldiring» derdi, qizil maydon esa
   *    yo'q edi (valyuta ekranda alohida maydon emas).
   *
   *    Endi ikkala nom TASHQARIDAN, `NARX_MAYDONLARI` dan
   *    keladi va test ularni sxema bilan solishtiradi.
   */
  nom: NarxMaydoni['narx'];
  valyutaNom: NarxMaydoni['valyuta'];
  yorliq: string;
  izoh?: string;
  boshNarx: string;
  boshValyuta: string;
  /** Bugungi kurs — bo'sh bo'lsa hamroh katak hisoblanmaydi */
  kurs: string;
  xato?: string;
  /** Ustama foizini qayta hisoblash uchun */
  ozgardi?: (narx: string, valyuta: string) => void;
}) {
  const [valyuta, valyutaniOzgartir] = useState(boshValyuta);
  const [yaxlitlangan, yaxlitlanganniOzgartir] = useState(false);

  /**
   * ⚠️ Boshlang'ich holat: saqlangan raqam o'z katagiga, ikkinchisi
   *    kurs bo'yicha hisoblanadi. Bazada bitta raqam turgani uchun
   *    ikkinchisi doim HISOBLANGAN qiymat — u saqlanmagan.
   */
  const [jufti, juftiniOzgartir] = useState<NarxJufti>(
    boshValyuta === 'USD'
      ? { dollar: boshNarx, som: hamrohQiymat(boshNarx, kurs, 'USD_DAN_SOMGA') }
      : { dollar: hamrohQiymat(boshNarx, kurs, 'SOM_DAN_USDGA'), som: boshNarx },
  );

  /**
   * ⚠️ Kurs o'zgarsa kataklar qayta hisoblanadi. React ning
   *    «render paytida holatni moslash» usuli — `useEffect` dan
   *    farqli o'laroq bu qo'shimcha chizish bosqichini
   *    yaratmaydi va katak miltillamaydi.
   *
   * ⚠️ Yaxlitlangan bo'lsa hech narsa o'zgarmaydi (funksiya ichida).
   */
  const [oldingiKurs, oldingiKursniOzgartir] = useState(kurs);
  if (kurs !== oldingiKurs) {
    oldingiKursniOzgartir(kurs);
    juftiniOzgartir(narxJuftiniYangila(jufti, 'KURS', kurs, kurs, yaxlitlangan));
  }

  const saqlanadigan = saqlanadiganNarx(jufti, valyuta, yaxlitlangan);

  function yangila(
    manba: 'DOLLAR' | 'SOM',
    qiymat: string,
    yangiYaxlit = yaxlitlangan,
    yangiValyuta = valyuta,
  ): void {
    const y = narxJuftiniYangila(jufti, manba, qiymat, kurs, yangiYaxlit);
    juftiniOzgartir(y);

    const s = saqlanadiganNarx(y, yangiValyuta, yangiYaxlit);
    ozgardi?.(s.narx, s.valyuta);
  }

  function yaxlitlashniAlmashtir(): void {
    const yangi = !yaxlitlangan;
    yaxlitlanganniOzgartir(yangi);

    /**
     * ⚠️ Yaxlitlash yoqilganda valyuta SO'MGA o'tadi — egasi
     *    qotirgan so'm raqami saqlanishi kerak. O'chirilganda
     *    avvalgi tanlov qaytariladi.
     */
    const yangiValyuta = yangi ? 'SOM' : valyuta;
    if (yangi) valyutaniOzgartir('SOM');

    const s = saqlanadiganNarx(jufti, yangiValyuta, yangi);
    ozgardi?.(s.narx, s.valyuta);
  }

  const kursYoq = kurs.trim() === '';

  return (
    <Maydon nom={`${nom}Dollar`} yorliq={yorliq} izoh={izoh} xato={xato}>
      <div className="flex flex-col gap-2">
        {/*
          ⚠️ Bazaga faqat SHU IKKI maydon boradi. Ekrandagi kataklar
             yuborilmaydi — qaysi biri saqlanishini `saqlanadiganNarx`
             hal qiladi.
        */}
        <input type="hidden" name={nom} value={saqlanadigan.narx} />
        <input type="hidden" name={valyutaNom} value={saqlanadigan.valyuta} />

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-4 shrink-0 text-center text-[13px] text-matn-kuchsiz">$</span>
            <input
              id={`${nom}Dollar`}
              value={jufti.dollar}
              onChange={(e) => {
                yangila('DOLLAR', e.target.value);
              }}
              inputMode="decimal"
              placeholder="0"
              aria-label={`${yorliq} — dollar`}
              className={`${kirishUslubi(xato !== undefined)} min-w-0 flex-1`}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-center text-[13px] text-matn-kuchsiz">
              so&apos;m
            </span>
            <input
              id={`${nom}Som`}
              value={jufti.som}
              onChange={(e) => {
                yangila('SOM', e.target.value);
              }}
              inputMode="decimal"
              placeholder="0"
              aria-label={`${yorliq} — so'm`}
              className={`${kirishUslubi(xato !== undefined)} min-w-0 flex-1`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {/*
            ⚠️ Yaxlitlash yoqiq bo'lmasa valyuta tanlanadi: narx
               qaysi valyutada QOTADI degani. Chet matoga $, mahalliy
               aksessuarga so'm.
          */}
          {!yaxlitlangan && (
            <label className="flex items-center gap-1.5 text-[12px] text-matn-kuchsiz">
              Saqlanadi:
              <select
                value={valyuta}
                onChange={(e) => {
                  valyutaniOzgartir(e.target.value);
                  const s = saqlanadiganNarx(jufti, e.target.value, false);
                  ozgardi?.(s.narx, s.valyuta);
                }}
                aria-label={`${yorliq} — saqlanadigan valyuta`}
                className="rounded-maydon border border-chegara bg-sirt px-1.5 py-0.5 text-[12px] text-matn"
              >
                <option value="SOM">so&apos;mda</option>
                <option value="USD">dollarda</option>
              </select>
            </label>
          )}

          <button
            type="button"
            onClick={yaxlitlashniAlmashtir}
            aria-pressed={yaxlitlangan}
            className={`fokus rounded-maydon px-2 py-0.5 text-[12px] font-medium transition-colors ${
              yaxlitlangan
                ? 'bg-brend text-white'
                : 'text-brend hover:bg-brend/10 hover:underline'
            }`}
          >
            {yaxlitlangan ? "✓ So'm narxi qotirilgan" : "So'mni yaxlitlab olish"}
          </button>
        </div>

        {yaxlitlangan && (
          <p className="text-[12px] text-matn-kuchsiz">
            So&apos;m narxi qo&apos;lda kiritildi — kurs o&apos;zgarsa ham o&apos;zgarmaydi.
            Dollar raqami faqat eslatma sifatida turibdi.
          </p>
        )}

        {kursYoq && !yaxlitlangan && (
          <p className="text-[12px] text-belgi-sariq">
            Kurs kiritilmagan — kataklar bir-biriga hisoblanmaydi.
          </p>
        )}
      </div>
    </Maydon>
  );
}
