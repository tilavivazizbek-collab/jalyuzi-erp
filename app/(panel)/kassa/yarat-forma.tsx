'use client';

/**
 * app/(panel)/kassa/yarat-forma.tsx — TZ 12.2
 *
 * ⚠️ Kassa tuzilishi (12.2):
 *
 *      ADMIN KASSASI          SOTUVCHI KASSASI (har sotuvchiga o'ziniki)
 *        ├── naqd so'm          ├── naqd so'm
 *        ├── naqd dollar        └── naqd dollar
 *        └── karta (so'm)
 *
 *    Karta puli sotuvchining qo'lida turmaydi — u to'g'ridan-to'g'ri
 *    admin kassasiga tushadi va bankka boradi.
 */

import { useActionState, useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { BekorQilish, useSaqlanganda } from '../modal-forma';
import { BOSH_KASSA_HOLATI, type KassaYaratHolati } from './yarat-holat';
import {
  KASSA_TURI_NOMI,
  KASSA_TURLARI,
  type KassaTuri,
} from '@/lib/sxema/kassa-yarat';
import type { YaratilganYozuv } from '../modal-holat';

export interface FilialTanlovi {
  readonly id: number;
  readonly nom: string;
}

export interface XodimTanlovi {
  readonly id: number;
  readonly ism: string;
  readonly filialId: number;
}

export function KassaYaratFormasi({
  amal,
  filiallar,
  xodimlar,
  ozFilialId,
  saqlandi,
  bekor,
}: {
  amal: (holat: KassaYaratHolati, forma: FormData) => Promise<KassaYaratHolati>;
  filiallar: readonly FilialTanlovi[];
  xodimlar: readonly XodimTanlovi[];
  ozFilialId: number;
  /** Modalda beriladi — saqlangach oyna yopiladi va kassa tanlanadi */
  saqlandi?: (y: YaratilganYozuv) => void;
  bekor?: () => void;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_KASSA_HOLATI);

  useSaqlanganda(holat.yaratildi, saqlandi);

  const [filialId, filialniOzgartir] = useState(String(ozFilialId));
  const [turi, turniOzgartir] = useState<KassaTuri>('NAQD');

  const x = (nom: string): string | undefined => holat.maydonXatolari[nom];
  const ch = (nom: string): string => kirishUslubi(x(nom) !== undefined);

  /** ⚠️ Xodim o'z filialiga bog'liq — boshqa filial xodimi chiqmaydi */
  const filialXodimlari = xodimlar.filter((xo) => String(xo.filialId) === filialId);

  /**
   * ⚠️ TZ 12.2 — karta kassasi ADMINniki. Xodim tanlash maydoni
   *    umuman ko'rsatilmaydi: taqiqni tushuntirgandan ko'ra,
   *    taqiqlangan tanlovni ko'rsatmagan yaxshi.
   */
  const xodimTanlanadi = turi !== 'KARTA';

  return (
    <form action={yubor} className="flex flex-col gap-4">
      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          {holat.xato}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Maydon
            nom="kassaNom"
            yorliq="Nomi"
            izoh="masalan «Admin naqd so'm» yoki «Aziz — naqd»"
            xato={x('nom')}
          >
            <input id="kassaNom" name="nom" required autoFocus className={ch('nom')} />
          </Maydon>
        </div>

        <Maydon nom="kassaFilial" yorliq="Filial" xato={x('filialId')}>
          <select
            id="kassaFilial"
            name="filialId"
            value={filialId}
            onChange={(e) => {
              filialniOzgartir(e.target.value);
            }}
            className={ch('filialId')}
          >
            {filiallar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="kassaTuri" yorliq="Turi" xato={x('turi')}>
          <select
            id="kassaTuri"
            name="turi"
            value={turi}
            onChange={(e) => {
              turniOzgartir(e.target.value as KassaTuri);
            }}
            className={ch('turi')}
          >
            {KASSA_TURLARI.map((t) => (
              <option key={t} value={t}>
                {KASSA_TURI_NOMI[t]}
              </option>
            ))}
          </select>
        </Maydon>

        <Maydon nom="kassaValyuta" yorliq="Valyuta" xato={x('valyuta')}>
          <select id="kassaValyuta" name="valyuta" className={ch('valyuta')}>
            <option value="SOM">so&apos;m</option>
            <option value="USD">dollar</option>
          </select>
        </Maydon>

        {xodimTanlanadi ? (
          <Maydon
            nom="kassaXodim"
            yorliq="Kimniki"
            izoh="bo'sh qolsa — admin (filial) kassasi"
            xato={x('xodimId')}
          >
            <select id="kassaXodim" name="xodimId" className={ch('xodimId')}>
              <option value="">Admin kassasi</option>
              {filialXodimlari.map((xo) => (
                <option key={xo.id} value={xo.id}>
                  {xo.ism}
                </option>
              ))}
            </select>
          </Maydon>
        ) : (
          <div className="flex items-end">
            {/*
              ⚠️ Karta tanlanganda `xodimId` YUBORILMASLIGI kerak.
                 Yashirin bo'sh maydon qo'yiladi, aks holda oldin
                 tanlangan xodim forma bilan ketib qolardi.
            */}
            <input type="hidden" name="xodimId" value="" />
            <p className="rounded-maydon bg-fon px-3 py-2 text-[12px] text-matn-kuchsiz">
              Karta puli admin kassasiga tushadi — xodimga biriktirilmaydi (12.2)
            </p>
          </div>
        )}

        <div className="sm:col-span-2">
          <Maydon
            nom="kassaQoldiq"
            yorliq="Boshlang'ich qoldiq"
            izoh="hozir kassada turgan pul — bo'sh qolsa noldan boshlanadi"
            xato={x('boshlangichQoldiq')}
          >
            <input
              id="kassaQoldiq"
              name="boshlangichQoldiq"
              inputMode="decimal"
              className={ch('boshlangichQoldiq')}
            />
          </Maydon>
        </div>
      </div>

      {/*
        ⚠️ Qoldiq ustun bo'lib SAQLANMAYDI (2.2-invariant) — u
           birinchi kassa yozuvi bo'lib tushadi va balans doim
           yozuvlar yig'indisidan chiqadi.
      */}
      <p className="rounded-maydon bg-fon px-3 py-2 text-[12px] text-matn-kuchsiz">
        Boshlang&apos;ich qoldiq alohida raqam bo&apos;lib saqlanmaydi — u kassaning{' '}
        <b>birinchi kirimi</b> bo&apos;lib yoziladi va keyin tarixda ko&apos;rinadi (12.2).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Kassa ochish'}
        </button>
        <BekorQilish yol="/kassa" bekor={bekor} />
      </div>
    </form>
  );
}
