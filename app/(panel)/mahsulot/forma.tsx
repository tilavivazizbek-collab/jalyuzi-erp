'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { BOSH_HOLAT, type KonstruktorHolati } from './holat';
import { TestKalkulyatori, type GuruhMalumoti } from './kalkulyator';

export interface MaterialTanlovi {
  readonly id: number;
  readonly nom: string;
}

export interface SlotQatori {
  nom: string;
  formula: string;
  majburiy: boolean;
  almashtirishGuruhId: number | null;
}

export interface ParametrQatori {
  kod: string;
  nom: string;
  standartQiymat: string;
}

export interface AksessuarQatori {
  materialId: number;
  formula: string;
  majburiy: boolean;
}

export interface MahsulotQiymatlari {
  readonly nom: string;
  readonly xizmatHaqi: string;
  readonly tartib: string;
  readonly oynadaKorinadi: boolean;
  readonly botdaKorinadi: boolean;
  readonly slotlar: readonly SlotQatori[];
  readonly parametrlar: readonly ParametrQatori[];
  readonly aksessuarlar: readonly AksessuarQatori[];
}

export const BOSH_QIYMATLAR: MahsulotQiymatlari = {
  nom: '',
  xizmatHaqi: '',
  tartib: '0',
  oynadaKorinadi: true,
  botdaKorinadi: true,
  slotlar: [{ nom: '', formula: 'MAYDON', majburiy: true, almashtirishGuruhId: null }],
  parametrlar: [],
  aksessuarlar: [],
};

const kirish =
  'w-full rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25';
const kichik = `${kirish} py-1.5`;

export function MahsulotFormasi({
  amal,
  qiymatlar,
  guruhlar,
  materiallar,
  tugmaMatni,
}: {
  amal: (holat: KonstruktorHolati, forma: FormData) => Promise<KonstruktorHolati>;
  qiymatlar: MahsulotQiymatlari;
  guruhlar: readonly GuruhMalumoti[];
  materiallar: readonly MaterialTanlovi[];
  tugmaMatni: string;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);

  const [xizmatHaqi, setXizmatHaqi] = useState(qiymatlar.xizmatHaqi);
  const [slotlar, setSlotlar] = useState<SlotQatori[]>([...qiymatlar.slotlar]);
  const [parametrlar, setParametrlar] = useState<ParametrQatori[]>([...qiymatlar.parametrlar]);
  const [aksessuarlar, setAksessuarlar] = useState<AksessuarQatori[]>([...qiymatlar.aksessuarlar]);

  const slotYangila = (i: number, o: Partial<SlotQatori>): void => {
    setSlotlar((eski) => eski.map((s, j) => (i === j ? { ...s, ...o } : s)));
  };
  const parametrYangila = (i: number, o: Partial<ParametrQatori>): void => {
    setParametrlar((eski) => eski.map((p, j) => (i === j ? { ...p, ...o } : p)));
  };
  const aksessuarYangila = (i: number, o: Partial<AksessuarQatori>): void => {
    setAksessuarlar((eski) => eski.map((a, j) => (i === j ? { ...a, ...o } : a)));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form action={yubor} className="flex flex-col gap-6">
        {/* Dinamik qatorlar JSON bo'lib yuboriladi — tartibi ham saqlanadi */}
        <input type="hidden" name="slotlar" value={JSON.stringify(slotlar)} />
        <input type="hidden" name="parametrlar" value={JSON.stringify(parametrlar)} />
        <input type="hidden" name="aksessuarlar" value={JSON.stringify(aksessuarlar)} />

        {holat.xato !== null && (
          <div role="alert" className="rounded-maydon bg-belgi-qizil-fon p-4 text-sm ">
            <p className="font-medium text-belgi-qizil">{holat.xato}</p>
            {holat.nuqsonlar.length > 0 && (
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-belgi-qizil">
                {holat.nuqsonlar.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="rounded-karta border border-chegara bg-sirt p-5">
          <h2 className="mb-4 text-sm font-semibold">Asosiy</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-matn-ikki">Nomi</span>
              <input name="nom" defaultValue={qiymatlar.nom} required className={kirish} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Xizmat haqi</span>
              <input
                name="xizmatHaqi"
                value={xizmatHaqi}
                onChange={(e) => {
                  setXizmatHaqi(e.target.value);
                }}
                inputMode="decimal"
                className={kirish}
              />
              <span className="text-xs text-matn-kuchsiz">
                ixtiyoriy — bo&apos;sh qolsa narxga qo&apos;shilmaydi (4.7)
              </span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-matn-ikki">Tartib raqami</span>
              <input
                name="tartib"
                defaultValue={qiymatlar.tartib}
                inputMode="numeric"
                className={kirish}
              />
              <span className="text-xs text-matn-kuchsiz">sotuv ekranidagi joyi (4.2)</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="oynadaKorinadi"
                defaultChecked={qiymatlar.oynadaKorinadi}
                className="size-4"
              />
              Saytda ko&apos;rinadi
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="botdaKorinadi"
                defaultChecked={qiymatlar.botdaKorinadi}
                className="size-4"
              />
              Botda ko&apos;rinadi
            </label>
          </div>
        </section>

        {/* ── 4.3 Parametrlar ── */}
        <section className="rounded-karta border border-chegara bg-sirt p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Parametrlar</h2>
            <button
              type="button"
              onClick={() => {
                setParametrlar([...parametrlar, { kod: '', nom: '', standartQiymat: '0' }]);
              }}
              className="rounded-maydon border border-chegara-quyuq px-2.5 py-1 text-xs hover:bg-fon"
            >
              + qator
            </button>
          </div>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Formulada ishlatiladigan nomlar. Kod <b>katta harfda</b>: <code>CHET</code>. Qiymat
            santimetrda (4.3, 5.3).
          </p>

          {parametrlar.length === 0 ? (
            <p className="text-sm text-matn-kuchsiz">Parametr yo&apos;q.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {parametrlar.map((p, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr_90px_32px] items-center gap-2">
                  <input
                    value={p.kod}
                    onChange={(e) => {
                      parametrYangila(i, { kod: e.target.value.toUpperCase() });
                    }}
                    placeholder="CHET"
                    className={`${kichik} font-mono`}
                  />
                  <input
                    value={p.nom}
                    onChange={(e) => {
                      parametrYangila(i, { nom: e.target.value });
                    }}
                    placeholder="Chet kengligi"
                    className={kichik}
                  />
                  <input
                    value={p.standartQiymat}
                    onChange={(e) => {
                      parametrYangila(i, { standartQiymat: e.target.value });
                    }}
                    inputMode="decimal"
                    className={kichik}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setParametrlar(parametrlar.filter((_, j) => j !== i));
                    }}
                    className="rounded-maydon py-1 text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                    aria-label="O'chirish"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 4.4 Slotlar ── */}
        <section className="rounded-karta border border-chegara bg-sirt p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Mato slotlari</h2>
            <button
              type="button"
              onClick={() => {
                setSlotlar([
                  ...slotlar,
                  { nom: '', formula: 'MAYDON', majburiy: true, almashtirishGuruhId: null },
                ]);
              }}
              className="rounded-maydon border border-chegara-quyuq px-2.5 py-1 text-xs hover:bg-fon"
            >
              + slot
            </button>
          </div>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Ishlatiladi: <code>ENI</code>, <code>BO&apos;YI</code>, <code>MAYDON</code>,{' '}
            <code>SONI</code> va parametrlar. Amallar: <code>+ − × /</code> va qavslar (4.5).
          </p>

          <div className="flex flex-col gap-3">
            {slotlar.map((s, i) => (
              <div key={i} className="rounded-maydon border border-chegara p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_180px_32px]">
                  <input
                    value={s.nom}
                    onChange={(e) => {
                      slotYangila(i, { nom: e.target.value });
                    }}
                    placeholder="Slot nomi — «Chet mato»"
                    className={kichik}
                  />
                  <select
                    value={s.almashtirishGuruhId ?? ''}
                    onChange={(e) => {
                      slotYangila(i, {
                        almashtirishGuruhId: e.target.value === '' ? null : Number(e.target.value),
                      });
                    }}
                    className={kichik}
                  >
                    <option value="">— guruh tanlang —</option>
                    {guruhlar.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nom}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSlotlar(slotlar.filter((_, j) => j !== i));
                    }}
                    disabled={slotlar.length === 1}
                    className="rounded-maydon text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil disabled:opacity-30"
                    aria-label="O'chirish"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    value={s.formula}
                    onChange={(e) => {
                      slotYangila(i, { formula: e.target.value });
                    }}
                    placeholder="(ENI − 2×CHET) × BO'YI"
                    className={`${kichik} font-mono`}
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-matn-ikki">
                    <input
                      type="checkbox"
                      checked={s.majburiy}
                      onChange={(e) => {
                        slotYangila(i, { majburiy: e.target.checked });
                      }}
                      className="size-3.5"
                    />
                    majburiy
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4.6 Aksessuar komplekti ── */}
        <section className="rounded-karta border border-chegara bg-sirt p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Aksessuar komplekti</h2>
            <button
              type="button"
              onClick={() => {
                const birinchi = materiallar[0];
                if (birinchi !== undefined) {
                  setAksessuarlar([
                    ...aksessuarlar,
                    { materialId: birinchi.id, formula: '1', majburiy: true },
                  ]);
                }
              }}
              disabled={materiallar.length === 0}
              className="rounded-maydon border border-chegara-quyuq px-2.5 py-1 text-xs hover:bg-fon disabled:opacity-40"
            >
              + qator
            </button>
          </div>
          <p className="mb-3 text-xs text-matn-kuchsiz">
            Soni yoki formula — ikkalasi ham shu maydonga: <code>4</code> ham, <code>ENI × 2</code>{' '}
            ham yaroqli (4.6).
          </p>

          {materiallar.length === 0 ? (
            <p className="text-sm text-belgi-sariq">
              Avval material qo&apos;shing — komplektga qo&apos;shadigan narsa yo&apos;q.
            </p>
          ) : aksessuarlar.length === 0 ? (
            <p className="text-sm text-matn-kuchsiz">Aksessuar yo&apos;q.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {aksessuarlar.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_130px_90px_32px] items-center gap-2">
                  <select
                    value={a.materialId}
                    onChange={(e) => {
                      aksessuarYangila(i, { materialId: Number(e.target.value) });
                    }}
                    className={kichik}
                  >
                    {materiallar.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                  <input
                    value={a.formula}
                    onChange={(e) => {
                      aksessuarYangila(i, { formula: e.target.value });
                    }}
                    className={`${kichik} font-mono`}
                  />
                  <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                    <input
                      type="checkbox"
                      checked={a.majburiy}
                      onChange={(e) => {
                        aksessuarYangila(i, { majburiy: e.target.checked });
                      }}
                      className="size-3.5"
                    />
                    majburiy
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAksessuarlar(aksessuarlar.filter((_, j) => j !== i));
                    }}
                    className="rounded-maydon text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                    aria-label="O'chirish"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={kutilmoqda}
            className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brend-quyuq disabled:opacity-60"
          >
            {kutilmoqda ? 'Saqlanmoqda…' : tugmaMatni}
          </button>
          <Link href="/mahsulot" className="text-sm text-matn-ikki hover:text-matn">
            Bekor qilish
          </Link>
        </div>
      </form>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <TestKalkulyatori
          slotlar={slotlar.map((s) => ({
            nom: s.nom,
            formula: s.formula,
            guruhId: s.almashtirishGuruhId,
          }))}
          parametrlar={parametrlar.map((p) => ({ kod: p.kod, qiymat: p.standartQiymat }))}
          guruhlar={guruhlar}
          xizmatHaqi={xizmatHaqi}
        />
      </div>
    </div>
  );
}
