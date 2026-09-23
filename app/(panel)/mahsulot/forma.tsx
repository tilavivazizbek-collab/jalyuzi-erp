'use client';

import { enterYuborilmasin } from '../forma-yordamchi';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { BOSH_HOLAT, type KonstruktorHolati } from './holat';
import { TestKalkulyatori, type GuruhMalumoti } from './kalkulyator';
import { Modal } from '../modal';
import { RasmYuklash } from '../rasm-yuklash';
import { GuruhFormasi } from '../guruh-forma';
import {
  MaterialFormasi,
  BOSH_QIYMATLAR as MATERIAL_BOSH_QIYMATLAR,
} from '../material/forma';
import { materialModalYaratAmali } from '../material/amal';
import { tanlovNuqsonlari } from '@/lib/domain/tanlov';
import {
  SARF_TAVSIFI,
  SARF_TURLARI,
  YAXLITLASHLAR,
  YAXLITLASH_NOMI,
  formuladanSarf,
  sarfFormulasi,
  type SarfTuri,
  type Yaxlitlash,
} from '@/lib/domain/sarf-turi';

export interface MaterialTanlovi {
  readonly id: number;
  readonly nom: string;
}

export interface SlotQatori {
  nom: string;
  formula: string;
  majburiy: boolean;
  almashtirishGuruhId: number | null;
  /** AUDIT 1-topilma — «nechta marta» (KV_M jami sarf uchun) */
  koeffitsient: number;
  /** AUDIT 1-topilma — kesish yo'nalishi */
  kesishTuri: 'ENIGA' | "BO'YIGA";
  /** Qat'iy kesim eni, metrda — bo'sh bo'lsa maydondan hisoblanadi */
  kesimEniM: string;
  /**
   * Mijoz narxini SHU slot belgilaydimi — egasi qarori 2026-09-22.
   *
   * ⚠️ Bir turda faqat BITTA slotda `true` bo'ladi (bazada qisman
   *    unique indeks, 0048). Ekranda ham radio bilan shunday.
   */
  narxBelgilaydi: boolean;
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

/**
 * TANLOV VARIANTI — «Chap», «127 mm», «Motorli» (0052).
 *
 * ⚠️ `qiymat` va `narx` IKKALASI ham ixtiyoriy: variant faqat yozuv
 *    bo'lishi mumkin, faqat narx qo'shishi mumkin, yoki formulaga
 *    son berishi mumkin.
 */
export interface VariantQatori {
  nom: string;
  qiymat: string;
  narx: string;
}

/** TANLOV — «Boshqaruv tomoni», «Lamel eni» (0052) */
export interface TanlovQatori {
  kod: string;
  nom: string;
  majburiy: boolean;
  variantlar: VariantQatori[];
}

/**
 * O'RNATISH TURI — oyna o'lchamidan tayyor o'lchamga o'tish (0053).
 *
 * ⚠️ Qo'shimchalar MATN bo'lib turadi: katak BO'SH bo'lishi
 *    kerak. `0` qo'yilsa egasi «nol yozilgan» bilan «hali
 *    yozilmagan» ni ajrata olmasdi.
 */
export interface OrnatishQatori {
  nom: string;
  eniQoshimchaM: string;
  boyiQoshimchaM: string;
  standartmi: boolean;
}

export interface MahsulotQiymatlari {
  readonly nom: string;
  readonly xizmatHaqi: string;
  /**
   * JISMONIY O'LCHAM CHEGARASI — egasi qarori 2026-09-22 (0051).
   * Bo'sh satr = chegara yo'q, tekshiruv o'tkazilmaydi.
   */
  readonly minEniM: string;
  readonly maksEniM: string;
  readonly minBoyiM: string;
  readonly maksBoyiM: string;
  readonly tartib: string;
  readonly oynadaKorinadi: boolean;
  readonly botdaKorinadi: boolean;
  readonly slotlar: readonly SlotQatori[];
  readonly parametrlar: readonly ParametrQatori[];
  readonly aksessuarlar: readonly AksessuarQatori[];
  /** 0052 — mahsulot turining tanlovlari */
  readonly tanlovlar: readonly TanlovQatori[];
  /** 0053 — oyna o'lchamidan tayyor o'lchamga o'tish qoidalari */
  readonly ornatishlar: readonly OrnatishQatori[];
}

export const BOSH_QIYMATLAR: MahsulotQiymatlari = {
  nom: '',
  xizmatHaqi: '',
  minEniM: '',
  maksEniM: '',
  minBoyiM: '',
  maksBoyiM: '',
  tartib: '0',
  oynadaKorinadi: true,
  botdaKorinadi: true,
  slotlar: [],
  tanlovlar: [],
  ornatishlar: [],
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
  /** Faqat `ENI_BOYI` — bo'yi koeffitsienti */
  sarfQiymat2: string;
  majburiy: boolean;
  /** AUDIT 1-topilma — faqat GURUH (mato sloti) uchun ishlatiladi */
  koeffitsient: number;
  kesishTuri: 'ENIGA' | "BO'YIGA";
  /**
   * Qat'iy kesim eni, metrda — bo'sh bo'lsa maydondan hisoblanadi.
   *
   * ⚠️ `TASMALI` sarfida bu AYNI PAYTDA tasma eni: bitta katak ikki
   *    joyga yoziladi (formulaga ham, kesim eniga ham). Ikki alohida
   *    katak bo'lsa ular bir-biridan farq qilib qolishi mumkin edi.
   */
  kesimEniM: string;
  /** `TASMALI` — tasma soni qanday yaxlitlanadi */
  yaxlitlash: Yaxlitlash;
  /** `TASMALI` — HAR TASMAGA qo'shiladigan zapas, metrda */
  zapasM: string;
  /** Egasi qarori 2026-09-22 — mijoz narxini shu slot belgilaydimi */
  narxBelgilaydi: boolean;
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
      sarfQiymat2: sarf.qiymat2,
      majburiy: s.majburiy,
      koeffitsient: s.koeffitsient,
      kesishTuri: s.kesishTuri,
      kesimEniM: sarf.tasmaEniM ?? s.kesimEniM,
      yaxlitlash: sarf.yaxlitlash ?? 'ROUND',
      zapasM: sarf.zapasM ?? '',
      narxBelgilaydi: s.narxBelgilaydi,
    };
  });

  const aksessuarlar: Qator[] = q.aksessuarlar.map((a) => {
    const sarf = formuladanSarf(a.formula);
    return {
      turi: 'MATERIAL',
      id: a.materialId,
      sarfTuri: sarf.turi,
      sarfQiymat: sarf.qiymat,
      sarfQiymat2: sarf.qiymat2,
      majburiy: a.majburiy,
      koeffitsient: 1,
      kesishTuri: 'ENIGA',
      kesimEniM: '',
      yaxlitlash: 'ROUND',
      zapasM: '',
      narxBelgilaydi: false,
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
/**
 * ⚠️ `TASMALI` sozlamalari QATORNING O'ZIDAN olinadi — pozitsion
 *    argument bo'lib uzatilmaydi. Beshta ketma-ket matn argumenti
 *    yozilganda ularning birini adashtirib qo'yish oson edi.
 */
function xavfsizFormula(q: {
  sarfTuri: SarfTuri;
  sarfQiymat: string;
  sarfQiymat2: string;
  kesimEniM: string;
  yaxlitlash: Yaxlitlash;
  zapasM: string;
}): string {
  try {
    return sarfFormulasi(q.sarfTuri, q.sarfQiymat, q.sarfQiymat2, {
      qadam: q.sarfQiymat,
      tasmaEniM: q.kesimEniM,
      yaxlitlash: q.yaxlitlash,
      qoshimchaSoni: q.sarfQiymat2,
      zapasM: q.zapasM,
    });
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
  rasmManzili,
}: {
  amal: (holat: KonstruktorHolati, forma: FormData) => Promise<KonstruktorHolati>;
  qiymatlar: MahsulotQiymatlari;
  guruhlar: readonly GuruhMalumoti[];
  materiallar: readonly MaterialTanlovi[];
  tugmaMatni: string;
  guruhQoshaOladi: boolean;
  /** §9.4 — server amali ham `material.yarat` ni tekshiradi */
  materialQoshaOladi: boolean;
  /** Katalog rasmi — sotuvda tur tanlanayotganda ko'rinadi (4.2) */
  rasmManzili?: string | null;
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

  /**
   * TANLOVLAR — 0052.
   *
   * ⚠️ Egasi to'rt marta bir xil savol berdi (zebra, dikkey
   *    ochilishi, motorli, burchak oyna) va har safar «ikki alohida
   *    tur qiling» degan javob oldi. Endi bitta turda tanlov bo'ladi.
   */
  const [tanlovlar, tanlovlarniOzgartir] = useState<readonly TanlovQatori[]>(
    qiymatlar.tanlovlar,
  );

  const tanlovniYangila = (i: number, yangi: Partial<TanlovQatori>): void => {
    tanlovlarniOzgartir((o) =>
      o.map((t, j) => (j === i ? { ...t, ...yangi } : t)),
    );
  };

  const variantniYangila = (
    ti: number,
    vi: number,
    yangi: Partial<VariantQatori>,
  ): void => {
    tanlovlarniOzgartir((o) =>
      o.map((t, j) =>
        j === ti
          ? { ...t, variantlar: t.variantlar.map((v, k) => (k === vi ? { ...v, ...yangi } : v)) }
          : t,
      ),
    );
  };

  /**
   * O'RNATISH TURLARI — 0053.
   *
   * ⚠️ Ro'yxat BO'SH bo'lsa tur avvalgidek ishlaydi: sotuvchi
   *    tayyor o'lchamni o'zi yozadi. Ya'ni bu bo'lim eski
   *    turlarning birortasini ham buzmaydi.
   */
  const [ornatishlar, ornatishlarniOzgartir] = useState<readonly OrnatishQatori[]>(
    qiymatlar.ornatishlar,
  );

  const ornatishniYangila = (i: number, yangi: Partial<OrnatishQatori>): void => {
    ornatishlarniOzgartir((o) => o.map((x, j) => (j === i ? { ...x, ...yangi } : x)));
  };

  /**
   * ⚠️ STANDART BITTA. Boshqasi belgilansa avvalgisi O'ZI
   *    yechiladi — bazada ham UNIQUE indeks bor va ikkitasi
   *    yuborilsa saqlash yiqilardi. Egasiga «avval eskisini
   *    yeching» deyish — uni tizimning ichki cheklovi bilan
   *    kurashtirish degani.
   */
  const standartniBelgila = (i: number): void => {
    ornatishlarniOzgartir((o) => o.map((x, j) => ({ ...x, standartmi: j === i })));
  };

  const [guruhModali, guruhModaliniOzgartir] = useState(false);
  const [materialModali, materialModaliniOzgartir] = useState(false);

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
      formula: xavfsizFormula(q),
      majburiy: q.majburiy,
      almashtirishGuruhId: q.id,
      koeffitsient: q.koeffitsient,
      kesishTuri: q.kesishTuri,
      kesimEniM: q.kesimEniM.trim(),
      narxBelgilaydi: q.narxBelgilaydi,
    }));

  const aksessuarlar: AksessuarQatori[] = qatorlar
    .filter((q) => q.turi === 'MATERIAL' && q.id !== null)
    .map((q) => ({
      materialId: q.id as number,
      formula: xavfsizFormula(q),
      majburiy: q.majburiy,
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form action={yubor} onKeyDown={enterYuborilmasin} className="flex flex-col gap-6">
        {/* Dinamik qatorlar JSON bo'lib yuboriladi — tartibi ham saqlanadi */}
        <input type="hidden" name="slotlar" value={JSON.stringify(slotlar)} />
        {/*
          ⚠️ TANLOVLAR — 0052. Bo'sh qiymatli variantlar `null` ga
             aylantiriladi: bo'sh satr bazadagi cheklovga tushmaydi.
        */}
        <input
          type="hidden"
          name="tanlovlar"
          value={JSON.stringify(
            tanlovlar.map((t) => ({
              kod: t.kod.trim(),
              nom: t.nom.trim(),
              majburiy: t.majburiy,
              variantlar: t.variantlar.map((v) => ({
                nom: v.nom.trim(),
                qiymat: v.qiymat.trim(),
                narx: v.narx.trim(),
                valyuta: 'SOM',
              })),
            })),
          )}
        />
        {/*
          ⚠️ O'RNATISH TURLARI — 0053. Bo'sh qatorlar (nomi
             yozilmagan) TASHLANADI: egasi qator qo'shib, to'ldirmay
             qoldirsa ham saqlash to'xtamasin.

          ⚠️ Bo'sh qo'shimcha `0` bo'lib ketadi — «shu o'lchovga
             tegmaydi» degani.
        */}
        <input
          type="hidden"
          name="ornatishlar"
          value={JSON.stringify(
            ornatishlar
              .filter((o) => o.nom.trim() !== '')
              .map((o) => ({
                nom: o.nom.trim(),
                eniQoshimchaM: o.eniQoshimchaM.trim() === '' ? 0 : o.eniQoshimchaM.trim(),
                boyiQoshimchaM: o.boyiQoshimchaM.trim() === '' ? 0 : o.boyiQoshimchaM.trim(),
                standartmi: o.standartmi,
              })),
          )}
        />
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
            <div className="sm:col-span-2">
              {/* TZ 4.2 — katalog rasmi, sotuvda tur yonida chiqadi */}
              <RasmYuklash
                nom="rasm"
                joriyManzil={rasmManzili ?? null}
                yorliq="Mahsulot rasmi"
              />
            </div>

            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-matn-ikki">Nomi</span>
              <input name="nom" defaultValue={qiymatlar.nom} required className={kirish} />
            </label>

            <label className="flex flex-col gap-1">
              {/*
                ⚠️ VALYUTA aytiladi. Aytilmasa egasi dollar deb yozib
                   qo'yardi va xizmat haqi 12 ming barobar kichik
                   chiqardi — bu maydonda valyuta tanlovi yo'q,
                   u doim so'mda.
              */}
              <span className="text-sm font-medium text-matn-ikki">
                Xizmat haqi (so&apos;m)
              </span>
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
                ixtiyoriy — bo&apos;sh qolsa narxga qo&apos;shilmaydi. Har
                pozitsiyaga bir marta qo&apos;shiladi.
              </span>
            </label>

            {/*
              ⚠️ O'LCHAM CHEGARASI — egasi qarori 2026-09-22 (0051).

                 Ilgari chegara UMUMAN yo'q edi: sotuvchi 4 metrli
                 rulon parda yozsa ham tizim qabul qilardi. Muammo
                 ustaning oldida chiqardi — val o'z og'irligidan
                 egiladi — va o'shanda mato ham, karniz ham kesilgan,
                 usta bir kun ishlagan bo'lardi.

              ⚠️ BO'SH QOLDIRILSA tekshiruv o'tkazilmaydi. Egasi
                 raqamlarni ustasidan so'rab, turlarni bittalab
                 to'ldiradi. To'ldirilmagan tur avvalgidek ishlaydi.

              ⚠️ Chegaraning O'ZI o'tadi: «2.80» degani 2.80 m li
                 parda QILINADI degani.
            */}
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-matn-ikki">
                O&apos;lcham chegarasi
              </h3>
              <p className="mt-0.5 text-xs text-matn-kuchsiz">
                Mexanizm ko&apos;taradigan eng kichik va eng katta o&apos;lcham.
                Bo&apos;sh qoldirilsa tekshirilmaydi. Chegaradan chiqqan buyurtma
                sotuvda <b>qabul qilinmaydi</b>.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ['minEniM', "Eng kichik eni (m)", '0.30'],
                    ['maksEniM', 'Eng katta eni (m)', '2.80'],
                    ['minBoyiM', "Eng kichik bo'yi (m)", '0.30'],
                    ['maksBoyiM', "Eng katta bo'yi (m)", '3.00'],
                  ] as const
                ).map(([nom, yorliq, namuna]) => (
                  <label key={nom} className="flex flex-col gap-1">
                    <span className="text-[13px] text-matn-ikki">{yorliq}</span>
                    <input
                      name={nom}
                      defaultValue={qiymatlar[nom]}
                      inputMode="decimal"
                      placeholder={namuna}
                      className={kirish}
                    />
                  </label>
                ))}
              </div>
            </div>

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
          <h2 className="mb-1 text-sm font-semibold">Mahsulotlar</h2>
          <p className="mb-4 text-xs text-matn-kuchsiz">
            Shu mahsulotga nima ketishi. Guruh tanlansa — sotuvchi ichidan matoni tanlaydi; aniq
            material tanlansa — o&apos;zi qo&apos;shiladi.
          </p>

          {qatorlar.length === 0 ? (
            <p className="mb-3 text-sm text-matn-kuchsiz">Hali mahsulot qo&apos;shilmagan.</p>
          ) : (
            <div className="mb-3 flex flex-col gap-2">
              {qatorlar.map((q, i) => {
                const tavsif = SARF_TAVSIFI[q.sarfTuri];

                return (
                  <div key={i} className="rounded-maydon border border-chegara p-3">
                    <div
                      className={`grid gap-2 sm:items-center ${
                        tavsif.ikkiQiymat
                          ? 'sm:grid-cols-[1fr_150px_210px]'
                          : 'sm:grid-cols-[1fr_150px_110px]'
                      }`}
                    >
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
                        <optgroup label="Aniq mahsulot">
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

                      {tavsif.tasmali === true ? (
                        /*
                          ⚠️ TASMALI — lamel, vertikal, to'lqinsimon parda
                             (egasi holati 2026-09-22).

                             To'rtta narsa so'raladi, chunki to'rtalasi ham
                             BOSHQA-BOSHQA son:

                               qadam      — bitta tasma oynada qancha joy
                                            egallaydi (0.11 m)
                               tasma eni  — rulondan qancha enli tortiladi
                                            (0.40 m)
                               yaxlitlash — 18.02 ta tasma nechta bo'ladi
                               qo'shimcha — markazdan ochilganda bitta kam
                                            yoki ko'p

                             Hech biri kodda emas: hammasi shu kataklardan
                             keladi va formula matniga aylanadi.

                          ⚠️ «Tasma eni» katagi IKKI joyga yoziladi —
                             formulaga ham, «qat'iy kesim eni» ustuniga ham.
                             Ikki alohida katak bo'lsa ular bir-biridan farq
                             qilib qolardi va ombor noto'g'ri yechardi.
                        */
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                          <label className="flex min-w-0 items-center gap-1">
                            <span className="shrink-0 text-[11px] text-matn-kuchsiz">
                              qadam
                            </span>
                            <input
                              value={q.sarfQiymat}
                              onChange={(e) => {
                                yangila(i, { sarfQiymat: e.target.value });
                              }}
                              inputMode="decimal"
                              placeholder="0.11"
                              aria-label="Bitta tasma egallaydigan joy, metrda"
                              title="Bitta tasma oynada qancha joy egallaydi, metrda (11 sm → 0.11)"
                              className={`${kichik} min-w-0`}
                            />
                          </label>
                          <label className="flex min-w-0 items-center gap-1">
                            <span className="shrink-0 text-[11px] text-matn-kuchsiz">
                              tasma
                            </span>
                            <input
                              value={q.kesimEniM}
                              onChange={(e) => {
                                yangila(i, { kesimEniM: e.target.value });
                              }}
                              inputMode="decimal"
                              placeholder="0.40"
                              aria-label="Tasma eni, metrda"
                              title="Rulondan qancha enli tasma tortiladi, metrda (40 sm → 0.40)"
                              className={`${kichik} min-w-0`}
                            />
                          </label>
                          <select
                            value={q.yaxlitlash}
                            onChange={(e) => {
                              yangila(i, { yaxlitlash: e.target.value as Yaxlitlash });
                            }}
                            aria-label="Tasma soni yaxlitlanishi"
                            title="18.02 ta tasma nechta bo'ladi"
                            className={kichik}
                          >
                            {YAXLITLASHLAR.map((y) => (
                              <option key={y} value={y}>
                                {YAXLITLASH_NOMI[y]}
                              </option>
                            ))}
                          </select>
                          <label className="flex min-w-0 items-center gap-1">
                            <span className="shrink-0 text-[11px] text-matn-kuchsiz">
                              soniga
                            </span>
                            <input
                              value={q.sarfQiymat2}
                              onChange={(e) => {
                                yangila(i, { sarfQiymat2: e.target.value });
                              }}
                              inputMode="numeric"
                              placeholder="0"
                              aria-label="Soniga qo'shimcha"
                              title="Markazdan ochilganda bitta kam bo'lsa: -1"
                              className={`${kichik} min-w-0`}
                            />
                          </label>
                          {/*
                            ⚠️ ZAPAS — egasi qarori 2026-09-22:
                               «har tasmaga alohida».

                               Buklama, qiyshiq kesish ehtimoli va
                               o'lchov xatosi uchun qo'shiladigan
                               zaxira. HAR TASMAGA qo'shiladi, ya'ni
                               18 ta tasmada 10 sm 1.80 m mato beradi.

                               Bo'sh qoldirilsa zapas yo'q.
                          */}
                          <label className="flex min-w-0 items-center gap-1">
                            <span className="shrink-0 text-[11px] text-matn-kuchsiz">
                              zapas
                            </span>
                            <input
                              value={q.zapasM}
                              onChange={(e) => {
                                yangila(i, { zapasM: e.target.value });
                              }}
                              inputMode="decimal"
                              placeholder="0.10"
                              aria-label="Har tasmaga qo'shiladigan zapas, metrda"
                              title="Har tasmaga qo'shiladi: 10 sm → 0.10. Bo'sh — zapas yo'q"
                              className={`${kichik} min-w-0`}
                            />
                          </label>
                        </div>
                      ) : tavsif.ikkiQiymat ? (
                        /*
                          ⚠️ IKKI KATAK, bitta emas. Eniga ketadigan miqdor va
                             bo'yiga ketadigan miqdor BOSHQA-BOSHQA bo'ladi:
                             plisse ramkasida yuqori-pastki profil 2 marta eni,
                             yon profil esa 2 marta bo'yi. Bitta son bilan buni
                             yozib bo'lmaydi.
                        */
                        <div className="flex items-center gap-1.5">
                          <label className="flex min-w-0 flex-1 items-center gap-1">
                            <span className="shrink-0 text-[11px] text-matn-kuchsiz">
                              eni ×
                            </span>
                            <input
                              value={q.sarfQiymat}
                              onChange={(e) => {
                                yangila(i, { sarfQiymat: e.target.value });
                              }}
                              inputMode="decimal"
                              placeholder="2"
                              aria-label="Eniga koeffitsient"
                              className={`${kichik} min-w-0`}
                            />
                          </label>
                          <label className="flex min-w-0 flex-1 items-center gap-1">
                            <span className="shrink-0 text-[11px] text-matn-kuchsiz">
                              {"bo'yi ×"}
                            </span>
                            <input
                              value={q.sarfQiymat2}
                              onChange={(e) => {
                                yangila(i, { sarfQiymat2: e.target.value });
                              }}
                              inputMode="decimal"
                              placeholder="2"
                              aria-label="Bo'yiga koeffitsient"
                              className={`${kichik} min-w-0`}
                            />
                          </label>
                        </div>
                      ) : (
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
                      )}
                    </div>

                    {/*
                      ⚠️ Natijaviy formula DARHOL ko'rsatiladi. Admin
                         «qo'shiladimi yoki ko'paytiriladimi» deb
                         o'ylab qolmasin — ko'rib tursin.
                    */}
                    {/*
                      ⚠️ TASMALI formulasi DARHOL ko'rinadi — admin
                         «qadam» va «tasma» qanday birikishini ko'rib
                         tursin. O'lchamlar METRDA: 11 sm → 0.11.
                    */}
                    {tavsif.tasmali === true && (
                      <p className="mt-2 text-[11px] text-matn-kuchsiz">
                        Formula:{' '}
                        <code className="font-mono">
                          {xavfsizFormula(q) || "— kataklarni to'ldiring —"}
                        </code>
                        <span className="mt-0.5 block">
                          O&apos;lchamlar <b>metrda</b>: 11 sm → <code>0.11</code>,
                          40 sm → <code>0.40</code>. Ombordan{' '}
                          <b>{q.kesimEniM.trim() === '' ? '?' : q.kesimEniM} m</b> enli
                          tasma tortiladi.
                          {q.zapasM.trim() !== '' && (
                            <> Zapas <b>har tasmaga</b> qo&apos;shiladi.</>
                          )}
                        </span>
                      </p>
                    )}

                    {tavsif.ikkiQiymat && (
                      <p className="mt-2 text-[11px] text-matn-kuchsiz">
                        Formula:{' '}
                        <code className="font-mono">
                          ENI × {q.sarfQiymat === '' ? '?' : q.sarfQiymat} + BO&apos;YI ×{' '}
                          {q.sarfQiymat2 === '' ? '?' : q.sarfQiymat2}
                        </code>{' '}
                        — ikkalasi <b>qo&apos;shiladi</b>. Ramka profili uchun:
                        eniga <b>2</b> (yuqori + pastki), bo&apos;yiga <b>2</b> (ikki yon).
                      </p>
                    )}

                    {/*
                      ⚠️ «Murakkab» tanlansa katak butun qatorni egallaydi —
                         formula uzun bo'ladi va tor katakda o'qib bo'lmaydi.
                    */}
                    {!tavsif.raqamli && (
                      <p className="mt-2 text-[11px] text-matn-kuchsiz">
                        Ishlatiladi: <code>ENI</code>, <code>BO&apos;YI</code>,{' '}
                        <code>MAYDON</code>, <code>SONI</code>. Amallar:{' '}
                        <code>+ − × /</code> va qavslar. O&apos;lchamlar{' '}
                        <b>metrda</b>, maydon <b>kv.m</b> da.
                      </p>
                    )}

                    {q.turi === 'GURUH' && (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                          <span>Koeffitsient</span>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            value={q.koeffitsient}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v) && v > 0) {
                                yangila(i, { koeffitsient: v });
                              }
                            }}
                            aria-label="Sarf koeffitsienti"
                            className={`${kichik} w-16`}
                          />
                          <span className="text-[11px] text-matn-kuchsiz">marta</span>
                        </label>
                        {/*
                          ⚠️ TASMALI da kesish YO'NALISHI ma'nosiz: kesim
                             eni qat'iy bo'lgani uchun `kesimOlchami`
                             yo'nalishni baribir e'tiborga olmaydi. Ko'rinib
                             tursa admin uni sozlayotgandek his qilardi.
                        */}
                        {tavsif.tasmali !== true && (
                        <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                          <span>Kesish</span>
                          <select
                            value={q.kesishTuri}
                            onChange={(e) => {
                              yangila(i, {
                                kesishTuri: e.target.value as 'ENIGA' | "BO'YIGA",
                              });
                            }}
                            aria-label="Kesish yo'nalishi"
                            className={kichik}
                          >
                            <option value="ENIGA">Eniga (keng rulon)</option>
                            <option value="BO'YIGA">Bo'yiga (bo'y × K)</option>
                          </select>
                        </label>
                        )}
                        {/*
                          ⚠️ QAT'IY KESIM ENI — egasi holati 2026-09-20
                             («dikkey»).

                             Ba'zi materialning eni O'ZGARMAYDI: vertikal
                             jalyuzi lameli rulonda 0.40 m enli keladi va
                             usta uni ENIGA kesa OLMAYDI — faqat bo'yiga
                             qirqadi.

                             To'ldirilsa, hisob TESKARI ketadi: eni shu
                             bo'ladi, bo'yi maydondan chiqadi. 8 kv.m
                             «4.00 × 2.00» emas, «0.40 × 20.00» bo'ladi —
                             chunki 4 metr enli lamel rulonini hech kim
                             ishlab chiqarmaydi.
                        */}
                        {/*
                          ⚠️ TASMALI da bu katak YUQORIDA «tasma» deb
                             so'ralgan va AYNI qiymatga bog'langan. Ikki
                             marta ko'rsatilsa admin ularni boshqa-boshqa
                             narsa deb o'ylardi.
                        */}
                        {tavsif.tasmali !== true && (
                        <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                          <span>Kesim eni</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="—"
                            value={q.kesimEniM}
                            onChange={(e) => {
                              yangila(i, { kesimEniM: e.target.value });
                            }}
                            aria-label="Qat'iy kesim eni, metrda"
                            className={`${kichik} w-20`}
                          />
                          <span className="text-[11px] text-matn-kuchsiz">m</span>
                        </label>
                        )}
                        <span className="text-[11px] text-matn-kuchsiz">
                          {q.kesimEniM.trim() !== ''
                            ? `eni doim ${q.kesimEniM} m, bo'yi maydondan chiqadi`
                            : q.koeffitsient === 1
                              ? '— oddiy sarf'
                              : q.kesishTuri === "BO'YIGA"
                                ? `bo'y × ${String(q.koeffitsient)} (masalan 1.8 × 4.4)`
                                : `en × ${String(q.koeffitsient)} (masalan 3.6 × 2.2)`}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-matn-kuchsiz">{tavsif.izoh}</span>

                      <div className="flex items-center gap-3">
                        {/*
                          ⚠️ TZ 4.6 — bu belgi SOTUVDA ishlaydi:
                             belgilangani savatga O'ZI qo'shiladi,
                             belgilanmagani esa faqat mijoz
                             so'raganda. Shuning uchun yorliq
                             «majburiy» emas, natijani aytadi.
                        */}
                        <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                          <input
                            type="checkbox"
                            checked={q.majburiy}
                            onChange={(e) => {
                              yangila(i, { majburiy: e.target.checked });
                            }}
                            className="size-3.5"
                          />
                          {q.majburiy ? "doim qo'shiladi" : "mijoz so'rasa"}
                        </label>

                        {/*
                          ⚠️ EGASI QARORI 2026-09-22 — «men slotda belgilayman».

                             Mijoz narxi mato DARAJASIDAN keladi. Kun-tunda
                             ikkita mato bo'ladi va qaysi biri narxni
                             belgilashini ilgari KOD TAXMIN QILARDI
                             («birinchi mato»). Endi egasi aytadi.

                             ⚠️ CHECKBOX, radio emas — garchi faqat bitta
                                slot belgilansa ham (bazada qisman unique
                                indeks, 0048). Radioni bir marta bosgandan
                                keyin BEKOR QILIB BO'LMAYDI: egasi fikridan
                                qaytsa, eski xulqqa qaytish yo'li yopilardi.
                                Bittalik shart quyidagi funksiyada.

                             Faqat GURUH qatorida ko'rinadi: aniq material
                             (aksessuar) mijoz tanlovi emas, uning darajasi
                             narx uchun ma'noga ega emas.
                        */}
                        {q.turi === 'GURUH' && (
                          <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                            <input
                              type="checkbox"
                              checked={q.narxBelgilaydi}
                              onChange={(e) => {
                                const yoqildi = e.target.checked;
                                setQatorlar(
                                  qatorlar.map((x, j) => ({
                                    ...x,
                                    // Yoqilsa boshqalari o'chadi, o'chirilsa hech biri qolmaydi
                                    narxBelgilaydi: yoqildi && j === i,
                                  })),
                                );
                              }}
                              className="size-3.5"
                            />
                            narxni belgilaydi
                          </label>
                        )}

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
                  sarfQiymat2: '',
                  majburiy: true,
                  koeffitsient: 1,
                  kesishTuri: 'ENIGA',
                  kesimEniM: '',
                  yaxlitlash: 'ROUND',
                  zapasM: '',
                  narxBelgilaydi: false,
                },
              ]);
            }}
            className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fon"
          >
            + Qo&apos;shimcha material
          </button>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {guruhQoshaOladi && (
              <button
                type="button"
                onClick={() => {
                  guruhModaliniOzgartir(true);
                }}
                className="fokus rounded-maydon px-1 py-0.5 text-[11px] font-medium text-brend transition-colors hover:underline"
              >
                + Yangi guruh
              </button>
            )}

            {materialQoshaOladi && (
              <button
                type="button"
                onClick={() => {
                  materialModaliniOzgartir(true);
                }}
                className="fokus rounded-maydon px-1 py-0.5 text-[11px] font-medium text-brend transition-colors hover:underline"
              >
                + Yangi material
              </button>
            )}

            {/*
              ⚠️ Ro'yxatni boshqarish — ko'rish, tahrirlash,
                 o'chirish. Yangi oynada, chunki mahsulot turi
                 yarim to'ldirilgan bo'lishi mumkin.
            */}
            <a
              href="/guruh"
              target="_blank"
              rel="noopener"
              className="fokus rounded-maydon px-1 py-0.5 text-[11px] text-matn-kuchsiz transition-colors hover:text-matn hover:underline"
            >
              Guruhlar ↗
            </a>
            <a
              href="/material"
              target="_blank"
              rel="noopener"
              className="fokus rounded-maydon px-1 py-0.5 text-[11px] text-matn-kuchsiz transition-colors hover:text-matn hover:underline"
            >
              Materiallar ↗
            </a>
          </div>

          <Modal
            ochiq={guruhModali}
            yop={() => {
              guruhModaliniOzgartir(false);
            }}
            sarlavha="Yangi guruh"
            bolalar={
              <GuruhFormasi
                saqlandi={(y) => {
                  /**
                   * ⚠️ Yangi guruhda hali material yo'q — shuning
                   *    uchun birlik `KV_M` (serverdagi bilan bir xil
                   *    standart) va narx namunasi yo'q. Kalkulyator
                   *    uni narxsiz ko'rsatadi: bu to'g'ri, chunki
                   *    narx haqiqatan hali yo'q.
                   */
                  setGuruhRoyxati((r) => [
                    ...r,
                    {
                      id: y.id,
                      nom: y.nom,
                      sarflashBirligi: 'KV_M',
                      namunaNarx: null,
                      namunaNom: null,
                    },
                  ]);
                  guruhModaliniOzgartir(false);
                }}
                bekor={() => {
                  guruhModaliniOzgartir(false);
                }}
              />
            }
          />

          <Modal
            ochiq={materialModali}
            yop={() => {
              materialModaliniOzgartir(false);
            }}
            sarlavha="Yangi mahsulot"
            keng
            bolalar={
              <MaterialFormasi
                amal={materialModalYaratAmali}
                qiymatlar={MATERIAL_BOSH_QIYMATLAR}
                guruhlar={guruhRoyxati}
                guruhQoshaOladi={false}
                joriyKurs=""
                oxirgiKelish={null}
                tugmaMatni="Saqlash"
                saqlandi={(y) => {
                  setMaterialRoyxati((r) => [...r, y]);
                  materialModaliniOzgartir(false);
                }}
                bekor={() => {
                  materialModaliniOzgartir(false);
                }}
              />
            }
          />
        </section>

        {/*
          TANLOVLAR — 0052, egasi holatlari 2026-09-22.

          Tizim o'lchov va materialni modellashtira olardi, TANLOVNI
          esa yo'q: zanjir chapdanmi yoki o'ngdan, kasseta bormi,
          lamel 89 yoki 127 mm, bir tomonga yoki markazdan ochiladi,
          qo'lda yoki motorli.

          Egasi TO'RT MARTA bir xil savol berdi va har safar «ikki
          alohida tur qiling» degan javob oldi.

          UCH DARAJA, har biri ixtiyoriy:
            kod bo'sh + narx bo'sh  → faqat yozuv, ustaga boradi
            narx to'ldirilgan       → narxga qo'shadi
            kod to'ldirilgan        → formulaga son beradi
        */}
        {/*
          ─── O'RNATISH TURI — 0053 ──────────────────────────

          Zamerchi OYNANI o'lchaydi, tizim esa TAYYOR jalyuzi
          o'lchamini kutadi. Bu ikkisi hech qachon teng emas va
          farqni shu paytgacha sotuvchi boshida hisoblardi —
          jalyuzi biznesida peredelkaning birinchi sababi.

          ⚠️ Ro'yxat BO'SH qoldirilsa tur avvalgidek ishlaydi.
             Ya'ni bu bo'lim birorta eski turni buzmaydi.
        */}
        <section className="rounded-karta border border-chegara bg-sirt p-5">
          <h2 className="mb-1 text-sm font-semibold">O&apos;rnatish turi</h2>
          <p className="mb-4 text-xs text-matn-kuchsiz">
            Sotuvchi <b>oyna</b> o&apos;lchamini yozadi, tizim{' '}
            <b>tayyor jalyuzi</b> o&apos;lchamini o&apos;zi chiqaradi. Devorga
            o&apos;rnatishda o&apos;lcham kattalashadi, proyomga
            o&apos;rnatishda kichrayadi — shuning uchun qo&apos;shimcha{' '}
            <b>manfiy</b> ham bo&apos;ladi. Bo&apos;sh qoldirilsa sotuvchi
            tayyor o&apos;lchamni o&apos;zi yozadi.
          </p>

          {ornatishlar.length === 0 ? (
            <p className="mb-3 text-sm text-matn-kuchsiz">
              Hali qoida qo&apos;shilmagan.
            </p>
          ) : (
            <div className="mb-3 flex flex-col gap-2">
              <div className="hidden gap-2 px-1 text-[11px] uppercase tracking-wide text-matn-kuchsiz sm:grid sm:grid-cols-[1fr_120px_120px_90px_auto]">
                <span>Nomi</span>
                <span>Eniga (m)</span>
                <span>Bo&apos;yiga (m)</span>
                <span>Standart</span>
                <span />
              </div>

              {ornatishlar.map((o, i) => (
                <div
                  key={i}
                  className="grid gap-2 sm:grid-cols-[1fr_120px_120px_90px_auto] sm:items-center"
                >
                  <input
                    value={o.nom}
                    onChange={(e) => {
                      ornatishniYangila(i, { nom: e.target.value });
                    }}
                    placeholder="Oyna ustiga"
                    aria-label="O&apos;rnatish turining nomi"
                    className={kichik}
                  />
                  {/*
                    ⚠️ `inputMode="text"` — `decimal` EMAS. Telefonda
                       `decimal` klaviaturasida MINUS belgisi yo'q va
                       proyom qoidasini kiritib bo'lmasdi.
                  */}
                  <input
                    value={o.eniQoshimchaM}
                    onChange={(e) => {
                      ornatishniYangila(i, { eniQoshimchaM: e.target.value });
                    }}
                    placeholder="+0.10"
                    aria-label="Eniga qo&apos;shiladi, metr"
                    className={`${kichik} raqam`}
                  />
                  <input
                    value={o.boyiQoshimchaM}
                    onChange={(e) => {
                      ornatishniYangila(i, { boyiQoshimchaM: e.target.value });
                    }}
                    placeholder="+0.15"
                    aria-label="Bo&apos;yiga qo&apos;shiladi, metr"
                    className={`${kichik} raqam`}
                  />
                  {/*
                    ⚠️ RADIO, checkbox EMAS: standart BITTA bo'lishi
                       shart (bazada UNIQUE indeks). Checkbox bo'lsa
                       ikkitasini belgilab, saqlashda xato olardi.
                  */}
                  <label className="flex items-center gap-1.5 text-[13px] text-matn-ikki">
                    <input
                      type="radio"
                      name="ornatishStandart"
                      checked={o.standartmi}
                      onChange={() => {
                        standartniBelgila(i);
                      }}
                      className="size-4"
                    />
                    standart
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      ornatishlarniOzgartir((x) => x.filter((_, j) => j !== i));
                    }}
                    className="text-[13px] text-belgi-qizil hover:underline"
                  >
                    o&apos;chirish
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              ornatishlarniOzgartir((x) => [
                ...x,
                {
                  nom: '',
                  eniQoshimchaM: '',
                  boyiQoshimchaM: '',
                  /** Birinchi qator O'ZI standart bo'ladi — sotuv
                   *  ekrani bo'sh dropdown bilan ochilmasin */
                  standartmi: x.length === 0,
                },
              ]);
            }}
            className="text-sm text-brend hover:underline"
          >
            + O&apos;rnatish turi
          </button>

          {/*
            TAYYOR MISOLLAR — egasi raqamlarni ustasidan so'rab
            to'ldiradi, lekin bo'sh ekrandan boshlash qiyin.
          */}
          {ornatishlar.length === 0 && (
            <p className="mt-3 rounded-maydon bg-fon px-3 py-2 text-[12px] text-matn-ikki">
              Odatdagi qoidalar: <b>oyna ustiga</b> — eniga +0.10,
              bo&apos;yiga +0.15 · <b>proyomga</b> — eniga −0.01,
              bo&apos;yiga −0.01 · <b>poldan</b> — bo&apos;yiga −0.02.
              Aniq raqamlarni ustangiz aytadi.
            </p>
          )}
        </section>

        <section className="rounded-karta border border-chegara bg-sirt p-5">
          <h2 className="mb-1 text-sm font-semibold">Tanlovlar</h2>
          <p className="mb-4 text-xs text-matn-kuchsiz">
            Sotuvchi buyurtma berayotganda tanlaydigan narsalar: boshqaruv
            tomoni, kasseta, lamel eni. Tanlov <b>yozuv</b> bo&apos;lishi
            (ustaga boradi), <b>narx</b> qo&apos;shishi yoki{' '}
            <b>formulaga son berishi</b> mumkin.
          </p>

          {tanlovlar.length === 0 ? (
            <p className="mb-3 text-sm text-matn-kuchsiz">
              Hali tanlov qo&apos;shilmagan. Tanlovi yo&apos;q tur avvalgidek
              ishlayveradi.
            </p>
          ) : (
            <div className="mb-3 flex flex-col gap-3">
              {tanlovlar.map((t, ti) => (
                <div key={ti} className="rounded-maydon border border-chegara p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto_auto]">
                    <input
                      value={t.nom}
                      onChange={(e) => {
                        tanlovniYangila(ti, { nom: e.target.value });
                      }}
                      placeholder="Boshqaruv tomoni"
                      aria-label="Tanlov nomi"
                      className={kichik}
                    />
                    {/*
                      KOD faqat formulaga son beradigan tanlovga kerak.
                      Bo'sh qoldirilsa tanlov formulaga umuman bormaydi.

                      ENI, BO'YI, MAYDON, SONI — TAQIQLANGAN: bosib
                      ketilsa formula oynaning enini emas, tanlovning
                      sonini olardi.
                    */}
                    <input
                      value={t.kod}
                      onChange={(e) => {
                        tanlovniYangila(ti, { kod: e.target.value.toUpperCase() });
                      }}
                      placeholder="kod (ixtiyoriy)"
                      aria-label="Formula kodi"
                      title="Formulada ishlatiladi: LAMEL_ENI. Bo'sh — formulaga tegmaydi"
                      className={`${kichik} font-mono`}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-matn-ikki">
                      <input
                        type="checkbox"
                        checked={t.majburiy}
                        onChange={(e) => {
                          tanlovniYangila(ti, { majburiy: e.target.checked });
                        }}
                        className="size-3.5"
                      />
                      majburiy
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        tanlovlarniOzgartir(tanlovlar.filter((_, j) => j !== ti));
                      }}
                      aria-label="Tanlovni o'chirish"
                      className="fokus rounded-maydon px-1.5 text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="mt-2 flex flex-col gap-1.5 pl-3">
                    {t.variantlar.map((v, vi) => (
                      <div
                        key={vi}
                        className="grid gap-1.5 sm:grid-cols-[1fr_110px_130px_auto]"
                      >
                        <input
                          value={v.nom}
                          onChange={(e) => {
                            variantniYangila(ti, vi, { nom: e.target.value });
                          }}
                          placeholder="Chap"
                          aria-label="Variant nomi"
                          className={kichik}
                        />
                        <input
                          value={v.qiymat}
                          onChange={(e) => {
                            variantniYangila(ti, vi, { qiymat: e.target.value });
                          }}
                          inputMode="decimal"
                          placeholder="son"
                          aria-label="Formulaga beriladigan son"
                          title="Kod to'ldirilgan bo'lsa shu son formulaga tushadi"
                          className={kichik}
                        />
                        <input
                          value={v.narx}
                          onChange={(e) => {
                            variantniYangila(ti, vi, { narx: e.target.value });
                          }}
                          inputMode="decimal"
                          placeholder="narx (so'm)"
                          aria-label="Variant narxi"
                          className={kichik}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            tanlovniYangila(ti, {
                              variantlar: t.variantlar.filter((_, k) => k !== vi),
                            });
                          }}
                          aria-label="Variantni o'chirish"
                          className="fokus rounded-maydon px-1.5 text-matn-kuchsiz hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                        >
                          &times;
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        tanlovniYangila(ti, {
                          variantlar: [...t.variantlar, { nom: '', qiymat: '', narx: '' }],
                        });
                      }}
                      className="fokus self-start rounded-maydon px-1 py-0.5 text-[11px] font-medium text-brend transition-colors hover:underline"
                    >
                      + Variant
                    </button>
                  </div>

                  {/*
                    Nuqsonlar SAQLASHDAN OLDIN ko'rsatiladi: aks holda
                    sabab faqat birinchi mijoz oldida ma'lum bo'lardi.
                  */}
                  {tanlovNuqsonlari({
                    id: ti,
                    kod: t.kod.trim() === '' ? null : t.kod.trim(),
                    nom: t.nom.trim() === '' ? `${String(ti + 1)}-tanlov` : t.nom.trim(),
                    majburiy: t.majburiy,
                    variantlar: t.variantlar.map((v, vi) => ({
                      id: vi,
                      nom: v.nom,
                      qiymat: v.qiymat.trim() === '' ? null : Number(v.qiymat),
                      narx: v.narx.trim() === '' ? null : v.narx,
                    })),
                  }).map((x) => (
                    <p key={x} className="mt-1.5 text-[11px] text-belgi-qizil">
                      {x}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              tanlovlarniOzgartir([
                ...tanlovlar,
                {
                  kod: '',
                  nom: '',
                  majburiy: true,
                  /* Ikkita bo'sh variant bilan ochiladi — kamida ikkitasi shart */
                  variantlar: [
                    { nom: '', qiymat: '', narx: '' },
                    { nom: '', qiymat: '', narx: '' },
                  ],
                },
              ]);
            }}
            className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fon"
          >
            + Tanlov
          </button>
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
            koeffitsient: s.koeffitsient,
            /**
             * Kesish sozlamasi KALKULYATORGA ham beriladi (2026-09-23).
             *
             * ⚠️ Usiz kalkulyator faqat kv.m ko'rsatardi va egasi
             *    rulondan necha metr ketishini bilmasdi — dikkeyda
             *    8 kv.m degani 20 metr degani.
             */
            kesishTuri: s.kesishTuri,
            kesimEniM: s.kesimEniM,
          }))}
          parametrlar={parametrlar.map((p) => ({ kod: p.kod, qiymat: p.standartQiymat }))}
          guruhlar={guruhRoyxati}
          xizmatHaqi={xizmatHaqi}
        />
      </div>
    </div>
  );
}
