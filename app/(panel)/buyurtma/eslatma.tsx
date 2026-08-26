'use client';

/**
 * TZ 13.11 · 6.7 — yetib bormagan xabarlar.
 *
 * «Yuborilmagan xabarlar buyurtma kartochkasining "Eslatmalar"
 *  tabida QIZIL holatda ko'rinadi va qayta yuborish tugmasi
 *  bo'ladi.»
 *
 * ⚠️ Sotuvchi buni ko'rib mijozga QO'NG'IROQ qiladi. Xabar
 *    yetmagani jimgina yo'qolib ketmasin — mijoz buyurtmasi tayyor
 *    ekanini bilmay yuraveradi.
 */

import { useActionState } from 'react';
import { xabarniQaytaYuborAmali } from './amal';
import { BOSH_AMAL } from './holat';

export interface YetmaganXabar {
  readonly id: number;
  readonly matn: string;
  readonly sabab: string | null;
  readonly urinishlar: number;
}

export function Eslatmalar({ xabarlar }: { xabarlar: readonly YetmaganXabar[] }) {
  if (xabarlar.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-red-800">
        Yetib bormagan xabarlar
      </h2>
      <p className="text-xs text-slate-500">
        Mijoz bu xabarni <b>olmagan</b> — botni bloklagan yoki
        o&apos;chirgan bo&apos;lishi mumkin. Qo&apos;ng&apos;iroq qiling
        yoki qayta yuboring (13.11).
      </p>

      <div className="flex flex-col gap-2">
        {xabarlar.map((x) => (
          <XabarQatori key={x.id} xabar={x} />
        ))}
      </div>
    </section>
  );
}

function XabarQatori({ xabar }: { xabar: YetmaganXabar }) {
  const [holat, yubor, kutilmoqda] = useActionState(
    xabarniQaytaYuborAmali,
    BOSH_AMAL,
  );

  return (
    <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm ring-1 ring-red-200">
      <p className="whitespace-pre-wrap text-red-900">{xabar.matn}</p>

      <p className="mt-1.5 text-xs text-red-700">
        {xabar.sabab ?? 'Sabab nomaʼlum'}
        {xabar.urinishlar > 1 && ` · ${String(xabar.urinishlar)} marta urinildi`}
      </p>

      {holat.xato !== null && (
        <p role="alert" className="mt-1 text-xs text-red-800">
          {holat.xato}
        </p>
      )}

      {holat.bajarildi ? (
        <p className="mt-1.5 text-xs text-emerald-800">
          Navbatga qo&apos;yildi — bot yaqin daqiqalarda yuboradi.
        </p>
      ) : (
        <form action={yubor} className="mt-1.5">
          <input type="hidden" name="xabarId" value={xabar.id} />
          <button
            type="submit"
            disabled={kutilmoqda}
            className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-800 transition hover:bg-red-100 disabled:opacity-60"
          >
            {kutilmoqda ? 'Yuborilmoqda…' : 'Qayta yuborish'}
          </button>
        </form>
      )}
    </div>
  );
}
