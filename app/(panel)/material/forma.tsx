'use client';

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { TanlovModal } from '../tanlov-modal';
import { GuruhFormasi } from '../guruh-forma';
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
  koeffitsientniMetrga,
  metrniKoeffitsientga,
  ozgarishSavoli,
  type OlchovBirligi,
} from '@/lib/domain/birlik-tanlovi';
import { ustamaFoizi } from '@/lib/domain/narx-kalkulyatori';
import type { OxirgiKelish } from './malumot';

export interface Guruh {
  readonly id: number;
  readonly nom: string;
}

export interface MaterialQiymatlari {
  readonly nom: string;
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
  readonly almashtirishGuruhId: string;
  readonly yaxlitlashQadami: string;
}

export const BOSH_QIYMATLAR: MaterialQiymatlari = {
  nom: '',
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
  almashtirishGuruhId: '',
  yaxlitlashQadami: '',
};

export function MaterialFormasi({
  amal,
  qiymatlar,
  guruhlar,
  guruhQoshaOladi,
  joriyKurs,
  oxirgiKelish,
  tugmaMatni,
  saqlandi,
  bekor,
  rasmManzili,
}: {
  amal: (holat: FormaHolati, forma: FormData) => Promise<FormaHolati>;
  qiymatlar: MaterialQiymatlari;
  guruhlar: readonly Guruh[];
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
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);

  useSaqlanganda(holat.yaratildi, saqlandi);

  /**
   * ⚠️ React 19 formani amaldan keyin o'zi tozalaydi — xato
   *    bo'lganda ham. Server kiritilgan qiymatlarni qaytaradi va
   *    ular shu yerda qayta ko'rsatiladi.
   */
  const q = (nom: keyof MaterialQiymatlari): string =>
    holat.kiritilgan?.[nom] ?? qiymatlar[nom];

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
  const [sotuvNarx, sotuvNarxniOzgartir] = useState(q('sotuvNarx'));
  const [sotuvValyuta, sotuvValyutaniOzgartir] = useState(q('sotuvValyuta'));

  const tavsif = birlik === null ? null : BIRLIK_TAVSIFI[birlik];

  const ustama = ustamaFoizi(kelishNarx, kelishValyuta, sotuvNarx, sotuvValyuta);

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const chegara = (nom: string): string => kirishUslubi(x(nom) !== undefined);

  return (
    /** `key` — tozalangan maydonlarni qayta yaratadi (`defaultValue` uchun) */
    <form key={holat.urinish ?? 0} action={yubor} className="flex flex-col gap-6">
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
      {tavsif !== null && (
        <>
          <input type="hidden" name="hisobTuri" value={tavsif.hisobTuri} />
          <input type="hidden" name="kirimBirligi" value={tavsif.kirimBirligi} />
          <input type="hidden" name="sarflashBirligi" value={tavsif.sarflashBirligi} />
          <input
            type="hidden"
            name="koeffitsient"
            value={birlikKoeffitsienti(tavsif.ozgarishKerak, ozgarishMetr)}
          />
        </>
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
             tushunmaydi, «1 shtanga necha metr» degan savolni esa
             darhol tushunadi. Bazada u smda saqlanadi (Q-01).
        */}
        {birlik !== null && tavsif?.ozgarishKerak === true && (
          <Maydon
            nom="ozgarishMetr"
            yorliq={ozgarishSavoli(birlik)}
            izoh="masalan: 1 shtanga = 3 metr"
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
              <input
                id="standartRulonEniM"
                name="standartRulonEniM"
                defaultValue={q('standartRulonEniM')}
                inputMode="decimal"
                className={chegara('standartRulonEniM')}
              />
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
                defaultValue={q('odatdagiRulonBoyiM')}
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
            <Maydon nom="koeffitsient" yorliq="Koeffitsient" xato={x('koeffitsient')}>
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
          <NarxKatagi
            nom={NARX_MAYDONLARI[1].narx}
            valyutaNom={NARX_MAYDONLARI[1].valyuta}
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

          <NarxKatagi
            nom={NARX_MAYDONLARI[0].narx}
            valyutaNom={NARX_MAYDONLARI[0].valyuta}
            yorliq="Sotish narxi"
            izoh={tavsif === null ? undefined : `1 ${tavsif.narxBirligi} uchun`}
            boshNarx={qiymatlar.sotuvNarx}
            boshValyuta={qiymatlar.sotuvValyuta}
            kurs={kurs}
            xato={x('sotuvNarx') ?? x('sotuvValyuta')}
            ozgardi={(n, v) => {
              sotuvNarxniOzgartir(n);
              sotuvValyutaniOzgartir(v);
            }}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/*
            ⚠️ Kurs YUBORILMAYDI (`name` yo'q). U faqat ekranda
               $ ↔ so'm ko'rsatish uchun. Kurs bazaga faqat kirim va
               to'lov hujjatlarida yoziladi (9.6) — u yerda qotib
               qoladi va keyin o'zgarmaydi.
          */}
          <Maydon nom="kurs" yorliq="Kurs" izoh="bugungi kurs, faqat ko'rsatish uchun">
            <input
              id="kurs"
              value={kurs}
              onChange={(e) => {
                kursniOzgartir(e.target.value);
              }}
              inputMode="decimal"
              placeholder="masalan 12800"
              className={kirishUslubi(false)}
            />
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
          {ustama !== null && (
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

        {tavsif?.sarflashBirligi === 'SM' && (
          <p className="mt-3 rounded-maydon bg-belgi-sariq-fon px-3 py-2 text-xs text-belgi-sariq ">
            Bu mahsulot <b>santimetrda</b> sarflanadi, narxi esa <b>1 metr</b> uchun yoziladi.
            Tizim o&apos;zi ÷100 qiladi (Q-01).
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-matn">Chegaralar</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Ostatka chegaralari <b>eni bo&apos;yicha, metrda</b> (5.5). Kam qoldiq chegarasi —
          uzunlik bo&apos;yicha (Q-10).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Maydon
            nom="yaroqsizChegaraM"
            yorliq="Yaroqsiz (m)"
            izoh="standart 0.5"
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
            yorliq="Kam ishlatiladigan (m)"
            izoh="standart 1.0"
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
          <Maydon nom="kamQoldiqChegaraM" yorliq="Kam qoldiq (m)" xato={x('kamQoldiqChegaraM')}>
            <input
              id="kamQoldiqChegaraM"
              name="kamQoldiqChegaraM"
              defaultValue={q('kamQoldiqChegaraM')}
              inputMode="decimal"
              className={chegara('kamQoldiqChegaraM')}
            />
          </Maydon>
          <Maydon
            nom="yaxlitlashQadami"
            yorliq="Yaxlitlash qadami"
            izoh="xarid ro'yxati uchun"
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
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
 */
function birlikKoeffitsienti(ozgarishKerak: boolean, ozgarishMetr: string): string {
  if (!ozgarishKerak) return '1';
  if (ozgarishMetr.trim() === '') return '';

  const n = Number(ozgarishMetr);
  if (!Number.isFinite(n) || n <= 0) return '';

  return metrniKoeffitsientga(ozgarishMetr);
}
