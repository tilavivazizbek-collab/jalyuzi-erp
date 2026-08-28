'use client';

/**
 * app/(panel)/xodim/forma.tsx — TZ 10.2 · 10.3 · §8
 *
 * ⚠️ Xodimda BIR NECHTA rol bo'lishi mumkin va ruxsatlar
 *    ularning YIG'INDISI (P-05). Shuning uchun ro'yxat emas,
 *    belgilash katakchalari.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { BekorQilish } from '../modal-forma';
import { BOSH_XODIM_HOLATI, type XodimHolati } from './holat';
import { PAROL_ENG_KAM } from '@/lib/domain/parol-qoida';
import type { FilialTanlovi, RolTanlovi } from './malumot';

export interface XodimQiymatlari {
  readonly ism: string;
  readonly telefon: string;
  readonly filialId: string;
  readonly ishgaKirdi: string;
  readonly rolIdlar: readonly number[];
}

export const BOSH_XODIM: XodimQiymatlari = {
  ism: '',
  telefon: '',
  filialId: '',
  ishgaKirdi: '',
  rolIdlar: [],
};

export function XodimFormasi({
  amal,
  qiymatlar,
  filiallar,
  rollar,
  tugmaMatni,
  /** Tahrirlashda parol bo'sh qolsa eskisi saqlanadi */
  tahrirmi = false,
}: {
  amal: (holat: XodimHolati, forma: FormData) => Promise<XodimHolati>;
  qiymatlar: XodimQiymatlari;
  filiallar: readonly FilialTanlovi[];
  rollar: readonly RolTanlovi[];
  tugmaMatni: string;
  tahrirmi?: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_XODIM_HOLATI);

  /** ⚠️ React 19 formani tozalaydi — qaytarilgan qiymatlar qayta qo'yiladi */
  const q = (nom: keyof XodimQiymatlari, zaxira: string): string =>
    holat.kiritilgan?.[nom] ?? zaxira;

  const [tanlangan, tanlanganniOzgartir] = useState<readonly number[]>(() => {
    const qaytgan = holat.kiritilgan?.['rolIdlar'];
    if (qaytgan === undefined || qaytgan === '') return qiymatlar.rolIdlar;
    return qaytgan
      .split(',')
      .map((n) => Number(n.trim()))
      .filter((n) => Number.isSafeInteger(n) && n > 0);
  });

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const ch = (nom: string): string => kirishUslubi(x(nom) !== undefined);

  const almashtir = (id: number): void => {
    tanlanganniOzgartir((o) => (o.includes(id) ? o.filter((r) => r !== id) : [...o, id]));
  };

  return (
    <form key={holat.urinish ?? 0} action={yubor} className="flex flex-col gap-6">
      {/* Rollar ro'yxat bo'lib yuboriladi */}
      <input type="hidden" name="rolIdlar" value={tanlangan.join(',')} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Maydon nom="ism" yorliq="Ismi" xato={x('ism')}>
          <input
            id="ism"
            name="ism"
            defaultValue={q('ism', qiymatlar.ism)}
            required
            className={ch('ism')}
          />
        </Maydon>

        <Maydon
          nom="telefon"
          yorliq="Telefon"
          izoh="tizimga shu raqam bilan kiradi"
          xato={x('telefon')}
        >
          <input
            id="telefon"
            name="telefon"
            defaultValue={q('telefon', qiymatlar.telefon)}
            required
            inputMode="tel"
            placeholder="90 123 45 67"
            className={ch('telefon')}
          />
        </Maydon>

        <Maydon nom="filialId" yorliq="Filial" xato={x('filialId')}>
          <select
            id="filialId"
            name="filialId"
            defaultValue={q('filialId', qiymatlar.filialId)}
            className={ch('filialId')}
          >
            <option value="">— tanlang —</option>
            {filiallar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="ishgaKirdi" yorliq="Ishga kirdi" xato={x('ishgaKirdi')}>
          <input
            id="ishgaKirdi"
            name="ishgaKirdi"
            type="date"
            defaultValue={q('ishgaKirdi', qiymatlar.ishgaKirdi)}
            className={ch('ishgaKirdi')}
          />
        </Maydon>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-matn">Rollar</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          Bir nechta rol berilsa huquqlar <b>qo&apos;shiladi</b> (10.3)
        </p>

        {x('rolIdlar') !== undefined && (
          <p role="alert" className="mb-2 text-[12px] text-belgi-qizil">
            {x('rolIdlar')}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {rollar.map((r) => {
            const belgilangan = tanlangan.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  almashtir(r.id);
                }}
                aria-pressed={belgilangan}
                className={`fokus rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  belgilangan
                    ? 'bg-brend text-white'
                    : 'border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn'
                }`}
              >
                {r.nom}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-matn">Parol</h2>
        <p className="mb-3 text-xs text-matn-kuchsiz">
          {tahrirmi
            ? "Bo'sh qoldirilsa eski parol saqlanadi"
            : `Saytga kirish uchun. Usta faqat botdan ishlaydi — unga parol shart emas`}
        </p>

        <div className="max-w-sm">
          <Maydon
            nom="parol"
            yorliq={tahrirmi ? 'Yangi parol' : 'Parol'}
            izoh={`kamida ${String(PAROL_ENG_KAM)} belgi`}
            xato={x('parol')}
          >
            {/*
              ⚠️ `defaultValue` YO'Q va `autoComplete="new-password"` —
                 parol hech qachon ekranda qayta ko'rsatilmaydi (§8).
            */}
            <input
              id="parol"
              name="parol"
              type="password"
              autoComplete="new-password"
              className={ch('parol')}
            />
          </Maydon>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : tugmaMatni}
        </button>
        <BekorQilish yol="/xodim" />
      </div>
    </form>
  );
}
