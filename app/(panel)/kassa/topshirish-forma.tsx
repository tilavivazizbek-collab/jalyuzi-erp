'use client';

/**
 * TZ 12.7 — sotuvchi «Topshirdim» belgilaydi.
 *
 * ⚠️ «Pul tasdiqlangunicha SOTUVCHI KASSASIDA turadi.» Bu forma faqat
 *    yozuv yaratadi — pul admin tasdiqlaganda ko'chadi (12.7).
 *
 * ⚠️ Q-29 · 22.5 — sotuvchi pulni **istalgan filial** adminiga
 *    topshirishi mumkin. Boshqa filial tanlansa ogohlantirish chiqadi
 *    (22.5.2): qabul qilgan filial topshirganga qarzdor bo'ladi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { topshiriqYuborAmali } from './amal';
import { BOSH_HOLAT } from './holat';
import type { TopshirishManbasi, TopshirishNishoni } from './malumot';

export function TopshirishFormasi({
  manbalar,
  nishonlar,
  filialNomi,
}: {
  manbalar: readonly TopshirishManbasi[];
  nishonlar: readonly TopshirishNishoni[];
  filialNomi: string;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(topshiriqYuborAmali, BOSH_HOLAT);

  const [manbaId, manbaniOzgartir] = useState(String(manbalar[0]?.id ?? ''));
  const [nishonId, nishonniOzgartir] = useState('');

  const manba = manbalar.find((m) => String(m.id) === manbaId);
  const nishon = nishonlar.find((n) => String(n.id) === nishonId);

  // 1.3-invariant — valyutalar aralashmaydi
  const mosNishonlar =
    manba === undefined ? nishonlar : nishonlar.filter((n) => n.valyuta === manba.valyuta);

  const begonaFilial = nishon !== undefined && !nishon.ozFilialimi;

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="self-start rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
      >
        Pulni topshirish
      </button>
    );
  }

  return (
    <form action={yubor} className="flex max-w-2xl flex-col gap-3">
      {holat.xato !== null && (
        <p role="alert" className="text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      {holat.bajarildi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil ">
          Topshiriq yuborildi. Pul admin tasdiqlagunicha kassangizda turadi (12.7).
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Maydon nom="kimdanKassaId" yorliq="Qaysi kassangizdan">
          <select
            id="kimdanKassaId"
            name="kimdanKassaId"
            value={manbaId}
            onChange={(e) => {
              manbaniOzgartir(e.target.value);
              nishonniOzgartir('');
            }}
            className={`${kirishUslubi(false)} w-56`}
          >
            {manbalar.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom} · {pulKorsat(som(m.qoldiq))}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="kimgaKassaId" yorliq="Kimga">
          <select
            id="kimgaKassaId"
            name="kimgaKassaId"
            value={nishonId}
            onChange={(e) => {
              nishonniOzgartir(e.target.value);
            }}
            className={`${kirishUslubi(false)} w-64`}
          >
            <option value="">— tanlang —</option>
            {mosNishonlar.map((n) => (
              <option key={n.id} value={n.id}>
                {n.filialNomi} · {n.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="summa" yorliq="Summa">
          <input
            id="summa"
            name="summa"
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>
      </div>

      {begonaFilial && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq ">
          ⚠️ Siz <b>{filialNomi}</b> sotuvchisisiz, pulni <b>{nishon.filialNomi}</b> ga
          topshiryapsiz. Qabul qilingach {nishon.filialNomi} {filialNomi} ga qarzdor bo&apos;ladi
          (22.5).
        </p>
      )}

      <Maydon nom="izoh" yorliq="Izoh">
        <input id="izoh" name="izoh" className={kirishUslubi(false)} />
      </Maydon>

      <p className="text-xs text-matn-kuchsiz">
        So&apos;m va dollar <b>alohida</b> topshiriladi (12.7). Admin summa mos kelmasa rad eta
        oladi — pul qimirlamaydi.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda || nishonId === ''}
          className="rounded-maydon bg-brend px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? 'Yuborilmoqda…' : 'Topshirdim'}
        </button>
        <button
          type="button"
          onClick={() => {
            ochiqniOzgartir(false);
          }}
          className="text-xs text-matn-kuchsiz hover:text-matn"
        >
          Yopish
        </button>
      </div>
    </form>
  );
}
