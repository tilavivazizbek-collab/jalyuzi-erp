import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { hisobKitobVaraqasi } from '@/lib/amal/hisob-kitob';
import { pulKorsat, som, dollar } from '@/lib/domain/pul';
import { OddiyChopTugmasi } from '../../../chop-tugma';

export const dynamic = 'force-dynamic';

/**
 * `/mijoz/[id]/hisob-kitob` — TZ 8.9
 *
 * Mijozning butun xarid tarixi va balansi. Chek bilan birga
 * beriladi: chek bitta buyurtma haqida, bu esa «umuman qancha
 * qarzim bor?» degan savolga javob.
 *
 * ⚠️ Ruxsat: `mijoz.kor` — bu yerda TANNARX yo'q, faqat mijozning
 *    o'z hisobi. Sotuvchi ham ko'ra oladi (11.10).
 */

/**
 * ⚠️ Ro'yxat bazadagi `mijoz_harakat_turi` CHECK bilan bir xil.
 *    Noma'lum tur KODI BILAN ko'rsatiladi — jimgina bo'sh katak
 *    emas, teshik darrov ko'rinadi.
 */
const HARAKAT_NOMI: Record<string, string> = {
  SOTUV: 'Xarid',
  TOLOV: "To'lov",
  QAYTARISH: 'Qaytarish',
  AVANS: 'Avans',
  UMIDSIZ_QARZ: 'Umidsiz deb hisobdan chiqarildi',
  BOSHLANGICH: "Boshlang'ich qoldiq",
};

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'USD' ? pulKorsat(dollar(summa)) : pulKorsat(som(summa));

export default async function HisobKitobSahifasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await sahifaRuxsati('mijoz.kor');

  const { id } = await params;
  const mijozId = Number(id);
  if (!Number.isSafeInteger(mijozId) || mijozId <= 0) notFound();

  const v = await hisobKitobVaraqasi(ulanishOl(), mijozId);
  if (v === null) notFound();

  const bugun = new Date().toLocaleDateString('uz-UZ');

  return (
    <div className="flex flex-col gap-5">
      {/*
        ⚠️ Sahifa o'lchami SHU YERDA: bu A4 hujjat, chek emas.
      */}
      <style>{'@media print { @page { size: A4; margin: 12mm } }'}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/mijoz/${String(mijozId)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          ← Mijoz kartochkasi
        </Link>
        <OddiyChopTugmasi />
      </div>

      {v.korxonaNom === null && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Korxona nomi sozlanmagan — varaqa nomsiz chiqadi.{' '}
          <Link href="/sozlama" className="underline">
            Sozlash
          </Link>
        </p>
      )}

      <div className="varaqa rounded-karta border border-chegara bg-white p-6 text-black">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{v.korxonaNom ?? '—'}</p>
            {v.korxonaTelefon !== null && (
              <p className="text-sm text-neutral-500">{v.korxonaTelefon}</p>
            )}
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Hisob-kitob varaqasi</p>
            <p className="text-neutral-500">{bugun}</p>
          </div>
        </div>

        <div className="mb-4 border-y border-neutral-300 py-3">
          <p className="text-sm text-neutral-500">Mijoz</p>
          <p className="text-base font-semibold">{v.ism}</p>
          {v.telefon !== null && <p className="text-sm">{v.telefon}</p>}
        </div>

        {v.qatorlar.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            Bu mijozda hali hisob-kitob harakati yo&apos;q.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-400 text-left">
              <tr>
                <th className="py-2 font-medium">Sana</th>
                <th className="py-2 font-medium">Amal</th>
                <th className="py-2 font-medium">Izoh</th>
                <th className="py-2 text-right font-medium">Summa</th>
                <th className="py-2 text-right font-medium">Qoldiq</th>
              </tr>
            </thead>
            <tbody>
              {v.qatorlar.map((q, i) => (
                <tr key={i} className="border-b border-neutral-200">
                  <td className="whitespace-nowrap py-2">
                    {q.sana.toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="py-2">{HARAKAT_NOMI[q.turi] ?? q.turi}</td>
                  <td className="py-2 text-neutral-500">{q.izoh ?? '—'}</td>
                  <td className="raqam py-2 text-right">
                    {pul(q.summa, q.valyuta)}
                  </td>
                  <td className="raqam py-2 text-right font-medium">
                    {pul(q.qoldiq, q.valyuta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/*
          ⚠️ Ishora TUSHUNTIRILADI. «−150 000» degan raqam
             mijozga hech narsa aytmaydi; «avans» so'zi aytadi.
        */}
        <div className="mt-5 border-t border-neutral-400 pt-3">
          {v.qoldiqlar.length === 0 ? (
            <p className="text-base font-semibold">Qarz yo&apos;q — hisob toza.</p>
          ) : (
            v.qoldiqlar.map((q) => (
              <p key={q.valyuta} className="text-base font-semibold">
                {Number(q.summa) > 0 ? 'Qarz: ' : 'Avans (bizda turibdi): '}
                <span className="raqam">
                  {pul(
                    Number(q.summa) > 0 ? q.summa : String(-Number(q.summa)),
                    q.valyuta,
                  )}
                </span>{' '}
                {q.valyuta === 'USD' ? '$' : "so'm"}
              </p>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-between text-sm">
          <div>
            <p className="mb-6 text-neutral-500">Topshirdi</p>
            <p className="w-40 border-t border-neutral-400" />
          </div>
          <div>
            <p className="mb-6 text-neutral-500">Qabul qildi</p>
            <p className="w-40 border-t border-neutral-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
