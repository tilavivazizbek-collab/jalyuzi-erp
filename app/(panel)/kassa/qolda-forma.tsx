'use client';

/**
 * TZ 12.9 · 12.10 · 12.11 · 12.5 · 12.6 — qo'lda kiritiladigan kassa
 * hodisalari.
 *
 * ⚠️ Uchtasi uch xil narsa (12.1):
 *
 *    Operatsion xarajat  — kassadan chiqadi VA xarajat
 *    Egasining puli      — kassa qoldig'ini o'zgartiradi, XARAJAT EMAS
 *    Ayirboshlash        — ichki ko'chish, faqat KOMISSIYA xarajat
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { ayirboshlashAmali, qolMaHodisaAmali, xarajatAmali } from './amal';
import { BOSH_AYIRBOSHLASH, BOSH_HOLAT } from './holat';

export interface QoldaKassa {
  readonly id: number;
  readonly nom: string;
  readonly turi: string;
  readonly valyuta: string;
  readonly xodimId: number | null;
}

/** TZ 12.10 — xarajat moddalari (admin boshqaradi). */
const MODDA_NOMI: Record<string, string> = {
  OPERATSION: 'Operatsion (ijara, kommunal, internet…)',
  TRANSPORT_BOJXONA: 'Transport / bojxona',
  BANK_KOMISSIYASI: 'Bank komissiyasi',
  BOSHQA: 'Boshqa',
};

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'SOM' ? pulKorsat(som(summa)) : pulKorsat(dollar(summa));

// ─── TZ 12.10 · Operatsion xarajat ────────────────────────────────────────

export function XarajatFormasi({ kassalar }: { kassalar: readonly QoldaKassa[] }) {
  const [holat, yubor, kutilmoqda] = useActionState(xarajatAmali, BOSH_HOLAT);
  const [kassaId, kassaniOzgartir] = useState(String(kassalar[0]?.id ?? ''));

  const kassa = kassalar.find((k) => k.id === Number(kassaId));

  if (kassalar.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Kassangiz yo&apos;q — xarajat kiritib bo&apos;lmaydi (12.2).
      </p>
    );
  }

  return (
    <form action={yubor} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="valyuta" value={kassa?.valyuta ?? 'SOM'} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Xarajat saqlandi — kassadan chiqdi va foyda-zararga tushdi (12.10).
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Maydon nom="x-kassa" yorliq="Kassa">
          <select
            id="x-kassa"
            name="kassaId"
            value={kassaId}
            onChange={(e) => {
              kassaniOzgartir(e.target.value);
            }}
            className={`${kirishUslubi(false)} w-52`}
          >
            {kassalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="x-modda" yorliq="Modda">
          <select id="x-modda" name="modda" className={`${kirishUslubi(false)} w-64`}>
            {Object.entries(MODDA_NOMI).map(([kod, nom]) => (
              <option key={kod} value={kod}>
                {nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="x-summa" yorliq="Summa">
          <input
            id="x-summa"
            name="summa"
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>
      </div>

      <Maydon nom="x-izoh" yorliq="Izoh (majburiy)">
        <input
          id="x-izoh"
          name="izoh"
          className={kirishUslubi(false)}
          placeholder="Masalan: avgust oyi ijarasi"
        />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {kutilmoqda ? 'Saqlanmoqda…' : 'Xarajatni saqlash'}
      </button>
    </form>
  );
}

// ─── TZ 12.9 · Ayirboshlash ───────────────────────────────────────────────

export function AyirboshlashFormasi({
  kassalar,
}: {
  kassalar: readonly QoldaKassa[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(
    ayirboshlashAmali,
    BOSH_AYIRBOSHLASH,
  );

  // TZ 12.9 — faqat admin (filial) kassalari
  const adminKassalari = kassalar.filter((k) => k.xodimId === null);

  const [kimdan, kimdanOzgartir] = useState(String(adminKassalari[0]?.id ?? ''));
  const [kimga, kimgaOzgartir] = useState(String(adminKassalari[1]?.id ?? ''));
  const [summa, summaniOzgartir] = useState('');
  const [kurs, kursniOzgartir] = useState('13200');
  const [komissiya, komissiyaniOzgartir] = useState('0');

  const dan = adminKassalari.find((k) => k.id === Number(kimdan));
  const ga = adminKassalari.find((k) => k.id === Number(kimga));

  const son = (x: string): number => {
    const n = Number(x.trim());
    return Number.isFinite(n) ? n : 0;
  };

  const kursKerak = dan !== undefined && ga !== undefined && dan.valyuta !== ga.valyuta;
  const ogirilgan = !kursKerak
    ? son(summa)
    : dan?.valyuta === 'USD'
      ? son(summa) * son(kurs)
      : son(kurs) === 0
        ? 0
        : son(summa) / son(kurs);
  const kirgan = ogirilgan - son(komissiya);

  if (adminKassalari.length < 2) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Ayirboshlash uchun kamida ikkita admin kassasi kerak (12.9).
      </p>
    );
  }

  return (
    <form action={yubor} className="flex max-w-2xl flex-col gap-4">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && holat.kirgan !== null && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Ayirboshlandi. Kassaga kirdi:{' '}
          <b className="raqam">{pul(holat.kirgan, ga?.valyuta ?? 'SOM')}</b>
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Maydon nom="a-kimdan" yorliq="Nimadan">
          <select
            id="a-kimdan"
            name="kimdanKassaId"
            value={kimdan}
            onChange={(e) => {
              kimdanOzgartir(e.target.value);
            }}
            className={`${kirishUslubi(false)} w-52`}
          >
            {adminKassalari.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="a-kimga" yorliq="Nimaga">
          <select
            id="a-kimga"
            name="kimgaKassaId"
            value={kimga}
            onChange={(e) => {
              kimgaOzgartir(e.target.value);
            }}
            className={`${kirishUslubi(false)} w-52`}
          >
            {adminKassalari.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>
        </Maydon>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Maydon nom="a-summa" yorliq={`Summa (${dan?.valyuta ?? ''})`}>
          <input
            id="a-summa"
            name="summa"
            value={summa}
            onChange={(e) => {
              summaniOzgartir(e.target.value);
            }}
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>

        <Maydon
          nom="a-kurs"
          yorliq="Kurs"
          izoh={kursKerak ? undefined : "Bir xil valyuta — ishlatilmaydi"}
        >
          <input
            id="a-kurs"
            name="kurs"
            value={kurs}
            onChange={(e) => {
              kursniOzgartir(e.target.value);
            }}
            inputMode="decimal"
            disabled={!kursKerak}
            className={`${kirishUslubi(false)} w-32`}
          />
        </Maydon>

        <Maydon
          nom="a-komissiya"
          yorliq={`Komissiya (${ga?.valyuta ?? ''})`}
          izoh="Yagona real yo'qotish (12.9)"
        >
          <input
            id="a-komissiya"
            name="komissiya"
            value={komissiya}
            onChange={(e) => {
              komissiyaniOzgartir(e.target.value);
            }}
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-32`}
          />
        </Maydon>
      </div>

      {son(summa) > 0 && (
        <dl className="grid max-w-xs grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500">O&apos;girildi</dt>
          <dd className="raqam">{pul(ogirilgan.toFixed(2), ga?.valyuta ?? 'SOM')}</dd>
          <dt className="text-slate-500">Komissiya</dt>
          <dd className="raqam text-red-700">
            −{pul(son(komissiya).toFixed(2), ga?.valyuta ?? 'SOM')}
          </dd>
          <dt className="border-t border-slate-200 pt-1 font-medium">Kassaga kiradi</dt>
          <dd className="raqam border-t border-slate-200 pt-1 font-semibold">
            {pul(kirgan.toFixed(2), ga?.valyuta ?? 'SOM')}
          </dd>
        </dl>
      )}

      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
        Ayirboshlash kirim ham, chiqim ham emas — ichki ko&apos;chish, foydaga
        ta&apos;sir qilmaydi. Faqat <b>komissiya</b> real yo&apos;qotish va u
        «Bank komissiyasi» moddasiga tushadi (12.9).
      </p>

      <Maydon nom="a-izoh" yorliq="Izoh">
        <input id="a-izoh" name="izoh" className={kirishUslubi(false)} />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda || son(summa) <= 0 || kimdan === kimga}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {kutilmoqda ? 'Bajarilmoqda…' : 'Ayirboshlash'}
      </button>
    </form>
  );
}

// ─── TZ 12.11 · 12.5 · 12.6 ───────────────────────────────────────────────

export function QoldaHodisaFormasi({
  kassalar,
  adminmi,
}: {
  kassalar: readonly QoldaKassa[];
  adminmi: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(qolMaHodisaAmali, BOSH_HOLAT);
  const [turi, turiniOzgartir] = useState('BOSHQA_KIRIM');
  const [kassaId, kassaniOzgartir] = useState(String(kassalar[0]?.id ?? ''));

  const kassa = kassalar.find((k) => k.id === Number(kassaId));
  const egasi = turi === 'EGASI_QOSHDI' || turi === 'EGASI_OLDI';

  // TZ 12.11 — egasining puli faqat admin kassasidan
  const mos = egasi ? kassalar.filter((k) => k.xodimId === null) : kassalar;

  if (kassalar.length === 0) return null;

  return (
    <form action={yubor} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="valyuta" value={kassa?.valyuta ?? 'SOM'} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Saqlandi.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Maydon nom="q-turi" yorliq="Hodisa">
          <select
            id="q-turi"
            name="turi"
            value={turi}
            onChange={(e) => {
              turiniOzgartir(e.target.value);
            }}
            className={`${kirishUslubi(false)} w-56`}
          >
            <option value="BOSHQA_KIRIM">Boshqa kirim (K9)</option>
            <option value="BOSHQA_CHIQIM">Boshqa chiqim (C10)</option>
            {adminmi && <option value="EGASI_QOSHDI">Egasi pul qo&apos;shdi (K6)</option>}
            {adminmi && <option value="EGASI_OLDI">Egasi pul oldi (C8)</option>}
          </select>
        </Maydon>

        <Maydon nom="q-kassa" yorliq="Kassa">
          <select
            id="q-kassa"
            name="kassaId"
            value={kassaId}
            onChange={(e) => {
              kassaniOzgartir(e.target.value);
            }}
            className={`${kirishUslubi(false)} w-52`}
          >
            {mos.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="q-summa" yorliq="Summa">
          <input
            id="q-summa"
            name="summa"
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>
      </div>

      {egasi && (
        <p className="text-xs text-slate-500">
          Egasining puli <b>xarajat emas</b> — foydaga ta&apos;sir qilmaydi,
          faqat kassa qoldig&apos;ini o&apos;zgartiradi (12.11).
        </p>
      )}

      <Maydon nom="q-izoh" yorliq={egasi ? 'Izoh' : 'Izoh (majburiy)'}>
        <input id="q-izoh" name="izoh" className={kirishUslubi(false)} />
      </Maydon>

      <button
        type="submit"
        disabled={kutilmoqda}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
      </button>
    </form>
  );
}
