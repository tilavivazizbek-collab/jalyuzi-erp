'use client';

/**
 * TZ 22.6.3 · 22.3.3 — filial qarzini to'lash va qo'lda tuzatish.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { filialTolovAmali, qoldaTuzatishAmali } from './amal';
import { BOSH_FILIAL } from './holat';
import type { AdminKassasi, FilialQatori } from './malumot';

export function TolovFormasi({ kassalar }: { kassalar: readonly AdminKassasi[] }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(filialTolovAmali, BOSH_FILIAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="self-start rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
      >
        Qarzni to&apos;lash
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
          To&apos;lov o&apos;tdi — balans yangilandi.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Maydon nom="kimdanKassaId" yorliq="Qaysi kassadan" xato={holat.maydonlar['kimdanKassaId']}>
          <select id="kimdanKassaId" name="kimdanKassaId" className={`${kirishUslubi(false)} w-56`}>
            {kassalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.filialNomi} · {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>

          {/* Kassalarni boshqarish — yangi oynada, ish uzilmasin */}
          <a
            href="/kassa/royxat"
            target="_blank"
            rel="noopener"
            className="fokus mt-1 self-start rounded-maydon px-1 text-[12px] text-matn-kuchsiz transition-colors hover:text-matn hover:underline"
          >
            Kassalar ↗
          </a>
        </Maydon>

        <Maydon nom="kimgaKassaId" yorliq="Qaysi kassaga" xato={holat.maydonlar['kimgaKassaId']}>
          <select id="kimgaKassaId" name="kimgaKassaId" className={`${kirishUslubi(false)} w-56`}>
            {kassalar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.filialNomi} · {k.nom} · {k.valyuta}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="summa" yorliq="Summa" xato={holat.maydonlar['summa']}>
          <input
            id="summa"
            name="summa"
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>
      </div>

      <Maydon nom="izoh" yorliq="Izoh (majburiy)" xato={holat.maydonlar['izoh']}>
        <input
          id="izoh"
          name="izoh"
          className={kirishUslubi(false)}
          placeholder="Masalan: avgust yakuni bo'yicha"
        />
      </Maydon>

      <p className="rounded-maydon bg-fon px-3 py-2.5 text-xs text-matn-ikki">
        To&apos;lov <b>foyda-zararga tegmaydi</b> — bu korxona ichidagi harakat (22.7.3). Ikkala
        kassa ham admin kassasi bo&apos;lishi va valyutasi mos kelishi shart.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? "To'lanmoqda…" : "To'lash"}
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

/** EC-FQ-10 — zararni teng bo'lish uchun qo'lda tuzatish. */
export function TuzatishFormasi({ filiallar }: { filiallar: readonly FilialQatori[] }) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [holat, yubor, kutilmoqda] = useActionState(qoldaTuzatishAmali, BOSH_FILIAL);

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(true);
        }}
        className="self-start text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
      >
        Qo&apos;lda tuzatish
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
          Tuzatish yozildi.
        </p>
      )}

      <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-xs text-belgi-sariq ">
        Zararni teng bo&apos;lish avtomatik qilinmaydi: u sotgan filial kassasidan pul talab qiladi
        va u pul u yerda bo&apos;lmasligi mumkin (22.3.3). Shuning uchun tuzatish <b>qo&apos;lda</b>{' '}
        yoziladi va audit jurnalida qoladi.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <Maydon
          nom="kimdanFilialId"
          yorliq="Kim qarzdor bo'ladi"
          xato={holat.maydonlar['kimdanFilialId']}
        >
          <select
            id="kimdanFilialId"
            name="kimdanFilialId"
            className={`${kirishUslubi(false)} w-48`}
          >
            {filiallar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="kimgaFilialId" yorliq="Kimga" xato={holat.maydonlar['kimgaFilialId']}>
          <select id="kimgaFilialId" name="kimgaFilialId" className={`${kirishUslubi(false)} w-48`}>
            {filiallar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="t-summa" yorliq="Summa" xato={holat.maydonlar['summa']}>
          <input
            id="t-summa"
            name="summa"
            inputMode="decimal"
            className={`${kirishUslubi(false)} w-36`}
          />
        </Maydon>
      </div>

      <Maydon nom="sabab" yorliq="Sabab (majburiy)" xato={holat.maydonlar['sabab']}>
        <input
          id="sabab"
          name="sabab"
          className={kirishUslubi(false)}
          placeholder="Nega tuzatish kerak bo'ldi"
        />
      </Maydon>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-belgi-sariq px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-[0.98] hover:brightness-95 disabled:opacity-60"
        >
          {kutilmoqda ? 'Yozilmoqda…' : 'Tuzatish yozish'}
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
