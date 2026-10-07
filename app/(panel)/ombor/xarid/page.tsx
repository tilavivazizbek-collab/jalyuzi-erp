import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi, tannarxniKoradimi } from '@/lib/ruxsat/tekshir';
import { dollar, pulKorsat, som } from '@/lib/domain/pul';
import { XARID_HOLAT_NOMI } from '@/lib/domain/xarid';
import { HOLAT_RANGI } from './holat';
import { buyurtmaKerak, yoldaEmaslar } from './kerak-malumot';
import { xaridFiltriniOqi, xaridlarRoyxati, type XaridFiltri } from './malumot';

export const dynamic = 'force-dynamic';


const FILTRLAR: readonly { k: XaridFiltri; nom: string }[] = [
  { k: 'kutilmoqda', nom: 'Kutilmoqda' },
  { k: 'kechikkan', nom: 'Kechikkan' },
  { k: 'hammasi', nom: 'Hammasi' },
];

/**
 * Xarid buyurtmalari (0063). Ombor auditi 2026-10-07, 7-band.
 *
 * ⚠️ Summa — xarid narxi, ya'ni tannarx ma'lumoti: faqat uni ko'ra
 *    oladiganga (TZ 11.10).
 */
export default async function XaridBuyurtmalari({
  searchParams,
}: {
  searchParams: Promise<{ holat?: string }>;
}) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const yarataOladi = ruxsatBormi(f, 'ombor.kirim.yarat');
  const pulniKoradi = tannarxniKoradimi(f);
  const filtr = xaridFiltriniOqi((await searchParams).holat);
  const [royxat, kerak] = await Promise.all([
    xaridlarRoyxati(f.filialId, filtr),
    buyurtmaKerak(f.filialId),
  ]);
  /** Buyurtma kerak, lekin hali hech qayerda yo'lda emas */
  const kutayotgani = yoldaEmaslar(kerak);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Ombor qoldig&apos;i
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Xarid buyurtmalari
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            Yetkazib beruvchiga nima, qancha va qachonga buyurtma qilingani. Mol kelganda kirim
            shu buyurtmadan ochiladi — kam kelgani o&apos;zi ko&apos;rinadi.
          </p>
        </div>
        {yarataOladi && (
          <Link
            href="/ombor/xarid/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-tugma-matn hover:bg-brend-quyuq"
          >
            + Yangi buyurtma
          </Link>
        )}
      </div>

      {kutayotgani > 0 && (
        <Link
          href="/ombor/xarid/kerak"
          className="rounded-karta border border-belgi-sariq/40 bg-belgi-sariq-fon px-4 py-3 text-sm text-belgi-sariq hover:underline"
        >
          {kutayotgani} ta material tugagan yoki yetkazib berilguncha tugaydi — buyurtma berilmagan →
        </Link>
      )}

      <nav className="flex gap-1.5" aria-label="Holat">
        {FILTRLAR.map((x) => (
          <Link
            key={x.k}
            href={x.k === 'kutilmoqda' ? '/ombor/xarid' : `/ombor/xarid?holat=${x.k}`}
            aria-current={filtr === x.k ? 'page' : undefined}
            className={`rounded-full border px-3 py-1 text-[13px] ${
              filtr === x.k
                ? 'border-brend bg-brend text-tugma-matn'
                : 'border-chegara-quyuq text-matn-ikki hover:bg-fon'
            }`}
          >
            {x.nom}
          </Link>
        ))}
      </nav>

      {royxat.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          {filtr === 'kutilmoqda'
            ? 'Kutilayotgan buyurtma yo‘q.'
            : filtr === 'kechikkan'
              ? 'Kechikkan buyurtma yo‘q.'
              : 'Hali buyurtma yo‘q.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Raqam</th>
                <th className="px-4 py-2.5 font-medium">Sana</th>
                <th className="px-4 py-2.5 font-medium">Yetkazib beruvchi</th>
                <th className="px-4 py-2.5 font-medium">Qachon keladi</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
                <th className="px-4 py-2.5 text-right font-medium">Keldi</th>
                {pulniKoradi && <th className="px-4 py-2.5 text-right font-medium">Summa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {royxat.map((x) => (
                <tr key={x.id}>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <Link href={`/ombor/xarid/${String(x.id)}`} className="text-brend hover:underline">
                      {x.raqam}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{x.sana}</td>
                  <td className="px-4 py-2.5">{x.yetkazibNomi}</td>
                  <td className={`px-4 py-2.5 tabular-nums ${x.kechikkan ? 'font-medium text-belgi-qizil' : ''}`}>
                    {x.kutilganSana ?? '—'}
                    {x.kechikkan && ' · kechikdi'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${HOLAT_RANGI[x.holat]}`}>
                      {XARID_HOLAT_NOMI[x.holat]}
                    </span>
                  </td>
                  <td className="raqam px-4 py-2.5 text-right">
                    {x.kelganQatorSoni} / {x.qatorSoni}
                  </td>
                  {pulniKoradi && (
                    <td className="raqam px-4 py-2.5 text-right">
                      {pulKorsat(x.valyuta === 'USD' ? dollar(x.summa) : som(x.summa))}{' '}
                      {x.valyuta === 'USD' ? '$' : "so'm"}
                      {!x.summaToliq && <span className="text-matn-kuchsiz">+</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
