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

  /**
   * ⚠️ CHEGIRMA / USTAMA — mijoz formasi bilan BIR XIL (egasi auditi
   *    2026-10-06). Ilgari bu yerda «chegirma manfiy yoziladi» qoidasi
   *    turardi, mijoz formasida esa bo'lim «Chegirma» deb atalib, musbat
   *    son narxni oshirardi. Endi ikkalasida ham yo'nalish tanlanadi,
   *    son musbat yoziladi, ishorani forma qo'yadi.
   */
  const boshQiymat = q('offsetQiymat').trim();
  const [yonalish, setYonalish] = useState<'CHEGIRMA' | 'USTAMA'>(
    boshQiymat !== '' && !boshQiymat.startsWith('-') && Number(boshQiymat) !== 0
      ? 'USTAMA'
      : 'CHEGIRMA',
  );
  const [miqdor, setMiqdor] = useState(boshQiymat.replace(/^-/, ''));
  const ishorali =
    miqdor.trim() === '' ? '' : `${yonalish === 'CHEGIRMA' ? '-' : ''}${miqdor.trim()}`;

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Maydon nom="offsetYonalish" yorliq="Nima">
          <select
            id="offsetYonalish"
            value={yonalish}
            onChange={(e) => {
              setYonalish(e.target.value === 'USTAMA' ? 'USTAMA' : 'CHEGIRMA');
            }}
            disabled={turi === ''}
            className={`${ch('offsetQiymat')} disabled:bg-fon disabled:text-matn-kuchsiz`}
          >
            <option value="CHEGIRMA">Chegirma (arzonroq)</option>
            <option value="USTAMA">Ustama (qimmatroq)</option>
          </select>
        </Maydon>

        <Maydon nom="offsetTuri" yorliq="Turi" xato={x('offsetTuri')}>
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

        <Maydon
          nom="offsetMiqdor"
          yorliq="Qiymati"
          izoh={
            turi === 'FOIZ'
              ? `10 → narx 10% ${yonalish === 'CHEGIRMA' ? 'arzon' : 'qimmat'}`
              : turi === 'SOM'
                ? `5000 → narx 5000 so'm ${yonalish === 'CHEGIRMA' ? 'arzon' : 'qimmat'}`
                : 'avval turini tanlang'
          }
          xato={x('offsetQiymat')}
        >
          <input
            id="offsetMiqdor"
            value={miqdor}
            onChange={(e) => {
              // Minus yozilsa ham olib tashlanadi — yo'nalish chapda tanlanadi
              setMiqdor(e.target.value.replace(/^\s*[-−]/, ''));
            }}
            inputMode="decimal"
            disabled={turi === ''}
            className={`${ch('offsetQiymat')} disabled:bg-fon disabled:text-matn-kuchsiz`}
          />
          <input type="hidden" name="offsetQiymat" value={turi === '' ? '' : ishorali} />
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
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        <BekorQilish yol="/guruh?tur=mijoz" bekor={bekor} />
      </div>
    </form>
  );
}
