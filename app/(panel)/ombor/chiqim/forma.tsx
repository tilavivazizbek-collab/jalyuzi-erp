'use client';

/**
 * TZ 7.10 — hisobdan chiqarish formasi.
 *
 * ⚠️ Omborchi O'ZI qiladi, admin tasdig'i kutilmaydi. Shuning uchun
 *    forma zararni AVVALDAN ko'rsatadi: bu qaytmas amal emas (bekor
 *    qilinadi), lekin adminga xabar ketadi va auditda qoladi.
 */

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../../maydon';
import { CHIQARISH_SABABLARI, SABAB_NOMI } from '@/lib/sxema/chiqim';
import { BOSH_HOLAT, type ChiqimHolati } from './holat';

export interface ChiqimBolakKorinishi {
  readonly id: number;
  readonly kod: string;
  readonly materialNomi: string;
  readonly olcham: string;
  readonly holat: string;
  readonly zararMatni: string;
  readonly kirimRaqam: string | null;
}

export function ChiqimFormasi({
  amal,
  bolak,
  qaytish,
}: {
  amal: (holat: ChiqimHolati, forma: FormData) => Promise<ChiqimHolati>;
  bolak: ChiqimBolakKorinishi;
  qaytish: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);
  const [sabab, sababniOzgartir] = useState<string>('SUV_KETDI');

  const defekt = sabab === 'YETKAZIB_BERUVCHI_DEFEKTI';
  const x = (nom: string): string | undefined => holat.maydonlar[nom];

  return (
    <form action={yubor} className="flex max-w-xl flex-col gap-6">
      <input type="hidden" name="bolakId" value={bolak.id} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"
        >
          {holat.xato}
        </p>
      )}

      {/* Nima chiqarilayotgani — omborchi adashmasligi uchun */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <dt className="text-slate-500">Material</dt>
        <dd className="font-medium">{bolak.materialNomi}</dd>
        <dt className="text-slate-500">Bo&apos;lak</dt>
        <dd className="font-mono text-xs">{bolak.kod}</dd>
        <dt className="text-slate-500">O&apos;lcham</dt>
        <dd className="raqam">{bolak.olcham}</dd>
        <dt className="text-slate-500">Kirim</dt>
        <dd>{bolak.kirimRaqam ?? '—'}</dd>
        <dt className="text-slate-500">Zarar</dt>
        <dd className="raqam font-semibold text-red-700">{bolak.zararMatni}</dd>
      </dl>

      <Maydon
        nom="sabab"
        yorliq="Sabab"
        izoh="Hisobotda shu bo'yicha guruhlanadi (14.9)"
        xato={x('sabab')}
      >
        <select
          id="sabab"
          name="sabab"
          value={sabab}
          onChange={(e) => {
            sababniOzgartir(e.target.value);
          }}
          className={kirishUslubi(x('sabab') !== undefined)}
        >
          {CHIQARISH_SABABLARI.map((s) => (
            <option key={s} value={s}>
              {SABAB_NOMI[s]}
            </option>
          ))}
        </select>
      </Maydon>

      <Maydon
        nom="izoh"
        yorliq={sabab === 'BOSHQA' ? 'Izoh (majburiy)' : 'Izoh'}
        izoh="Nima bo'lganini qisqa yozing"
        xato={x('izoh')}
      >
        <textarea
          id="izoh"
          name="izoh"
          rows={3}
          className={kirishUslubi(x('izoh') !== undefined)}
        />
      </Maydon>

      {/* TZ 7.10 — «Rulon ichidagi dog' faqat ochilganda ma'lum bo'ladi» */}
      {defekt && (
        <label className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="davoQilinadimi"
            value="ha"
            defaultChecked
            className="mt-0.5"
          />
          <span>
            <b>Yetkazib beruvchiga da&apos;vo qilinadi</b>
            <span className="mt-0.5 block text-xs text-amber-800">
              Kirim {bolak.kirimRaqam ?? '—'} ga bog&apos;lanadi. Da&apos;vo
              5-bosqichda qarzdan yechiladi — hozircha faqat belgilanadi.
            </span>
          </span>
        </label>
      )}

      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
        Tasdiqlansa bo&apos;lak ombordan chiqadi va adminga xabar ketadi.
        Yozuv o&apos;chirilmaydi — xato bo&apos;lsa material kartochkasidan
        bekor qilinadi (7.10).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {kutilmoqda ? 'Chiqarilmoqda…' : 'Hisobdan chiqarish'}
        </button>
        <Link href={qaytish} className="text-sm text-slate-500 hover:text-slate-900">
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
