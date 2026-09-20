import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { NarxFormasi } from './forma';
import {
  almashtirishGuruhlariniOl,
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

  const sp = await searchParams;
  const xomTur = sp['tur'];
  const soralgan = typeof xomTur === 'string' ? Number(xomTur) : Number.NaN;

  const turlar = await turlarniOl();
  const tanlangan =
    turlar.find((t) => t.id === soralgan) ?? turlar[0] ?? null;

  const [guruhlar, materiallar, almashtirishGuruhlari, mijozTurlari, filiallar, kursQiymati] =
    await Promise.all([
      narxGuruhlariniOl(),
      materiallarniOl(),
      almashtirishGuruhlariniOl(),
      mijozTurlariniOl(),
      filiallarniOl(),
      joriyKursniOl(),
    ]);

  const [qoidalar, qoshimchalar] =
    tanlangan === null
      ? [[], []]
      : await Promise.all([
          turQoidalariniOl(tanlangan.id),
          turQoshimchalariniOl(tanlangan.id),
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
                  <span
                    className={`ml-2 shrink-0 text-[11px] ${
                      t.qoidaSoni === 0 ? 'text-belgi-qizil' : 'text-matn-kuchsiz'
                    }`}
                    title={
                      t.qoidaSoni === 0
                        ? "Narx qo'yilmagan — bu tur sotilmaydi"
                        : `${String(t.qoidaSoni)} daraja`
                    }
                  >
                    {t.qoidaSoni === 0 ? '⚠' : t.qoidaSoni}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* ─── Tanlangan turning narxi ──────────────────────────────── */}
          {tanlangan === null ? null : (
            <NarxFormasi
              key={tanlangan.id}
              turId={tanlangan.id}
              turNomi={tanlangan.nom}
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
