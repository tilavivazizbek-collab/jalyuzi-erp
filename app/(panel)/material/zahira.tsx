'use client';

/**
 * app/(panel)/material/zahira.tsx — «Omborda hozir bor».
 *
 * ⚠️ Egasi (2026-08-30): «saqlanmasdan yangi material
 *    qo'shishning o'zida bo'lsin».
 *
 *    Ilgari mahsulot saqlangach alohida ekran ochilardi. Endi
 *    hammasi bitta formada: mahsulot ham, zahira ham bitta
 *    «Saqlash» bilan yoziladi.
 *
 * ⚠️ IXTIYORIY. Bo'sh qoldirilsa hech narsa yozilmaydi —
 *    hali kelmagan mahsulot ham qo'shiladi.
 *
 * ⚠️ Faqat YANGI mahsulotda ko'rinadi. Mavjud mahsulotda
 *    qoldiq allaqachon bor va uni bu yerdan qo'shish ikki
 *    barobar qilib yuborardi.
 */

import { useState } from 'react';
import { Maydon, kirishUslubi } from '../maydon';
import { rulonKvMTannarxi } from '@/lib/domain/boshlangich-narx';
import { som } from '@/lib/domain/pul';
import type { MaydonXatolari } from '../forma-yordamchi';

interface Olcham {
  eniM: string;
  boyiM: string;
}

const BOSH_OLCHAM: Olcham = { eniM: '', boyiM: '' };

export function ZahiraBolimi({
  rulonmi,
  birlikNomi,
  narxAsosi,
  xatolar,
  boshEni,
  boshBoyi,
}: {
  /** Rulon bo'lsa har rulonning eni × bo'yi so'raladi */
  rulonmi: boolean;
  /** Sarflash birligi nomi — «dona», «santimetr» */
  birlikNomi: string;
  /** Kartochkada tanlangan usul — narx shu bo'yicha hisoblanadi */
  narxAsosi: string;
  xatolar: MaydonXatolari;
  /** Kartochkadagi odatdagi o'lchamlar — birinchi qator shu bilan ochiladi */
  boshEni: string;
  boshBoyi: string;
}) {
  const [ochiq, ochiqniOzgartir] = useState(false);
  const [olchamlar, olchamlarniOzgartir] = useState<Olcham[]>(() => [
    { eniM: boshEni, boyiM: boshBoyi },
  ]);
  const [miqdor, miqdorniOzgartir] = useState('');
  const [narx, narxniOzgartir] = useState('');

  /**
   * ⚠️ Hisob EKRANDA ko'rsatiladi. Egasi «metriga 5 $» deb yozadi,
   *    bazaga esa 1 kv.m tannarxi tushadi — u qanday chiqqanini
   *    ko'rib turishi kerak, aks holda raqamga ishonmaydi.
   */
  const tannarx = ((): string | null => {
    if (!rulonmi || narx === '') return null;
    const b = olchamlar
      .map((o) => ({ eniM: Number(o.eniM), boyiM: Number(o.boyiM) }))
      .filter((o) => o.eniM > 0 && o.boyiM > 0);
    if (b.length === 0) return null;
    try {
      return rulonKvMTannarxi(
        narxAsosi === 'KV_M' ? 'KV_M' : narxAsosi === 'BIRLIK' ? 'BIRLIK' : 'METR',
        som(narx),
        b,
      );
    } catch {
      return null;
    }
  })();

  const usulMatni =
    narxAsosi === 'KV_M'
      ? 'kv.m ga'
      : narxAsosi === 'BIRLIK'
        ? 'rulonga'
        : "bo'yiga (metriga)";

  return (
    <section className="rounded-karta border border-chegara p-4">
      <button
        type="button"
        onClick={() => {
          ochiqniOzgartir(!ochiq);
        }}
        aria-expanded={ochiq}
        className="fokus flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="text-sm font-semibold text-matn">Omborda hozir bor</span>
          <span className="ml-2 text-xs text-matn-kuchsiz">ixtiyoriy</span>
        </span>
        <span aria-hidden className="text-[11px] text-matn-kuchsiz">
          {ochiq ? '▲' : '▼'}
        </span>
      </button>

      {!ochiq && (
        <p className="mt-1.5 text-xs text-matn-kuchsiz">
          Bu mahsulotdan omborda hozir bor bo&apos;lsa shu yerda kiriting — aks holda
          qoldiq nol bo&apos;lib turadi va sotuvda &laquo;material yetmadi&raquo; chiqadi.
        </p>
      )}

      {ochiq && (
        <div className="mt-4 flex flex-col gap-4">
          {rulonmi ? (
            <div>
              <p className="mb-2 text-xs text-matn-ikki">
                Har rulon alohida bo&apos;lak bo&apos;lib tushadi (7.9)
              </p>
              <div className="flex flex-col gap-1.5">
                {olchamlar.map((o, k) => (
                  <div key={k} className="flex items-center gap-2 text-sm">
                    <span className="w-8 shrink-0 text-xs text-matn-kuchsiz">#{k + 1}</span>
                    <input
                      value={o.eniM}
                      onChange={(e) => {
                        olchamlarniOzgartir((x) =>
                          x.map((y, j) => (j === k ? { ...y, eniM: e.target.value } : y)),
                        );
                      }}
                      placeholder="eni (m)"
                      inputMode="decimal"
                      className={`${kirishUslubi(false)} max-w-28`}
                    />
                    <span className="text-matn-kuchsiz">×</span>
                    <input
                      value={o.boyiM}
                      onChange={(e) => {
                        olchamlarniOzgartir((x) =>
                          x.map((y, j) => (j === k ? { ...y, boyiM: e.target.value } : y)),
                        );
                      }}
                      placeholder="bo'yi (m)"
                      inputMode="decimal"
                      className={`${kirishUslubi(false)} max-w-28`}
                    />
                    {olchamlar.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          olchamlarniOzgartir((x) => x.filter((_, j) => j !== k));
                        }}
                        aria-label={`${String(k + 1)}-rulonni olib tashlash`}
                        className="fokus rounded-maydon px-1.5 text-matn-kuchsiz hover:text-belgi-qizil"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  olchamlarniOzgartir((x) => [...x, BOSH_OLCHAM]);
                }}
                className="fokus mt-2 rounded-maydon text-sm text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
              >
                + Rulon qo&apos;shish
              </button>

              <input
                type="hidden"
                name="zahiraBolaklar"
                value={JSON.stringify(
                  olchamlar
                    .map((o) => ({ eniM: Number(o.eniM), boyiM: Number(o.boyiM) }))
                    .filter((o) => o.eniM > 0 && o.boyiM > 0),
                )}
              />
            </div>
          ) : (
            <Maydon
              nom="zahiraMiqdor"
              yorliq={`Miqdor (${birlikNomi})`}
              izoh="omborda hozir turgan miqdor"
              xato={xatolar['miqdor']}
            >
              <input
                id="zahiraMiqdor"
                name="zahiraMiqdor"
                value={miqdor}
                onChange={(e) => {
                  miqdorniOzgartir(e.target.value);
                }}
                inputMode="decimal"
                className={kirishUslubi(xatolar['miqdor'] !== undefined)}
              />
            </Maydon>
          )}

          <Maydon
            nom="zahiraNarx"
            yorliq={rulonmi ? `Narx — ${usulMatni}` : `Tannarx — 1 ${birlikNomi} uchun`}
            izoh={
              rulonmi
                ? 'usul yuqorida, «Kirimda narx qanday hisoblanadi» da tanlangan'
                : 'omborda turgan mahsulotning tannarxi'
            }
            xato={xatolar['narx']}
          >
            <input
              id="zahiraNarx"
              name="zahiraNarx"
              value={narx}
              onChange={(e) => {
                narxniOzgartir(e.target.value);
              }}
              inputMode="decimal"
              placeholder="masalan 60000"
              className={kirishUslubi(xatolar['narx'] !== undefined)}
            />
          </Maydon>

          {tannarx !== null && (
            <p className="rounded-maydon bg-fon px-3 py-2 text-[13px] text-matn-ikki">
              1 kv.m tannarxi: <b className="raqam">{tannarx}</b>
            </p>
          )}

          <Maydon nom="zahiraIzoh" yorliq="Izoh" izoh="ixtiyoriy" xato={xatolar['izoh']}>
            <input
              id="zahiraIzoh"
              name="zahiraIzoh"
              placeholder="Tizimga o'tish qoldig'i"
              className={kirishUslubi(xatolar['izoh'] !== undefined)}
            />
          </Maydon>
        </div>
      )}
    </section>
  );
}
