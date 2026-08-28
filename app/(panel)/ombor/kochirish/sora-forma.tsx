'use client';

/**
 * TZ 20.7.1 — 1-qadam: **qabul qiluvchi filial** so'rov ochadi.
 *
 * Bo'laklar bu yerda tanlanmaydi: beruvchi filial omborchisi o'z
 * omborida nima borligini biladi va jo'natishda tanlaydi.
 */

import { useActionState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { kochirishSoraAmali } from './amal';
import { BOSH_KOCHIRISH } from './holat';
import type { FilialTanlovi } from './malumot';

export function SorovFormasi({ filiallar }: { filiallar: readonly FilialTanlovi[] }) {
  const [holat, yubor, kutilmoqda] = useActionState(kochirishSoraAmali, BOSH_KOCHIRISH);

  return (
    <form action={yubor} className="flex max-w-lg flex-col gap-4">
      {holat.xato !== null && (
        <p role="alert" className="text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      <Maydon nom="kimgaFilialId" yorliq="Qaysi filialdan" xato={holat.maydonlar['kimgaFilialId']}>
        <select id="kimgaFilialId" name="kimgaFilialId" className={kirishUslubi(false)}>
          {filiallar.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>

          <a
            href="/filial"
            target="_blank"
            rel="noopener"
            className="fokus mt-1 self-start rounded-maydon px-1 text-[12px] text-matn-kuchsiz transition-colors hover:text-matn hover:underline"
          >
            Filiallar ↗
          </a>
      </Maydon>

      <Maydon nom="izoh" yorliq="Izoh" izoh="Nima kerakligini yozing">
        <input
          id="izoh"
          name="izoh"
          className={kirishUslubi(false)}
          placeholder="Masalan: ko'k mato, 3 m eni, 20 metr"
        />
      </Maydon>

      <p className="rounded-maydon bg-fon px-3 py-2.5 text-xs text-matn-ikki">
        So&apos;rovni <b>beruvchi filial omborchisi</b> hal qiladi — admin tasdig&apos;i kerak emas,
        summa chegarasi yo&apos;q (20.7.1). Har ko&apos;chirish audit jurnaliga tushadi.
      </p>

      <button
        type="submit"
        disabled={kutilmoqda}
        className="self-start rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
      >
        {kutilmoqda ? 'Yaratilmoqda…' : "So'rov yaratish"}
      </button>
    </form>
  );
}
