import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { telefonKorsat } from '@/lib/domain/telefon';
import { OchirTugma } from '../ochir-tugma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  readonly nima_yetkazadi: string | null;
  readonly kontakt_shaxs: string | null;
  readonly telefon: string | null;
  readonly tolov_muddati_kun: number | null;
  readonly valyuta: string;
  readonly faol: boolean;
}

export default async function YetkazibRoyxati() {
  const f = await sahifaRuxsati('yetkazib.kor');
  const yarataOladi = ruxsatBormi(f, 'yetkazib.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'yetkazib.ozgartir');

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT id, nom, nima_yetkazadi, kontakt_shaxs, telefon,
           tolov_muddati_kun, valyuta, faol
    FROM yetkazib_beruvchi ORDER BY faol DESC, nom`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Yetkazib beruvchilar
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {qatorlar.length} ta · qarzi umumiy, filialga bog&apos;lanmagan (Q-26)
          </p>
        </div>
        {yarataOladi && (
          <Link
            href="/yetkazib/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
          >
            Qo&apos;shish
          </Link>
        )}
      </div>

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali yetkazib beruvchi yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomi</th>
                <th className="px-4 py-2.5 font-medium">Nima yetkazadi</th>
                <th className="px-4 py-2.5 font-medium">Kontakt</th>
                <th className="px-4 py-2.5 font-medium">To&apos;lov muddati</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((y) => (
                <tr key={y.id} className={y.faol ? '' : 'bg-fon text-matn-kuchsiz'}>
                  <td className="px-4 py-2.5 font-medium">
                    {y.nom}
                    {!y.faol && <span className="ml-2 text-xs">(nofaol)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    {y.nima_yetkazadi ?? <span className="text-matn-kuchsiz">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {y.kontakt_shaxs ?? ''}
                    {y.telefon !== null && (
                      <span className="ml-2 text-matn-kuchsiz">{telefonKorsat(y.telefon)}</span>
                    )}
                    {y.kontakt_shaxs === null && y.telefon === null && (
                      <span className="text-matn-kuchsiz">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {y.tolov_muddati_kun === null ? (
                      <span className="text-matn-kuchsiz">standart</span>
                    ) : (
                      `${String(y.tolov_muddati_kun)} kun`
                    )}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/yetkazib/${String(y.id)}`}
                          className="text-matn-ikki hover:text-matn"
                        >
                          Tahrirlash
                        </Link>
                        {/* O'chirish = nofaol qilish; ishlatilayotgani to'siladi */}
                        <OchirTugma tur="yetkazib" id={y.id} nom={y.nom} ixcham />
                      </div>
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
