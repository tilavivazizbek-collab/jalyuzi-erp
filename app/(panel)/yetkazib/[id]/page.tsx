import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { yetkazibTahrirlaAmali } from '../amal';
import type { FormaHolati } from '../holat';
import { YetkazibFormasi, type YetkazibQiymatlari } from '../forma';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { joriyKurs } from '@/lib/amal/kurs';
import { yetkazibBalansi } from '@/lib/amal/yetkazib-tolov';
import { tolovKassalari } from '@/app/(panel)/buyurtma/malumot';
import { YetkazibTolovFormasi } from '../tolov-forma';
import { Tablar } from '../../qism';
import { OchirTugma } from '../../ochir-tugma';
import {
  davolarNatijasi,
  kursFarqiJami,
  kutilayotganTolovlar,
  narxSolishtirish,
  ombordaQolgan,
  tolovIntizomimiz,
  type DavolarNatijasi,
  type KursFarqiJami,
  type KutilayotganTolov,
  type NarxSolishtirish,
  type OmbordaQolgan,
  type TolovIntizomimiz,
} from './malumot';
import {
  davolar,
  kirimlar,
  materialNarxTarixi,
  izohlar,
  qarzHarakati,
  sarlavhaBloklari,
  tolovlar,
} from '../malumot';
import {
  DavolarTabi,
  IzohlarTabi,
  KirimlarTabi,
  MateriallarTabi,
  QarzTabi,
  TolovlarTabi,
} from '../tablar';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly nom: string;
  readonly nima_yetkazadi: string | null;
  readonly kontakt_shaxs: string | null;
  readonly telefon: string | null;
  readonly qoshimcha_telefon: string | null;
  readonly manzil: string | null;
  readonly bank_nomi: string | null;
  readonly hisob_raqam: string | null;
  readonly inn: string | null;
  readonly mfo: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly valyuta: string;
  readonly eslatma: string | null;
}

const m = (x: string | null): string => x ?? '';

export default async function YetkazibTahrirlash({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  /** ⚠️ Tab MANZILDA turadi — sahifa yangilansa ham o'sha joyda qoladi */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  /**
   * ⚠️ KO'RISH uchun `yetkazib.kor` YETARLI.
   *
   *    Ilgari sahifa `yetkazib.ozgartir` ni talab qilardi — omborchida
   *    esa u YO'Q. Ya'ni kirim qiladigan odam yetkazuvchi
   *    kartochkasini, uning qarzini va bank rekvizitlarini
   *    UMUMAN ocholmasdi. Tahrirlash formasi pastda alohida
   *    yopiladi.
   */
  const f = await sahifaRuxsati('yetkazib.kor');
  const tahrirlayOladi = ruxsatBormi(f, 'yetkazib.ozgartir');

  const { id } = await params;
  const yetkazibId = Number(id);
  if (!Number.isSafeInteger(yetkazibId) || yetkazibId <= 0) notFound();

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT * FROM yetkazib_beruvchi WHERE id = ${yetkazibId}`;
  const y = qatorlar[0];
  if (y === undefined) notFound();

  const qiymatlar: YetkazibQiymatlari = {
    nom: y.nom,
    nimaYetkazadi: m(y.nima_yetkazadi),
    kontaktShaxs: m(y.kontakt_shaxs),
    telefon: m(y.telefon),
    qoshimchaTelefon: m(y.qoshimcha_telefon),
    manzil: m(y.manzil),
    bankNomi: m(y.bank_nomi),
    hisobRaqam: m(y.hisob_raqam),
    inn: m(y.inn),
    mfo: m(y.mfo),
    tolovMuddatiKun: y.tolov_muddati_kun === null ? '' : String(y.tolov_muddati_kun),
    valyuta: y.valyuta,
    eslatma: m(y.eslatma),
  };

  /**
   * ⚠️ 2026-08-30 — qarz va to'lov SHU YERDA. Ilgari kartochkada
   *    faqat tahrirlash formasi turardi: qarz qancha ekanini
   *    ko'rish ham, to'lash ham mumkin emas edi.
   */
  const sql = ulanishOl();
  const tolovQilaOladi = ruxsatBormi(f, 'kassa.tolov');

  const [qarzlar, kassalar, kurs, bloklar, qarzQatorlari, hujjatlar, tolovQatorlari, materiallar, davoQatorlari, izohQatorlari] =
    await Promise.all([
      yetkazibBalansi(sql, yetkazibId),
      tolovQilaOladi ? tolovKassalari(f.filialId, f.xodimId) : Promise.resolve([]),
      joriyKurs(sql),
      sarlavhaBloklari(yetkazibId),
      qarzHarakati(yetkazibId),
      kirimlar(yetkazibId),
      tolovlar(yetkazibId),
      materialNarxTarixi(yetkazibId),
      davolar(yetkazibId),
      izohlar(yetkazibId),
    ]);

  const s = await searchParams;
  const xomTab = typeof s['tab'] === 'string' ? s['tab'] : 'qarz';
  const TABLAR = ['qarz', 'kirimlar', 'tolovlar', 'materiallar', 'davolar', 'izohlar'];
  const tab = TABLAR.includes(xomTab) ? xomTab : 'qarz';

  /** 9.9 — hal qilinmagan da'volar tabda raqam bo'lib turadi */
  const ochiqDavo = davoQatorlari.filter((d) => !d.yopilgan && d.turi === 'QAYTARILADI').length;

  const amal = async (holat: FormaHolati, forma: FormData): Promise<FormaHolati> => {
    'use server';
    return yetkazibTahrirlaAmali(yetkazibId, holat, forma);
  };

  const [intizom, kutilayotgan, solishtirish, kursFarqi, ombor, davoNatija] =
    await Promise.all([
      tolovIntizomimiz(yetkazibId),
      kutilayotganTolovlar(yetkazibId),
      narxSolishtirish(yetkazibId),
      kursFarqiJami(yetkazibId),
      ombordaQolgan(yetkazibId),
      davolarNatijasi(yetkazibId),
    ]);

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <Link href="/yetkazib" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Yetkazib beruvchilar
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">{y.nom}</h1>
          {/*
            ⚠️ Mijozda «hisob-kitob varaqasi» bor edi, yetkazuvchida
               YO'Q edi. B2B da bu har oy kerak bo'ladigan hujjat.
          */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/yetkazib/${String(yetkazibId)}/solishtirish`}
              className="fokus rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-sm text-matn-ikki transition-all hover:bg-fon active:scale-[0.98]"
            >
              Solishtirish akti
            </Link>
            {/*
              ⚠️ «O'chirish» — aslida NOFAOL qilish (§3): yozuv qoladi,
                 ro'yxatdan yo'qoladi. Qarzi yoki kirimi bo'lsa
                 `nofaol.ts` to'sadi va SABABINI aytadi.
            */}
            {tahrirlayOladi && <OchirTugma tur="yetkazib" id={yetkazibId} nom={y.nom} />}
          </div>
        </div>
      </div>

      {/* ── TZ 9.7 · Ikki blok: qarzimiz va hamkorlik ── */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-karta border border-chegara bg-sirt p-5">
          <h2 className="mb-3 text-sm font-semibold text-matn">Qarzimiz</h2>

          {bloklar.qarz.qarzlar.length === 0 ? (
            <p className="text-sm text-belgi-yashil">Qarz yo&apos;q — hisob toza.</p>
          ) : (
            <dl className="flex flex-wrap gap-5">
              {bloklar.qarz.qarzlar.map((q) => (
                <div key={q.valyuta}>
                  <dt className="text-xs text-matn-kuchsiz">
                    {q.valyuta === 'USD' ? '$' : "so'm"}
                  </dt>
                  <dd
                    className={`raqam text-[18px] font-semibold ${
                      Number(q.summa) > 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                    }`}
                  >
                    {pulKorsat(som(q.summa))}
                  </dd>
                  {Number(q.summa) < 0 && (
                    <p className="text-[12px] text-matn-kuchsiz">avans berilgan</p>
                  )}
                </div>
              ))}
            </dl>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-chegara pt-3 text-[13px]">
            <div>
              <dt className="text-xs text-matn-kuchsiz">Ochiq da&apos;vo</dt>
              <dd className={`raqam font-medium ${ochiqDavo > 0 ? 'text-belgi-sariq' : ''}`}>
                {ochiqDavo}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-matn-kuchsiz">Eng yaqin muddat</dt>
              <dd
                className={`raqam font-medium ${
                  bloklar.qarz.muddatOtdimi ? 'text-belgi-qizil' : ''
                }`}
              >
                {bloklar.qarz.yaqinMuddat ?? '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-karta border border-chegara bg-sirt p-5">
          <h2 className="mb-3 text-sm font-semibold text-matn">Hamkorlik</h2>
          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <dt className="text-xs text-matn-kuchsiz">Hamkor bo&apos;lgan</dt>
              <dd className="raqam font-medium">{bloklar.hamkorlik.hamkorSana ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-matn-kuchsiz">Oxirgi kirim</dt>
              <dd className="raqam font-medium">{bloklar.hamkorlik.oxirgiKirim ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-matn-kuchsiz">Hujjatlar</dt>
              <dd className="raqam font-medium">{bloklar.hamkorlik.hujjatSoni}</dd>
            </div>
            <div>
              <dt className="text-xs text-matn-kuchsiz">Brak ulushi</dt>
              <dd
                className={`raqam font-medium ${
                  bloklar.hamkorlik.brakUlushi > 5 ? 'text-belgi-qizil' : ''
                }`}
              >
                {bloklar.hamkorlik.brakUlushi}%
              </dd>
            </div>
            {bloklar.hamkorlik.jamiKirim.length > 0 && (
              <div className="col-span-2 border-t border-chegara pt-2">
                <dt className="text-xs text-matn-kuchsiz">Jami kirim</dt>
                <dd className="raqam font-medium">
                  {bloklar.hamkorlik.jamiKirim
                    .map((j) => `${pulKorsat(som(j.summa))} ${j.valyuta === 'USD' ? '$' : "so'm"}`)
                    .join(' · ')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* ── Rekvizitlar va qaror raqamlari ── */}
      <Rekvizitlar y={y} />
      <QarorRaqamlari
        intizom={intizom}
        kursFarqi={kursFarqi}
        ombor={ombor}
        davo={davoNatija}
      />
      <KutilayotganTolovlar qatorlar={kutilayotgan} />
      <NarxSolishtirish qatorlar={solishtirish} />

      {/* ── TZ 9.5 · To'lov ── */}
      <section className="rounded-karta border border-chegara bg-sirt p-6">
        <h2 className="mb-3 text-sm font-semibold text-matn">Hisob-kitob</h2>

        {qarzlar.length === 0 ? (
          <p className="text-sm text-belgi-yashil">Qarz yo&apos;q — hisob toza.</p>
        ) : (
          <dl className="flex flex-wrap gap-6">
            {qarzlar.map((q) => (
              <div key={q.valyuta}>
                <dt className="text-xs text-matn-kuchsiz">
                  Qarz{qarzlar.length > 1 && ` (${q.valyuta === 'USD' ? '$' : "so'm"})`}
                </dt>
                {/*
                  ⚠️ Musbat — biz qarzdormiz. Manfiy bo'lsa avans
                     berib qo'yganmiz, ya'ni ular qarzdor.
                */}
                <dd
                  className={`raqam text-[18px] font-semibold ${
                    Number(q.qarz) > 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                  }`}
                >
                  {pulKorsat(som(q.qarz))}{' '}
                  <span className="text-xs font-normal text-matn-kuchsiz">
                    {q.valyuta === 'USD' ? '$' : "so'm"}
                  </span>
                </dd>
                {Number(q.qarz) < 0 && (
                  <p className="text-[12px] text-matn-kuchsiz">avans berilgan</p>
                )}
              </div>
            ))}
          </dl>
        )}

        {tolovQilaOladi && (
          <div className="mt-5 border-t border-chegara pt-5">
            <h3 className="mb-3 text-sm font-medium text-matn-ikki">To&apos;lov qilish</h3>
            <YetkazibTolovFormasi
              yetkazibBeruvchiId={yetkazibId}
              kassalar={kassalar}
              qarzlar={qarzlar}
              joriyKurs={kurs ?? ''}
            />
          </div>
        )}
      </section>

      {/* ── TZ 9.7 · Olti tab ── */}
      <section className="flex flex-col gap-4">
        <Tablar
          asos={`/yetkazib/${String(yetkazibId)}`}
          joriy={tab}
          tablar={[
            { kalit: 'qarz', nom: 'Qarz harakati', soni: qarzQatorlari.length },
            { kalit: 'kirimlar', nom: 'Kirimlar', soni: hujjatlar.length },
            { kalit: 'tolovlar', nom: "To'lovlar", soni: tolovQatorlari.length },
            { kalit: 'materiallar', nom: 'Materiallar', soni: materiallar.length },
            { kalit: 'davolar', nom: "Brak va da'volar", soni: ochiqDavo },
            { kalit: 'izohlar', nom: 'Izohlar' },
          ]}
        />

        {tab === 'qarz' && <QarzTabi qatorlar={qarzQatorlari} />}
        {tab === 'kirimlar' && <KirimlarTabi qatorlar={hujjatlar} />}
        {tab === 'tolovlar' && <TolovlarTabi qatorlar={tolovQatorlari} />}
        {tab === 'materiallar' && <MateriallarTabi qatorlar={materiallar} />}
        {tab === 'davolar' && <DavolarTabi qatorlar={davoQatorlari} />}
        {tab === 'izohlar' && (
          <IzohlarTabi
            yetkazibBeruvchiId={yetkazibId}
            izohlar={izohQatorlari}
            eslatma={y.eslatma}
          />
        )}
      </section>

      {tahrirlayOladi && (
        <div className="rounded-karta border border-chegara bg-sirt p-6">
          <YetkazibFormasi
            amal={amal}
            qiymatlar={qiymatlar}
            tugmaMatni="O'zgarishlarni saqlash"
          />
        </div>
      )}
    </div>
  );
}

// ─── Qaror raqamlari va rekvizitlar ─────────────────────────

function son(x: string | number): string {
  return Number(x)
    .toLocaleString('uz-UZ', { maximumFractionDigits: 2 })
    .replace(/,/g, ' ');
}

function Katak({
  sarlavha,
  qiymat,
  izoh,
  rang,
}: {
  sarlavha: string;
  qiymat: string;
  izoh?: string;
  rang?: string;
}) {
  return (
    <div className="rounded-karta border border-chegara bg-sirt px-4 py-3.5">
      <p className="text-[12px] font-medium tracking-[0.03em] text-matn-kuchsiz uppercase">
        {sarlavha}
      </p>
      <p className={`raqam mt-1 text-[18px] leading-none font-semibold ${rang ?? 'text-matn'}`}>
        {qiymat}
      </p>
      {izoh !== undefined && <p className="mt-1.5 text-[12px] text-matn-kuchsiz">{izoh}</p>}
    </div>
  );
}

/**
 * ⚠️ TO'LOV REKVIZITLARI KARTOCHKADA.
 *
 *    Ilgari INN, bank va hisob raqamni ko'rish uchun TAHRIRLASH
 *    FORMASINI ochish kerak edi — pul o'tkazayotganda aynan shular
 *    kerak bo'ladi (9.3).
 *
 * ⚠️ Telefon BOSILADIGAN: omborchi telefondan qo'ng'iroq qiladi.
 */
function Rekvizitlar({
  y,
}: {
  y: {
    telefon: string | null;
    qoshimcha_telefon: string | null;
    manzil: string | null;
    bank_nomi: string | null;
    hisob_raqam: string | null;
    inn: string | null;
    mfo: string | null;
    tolov_muddati_kun: number | null;
    eslatma: string | null;
  };
}) {
  const telefonlar = [y.telefon, y.qoshimcha_telefon].filter(
    (t): t is string => t !== null && t !== '',
  );

  const qatorlar: [string, string | null][] = [
    ['Manzil', y.manzil],
    ['INN', y.inn],
    ['Bank', y.bank_nomi],
    ['Hisob raqam', y.hisob_raqam],
    ['MFO', y.mfo],
    [
      "To'lov muddati",
      y.tolov_muddati_kun === null ? null : `${String(y.tolov_muddati_kun)} kun`,
    ],
    ['Eslatma', y.eslatma],
  ];

  const bor = qatorlar.filter(([, v]) => v !== null && v !== '');
  if (bor.length === 0 && telefonlar.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-matn-ikki">Rekvizitlar</h2>
      <div className="rounded-karta border border-chegara bg-fon px-4 py-3">
        {telefonlar.length > 0 && (
          <p className="mb-2 flex flex-wrap gap-x-4 text-sm">
            {telefonlar.map((t) => (
              <a key={t} href={`tel:${t}`} className="font-medium text-brend hover:underline">
                {t}
              </a>
            ))}
          </p>
        )}
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {bor.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-matn-kuchsiz">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * ⚠️ To'rt raqam — hammasi QARORGA ta'sir qiladi:
 *    qanday to'laymiz · kurs qancha yedi · qancha mol yotibdi ·
 *    da'volarga javob beradimi.
 */
function QarorRaqamlari({
  intizom,
  kursFarqi,
  ombor,
  davo,
}: {
  intizom: TolovIntizomimiz;
  kursFarqi: KursFarqiJami;
  ombor: OmbordaQolgan;
  davo: DavolarNatijasi;
}) {
  const farq = Number(kursFarqi.summa);
  const yotgan = Number(ombor.qoldiqQiymat);
  const jami = Number(ombor.jamiQiymat);
  const ulush = jami > 0 ? Math.round((yotgan / jami) * 100) : 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Katak
        sarlavha="Biz qanday to'laymiz"
        qiymat={intizom.ortachaKun === null ? '—' : `${String(intizom.ortachaKun)} kun`}
        izoh={
          intizom.ortachaKun === null
            ? "to'liq to'langan hujjat yo'q"
            : `eng uzuni ${String(intizom.engUzunKun ?? 0)} kun · ${String(
                intizom.tolanganSoni,
              )} hujjat`
        }
        rang={intizom.kechikkanSoni > 0 ? 'text-belgi-qizil' : undefined}
      />

      {/*
        ⚠️ TZ 9.6 — kurs tushsa DAROMAD. Xarajat ishorasi bo'yicha
           musbat = zarar, manfiy = daromad.
      */}
      <Katak
        sarlavha="Kurs farqi"
        qiymat={farq === 0 ? '—' : `${son(Math.abs(farq))} so'm`}
        izoh={
          kursFarqi.hodisaSoni === 0
            ? "dollarli to'lov bo'lmagan"
            : farq > 0
              ? `zarar · ${String(kursFarqi.hodisaSoni)} marta`
              : `daromad · ${String(kursFarqi.hodisaSoni)} marta`
        }
        rang={farq > 0 ? 'text-belgi-qizil' : farq < 0 ? 'text-belgi-yashil' : undefined}
      />

      {/* 11.7.6 — muzlab qolgan pul, yetkazuvchi kesimida */}
      <Katak
        sarlavha="Omborda yotibdi"
        qiymat={`${son(yotgan)} so'm`}
        izoh={
          jami > 0
            ? `olingandan ${String(ulush)}% · ${String(ombor.qoldiqBolak)} bo'lak`
            : undefined
        }
        rang={ulush > 70 ? 'text-belgi-sariq' : undefined}
      />

      {/*
        ⚠️ Brak FOIZI yetarli emas — muhimi yetkazuvchi JAVOB
           BERADIMI (9.9).
      */}
      <Katak
        sarlavha="Da'volar"
        qiymat={davo.jami === 0 ? '—' : `${String(davo.qabulQilingan)} / ${String(davo.jami)}`}
        izoh={
          davo.jami === 0
            ? "da'vo bo'lmagan"
            : `qabul qilgan · qaytargan ${son(davo.qaytarilgan)} so'm${
                davo.ochiq > 0 ? ` · ${String(davo.ochiq)} ochiq` : ''
              }`
        }
        rang={davo.ochiq > 0 ? 'text-belgi-sariq' : undefined}
      />
    </section>
  );
}

/** Bugun kimga pul o'tkazish kerakligi shu jadvaldan ko'rinadi */
function KutilayotganTolovlar({ qatorlar }: { qatorlar: readonly KutilayotganTolov[] }) {
  if (qatorlar.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-matn-ikki">To&apos;lanmagan hujjatlar</h2>
      <p className="mb-3 text-xs text-matn-kuchsiz">
        Muddati yaqinlari yuqorida. Muddat kiritilmagan hujjat kechikkan
        hisoblanmaydi (9.3).
      </p>

      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-4 py-2.5 font-medium">Hujjat</th>
              <th className="px-4 py-2.5 font-medium">Sana</th>
              <th className="px-4 py-2.5 font-medium">Muddat</th>
              <th className="px-4 py-2.5 text-right font-medium">Qoldiq</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {qatorlar.map((q) => {
              const otdi = q.kunQoldi !== null && q.kunQoldi < 0;
              return (
                <tr key={q.kirimId}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/ombor/kirim/${String(q.kirimId)}`}
                      className="font-mono text-xs text-brend hover:underline"
                    >
                      {q.raqam}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-matn-ikki">{q.sana}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {q.muddat === null ? (
                      <span className="text-matn-kuchsiz">—</span>
                    ) : (
                      <span className={otdi ? 'text-belgi-qizil' : ''}>
                        {q.muddat}
                        {q.kunQoldi !== null && (
                          <span className="ml-1.5 text-xs">
                            {otdi
                              ? `${String(Math.abs(q.kunQoldi))} kun o'tdi`
                              : `${String(q.kunQoldi)} kun qoldi`}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="raqam px-4 py-2.5 whitespace-nowrap font-medium">
                    {son(q.qoldiq)} {q.valyuta === 'USD' ? '$' : "so'm"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * ⚠️ Faqat BIR XIL valyuta va bir xil narx asosidagi narxlar
 *    solishtiriladi (1.3) — aks holda 4 $ va 50 000 so'm bir
 *    ustunda taqqoslanardi.
 */
function NarxSolishtirish({ qatorlar }: { qatorlar: readonly NarxSolishtirish[] }) {
  if (qatorlar.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-matn-ikki">Boshqada arzonroq</h2>
      <p className="mb-3 text-xs text-matn-kuchsiz">
        Har yetkazuvchidan OXIRGI narx olinadi. Eski narx bilan solishtirish
        noto&apos;g&apos;ri xulosa berardi.
      </p>

      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-4 py-2.5 font-medium">Material</th>
              <th className="px-4 py-2.5 text-right font-medium">Bizda</th>
              <th className="px-4 py-2.5 font-medium">Arzonroq</th>
              <th className="px-4 py-2.5 text-right font-medium">Farq</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {qatorlar.map((q) => (
              <tr key={q.materialId}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/ombor/${String(q.materialId)}`}
                    className="text-brend hover:underline"
                  >
                    {q.materialNom}
                  </Link>
                </td>
                <td className="raqam px-4 py-2.5 whitespace-nowrap">
                  {son(q.bizNarx)}
                  <span className="ml-1 text-xs text-matn-kuchsiz">{q.bizSana}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="raqam font-medium">{son(q.arzonNarx)}</span>
                  <span className="ml-2 text-xs text-matn-kuchsiz">
                    {q.arzonYetkazuvchi} · {q.arzonSana}
                  </span>
                </td>
                <td className="raqam px-4 py-2.5 text-right font-medium text-belgi-qizil">
                  −{String(q.farqFoiz)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
