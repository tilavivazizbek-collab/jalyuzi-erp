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
      <h2 className="text-sm font-semibold text-belgi-qizil">Yetib bormagan xabarlar</h2>
      <p className="text-xs text-matn-kuchsiz">
        Mijoz bu xabarni <b>olmagan</b> — botni bloklagan yoki o&apos;chirgan bo&apos;lishi mumkin.
        Qo&apos;ng&apos;iroq qiling yoki qayta yuboring (13.11).
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
  const [holat, yubor, kutilmoqda] = useActionState(xabarniQaytaYuborAmali, BOSH_AMAL);

  return (
    <div className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm ">
      <p className="whitespace-pre-wrap text-belgi-qizil">{xabar.matn}</p>

      <p className="mt-1.5 text-xs text-belgi-qizil">
        {xabar.sabab ?? 'Sabab nomaʼlum'}
        {xabar.urinishlar > 1 && ` · ${String(xabar.urinishlar)} marta urinildi`}
      </p>

      {holat.xato !== null && (
        <p role="alert" className="mt-1 text-xs text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      {holat.bajarildi ? (
        <p className="mt-1.5 text-xs text-belgi-yashil">
          Navbatga qo&apos;yildi — bot yaqin daqiqalarda yuboradi.
        </p>
      ) : (
        <form action={yubor} className="mt-1.5">
          <input type="hidden" name="xabarId" value={xabar.id} />
          <button
            type="submit"
            disabled={kutilmoqda}
            className="rounded-maydon border border-belgi-qizil/30 bg-sirt px-2.5 py-1 text-xs font-medium text-belgi-qizil transition-colors hover:bg-belgi-qizil-fon disabled:opacity-60"
          >
            {kutilmoqda ? 'Yuborilmoqda…' : 'Qayta yuborish'}
          </button>
        </form>
      )}
    </div>
  );
}
