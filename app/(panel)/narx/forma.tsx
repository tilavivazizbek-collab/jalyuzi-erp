'use client';

/**
 * app/(panel)/narx/forma.tsx — «Narxlar va turlar» · TZ 3.8 · 6.2 · 20.9
 *
 * ⚠️ NEGA BU EKRAN BOR
 *
 *    Egasi (2026-09-20) eski modelni rad etdi: narx materiallardan
 *    yig'ilardi, endi u MAHSULOT TURI va MATO DARAJASI juftligiga
 *    qo'lda qo'yiladi, o'lcham bo'yicha bosqichli.
 *
 * ⚠️ TEKSHIRISH BO'LIMI — saqlashdan OLDIN.
 *
 *    Bosqich jadvalidagi xato jimgina o'tib ketadi va faqat mijoz
 *    oldida chiqadi. Shuning uchun pastda o'lcham kiritiladi va narx
 *    darhol ko'rinadi: bo'shliq, chegarada narx tushishi va yakuniy
 *    summa — hammasi saqlashdan oldin ekranda.
 */

import { useActionState, useMemo, useState } from 'react';
import {
  bosqichlarniTekshir,
  chegaradaNarxTushadimi,
  pozitsiyaQoidaNarxi,
  type Bosqich,
  type HisoblashUsuli,
  type QoshimchaUsuli,
} from '@/lib/domain/narx-qoidasi';
import { kopaytir, kurs as kursYasa, pulKorsat, som } from '@/lib/domain/pul';
import { biznesXatosimi } from '@/lib/xato';
import { Tanlagich } from '../tanlagich';
import { Modal } from '../modal';
import { NarxGuruhFormasi } from './guruh-forma';
import { BOSH_HOLAT, type NarxHolati } from './holat';
import { narxSaqlaAmali } from './amal';
import { turNarxlariniNusxalaAmali } from './amal';
import type {
  NarxGuruhQatori,
  QoidaQatori,
  QoshimchaQatori,
  TanlovQatori,
} from './malumot';

const kirish =
  'w-full rounded-maydon border border-chegara-quyuq px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brend/25';
const kichik = `${kirish} py-1.5`;

const USULLAR: readonly { readonly kod: HisoblashUsuli; readonly nom: string }[] = [
  { kod: 'MAYDON', nom: "Maydondan (eni × bo'yi)" },
  { kod: 'ENI', nom: 'Eni bo‘yicha' },
  { kod: "BO'YI", nom: 'Bo‘yi bo‘yicha' },
  { kod: 'DONA', nom: 'Har donaga' },
];

/**
 * ⚠️ `MIQDOR` FAQAT «Materialni o'zi sotish» da ko'rinadi — egasi
 *    qarori 2026-09-22 («ko'p olganga arzonroq»).
 *
 *    Tayyor jalyuzida u ma'nosiz bo'lardi: u yerda narx o'lchamdan
 *    hisoblanadi va soni allaqachon oxirida ko'paytiriladi. Ro'yxatga
 *    qo'shilsa, kimdir uni tanlab qo'yib, katta jalyuzi kichigidan
 *    arzon ketib qolardi.
 */
const MATERIAL_USULLARI: readonly {
  readonly kod: HisoblashUsuli;
  readonly nom: string;
}[] = [...USULLAR, { kod: 'MIQDOR', nom: 'Miqdordan (necha metr / dona)' }];

const QOSHIMCHA_USULLARI: readonly { readonly kod: QoshimchaUsuli; readonly nom: string }[] = [
  { kod: 'QATIY', nom: "Qat'iy summa" },
  { kod: 'ENI', nom: 'Eni bo‘yicha' },
  { kod: "BO'YI", nom: 'Bo‘yi bo‘yicha' },
  { kod: 'MAYDON', nom: 'Maydondan' },
];

/** Bosqich birliklari usulga qarab o'zgaradi — jadval sarlavhasida ko'rinadi */
function birlikNomi(usuli: string): string {
  if (usuli === 'MAYDON') return 'kv.m';
  if (usuli === 'DONA') return 'dona';
  /**
   * ⚠️ `MIQDOR` da birlik MATERIALGA bog'liq: karnizda metr,
   *    mexanizmda dona. Bitta so'z bilan ikkalasini ham to'g'ri
   *    atab bo'lmaydi, shuning uchun «metr / dona» deyiladi —
   *    yolg'on yorliqdan ko'ra ochiq noaniqlik yaxshi.
   */
  if (usuli === 'MIQDOR') return 'metr / dona';
  return 'metr';
}

interface BosqichHolati {
  dan: string;
  gacha: string;
  narx: string;
  valyuta: 'SOM' | 'USD';
}

interface QoidaHolati {
  /**
   * Barqaror React kaliti — 2026-09-21.
   *
   * ⚠️ Ilgari kalit `narxGuruhId` edi va shu sababli BIR DARAJAGA
   *    BIR QATOR cheklovi tug'ilgan edi: ikki qator bir xil kalit
   *    olsa React ro'yxatni buzadi. Natijada mijoz turi va filial
   *    dropdownlari EKRANDA BOR, lekin ulardan foydalanib bo'lmasdi
   *    — TZ 6.2 va 20.9 yarim qurilgan holda qolgan edi.
   */
  kalit: number;
  narxGuruhId: number;
  narxGuruhNomi: string;
  mijozTuriId: number | null;
  filialId: number | null;
  hisoblashUsuli: HisoblashUsuli;
  bosqichlar: BosqichHolati[];
}

interface QoshimchaHolati {
  nom: string;
  hisoblashUsuli: QoshimchaUsuli;
  narx: string;
  valyuta: 'SOM' | 'USD';
  materialId: number | null;
  almashtirishGuruhId: number | null;
  formula: string;
}

const son = (x: string): number | null => {
  const t = x.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/** Ekrandagi qatorni domen turiga aylantiradi — hisoblash uchun */
function domenBosqichlari(b: readonly BosqichHolati[]): Bosqich[] {
  return b.map((x) => ({
    dan: son(x.dan) ?? 0,
    gacha: son(x.gacha),
    narx: x.narx.trim() === '' ? '0' : x.narx.trim(),
    valyuta: x.valyuta,
  }));
}

export function NarxFormasi({
  turId,
  turNomi,
  guruhlar: boshGuruhlar,
  qoidalar: boshQoidalar,
  qoshimchalar: boshQoshimchalar,
  materiallar,
  almashtirishGuruhlari,
  mijozTurlari,
  filiallar,
  kursQiymati,
  ozgartiraOladi,
  nusxaTurlari,
}: {
  /** ⚠️ `null` — «materialni o'zi sotish», mahsulot turi yo'q */
  turId: number | null;
  turNomi: string;
  guruhlar: readonly NarxGuruhQatori[];
  qoidalar: readonly QoidaQatori[];
  qoshimchalar: readonly QoshimchaQatori[];
  materiallar: readonly TanlovQatori[];
  almashtirishGuruhlari: readonly TanlovQatori[];
  mijozTurlari: readonly TanlovQatori[];
  filiallar: readonly TanlovQatori[];
  kursQiymati: string | null;
  ozgartiraOladi: boolean;
  /** Narxi bor boshqa turlar — jadvalni nusxalash uchun */
  nusxaTurlari: readonly { readonly id: number; readonly nom: string }[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState<NarxHolati, FormData>(
    narxSaqlaAmali,
    BOSH_HOLAT,
  );

  const [guruhlar, setGuruhlar] = useState<readonly NarxGuruhQatori[]>(boshGuruhlar);
  /** Yangi qatorga beriladigan kalit — hech qachon takrorlanmaydi */
  const [keyingiKalit, setKeyingiKalit] = useState(boshQoidalar.length + 1);
  const [guruhModali, setGuruhModali] = useState(false);
  const [nusxaXatosi, setNusxaXatosi] = useState<string | null>(null);
  const [nusxaKutilmoqda, setNusxaKutilmoqda] = useState(false);

  const [qoidalar, setQoidalar] = useState<QoidaHolati[]>(() =>
    boshQoidalar.map((q, i) => ({
      kalit: i + 1,
      narxGuruhId: q.narxGuruhId,
      narxGuruhNomi: q.narxGuruhNomi,
      mijozTuriId: q.mijozTuriId,
      filialId: q.filialId,
      hisoblashUsuli: q.hisoblashUsuli as HisoblashUsuli,
      bosqichlar: q.bosqichlar.map((b) => ({
        dan: b.dan,
        gacha: b.gacha ?? '',
        narx: b.narx,
        valyuta: b.valyuta === 'USD' ? 'USD' : 'SOM',
      })),
    })),
  );

  const [qoshimchalar, setQoshimchalar] = useState<QoshimchaHolati[]>(() =>
    boshQoshimchalar.map((q) => ({
      nom: q.nom,
      hisoblashUsuli: q.hisoblashUsuli as QoshimchaUsuli,
      narx: q.narx,
      valyuta: q.valyuta === 'USD' ? 'USD' : 'SOM',
      materialId: q.materialId,
      almashtirishGuruhId: q.almashtirishGuruhId,
      formula: q.formula ?? '',
    })),
  );

  // ─── Tekshirish kalkulyatori ────────────────────────────────────────────
  /**
   * ⚠️ METRDA — 2026-09-21 da tuzatildi. Bu yerda `'180'` va `'220'`
   *    turardi: metrga o'tishda (2026-09-20) tushib qolgan SANTIMETR
   *    qiymatlari, yonida esa «m» yozilgan edi.
   *
   *    Ya'ni xatoni USHLASH uchun qo'yilgan bo'limning o'zi
   *    180 m × 220 m = 39 600 kv.m hisoblab, eng yuqori bosqichdagi
   *    ulkan summani ko'rsatardi.
   */
  const [sinovEni, setSinovEni] = useState('2.10');
  const [sinovBoyi, setSinovBoyi] = useState('1.40');
  const [sinovGuruh, setSinovGuruh] = useState<number | null>(
    boshQoidalar[0]?.narxGuruhId ?? null,
  );
  /**
   * Kalkulyator MIJOZ TURI va FILIALNI ham hisobga oladi — 2026-09-21.
   *
   * ⚠️ Bir darajaga bir necha qator qo'shish mumkin bo'lgach,
   *    «optomchiga qancha chiqadi» degan savol paydo bo'ldi.
   *    Kalkulyator sotuv ekranidagi TANLASH TARTIBINI aynan
   *    takrorlaydi — aks holda tekshiruv yolg'on tinchlik berardi.
   */
  const [sinovMijoz, setSinovMijoz] = useState<number | null>(null);
  const [sinovFilial, setSinovFilial] = useState<number | null>(null);
  /** Soni — sotuvda bor va narx unga ko'payadi (T-12) */
  const [sinovSoni, setSinovSoni] = useState('1');
  const [tanlangan, setTanlangan] = useState<readonly number[]>([]);

  /**
   * ⚠️ Butun va musbat bo'lmasa 1 deb olinadi — sotuv ekranidagi
   *    bilan bir xil qoida. Tekshiruv to'xtamaydi, egasi raqamni
   *    tuzatgach o'zi yangilanadi.
   */
  const sinovSoniAdadi = (() => {
    const n = son(sinovSoni);
    return n !== null && Number.isInteger(n) && n > 0 ? n : 1;
  })();

  const kursObyekti = useMemo(
    () => (kursQiymati === null ? null : kursYasa(kursQiymati, new Date(), 'JORIY')),
    [kursQiymati],
  );

  const qoidaYangila = (i: number, o: Partial<QoidaHolati>): void => {
    setQoidalar((eski) => eski.map((q, j) => (i === j ? { ...q, ...o } : q)));
  };

  const bosqichYangila = (qi: number, bi: number, o: Partial<BosqichHolati>): void => {
    setQoidalar((eski) =>
      eski.map((q, j) =>
        qi === j
          ? { ...q, bosqichlar: q.bosqichlar.map((b, k) => (bi === k ? { ...b, ...o } : b)) }
          : q,
      ),
    );
  };

  /**
   * ⚠️ HAMMA DARAJA ro'yxatda turadi — 2026-09-21.
   *
   *    Ilgari bu yerda «hali ishlatilmagan darajalar» filtri turardi
   *    va shu sababli bir darajaga IKKINCHI qator qo'shib bo'lmasdi.
   *    Egasi «Oddiy» ga umumiy narx qo'ysa, optomchiga alohida narx
   *    qo'ya olmasdi; optomchiga qo'ysa esa oddiy mijozga narx
   *    UMUMAN qolmas va sotuv bloklanardi.
   *
   *    Endi bir daraja bir necha marta qo'shiladi, har biri o'z
   *    mijoz turi va filiali bilan. Aynan takrorlanishni quyidagi
   *    `takrorlar` ushlaydi.
   */
  const darajaQoshishRoyxati = guruhlar;

  /**
   * AYNAN BIR XIL qamrov ikki marta yozilganmi.
   *
   * ⚠️ Bazada `(tur, guruh, mijoz, filial)` noyob. Takror
   *    yuborilsa `ON CONFLICT ... DO UPDATE` ikkinchisini birinchisi
   *    ustiga yozib, JIMGINA bittasini yo'qotardi — egasi ikki xil
   *    narx kiritib, bittasi saqlanmaganini bilmay qolardi.
   */
  const takrorKaliti = (q: QoidaHolati): string =>
    `${String(q.narxGuruhId)}|${String(q.mijozTuriId ?? 0)}|${String(q.filialId ?? 0)}`;

  const takrorlar = useMemo(() => {
    const sanoq = new Map<string, number>();
    for (const q of qoidalar) {
      const k = takrorKaliti(q);
      sanoq.set(k, (sanoq.get(k) ?? 0) + 1);
    }
    return new Set([...sanoq].filter(([, n]) => n > 1).map(([k]) => k));
  }, [qoidalar]);

  // ─── Yuborishga tayyorlash ──────────────────────────────────────────────
  const yuk = {
    qoidalar: qoidalar.map((q) => ({
      narxGuruhId: q.narxGuruhId,
      mijozTuriId: q.mijozTuriId,
      filialId: q.filialId,
      hisoblashUsuli: q.hisoblashUsuli,
      bosqichlar: q.bosqichlar.map((b) => ({
        dan: son(b.dan) ?? 0,
        gacha: son(b.gacha),
        narx: b.narx.trim(),
        valyuta: b.valyuta,
      })),
    })),
    qoshimchalar: qoshimchalar.map((q) => ({
      nom: q.nom.trim(),
      hisoblashUsuli: q.hisoblashUsuli,
      narx: q.narx.trim(),
      valyuta: q.valyuta,
      materialId: q.materialId,
      almashtirishGuruhId: q.almashtirishGuruhId,
      formula: q.formula.trim() === '' ? null : q.formula.trim(),
    })),
  };

  // ─── Hisob natijasi ─────────────────────────────────────────────────────
  const natija = useMemo(() => {
    /**
     * ⚠️ SOTUV EKRANIDAGI TARTIB AYNAN TAKRORLANADI:
     *
     *      1. mijoz turi + filial        (eng aniq)
     *      2. mijoz turi + hamma filial
     *      3. hamma mijoz + filial
     *      4. hamma mijoz + hamma filial
     *
     *    TZ 6.2 — mijoz turi filialdan USTUN (egasi bilan kelishilgan
     *    2026-08-30). Agar bu yerda boshqa tartib bo'lsa, tekshiruv
     *    bir narxni ko'rsatib, sotuv boshqasini chiqarardi — bu
     *    tekshiruvning o'zidan ham yomonroq.
     */
    const mos = qoidalar.filter((x) => x.narxGuruhId === sinovGuruh);
    const q =
      mos.find((x) => x.mijozTuriId === sinovMijoz && x.filialId === sinovFilial) ??
      mos.find((x) => x.mijozTuriId === sinovMijoz && x.filialId === null) ??
      mos.find((x) => x.mijozTuriId === null && x.filialId === sinovFilial) ??
      mos.find((x) => x.mijozTuriId === null && x.filialId === null);

    if (q === undefined) {
      return {
        xato:
          qoidalar.length === 0
            ? "Avval yuqorida narx jadvalini to'ldiring"
            : mos.length === 0
              ? 'Yuqoridagi ro‘yxatdan darajani tanlang'
              : 'Bu daraja shu mijoz turi va filialga ochilmagan — sotuvda ham narx topilmaydi',
        hisob: null,
        usul: null,
      };
    }

    /**
     * ⚠️ `MIQDOR` da O'LCHAM SO'RALMAYDI — karniz va mexanizmda u
     *    umuman kiritilmaydi. Bosqich «Soni» katagiga qarab
     *    tanlanadi, ya'ni tekshiruv sotuv ekranidagi bilan bir xil
     *    ishlaydi (egasi qarori 2026-09-22).
     */
    const miqdorlimi = q.hisoblashUsuli === 'MIQDOR';

    const eni = miqdorlimi ? 0 : son(sinovEni);
    const boyi = miqdorlimi ? 0 : son(sinovBoyi);
    if (!miqdorlimi && (eni === null || boyi === null || eni <= 0 || boyi <= 0)) {
      return { xato: "O'lcham kiriting", hisob: null, usul: null };
    }

    try {
      const hisob = pozitsiyaQoidaNarxi({
        qoida: { hisoblashUsuli: q.hisoblashUsuli, bosqichlar: domenBosqichlari(q.bosqichlar) },
        eniM: eni ?? 0,
        boyiM: boyi ?? 0,
        miqdor: sinovSoniAdadi,
        qoshimchalar: qoshimchalar
          .filter((_, i) => tanlangan.includes(i))
          .map((x) => ({
            nom: x.nom,
            hisoblashUsuli: x.hisoblashUsuli,
            narx: x.narx.trim() === '' ? '0' : x.narx.trim(),
            valyuta: x.valyuta,
          })),
        offset: null,
        kurs: kursObyekti,
      });
      /**
       * USUL natijaga qo'shiladi — egasi so'rovi 2026-09-23:
       * «o'lchov ham kv.m da, ham eni va bo'yida ko'rinsin».
       *
       * ⚠️ Ilgari bu yerda yalang’och «2.9400» turardi: birligi
       *    ham, qayerdan chiqqani ham yozilmagan. Maydonmi, metrmi,
       *    donami — egasi taxmin qilishi kerak edi va «ENI»
       *    qoidasida 2.10 ni maydon deb o'qib ketish oson edi.
       */
      return { xato: null, hisob, usul: q.hisoblashUsuli };
    } catch (x) {
      return {
        xato: biznesXatosimi(x) ? x.message : 'Hisoblab bo‘lmadi',
        hisob: null,
        usul: null,
      };
    }
  }, [
    qoidalar,
    qoshimchalar,
    sinovEni,
    sinovBoyi,
    sinovSoniAdadi,
    sinovGuruh,
    sinovMijoz,
    sinovFilial,
    tanlangan,
    kursObyekti,
  ]);

  /**
   * ⚠️ `MIQDOR` da soni NARXNING ICHIDA — u bosqichni tanlagan va
   *    narxga ko'paytirilgan. Pastda yana «Jami × 3» deb ko'rsatilsa
   *    raqam UCH BAROBAR ko'rinardi va egasi jadvalni noto'g'ri
   *    deb o'ylardi.
   */
  const soniAlohidami = (() => {
    const mos = qoidalar.filter((x) => x.narxGuruhId === sinovGuruh);
    const q =
      mos.find((x) => x.mijozTuriId === sinovMijoz && x.filialId === sinovFilial) ??
      mos.find((x) => x.mijozTuriId === sinovMijoz && x.filialId === null) ??
      mos.find((x) => x.mijozTuriId === null && x.filialId === sinovFilial) ??
      mos.find((x) => x.mijozTuriId === null && x.filialId === null);
    return q?.hisoblashUsuli !== 'MIQDOR';
  })();

  return (
    <form action={yubor} className="flex flex-col gap-5">
      <input type="hidden" name="mahsulotTurId" value={turId ?? ''} />
      <input type="hidden" name="qoidalar" value={JSON.stringify(yuk.qoidalar)} />
      <input type="hidden" name="qoshimchalar" value={JSON.stringify(yuk.qoshimchalar)} />

      {holat.xato !== null && (
        <div
          role="alert"
          className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil"
        >
          <p className="font-medium">{holat.xato}</p>
          {holat.nuqsonlar.length > 0 && (
            <ul className="mt-1.5 list-disc pl-5">
              {holat.nuqsonlar.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {holat.saqlandi && (
        <p className="rounded-maydon bg-belgi-yashil-fon px-3 py-2.5 text-sm text-belgi-yashil">
          Saqlandi — yangi narx endi sotuvda ishlaydi. Eski buyurtmalar o‘zgarmaydi.
        </p>
      )}

      {/* ─── Narx jadvali ─────────────────────────────────────────────── */}
      <section className="rounded-maydon border border-chegara p-4">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-matn">Narx jadvali</h2>
            <p className="mt-0.5 text-[12px] text-matn-ikki">
              {turNomi} — har narx darajasi uchun alohida
            </p>
          </div>
          {ozgartiraOladi && darajaQoshishRoyxati.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const g = guruhlar.find((x) => x.id === Number(e.target.value));
                if (g === undefined) return;
                setQoidalar((eski) => [
                  ...eski,
                  {
                    kalit: keyingiKalit,
                    narxGuruhId: g.id,
                    narxGuruhNomi: g.nom,
                    mijozTuriId: null,
                    filialId: null,
                    hisoblashUsuli: 'MAYDON',
                    bosqichlar: [{ dan: '0', gacha: '', narx: '', valyuta: 'SOM' }],
                  },
                ]);
                setKeyingiKalit((k) => k + 1);
              }}
              aria-label="Daraja qo‘shish"
              className={`${kichik} w-[210px]`}
            >
              <option value="">+ daraja qo‘shish</option>
              {/*
                ⚠️ MATO SONI YONIDA — 2026-09-21. Egasi «Oddiy» ga
                   narx qo'yib, matosi «Qimmat» darajada ekanini
                   bilmay qoldi. Endi ro'yxatning o'zi aytadi: bo'sh
                   darajaga narx qo'yish foydasiz.
              */}
              {darajaQoshishRoyxati.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                  {g.materialSoni === 0
                    ? ' — mato yo‘q'
                    : ` — ${String(g.materialSoni)} mato`}
                </option>
              ))}
            </select>
          )}
        </div>

        {qoidalar.length === 0 ? (
          /*
            ⚠️ BO'SH HOLAT NIMA QILISHNI AYTADI.
               Ilgari bu yerda bitta kulrang jumla turardi va «+ yangi
               mato darajasi» kichkina yozuv bo'lib pastda yashiringandi —
               egasi darajani qayerdan qo'shishni topolmadi (2026-09-20).
          */
          <div className="rounded-maydon border border-dashed border-chegara-quyuq px-4 py-6 text-center">
            {guruhlar.length === 0 ? (
              <>
                <p className="text-sm font-medium text-matn">
                  Avval narx darajasi kerak
                </p>
                <p className="mx-auto mt-1 max-w-md text-[13px] text-matn-ikki">
                  Narx jadvali darajalar bo‘yicha to‘ldiriladi: «Oddiy» matoga bir
                  narx, «Premium» ga boshqa narx. Bittasini yarating va shu yerga
                  qaytib narx qo‘yasiz.
                </p>
                {ozgartiraOladi && (
                  <button
                    type="button"
                    onClick={() => {
                      setGuruhModali(true);
                    }}
                    className="mt-4 rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
                  >
                    + Yangi daraja yaratish
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-matn">
                  Bu turga hali narx qo‘yilmagan
                </p>
                <p className="mx-auto mt-1 max-w-md text-[13px] text-matn-ikki">
                  Yuqoridagi <b>«+ daraja qo‘shish»</b> ro‘yxatidan narx darajasini
                  tanlang — shundan keyin bosqichlar jadvali ochiladi.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {qoidalar.map((q, qi) => {
              const domen = domenBosqichlari(q.bosqichlar);
              const nuqsonlar = bosqichlarniTekshir(domen);
              const tushish = chegaradaNarxTushadimi(
                { hisoblashUsuli: q.hisoblashUsuli, bosqichlar: domen },
                kursObyekti,
              );
              const birlik = birlikNomi(q.hisoblashUsuli);

              const takrormi = takrorlar.has(takrorKaliti(q));
              const matoSoni =
                guruhlar.find((g) => g.id === q.narxGuruhId)?.materialSoni ?? 0;

              /**
               * Qamrov SO'Z BILAN — 2026-09-21. Bir daraja endi bir
               * necha qatorga ega bo'lishi mumkin va ular faqat mijoz
               * turi / filial bilan farq qiladi. Dropdownlarga qarab
               * o'tirmasdan, sarlavhaning o'zi aytib tursin.
               */
              const kimga =
                q.mijozTuriId === null
                  ? 'hamma mijoz'
                  : (mijozTurlari.find((m) => m.id === q.mijozTuriId)?.nom ?? 'mijoz turi');
              const qayerda =
                q.filialId === null
                  ? 'hamma filial'
                  : (filiallar.find((f) => f.id === q.filialId)?.nom ?? 'filial');

              return (
                <div
                  key={q.kalit}
                  className={`rounded-maydon border p-3 ${
                    takrormi ? 'border-belgi-qizil bg-belgi-qizil-fon/30' : 'border-chegara'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-matn">{q.narxGuruhNomi}</span>
                    <span className="text-[11px] text-matn-kuchsiz">
                      {kimga} · {qayerda}
                    </span>
                    {matoSoni === 0 && (
                      <span
                        className="text-[11px] text-belgi-sariq"
                        title="Bu darajaga birorta mato biriktirilmagan — narx hech qachon ishlamaydi"
                      >
                        ⚠ mato yo‘q
                      </span>
                    )}

                    <select
                      value={q.hisoblashUsuli}
                      onChange={(e) => {
                        qoidaYangila(qi, { hisoblashUsuli: e.target.value as HisoblashUsuli });
                      }}
                      aria-label="Hisoblash usuli"
                      className={`${kichik} w-[210px]`}
                      disabled={!ozgartiraOladi}
                    >
                      {(turId === null ? MATERIAL_USULLARI : USULLAR).map((u) => (
                        <option key={u.kod} value={u.kod}>
                          {u.nom}
                        </option>
                      ))}
                    </select>

                    {/* TZ 6.2 · 20.9 — bo'sh qolsa hammaga tegishli */}
                    <select
                      value={q.mijozTuriId ?? ''}
                      onChange={(e) => {
                        qoidaYangila(qi, { mijozTuriId: son(e.target.value) });
                      }}
                      aria-label="Mijoz turi"
                      className={`${kichik} w-[150px]`}
                      disabled={!ozgartiraOladi}
                    >
                      <option value="">Hamma mijozga</option>
                      {mijozTurlari.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                        </option>
                      ))}
                    </select>

                    <select
                      value={q.filialId ?? ''}
                      onChange={(e) => {
                        qoidaYangila(qi, { filialId: son(e.target.value) });
                      }}
                      aria-label="Filial"
                      className={`${kichik} w-[150px]`}
                      disabled={!ozgartiraOladi}
                    >
                      <option value="">Hamma filialga</option>
                      {filiallar.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom}
                        </option>
                      ))}
                    </select>

                    {ozgartiraOladi && (
                      <button
                        type="button"
                        onClick={() => {
                          setQoidalar((eski) => eski.filter((_, j) => j !== qi));
                        }}
                        className="ml-auto text-[12px] text-belgi-qizil hover:underline"
                      >
                        Darajani olib tashlash
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_1fr_1.2fr_90px_32px] gap-2 text-[11px] text-matn-kuchsiz">
                    <span>dan ({birlik})</span>
                    <span>gacha ({birlik})</span>
                    <span>narx</span>
                    <span>valyuta</span>
                    <span />
                  </div>

                  {q.bosqichlar.map((b, bi) => (
                    <div
                      key={bi}
                      className="mt-1 grid grid-cols-[1fr_1fr_1.2fr_90px_32px] items-center gap-2"
                    >
                      <input
                        value={b.dan}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { dan: e.target.value });
                        }}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label="Bosqich boshi"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      />
                      <input
                        value={b.gacha}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { gacha: e.target.value });
                        }}
                        inputMode="decimal"
                        placeholder="cheksiz"
                        aria-label="Bosqich oxiri"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      />
                      <input
                        value={b.narx}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { narx: e.target.value });
                        }}
                        inputMode="decimal"
                        placeholder="8"
                        aria-label="Narx"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      />
                      <select
                        value={b.valyuta}
                        onChange={(e) => {
                          bosqichYangila(qi, bi, { valyuta: e.target.value as 'SOM' | 'USD' });
                        }}
                        aria-label="Valyuta"
                        className={kichik}
                        disabled={!ozgartiraOladi}
                      >
                        <option value="SOM">so‘m</option>
                        <option value="USD">$</option>
                      </select>
                      {ozgartiraOladi && (
                        <button
                          type="button"
                          onClick={() => {
                            setQoidalar((eski) =>
                              eski.map((x, j) =>
                                qi === j
                                  ? { ...x, bosqichlar: x.bosqichlar.filter((_, k) => k !== bi) }
                                  : x,
                              ),
                            );
                          }}
                          aria-label="Bosqichni o‘chirish"
                          className="text-matn-kuchsiz hover:text-belgi-qizil"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {ozgartiraOladi && (
                    <button
                      type="button"
                      onClick={() => {
                        setQoidalar((eski) =>
                          eski.map((x, j) =>
                            qi === j
                              ? {
                                  ...x,
                                  bosqichlar: [
                                    ...x.bosqichlar,
                                    { dan: '', gacha: '', narx: '', valyuta: 'SOM' },
                                  ],
                                }
                              : x,
                          ),
                        );
                      }}
                      className="mt-2 text-[12px] text-brend hover:underline"
                    >
                      + bosqich
                    </button>
                  )}

                  {/*
                    ⚠️ TAKROR — bazada `(tur, guruh, mijoz, filial)`
                       noyob. Takror yuborilsa ikkinchisi birinchisi
                       ustiga JIMGINA yozilardi va egasi ikki xil narx
                       kiritib, bittasi yo'qolganini bilmay qolardi.
                  */}
                  {takrormi && (
                    <p className="mt-2 text-[11px] font-medium text-belgi-qizil">
                      Bu qamrov ({kimga} · {qayerda}) ikki marta yozilgan — bittasini
                      o‘chiring yoki mijoz turi / filialini o‘zgartiring.
                    </p>
                  )}

                  {/* Saqlashdan OLDIN ko'rinadigan nuqsonlar */}
                  {nuqsonlar.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-[11px] text-belgi-qizil">
                      {nuqsonlar.map((n, i) => (
                        <li key={i}>
                          {n.tur === 'BOSQICH_YOQ' && 'Birorta bosqich kiritilmagan'}
                          {n.tur === 'BOSHLANISH' &&
                            `${String(n.dan)} ${birlik} dan kichigiga narx yo‘q`}
                          {n.tur === 'BOSHLIQ' &&
                            `${String(n.dan)}–${String(n.gacha)} ${birlik} oralig‘iga narx yo‘q`}
                          {n.tur === 'USTMA_UST' &&
                            `${String(n.dan)}–${String(n.gacha)} ${birlik} ikki marta yozilgan`}
                          {n.tur === 'CHEKSIZ_YOQ' &&
                            `${String(n.gacha)} ${birlik} dan kattasiga narx yo‘q — oxirgi bosqichning «gacha» sini bo‘sh qoldiring`}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/*
                    ⚠️ BLOKLAMAYDI — egasi bosqichlarni qo'lda kiritadi va
                       stavka pasayishi uning qarori bo'lishi mumkin.
                  */}
                  {tushish.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-[11px] text-belgi-sariq">
                      {tushish.map((t, i) => (
                        <li key={i}>
                          {String(t.chegara)} {birlik} chegarasida narx tushadi:{' '}
                          {pulKorsat(som(t.oldin))} → {pulKorsat(som(t.keyin))} so‘m. Ya‘ni
                          kattaroq mahsulot arzonroq chiqadi.
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-chegara pt-3">
          {/*
            ⚠️ BOSHQA TURDAN NUSXALASH — 2026-09-21.

               To'qqiz xil jalyuzi × bir necha daraja × bir necha
               bosqich: bir xil jadvalni qo'lda o'nlab marta
               to'ldirish kerak edi va bir joyda raqam adashsa, bu
               faqat mijoz oldida chiqardi.

            ⚠️ Nusxa MAVJUD QATORLAR USTIGA yozmaydi — ular
               yoniga qo'shiladi. Bir xil qamrov chiqsa `takrorlar`
               qizil bilan ko'rsatadi va saqlashni bloklaydi. Ya'ni
               nusxa hech qachon jimgina ma'lumot yo'qotmaydi.
          */}
          {ozgartiraOladi && nusxaTurlari.length > 0 && (
            <select
              value=""
              disabled={nusxaKutilmoqda}
              onChange={(e) => {
                const manba = Number(e.target.value);
                if (!Number.isFinite(manba) || manba <= 0) return;
                setNusxaXatosi(null);
                setNusxaKutilmoqda(true);
                void turNarxlariniNusxalaAmali(manba)
                  .then((j) => {
                    if (j.xato !== null) {
                      setNusxaXatosi(j.xato);
                      return;
                    }
                    if (j.qoidalar.length === 0) {
                      setNusxaXatosi('Bu turda narx qatori yo‘q');
                      return;
                    }
                    let k = keyingiKalit;
                    const yangilar = j.qoidalar.map((q) => {
                      k += 1;
                      return {
                        kalit: k,
                        narxGuruhId: q.narxGuruhId,
                        narxGuruhNomi: q.narxGuruhNomi,
                        mijozTuriId: q.mijozTuriId,
                        filialId: q.filialId,
                        hisoblashUsuli: q.hisoblashUsuli as HisoblashUsuli,
                        bosqichlar: q.bosqichlar.map((b) => ({
                          dan: b.dan,
                          gacha: b.gacha ?? '',
                          narx: b.narx,
                          valyuta: b.valyuta === 'USD' ? ('USD' as const) : ('SOM' as const),
                        })),
                      };
                    });
                    setQoidalar((eski) => [...eski, ...yangilar]);
                    setKeyingiKalit(k + 1);
                  })
                  .finally(() => {
                    setNusxaKutilmoqda(false);
                  });
              }}
              aria-label="Boshqa turdan nusxalash"
              className={`${kichik} w-[230px]`}
            >
              <option value="">
                {nusxaKutilmoqda ? 'nusxalanmoqda…' : '⤓ boshqa turdan nusxalash'}
              </option>
              {nusxaTurlari.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </select>
          )}

          {nusxaXatosi !== null && (
            <span className="text-[12px] text-belgi-qizil">{nusxaXatosi}</span>
          )}

          {ozgartiraOladi && (
            <button
              type="button"
              onClick={() => {
                setGuruhModali(true);
              }}
              className="rounded-maydon border border-chegara-quyuq bg-sirt px-3 py-1.5 text-[13px] font-medium text-matn transition-colors hover:border-brend hover:text-brend"
            >
              + Yangi narx darajasi
            </button>
          )}
          {/*
            ⚠️ Darajani TAHRIRLASH va O'CHIRISH shu yerda emas, alohida
               sahifada: bu ekran narx jadvaliga bag'ishlangan.
          */}
          <a href="/daraja" className="text-[12px] text-matn-kuchsiz hover:text-matn hover:underline">
            darajalarni boshqarish →
          </a>
        </div>
      </section>

      {/*
        ⚠️ Qo'shimcha FAQAT mahsulot turida bo'ladi. «Usti shabalik»
           tayyor pardaga qo'shiladi, matoning o'ziga emas —
           matoni metrlab sotganda qo'shimcha tushunchasi yo'q.
      */}
      {turId !== null && (
      <section className="rounded-maydon border border-chegara p-4">
        <h2 className="text-[15px] font-semibold text-matn">Qo‘shimchalar</h2>
        <p className="mt-0.5 mb-3 text-[12px] text-matn-ikki">
          Mijoz tanlashi mumkin bo‘lgan narsalar — «usti shabalik», «o‘rnatish».
          Material biriktirilsa ombordan ham yechiladi.
        </p>

        {qoshimchalar.length === 0 ? (
          <p className="text-sm text-matn-kuchsiz">Qo‘shimcha kiritilmagan.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {qoshimchalar.map((q, i) => {
              const yangila = (o: Partial<QoshimchaHolati>): void => {
                setQoshimchalar((eski) => eski.map((x, j) => (i === j ? { ...x, ...o } : x)));
              };
              const materialBor = q.materialId !== null || q.almashtirishGuruhId !== null;

              return (
                <div key={i} className="rounded-maydon border border-chegara p-3">
                  <div className="grid gap-2 sm:grid-cols-[1.4fr_150px_1fr_90px_32px] sm:items-center">
                    <input
                      value={q.nom}
                      onChange={(e) => {
                        yangila({ nom: e.target.value });
                      }}
                      placeholder="Usti shabalik"
                      aria-label="Qo‘shimcha nomi"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    />
                    <select
                      value={q.hisoblashUsuli}
                      onChange={(e) => {
                        yangila({ hisoblashUsuli: e.target.value as QoshimchaUsuli });
                      }}
                      aria-label="Qo‘shimcha usuli"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    >
                      {QOSHIMCHA_USULLARI.map((u) => (
                        <option key={u.kod} value={u.kod}>
                          {u.nom}
                        </option>
                      ))}
                    </select>
                    <input
                      value={q.narx}
                      onChange={(e) => {
                        yangila({ narx: e.target.value });
                      }}
                      inputMode="decimal"
                      placeholder="80000"
                      aria-label="Qo‘shimcha narxi"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    />
                    <select
                      value={q.valyuta}
                      onChange={(e) => {
                        yangila({ valyuta: e.target.value as 'SOM' | 'USD' });
                      }}
                      aria-label="Qo‘shimcha valyutasi"
                      className={kichik}
                      disabled={!ozgartiraOladi}
                    >
                      <option value="SOM">so‘m</option>
                      <option value="USD">$</option>
                    </select>
                    {ozgartiraOladi && (
                      <button
                        type="button"
                        onClick={() => {
                          setQoshimchalar((eski) => eski.filter((_, j) => j !== i));
                          setTanlangan((t) => t.filter((x) => x !== i));
                        }}
                        aria-label="Qo‘shimchani o‘chirish"
                        className="text-matn-kuchsiz hover:text-belgi-qizil"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                    {/* ⚠️ Qidiruvli ro'yxat — 2026-09-23 (omborda yuzta material) */}
                    <Tanlagich
                      kichik
                      qiymat={
                        q.materialId !== null
                          ? `M:${String(q.materialId)}`
                          : q.almashtirishGuruhId !== null
                            ? `G:${String(q.almashtirishGuruhId)}`
                            : ''
                      }
                      ozgartir={(v) => {
                        if (v === '') {
                          yangila({ materialId: null, almashtirishGuruhId: null, formula: '' });
                        } else if (v.startsWith('M')) {
                          yangila({ materialId: Number(v.slice(2)), almashtirishGuruhId: null });
                        } else {
                          yangila({ almashtirishGuruhId: Number(v.slice(2)), materialId: null });
                        }
                      }}
                      ariaYorliq="Qo‘shimcha materiali"
                      ochirilgan={!ozgartiraOladi}
                      boshQator="Material yo‘q — faqat narx"
                      joyBelgisi="Material yo‘q — faqat narx"
                      yozuvlar={[
                        ...almashtirishGuruhlari.map((g) => ({
                          qiymat: `G:${String(g.id)}`,
                          matn: g.nom,
                          guruh: 'Guruh (sotuvchi tanlaydi)',
                        })),
                        ...materiallar.map((mt) => ({
                          qiymat: `M:${String(mt.id)}`,
                          matn: mt.nom,
                          guruh: 'Aniq material',
                        })),
                      ]}
                    />

                    {materialBor && (
                      <input
                        value={q.formula}
                        onChange={(e) => {
                          yangila({ formula: e.target.value });
                        }}
                        placeholder="ENI * 40"
                        aria-label="Sarf formulasi"
                        className={`${kichik} font-mono`}
                        disabled={!ozgartiraOladi}
                      />
                    )}
                  </div>

                  {materialBor && (
                    <p className="mt-1.5 text-[11px] text-matn-kuchsiz">
                      Ombordan yechiladi. Ishlatiladi: <code>ENI</code>,{' '}
                      <code>BO&apos;YI</code>, <code>MAYDON</code>. O&apos;lchamlar{' '}
                      <b>metrda</b>.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {ozgartiraOladi && (
          <button
            type="button"
            onClick={() => {
              setQoshimchalar((eski) => [
                ...eski,
                {
                  nom: '',
                  hisoblashUsuli: 'QATIY',
                  narx: '',
                  valyuta: 'SOM',
                  materialId: null,
                  almashtirishGuruhId: null,
                  formula: '',
                },
              ]);
            }}
            className="mt-3 text-[12px] text-brend hover:underline"
          >
            + qo‘shimcha
          </button>
        )}
      </section>
      )}

      {/* ─── Tekshirish ───────────────────────────────────────────────── */}
      <section className="rounded-maydon border border-chegara bg-fon-ikki p-4">
        <h2 className="text-[15px] font-semibold text-matn">Tekshirish</h2>
        <p className="mt-0.5 mb-3 text-[12px] text-matn-ikki">
          Saqlashdan oldin narxni shu yerda ko‘ring
        </p>

        {/*
          ⚠️ «Miqdordan» qoidasida o'lcham HISOBGA OLINMAYDI — bosqich
             «Soni» katagiga qarab tanlanadi. Kataklar yashirilmaydi
             (boshqa daraja tanlansa yana kerak bo'ladi), lekin nima
             bo'layotgani ochiq aytiladi: jim turgan katak egasini
             «nega raqam o'zgarmayapti?» degan savolga olib kelardi.
        */}
        {!soniAlohidami && (
          <p className="mb-2 rounded-maydon bg-brend-fon px-3 py-2 text-[12px] text-brend">
            Bu daraja <b>miqdordan</b> hisoblanadi — o&apos;lcham e&apos;tiborga
            olinmaydi, narx <b>Soni</b> katagiga qarab topiladi.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={sinovEni}
            onChange={(e) => {
              setSinovEni(e.target.value);
            }}
            inputMode="numeric"
            aria-label="Sinov eni"
            disabled={!soniAlohidami}
            className={`${kichik} w-[90px] disabled:opacity-40`}
          />
          <span className="text-sm text-matn-kuchsiz">×</span>
          <input
            value={sinovBoyi}
            onChange={(e) => {
              setSinovBoyi(e.target.value);
            }}
            inputMode="numeric"
            aria-label="Sinov bo‘yi"
            disabled={!soniAlohidami}
            className={`${kichik} w-[90px] disabled:opacity-40`}
          />
          <span className="text-sm text-matn-kuchsiz">m</span>

          <span className="text-sm text-matn-kuchsiz">×</span>
          <input
            value={sinovSoni}
            onChange={(e) => {
              setSinovSoni(e.target.value);
            }}
            inputMode="numeric"
            aria-label="Sinov soni"
            className={`${kichik} w-[70px]`}
          />
          <span className="text-sm text-matn-kuchsiz">dona</span>

          {/*
            ⚠️ Daraja ro'yxati QOIDALARDAN emas, GURUHLARDAN
               tuziladi: bir daraja endi bir necha qatorga ega
               bo'lishi mumkin va `qoidalar` dan tuzilsa ro'yxatda
               takrorlanib chiqardi.
          */}
          <select
            value={sinovGuruh ?? ''}
            onChange={(e) => {
              setSinovGuruh(son(e.target.value));
            }}
            aria-label="Sinov darajasi"
            className={`${kichik} w-[170px]`}
          >
            <option value="">— daraja —</option>
            {guruhlar
              .filter((g) => qoidalar.some((q) => q.narxGuruhId === g.id))
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
          </select>

          <select
            value={sinovMijoz ?? ''}
            onChange={(e) => {
              setSinovMijoz(son(e.target.value));
            }}
            aria-label="Sinov mijoz turi"
            className={`${kichik} w-[160px]`}
          >
            <option value="">oddiy mijoz</option>
            {mijozTurlari.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>

          <select
            value={sinovFilial ?? ''}
            onChange={(e) => {
              setSinovFilial(son(e.target.value));
            }}
            aria-label="Sinov filiali"
            className={`${kichik} w-[150px]`}
          >
            <option value="">hamma filial</option>
            {filiallar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>

        {qoshimchalar.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3">
            {qoshimchalar.map((q, i) => (
              <label key={i} className="flex items-center gap-1.5 text-[12px] text-matn-ikki">
                <input
                  type="checkbox"
                  checked={tanlangan.includes(i)}
                  onChange={(e) => {
                    setTanlangan((t) =>
                      e.target.checked ? [...t, i] : t.filter((x) => x !== i),
                    );
                  }}
                />
                {q.nom === '' ? `Qo‘shimcha ${String(i + 1)}` : q.nom}
              </label>
            ))}
          </div>
        )}

        <div className="mt-3 border-t border-chegara pt-3 text-sm">
          {natija.hisob === null ? (
            <p className="text-belgi-qizil">{natija.xato}</p>
          ) : (
            <dl className="flex flex-col gap-1">
              {/*
                O'LCHOV BIRLIGI BILAN + QAYERDAN CHIQQANI — 2026-09-23.

                Egasi: «o'lchov ham kv.da, ham eni va bo'yida
                ko'rsatilsin». Ilgari bu yerda yalang'och «2.9400»
                turardi — maydonmi, metrmi, donami degan savolga
                javob yo'q edi. Endi birligi ham, uni bergan
                to'rtburchak ham yonida turadi.
              */}
              <div className="flex justify-between">
                <dt className="text-matn-ikki">O‘lchov</dt>
                <dd className="tabular-nums">
                  {natija.hisob.olchov.toFixed(4)}{' '}
                  <span className="text-matn-kuchsiz">
                    {natija.usul === null ? '' : birlikNomi(natija.usul)}
                  </span>
                </dd>
              </div>
              {soniAlohidami && (
                <div className="flex justify-between text-[12px] text-matn-kuchsiz">
                  <dt>O‘lcham</dt>
                  <dd className="tabular-nums">
                    {sinovEni} × {sinovBoyi} m
                    {sinovSoniAdadi > 1 ? ` × ${String(sinovSoniAdadi)} dona` : ''}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-matn-ikki">Bosqich</dt>
                <dd className="tabular-nums">
                  {natija.hisob.bosqich === null
                    ? '—'
                    : `${natija.hisob.bosqich.narx} ${natija.hisob.bosqich.valyuta === 'USD' ? '$' : "so'm"}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-matn-ikki">Asosiy narx</dt>
                <dd className="tabular-nums">{pulKorsat(som(natija.hisob.asosiy))} so‘m</dd>
              </div>
              {natija.hisob.qoshimchalar.map((q, i) => (
                <div key={i} className="flex justify-between">
                  <dt className="text-matn-ikki">{q.nom}</dt>
                  <dd className="tabular-nums">{pulKorsat(som(q.summa))} so‘m</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-chegara pt-1">
                <dt className="text-matn-ikki">
                  {soniAlohidami ? 'Bitta buyum' : 'Jami'}
                </dt>
                <dd className="tabular-nums">{pulKorsat(som(natija.hisob.jami))} so‘m</dd>
              </div>
              {/*
                ⚠️ SONI OXIRIDA KO'PAYTIRILADI — `pozitsiyaNarxiniHisobla`
                   da ham aynan shunday (T-12). Bu yerda alohida qator
                   bo'lib turgani muhim: egasi «uchtasiga qancha» degan
                   savolga javobni ko'radi va bitta buyum narxi ham
                   ko'rinib turadi.
              */}
              {soniAlohidami && sinovSoniAdadi > 1 && (
                <div className="flex justify-between border-t border-chegara pt-1 font-semibold">
                  <dt>Jami × {sinovSoniAdadi}</dt>
                  <dd className="tabular-nums">
                    {pulKorsat(kopaytir(som(natija.hisob.jami), sinovSoniAdadi))} so‘m
                  </dd>
                </div>
              )}
            </dl>
          )}

          {kursQiymati === null && (
            <p className="mt-2 text-[11px] text-belgi-sariq">
              Bugungi kurs kiritilmagan — dollardagi narx hisoblanmaydi.
            </p>
          )}
        </div>
      </section>

      {ozgartiraOladi && (
        <div className="flex flex-wrap items-center gap-3">
          {/*
            ⚠️ TAKROR BO'LSA SAQLANMAYDI. Server ham shu tekshiruvni
               takrorlaydi (`narx-qoida.ts`) — brauzerga ishonilmaydi.
               Bu yerdagisi sababni DARHOL ko'rsatish uchun.
          */}
          <button
            type="submit"
            disabled={kutilmoqda || takrorlar.size > 0}
            className="rounded-maydon bg-brend px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98] disabled:opacity-60"
          >
            {kutilmoqda ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
          {takrorlar.size > 0 && (
            <span className="text-[12px] text-belgi-qizil">
              Bir xil qamrov ikki marta yozilgan — yuqorida qizil bilan belgilandi.
            </span>
          )}
        </div>
      )}

      <Modal
        ochiq={guruhModali}
        yop={() => {
          setGuruhModali(false);
        }}
        sarlavha="Yangi narx darajasi"
        izoh="Narx jadvali shu darajalar bo‘yicha to‘ldiriladi"
        bolalar={
          <NarxGuruhFormasi
            saqlandi={(y) => {
              setGuruhlar((eski) => [...eski, { id: y.id, nom: y.nom, materialSoni: 0 }]);
              setGuruhModali(false);
            }}
            bekor={() => {
              setGuruhModali(false);
            }}
          />
        }
      />
    </form>
  );
}
