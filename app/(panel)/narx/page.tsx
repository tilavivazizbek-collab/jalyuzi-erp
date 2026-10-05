import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { NarxFormasi } from './forma';
import { NarxMatritsasi } from './matritsa';
import {
  almashtirishGuruhlariniOl,
  materialJadvallariniOl,
  materialQoidalariSoni,
  standartNarxBormi,
  narxMatritsasiniOl,
  filiallarniOl,
  joriyKursniOl,
  materiallarniOl,
  mijozTurlariniOl,
  turQoidalariniOl,
  turQoshimchalariniOl,
  turlarniOl,
} from './malumot';

export const dynamic = 'force-dynamic';

/**
 * «Narxlar» — egasi qarori 2026-09-20 · TZ 3.8 · 6.2 · 20.9
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
   * `?material=<id>` — 0059, egasi qarori 2026-09-24.
   *
   * ⚠️ Bo'sh bo'lsa UMUMIY jadval tahrirlanadi: u alohida jadvali
   *    yo'q hamma materialga tegishli. Aynan shu 0059 gacha yagona
   *    holat edi va karniz bilan pultni bir narxga bog'lab
   *    qo'ygandi.
   */
  const xomMaterial = sp['material'];
  const tanlanganMaterial =
    typeof xomMaterial === 'string' && Number.isInteger(Number(xomMaterial))
      ? Number(xomMaterial)
      : null;
  /**
   * `?tur=umumiy` — HAMMA TUR UCHUN STANDART NARX (0055).
   *
   * ⚠️ Egasi: «1 ta narx darajasidan 5 xil yoki 10 xil mahsulot
   *    turishi mumkin». Har turga alohida qator yozish o'rniga
   *    bu yerda bitta qator yozilsa hamma tur sotiladigan bo'ladi.
   *
   * ⚠️ Muharrirning O'ZI qayta ishlatiladi — bosqichlar,
   *    valyuta, mijoz turi, filial, tekshirish kalkulyatori
   *    hammasi bir xil. Ikkinchi muharrir yozilsa ular
   *    bir-biridan ajralib ketardi (CLAUDE.md §3).
   */
  /**
   * ⚠️ 0057 — bu rejim ilgari `?tur=daraja` edi va MATO DARAJASINI
   *    bildirardi. Daraja olib tashlangach ma'nosi butunlay
   *    boshqacha: «alohida narxi yo'q HAMMA turga standart».
   *    Eski nom qolsa keyingi o'qigan odam darajani izlab yurardi.
   */
  const umumiyTanlandi = xomTur === 'umumiy';
  const soralgan = typeof xomTur === 'string' ? Number(xomTur) : Number.NaN;

  const turlar = await turlarniOl();
  const tanlangan = materialTanlandi || umumiyTanlandi
    ? null
    : (turlar.find((t) => t.id === soralgan) ?? turlar[0] ?? null);

  const [
    materiallar,
    almashtirishGuruhlari,
    mijozTurlari,
    filiallar,
    kursQiymati,
    materialQoidaSoni,
    matritsa,
    standartBormi,
    materialJadvallari,
  ] = await Promise.all([
      materiallarniOl(),
      almashtirishGuruhlariniOl(),
      mijozTurlariniOl(),
      filiallarniOl(),
      joriyKursniOl(),
      materialQoidalariSoni(),
      narxMatritsasiniOl(),
      standartNarxBormi(),
      materialJadvallariniOl(),
    ]);

  /** Materialni o'zi sotishda tur yo'q — `null` beriladi */
  const tanlanganId = materialTanlandi || umumiyTanlandi ? null : (tanlangan?.id ?? null);

  const [qoidalar, qoshimchalar] =
    tanlangan === null && !materialTanlandi && !umumiyTanlandi
      ? [[], []]
      : await Promise.all([
          /** ⚠️ 0055 — umumiy rejimda BOSHQA qatorlar olinadi */
          turQoidalariniOl(
            tanlanganId,
            umumiyTanlandi,
            materialTanlandi ? tanlanganMaterial : null,
          ),
          turQoshimchalariniOl(tanlanganId),
        ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Narxlar
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
        kataklar={matritsa}
        standartBormi={standartBormi}
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
              ── HAMMA TUR UCHUN STANDART NARX — 0055 ────────

              Egasi: «1 ta narx darajasidan 5 xil yoki 10 xil
              mahsulot turishi mumkin» — shu muammoning yechimi.

              ⚠️ BIRINCHI BAND — ataylab. To'qqiz turga alohida
                 qator yozish o'rniga bu yerda BITTA qator yetadi.
                 Egasi ishni shu yerdan boshlashi kerak: turga
                 alohida qator faqat FARQ bo'lganda yoziladi.
            */}
            <Link
              href="/narx?tur=umumiy"
              className={`flex items-center justify-between rounded-maydon px-3 py-2 text-sm transition-colors ${
                umumiyTanlandi
                  ? 'bg-brend/10 font-medium text-brend'
                  : 'text-matn-ikki hover:bg-fon-ikki'
              }`}
            >
              <span className="truncate">Hamma tur uchun standart</span>
              <span
                className={`ml-2 shrink-0 text-[11px] ${
                  standartBormi ? 'text-matn-kuchsiz' : 'text-belgi-sariq'
                }`}
                title={
                  standartBormi
                    ? "Qo'yilgan — alohida narxi yo'q turlar shundan oladi"
                    : "Qo'yilmagan — har tur uchun alohida narx kerak bo'ladi"
                }
              >
                {standartBormi ? '✓' : '—'}
              </span>
            </Link>

            <Link
              href="/narx?tur=material"
              className={`flex items-center justify-between rounded-maydon px-3 py-2 text-sm transition-colors ${
                materialTanlandi && tanlanganMaterial === null
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
                    : `${String(materialQoidaSoni)} qator`
                }
              >
                {materialQoidaSoni === 0 ? '⚠' : materialQoidaSoni}
              </span>
            </Link>

            {/*
              ── ALOHIDA JADVALI BOR MATERIALLAR — 0059 ──────

              ⚠️ Faqat JADVALI BORLARI ko'rsatiladi, hamma material
                 emas. O'nlab mato ro'yxatga chiqsa chap ustun
                 o'qib bo'lmas holga kelardi va egasi aynan shu
                 ekranda «qayerdan boshlashni topolmadim» degandi.

                 Yangi material uchun jadval «Materialni o'zi
                 sotish» ichidan ochiladi.
            */}
            {materialTanlandi &&
              materialJadvallari.map((j) => {
                const nomi =
                  materiallar.find((m) => m.id === j.materialId)?.nom ??
                  `#${String(j.materialId)}`;
                return (
                  <Link
                    key={j.materialId}
                    href={`/narx?tur=material&material=${String(j.materialId)}`}
                    className={`ml-3 flex items-center justify-between rounded-maydon px-3 py-1.5 text-[13px] transition-colors ${
                      tanlanganMaterial === j.materialId
                        ? 'bg-brend/10 font-medium text-brend'
                        : 'text-matn-ikki hover:bg-fon-ikki'
                    }`}
                  >
                    <span className="truncate">↳ {nomi}</span>
                    <span className="ml-2 shrink-0 text-[11px] text-matn-kuchsiz">
                      {j.soni}
                    </span>
                  </Link>
                );
              })}

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
          {tanlangan === null && !materialTanlandi && !umumiyTanlandi ? null : (
            <div className="flex min-w-0 flex-col gap-3">
            {/*
              ⚠️ TARKIBGA QAYTISH — egasi savoli 2026-10-05. Narx va tur
                 tarkibi ikki sahifada qoladi, lekin bir-biriga bir
                 bosishda. Faqat aniq tur tanlanganda: standart va
                 material jadvalining «tarkibi» yo'q.
            */}
            {tanlangan !== null && !materialTanlandi && !umumiyTanlandi && (
              <Link
                href={`/mahsulot/${String(tanlangan.id)}`}
                className="self-end text-[13px] font-medium text-brend hover:underline"
              >
                «{tanlangan.nom}» tarkibini tahrirlash →
              </Link>
            )}
            <NarxFormasi
              key={
                umumiyTanlandi
                  ? 'umumiy'
                  : materialTanlandi
                    ? `material-${String(tanlanganMaterial ?? 0)}`
                    : String(tanlangan?.id ?? 0)
              }
              turId={materialTanlandi || umumiyTanlandi ? null : (tanlangan?.id ?? 0)}
              turNomi={
                umumiyTanlandi
                  ? 'Hamma tur uchun standart'
                  : materialTanlandi
                    ? tanlanganMaterial === null
                      ? "Materialni o'zi sotish — umumiy jadval"
                      : `${materiallar.find((m) => m.id === tanlanganMaterial)?.nom ?? ''} — o'z jadvali`
                    : (tanlangan?.nom ?? '')
              }
              hammaTurga={umumiyTanlandi}
              materialId={materialTanlandi ? tanlanganMaterial : null}
              materialRoyxati={materialTanlandi ? materiallar : []}
              /* ⚠️ Narxi BOR turlar; o'zi chiqariladi — o'zidan nusxa ma'nosiz */
              nusxaTurlari={turlar.filter(
                (t) => t.qoidaSoni > 0 && t.id !== (tanlangan?.id ?? 0),
              )}
              qoidalar={qoidalar}
              qoshimchalar={qoshimchalar}
              materiallar={materiallar}
              almashtirishGuruhlari={almashtirishGuruhlari}
              mijozTurlari={mijozTurlari}
              filiallar={filiallar}
              kursQiymati={kursQiymati}
              ozgartiraOladi={ozgartiraOladi}
            />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
