'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { BOSH_HOLAT, type KonstruktorHolati } from './holat';
import { TestKalkulyatori, type GuruhMalumoti } from './kalkulyator';
import { TezQoshish } from '../tanlov';
import { guruhTezQosh, materialTezQosh } from '../tez-amal';
import {
  SARF_TAVSIFI,
  SARF_TURLARI,
  formuladanSarf,
  sarfFormulasi,
  type SarfTuri,
} from '@/lib/domain/sarf-turi';
import { BIRLIK_TAVSIFI } from '@/lib/domain/birlik-tanlovi';

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
  slotlar: [],
  parametrlar: [],
  aksessuarlar: [],
};

/**
 * ⚠️ EKRANDA MATO VA AKSESSUAR AJRATILMAYDI.
 *
 *    Bazada ular ikki jadval: guruhga bog'langani `mahsulot_slot`
 *    (sotuvda mato tanlanadi), aniq materialga bog'langani
 *    `mahsulot_aksessuar` (o'zi qo'shiladi).
 *
 *    Lekin egasi uchun ikkalasi ham «shu mahsulotga ketadigan
 *    material». Shuning uchun bitta ro'yxat: ro'yxatdan guruh
 *    tanlansa slot bo'ladi, aniq material tanlansa aksessuar.
 *    Ajratishni tizim o'zi qiladi.
 */
interface Qator {
  turi: 'GURUH' | 'MATERIAL';
  id: number | null;
  sarfTuri: SarfTuri;
  /** Raqamli turlarda son, `MURAKKAB` da formulaning o'zi */
  sarfQiymat: string;
  majburiy: boolean;
}

const kirish =
  'w-full rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25';
const kichik = `${kirish} py-1.5`;

/** Ro'yxatdagi qiymat: `G:12` — guruh, `M:34` — material */
function qatorQiymati(q: Qator): string {
  if (q.id === null) return '';
  return `${q.turi === 'GURUH' ? 'G' : 'M'}:${String(q.id)}`;
}

/**
 * Saqlangan slot va aksessuarlarni bitta ro'yxatga qo'shadi.
 *
 * ⚠️ Slotlar OLDIN turadi: sotuv ekranida mato tanlash birinchi
 *    qadam, aksessuar esa o'zi qo'shiladi.
 */
function boshQatorlar(q: MahsulotQiymatlari): Qator[] {
  const slotlar: Qator[] = q.slotlar.map((s) => {
    const sarf = formuladanSarf(s.formula);
    return {
      turi: 'GURUH',
      id: s.almashtirishGuruhId,
      sarfTuri: sarf.turi,
      sarfQiymat: sarf.qiymat,
      majburiy: s.majburiy,
    };
  });

  const aksessuarlar: Qator[] = q.aksessuarlar.map((a) => {
    const sarf = formuladanSarf(a.formula);
    return {
      turi: 'MATERIAL',
      id: a.materialId,
      sarfTuri: sarf.turi,
      sarfQiymat: sarf.qiymat,
      majburiy: a.majburiy,
    };
  });

  return [...slotlar, ...aksessuarlar];
}

/**
 * Sarf tanlovini formula matniga aylantiradi.
 *
 * ⚠️ Yiqilmaydi: forma to'ldirilayotgan paytda qiymat bo'sh yoki
 *    yarim yozilgan bo'lishi normal holat. Bunday qator bo'sh
 *    formula bilan ketadi va serverdagi tekshiruv tushunarli xato
 *    beradi (4.5 — «xato bo'lsa saqlanmaydi»).
 */
function xavfsizFormula(turi: SarfTuri, qiymat: string): string {
  try {
    return sarfFormulasi(turi, qiymat);
  } catch {
    return '';
  }
}

export function MahsulotFormasi({
  amal,
  qiymatlar,
  guruhlar,
  materiallar,
  tugmaMatni,
  guruhQoshaOladi,
  materialQoshaOladi,
}: {
  amal: (holat: KonstruktorHolati, forma: FormData) => Promise<KonstruktorHolati>;
  qiymatlar: MahsulotQiymatlari;
  guruhlar: readonly GuruhMalumoti[];
  materiallar: readonly MaterialTanlovi[];
  tugmaMatni: string;
  guruhQoshaOladi: boolean;
  /** §9.4 — server amali ham `material.yarat` ni tekshiradi */
  materialQoshaOladi: boolean;
}) {
  const [holat, yubor, kutilmoqda] = useActionState(amal, BOSH_HOLAT);

  const [xizmatHaqi, setXizmatHaqi] = useState(qiymatlar.xizmatHaqi);
  const [qatorlar, setQatorlar] = useState<Qator[]>(boshQatorlar(qiymatlar));

  const [guruhRoyxati, setGuruhRoyxati] = useState<readonly GuruhMalumoti[]>(guruhlar);
  const [materialRoyxati, setMaterialRoyxati] =
    useState<readonly MaterialTanlovi[]>(materiallar);

  /**
   * ⚠️ Parametrlar ekrandan olib tashlandi (egasi qarori). Bazadagi
   *    jadval joyida qoldi, shuning uchun mavjud parametrlar
   *    O'CHIRILMAYDI — ular shu yerdan o'zgarishsiz qaytariladi.
   *    Aks holda saqlash ularni jimgina nofaol qilib qo'yardi va
   *    ularga tayangan formulalar buzilardi.
   */
  const [parametrlar] = useState<readonly ParametrQatori[]>(qiymatlar.parametrlar);

  const yangila = (i: number, o: Partial<Qator>): void => {
    setQatorlar((eski) => eski.map((q, j) => (i === j ? { ...q, ...o } : q)));
  };

  const guruhNomi = (id: number | null): string =>
    guruhRoyxati.find((g) => g.id === id)?.nom ?? '';

  // ─── Saqlashga tayyorlash ───────────────────────────────────────────────

  const slotlar: SlotQatori[] = qatorlar
    .filter((q) => q.turi === 'GURUH' && q.id !== null)
    .map((q) => ({
      /**
       * ⚠️ Slot nomi guruh nomidan olinadi — ekranda alohida
       *    so'ralmaydi (egasi qarori). U sotuv ekranida qator
       *    sarlavhasi bo'lib chiqadi.
       */
      nom: guruhNomi(q.id),
      formula: xavfsizFormula(q.sarfTuri, q.sarfQiymat),
      majburiy: q.majburiy,
      almashtirishGuruhId: q.id,
    }));

  const aksessuarlar: AksessuarQatori[] = qatorlar
    .filter((q) => q.turi === 'MATERIAL' && q.id !== null)
    .map((q) => ({
      materialId: q.id as number,
      formula: xavfsizFormula(q.sarfTuri, q.sarfQiymat),
      majburiy: q.majburiy,
    }));

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
                ixtiyoriy — bo&apos;sh qolsa narxga qo&apos;shilmaydi
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
              <span className="text-xs text-matn-kuchsiz">sotuv ekranidagi joyi</span>
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

        <section className="rounded-karta border border-chegara bg-sirt p-5">
          <h2 className="mb-1 text-sm font-semibold">Materiallar</h2>
          <p className="mb-4 text-xs text-matn-kuchsiz">
            Shu mahsulotga nima ketishi. Guruh tanlansa — sotuvchi ichidan matoni tanlaydi; aniq
            material tanlansa — o&apos;zi qo&apos;shiladi.
          </p>

          {qatorlar.length === 0 ? (
            <p className="mb-3 text-sm text-matn-kuchsiz">Hali material qo&apos;shilmagan.</p>
          ) : (
            <div className="mb-3 flex flex-col gap-2">
              {qatorlar.map((q, i) => {
                const tavsif = SARF_TAVSIFI[q.sarfTuri];

                return (
                  <div key={i} className="rounded-maydon border border-chegara p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_150px_110px] sm:items-center">
                      <select
                        value={qatorQiymati(q)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') {
                            yangila(i, { id: null });
                            return;
                          }
                          yangila(i, {
                            turi: v.startsWith('G') ? 'GURUH' : 'MATERIAL',
                            id: Number(v.slice(2)),
                          });
                        }}
                        className={kichik}
                      >
                        <option value="">— tanlang —</option>
                        <optgroup label="Guruhlar (sotuvchi tanlaydi)">
                          {guruhRoyxati.map((g) => (
                            <option key={`G${String(g.id)}`} value={`G:${String(g.id)}`}>
                              {g.nom}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Aniq material">
                          {materialRoyxati.map((m) => (
                            <option key={`M${String(m.id)}`} value={`M:${String(m.id)}`}>
                              {m.nom}
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      <select
                        value={q.sarfTuri}
                        onChange={(e) => {
                          yangila(i, { sarfTuri: e.target.value as SarfTuri });
                        }}
                        aria-label="Sarfi"
                        className={kichik}
                      >
                        {SARF_TURLARI.map((t) => (
                          <option key={t} value={t}>
                            {SARF_TAVSIFI[t].nom}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        {tavsif.raqamli && (
                          <span className="shrink-0 text-[13px] text-matn-kuchsiz">×</span>
                        )}
                        <input
                          value={q.sarfQiymat}
                          onChange={(e) => {
                            yangila(i, { sarfQiymat: e.target.value });
                          }}
                          inputMode={tavsif.raqamli ? 'decimal' : 'text'}
                          placeholder={tavsif.raqamli ? '1' : "(ENI - 60) * BO'YI"}
                          aria-label={tavsif.raqamli ? 'Sarf miqdori' : 'Formula'}
                          className={`${kichik} min-w-0 ${tavsif.raqamli ? '' : 'font-mono'}`}
                        />
                      </div>
                    </div>

                    {/*
                      ⚠️ «Murakkab» tanlansa katak butun qatorni egallaydi —
                         formula uzun bo'ladi va tor katakda o'qib bo'lmaydi.
                    */}
                    {!tavsif.raqamli && (
                      <p className="mt-2 text-[11px] text-matn-kuchsiz">
                        Ishlatiladi: <code>ENI</code>, <code>BO&apos;YI</code>,{' '}
                        <code>MAYDON</code>, <code>SONI</code>. Amallar:{' '}
                        <code>+ − × /</code> va qavslar. O&apos;lchamlar{' '}
                        <b>santimetrda</b>.
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-matn-kuchsiz">{tavsif.izoh}</span>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                          <input
                            type="checkbox"
                            checked={q.majburiy}
                            onChange={(e) => {
                              yangila(i, { majburiy: e.target.checked });
                            }}
                            className="size-3.5"
                          />
                          majburiy
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setQatorlar(qatorlar.filter((_, j) => j !== i));
                          }}
                          className="fokus rounded-maydon px-1.5 text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                          aria-label="O'chirish"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setQatorlar([
                ...qatorlar,
                {
                  turi: 'GURUH',
                  id: null,
                  sarfTuri: 'MAYDON',
                  sarfQiymat: '1',
                  majburiy: true,
                },
              ]);
            }}
            className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fon"
          >
            + Qo&apos;shimcha material
          </button>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {guruhQoshaOladi && (
              <TezQoshish
                ixcham
                yangiYorliq="Yangi guruh"
                yarat={guruhTezQosh}
                qoshildi={(n) => {
                  setGuruhRoyxati((r) => [
                    ...r,
                    {
                      id: n.id,
                      nom: n.nom,
                      sarflashBirligi: 'KV_M',
                      namunaNarx: null,
                      namunaNom: null,
                    },
                  ]);
                }}
              />
            )}

            {materialQoshaOladi && (
              <TezQoshish
                ixcham
                yangiYorliq="Yangi material"
                yaratIkki={materialTezQosh}
                ikkinchi={{
                  yorliq: "O'lchov birligi",
                  boshlangich: 'DONA',
                  /**
                   * ⚠️ Faqat o'girish talab qilmaydigan birliklar.
                   *    Shtanga va quti «1 shtanga necha metr» degan
                   *    javobni talab qiladi — uni bu yerda so'ramaymiz,
                   *    taxmin qilib qo'yish esa ombordan noto'g'ri
                   *    miqdor yechilishiga olib kelardi (5.3).
                   */
                  bandlar: (['DONA', 'RULON', 'KV_M'] as const).map((b) => ({
                    qiymat: b,
                    nom: BIRLIK_TAVSIFI[b].nom,
                  })),
                }}
                qoshildi={(n) => {
                  setMaterialRoyxati((r) => [...r, n]);
                }}
              />
            )}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={kutilmoqda}
            className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-60"
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
          guruhlar={guruhRoyxati}
          xizmatHaqi={xizmatHaqi}
        />
      </div>
    </div>
  );
}
