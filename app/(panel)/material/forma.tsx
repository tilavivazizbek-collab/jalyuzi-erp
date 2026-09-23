'use client';

import Link from 'next/link';
import { enterYuborilmasin } from '../forma-yordamchi';
import { ZahiraBolimi } from './zahira';
import { SARFLASH_BIRLIGI_NOMI } from '@/lib/sxema/material';
import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { TanlovModal } from '../tanlov-modal';
import { GuruhFormasi } from '../guruh-forma';
import { NarxGuruhFormasi } from '../narx/guruh-forma';
import { NARX_MAYDONLARI } from './maydonlar';
import { NarxKatagi } from './narx-katak';
import { RasmYuklash } from '../rasm-yuklash';
import { BekorQilish, useSaqlanganda } from '../modal-forma';
import type { YaratilganYozuv } from '../modal-holat';
import { BOSH_HOLAT, type FormaHolati } from './holat';
import {
  BIRLIK_TAVSIFI,
  OLCHOV_BIRLIKLARI,
  birlikniTop,
  chegaraBirligi,
  ostatkaChegarasiKerakmi,
  koeffitsientniMetrga,
  metrniKoeffitsientga,
  ozgarishKiritiladimi,
  ozgarishSavoli,
  type OlchovBirligi,
} from '@/lib/domain/birlik-tanlovi';
import { hamrohQiymat, ustamaFoizi } from '@/lib/domain/narx-kalkulyatori';
import type { OxirgiKelish } from './malumot';

export interface Guruh {
  readonly id: number;
  readonly nom: string;
}

export interface MaterialQiymatlari {
  readonly nom: string;
  /** Ta'minotchi artikuli — «BLACKOUT 1120-08» (0050) */
  readonly kod: string;
  readonly hisobTuri: string;
  readonly kirimBirligi: string;
  readonly sarflashBirligi: string;
  readonly koeffitsient: string;
  readonly sotuvNarx: string;
  readonly sotuvValyuta: string;
  readonly kutilayotganKelishNarx: string;
  readonly kutilayotganKelishValyuta: string;
  readonly minUstamaFoiz: string;
  readonly yaroqsizChegaraM: string;
  readonly kamIshlatiladiganM: string;
  readonly kamQoldiqChegaraM: string;
  readonly standartRulonEniM: string;
  readonly odatdagiRulonBoyiM: string;
  readonly kirimNarxAsosi: string;
  readonly almashtirishGuruhId: string;
  /** Mato darajasi — mijoz narxi shundan (egasi qarori 2026-09-20) */
  readonly narxGuruhId: string;
  /** Tayyor mahsulot — to‘g‘ridan-to‘g‘ri sotiladi (egasi qarori 2026-09-20) */
  readonly togridanSotiladi: boolean;
  readonly yaxlitlashQadami: string;
}

export const BOSH_QIYMATLAR: MaterialQiymatlari = {
  nom: '',
  kod: '',
  hisobTuri: 'RULON',
  kirimBirligi: 'rulon',
  sarflashBirligi: 'KV_M',
  koeffitsient: '1',
  sotuvNarx: '',
  sotuvValyuta: 'SOM',
  kutilayotganKelishNarx: '',
  kutilayotganKelishValyuta: 'SOM',
  minUstamaFoiz: '',
  yaroqsizChegaraM: '',
  kamIshlatiladiganM: '',
  kamQoldiqChegaraM: '',
  standartRulonEniM: '',
  odatdagiRulonBoyiM: '',
  kirimNarxAsosi: 'METR',
  almashtirishGuruhId: '',
  narxGuruhId: '',
  togridanSotiladi: false,
  yaxlitlashQadami: '',
};

export function MaterialFormasi({
  amal,
  qiymatlar,
  guruhlar,
  narxGuruhlari = [],
  narxGuruhQoshaOladi = false,
  guruhQoshaOladi,
  joriyKurs,
  oxirgiKelish,
  tugmaMatni,
  saqlandi,
  bekor,
  rasmManzili,
  zahiraSoraladi = false,
}: {
  amal: (holat: FormaHolati, forma: FormData) => Promise<FormaHolati>;
  qiymatlar: MaterialQiymatlari;
  guruhlar: readonly Guruh[];
  /**
   * Mato darajalari. Bo'sh bo'lsa katak umuman chiqmaydi — daraja
   * hali yaratilmagan bo'lsa omborchini chalkashtirmaslik uchun.
   */
  narxGuruhlari?: readonly Guruh[];
  /** §9.4 — `narx.standart.ozgartir`; server amali ham tekshiradi */
  narxGuruhQoshaOladi?: boolean;
  /** Ro'yxat ichidan yangi guruh qo'sha oladimi (§9.4 — server ham tekshiradi) */
  guruhQoshaOladi: boolean;
  /** Bugungi kurs — $ ↔ so'm ko'rsatish uchun. Yo'q bo'lsa hamroh katak jim turadi */
  joriyKurs: string;
  /** TZ 5.4 — haqiqiy kelish narxi kirim hujjatidan keladi, tahrirlanmaydi */
  oxirgiKelish: OxirgiKelish | null;
  tugmaMatni: string;
  /** Modalda beriladi — saqlangach oyna yopiladi va material tanlanadi */
  saqlandi?: (y: YaratilganYozuv) => void;
  bekor?: () => void;
  /** Mavjud rasm manzili — TZ 3.3 katalogi uchun */
  rasmManzili?: string | null;
  /**
   * YANGI mahsulotda «omborda hozir bor» bo'limi ko'rinadi (7.10).
   *
   * ⚠️ Tahrirlashda ko'rinmaydi: qoldiq allaqachon bor va uni
   *    ikkinchi marta qo'shish ombor hisobini ikki barobar
   *    qilib yuborardi.
   */
  zahiraSoraladi?: boolean;
  /**
   * TZ 5.4 · 6.2 — mijoz turlari bo'yicha narxlar.
   *
   * ⚠️ Serverdan keladi: yangi tur qo'shilsa forma KOD
   *    O'ZGARISHISIZ yangi maydonni ko'rsatadi (egasi so'ragan).
   */
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);

  useSaqlanganda(holat.yaratildi, saqlandi);

  /**
   * ⚠️ React 19 formani amaldan keyin o'zi tozalaydi — xato
   *    bo'lganda ham. Server kiritilgan qiymatlarni qaytaradi va
   *    ular shu yerda qayta ko'rsatiladi.
   */
  /** ⚠️ Faqat MATN maydonlari — `togridanSotiladi` mantiqiy, u alohida o'qiladi */
  type MatnMaydoni = {
    [K in keyof MaterialQiymatlari]: MaterialQiymatlari[K] extends string ? K : never;
  }[keyof MaterialQiymatlari];

  const q = (nom: MatnMaydoni): string => holat.kiritilgan?.[nom] ?? qiymatlar[nom];

  /**
   * ⚠️ Eski material qo'lda kiritilgan birlik bilan turishi mumkin
   *    («palka», «bobina»). U ro'yxatga tushmaydi — `null` keladi
   *    va ekran eski uchta maydonni ko'rsatadi. Ma'lumot
   *    YO'QOLMAYDI va jimgina o'zgarmaydi.
   */
  const [birlik, birlikniOzgartir] = useState<OlchovBirligi | null>(
    birlikniTop(q('hisobTuri'), q('kirimBirligi'), q('sarflashBirligi')),
  );

  const [ozgarishMetr, ozgarishMetrniOzgartir] = useState(
    koeffitsientniMetrga(q('koeffitsient')),
  );

  const [kurs, kursniOzgartir] = useState(joriyKurs);

  const [kelishNarx, kelishNarxniOzgartir] = useState(q('kutilayotganKelishNarx'));
  const [kelishValyuta, kelishValyutaniOzgartir] = useState(q('kutilayotganKelishValyuta'));
  /**
   * ⚠️ SOTUV NARXI HOLATI OLIB TASHLANDI — egasi qarori 2026-09-22.
   *
   *    Narx bu sahifadan boshqarilmaydi, shuning uchun uni ushlab
   *    turadigan holat ham kerak emas. Eski qiymat faqat
   *    `qiymatlar.sotuvNarx` da, o'qish uchun turadi.
   *
   * ⚠️ Belgi esa QOLADI: u narx emas, mahsulot TURINI aytadi —
   *    tayyor mahsulot (pult, tayyor parda) o'lchamsiz sotiladi va
   *    sotuv ekranida alohida ro'yxatda chiqadi.
   */
  const [togridanSotiladi, togridanSotiladiniOzgartir] = useState(
    qiymatlar.togridanSotiladi,
  );

  const tavsif = birlik === null ? null : BIRLIK_TAVSIFI[birlik];

  /**
   * ⚠️ Dona mahsulotda ostatka chegaralari KO'RSATILMAYDI (5.5).
   *    Birlik hali tanlanmagan bo'lsa ko'rsatiladi — eski
   *    mahsulotlarda birlik topilmasligi mumkin va maydonlar
   *    jimgina yo'qolib qolmasin.
   */
  const [narxAsosi, narxAsosiniOzgartir] = useState(q('kirimNarxAsosi'));

  /**
   * ⚠️ Odatdagi o'lchamlar BOSHQARILADI: ular kirimni ham,
   *    «Omborda hozir bor» bo'limini ham oldindan to'ldiradi.
   *    Ilgari zahira qatorlari bo'sh ochilar va egasi eni-bo'yini
   *    ikkinchi marta terardi.
   */
  const [rulonEni, rulonEniniOzgartir] = useState(q('standartRulonEniM'));
  const [rulonBoyi, rulonBoyiniOzgartir] = useState(q('odatdagiRulonBoyiM'));

  const ostatkaBor =
    tavsif === null || ostatkaChegarasiKerakmi(tavsif.sarflashBirligi);

  /**
   * ⚠️ Taxminiy ustama SAQLANGAN sotuv narxidan hisoblanadi —
   *    ekrandagi katakdan emas, chunki katak endi yo'q (egasi,
   *    2026-09-22). Eski narxi bor mahsulotda foiz ko'rinib turadi;
   *    narxi `/narx` dan keladiganda esa hisoblab bo'lmaydi va
   *    qator chiqmaydi.
   */
  const ustama = ustamaFoizi(
    kelishNarx,
    kelishValyuta,
    qiymatlar.sotuvNarx,
    qiymatlar.sotuvValyuta,
  );

  /**
   * Kelish narxining SO'MDAGI qiymati.
   *
   * ⚠️ Egasi (2026-08-30): «mahsulotning narxi doim 2 xil qiymatda
   *    bo'ladi: $ qiymati va so'm qiymati».
   *
   *    To'g'ri: narx katagida ikkalasi ham turadi, bazaga esa
   *    faqat bittasi yoziladi (1.3-invariant). Zahira tannarxi
   *    SO'MDA saqlanadi, shuning uchun bu yerda so'mdagisi
   *    olinadi — dollarda yozilgan bo'lsa kurs bo'yicha.
   *
   * ⚠️ Kurs yo'q bo'lsa bo'sh qoladi: taxminiy kurs bilan tannarx
   *    yozib qo'yish butun foyda hisobotini buzardi.
   */
  const kelishSom =
    kelishValyuta === 'SOM'
      ? kelishNarx
      : hamrohQiymat(kelishNarx, kurs, 'USD_DAN_SOMGA');

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const chegara = (nom: string): string => kirishUslubi(x(nom) !== undefined);

  return (
    /** `key` — tozalangan maydonlarni qayta yaratadi (`defaultValue` uchun) */
    <form key={holat.urinish ?? 0} action={yubor} onKeyDown={enterYuborilmasin} className="flex flex-col gap-6">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      {/*
        ⚠️ Uchta ustun bazada QOLDI — ular kirimda, band qilishda va
           hisobotlarda ishlatiladi. Ekranda esa bitta tanlov turadi
           va u shu uchtasini o'zi to'ldiradi. Noto'g'ri uchlik
           (rulon + dona + SM) endi yaratib bo'lmaydi.
      */}
      {tavsif !== null && birlik !== null && (
        <>
          <input type="hidden" name="hisobTuri" value={tavsif.hisobTuri} />
          <input type="hidden" name="kirimBirligi" value={tavsif.kirimBirligi} />
          <input type="hidden" name="sarflashBirligi" value={tavsif.sarflashBirligi} />
          <input
            type="hidden"
            name="koeffitsient"
            value={birlikKoeffitsienti(birlik, ozgarishMetr)}
          />
        </>
      )}

      {/*
        ⚠️ Rulon bo'lmasa tanlov ko'rinmaydi, lekin qiymat baribir
           YUBORILADI: bo'sh maydon `z.enum` da xato beradi va u
           xato ekranda hech qayerda ko'rinmasdi.
      */}
      {tavsif?.olchamliMi !== true && (
        <input type="hidden" name="kirimNarxAsosi" value="BIRLIK" />
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          {/*
            ⚠️ Mato rasmi sotuvda ko'rinadi: mijoz «qaysi rang?»
               deganda sotuvchi ekranni buradi (3.3).
          */}
          <RasmYuklash nom="rasm" joriyManzil={rasmManzili ?? null} yorliq="Mato rasmi" />
        </div>

        <div className="sm:col-span-2">
          <Maydon nom="nom" yorliq="Nomi" xato={x('nom')}>
            <input
              id="nom"
              name="nom"
              defaultValue={q('nom')}
              required
              className={chegara('nom')}
            />
          </Maydon>

        {/*
          ⚠️ ARTIKUL — egasi qarori 2026-09-22 (0050).

             Ta'minotchi «1120-08» deb gapiradi, korxona «Blackout oq»
             deb. Ikkalasini bog'laydigan narsa yo'q edi: hisob-faktura
             qo'lda solishtirilardi va bir xil mato ikki xil nom bilan
             ikki marta kiritilishi mumkin edi.

             Ixtiyoriy, lekin kiritilsa TAKRORLANMAYDI — bazada qisman
             unique indeks bor. Ro'yxatdagi qidiruv nom bo'yicha ham,
             kod bo'yicha ham ishlaydi.
        */}
        <Maydon
          nom="kod"
          yorliq="Artikul (ta'minotchi kodi)"
          izoh="ixtiyoriy — qidiruvda ishlatiladi, takrorlanmaydi"
          xato={x('kod')}
        >
          <input
            id="kod"
            name="kod"
            defaultValue={qiymatlar.kod}
            maxLength={60}
            placeholder="BLACKOUT 1120-08"
            className={chegara('kod')}
          />
        </Maydon>
        </div>

        {/*
          ⚠️ «+ Yangi guruh» modal oynada ochiladi — omborchi
             material kiritayotib boshqa sahifaga o'tib ketmasin.
        */}
        <TanlovModal
          nom="almashtirishGuruhId"
          yorliq="Guruhi"
          izoh="sotuvda shu guruh chiqadi"
          bandlar={guruhlar}
          boshlangich={qiymatlar.almashtirishGuruhId}
          yangiYorliq="Yangi guruh"
            boshqaruvYoli="/guruh"
          modalSarlavha="Yangi guruh"
          qoshaOladi={guruhQoshaOladi}
          forma={(saqla, yop) => <GuruhFormasi saqlandi={saqla} bekor={yop} />}
        />

        {/*
          ⚠️ MATO DARAJASI — mijoz narxi shundan hisoblanadi (egasi
             qarori 2026-09-20). «Guruhi» dan FARQ QILADI:

               Guruhi  — slotda qaysi materiallar chiqadi
               Daraja  — ulardan qaysi biri qimmat

             Daraja yaratilmagan bo'lsa katak umuman chiqmaydi:
             bo'sh ro'yxat omborchini chalkashtirardi.
        */}
        {narxGuruhlari.length > 0 && (
          <TanlovModal
            nom="narxGuruhId"
            /*
              ⚠️ «Mato darajasi» EDI (2026-09-22 gacha). Daraja endi
                 matoga ham, karnizga ham, donalab sotiladigan buyumga
                 ham qo'yiladi — egasi qarori 2026-09-22 («ko'p olganga
                 arzonroq»). Karniz kartochkasida «Mato darajasi»
                 degan yorliq turgani odamni «bu menga tegishli emas»
                 deb o'ylashga majburlardi.
            */
            yorliq="Narx darajasi"
            izoh="mijoz narxi shu darajaga qarab hisoblanadi"
            bandlar={narxGuruhlari}
            boshlangich={qiymatlar.narxGuruhId}
            boshMatn="— narxga kirmaydi —"
            yangiYorliq="Yangi daraja"
            modalSarlavha="Yangi narx darajasi"
            modalIzoh="Narx jadvali shu darajalar bo‘yicha to‘ldiriladi"
            boshqaruvYoli="/narx"
            qoshaOladi={narxGuruhQoshaOladi}
            forma={(saqla, yop) => <NarxGuruhFormasi saqlandi={saqla} bekor={yop} />}
          />
        )}

        <Maydon
          nom="olchovBirligi"
          yorliq="O'lchov birligi"
          izoh="ombor shunday qabul qiladi"
          xato={x('hisobTuri') ?? x('kirimBirligi') ?? x('sarflashBirligi')}
        >
          <select
            id="olchovBirligi"
            value={birlik ?? ''}
            onChange={(e) => {
              birlikniOzgartir(e.target.value as OlchovBirligi);
            }}
            className={kirishUslubi(false)}
          >
            {birlik === null && <option value="">— eski birlik —</option>}
            {OLCHOV_BIRLIKLARI.map((b) => (
              <option key={b} value={b}>
                {BIRLIK_TAVSIFI[b].nom}
              </option>
            ))}
          </select>
        </Maydon>

        {/*
          ⚠️ «Koeffitsient» so'zi ekranda ISHLATILMAYDI. Omborchi uni
             tushunmaydi, «bitta shtanga necha metr material» degan
             savolni esa darhol tushunadi.

          ⚠️ 2026-09-20 — baza ham METRDA. Yozilgan son o'zgarishsiz
             saqlanadi, ×100 YO'Q.
        */}
        {birlik !== null && ozgarishKiritiladimi(birlik) && (
          <Maydon
            nom="ozgarishMetr"
            yorliq={ozgarishSavoli(birlik)}
            izoh="masalan: bitta shtanga = 5 metr material"
            xato={x('koeffitsient')}
          >
            <input
              id="ozgarishMetr"
              value={ozgarishMetr}
              onChange={(e) => {
                ozgarishMetrniOzgartir(e.target.value);
              }}
              required
              inputMode="decimal"
              className={chegara('koeffitsient')}
            />
          </Maydon>
        )}

        {/*
          ⚠️ Eni va bo'yi rulonning YONIDA turadi — ular chegaralarga
             emas, o'lchov birligiga tegishli.

          ⚠️ Ikkalasi ham HISOBGA TEGMAYDI. Har rulon boshqa o'lchamda
             keladi va qoldiq doim HAQIQIY o'lchamdan hisoblanadi
             (7.4, Q-05). Bular kirim formasini oldindan to'ldiradi.
        */}
        {tavsif?.olchamliMi === true && (
          <>
            <Maydon
              nom="standartRulonEniM"
              yorliq="Rulon eni (m)"
              izoh="kirimda oldindan to'ldiriladi"
              xato={x('standartRulonEniM')}
            >
              {/*
                ⚠️ Boshqariladigan katak: shu yerda yozilgan eni
                   «Omborda hozir bor» bo'limidagi rulon qatorlarini
                   ham O'ZI to'ldiradi (2026-08-30).
              */}
              <input
                id="standartRulonEniM"
                name="standartRulonEniM"
                value={rulonEni}
                onChange={(e) => {
                  rulonEniniOzgartir(e.target.value);
                }}
                inputMode="decimal"
                className={chegara('standartRulonEniM')}
              />
            </Maydon>

            {/*
              ⚠️ Egasi (2026-08-30): «rulon bo'lsa narx 2 xil
                 bo'ladi: bo'yi × narx (50 × 5 $ = 250 $) yoki
                 bo'yi × eni × narx (50 × 3 × 5 $ = 750 $)».

              ⚠️ FAQAT KIRIMGA taalluqli. Sotuvda har doim kv.m
                 ishlaydi — bu tanlov sotuv narxiga tegmaydi.
            */}
            <Maydon
              nom="kirimNarxAsosi"
              yorliq="Kirimda narx qanday hisoblanadi"
              izoh="sotuvga tegmaydi"
              xato={x('kirimNarxAsosi')}
            >
              <select
                id="kirimNarxAsosi"
                name="kirimNarxAsosi"
                value={narxAsosi}
                onChange={(e) => {
                  narxAsosiniOzgartir(e.target.value);
                }}
                className={chegara('kirimNarxAsosi')}
              >
                <option value="METR">Bo&apos;yiga — 50 m × 5 = 250</option>
                <option value="KV_M">Kv.m ga — 50 × 3 × 5 = 750</option>
                <option value="BIRLIK">Rulonga — 1 rulon narxi</option>
              </select>
            </Maydon>

            <Maydon
              nom="odatdagiRulonBoyiM"
              yorliq="Rulon bo'yi (m)"
              izoh="odatdagi uzunlik, omborchi o'zgartira oladi"
              xato={x('odatdagiRulonBoyiM')}
            >
              <input
                id="odatdagiRulonBoyiM"
                name="odatdagiRulonBoyiM"
                value={rulonBoyi}
                onChange={(e) => {
                  rulonBoyiniOzgartir(e.target.value);
                }}
                inputMode="decimal"
                className={chegara('odatdagiRulonBoyiM')}
              />
            </Maydon>
          </>
        )}
      </section>

      {/*
        ⚠️ Eski material standart bo'lmagan birlik bilan turibdi. Uni
           jimgina o'zgartirish — ombor qoldig'ini buzish (5.3).
           Shuning uchun eski qiymatlar ko'rsatiladi va ro'yxatdan
           yangisi tanlanmaguncha o'zgarmaydi.
      */}
      {tavsif === null && (
        <section className="rounded-karta border border-belgi-sariq/40 bg-belgi-sariq-fon p-4">
          <p className="mb-3 text-xs text-belgi-sariq">
            Bu materialda eski, ro&apos;yxatda yo&apos;q birlik turibdi. Yuqoridagi
            ro&apos;yxatdan yangisini tanlamaguningizcha quyidagilar o&apos;zgarmaydi.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Maydon nom="hisobTuri" yorliq="Hisob turi" xato={x('hisobTuri')}>
              <input
                id="hisobTuri"
                name="hisobTuri"
                defaultValue={q('hisobTuri')}
                className={chegara('hisobTuri')}
              />
            </Maydon>
            <Maydon nom="kirimBirligi" yorliq="Kirim birligi" xato={x('kirimBirligi')}>
              <input
                id="kirimBirligi"
                name="kirimBirligi"
                defaultValue={q('kirimBirligi')}
                className={chegara('kirimBirligi')}
              />
            </Maydon>
            <Maydon nom="sarflashBirligi" yorliq="Sarflash birligi">
              <input
                id="sarflashBirligi"
                name="sarflashBirligi"
                defaultValue={q('sarflashBirligi')}
                className={chegara('sarflashBirligi')}
              />
            </Maydon>
            {/*
              ⚠️ Bu katak faqat ESKI, ro'yxatga tushmagan birlikli
                 materialda ko'rinadi. Birligi aytilmasa omborchi
                 metr deb yozib qo'yardi va sarf 100 barobar xato
                 chiqardi. 2026-09-20 dan koeffitsient METRDA — ya'ni
                 endi «metr deb yozish» to'g'ri javob.
            */}
            <Maydon
              nom="koeffitsient"
              yorliq="Koeffitsient — 1 kirim birligida necha METR"
              izoh="masalan 1 shtanga = 3 metr bo‘lsa, bu yerga 3 yoziladi"
              xato={x('koeffitsient')}
            >
              <input
                id="koeffitsient"
                name="koeffitsient"
                defaultValue={q('koeffitsient')}
                inputMode="decimal"
                className={chegara('koeffitsient')}
              />
            </Maydon>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-matn">Narx</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/*
            ⚠️ Belgi SOTUV NARXINI ochadi. Egasi (2026-09-20): «mahsulot
               qo'shish sahifasidan sotuv narxini olib tashlaymiz, faqat
               kelish narxini yozamiz».

               Jalyuzi narxi «Narxlar va turlar» jadvalidan keladi.
               Tayyor mahsulot esa o'lchamsiz sotiladi va unga baribir
               narx kerak — shuning uchun butunlay olib tashlanmadi,
               yashirildi.
          */}
          <label className="flex items-start gap-2 sm:col-span-2">
            <input
              type="checkbox"
              name="togridanSotiladi"
              checked={togridanSotiladi}
              onChange={(e) => {
                togridanSotiladiniOzgartir(e.target.checked);
              }}
              className="mt-0.5"
            />
            <span>
              <span className="text-sm text-matn">To&apos;g&apos;ridan-to&apos;g&apos;ri sotiladi</span>
              <span className="block text-[12px] text-matn-kuchsiz">
                tayyor mahsulot — o&apos;lchamsiz sotiladi (pult, tayyor parda).
                Jalyuzi matosiga bu belgi KERAK EMAS: uning narxi «Narxlar va
                turlar» dan keladi.
              </span>
            </span>
          </label>

          <NarxKatagi
            nom={NARX_MAYDONLARI[0].narx}
            valyutaNom={NARX_MAYDONLARI[0].valyuta}
            yorliq="Kelish narxi"
            izoh={
              tavsif === null
                ? 'kutilayotgan'
                : `kutilayotgan — 1 ${tavsif.kirimBirligi} uchun`
            }
            boshNarx={qiymatlar.kutilayotganKelishNarx}
            boshValyuta={qiymatlar.kutilayotganKelishValyuta}
            kurs={kurs}
            xato={x('kutilayotganKelishNarx') ?? x('kutilayotganKelishValyuta')}
            ozgardi={(n, v) => {
              kelishNarxniOzgartir(n);
              kelishValyutaniOzgartir(v);
            }}
          />

          {/*
            ⚠️ SOTISH NARXI KATAGI OLIB TASHLANDI — egasi qarori
               2026-09-22: «u pageda narx kiritish kerak emas, tur va
               narx pageda narx qo'yish kerak».

               O'rniga yo'l ko'rsatiladi. Eski narx bazada qoladi va
               `/narx` to'lguncha zaxira bo'lib ishlaydi — shuning
               uchun u YASHIRILMAYDI, faqat o'zgartirib bo'lmaydi:
               ko'rinmaydigan eski narx jimgina qo'llanaverishi
               ko'rinadiganidan yomonroq.
          */}
          {togridanSotiladi && (
            <div className="sm:col-span-2 rounded-maydon bg-fon px-3 py-2.5 text-[13px]">
              {qiymatlar.narxGuruhId === '' ? (
                <p className="text-belgi-qizil">
                  ⚠ Narx darajasi tanlanmagan — bu mahsulot{' '}
                  <b>sotuvda narxsiz qoladi</b>. Yuqoridan daraja tanlang, keyin{' '}
                  <Link href="/narx?tur=material" className="underline">
                    Narxlar va turlar
                  </Link>{' '}
                  da o&apos;sha darajaga narx qo&apos;ying.
                </p>
              ) : (
                <p className="text-matn-ikki">
                  Narxi{' '}
                  <Link href="/narx?tur=material" className="text-brend underline">
                    Narxlar va turlar → Materialni o&apos;zi sotish
                  </Link>{' '}
                  dan, tanlangan darajaga qarab olinadi.
                </p>
              )}
              {qiymatlar.sotuvNarx !== '' && (
                <p className="mt-1.5 text-matn-kuchsiz">
                  Eski narx: <b className="raqam">{qiymatlar.sotuvNarx}</b>{' '}
                  {qiymatlar.sotuvValyuta}. Jadval to&apos;lguncha zaxira sifatida
                  ishlaydi, bu yerdan o&apos;zgartirilmaydi.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/*
            ⚠️ Kurs YUBORILMAYDI (`name` yo'q). U faqat ekranda
               $ ↔ so'm ko'rsatish uchun. Kurs bazaga faqat kirim va
               to'lov hujjatlarida yoziladi (9.6) — u yerda qotib
               qoladi va keyin o'zgarmaydi.
          */}
          <Maydon
            nom="kurs"
            yorliq="Kurs — 1 dollar necha so'm"
            izoh={
              joriyKurs === ''
                ? "belgilanmagan — Sozlash → Dollar kursi"
                : "bugungi kurs, faqat ko'rsatish uchun — saqlanmaydi"
            }
          >
            <input
              id="kurs"
              value={kurs}
              onChange={(e) => {
                kursniOzgartir(e.target.value);
              }}
              inputMode="decimal"
              placeholder="masalan 12800"
              className={kirishUslubi(joriyKurs === '')}
            />
            {/*
              ⚠️ Kurs bazada belgilanmagan bo'lsa, bu yerda yozilgani
                 SAQLANMAYDI — u faqat shu ekranda ko'rsatish uchun.
                 Havola aynan shuni aytadi, aks holda egasi har
                 mahsulotda qaytadan terardi (2026-08-30).
            */}
            {joriyKurs === '' && (
              <a
                href="/kurs"
                target="_blank"
                rel="noopener"
                className="mt-1 inline-block text-[12px] text-brend hover:underline"
              >
                Kursni belgilash ↗
              </a>
            )}
          </Maydon>

          <Maydon
            nom="minUstamaFoiz"
            yorliq="Min. ustama %"
            izoh="bo'sh → sozlamadagi standart"
            xato={x('minUstamaFoiz')}
          >
            <input
              id="minUstamaFoiz"
              name="minUstamaFoiz"
              defaultValue={q('minUstamaFoiz')}
              inputMode="decimal"
              className={chegara('minUstamaFoiz')}
            />
          </Maydon>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          {togridanSotiladi && ustama !== null && (
            <span className="text-matn-ikki">
              Taxminiy ustama: <b className="text-matn">{ustama}%</b>
            </span>
          )}

          {/*
            ⚠️ TZ 5.4 — «Tannarx qo'lda kiritilmaydi.» Haqiqiy kelish
               narxi faqat shu yerda, o'qish uchun. Yuqoridagi «kelish
               narxi» esa taxmin: ikkalasi sanasi bilan ajratiladi.
          */}
          {oxirgiKelish !== null && (
            <span className="text-matn-kuchsiz">
              Oxirgi haqiqiy kelish narxi:{' '}
              <b className="text-matn-ikki">
                {oxirgiKelish.narx} {oxirgiKelish.valyuta === 'USD' ? '$' : "so'm"}
              </b>{' '}
              ({oxirgiKelish.sana})
            </span>
          )}
        </div>

        {/*
          ⚠️ TZ 5.4 · 6.2 — tur narxlari. Dinamik: spravochnikdagi
             har faol tur uchun bitta katak.
        */}
        {/*
          ⚠️ Mijoz turi narxi ham SOTUV narxining bir turi (TZ 6.2) —
             u ham faqat to'g'ridan-to'g'ri sotiladigan mahsulotda
             ma'noga ega. Jalyuzida mijoz turi «Narxlar va turlar»
             jadvalida, qoida qatorida tanlanadi.
        */}
        {/*
          ⚠️ «Mijoz turi bo'yicha narx» bloki ham OLIB TASHLANDI
             (egasi, 2026-09-22): u ham SOTUV narxining bir turi.

             Mijoz turiga narx endi `/narx` jadvalining qoida
             qatorida tanlanadi — bitta joyda, jalyuzi bilan bir xil
             usulda.

          ⚠️ Mavjud `material_tur_narx` yozuvlari O'CHIRILMAYDI:
             forma ularni endi yubormaydi, `turNarxlariniYozTx` esa
             bo'sh ro'yxatda hech narsaga tegmaydi.
        */}

        {tavsif?.sarflashBirligi === 'M' && (
          <p className="mt-3 rounded-maydon bg-belgi-sariq-fon px-3 py-2 text-xs text-belgi-sariq ">
            Bu mahsulot <b>metrda</b> sarflanadi, narxi ham <b>1 metr</b> uchun yoziladi
            — ikkalasi bir xil birlikda (Q-01).
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-matn">Chegaralar</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          {ostatkaBor ? (
            <>
              Ostatka chegaralari <b>eni bo&apos;yicha, metrda</b> (5.5). Kam qoldiq
              chegarasi — uzunlik bo&apos;yicha (Q-10).
            </>
          ) : (
            <>
              Dona mahsulotda ostatka bo&apos;lmaydi — u yo butun, yo yo&apos;q. Kam
              qoldiq chegarasi <b>donada</b> yoziladi (Q-10).
            </>
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/*
            ⚠️ «Yaroqsiz» va «kam ishlatiladigan» — KESILGAN QOLDIQ
               enining darajasi (5.5). Dona mahsulotda kesim ham,
               qoldiq eni ham yo'q, shuning uchun bu ikki maydon
               umuman ko'rsatilmaydi.
          */}
          {ostatkaBor && (
            <>
              <Maydon
                nom="yaroqsizChegaraM"
            yorliq="Yaroqsiz qoldiq eni (metr)"
            izoh="shundan tor qoldiq chiqindiga ketadi · standart 0.5 m"
            xato={x('yaroqsizChegaraM')}
          >
            <input
              id="yaroqsizChegaraM"
              name="yaroqsizChegaraM"
              defaultValue={q('yaroqsizChegaraM')}
              inputMode="decimal"
              className={chegara('yaroqsizChegaraM')}
            />
          </Maydon>
          <Maydon
            nom="kamIshlatiladiganM"
            yorliq="Kam ishlatiladigan qoldiq eni (metr)"
            izoh="shundan tor qoldiq saqlanadi, lekin belgilanadi · standart 1.0 m"
            xato={x('kamIshlatiladiganM')}
          >
            <input
              id="kamIshlatiladiganM"
              name="kamIshlatiladiganM"
              defaultValue={q('kamIshlatiladiganM')}
              inputMode="decimal"
              className={chegara('kamIshlatiladiganM')}
            />
              </Maydon>
            </>
          )}

          <Maydon
            nom="kamQoldiqChegaraM"
            yorliq={`Kam qoldiq (${chegaraBirligi(tavsif?.sarflashBirligi ?? '')})`}
            izoh={
              ostatkaBor
                ? 'shundan kam qolsa ogohlantiradi — uzunlik bo‘yicha, metrda'
                : 'masalan 10 — 10 donadan kam qolsa ogohlantiradi'
            }
            xato={x('kamQoldiqChegaraM')}
          >
            <input
              id="kamQoldiqChegaraM"
              name="kamQoldiqChegaraM"
              defaultValue={q('kamQoldiqChegaraM')}
              inputMode="decimal"
              className={chegara('kamQoldiqChegaraM')}
            />
          </Maydon>
          {/*
            ⚠️ Birligi KIRIM birligida — omborchi shu birlikda xarid
               qiladi. «2» degani «ikkitalab olinadi»: 3 ta kerak
               bo'lsa 4 ta buyurtma qilinadi.
          */}
          <Maydon
            nom="yaxlitlashQadami"
            yorliq={
              tavsif === null
                ? 'Yaxlitlash qadami'
                : `Yaxlitlash qadami (${tavsif.kirimBirligi})`
            }
            izoh={
              tavsif === null
                ? "xarid ro'yxatida shuncha donadan yaxlitlanadi"
                : `xaridda shuncha ${tavsif.kirimBirligi}dan yaxlitlanadi — masalan 2`
            }
            xato={x('yaxlitlashQadami')}
          >
            <input
              id="yaxlitlashQadami"
              name="yaxlitlashQadami"
              defaultValue={q('yaxlitlashQadami')}
              inputMode="decimal"
              className={chegara('yaxlitlashQadami')}
            />
          </Maydon>
        </div>
      </section>

      {/*
        ⚠️ Zahira bo'limi eng oxirida: avval mahsulot ta'riflanadi
           (nomi, birligi, narxi), keyin «hozir nechta bor?»
           deb so'raladi. Teskarisi mantiqsiz bo'lardi.
      */}
      {zahiraSoraladi && (
        <ZahiraBolimi
          rulonmi={tavsif?.olchamliMi === true}
          birlikNomi={
            tavsif === null
              ? 'birlik'
              : (SARFLASH_BIRLIGI_NOMI[tavsif.sarflashBirligi] ??
                tavsif.sarflashBirligi)
          }
          narxAsosi={narxAsosi}
          xatolar={holat.zahiraXatolari ?? {}}
          boshEni={rulonEni}
          boshBoyi={rulonBoyi}
          /**
           * ⚠️ Kelish narxi SHU YERDAN keladi — egasi uni ikkinchi
           *    marta terishi shart emas (2026-08-30).
           *
           * ⚠️ Faqat SO'MDA: bo'lak tannarxi so'mda saqlanadi.
           *    Dollardagi narx to'g'ridan-to'g'ri qo'yilsa,
           *    50 so'm bo'lib yozilib ketardi.
           */
          boshNarx={kelishSom}
          narxValyutasi={kelishValyuta}
          kursBormi={kurs.trim() !== ''}
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : tugmaMatni}
        </button>
        <BekorQilish yol="/material" bekor={bekor} />
      </div>
    </form>
  );
}

/**
 * Ekrandagi metrni bazadagi koeffitsientga o'giradi.
 *
 * ⚠️ Bo'sh yoki noto'g'ri kiritilgan bo'lsa BO'SH yuboriladi —
 *    Zod sxemasi uni ushlaydi va odam tushunarli xato ko'radi.
 *    Bu yerda «1» deb to'ldirib qo'yish jimgina noto'g'ri
 *    konversiya yaratardi.
 *
 * ⚠️ METR uchun bu yerda maxsus shoxcha bor edi va u `100` qaytarardi
 *    («1 metr = 100 sm»). Santimetr davridan qolgan: tizim 2026-09-20
 *    dan butunlay metrda, demak kirim metri = sarflash metri = 1.
 *    Shoxcha o'chirildi, javob endi BIR JOYDA — `BIRLIK_TAVSIFI`
 *    jadvalida (§2.2).
 */
function birlikKoeffitsienti(birlik: OlchovBirligi, ozgarishMetr: string): string {
  const ozgarishKerak = BIRLIK_TAVSIFI[birlik].ozgarishKerak;
  if (!ozgarishKerak) return '1';
  if (ozgarishMetr.trim() === '') return '';

  const n = Number(ozgarishMetr);
  if (!Number.isFinite(n) || n <= 0) return '';

  return metrniKoeffitsientga(ozgarishMetr);
}
