'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../maydon';
import { TanlovModal, type TanlovBandi } from '../tanlov-modal';
import { MijozGuruhFormasi } from './guruh/forma';
import { TurFormasi } from './turi/forma';
import { BOSH_HOLAT, type MijozHolati } from './holat';
import { OFFSET_TURI_NOMI, OFFSET_TURLARI } from '@/lib/sxema/mijoz';

export interface MijozQiymatlari {
  readonly ism: string;
  readonly telefon: string;
  readonly manzil: string;
  readonly eslatma: string;
  readonly mijozGuruhId: string;
  readonly offsetTuri: string;
  readonly offsetQiymat: string;
  readonly qarzLimiti: string;
  readonly shaxsTuri: string;
  /** TZ 6.2 — narx darajasi */
  readonly mijozTuriId: string;
  readonly tashkilotNomi: string;
  readonly inn: string;
  readonly yuridikManzil: string;
  readonly bankNomi: string;
  readonly hisobRaqam: string;
  readonly mfo: string;
  readonly shartnomaRaqam: string;
  /** `YYYY-MM-DD` — bo'sh bo'lishi mumkin */
  readonly shartnomaSana: string;
  readonly ndsStavka: string;
  /** Egasi auditi 2026-10-06 — qarz necha kunda to'lanishi kerak */
  readonly tolovMuddatiKun: string;
  /** Mijoz qaysi sotuvchiga biriktirilgan */
  readonly masulXodimId: string;
  /** Qayerdan keldi — reklama qaysi kanaldan ishlayotgani */
  readonly manba: string;
}

/**
 * Mijoz manbalari — egasi auditi 2026-10-06.
 *
 * ⚠️ Ro'yxat MASLAHAT, majburiy emas: «Boshqa» tanlansa ham
 *    saqlanadi. Bazada oddiy matn — yangi kanal qo'shish uchun
 *    migratsiya kerak bo'lmasin.
 */
export const MIJOZ_MANBALARI = [
  'Instagram',
  'Telegram',
  'Tavsiya (tanish)',
  "Ko'chadan / do'kondan",
  'Usta orqali',
  'Qayta sotuvchi',
  'Boshqa',
] as const;

export const BOSH_QIYMATLAR: MijozQiymatlari = {
  ism: '',
  telefon: '',
  manzil: '',
  eslatma: '',
  mijozGuruhId: '',
  offsetTuri: '',
  offsetQiymat: '',
  qarzLimiti: '',
  shaxsTuri: 'JISMONIY',
  mijozTuriId: '',
  tashkilotNomi: '',
  inn: '',
  yuridikManzil: '',
  bankNomi: '',
  hisobRaqam: '',
  mfo: '',
  shartnomaRaqam: '',
  shartnomaSana: '',
  ndsStavka: '',
  tolovMuddatiKun: '',
  masulXodimId: '',
  manba: '',
};

export function MijozFormasi({
  amal,
  qiymatlar,
  tugmaMatni,
  guruhlar = [],
  guruhQoshaOladi = false,
  turlar = [],
  turQoshaOladi = false,
  xodimlar = [],
  saqlandi,
  bekor,
}: {
  amal: (holat: MijozHolati, forma: FormData) => Promise<MijozHolati>;
  qiymatlar: MijozQiymatlari;
  tugmaMatni: string;
  /** TZ 6.3 — chegirma guruhlari */
  guruhlar?: readonly TanlovBandi[];
  guruhQoshaOladi?: boolean;
  /** TZ 6.2 — mijoz turlari (narx darajasi) */
  turlar?: readonly { id: number; nom: string; soliqKerak: boolean }[];
  turQoshaOladi?: boolean;
  /** Mas'ul sotuvchi tanlovi uchun */
  xodimlar?: readonly { id: number; nom: string }[];
  /**
   * ⚠️ Modal oynada beriladi. O'z sahifasida saqlangach ro'yxatga
   *    yo'naltiriladi, shuning uchun u yerda bu chaqirilmaydi.
   */
  saqlandi?: (mijoz: { id: number; ism: string }) => void;
  /** Modalda — oynani yopadi. Sahifada — ro'yxatga havola */
  bekor?: () => void;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);

  /**
   * ⚠️ REACT 19 FORMANI AMALDAN KEYIN O'ZI TOZALAYDI.
   *
   *    Xato bo'lganda ham tozalaydi — React amal muvaffaqiyatli
   *    tugadimi yoki yo'qmi bilmaydi. Natijada odam formani
   *    to'ldirib «Saqlash» bosardi, «xato bor» degan xabar
   *    chiqardi va SHU PAYTDA hamma yozgani yo'qolardi.
   *
   *    Server xato qaytarganda kiritilgan qiymatlarni ham
   *    qaytaradi va ular shu yerda qayta ko'rsatiladi.
   */
  const q = (nom: keyof MijozQiymatlari): string =>
    holat.kiritilgan?.[nom] ?? qiymatlar[nom];

  /**
   * ⚠️ Saqlangani XABAR QILINADI, lekin faqat bir marta. Aks holda
   *    har qayta chizilganda oyna qayta-qayta yopilishga urinardi.
   */
  const xabarBerildi = useRef(false);
  useEffect(() => {
    if (holat.yaratildi === null || xabarBerildi.current) return;
    xabarBerildi.current = true;
    saqlandi?.(holat.yaratildi);
  }, [holat.yaratildi, saqlandi]);
  /**
   * ⚠️ Soliq maydonlari TANLANGAN TURGA qarab ochiladi. Tur
   *    o'zgarsa bo'lim darhol paydo bo'ladi yoki yo'qoladi.
   */
  const [turId, setTurId] = useState(q('mijozTuriId'));
  const soliqKerak = turlar.find((t) => String(t.id) === turId)?.soliqKerak === true;
  const [offsetTuri, setOffsetTuri] = useState(q('offsetTuri'));

  /**
   * ⚠️ CHEGIRMA / USTAMA — egasi auditi 2026-10-06 (2-xato).
   *
   *    Bazada offset ISHORALI turadi: manfiy — chegirma, musbat —
   *    ustama (`offsetQolla`: −3 → × 0.97). Ekranda esa bo'lim
   *    «Chegirma» deb atalardi va «10» yozilsa narx 10% OSHARDI.
   *
   *    Endi yo'nalish alohida tanlanadi, son doim MUSBAT yoziladi.
   *    Ishora shu yerda qo'yiladi va server avvalgidek ishorali
   *    qiymat oladi — bazadagi yozuvlar va narx hisobi o'zgarmaydi.
   */
  const boshQiymat = q('offsetQiymat').trim();
  const [yonalish, setYonalish] = useState<'CHEGIRMA' | 'USTAMA'>(
    boshQiymat !== '' && !boshQiymat.startsWith('-') && Number(boshQiymat) !== 0
      ? 'USTAMA'
      : 'CHEGIRMA',
  );
  const [miqdor, setMiqdor] = useState(boshQiymat.replace(/^-/, ''));
  const ishorali =
    miqdor.trim() === '' ? '' : `${yonalish === 'CHEGIRMA' ? '-' : ''}${miqdor.trim()}`;

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const ch = (nom: string): string => kirishUslubi(x(nom) !== undefined);

  return (
    /**
     * ⚠️ `key` — urinish raqami. React tozalagan maydonni QAYTA
     *    yaratish uchun kerak: `defaultValue` faqat element
     *    yangidan yaratilganda qo'llanadi.
     */
    <form key={holat.urinish ?? 0} action={yubor} className="flex flex-col gap-6">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      {/* TZ 6.5 — dublikat topilsa mavjud mijoz ko'rsatiladi va uch yo'l beriladi */}
      {holat.dublikat !== null && (
        <div role="alert" className="rounded-maydon bg-belgi-sariq-fon p-4 text-sm ">
          <p className="font-medium text-belgi-sariq">
            Bunday mijoz allaqachon bor —{' '}
            {holat.dublikat.sabab === 'TELEFON' ? 'telefon raqami' : 'ismi'} bir xil
          </p>
          <p className="mt-1.5 text-belgi-sariq">
            <b>{holat.dublikat.ism}</b> · {holat.dublikat.telefon}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-belgi-sariq">
            {/*
              ⚠️ Modalda HAVOLA BERILMAYDI. Boshqa sahifaga o'tish
                 yarim yozilgan buyurtmani yo'qotardi — modalning
                 butun maqsadi shundan qochish edi. Uning o'rniga
                 mavjud mijoz shu yerda tanlanadi (6.5).
            */}
            {saqlandi === undefined ? (
              <Link
                href={`/mijoz/${String(holat.dublikat.id)}`}
                className="rounded-maydon bg-belgi-sariq px-3 py-1.5 text-xs font-medium text-tugma-matn"
              >
                Mavjud mijozni ochish
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (holat.dublikat === null) return;
                  saqlandi({ id: holat.dublikat.id, ism: holat.dublikat.ism });
                }}
                className="fokus rounded-maydon bg-belgi-sariq px-3 py-1.5 text-xs font-medium text-tugma-matn"
              >
                Shu mijozni tanlash
              </button>
            )}
            <span className="text-xs">yoki ismni o&apos;zgartirib qayta saqlang</span>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Maydon nom="ism" yorliq="Ismi" xato={x('ism')}>
          <input id="ism" name="ism" defaultValue={q('ism')} required className={ch('ism')} />
        </Maydon>

        <Maydon
          nom="telefon"
          yorliq="Telefon"
          izoh="bot mijozni shu raqam bilan taniydi (13.2)"
          xato={x('telefon')}
        >
          <input
            id="telefon"
            name="telefon"
            type="tel"
            defaultValue={q('telefon')}
            placeholder="+998 90 123 45 67"
            className={ch('telefon')}
          />
        </Maydon>

        <div className="sm:col-span-2">
          <Maydon nom="manzil" yorliq="Manzil" xato={x('manzil')}>
            <input
              id="manzil"
              name="manzil"
              defaultValue={q('manzil')}
              className={ch('manzil')}
            />
          </Maydon>
        </div>

        {/*
          ⚠️ 2026-08-30 — tur endi SPRAVOCHNIKDAN (6.2). Ilgari
             ikkita qat'iy qiymat edi: jismoniy / yuridik.

             Soliq maydonlari TURNING XUSUSIYATIGA bog'liq
             («soliq kerak»), nomiga emas — «Optom (yuridik)»
             turi ham bo'lishi mumkin.
        */}
        <TanlovModal
          nom="mijozTuriId"
          yorliq="Mijoz turi"
          izoh="narx darajasi — mahsulot kartochkasida har turga alohida narx"
          bandlar={turlar.map((t) => ({ id: t.id, nom: t.nom }))}
          boshlangich={q('mijozTuriId')}
          boshMatn="— tanlanmagan —"
          yangiYorliq="Yangi tur"
          boshqaruvYoli="/mijoz/turi"
          modalSarlavha="Yangi mijoz turi"
          qoshaOladi={turQoshaOladi}
          tanlandi={(id) => {
            setTurId(id === null ? '' : String(id));
          }}
          forma={(saqla, yop) => <TurFormasi saqlandi={saqla} bekor={yop} />}
        />

        <Maydon
          nom="qarzLimiti"
          yorliq="Qarz limiti (so'm)"
          izoh="6.4 — limit doim so'mda"
          xato={x('qarzLimiti')}
        >
          <input
            id="qarzLimiti"
            name="qarzLimiti"
            inputMode="decimal"
            defaultValue={q('qarzLimiti')}
            className={ch('qarzLimiti')}
          />
        </Maydon>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-matn">Chegirma yoki ustama</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Barcha matoga bir xil qo&apos;llanadi, aksessuarga tegmaydi (6.3). Son doim musbat
          yoziladi — chegirma narxni kamaytiradi, ustama oshiradi.
        </p>

        {/*
          ⚠️ GURUH — umumiy qoida, pastdagi maydonlar — shu mijoz
             uchun ISTISNO. Pastdagisi to'ldirilsa u ustun turadi
             va guruhnikini bosadi (`amaldagiOffset`).
        */}
        <div className="mb-4">
          <TanlovModal
            nom="mijozGuruhId"
            yorliq="Mijoz guruhi"
            izoh="ulgurji, doimiy, VIP — guruh chegirmasi avtomatik qo'llanadi"
            bandlar={guruhlar}
            boshlangich={q('mijozGuruhId')}
            boshMatn="— guruhsiz —"
            yangiYorliq="Yangi guruh"
            boshqaruvYoli="/mijoz/guruh"
            modalSarlavha="Yangi mijoz guruhi"
            qoshaOladi={guruhQoshaOladi}
            forma={(saqla, yop) => <MijozGuruhFormasi saqlandi={saqla} bekor={yop} />}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Maydon nom="offsetYonalish" yorliq="Nima">
            <select
              id="offsetYonalish"
              value={yonalish}
              onChange={(e) => {
                setYonalish(e.target.value === 'USTAMA' ? 'USTAMA' : 'CHEGIRMA');
              }}
              className={ch('offsetQiymat')}
            >
              <option value="CHEGIRMA">Chegirma (arzonroq)</option>
              <option value="USTAMA">Ustama (qimmatroq)</option>
            </select>
          </Maydon>

          <Maydon nom="offsetTuri" yorliq="Turi">
            <select
              id="offsetTuri"
              name="offsetTuri"
              defaultValue={q('offsetTuri')}
              onChange={(e) => {
                setOffsetTuri(e.target.value);
              }}
              className={ch('offsetTuri')}
            >
              <option value="">— yo&apos;q —</option>
              {OFFSET_TURLARI.map((t) => (
                <option key={t} value={t}>
                  {OFFSET_TURI_NOMI[t]}
                </option>
              ))}
            </select>
          </Maydon>

          <Maydon
            nom="offsetMiqdor"
            yorliq="Qiymati"
            izoh={
              offsetTuri === 'FOIZ'
                ? `masalan 3 — ${yonalish === 'CHEGIRMA' ? '3% arzon' : '3% qimmat'}`
                : offsetTuri === ''
                  ? undefined
                  : `masalan 1500 — har kv.m ${yonalish === 'CHEGIRMA' ? 'arzon' : 'qimmat'}`
            }
            xato={x('offsetQiymat')}
          >
            <input
              id="offsetMiqdor"
              inputMode="decimal"
              value={miqdor}
              onChange={(e) => {
                // Minus yozilsa ham olib tashlanadi — yo'nalish yuqorida tanlanadi
                setMiqdor(e.target.value.replace(/^\s*[-−]/, ''));
              }}
              className={ch('offsetQiymat')}
            />
            <input type="hidden" name="offsetQiymat" value={ishorali} />
          </Maydon>
        </div>
        {offsetTuri === 'USD' && (
          <p className="mt-2 rounded-maydon bg-belgi-sariq-fon px-3 py-2 text-xs text-belgi-sariq ">
            Dollarli offsetda <b>sozlamadagi joriy kurs</b> ishlatiladi, buyurtmadagi kurs emas
            (6.3).
          </p>
        )}
      </section>

      {soliqKerak && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-matn">Soliq ma&apos;lumotlari</h2>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Q-23 — hozirdan yig&apos;iladi, elektron faktura keyin ulanadi.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Maydon nom="tashkilotNomi" yorliq="Tashkilot nomi *" xato={x('tashkilotNomi')}>
              <input
                id="tashkilotNomi"
                name="tashkilotNomi"
                defaultValue={q('tashkilotNomi')}
                className={ch('tashkilotNomi')}
              />
            </Maydon>
            <Maydon nom="inn" yorliq="INN *" izoh="9 raqam (yuridik) yoki 14 raqam (JShShIR)" xato={x('inn')}>
              <input id="inn" name="inn" defaultValue={q('inn')} className={ch('inn')} />
            </Maydon>
            <div className="sm:col-span-2">
              <Maydon nom="yuridikManzil" yorliq="Yuridik manzil *" xato={x('yuridikManzil')}>
                <input
                  id="yuridikManzil"
                  name="yuridikManzil"
                  defaultValue={q('yuridikManzil')}
                  className={ch('yuridikManzil')}
                />
              </Maydon>
            </div>
            <Maydon nom="bankNomi" yorliq="Bank">
              <input
                id="bankNomi"
                name="bankNomi"
                defaultValue={q('bankNomi')}
                className={ch('bankNomi')}
              />
            </Maydon>
            <Maydon nom="hisobRaqam" yorliq="Hisob raqami" izoh="20 raqam" xato={x('hisobRaqam')}>
              <input
                id="hisobRaqam"
                name="hisobRaqam"
                defaultValue={q('hisobRaqam')}
                className={ch('hisobRaqam')}
              />
            </Maydon>
            <Maydon nom="mfo" yorliq="MFO" izoh="5 raqam" xato={x('mfo')}>
              <input id="mfo" name="mfo" defaultValue={q('mfo')} className={ch('mfo')} />
            </Maydon>
            <Maydon nom="shartnomaRaqam" yorliq="Shartnoma raqami">
              <input
                id="shartnomaRaqam"
                name="shartnomaRaqam"
                defaultValue={q('shartnomaRaqam')}
                className={ch('shartnomaRaqam')}
              />
            </Maydon>
            {/* Egasi auditi 2026-10-06 — ustun bazada bor edi, formada yo'q edi */}
            <Maydon nom="shartnomaSana" yorliq="Shartnoma sanasi" xato={x('shartnomaSana')}>
              <input
                id="shartnomaSana"
                name="shartnomaSana"
                type="date"
                defaultValue={q('shartnomaSana')}
                className={ch('shartnomaSana')}
              />
            </Maydon>
            <Maydon
              nom="ndsStavka"
              yorliq="NDS stavkasi (%)"
              izoh="bo'sh → NDS to'lovchi emas"
              xato={x('ndsStavka')}
            >
              <input
                id="ndsStavka"
                name="ndsStavka"
                inputMode="decimal"
                defaultValue={q('ndsStavka')}
                className={ch('ndsStavka')}
              />
            </Maydon>
          </div>
        </section>
      )}

      {/*
        ⚠️ SAVDO — egasi auditi 2026-10-06. Qarzga oladigan qayta
           sotuvchi uchun uchta narsa: qachongacha to'laydi, kim
           bilan ishlaydi, qayerdan kelgan.
      */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-matn">Savdo</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          To&apos;lov muddati bo&apos;sh — muddat nazorati yo&apos;q. To&apos;ldirilsa, muddati
          o&apos;tgan qarz ro&apos;yxatda, kartochkada va sotuvda ko&apos;rinadi.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Maydon
            nom="tolovMuddatiKun"
            yorliq="To'lov muddati (kun)"
            izoh="masalan 15 — sotuvdan 15 kun ichida"
            xato={x('tolovMuddatiKun')}
          >
            <input
              id="tolovMuddatiKun"
              name="tolovMuddatiKun"
              inputMode="numeric"
              defaultValue={q('tolovMuddatiKun')}
              className={ch('tolovMuddatiKun')}
            />
          </Maydon>
          <Maydon nom="masulXodimId" yorliq="Mas'ul sotuvchi" xato={x('masulXodimId')}>
            <select
              id="masulXodimId"
              name="masulXodimId"
              defaultValue={q('masulXodimId')}
              className={ch('masulXodimId')}
            >
              <option value="">— biriktirilmagan —</option>
              {xodimlar.map((xo) => (
                <option key={xo.id} value={xo.id}>
                  {xo.nom}
                </option>
              ))}
            </select>
          </Maydon>
          <Maydon nom="manba" yorliq="Qayerdan keldi" xato={x('manba')}>
            <select id="manba" name="manba" defaultValue={q('manba')} className={ch('manba')}>
              <option value="">— noma&apos;lum —</option>
              {/* Ro'yxatda yo'q eski qiymat ham yo'qolmasin */}
              {q('manba') !== '' && !(MIJOZ_MANBALARI as readonly string[]).includes(q('manba')) && (
                <option value={q('manba')}>{q('manba')}</option>
              )}
              {MIJOZ_MANBALARI.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Maydon>
        </div>
      </section>

      <section>
        <Maydon nom="eslatma" yorliq="Eslatma">
          <textarea
            id="eslatma"
            name="eslatma"
            rows={2}
            defaultValue={q('eslatma')}
            className={ch('eslatma')}
          />
        </Maydon>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : tugmaMatni}
        </button>
        {bekor === undefined ? (
          <Link href="/mijoz" className="text-sm text-matn-ikki hover:text-matn">
            Bekor qilish
          </Link>
        ) : (
          <button
            type="button"
            onClick={bekor}
            className="fokus rounded-maydon px-2 py-1 text-sm text-matn-ikki transition-colors hover:text-matn"
          >
            Bekor qilish
          </button>
        )}
      </div>
    </form>
  );
}
