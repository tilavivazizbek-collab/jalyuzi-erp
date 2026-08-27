'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../maydon';
import { BOSH_HOLAT, type FormaHolati } from './holat';

export interface YetkazibQiymatlari {
  readonly nom: string;
  readonly nimaYetkazadi: string;
  readonly kontaktShaxs: string;
  readonly telefon: string;
  readonly qoshimchaTelefon: string;
  readonly manzil: string;
  readonly bankNomi: string;
  readonly hisobRaqam: string;
  readonly inn: string;
  readonly mfo: string;
  readonly tolovMuddatiKun: string;
  readonly valyuta: string;
  readonly eslatma: string;
}

export const BOSH_QIYMATLAR: YetkazibQiymatlari = {
  nom: '',
  nimaYetkazadi: '',
  kontaktShaxs: '',
  telefon: '',
  qoshimchaTelefon: '',
  manzil: '',
  bankNomi: '',
  hisobRaqam: '',
  inn: '',
  mfo: '',
  tolovMuddatiKun: '',
  valyuta: 'SOM',
  eslatma: '',
};

export function YetkazibFormasi({
  amal,
  qiymatlar,
  tugmaMatni,
}: {
  amal: (holat: FormaHolati, forma: FormData) => Promise<FormaHolati>;
  qiymatlar: YetkazibQiymatlari;
  tugmaMatni: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const ch = (nom: string): string => kirishUslubi(x(nom) !== undefined);

  return (
    <form action={yubor} className="flex flex-col gap-6">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Maydon nom="nom" yorliq="Nomi" xato={x('nom')}>
          <input id="nom" name="nom" defaultValue={qiymatlar.nom} required className={ch('nom')} />
        </Maydon>
        <Maydon nom="nimaYetkazadi" yorliq="Nima yetkazadi" izoh="mato, mexanizm, karniz…">
          <input
            id="nimaYetkazadi"
            name="nimaYetkazadi"
            defaultValue={qiymatlar.nimaYetkazadi}
            className={ch('nimaYetkazadi')}
          />
        </Maydon>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-matn">Aloqa</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Maydon nom="kontaktShaxs" yorliq="Kontakt shaxs">
            <input
              id="kontaktShaxs"
              name="kontaktShaxs"
              defaultValue={qiymatlar.kontaktShaxs}
              className={ch('kontaktShaxs')}
            />
          </Maydon>
          <Maydon nom="manzil" yorliq="Manzil">
            <input
              id="manzil"
              name="manzil"
              defaultValue={qiymatlar.manzil}
              className={ch('manzil')}
            />
          </Maydon>
          <Maydon nom="telefon" yorliq="Telefon" xato={x('telefon')}>
            <input
              id="telefon"
              name="telefon"
              type="tel"
              defaultValue={qiymatlar.telefon}
              placeholder="+998 90 123 45 67"
              className={ch('telefon')}
            />
          </Maydon>
          <Maydon nom="qoshimchaTelefon" yorliq="Qo'shimcha telefon" xato={x('qoshimchaTelefon')}>
            <input
              id="qoshimchaTelefon"
              name="qoshimchaTelefon"
              type="tel"
              defaultValue={qiymatlar.qoshimchaTelefon}
              className={ch('qoshimchaTelefon')}
            />
          </Maydon>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-matn">To&apos;lov rekvizitlari</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          To&apos;lov oynasida avtomatik chiqadi (9.3).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Maydon nom="bankNomi" yorliq="Bank">
            <input
              id="bankNomi"
              name="bankNomi"
              defaultValue={qiymatlar.bankNomi}
              className={ch('bankNomi')}
            />
          </Maydon>
          <Maydon nom="hisobRaqam" yorliq="Hisob raqami">
            <input
              id="hisobRaqam"
              name="hisobRaqam"
              defaultValue={qiymatlar.hisobRaqam}
              className={ch('hisobRaqam')}
            />
          </Maydon>
          <Maydon nom="inn" yorliq="INN / STIR">
            <input id="inn" name="inn" defaultValue={qiymatlar.inn} className={ch('inn')} />
          </Maydon>
          <Maydon nom="mfo" yorliq="MFO">
            <input id="mfo" name="mfo" defaultValue={qiymatlar.mfo} className={ch('mfo')} />
          </Maydon>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-matn">To&apos;lov shartlari</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Maydon
            nom="tolovMuddatiKun"
            yorliq="To'lov muddati (kun)"
            izoh="kirim hujjatiga avtomatik qo'yiladi · bo'sh → standart"
            xato={x('tolovMuddatiKun')}
          >
            <input
              id="tolovMuddatiKun"
              name="tolovMuddatiKun"
              inputMode="numeric"
              defaultValue={qiymatlar.tolovMuddatiKun}
              className={ch('tolovMuddatiKun')}
            />
          </Maydon>
          <Maydon nom="valyuta" yorliq="Standart valyuta" izoh="yangi kirim hujjati uchun">
            <select
              id="valyuta"
              name="valyuta"
              defaultValue={qiymatlar.valyuta}
              className={ch('valyuta')}
            >
              <option value="SOM">so&apos;m</option>
              <option value="USD">dollar</option>
            </select>
          </Maydon>
        </div>
        <p className="mt-2 rounded-maydon bg-fon px-3 py-2 text-xs text-matn-ikki ">
          Qarz <b>valyuta bo&apos;yicha alohida</b> yuritiladi — bitta yetkazib beruvchida so&apos;m
          ham, dollar ham qarz bo&apos;lishi mumkin (9.2). Bu maydon faqat yangi hujjatga
          qo&apos;yiladigan standart.
        </p>
      </section>

      <section>
        <Maydon nom="eslatma" yorliq="Izoh">
          <textarea
            id="eslatma"
            name="eslatma"
            rows={2}
            defaultValue={qiymatlar.eslatma}
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
        <Link href="/yetkazib" className="text-sm text-matn-ikki hover:text-matn">
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
