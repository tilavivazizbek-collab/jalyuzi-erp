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
import { rulonKvMTannarxi } from '@/lib/domain/boshlangich-narx';
import { kopaytir, pulMatn, som } from '@/lib/domain/pul';
import { BOSH_HOLAT } from '../inventarizatsiya/holat';

type BolakTuri = 'RULON' | 'OCHILGAN' | 'KESMA';

/**
 * TZ 7.4 · 7.6 — omborda uch xil bo'lak turadi va ular BIR XIL EMAS.
 *
 * ⚠️ Egasi (2026-09-05): «boshlang'ich zahirani kiritadigan paytim
 *    mendagi kesmani, ochiq rulonni qanday kiritaman?»
 *
 *    Ilgari hech qanday yo'l yo'q edi — nima yozilsa ham «butun
 *    rulon» bo'lib tushardi. Endi tur tanlanadi va tanlov
 *    algoritmi (7.6) uni to'g'ri tartibda ishlatadi.
 */
const TURLAR: readonly { readonly qiymat: BolakTuri; readonly nom: string }[] = [
  { qiymat: 'RULON', nom: 'Butun rulon' },
  { qiymat: 'OCHILGAN', nom: 'Ochilgan rulon' },
  { qiymat: 'KESMA', nom: 'Qoldiq kesma' },
];

interface Olcham {
  /** Ro'yxat o'zgarganda React qatorni adashtirmasligi uchun barqaror kalit */
  readonly kalit: number;
  eniM: string;
  boyiM: string;
  turi: BolakTuri;
}

let keyingiKalit = 0;
const yangiOlcham = (): Olcham => {
  keyingiKalit += 1;
  return { kalit: keyingiKalit, eniM: '', boyiM: '', turi: 'RULON' };
};

export function BoshlangichFormasi({
  materialId,
  materialNomi,
  rulon,
  birlikNomi,
  yangiMahsulot = false,
  boshEni = '',
  boshBoyi = '',
  boshNarxAsosi = 'METR',
  metrda = false,
}: {
  materialId: number;
  materialNomi: string;
  rulon: boolean;
  birlikNomi: string;
  /** Kartochkadagi odatdagi o'lchamlar — rulon qatorlari shu bilan ochiladi */
  boshEni?: string;
  boshBoyi?: string;
  /**
   * Materialning «Kirimda narx qanday hisoblanadi» qiymati — 2026-09-23.
   * Egasi odatda o'shanday oladi, shuning uchun shu bilan ochiladi.
   */
  boshNarxAsosi?: string;
  /**
   * Q-01 — chiziqli mahsulot bazada ham METRDA yuritiladi (2026-09-20).
   *
   * ⚠️ Egasi (2026-08-30): «boshlang'ich qoldiqda metri
   *    kiritilyaptimi yoki rulonimi — bu qayerdan biladi?»
   *    Odam metr bilan ishlaydi, shuning uchun ekranda METR
   *    so'raladi va ×100 tizim o'zi qiladi.
   */
  metrda?: boolean;
  /** Mahsulot endi qo'shildi — «bekor» ro'yxatga qaytaradi */
  yangiMahsulot?: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(boshlangichAmali, BOSH_HOLAT);
  const [olchamlar, olchamlarniOzgartir] = useState<Olcham[]>(() => [
    { ...yangiOlcham(), eniM: boshEni, boyiM: boshBoyi },
  ]);
  /** Ekranda METR, bazaga SM (Q-01) */
  /**
   * Narx qaysi asosda berilgan — 2026-09-23.
   *
   * Materialning kartochkasidagi «Kirimda narx qanday hisoblanadi»
   * qiymati bilan ochiladi: egasi odatda o'shanday oladi.
   */
  const [narxAsosi, narxAsosiniOzgartir] = useState(boshNarxAsosi);
  const [narxMatn, narxMatniniOzgartir] = useState('');

  /**
   * Kiritilgan zahira JAMI QANCHAGA tushayotgani va 1 kv.m tannarxi.
   *
   * Hisob DOMAINDAN — material kartochkasidagi zahira bo'limi bilan
   * BITTA funksiya (CLAUDE.md §3). Ilgari bu sahifada hisob umuman
   * yo'q edi va egasi kv.m tannarxini o'zi chiqarishi kerak edi.
   */
  const hisob = ((): { tannarx: string; jami: string; formula: string } | null => {
    if (!rulon || narxMatn.trim() === '') return null;

    const b = olchamlar
      .map((o) => ({ eniM: Number(o.eniM), boyiM: Number(o.boyiM) }))
      .filter((o) => o.eniM > 0 && o.boyiM > 0);
    if (b.length === 0) return null;

    try {
      const tannarx = rulonKvMTannarxi(
        narxAsosi === 'KV_M' ? 'KV_M' : narxAsosi === 'BIRLIK' ? 'BIRLIK' : 'METR',
        som(narxMatn),
        b,
      );

      const kvM = b.reduce((y, o) => y + o.eniM * o.boyiM, 0);
      const metrJami = b.reduce((y, o) => y + o.boyiM, 0);

      /** Formula OCHIQ yoziladi — qaysi usul ishlayotgani ko'rinsin */
      const formula =
        narxAsosi === 'KV_M'
          ? `${kvM.toFixed(2)} kv.m × ${narxMatn}`
          : narxAsosi === 'BIRLIK'
            ? `${String(b.length)} rulon × ${narxMatn}`
            : `${metrJami.toFixed(2)} m × ${narxMatn}`;

      return { tannarx, jami: pulMatn(kopaytir(som(tannarx), kvM)), formula };
    } catch {
      return null;
    }
  })();

  const [metr, metrniOzgartir] = useState('');

  const yoz = (i: number, maydon: keyof Olcham, qiymat: string): void => {
    olchamlarniOzgartir((o) => o.map((x, j) => (i === j ? { ...x, [maydon]: qiymat } : x)));
  };

  const tayyor = olchamlar
    .map((o) => ({ eniM: Number(o.eniM), boyiM: Number(o.boyiM), turi: o.turi }))
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
            Har bo&apos;lak alohida qator: eni × bo&apos;yi, metrda. Kv.m tizim hisoblaydi (Q-05).
          </p>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            <b>Ochilgan rulon</b> — ishlatila boshlangan, enisi o&apos;sha, bo&apos;yi kamaygan.
            Buyurtma tushganda tizim <b>avval shuni</b> tugatadi, yangi rulonni ochmaydi (7.6).
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
                <select
                  value={o.turi}
                  onChange={(e) => {
                    yoz(i, 'turi', e.target.value);
                  }}
                  aria-label="Bo'lak turi"
                  className={`${kirishUslubi(false)} w-40`}
                >
                  {TURLAR.map((t) => (
                    <option key={t.qiymat} value={t.qiymat}>
                      {t.nom}
                    </option>
                  ))}
                </select>
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
              /** ⚠️ Yangi rulon ham kartochkadagi o'lcham bilan ochiladi */
              olchamlarniOzgartir((x) => [
                ...x,
                { ...yangiOlcham(), eniM: boshEni, boyiM: boshBoyi },
              ]);
            }}
            className="mt-2 text-sm text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
          >
            + Rulon qo&apos;shish
          </button>
        </div>
      ) : (
        <Maydon
          nom="miqdor"
          yorliq={`Miqdor (${metrda ? 'metr' : birlikNomi})`}
          izoh={
            metrda
              ? 'metrda kiriting — baza ham metrda saqlaydi (Q-01)'
              : 'Omborda hozir turgan miqdor'
          }
          xato={holat.maydonlar.miqdor}
        >
          {metrda ? (
            <>
              {/*
                ⚠️ 2026-09-20 — ekranda ham, bazada ham METR. Ilgari
                   baza metrda edi va bu yerda ×100 turardi; omborchi
                   50 metrni 5000 deb yozishi kerak bo'lardi va bir
                   kunmas-bir kun kimdir 50 deb yozib qo'yardi.
              */}
              <input
                id="miqdor"
                value={metr}
                onChange={(e) => {
                  metrniOzgartir(e.target.value);
                }}
                inputMode="decimal"
                className={kirishUslubi(holat.maydonlar.miqdor !== undefined)}
              />
              {/*
                ⚠️ 2026-09-20 — baza ham METRDA. Ilgari bu yerda
                   ×100 turardi va omborchiga «= 300 sm» deb
                   ko'rsatilardi. Endi o'girish ham, tushuntirish
                   ham kerak emas: yozgani — saqlangani.
              */}
              <input type="hidden" name="miqdor" value={metr} />
            </>
          ) : (
            <input
              id="miqdor"
              name="miqdor"
              inputMode="decimal"
              className={kirishUslubi(holat.maydonlar.miqdor !== undefined)}
            />
          )}
        </Maydon>
      )}

      {/*
        NARX ASOSI — 2026-09-23.

        Ilgari bu forma to'g'ridan-to'g'ri «1 kv.m tannarxi» ni
        so'rardi va egasi «metriga 78 000» degan raqamni o'zi
        kalkulyator bilan o'girishi kerak edi. Material
        kartochkasidagi zahira bo'limi esa buni O'ZI qilardi —
        ikki yo'l ikki xil ishlardi.

        Endi ikkalasi ham bir xil: asos tanlanadi, hisob ekranda
        ko'rinadi, o'girishni tizim qiladi.
      */}
      {rulon && (
        <Maydon
          nom="narxAsosi"
          yorliq="Narx qanday berilgan"
          izoh="qanday bilsangiz shunday yozing — o'girishni tizim qiladi"
        >
          <select
            id="narxAsosi"
            name="narxAsosi"
            value={narxAsosi}
            onChange={(e) => {
              narxAsosiniOzgartir(e.target.value);
            }}
            className={kirishUslubi(false)}
          >
            <option value="METR">Bo&apos;yiga — 1 metr uchun</option>
            <option value="KV_M">Maydonga — 1 kv.m uchun</option>
            <option value="BIRLIK">Butun rulonga</option>
          </select>
        </Maydon>
      )}

      <Maydon
        nom="tannarxBirlik"
        yorliq={
          rulon
            ? `Narx — ${
                narxAsosi === 'KV_M'
                  ? '1 kv.m uchun'
                  : narxAsosi === 'BIRLIK'
                    ? 'butun rulonga'
                    : '1 metr uchun'
              }`
            : `Tannarx — 1 ${birlikNomi} uchun`
        }
        izoh={
          rulon
            ? "qanday bilsangiz shunday yozing — 1 kv.m tannarxini tizim hisoblaydi"
            : 'Sarflash birligi uchun tannarx (P-20)'
        }
        xato={holat.maydonlar.tannarxBirlik}
      >
        <input
          id="tannarxBirlik"
          name="tannarxBirlik"
          value={narxMatn}
          onChange={(e) => {
            narxMatniniOzgartir(e.target.value);
          }}
          inputMode="decimal"
          className={kirishUslubi(holat.maydonlar.tannarxBirlik !== undefined)}
          placeholder="masalan 78000"
        />
      </Maydon>

      {/*
        HISOB EKRANDA — 2026-09-23.

        Egasi «metriga 78 000» deb yozadi, bazaga esa 1 kv.m
        tannarxi tushadi. U qanday chiqqanini ko'rib turishi kerak,
        aks holda raqamga ishonmaydi — material kartochkasidagi
        zahira bo'limida ham xuddi shunday.
      */}
      {hisob !== null && (
        <div className="rounded-maydon bg-fon px-3 py-2.5 text-[13px] text-matn-ikki">
          <p>
            1 kv.m tannarxi: <b className="raqam">{hisob.tannarx}</b> so&apos;m
          </p>
          <p className="mt-0.5">
            Jami: <b className="raqam">{hisob.formula}</b> ={' '}
            <b className="raqam">{hisob.jami}</b> so&apos;m
          </p>
        </div>
      )}

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
