'use client';

/**
 * TZ 7.10 · QISM 1 §1 — boshlang'ich qoldiq.
 *
 * ⚠️ Bu XARID EMAS. Mol allaqachon kelgan va to'langan, shuning uchun
 *    formada yetkazib beruvchi ham, to'lov muddati ham yo'q va
 *    yetkazib beruvchi qarziga tegilmaydi (QABUL S2.6).
 *
 * ⚠️ Q-05 — kv.m KIRITILMAYDI: rulon uchun eni va bo'yi alohida.
 */

import { enterYuborilmasin } from '../../forma-yordamchi';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Maydon, kirishUslubi } from '../../maydon';
import { boshlangichAmali } from '../inventarizatsiya/amal';
import { BOSH_HOLAT } from '../inventarizatsiya/holat';

interface Olcham {
  /** Ro'yxat o'zgarganda React qatorni adashtirmasligi uchun barqaror kalit */
  readonly kalit: number;
  eniM: string;
  boyiM: string;
}

let keyingiKalit = 0;
const yangiOlcham = (): Olcham => {
  keyingiKalit += 1;
  return { kalit: keyingiKalit, eniM: '', boyiM: '' };
};

export function BoshlangichFormasi({
  materialId,
  materialNomi,
  rulon,
  birlikNomi,
  yangiMahsulot = false,
}: {
  materialId: number;
  materialNomi: string;
  rulon: boolean;
  birlikNomi: string;
  /** Mahsulot endi qo'shildi — «bekor» ro'yxatga qaytaradi */
  yangiMahsulot?: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(boshlangichAmali, BOSH_HOLAT);
  const [olchamlar, olchamlarniOzgartir] = useState<Olcham[]>(() => [yangiOlcham()]);

  const yoz = (i: number, maydon: keyof Olcham, qiymat: string): void => {
    olchamlarniOzgartir((o) => o.map((x, j) => (i === j ? { ...x, [maydon]: qiymat } : x)));
  };

  const tayyor = olchamlar
    .map((o) => ({ eniM: Number(o.eniM), boyiM: Number(o.boyiM) }))
    .filter(
      (o) => Number.isFinite(o.eniM) && Number.isFinite(o.boyiM) && o.eniM > 0 && o.boyiM > 0,
    );

  return (
    <form action={yubor} onKeyDown={enterYuborilmasin} className="flex max-w-xl flex-col gap-6">
      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="bolaklar" value={JSON.stringify(rulon ? tayyor : [])} />

      {holat.xato !== null && (
        <p
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
        >
          {holat.xato}
        </p>
      )}

      <p className="rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <b>{materialNomi}</b>
        <span className="mt-1 block text-xs text-matn-kuchsiz">
          Tizimga o&apos;tish qoldig&apos;i. Yetkazib beruvchi qarziga tegilmaydi — bu xarid emas.
        </span>
      </p>

      {rulon ? (
        <div>
          <p className="mb-1 text-sm font-medium text-matn-ikki">Rulonlar</p>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Har rulon alohida qator: eni × bo&apos;yi, metrda. Kv.m tizim hisoblaydi (Q-05).
          </p>

          <div className="flex flex-col gap-2">
            {olchamlar.map((o, i) => (
              <div key={o.kalit} className="flex items-center gap-2">
                <input
                  value={o.eniM}
                  onChange={(e) => {
                    yoz(i, 'eniM', e.target.value);
                  }}
                  inputMode="decimal"
                  className={`${kirishUslubi(false)} w-24`}
                  placeholder="eni"
                />
                <span className="text-matn-kuchsiz">×</span>
                <input
                  value={o.boyiM}
                  onChange={(e) => {
                    yoz(i, 'boyiM', e.target.value);
                  }}
                  inputMode="decimal"
                  className={`${kirishUslubi(false)} w-24`}
                  placeholder="bo'yi"
                />
                <span className="text-xs text-matn-kuchsiz">m</span>
                {olchamlar.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      olchamlarniOzgartir((x) => x.filter((_, j) => j !== i));
                    }}
                    className="text-xs text-matn-kuchsiz hover:text-belgi-qizil"
                  >
                    olib tashlash
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              olchamlarniOzgartir((x) => [...x, yangiOlcham()]);
            }}
            className="mt-2 text-sm text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
          >
            + Rulon qo&apos;shish
          </button>
        </div>
      ) : (
        <Maydon
          nom="miqdor"
          yorliq={`Miqdor (${birlikNomi})`}
          izoh="Omborda hozir turgan miqdor"
          xato={holat.maydonlar.miqdor}
        >
          <input
            id="miqdor"
            name="miqdor"
            inputMode="decimal"
            className={kirishUslubi(holat.maydonlar.miqdor !== undefined)}
          />
        </Maydon>
      )}

      <Maydon
        nom="tannarxBirlik"
        yorliq={`Tannarx — 1 ${rulon ? 'kv.m' : birlikNomi} uchun`}
        izoh="Sarflash birligi uchun tannarx (P-20)"
        xato={holat.maydonlar.tannarxBirlik}
      >
        <input
          id="tannarxBirlik"
          name="tannarxBirlik"
          inputMode="decimal"
          className={kirishUslubi(holat.maydonlar.tannarxBirlik !== undefined)}
          placeholder="masalan 78000"
        />
      </Maydon>

      <Maydon nom="izoh" yorliq="Izoh" izoh="Ixtiyoriy" xato={holat.maydonlar.izoh}>
        <input
          id="izoh"
          name="izoh"
          className={kirishUslubi(holat.maydonlar.izoh !== undefined)}
          placeholder="Tizimga o'tish qoldig'i"
        />
      </Maydon>

      <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-xs text-belgi-sariq ">
        Bir material uchun <b>bir marta</b> kiritiladi. Ikkinchi urinish rad etiladi — aks holda
        tizimga o&apos;tish qoldig&apos;i ikki barobar bo&apos;lib ketardi.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={kutilmoqda}
          className="rounded-maydon bg-brend px-4 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
        >
          {kutilmoqda ? 'Kiritilmoqda…' : 'Qoldiqni kiritish'}
        </button>
        {/*
          ⚠️ Yangi mahsulot qo'shilganda bu ekran O'ZI ochiladi.
             Zahirasi yo'q mahsulot ham bo'ladi (masalan hali
             kelmagan mato) — shuning uchun chiqish yo'li ochiq
             va u ro'yxatga qaytaradi, orqaga emas.
        */}
        <Link
          href={yangiMahsulot ? '/material' : `/ombor/${String(materialId)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          {yangiMahsulot ? "O'tkazib yuborish" : 'Bekor qilish'}
        </Link>
      </div>
    </form>
  );
}
