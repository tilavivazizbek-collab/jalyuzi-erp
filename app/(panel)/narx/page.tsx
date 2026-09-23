import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { NarxFormasi } from './forma';
import { NarxMatritsasi } from './matritsa';
import {
  almashtirishGuruhlariniOl,
  materialQoidalariSoni,
  darajaQoidalariSoni,
  darajaQoplaganlar,
  narxMatritsasiniOl,
  filiallarniOl,
  joriyKursniOl,
  materiallarniOl,
  mijozTurlariniOl,
  narxGuruhlariniOl,
  turQoidalariniOl,
  turQoshimchalariniOl,
  turlarniOl,
} from './malumot';

export const dynamic = 'force-dynamic';

/**
 * «Narxlar va turlar» — egasi qarori 2026-09-20 · TZ 3.8 · 6.2 · 20.9
 *
 * ⚠️ Ilgari mijoz narxi MATERIALLARDAN yig'ilardi. Egasi buni rad
 *    etdi: «endi men belgilab qo'yaman mijozga narx qanday
 *    hisoblanishini».
 *
 * ⚠️ Chap ustunda turlar, o'ngda tanlanganining narx jadvali.
 *    Turlar orasida o'tish HAVOLA bilan — narx jadvali uzun bo'ladi
 *    va tanlov brauzer tarixida qolishi kerak.
 */
export default async function NarxSahifasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('mahsulot.kor');
  const ozgartiraOladi = ruxsatBormi(f, 'narx.standart.ozgartir');

  /**
   * ⚠️ `?tur=material` — «MATERIALNI O'ZI SOTISH» (egasi qarori
   *    2026-09-20). Mato metrlab sotilganda mahsulot turi yo'q,
   *    narx esa baribir kerak.
   */
  const sp = await searchParams;
  const xomTur = sp['tur'];
  const materialTanlandi = xomTur === 'material';
  /**
   * `?tur=daraja` — DARAJAGA UMUMIY NARX (0055).
   *
   * ⚠️ Egasi: «1 ta narx darajasidan 5 xil yoki 10 xil mahsulot
   *    turishi mumkin». To'qqiz tur × uch daraja = 27 qator edi;
   *    bu yerda uchta qator yozilsa hamma tur sotiladigan bo'ladi.
   *
   * ⚠️ Muharrirning O'ZI qayta ishlatiladi — bosqichlar,
   *    valyuta, mijoz turi, filial, tekshirish kalkulyatori
   *    hammasi bir xil. Ikkinchi muharrir yozilsa ular
   *    bir-biridan ajralib ketardi (CLAUDE.md §3).
   */
  const darajaTanlandi = xomTur === 'daraja';
  const soralgan = typeof xomTur === 'string' ? Number(xomTur) : Number.NaN;

  const turlar = await turlarniOl();
  const tanlangan = materialTanlandi || darajaTanlandi
    ? null
    : (turlar.find((t) => t.id === soralgan) ?? turlar[0] ?? null);

  const [
    guruhlar,
    materiallar,
    almashtirishGuruhlari,
    mijozTurlari,
    filiallar,
    kursQiymati,
    materialQoidaSoni,
    matritsa,
    darajaQoidaSoni,
    darajaQoplagan,
  ] = await Promise.all([
      narxGuruhlariniOl(),
      materiallarniOl(),
      almashtirishGuruhlariniOl(),
      mijozTurlariniOl(),
      filiallarniOl(),
      joriyKursniOl(),
      materialQoidalariSoni(),
      narxMatritsasiniOl(),
      darajaQoidalariSoni(),
      darajaQoplaganlar(),
    ]);

  /** Materialni o'zi sotishda tur yo'q — `null` beriladi */
  const tanlanganId = materialTanlandi || darajaTanlandi ? null : (tanlangan?.id ?? null);

  const [qoidalar, qoshimchalar] =
    tanlangan === null && !materialTanlandi && !darajaTanlandi
      ? [[], []]
      : await Promise.all([
          /** ⚠️ 0055 — daraja rejimida BOSHQA qatorlar olinadi */
          turQoidalariniOl(tanlanganId, darajaTanlandi),
          turQoshimchalariniOl(tanlanganId),
        ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Narxlar va turlar
        </h1>
        <p className="mt-0.5 text-[13px] text-matn-ikki">
          Mijozga narx qanday hisoblanishini shu yerda belgilaysiz
        </p>
      </div>

      {/*
        ⚠️ NARX XARITASI — soha auditi 2026-09-22.

           Eng tepada turadi: egasi sahifani ochganda birinchi
           ko'radigan narsa «qayerda teshik bor» degan javob
           bo'lsin. Ilgari bu savolga javob faqat SOTUV paytida,
           mijoz oldida chiqardi.
      */}
      <NarxMatritsasi
        turlar={turlar}
        guruhlar={guruhlar}
        kataklar={matritsa}
        darajaQoplagan={darajaQoplagan}
      />

      {turlar.length === 0 ? (
        <p className="rounded-maydon border border-chegara p-4 text-sm text-matn-kuchsiz">
          Hali birorta mahsulot turi yaratilmagan.{' '}
          <Link href="/mahsulot" className="text-brend hover:underline">
            Tur yig&apos;ish
          </Link>{' '}
          sahifasidan boshlang.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* ─── Turlar ro'yxati ──────────────────────────────────────── */}
          <nav className="flex flex-col gap-1">
            {/*
              ⚠️ ALOHIDA BAND — mahsulot turi emas. Mijoz «menga 5 metr
                 shu matodan» desa tur yo'q, narx esa baribir kerak.
                 Bazada bu `mahsulot_tur_id IS NULL` qatorlari.
            */}
            {/*
              ── DARAJAGA UMUMIY NARX — 0055 ─────────────────

              Egasi: «1 ta narx darajasidan 5 xil yoki 10 xil
              mahsulot turishi mumkin».

              ⚠️ BIRINCHI BAND — ataylab. To'qqiz tur × uch daraja
                 = 27 qator, bu yerda esa UCHTA qator yetadi.
                 Egasi ishni shu yerdan boshlashi kerak, turdan
                 emas: turga alohida qator faqat FARQ bo'lganda
                 yoziladi.
            */}
            <Link
              href="/narx?tur=daraja"
              className={`flex items-center justify-between rounded-maydon px-3 py-2 text-sm transition-colors ${
                darajaTanlandi
                  ? 'bg-brend/10 font-medium text-brend'
                  : 'text-matn-ikki hover:bg-fon-ikki'
              }`}
            >
              <span className="truncate">Darajaga umumiy narx</span>
              <span
                className={`ml-2 shrink-0 text-[11px] ${
                  darajaQoidaSoni === 0 ? 'text-belgi-sariq' : 'text-matn-kuchsiz'
                }`}
                title={
                  darajaQoidaSoni === 0
                    ? "Qo'yilmagan — har tur uchun alohida narx kerak bo'ladi"
                    : `${String(darajaQoidaSoni)} daraja`
                }
              >
                {darajaQoidaSoni === 0 ? '—' : darajaQoidaSoni}
              </span>
            </Link>

            <Link
              href="/narx?tur=material"
              className={`flex items-center justify-between rounded-maydon px-3 py-2 text-sm transition-colors ${
                materialTanlandi
                  ? 'bg-brend/10 font-medium text-brend'
                  : 'text-matn-ikki hover:bg-fon-ikki'
              }`}
            >
              <span className="truncate">Materialni o&apos;zi sotish</span>
              <span
                className={`ml-2 shrink-0 text-[11px] ${
                  materialQoidaSoni === 0 ? 'text-belgi-qizil' : 'text-matn-kuchsiz'
                }`}
                title={
                  materialQoidaSoni === 0
                    ? "Narx qo'yilmagan — mato metrlab sotilmaydi"
                    : `${String(materialQoidaSoni)} daraja`
                }
              >
                {materialQoidaSoni === 0 ? '⚠' : materialQoidaSoni}
              </span>
            </Link>

            <div className="my-1 border-t border-chegara" />

            {turlar.map((t) => {
              const faolmi = tanlangan !== null && t.id === tanlangan.id;
              return (
                <Link
                  key={t.id}
                  href={`/narx?tur=${String(t.id)}`}
                  className={`flex items-center justify-between rounded-maydon px-3 py-2 text-sm transition-colors ${
                    faolmi
                      ? 'bg-brend/10 font-medium text-brend'
                      : 'text-matn-ikki hover:bg-fon-ikki'
                  }`}
                >
                  <span className="truncate">{t.nom}</span>
                  {/*
                    ⚠️ Narxsiz tur sotuvda ISHLAMAYDI — sotuvchi
                       «narx qo'yilmagan» xabarini oladi. Shuning
                       uchun belgi ro'yxatda turadi.
                  */}
                  {/*
                    ⚠️ QO'SHIMCHA SONI HAM KO'RSATILADI — 2026-09-21.
                       `qoshimchaSoni` so'rovda sanalar, lekin hech
                       qayerda chizilmasdi: har sahifa ochilganda
                       bekorga hisoblanardi. Endi u ish qiladi —
                       egasi qaysi turga qo'shimcha qo'yganini
                       ro'yxatdan ko'radi.
                  */}
                  <span
                    className={`ml-2 shrink-0 text-[11px] ${
                      t.qoidaSoni === 0 ? 'text-belgi-qizil' : 'text-matn-kuchsiz'
                    }`}
                    title={
                      t.qoidaSoni === 0
                        ? "Narx qo'yilmagan — bu tur sotilmaydi"
                        : `${String(t.qoidaSoni)} narx qatori·${String(t.qoshimchaSoni)} qo'shimcha`
                    }
                  >
                    {t.qoidaSoni === 0 ? '⚠' : t.qoidaSoni}
                    {t.qoshimchaSoni > 0 && (
                      <span className="text-matn-kuchsiz"> +{t.qoshimchaSoni}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* ─── Tanlangan turning narxi ──────────────────────────────── */}
          {tanlangan === null && !materialTanlandi && !darajaTanlandi ? null : (
            <NarxFormasi
              key={
                darajaTanlandi
                  ? 'daraja'
                  : materialTanlandi
                    ? 'material'
                    : String(tanlangan?.id ?? 0)
              }
              turId={materialTanlandi || darajaTanlandi ? null : (tanlangan?.id ?? 0)}
              turNomi={
                darajaTanlandi
                  ? "Darajaga umumiy narx"
                  : materialTanlandi
                    ? "Materialni o'zi sotish"
                    : (tanlangan?.nom ?? '')
              }
              hammaTurga={darajaTanlandi}
              /* ⚠️ Narxi BOR turlar; o'zi chiqariladi — o'zidan nusxa ma'nosiz */
              nusxaTurlari={turlar.filter(
                (t) => t.qoidaSoni > 0 && t.id !== (tanlangan?.id ?? 0),
              )}
              guruhlar={guruhlar}
              qoidalar={qoidalar}
              qoshimchalar={qoshimchalar}
              materiallar={materiallar}
              almashtirishGuruhlari={almashtirishGuruhlari}
              mijozTurlari={mijozTurlari}
              filiallar={filiallar}
              kursQiymati={kursQiymati}
              ozgartiraOladi={ozgartiraOladi}
            />
          )}
        </div>
      )}
    </div>
  );
}
