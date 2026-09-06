import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { yetkazibSolishtirishAkti } from '@/lib/amal/hisob-kitob';
import { pulKorsat, som, dollar } from '@/lib/domain/pul';
import { OddiyChopTugmasi } from '../../../chop-tugma';

export const dynamic = 'force-dynamic';

/**
 * `/yetkazib/[id]/solishtirish` — TZ 9.7 · 9.2
 *
 * Yetkazib beruvchi bilan SOLISHTIRISH AKTI.
 *
 * ⚠️ NEGA KERAK
 *
 *    B2B da bu har oy kerak bo'ladigan hujjat: «sizga qancha
 *    qarzdormiz, siz nima yubordingiz». Mijoz tomonida
 *    «hisob-kitob varaqasi» bor edi, yetkazuvchi tomonida esa
 *    YO'Q — qo'lda solishtirilardi.
 *
 * ⚠️ ISHORA MIJOZNIKIGA TESKARI.
 *
 *    Mijozda musbat = mijoz qarzdor. Bu yerda musbat = BIZ
 *    qarzdormiz. Raqam bazadagidek qoladi, sarlavha tushuntiradi.
 *
 * ⚠️ Ruxsat: `yetkazib.kor` — bu yerda tannarx yoki foyda yo'q,
 *    faqat hisob-kitob harakati.
 */

/**
 * ⚠️ Ro'yxat sxemadagi `YETKAZIB_HARAKAT_TURLARI` bilan BIR XIL
 *    bo'lishi shart. Noma'lum tur KODI BILAN ko'rsatiladi — bo'sh
 *    katak emas, shunda yangi tur qo'shilib bu ro'yxat unutilsa
 *    teshik darrov ko'rinadi.
 */
const HARAKAT_NOMI: Record<string, string> = {
  XARID: 'Mol olindi',
  TOLOV: "To'lov qildik",
  AVANS: 'Avans berdik',
  DAVO: "Da'vo — brak qaytarildi",
  BOSHLANGICH: "Boshlang'ich qoldiq",
};

const pul = (summa: string, valyuta: string): string =>
  valyuta === 'USD' ? pulKorsat(dollar(summa)) : pulKorsat(som(summa));

export default async function SolishtirishAkti({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await sahifaRuxsati('yetkazib.kor');

  const { id } = await params;
  const yetkazibId = Number(id);
  if (!Number.isSafeInteger(yetkazibId) || yetkazibId <= 0) notFound();

  const v = await yetkazibSolishtirishAkti(ulanishOl(), yetkazibId);
  if (v === null) notFound();

  const bugun = new Date().toLocaleDateString('uz-UZ');

  return (
    <div className="flex flex-col gap-5">
      {/* ⚠️ Bu A4 hujjat, chek emas */}
      <style>{'@media print { @page { size: A4; margin: 12mm } }'}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/yetkazib/${String(yetkazibId)}`}
          className="text-sm text-matn-kuchsiz hover:text-matn"
        >
          ← Yetkazib beruvchi kartochkasi
        </Link>
        <OddiyChopTugmasi />
      </div>

      {v.korxonaNom === null && (
        <p className="rounded-maydon bg-belgi-sariq-fon px-3 py-2.5 text-sm text-belgi-sariq">
          Korxona nomi sozlanmagan — akt nomsiz chiqadi.{' '}
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
            <p className="font-semibold">Solishtirish akti</p>
            <p className="text-neutral-500">{bugun}</p>
          </div>
        </div>

        <div className="mb-4 border-y border-neutral-300 py-3">
          <p className="text-sm text-neutral-500">Yetkazib beruvchi</p>
          <p className="text-base font-semibold">{v.nom}</p>
          {v.telefon !== null && <p className="text-sm">{v.telefon}</p>}
        </div>

        {v.qatorlar.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            Bu yetkazib beruvchida hali hisob-kitob harakati yo&apos;q.
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
                  <td className="raqam py-2 text-right">{pul(q.summa, q.valyuta)}</td>
                  <td className="raqam py-2 text-right font-medium">
                    {pul(q.qoldiq, q.valyuta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/*
          ⚠️ Ishora TUSHUNTIRILADI. «−150 000» raqami hech narsa
             aytmaydi; «oldindan to'langan» aytadi.
        */}
        <div className="mt-5 border-t border-neutral-400 pt-3">
          {v.qoldiqlar.length === 0 ? (
            <p className="text-base font-semibold">Qarz yo&apos;q — hisob toza.</p>
          ) : (
            v.qoldiqlar.map((q) => (
              <p key={q.valyuta} className="text-base font-semibold">
                {Number(q.summa) > 0
                  ? 'Bizning qarzimiz: '
                  : 'Oldindan to‘langan (bizda haq): '}
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
            <p className="mb-8 text-neutral-500">Bizning tomondan</p>
            <p className="border-t border-neutral-400 pt-1">imzo</p>
          </div>
          <div>
            <p className="mb-8 text-neutral-500">Yetkazib beruvchi tomondan</p>
            <p className="border-t border-neutral-400 pt-1">imzo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
