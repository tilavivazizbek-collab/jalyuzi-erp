'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { BOSH_HOLAT, type MijozHolati } from './holat';
import {
  OFFSET_TURI_NOMI,
  OFFSET_TURLARI,
  SHAXS_TURI_NOMI,
  SHAXS_TURLARI,
  type ShaxsTuri,
} from '@/lib/sxema/mijoz';

export interface MijozQiymatlari {
  readonly ism: string;
  readonly telefon: string;
  readonly manzil: string;
  readonly eslatma: string;
  readonly offsetTuri: string;
  readonly offsetQiymat: string;
  readonly qarzLimiti: string;
  readonly shaxsTuri: string;
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
  offsetTuri: '',
  offsetQiymat: '',
  qarzLimiti: '',
  shaxsTuri: 'JISMONIY',
  tashkilotNomi: '',
  inn: '',
  yuridikManzil: '',
  bankNomi: '',
  hisobRaqam: '',
  mfo: '',
  shartnomaRaqam: '',
  ndsStavka: '',
};

const kirish =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10';

function Maydon({
  nom,
  yorliq,
  izoh,
  xato,
  children,
}: {
  nom: string;
  yorliq: string;
  izoh?: string;
  xato?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={nom}>
      <span className="text-sm font-medium text-slate-700">{yorliq}</span>
      {children}
      {xato !== undefined ? (
        <span className="text-xs text-red-700">{xato}</span>
      ) : izoh !== undefined ? (
        <span className="text-xs text-slate-500">{izoh}</span>
      ) : null}
    </label>
  );
}

export function MijozFormasi({
  amal,
  qiymatlar,
  tugmaMatni,
}: {
  amal: (holat: MijozHolati, forma: FormData) => Promise<MijozHolati>;
  qiymatlar: MijozQiymatlari;
  tugmaMatni: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);
  const [shaxsTuri, setShaxsTuri] = useState<ShaxsTuri>(qiymatlar.shaxsTuri as ShaxsTuri);
  const [offsetTuri, setOffsetTuri] = useState(qiymatlar.offsetTuri);

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const ch = (nom: string): string =>
    `${kirish} ${x(nom) !== undefined ? 'border-red-400' : 'border-slate-300'}`;

  return (
    <form action={yubor} className="flex flex-col gap-6">
      {holat.xato !== null && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200">
          {holat.xato}
        </p>
      )}

      {/* TZ 6.5 — dublikat topilsa mavjud mijoz ko'rsatiladi va uch yo'l beriladi */}
      {holat.dublikat !== null && (
        <div role="alert" className="rounded-lg bg-amber-50 p-4 text-sm ring-1 ring-amber-300">
          <p className="font-medium text-amber-900">
            Bunday mijoz allaqachon bor —{' '}
            {holat.dublikat.sabab === 'TELEFON' ? 'telefon raqami' : 'ismi'} bir xil
          </p>
          <p className="mt-1.5 text-amber-900">
            <b>{holat.dublikat.ism}</b> · {holat.dublikat.telefon}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-amber-900">
            <Link
              href={`/mijoz/${String(holat.dublikat.id)}`}
              className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Mavjud mijozni ochish
            </Link>
            <span className="text-xs">
              yoki ismni o&apos;zgartirib qayta saqlang
            </span>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Maydon nom="ism" yorliq="Ismi" xato={x('ism')}>
          <input id="ism" name="ism" defaultValue={qiymatlar.ism} required className={ch('ism')} />
        </Maydon>

        <Maydon nom="telefon" yorliq="Telefon" izoh="bot mijozni shu raqam bilan taniydi (13.2)" xato={x('telefon')}>
          <input id="telefon" name="telefon" type="tel" defaultValue={qiymatlar.telefon} placeholder="+998 90 123 45 67" className={ch('telefon')} />
        </Maydon>

        <div className="sm:col-span-2">
          <Maydon nom="manzil" yorliq="Manzil" xato={x('manzil')}>
            <input id="manzil" name="manzil" defaultValue={qiymatlar.manzil} className={ch('manzil')} />
          </Maydon>
        </div>

        <Maydon nom="shaxsTuri" yorliq="Turi">
          <select
            id="shaxsTuri"
            name="shaxsTuri"
            defaultValue={qiymatlar.shaxsTuri}
            onChange={(e) => { setShaxsTuri(e.target.value as ShaxsTuri); }}
            className={ch('shaxsTuri')}
          >
            {SHAXS_TURLARI.map((t) => (
              <option key={t} value={t}>
                {SHAXS_TURI_NOMI[t]}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="qarzLimiti" yorliq="Qarz limiti (so'm)" izoh="6.4 — limit doim so'mda" xato={x('qarzLimiti')}>
          <input id="qarzLimiti" name="qarzLimiti" inputMode="decimal" defaultValue={qiymatlar.qarzLimiti} className={ch('qarzLimiti')} />
        </Maydon>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Narx offseti</h2>
        <p className="mb-3 text-xs text-slate-500">
          Barcha matoga bir xil qo&apos;llanadi, aksessuarga tegmaydi (6.3).
          Manfiy qiymat — chegirma.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Maydon nom="offsetTuri" yorliq="Turi">
            <select
              id="offsetTuri"
              name="offsetTuri"
              defaultValue={qiymatlar.offsetTuri}
              onChange={(e) => { setOffsetTuri(e.target.value); }}
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
            izoh={offsetTuri === 'FOIZ' ? "masalan −3" : offsetTuri === '' ? undefined : 'masalan −1500'}
            xato={x('offsetQiymat')}
          >
            <input id="offsetQiymat" name="offsetQiymat" inputMode="decimal" defaultValue={qiymatlar.offsetQiymat} className={ch('offsetQiymat')} />
          </Maydon>
        </div>
        {offsetTuri === 'USD' && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
            Dollarli offsetda <b>sozlamadagi joriy kurs</b> ishlatiladi, buyurtmadagi
            kurs emas (6.3).
          </p>
        )}
      </section>

      {shaxsTuri === 'YURIDIK' && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Soliq ma&apos;lumotlari</h2>
          <p className="mb-3 text-xs text-slate-500">
            Q-23 — hozirdan yig&apos;iladi, elektron faktura keyin ulanadi.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Maydon nom="tashkilotNomi" yorliq="Tashkilot nomi *" xato={x('tashkilotNomi')}>
              <input id="tashkilotNomi" name="tashkilotNomi" defaultValue={qiymatlar.tashkilotNomi} className={ch('tashkilotNomi')} />
            </Maydon>
            <Maydon nom="inn" yorliq="INN *" xato={x('inn')}>
              <input id="inn" name="inn" defaultValue={qiymatlar.inn} className={ch('inn')} />
            </Maydon>
            <div className="sm:col-span-2">
              <Maydon nom="yuridikManzil" yorliq="Yuridik manzil *" xato={x('yuridikManzil')}>
                <input id="yuridikManzil" name="yuridikManzil" defaultValue={qiymatlar.yuridikManzil} className={ch('yuridikManzil')} />
              </Maydon>
            </div>
            <Maydon nom="bankNomi" yorliq="Bank">
              <input id="bankNomi" name="bankNomi" defaultValue={qiymatlar.bankNomi} className={ch('bankNomi')} />
            </Maydon>
            <Maydon nom="hisobRaqam" yorliq="Hisob raqami">
              <input id="hisobRaqam" name="hisobRaqam" defaultValue={qiymatlar.hisobRaqam} className={ch('hisobRaqam')} />
            </Maydon>
            <Maydon nom="mfo" yorliq="MFO">
              <input id="mfo" name="mfo" defaultValue={qiymatlar.mfo} className={ch('mfo')} />
            </Maydon>
            <Maydon nom="shartnomaRaqam" yorliq="Shartnoma raqami">
              <input id="shartnomaRaqam" name="shartnomaRaqam" defaultValue={qiymatlar.shartnomaRaqam} className={ch('shartnomaRaqam')} />
            </Maydon>
            <Maydon nom="ndsStavka" yorliq="NDS stavkasi (%)" izoh="bo'sh → NDS to'lovchi emas" xato={x('ndsStavka')}>
              <input id="ndsStavka" name="ndsStavka" inputMode="decimal" defaultValue={qiymatlar.ndsStavka} className={ch('ndsStavka')} />
            </Maydon>
          </div>
        </section>
      )}

      <section>
        <Maydon nom="eslatma" yorliq="Eslatma">
          <textarea id="eslatma" name="eslatma" rows={2} defaultValue={qiymatlar.eslatma} className={ch('eslatma')} />
        </Maydon>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : tugmaMatni}
        </button>
        <Link href="/mijoz" className="text-sm text-slate-600 hover:text-slate-900">
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
