'use client';

/**
 * TZ 3 — sotuv ekrani.
 *
 * «Sotuvchi mijoz oldida turib buyurtma rasmiylashtiradi. Ekran bitta —
 *  boshqa sahifaga o'tish shart emas.» (3.1)
 *
 * ⚠️ Hisob-kitob `lib/domain/` da: sarflash `formula.ts`, narx `narx.ts`.
 *    Bu yerda formula ham, narx qoidasi ham TAKRORLANMAYDI (§2.2) —
 *    brauzerda ko'ringan raqam serverda ham aynan shu chiqadi.
 *
 * ⚠️ TZ 3.5 — «Umumiy maydon TAHRIRLANMAYDI, u faqat yig'indi bo'lib
 *    ko'rinadi. Aks holda ikki joydan bir narsa o'zgartiriladi va qaysi
 *    biri ustun ekani noaniq bo'lib qoladi.»
 */

import { enterYuborilmasin } from '../../forma-yordamchi';
import { useActionState, useMemo, useState } from 'react';
import { sarflashHisobla, standartQiymatlar } from '@/lib/domain/formula';
import { sm, type SarflashBirligi } from '@/lib/domain/birlik';
import { kurs, nolSom, pulKorsat, pulMatn, qosh, som, type Som } from '@/lib/domain/pul';
import { aksessuarNarxi, katalogNarxi, matoNarxi, qatorSummasi } from '@/lib/domain/narx';
import { pozitsiyaNarxiniHisobla } from '@/lib/domain/pozitsiya-narxi';
import { amaldagiOffset } from '@/lib/domain/mijoz';
import { chegirmaMatni } from '../../mijoz/guruh/royxat';
import { biznesXatosimi } from '@/lib/xato';
import { Maydon, kirishUslubi } from '../../maydon';
import { Modal } from '../../modal';
import { RasmKorish } from '../../rasm-korish';
import {
  MijozFormasi,
  BOSH_QIYMATLAR as MIJOZ_BOSH_QIYMATLAR,
} from '../../mijoz/forma';
import { mijozModalYaratAmali } from '../../mijoz/amal';
import { buyurtmaYaratAmali, turTafsiliAmali } from './amal';
import { BOSH_HOLAT } from './holat';
import type { SotuvMijozi, SotuvTuri } from './malumot';
import { QoshimchaQoshish, type QoshimchaMaterial } from './qoshimcha';

const BIRLIK_MATNI: Record<SarflashBirligi, string> = {
  KV_M: 'kv.m',
  SM: 'sm',
  DONA: 'dona',
};

interface SlotTanlovi {
  materialId: string;
  /** Sotuvchi tuzatgan miqdor — bo'sh bo'lsa hisoblangani ishlatiladi */
  tuzatilgan: string;
}

interface AksessuarTanlovi {
  materialId: number;
  soni: string;
  qoldaKiritildi: boolean;
  ochirilgan: boolean;
}

interface SavatQatori {
  readonly kalit: number;
  /** ⚠️ `null` — qo'shimcha mahsulot, tayyorlanmaydi */
  readonly turId: number | null;
  readonly turNomi: string;
  readonly eniSm: number;
  readonly boyiSm: number;
  readonly narx: string;
  readonly yuk: unknown;
  /** Qo'shimcha mahsulotda — nechta dona */
  readonly soni?: number;
}

let keyingiKalit = 0;

/**
 * TZ 3.10 — «Mijoz tanlangach uning offseti darhol ko'rinadi va narx
 * QAYTA HISOBLANADI.»
 *
 * ⚠️ Offset BARCHA matolarga bir xil qo'llanadi (6.3) va yaxlitlash
 *    zanjirning oxirida bir marta bajariladi (20.9.3) — shuning uchun
 *    bu yerda yaxlitlanmaydi.
 *
 * ⚠️ `USD` offseti JORIY kursni talab qiladi (6.3). Kurs sotuv ekraniga
 *    hali ulanmagan, shuning uchun dollarli offset qo'llanmaydi va
 *    sotuvchiga ochiq aytiladi — jimgina noto'g'ri narx chiqarishdan
 *    ko'ra ko'rinadigan cheklov yaxshi.
 */

const son = (x: string): number | null => {
  const t = x.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function SotuvFormasi({
  turlar,
  birinchiTur,
  filiallar,
  ozFilialId,
  mijozQoshaOladi,
  mijozGuruhlari,
  joriyKurs,
  qoshimchalar,
}: {
  /** Faqat nom va raqam — yengil ro'yxat (3.2) */
  turlar: readonly { id: number; nom: string; rasmBormi: boolean }[];
  /** Ekran bo'sh ochilmasligi uchun birinchi turning tafsiloti */
  birinchiTur: SotuvTuri | null;
  filiallar: readonly { id: number; nom: string; bosh: boolean }[];
  ozFilialId: number;
  mijozQoshaOladi: boolean;
  /** TZ 6.3 — modalda yangi mijozga darhol guruh tanlash uchun */
  mijozGuruhlari: readonly { id: number; nom: string }[];
  /**
   * ⚠️ Dollardagi material narxini so'mga o'girish uchun (5.4).
   *    Kurs kiritilmagan bo'lsa `null` — u holda dollardagi mato
   *    tanlanganda tushunarli xato chiqadi.
   */
  joriyKurs: string | null;
  /** Alohida sotiladigan buyumlar — mexanizm, kronshteyn, zanjir */
  qoshimchalar: readonly QoshimchaMaterial[];
}) {
  const [holat, yubor, kutilmoqda] = useActionState(buyurtmaYaratAmali, BOSH_HOLAT);

  /**
   * ⚠️ Kurs `Kurs` turiga o'raladi — `ogir()` faqat shuni qabul
   *    qiladi (§3.2). `JORIY` manbasi: bu bugungi kurs, yozuvga
   *    qotgan snapshot emas.
   */
  const kursObyekti = useMemo(
    () => (joriyKurs === null || joriyKurs.trim() === '' ? null : kurs(joriyKurs, new Date(), 'JORIY')),
    [joriyKurs],
  );

  const [turId, turniOzgartir] = useState<number | null>(turlar[0]?.id ?? null);

  /**
   * ⚠️ Tanlangan turning TAFSILOTI. Ilgari hamma tur tafsiloti
   *    birdan kelardi va sahifa og'irlashardi; endi tanlangani
   *    kerak bo'lganda yuklanadi.
   */
  const [tur, turniYukla] = useState<SotuvTuri | null>(birinchiTur);
  const [turYuklanmoqda, yuklanishniOzgartir] = useState(false);
  const [eni, eniniOzgartir] = useState('210');
  const [boyi, boyiniOzgartir] = useState('140');
  const [parametrlar, parametrlarniOzgartir] = useState<Record<string, string>>({});
  const [slotlar, slotlarniOzgartir] = useState<Record<number, SlotTanlovi>>({});
  const [aksessuarlar, aksessuarlarniOzgartir] = useState<Record<number, AksessuarTanlovi>>({});
  const [savat, savatniOzgartir] = useState<readonly SavatQatori[]>([]);
  const [mijoz, mijozniOzgartir] = useState<SotuvMijozi | null>(null);
  const [tikuvchi, tikuvchiniOzgartir] = useState(ozFilialId);
  const [tayyorlik, tayyorlikniOzgartir] = useState('');
  const [kelishilgan, kelishilganniOzgartir] = useState('');

  /**
   * TZ 6.3 — mijozning SHAXSIY chegirmasi guruhnikidan ustun.
   *    Qoida `lib/domain/mijoz.ts` da — bot ham shuni ishlatadi.
   */
  const offset = amaldagiOffset(
    mijoz,
    mijoz === null
      ? null
      : { offsetTuri: mijoz.guruhOffsetTuri, offsetQiymat: mijoz.guruhOffsetQiymat },
  );

  /** TZ 3.5 — har slot uchun formula bo'yicha miqdor. */
  const hisob = useMemo(() => {
    if (tur === null) return null;

    const eniSm = son(eni);
    const boyiSm = son(boyi);
    if (eniSm === null || boyiSm === null || eniSm <= 0 || boyiSm <= 0) return null;

    const qiymatlar: Record<string, number> = {};
    for (const p of tur.parametrlar) {
      const q = son(parametrlar[p.kod] ?? p.standartQiymat ?? '');
      if (q !== null) qiymatlar[p.kod] = q;
    }

    const asos = standartQiymatlar(sm(eniSm), sm(boyiSm), 1, qiymatlar);

    const qatorlar = tur.slotlar.map((s) => {
      const tanlov = slotlar[s.id];
      const material = tanlov
        ? (s.materiallar.find((m) => m.id === Number(tanlov.materialId)) ?? null)
        : null;

      const birlik = (material?.sarflashBirligi ?? 'KV_M') as SarflashBirligi;

      let hisoblangan: number | null = null;
      let xato: string | null = null;
      try {
        hisoblangan = sarflashHisobla(s.formula, asos, birlik);
      } catch (x) {
        xato = biznesXatosimi(x) ? x.message : 'Formulada xato';
      }

      const tuzatilgan = son(tanlov?.tuzatilgan ?? '');
      /**
       * TZ 20.9.3 ning to'liq zanjiri — `lib/domain/narx.ts` da:
       * filial narxi → mijoz offseti → yaxlitlash.
       *
       * Filial narxi SQL da hal qilingan (`COALESCE`), shuning uchun
       * bu yerda `filialNarxi` yo'q.
       */
      const narxMatn =
        material === null || material.narx === null
          ? null
          : pulMatn(
              matoNarxi({
                standart:
                  katalogNarxi(material.narx, material.narxValyuta, kursObyekti) ??
                  som(material.narx),
                filialNarxi: null,
                offset,
                kurs: kursObyekti,
              }),
            );

      /**
       * TZ 3.6 — NARX tuzatilgan songa, ombor hisoblanganiga tayanadi.
       *
       * ⚠️ Summa `lib/domain/pozitsiya-narxi.ts` dagi umumiy
       *    funksiyadan olinadi (§2.2): bot ham AYNAN shuni chaqiradi.
       *    Ikki joyda hisoblansa botda bir narx, saytda boshqa narx
       *    chiqardi.
       */
      const summa =
        narxMatn === null || hisoblangan === null
          ? nolSom()
          : som(
              pozitsiyaNarxiniHisobla({
                eniSm,
                boyiSm,
                soni: 1,
                parametrlar: qiymatlar,
                slotlar: [
                  {
                    nom: s.nom,
                    formula: s.formula,
                    sarflashBirligi: birlik,
                    narx: material?.narx ?? null,
                    narxValyuta: material?.narxValyuta,
                    tuzatilganMiqdor: tuzatilgan,
                  },
                ],
                aksessuarlar: [],
                offset,
                kurs: kursObyekti,
                xizmatHaqi: null,
              }).jami,
            );

      /**
       * Q-03 · QABUL S3.4 — «Bu mato hozir yetarli emas» ogohi
       * BUYURTMA BERILAYOTGANDA chiqadi, usta olganda emas.
       *
       * ⚠️ Bu ogoh — TAXMIN, aniq javob emas: bu yerda umumiy bo'sh
       *    qoldiq ko'riladi, band qilish esa TO'RTBURCHAK qidiradi
       *    (7.6). Aniq javobni server beradi va u ham bloklamaydi —
       *    pozitsiya «Materialga kutmoqda» ga tushadi (8.12).
       */
      const yetarlimi =
        material === null || hisoblangan === null
          ? true
          : birlik === 'KV_M'
            ? material.boshKvM >= hisoblangan
            : material.boshDona >= hisoblangan;

      return {
        slot: s,
        material,
        birlik,
        hisoblangan,
        tuzatilgan,
        summa,
        xato,
        narxMatn,
        yetarlimi,
      };
    });

    const aksQatorlar = tur.aksessuarlar
      .filter((a) => {
        const t = aksessuarlar[a.materialId];
        if (t?.ochirilgan === true) return false;
        return a.majburiy || t !== undefined;
      })
      .map((a) => {
        const t = aksessuarlar[a.materialId];
        const birlik = a.sarflashBirligi as SarflashBirligi;

        let hisoblangan = 0;
        try {
          hisoblangan = sarflashHisobla(a.formula, asos, birlik);
        } catch {
          hisoblangan = 0;
        }

        // TZ 3.7 — qo'lda kiritilgan sonni formula USTIDAN YOZMAYDI
        const soni = t?.qoldaKiritildi === true ? (son(t.soni) ?? 0) : hisoblangan;

        // ⚠️ TZ 6.3 — «Offset FAQAT MATOGA qo'llanadi, AKSESSUARGA TEGMAYDI.»
        const narx =
          a.narx === null
            ? null
            : aksessuarNarxi(
                katalogNarxi(a.narx, a.narxValyuta, kursObyekti) ?? som(a.narx),
                null,
              );

        const summa =
          narx === null
            ? nolSom()
            : qatorSummasi({
                nom: a.nom,
                sarflashBirligi: birlik,
                miqdor: soni as never,
                narx,
              });

        return { aksessuar: a, birlik, soni, summa, narx };
      });

    const xizmat = tur.xizmatHaqi === null ? nolSom() : som(tur.xizmatHaqi);

    const jami = [...qatorlar, ...aksQatorlar].reduce<Som>((y, q) => qosh(y, q.summa), xizmat);

    return { qatorlar, aksQatorlar, xizmat, jami, eniSm, boyiSm };
  }, [tur, eni, boyi, parametrlar, slotlar, aksessuarlar, offset]);

  const savatJami = savat.reduce<Som>((y, q) => qosh(y, som(q.narx)), nolSom());

  // Q-03 — yetmaydigan matolar (ogohlantirish, bloklamaydi)
  const yetmaydiganlar = (hisob?.qatorlar ?? []).filter((q) => !q.yetarlimi);

  /**
   * Pozitsiya narxi — SOTUVCHI TUZATISHI MUMKIN (3.8).
   *
   * ⚠️ Egasi (2026-08-30): «savatga qo'shishdan oldin pastda narx
   *    hisoblanadi — o'shani ham o'zgartirib bo'lsin, narx inputda
   *    tursin».
   *
   * ⚠️ `null` — «hisoblangani ishlatiladi». Sotuvchi tegsa, raqam
   *    QOTADI va o'lchamlar o'zgarganda ham o'zgarmaydi: u mijoz
   *    bilan kelishilgan narx.
   */
  const [qoldaNarx, qoldaNarxniOzgartir] = useState<string | null>(null);

  const hisoblanganNarx = hisob === null ? '' : pulMatn(hisob.jami);
  const korsatiladiganNarx = qoldaNarx ?? hisoblanganNarx;

  /** Kiritilgan narx pul sifatida yaroqlimi */
  const narxYaroqli = /^\d+(\.\d{1,2})?$/.test(korsatiladiganNarx.trim());

  const savatgaQoshilsinmi =
    hisob !== null &&
    tur !== null &&
    narxYaroqli &&
    tur.slotlar.filter((s) => s.majburiy).every((s) => (slotlar[s.id]?.materialId ?? '') !== '');

  function savatgaQosh(): void {
    if (hisob === null || tur === null) return;

    keyingiKalit += 1;
    const yuk = {
      mahsulotTurId: tur.id,
      eniSm: hisob.eniSm,
      boyiSm: hisob.boyiSm,
      soni: 1,
      /** ⚠️ Sotuvchi tuzatgan bo'lsa — o'sha raqam, aks holda hisoblangani */
      narxSnapshot: qoldaNarx ?? pulMatn(hisob.jami),
      chegirmaSumma: '0',
      xizmatHaqi: pulMatn(hisob.xizmat),
      // TZ 4.10 — konstruktor holati QOTADI
      formulaSnapshot: {
        tur: tur.nom,
        slotlar: tur.slotlar.map((s) => ({ nom: s.nom, formula: s.formula })),
        parametrlar: tur.parametrlar.map((p) => ({
          kod: p.kod,
          qiymat: parametrlar[p.kod] ?? p.standartQiymat,
        })),
      },
      slotlar: hisob.qatorlar
        .filter((q) => q.material !== null && q.hisoblangan !== null)
        .map((q) => ({
          slotId: q.slot.id,
          materialId: q.material?.id ?? 0,
          hisoblanganMiqdor: String(q.hisoblangan ?? 0),
          tuzatilganMiqdor: q.tuzatilgan === null ? null : String(q.tuzatilgan),
          birlik: q.birlik,
          narxSnapshot: q.narxMatn ?? '0',
        })),
      aksessuarlar: hisob.aksQatorlar.map((a) => ({
        materialId: a.aksessuar.materialId,
        soni: String(a.soni),
        birlik: a.birlik,
        narxSnapshot: a.narx === null ? '0' : pulMatn(a.narx),
        qoldaKiritildi: aksessuarlar[a.aksessuar.materialId]?.qoldaKiritildi ?? false,
      })),
    };

    savatniOzgartir((s) => [
      ...s,
      {
        kalit: keyingiKalit,
        turId: tur.id,
        turNomi: tur.nom,
        eniSm: hisob.eniSm,
        boyiSm: hisob.boyiSm,
        /** ⚠️ Savatdagi raqam ham TUZATILGANI — jami shundan chiqadi */
        narx: qoldaNarx ?? pulMatn(hisob.jami),
        yuk,
      },
    ]);

    slotlarniOzgartir({});
    aksessuarlarniOzgartir({});
    /** Keyingi pozitsiya yana hisoblangan narxdan boshlanadi */
    qoldaNarxniOzgartir(null);
  }

  const kelishilganSom = son(kelishilgan);
  const chegirma = kelishilganSom === null ? null : Number(pulMatn(savatJami)) - kelishilganSom;

  const yuborilajak = {
    mijozId: mijoz?.id ?? null,
    ishlabChiqaruvchiFilialId: tikuvchi,
    valyuta: 'SOM' as const,
    /**
     * ⚠️ Buyurtma so'mda bo'lsa ham kurs YOZILADI — dollardagi
     *    material narxi shu kursda so'mga o'girilgan. Yozilmasa,
     *    keyin «bu narx qayerdan chiqqan» degan savolga javob
     *    topilmasdi (2.3-invariant: o'tmish o'zgarmaydi).
     */
    kursSnapshot: joriyKurs,
    tayyorlikSana: tayyorlik === '' ? null : tayyorlik,
    qarzgaKetadimi: false,
    pozitsiyalar: savat.map((q) => q.yuk),
  };

  return (
    /**
     * ⚠️ Keng ekranda IKKI USTUN: chapda pozitsiya yig'iladi, o'ngda
     *    narx va savat YOPISHIB turadi. Ilgari hammasi bir ustunda
     *    edi va sotuvchi savatni ko'rish uchun pastga tushardi —
     *    jami summani ko'rmay turib mijozga narx aytardi.
     *
     * ⚠️ Tor ekranda bir ustun bo'lib qoladi: telefonda yon ustun
     *    joy yeydi.
     */
    <form action={yubor} onKeyDown={enterYuborilmasin} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <input type="hidden" name="buyurtma" value={JSON.stringify(yuborilajak)} />

      {/* Xabarlar ikki ustunning USTIDA — ko'zdan qochmasin */}
      <div className="contents xl:col-span-2">
        {holat.xato !== null && (
          <p
            role="alert"
            className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil "
          >
            {holat.xato}
          </p>
        )}

        {holat.buyurtmaRaqam !== null && (
          <div className="rounded-karta bg-belgi-yashil-fon px-4 py-3 text-sm text-belgi-yashil ring-1 ring-belgi-yashil/20">
            <b>{holat.buyurtmaRaqam}</b> saqlandi.
            {holat.materialgaKutmoqda.length > 0 && (
              <span className="mt-1 block text-belgi-sariq">
                {holat.materialgaKutmoqda.join(', ')}-pozitsiya uchun mos material topilmadi —
                «Materialga kutmoqda» holatida turibdi (Q-03). Kirim bo&apos;lgach avtomatik
                navbatga qaytadi (8.12).
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══ CHAP USTUN — pozitsiya yig'iladi ═══════════════════ */}
      <div className="flex flex-col gap-6">
        {/* ── 3.2 · Mahsulot turlari ── */}
        <section>
          <h2 className="mb-1.5 text-sm font-medium text-matn-ikki">Tur</h2>
          {turlar.length === 0 ? (
            <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-6 text-center text-sm text-matn-kuchsiz">
              Faol tur yo&apos;q. Avval «Tur yig&apos;ish» bo&apos;limida tur qo&apos;shing.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {turlar.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (t.id === turId) return;
                    turniOzgartir(t.id);
                    slotlarniOzgartir({});
                    aksessuarlarniOzgartir({});
                    yuklanishniOzgartir(true);

                    void turTafsiliAmali(t.id)
                      .then((x) => {
                        turniYukla(x);
                      })
                      .finally(() => {
                        yuklanishniOzgartir(false);
                      });
                  }}
                  disabled={turYuklanmoqda}
                  /**
                   * ⚠️ Faol tur BREND rangida, qora emas. Ekranda 15–20
                   *    amal bor; qora fon eng kuchli signal va u
                   *    «Buyurtmani saqlash» tugmasiga tegishli.
                   */
                  /**
                   * ⚠️ IXCHAM. Tur soni o'nlab bo'lishi mumkin —
                   *    katta tugmalar bir necha qatorga yoyilib,
                   *    o'lcham kiritish maydonini ekrandan
                   *    surib yuborardi.
                   */
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    t.id === turId
                      ? 'bg-brend text-white'
                      : 'border border-chegara bg-sirt text-matn-ikki hover:border-chegara-quyuq hover:text-matn'
                  } ${turYuklanmoqda ? 'opacity-60' : ''}`}
                >
                  {/*
                    ⚠️ TZ 4.2 — katalog rasmi. Tugma ichida kichik
                       belgi bo'lib turadi: mijoz «qaysi mahsulot?»
                       deganda sotuvchi ekranni buradi.
                  */}
                  {t.rasmBormi && (
                    <img
                      src={`/api/rasm/mahsulot/${String(t.id)}`}
                      alt=""
                      loading="lazy"
                      className="mr-1.5 inline-block size-4 rounded-[3px] object-cover align-[-3px]"
                    />
                  )}
                  {t.nom}
                </button>
              ))}
            </div>
          )}
        </section>

        {tur !== null && (
          <>
            {/* ── 3.4 · O'lcham ── */}
            <section className="flex flex-wrap items-end gap-4">
              <Maydon nom="eni" yorliq="Eni (sm)">
                <input
                  id="eni"
                  value={eni}
                  onChange={(e) => {
                    eniniOzgartir(e.target.value);
                  }}
                  inputMode="numeric"
                  className={`${kirishUslubi(false)} w-28`}
                />
              </Maydon>
              <Maydon nom="boyi" yorliq="Bo'yi (sm)">
                <input
                  id="boyi"
                  value={boyi}
                  onChange={(e) => {
                    boyiniOzgartir(e.target.value);
                  }}
                  inputMode="numeric"
                  className={`${kirishUslubi(false)} w-28`}
                />
              </Maydon>

              {tur.parametrlar.map((p) => (
                <Maydon key={p.kod} nom={`p-${p.kod}`} yorliq={`${p.nom} (sm)`}>
                  <input
                    id={`p-${p.kod}`}
                    value={parametrlar[p.kod] ?? p.standartQiymat ?? ''}
                    onChange={(e) => {
                      parametrlarniOzgartir((o) => ({ ...o, [p.kod]: e.target.value }));
                    }}
                    inputMode="decimal"
                    className={`${kirishUslubi(false)} w-24`}
                  />
                </Maydon>
              ))}
            </section>

            {/* ── 3.3 · 3.5 · Slotlar ── */}
            <section>
              <h2 className="mb-1 text-sm font-medium text-matn-ikki">Matolar</h2>
              <p className="mb-3 text-xs text-matn-kuchsiz">
                Har slotda faqat o&apos;sha slotga bog&apos;langan matolar chiqadi (3.3).
                Hisoblangan son yonidagi maydonga o&apos;zgacha kelishilsa yozing —{' '}
                <b>narx shunga</b>, ombordan esa hisoblangani yechiladi (3.6).
              </p>

              <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                <table className="w-full text-sm">
                  <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Slot</th>
                      <th className="px-3 py-2.5 font-medium">Mato</th>
                      <th className="px-3 py-2.5 text-right font-medium">Hisoblangan</th>
                      <th className="px-3 py-2.5 font-medium">Kelishilgan</th>
                      <th className="px-3 py-2.5 text-right font-medium">Narx</th>
                      <th className="px-3 py-2.5 text-right font-medium">Summa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                    {(hisob?.qatorlar ?? []).map((q) => (
                      <tr key={q.slot.id}>
                        <td className="px-3 py-2">
                          {q.slot.nom}
                          {!q.slot.majburiy && (
                            <span className="ml-2 text-xs text-matn-kuchsiz">ixtiyoriy</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={slotlar[q.slot.id]?.materialId ?? ''}
                            onChange={(e) => {
                              slotlarniOzgartir((o) => ({
                                ...o,
                                [q.slot.id]: {
                                  materialId: e.target.value,
                                  tuzatilgan: o[q.slot.id]?.tuzatilgan ?? '',
                                },
                              }));
                            }}
                            className={`${kirishUslubi(false)} w-56`}
                          >
                            <option value="">— tanlang —</option>
                            {q.slot.materiallar.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nom}
                                {m.sarflashBirligi === 'KV_M'
                                  ? ` · ${m.boshKvM.toFixed(2)} kv.m`
                                  : ` · ${String(m.boshDona)}`}
                              </option>
                            ))}
                          </select>

                          {/*
                            ⚠️ TZ 3.3 — «mijozga ekranni burib
                               ko'rsatish uchun». `<option>` ichida
                               rasm ko'rsatib bo'lmaydi, shuning
                               uchun TANLANGANI yonida turadi.
                          */}
                          {q.material?.rasmBormi === true && (
                            <div className="mt-1">
                              <RasmKorish
                                manzil={`/api/rasm/material/${String(q.material.id)}`}
                                nom={q.material.nom}
                              />
                            </div>
                          )}
                        </td>
                        <td className="raqam px-3 py-2">
                          {q.xato !== null ? (
                            <span className="text-belgi-qizil">{q.xato}</span>
                          ) : q.hisoblangan === null ? (
                            '—'
                          ) : (
                            `${q.hisoblangan.toFixed(q.birlik === 'DONA' ? 0 : 2)} ${BIRLIK_MATNI[q.birlik]}`
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={slotlar[q.slot.id]?.tuzatilgan ?? ''}
                            onChange={(e) => {
                              slotlarniOzgartir((o) => ({
                                ...o,
                                [q.slot.id]: {
                                  materialId: o[q.slot.id]?.materialId ?? '',
                                  tuzatilgan: e.target.value,
                                },
                              }));
                            }}
                            inputMode="decimal"
                            placeholder={q.hisoblangan === null ? '' : q.hisoblangan.toFixed(2)}
                            className={`${kirishUslubi(false)} w-24`}
                          />
                        </td>
                        <td className="raqam px-3 py-2">
                          {q.narxMatn === null ? '—' : pulKorsat(som(q.narxMatn))}
                        </td>
                        <td className="raqam px-3 py-2 font-medium">{pulKorsat(q.summa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── 3.7 · Aksessuarlar ── */}
            {tur.aksessuarlar.length > 0 && (
              <section>
                <h2 className="mb-1 text-sm font-medium text-matn-ikki">Aksessuarlar</h2>
                <p className="mb-3 text-xs text-matn-kuchsiz">
                  Komplekt avtomatik tushadi. Sonini qo&apos;lda o&apos;zgartirsangiz — o&apos;lcham
                  keyin o&apos;zgarsa ham formula uni <b>ustidan yozmaydi</b> (3.7).
                </p>

                <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                      {(hisob?.aksQatorlar ?? []).map((a) => (
                        <tr key={a.aksessuar.materialId}>
                          <td className="px-3 py-2">{a.aksessuar.nom}</td>
                          <td className="px-3 py-2">
                            <input
                              value={
                                aksessuarlar[a.aksessuar.materialId]?.qoldaKiritildi === true
                                  ? (aksessuarlar[a.aksessuar.materialId]?.soni ?? '')
                                  : String(a.soni)
                              }
                              onChange={(e) => {
                                aksessuarlarniOzgartir((o) => ({
                                  ...o,
                                  [a.aksessuar.materialId]: {
                                    materialId: a.aksessuar.materialId,
                                    soni: e.target.value,
                                    qoldaKiritildi: true,
                                    ochirilgan: false,
                                  },
                                }));
                              }}
                              inputMode="decimal"
                              className={`${kirishUslubi(false)} w-20`}
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-matn-kuchsiz">
                            {BIRLIK_MATNI[a.birlik]}
                          </td>
                          <td className="raqam px-3 py-2">
                            {a.narx === null ? '—' : pulKorsat(a.narx)}
                          </td>
                          <td className="raqam px-3 py-2 font-medium">{pulKorsat(a.summa)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                aksessuarlarniOzgartir((o) => ({
                                  ...o,
                                  [a.aksessuar.materialId]: {
                                    materialId: a.aksessuar.materialId,
                                    soni: '0',
                                    qoldaKiritildi: false,
                                    ochirilgan: true,
                                  },
                                }));
                              }}
                              className="text-xs text-matn-kuchsiz hover:text-belgi-qizil"
                            >
                              olib tashlash
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                {/*
                  ⚠️ TZ 4.6 — «Ixtiyoriy aksessuar sotuvda AVTOMATIK
                     KELMAYDI, mijoz so'ragandagina qo'shiladi.»

                     Mantiq bor edi, lekin QO'SHISH YO'LI yo'q edi:
                     ixtiyoriy aksessuar ro'yxatda umuman
                     ko'rinmasdi va uni sotib bo'lmasdi.
                */}
                {(() => {
                  const qoshilgan = new Set(
                    (hisob?.aksQatorlar ?? []).map((a) => a.aksessuar.materialId),
                  );
                  const ixtiyoriy = (tur?.aksessuarlar ?? []).filter(
                    (a) => !qoshilgan.has(a.materialId),
                  );

                  if (ixtiyoriy.length === 0) return null;

                  return (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-matn-kuchsiz">
                        Mijoz so&apos;rasa qo&apos;shiladi:
                      </span>
                      {ixtiyoriy.map((a) => (
                        <button
                          key={a.materialId}
                          type="button"
                          onClick={() => {
                            aksessuarlarniOzgartir((o) => ({
                              ...o,
                              [a.materialId]: {
                                materialId: a.materialId,
                                soni: '',
                                /**
                                 * ⚠️ `qoldaKiritildi: false` —
                                 *    formula sonini o'zi hisoblaydi
                                 *    (3.7). Sotuvchi xohlasa keyin
                                 *    qo'lda o'zgartiradi.
                                 */
                                qoldaKiritildi: false,
                                ochirilgan: false,
                              },
                            }));
                          }}
                          className="fokus rounded-full border border-chegara bg-sirt px-2.5 py-1 text-[12px] font-medium text-brend transition-colors hover:border-brend/40 hover:bg-brend/5"
                        >
                          + {a.nom}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                </div>
              </section>
            )}

            {/* Q-03 · QABUL S3.4 — yetishmovchilik OGOHI, bloklamaydi */}
            {yetmaydiganlar.length > 0 && (
              <div className="rounded-karta border border-belgi-sariq/20 bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq">
                <b>Bu mato hozir yetarli emas:</b>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {yetmaydiganlar.map((q) => (
                    <li key={q.slot.id}>
                      {q.material?.nom ?? q.slot.nom} — kerak {(q.hisoblangan ?? 0).toFixed(2)}{' '}
                      {BIRLIK_MATNI[q.birlik]}, bo&apos;sh{' '}
                      {q.birlik === 'KV_M'
                        ? (q.material?.boshKvM ?? 0).toFixed(2)
                        : String(q.material?.boshDona ?? 0)}{' '}
                      {BIRLIK_MATNI[q.birlik]}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Davom etsangiz buyurtma <b>saqlanadi</b>, pozitsiya «Materialga kutmoqda» holatiga
                  tushadi va kirim bo&apos;lgach avtomatik navbatga qaytadi (8.12). Yoki yuqoridan{' '}
                  <b>boshqa mato</b>
                  &nbsp;tanlang.
                </p>
              </div>
            )}

            {/* ── 3.8 · Pozitsiya narxi ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-karta border border-chegara bg-sirt px-5 py-4">
              <div>
                <label
                  htmlFor="pozitsiyaNarxi"
                  className="block text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase"
                >
                  Pozitsiya narxi
                </label>

                {/*
                  ⚠️ Narx TUZATILADI (3.8). Mijoz bilan kelishilgan
                     raqam hisoblanganidan boshqa bo'lishi mumkin.
                     Sotuvchi tegsa — raqam QOTADI: o'lchamlar
                     o'zgarsa ham o'zgarmaydi.
                */}
                <input
                  id="pozitsiyaNarxi"
                  value={korsatiladiganNarx}
                  onChange={(e) => {
                    qoldaNarxniOzgartir(e.target.value);
                  }}
                  inputMode="decimal"
                  aria-invalid={!narxYaroqli}
                  className={`raqam mt-0.5 w-44 rounded-maydon border bg-fon px-3 py-1.5 text-[20px] leading-tight font-semibold tracking-[-0.02em] ${
                    narxYaroqli ? 'border-chegara' : 'border-belgi-qizil'
                  }`}
                />

                {qoldaNarx !== null && qoldaNarx !== hisoblanganNarx && (
                  <span className="mt-1 block text-[12px] text-belgi-sariq">
                    hisoblangani {pulKorsat(hisob?.jami ?? nolSom())} —{' '}
                    <button
                      type="button"
                      onClick={() => {
                        qoldaNarxniOzgartir(null);
                      }}
                      className="fokus rounded-maydon underline underline-offset-2"
                    >
                      qaytarish
                    </button>
                  </span>
                )}

                {!narxYaroqli && (
                  <span role="alert" className="mt-1 block text-[12px] text-belgi-qizil">
                    Narx — faqat son (masalan 678400)
                  </span>
                )}

                {tur.xizmatHaqi !== null && Number(tur.xizmatHaqi) > 0 && (
                  <span className="mt-0.5 block text-[12px] text-matn-kuchsiz">
                    xizmat haqi {pulKorsat(som(tur.xizmatHaqi))} bilan
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={!savatgaQoshilsinmi}
                onClick={savatgaQosh}
                className="rounded-maydon bg-brend px-4 py-2.5 text-[13px] font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
              >
                Savatga qo&apos;shish
              </button>
            </div>
          </>
        )}
      </div>

      {/* ═══ O'NG USTUN — narx doim ko'z oldida ══════════════════ */}
      <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
        {/* ── 3.9 · Savat ── */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-matn-ikki">Savat ({savat.length})</h2>

            {/*
              ⚠️ Mijoz «uydagi mexanizm buzilgan» desa — tayyor
                 mahsulotsiz, alohida buyum sotiladi.
            */}
            <QoshimchaQoshish
              materiallar={qoshimchalar}
              kurs={kursObyekti}
              qoshildi={(t) => {
                savatniOzgartir((sv) => [
                  ...sv,
                  {
                    kalit: Date.now(),
                    turId: null,
                    turNomi: t.nom,
                    eniSm: 0,
                    boyiSm: 0,
                    soni: t.soni,
                    narx: t.narx,
                    yuk: {
                      mahsulotTurId: null,
                      qoshimchaMaterialId: t.materialId,
                      eniSm: 0,
                      boyiSm: 0,
                      soni: t.soni,
                      narxSnapshot: t.narx,
                      chegirmaSumma: '0',
                      xizmatHaqi: '0',
                      /** ⚠️ Formula yo'q — bu buyum tayyorlanmaydi */
                      formulaSnapshot: { qoshimcha: true },
                      slotlar: [],
                      aksessuarlar: [],
                    },
                  },
                ]);
              }}
            />
          </div>

          {savat.length === 0 ? (
            <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-[13px] text-matn-kuchsiz">
              Savat bo&apos;sh.
              <span className="mt-1 block">
                Bitta buyurtmada bir nechta xona bo&apos;lishi mumkin.
              </span>
            </p>
          ) : (
            <div className="overflow-hidden rounded-karta border border-chegara bg-sirt">
              <table className="w-full text-[13px]">
                <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                  {savat.map((q) => (
                    <tr key={q.kalit}>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-matn">{q.turNomi}</span>
                        <span className="raqam mt-0.5 block text-left text-[12px] text-matn-kuchsiz">
                          {/*
                            ⚠️ Qo'shimcha mahsulotda o'lcham yo'q —
                               u tayyorlanmaydi, ombordan olinadi.
                          */}
                          {q.turId === null
                            ? `${String(q.soni ?? 1)} dona`
                            : `${String(q.eniSm)} × ${String(q.boyiSm)} sm`}
                        </span>
                      </td>
                      <td className="raqam px-3 py-2.5 font-medium">{pulKorsat(som(q.narx))}</td>
                      <td className="px-2 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            savatniOzgartir((s) => s.filter((x) => x.kalit !== q.kalit));
                          }}
                          aria-label="Olib tashlash"
                          className="fokus rounded-maydon px-1.5 py-1 text-matn-kuchsiz transition-colors hover:bg-belgi-qizil-fon hover:text-belgi-qizil"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 3.10 · 3.11 · 3.13 · 20.4 ── */}
        <section className="grid gap-4 sm:grid-cols-2">
          <MijozTanlash
            tanlangan={mijoz}
            ozgartir={mijozniOzgartir}
            qoshaOladi={mijozQoshaOladi}
            guruhlar={mijozGuruhlari}
          />

          <Maydon
            nom="tikuvchi"
            yorliq="Ishlab chiqaruvchi filial"
            izoh="Mahsulot shu filial omborida tekshiriladi (20.4.2)"
          >
            <select
              id="tikuvchi"
              value={tikuvchi}
              onChange={(e) => {
                tikuvchiniOzgartir(Number(e.target.value));
              }}
              className={kirishUslubi(false)}
            >
              {filiallar.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </Maydon>

          <Maydon
            nom="tayyorlik"
            yorliq="Tayyorlik sanasi"
            izoh="Ixtiyoriy — kiritilmasa buyurtma «kechikkan» hisoblanmaydi (3.13)"
          >
            <input
              id="tayyorlik"
              type="date"
              value={tayyorlik}
              onChange={(e) => {
                tayyorlikniOzgartir(e.target.value);
              }}
              className={kirishUslubi(false)}
            />
          </Maydon>

          <Maydon
            nom="kelishilgan"
            yorliq="Kelishilgan summa"
            izoh="Bo'sh qoldirilsa hisoblangan summa olinadi"
          >
            <input
              id="kelishilgan"
              value={kelishilgan}
              onChange={(e) => {
                kelishilganniOzgartir(e.target.value);
              }}
              inputMode="decimal"
              placeholder={pulMatn(savatJami)}
              className={kirishUslubi(false)}
            />
          </Maydon>
        </section>

        {/*
        ⚠️ Jami va saqlash tugmasi O'NG USTUN PASTIDA, yopishib
           turadi. Sotuvchi mijozga narx aytayotganda uni ko'rib
           turishi kerak — pastga tushib qidirmasin.
      */}
        <div className="flex flex-col gap-3 rounded-karta border border-chegara bg-sirt px-5 py-4">
          <div>
            <div className="text-[12px] tracking-[0.03em] text-matn-kuchsiz uppercase">Jami</div>
            <div className="raqam text-left text-[24px] leading-tight font-semibold tracking-[-0.02em]">
              {pulKorsat(savatJami)}
            </div>
            {chegirma !== null && chegirma !== 0 && (
              <div className="mt-1 text-[12px] text-belgi-sariq">
                {chegirma > 0
                  ? `chegirma ${pulKorsat(som(chegirma.toFixed(2)))}`
                  : `qo'shimcha haq ${pulKorsat(som(Math.abs(chegirma).toFixed(2)))}`}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={kutilmoqda || savat.length === 0}
            className="fokus w-full rounded-maydon bg-brend px-5 py-3 text-[14px] font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq disabled:opacity-50"
          >
            {kutilmoqda ? 'Saqlanmoqda…' : 'Buyurtmani saqlash'}
          </button>
        </div>
      </aside>
    </form>
  );
}

/** TZ 3.10 — mijoz MAJBURIY EMAS: ko'chadagi tasodifiy xaridor. */
function MijozTanlash({
  tanlangan,
  ozgartir,
  qoshaOladi,
  guruhlar,
}: {
  tanlangan: SotuvMijozi | null;
  ozgartir: (m: SotuvMijozi | null) => void;
  qoshaOladi: boolean;
  /** TZ 6.3 — modaldagi yangi mijozga guruh tanlash uchun */
  guruhlar: readonly { id: number; nom: string }[];
}) {
  const [matn, matnniOzgartir] = useState('');
  const [topilgan, topilganniOzgartir] = useState<readonly SotuvMijozi[]>([]);
  const [qidirilmoqda, qidirilmoqdaOzgartir] = useState(false);
  const [modalOchiq, modalniOzgartir] = useState(false);

  const izlanayotgan = matn.trim();

  /**
   * ⚠️ Modalda TO'LIQ mijoz kartochkasi to'ldiriladi: telefon,
   *    shaxs turi, offset, qarz limiti. Ilgari bu yerda faqat ism
   *    so'ralardi va qolgani keyin qo'shilishi kerak edi —
   *    ko'pincha unutilardi.
   *
   * ⚠️ Yangi mijozning OFFSETI shu yerda ma'lum emas: modal faqat
   *    raqam va ismni qaytaradi. Shuning uchun narx odatdagi
   *    filial narxida qoladi va offset sahifa yangilangach
   *    ishlaydi. Boshqacha qilish uchun mijozni qaytadan
   *    qidirtirish kerak bo'lardi — u ish oqimini uzardi.
   */
  function modaldaYaratildi(m: { id: number; ism: string }): void {
    ozgartir({
      id: m.id,
      ism: m.ism,
      telefon: null,
      qarzLimiti: null,
      offsetTuri: null,
      offsetQiymat: null,
      guruhNomi: null,
      guruhOffsetTuri: null,
      guruhOffsetQiymat: null,
    });
    matnniOzgartir('');
    topilganniOzgartir([]);
    modalniOzgartir(false);
  }

  async function qidir(q: string): Promise<void> {
    matnniOzgartir(q);
    if (q.trim().length < 2) {
      topilganniOzgartir([]);
      return;
    }
    qidirilmoqdaOzgartir(true);
    try {
      const j = await fetch(`/api/mijoz-qidir?q=${encodeURIComponent(q)}`);
      topilganniOzgartir((await j.json()) as SotuvMijozi[]);
    } catch {
      topilganniOzgartir([]);
    } finally {
      qidirilmoqdaOzgartir(false);
    }
  }

  if (tanlangan !== null) {
    return (
      <div className="rounded-karta border border-chegara bg-fon px-4 py-3 text-sm">
        <div className="font-medium">{tanlangan.ism}</div>
        <div className="text-xs text-matn-kuchsiz">{tanlangan.telefon ?? '—'}</div>

        {/*
          ⚠️ Chegirma KO'RINIB TURADI (3.10). Sotuvchi «narx nega
             bunday?» degan savolga darrov javob bera olsin.
             Shaxsiy chegirma bo'lsa guruhniki qo'llanmaydi —
             shuning uchun ikkalasi birdan yozilmaydi.
        */}
        {tanlangan.offsetTuri !== null ? (
          <div className="mt-1 text-xs text-brend">
            Shaxsiy chegirma: {chegirmaMatni(tanlangan.offsetTuri, tanlangan.offsetQiymat)}
          </div>
        ) : tanlangan.guruhOffsetTuri !== null ? (
          <div className="mt-1 text-xs text-brend">
            {tanlangan.guruhNomi ?? 'Guruh'}:{' '}
            {chegirmaMatni(tanlangan.guruhOffsetTuri, tanlangan.guruhOffsetQiymat)}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            ozgartir(null);
          }}
          className="mt-2 text-xs text-matn-kuchsiz underline underline-offset-2 hover:text-matn"
        >
          boshqa mijoz
        </button>
      </div>
    );
  }

  /**
   * ⚠️ `<Maydon>` (ya'ni `<label>`) ISHLATILMAYDI.
   *
   *    HTML da `<label>` ichiga tugma qo'yish taqiqlangan: brauzer
   *    bosishni tugmaga emas, kirish maydoniga yo'naltiradi va
   *    topilgan mijozni TANLAB BO'LMASDI.
   */
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="mijoz" className="text-sm font-medium text-matn-ikki">
        Mijoz
      </label>

      <input
        id="mijoz"
        value={matn}
        onChange={(e) => {
          void qidir(e.target.value);
        }}
        placeholder="Ism yoki telefon"
        autoComplete="off"
        className={kirishUslubi(false)}
      />

      {qidirilmoqda && <span className="text-xs text-matn-kuchsiz">qidirilmoqda…</span>}

      {topilgan.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-maydon border border-chegara bg-sirt">
          {topilgan.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                ozgartir(m);
                matnniOzgartir('');
                topilganniOzgartir([]);
              }}
              className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-fon"
            >
              {m.ism}
              <span className="ml-2 text-xs text-matn-kuchsiz">{m.telefon ?? ''}</span>
            </button>
          ))}
        </div>
      )}

      {/*
        ⚠️ SUKUT SAQLAMAYDI. Ilgari bitta harf yozilsa hech narsa
           bo'lmasdi va odam «qidiruv ishlamayapti» deb o'ylardi.
           Endi nima kutilayotgani aytiladi.
      */}
      {izlanayotgan.length === 1 && (
        <span className="text-xs text-matn-kuchsiz">yana bitta harf yozing…</span>
      )}

      {izlanayotgan.length >= 2 && !qidirilmoqda && topilgan.length === 0 && (
        <span className="text-xs text-matn-kuchsiz">
          «{izlanayotgan}» bo&apos;yicha mijoz topilmadi
        </span>
      )}

      <span className="text-xs text-matn-kuchsiz">
        Majburiy emas — ko&apos;chadagi xaridorga ham sotiladi (3.10)
      </span>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        {qoshaOladi && (
          <button
            type="button"
            onClick={() => {
              modalniOzgartir(true);
            }}
            className="fokus rounded-maydon px-1 py-0.5 text-[12px] font-medium text-brend transition-colors hover:underline"
          >
            + Yangi mijoz
          </button>
        )}

        {/* ⚠️ Yangi oynada — yarim yozilgan buyurtma tashlab ketilmasin */}
        <a
          href="/mijoz"
          target="_blank"
          rel="noopener"
          className="fokus rounded-maydon px-1 py-0.5 text-[12px] text-matn-kuchsiz transition-colors hover:text-matn hover:underline"
        >
          Ro&apos;yxat ↗
        </a>
      </div>

      <Modal
        ochiq={modalOchiq}
        yop={() => {
          modalniOzgartir(false);
        }}
        sarlavha="Yangi mijoz"
        izoh="Saqlangach buyurtmaga darhol biriktiriladi"
        keng
        bolalar={
          <MijozFormasi
            amal={mijozModalYaratAmali}
            /**
             * ⚠️ Qidiruvga yozilgan ism formaga o'tkaziladi —
             *    sotuvchi uni ikkinchi marta terib o'tirmasin.
             */
            qiymatlar={{ ...MIJOZ_BOSH_QIYMATLAR, ism: izlanayotgan }}
            tugmaMatni="Saqlash"
            guruhlar={guruhlar}
            saqlandi={modaldaYaratildi}
            bekor={() => {
              modalniOzgartir(false);
            }}
          />
        }
      />
    </div>
  );
}
