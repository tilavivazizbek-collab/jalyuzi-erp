'use client';

/**
 * Yangi xarid buyurtmasi (0063). Ombor auditi 2026-10-07, 7-band.
 *
 * ⚠️ Bu yerda PUL YOZILMAYDI — narx faqat kelishilgan narx sifatida
 *    eslab qolinadi va mol kelganda kirimni oldindan to'ldiradi.
 */

import { useActionState, useState } from 'react';
import Decimal from 'decimal.js';
import { enterYuborilmasin } from '../../forma-yordamchi';
import { Maydon, kirishUslubi } from '../../maydon';
import { Tanlagich } from '../../tanlagich';
import { toshkentKuni } from '@/lib/domain/sana';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { xaridYaratAmali, type XaridFormaHolati } from './amal';
import { qatorAsosi, type MaterialTanlovi, type YetkazibTanlovi } from '../kirim/forma';
import { narxBirligiMatni, xaridQatorSummasi } from '@/lib/domain/xarid';

const BOSH: XaridFormaHolati = { xato: null };
const kichik = `${kirishUslubi(false)} py-1.5`;

interface Qator {
  materialId: number;
  miqdor: string;
  narxBirlik: string;
}

/** Kartochkadagi kutilayotgan narx — faqat valyutasi bir xil bo'lsa */
function boshNarx(m: MaterialTanlovi | undefined, valyuta: string): string {
  if (m === undefined || m.kutilayotganNarx === null) return '';
  return m.kutilayotganValyuta === valyuta ? m.kutilayotganNarx : '';
}

const sonmi = (x: string): boolean => /^\d+(\.\d{1,2})?$/.test(x.trim());

export function XaridFormasi({
  materiallar,
  yetkazuvchilar,
  yolda,
  boshMaterialIdlar,
}: {
  materiallar: readonly MaterialTanlovi[];
  yetkazuvchilar: readonly YetkazibTanlovi[];
  /** materialId → hali kelmagan miqdor (boshqa ochiq buyurtmalarda) */
  yolda: Readonly<Record<number, string>>;
  boshMaterialIdlar: readonly number[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(xaridYaratAmali, BOSH);
  const [yetkazib, setYetkazib] = useState('');
  const [valyuta, setValyuta] = useState('SOM');
  const [qatorlar, setQatorlar] = useState<Qator[]>(() =>
    boshMaterialIdlar
      .filter((id) => materiallar.some((m) => m.id === id))
      .map((id) => ({
        materialId: id,
        miqdor: '',
        narxBirlik: boshNarx(
          materiallar.find((m) => m.id === id),
          'SOM',
        ),
      })),
  );

  const material = (id: number): MaterialTanlovi | undefined =>
    materiallar.find((m) => m.id === id);
  const yangila = (i: number, o: Partial<Qator>): void => {
    setQatorlar((e) => e.map((q, j) => (i === j ? { ...q, ...o } : q)));
  };

  /**
   * Jami — TAXMINIY: metrga narxlangan rulon odatdagi bo'yi bilan
   * hisoblanadi (haqiqiysi kirimda, o'lchanganda).
   */
  let jami = new Decimal(0);
  let narxsiz = 0;
  for (const q of qatorlar) {
    const m = material(q.materialId);
    const s =
      m !== undefined && sonmi(q.miqdor) && sonmi(q.narxBirlik)
        ? xaridQatorSummasi({
            narx: q.narxBirlik,
            miqdor: q.miqdor,
            asosi: qatorAsosi(m),
            odatdagiBoyiM: m.odatdagiBoyiM,
            odatdagiEniM: m.odatdagiEniM,
          })
        : null;
    if (s === null) narxsiz += 1;
    else jami = jami.plus(s);
  }
  const takror = new Set(
    qatorlar.map((q) => q.materialId).filter((id, i, a) => a.indexOf(id) !== i),
  );
  const valyutaNomi = valyuta === 'USD' ? '$' : "so'm";

  return (
    <form action={yubor} onKeyDown={enterYuborilmasin} className="flex flex-col gap-6">
      <input
        type="hidden"
        name="qatorlar"
        value={JSON.stringify(
          qatorlar.map((q) => {
            const m = material(q.materialId);
            return {
              materialId: q.materialId,
              miqdor: q.miqdor,
              narxBirlik: q.narxBirlik,
              // ⚠️ Usul kartochkadan — kirim qatori ham shu bilan ochiladi (7.9)
              narxAsosi: m === undefined ? 'BIRLIK' : qatorAsosi(m),
            };
          }),
        )}
      />

      {holat.xato !== null && (
        <p role="alert" className="rounded-maydon bg-belgi-qizil-fon px-3 py-2 text-sm text-belgi-qizil">
          {holat.xato}
        </p>
      )}

      <section className="rounded-karta border border-chegara bg-sirt p-5">
        <h2 className="mb-4 text-sm font-semibold">Buyurtma</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Maydon nom="yetkazibBeruvchiId" yorliq="Yetkazib beruvchi">
            <Tanlagich
              nom="yetkazibBeruvchiId"
              qiymat={yetkazib}
              ozgartir={(v) => {
                setYetkazib(v);
                // Yetkazib beruvchi odatda bir valyutada ishlaydi (9.1)
                const y = yetkazuvchilar.find((x) => String(x.id) === v);
                if (y !== undefined && (y.valyuta === 'SOM' || y.valyuta === 'USD')) setValyuta(y.valyuta);
              }}
              yozuvlar={yetkazuvchilar.map((y) => ({ qiymat: String(y.id), matn: y.nom }))}
              joyBelgisi="— tanlang —"
            />
          </Maydon>

          <Maydon nom="sana" yorliq="Buyurtma sanasi">
            <input id="sana" name="sana" type="date" required defaultValue={toshkentKuni()} className={kirishUslubi(false)} />
          </Maydon>

          <Maydon nom="kutilganSana" yorliq="Qachon keladi" izoh="yetkazib beruvchi va'dasi — o'tsa «kechikkan» bo'ladi">
            <input id="kutilganSana" name="kutilganSana" type="date" className={kirishUslubi(false)} />
          </Maydon>

          <Maydon nom="valyuta" yorliq="Valyuta">
            <select
              id="valyuta"
              name="valyuta"
              value={valyuta}
              onChange={(e) => {
                setValyuta(e.target.value);
              }}
              className={kirishUslubi(false)}
            >
              <option value="SOM">so&apos;m</option>
              <option value="USD">dollar</option>
            </select>
          </Maydon>

          <div className="sm:col-span-2">
            <Maydon nom="izoh" yorliq="Izoh" izoh="ixtiyoriy — rang, artikul, kelishuv shartlari">
              <input id="izoh" name="izoh" maxLength={500} className={kirishUslubi(false)} />
            </Maydon>
          </div>
        </div>
      </section>

      <section className="rounded-karta border border-chegara bg-sirt p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Materiallar</h2>
          <button
            type="button"
            disabled={materiallar.length === 0}
            onClick={() => {
              const b = materiallar[0];
              if (b !== undefined) setQatorlar([...qatorlar, { materialId: b.id, miqdor: '', narxBirlik: boshNarx(b, valyuta) }]);
            }}
            className="rounded-maydon border border-chegara-quyuq px-2.5 py-1 text-xs hover:bg-fon disabled:opacity-40"
          >
            + qator
          </button>
        </div>

        {qatorlar.length === 0 ? (
          <p className="text-sm text-matn-kuchsiz">Qator qo&apos;shing.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {qatorlar.map((q, i) => {
              const m = material(q.materialId);
              const yol = yolda[q.materialId];
              return (
                <div key={i} className="rounded-maydon border border-chegara p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_150px_200px_32px]">
                    <Tanlagich
                      kichik
                      qiymat={String(q.materialId)}
                      ozgartir={(v) => {
                        const id = Number(v);
                        yangila(i, { materialId: id, narxBirlik: boshNarx(material(id), valyuta) });
                      }}
                      ariaYorliq="Material"
                      yozuvlar={materiallar.map((x) => ({ qiymat: String(x.id), matn: x.nom }))}
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        value={q.miqdor}
                        onChange={(e) => {
                          yangila(i, { miqdor: e.target.value });
                        }}
                        placeholder="miqdor"
                        aria-label={m === undefined ? 'Miqdor' : `Miqdor — nechta ${m.kirimBirligi}`}
                        inputMode="decimal"
                        className={kichik}
                      />
                      {m !== undefined && <span className="shrink-0 text-[12px] text-matn-kuchsiz">{m.kirimBirligi}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        value={q.narxBirlik}
                        onChange={(e) => {
                          yangila(i, { narxBirlik: e.target.value });
                        }}
                        placeholder="narx (ixtiyoriy)"
                        aria-label="Kelishilgan narx"
                        inputMode="decimal"
                        className={kichik}
                      />
                      <span className="shrink-0 text-[12px] text-matn-kuchsiz">
                        {m === undefined ? valyutaNomi : narxBirligiMatni(qatorAsosi(m), valyuta, m.kirimBirligi)}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Qatorni o'chirish"
                      onClick={() => {
                        setQatorlar(qatorlar.filter((_, j) => j !== i));
                      }}
                      className="rounded-maydon text-matn-kuchsiz hover:text-belgi-qizil"
                    >
                      ×
                    </button>
                  </div>
                  {takror.has(q.materialId) && (
                    <p className="mt-1.5 text-[12px] text-belgi-qizil">
                      Bu material ikki marta yozilgan — miqdorini bitta qatorga jamlang.
                    </p>
                  )}
                  {yol !== undefined && (
                    <p className="mt-1.5 text-[12px] text-belgi-sariq">
                      Diqqat: bu materialdan {yol} {m?.kirimBirligi ?? ''} boshqa buyurtmada allaqachon
                      yo&apos;lda.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-matn-ikki">
          Taxminiy summa:{' '}
          <span className="font-semibold tabular-nums text-matn">
            {pulKorsat(valyuta === 'USD' ? dollar(jami.toFixed(2)) : som(jami.toFixed(2)))} {valyutaNomi}
          </span>
          {narxsiz > 0 && <span className="text-matn-kuchsiz"> · {narxsiz} qatorda summa hisoblanmadi</span>}
        </p>
        <button
          type="submit"
          disabled={kutilmoqda || qatorlar.length === 0 || takror.size > 0}
          className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-tugma-matn transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
        >
          {kutilmoqda ? 'Saqlanmoqda…' : 'Buyurtmani saqlash'}
        </button>
      </div>
    </form>
  );
}
