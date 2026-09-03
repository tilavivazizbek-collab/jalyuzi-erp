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
  readonly ndsStavka: string;
}

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
  ndsStavka: '',
};

export function MijozFormasi({
  amal,
  qiymatlar,
  tugmaMatni,
  guruhlar = [],
  guruhQoshaOladi = false,
  turlar = [],
  turQoshaOladi = false,
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
                className="rounded-maydon bg-belgi-sariq px-3 py-1.5 text-xs font-medium text-white"
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
                className="fokus rounded-maydon bg-belgi-sariq px-3 py-1.5 text-xs font-medium text-white"
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
        <h2 className="mb-1 text-sm font-semibold text-matn">Chegirma</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Barcha matoga bir xil qo&apos;llanadi, aksessuarga tegmaydi (6.3). Manfiy qiymat —
          chegirma.
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

        <div className="grid gap-4 sm:grid-cols-2">
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
            nom="offsetQiymat"
            yorliq="Qiymati"
            izoh={
              offsetTuri === 'FOIZ' ? 'masalan −3' : offsetTuri === '' ? undefined : 'masalan −1500'
            }
            xato={x('offsetQiymat')}
          >
            <input
              id="offsetQiymat"
              name="offsetQiymat"
              inputMode="decimal"
              defaultValue={q('offsetQiymat')}
              className={ch('offsetQiymat')}
            />
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
            <Maydon nom="inn" yorliq="INN *" xato={x('inn')}>
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
            <Maydon nom="hisobRaqam" yorliq="Hisob raqami">
              <input
                id="hisobRaqam"
                name="hisobRaqam"
                defaultValue={q('hisobRaqam')}
                className={ch('hisobRaqam')}
              />
            </Maydon>
            <Maydon nom="mfo" yorliq="MFO">
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
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
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
