import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kirimHujjatlari } from '../malumot';

export const dynamic = 'force-dynamic';

export default async function KirimRoyxati() {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const kirimQilaOladi = ruxsatBormi(f, 'ombor.kirim.yarat');

  const hujjatlar = await kirimHujjatlari(f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Ombor qoldig&apos;i
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Kirim hujjatlari
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            Filial #{f.filialId} · oxirgi {hujjatlar.length} ta
          </p>
        </div>
        {kirimQilaOladi && (
          <Link
            href="/ombor/kirim/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brend-quyuq"
          >
            Yangi kirim
          </Link>
        )}
      </div>

      {hujjatlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali kirim hujjati yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Raqam</th>
                <th className="px-4 py-2.5 font-medium">Sana</th>
                <th className="px-4 py-2.5 font-medium">Yetkazib beruvchi</th>
                <th className="px-4 py-2.5 text-right font-medium">Qator</th>
                <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {hujjatlar.map((h) => {
                const storno = h.holat === 'STORNO';
                return (
                  <tr key={h.id} className={storno ? 'text-matn-kuchsiz' : ''}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/ombor/kirim/${String(h.id)}`}
                        className="font-mono text-xs underline underline-offset-2 hover:text-matn"
                      >
                        {h.raqam}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-matn-ikki">{h.sana}</td>
                    <td className="px-4 py-2.5">{h.yetkazibNomi}</td>
                    <td className="raqam px-4 py-2.5">{h.qatorSoni}</td>
                    <td className={`raqam px-4 py-2.5 ${storno ? 'line-through' : ''}`}>
                      {h.valyuta === 'SOM' ? pulKorsat(som(h.jamiSumma)) : `${h.jamiSumma} $`}
                    </td>
                    <td className="px-4 py-2.5">
                      {storno ? (
                        <span className="text-belgi-qizil">storno</span>
                      ) : (
                        <span className="text-belgi-yashil">faol</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
