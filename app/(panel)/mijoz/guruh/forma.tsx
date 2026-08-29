'use client';

/**
 * app/(panel)/mijoz/guruh/forma.tsx — TZ 6.3
 *
 * Mijoz guruhi: nom + chegirma.
 *
 * ⚠️ Forma UCH joyda ishlaydi: guruh sahifasida qo'shishda,
 *    o'sha yerda tahrirlashda va mijoz kartochkasidagi modalda
 *    («+ Yangi guruh»). Bitta fayl (§2.2).
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../../maydon';
import { BekorQilish, useSaqlanganda } from '../../modal-forma';
import { guruhTahrirlaAmali, guruhYaratAmali } from './amal';
import { BOSH_HOLAT, type GuruhFormaHolati } from './holat';
import type { YaratilganYozuv } from '../../modal-holat';

export interface GuruhQiymatlari {
  readonly nom: string;
  readonly offsetTuri: string;
  readonly offsetQiymat: string;
  readonly izoh: string;
}

export const BOSH_QIYMATLAR: GuruhQiymatlari = {
  nom: '',
  offsetTuri: '',
  offsetQiymat: '',
  izoh: '',
};

export function MijozGuruhFormasi({
  guruhId,
  qiymatlar = BOSH_QIYMATLAR,
  saqlandi,
  bekor,
}: {
  /** Bo'lsa — tahrirlash, bo'lmasa — yangi guruh */
  guruhId?: number;
  qiymatlar?: GuruhQiymatlari;
  saqlandi?: (y: YaratilganYozuv) => void;
  bekor?: () => void;
}) {
  const [holat, yubor, kutilmoqda] = useActionState<GuruhFormaHolati, FormData>(
    guruhId === undefined ? guruhYaratAmali : guruhTahrirlaAmali.bind(null, guruhId),
    BOSH_HOLAT,
  );

  useSaqlanganda(holat.yaratildi, saqlandi);

  /** ⚠️ Xatodan keyin yozilgan qiymat qaytadi (React 19 formani tozalaydi) */
  const q = (nom: keyof GuruhQiymatlari): string =>
    holat.kiritilgan?.[nom] ?? qiymatlar[nom];
  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const ch = (nom: string): string => kirishUslubi(x(nom) !== undefined);

  const [turi, turiniOzgartir] = useState(q('offsetTuri'));

  return (
    <form key={holat.urinish ?? 0} action={yubor} className="flex flex-col gap-4">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      <Maydon
        nom="nom"
        yorliq="Guruh nomi"
        izoh="«Ulgurji», «Doimiy», «VIP» kabi"
        xato={x('nom')}
      >
        <input id="nom" name="nom" defaultValue={q('nom')} required className={ch('nom')} />
      </Maydon>

      <div className="grid gap-4 sm:grid-cols-2">
        <Maydon nom="offsetTuri" yorliq="Chegirma turi" xato={x('offsetTuri')}>
          <select
            id="offsetTuri"
            name="offsetTuri"
            value={turi}
            onChange={(e) => {
              turiniOzgartir(e.target.value);
            }}
            className={ch('offsetTuri')}
          >
            <option value="">— chegirmasiz —</option>
            <option value="FOIZ">Foiz (%)</option>
            <option value="SOM">So&apos;m</option>
          </select>
        </Maydon>

        {/*
          ⚠️ Chegirma MANFIY yoziladi: «−10» narxni 10% kamaytiradi.
             Musbat son ustama bo'ladi — ba'zi mijozga (masalan
             uzoq manzil) narx qimmatroq bo'lishi mumkin.
        */}
        <Maydon
          nom="offsetQiymat"
          yorliq="Qiymati"
          izoh={
            turi === 'FOIZ'
              ? "chegirma manfiy: −10 → narx 10% arzon"
              : turi === 'SOM'
                ? "chegirma manfiy: −5000 → narx 5000 so'm arzon"
                : 'avval turini tanlang'
          }
          xato={x('offsetQiymat')}
        >
          <input
            id="offsetQiymat"
            name="offsetQiymat"
            defaultValue={q('offsetQiymat')}
            inputMode="decimal"
            disabled={turi === ''}
            className={`${ch('offsetQiymat')} disabled:bg-fon disabled:text-matn-kuchsiz`}
          />
        </Maydon>
      </div>

      <Maydon nom="izoh" yorliq="Izoh" izoh="ixtiyoriy" xato={x('izoh')}>
        <input id="izoh" name="izoh" defaultValue={q('izoh')} className={ch('izoh')} />
      </Maydon>

      {/*
        ⚠️ Bu eslatma ATAYLAB formada turadi: guruh chegirmasi
           mijozning shaxsiy chegirmasidan PASTROQ turadi va buni
           bilmagan odam «nega ishlamadi?» deb o'ylardi.
      */}
      <p className="rounded-maydon bg-fon px-3 py-2 text-[12px] text-matn-kuchsiz">
        Mijoz kartochkasida alohida chegirma qo&apos;yilgan bo&apos;lsa —{' '}
        <b>o&apos;sha ustun turadi</b>. Ikkalasi qo&apos;shilmaydi.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        <BekorQilish yol="/mijoz/guruh" bekor={bekor} />
      </div>
    </form>
  );
}
