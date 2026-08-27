import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import {
  HISOB_TURI_NOMI,
  SARFLASH_BIRLIGI_NOMI,
  type HisobTuri,
  type SarflashBirligi,
} from '@/lib/sxema/material';
import { pulKorsat, som } from '@/lib/domain/pul';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  readonly hisob_turi: string;
  readonly kirim_birligi: string;
  readonly sarflash_birligi: string;
  readonly koeffitsient: string;
  readonly sotuv_narx: string | null;
  readonly sotuv_valyuta: string;
  readonly guruh_nomi: string | null;
  readonly faol: boolean;
}

/** Narx birligi — TZ 5.4: mato 1 kv.m, karniz 1 METR, aksessuar 1 dona. */
function narxBirligi(sarflash: string): string {
  return sarflash === 'SM' ? 'm' : SARFLASH_BIRLIGI_NOMI[sarflash as SarflashBirligi];
}

export default async function MaterialRoyxati() {
  const f = await sahifaRuxsati('material.kor');
  const yarataOladi = ruxsatBormi(f, 'material.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'material.ozgartir');

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT m.id, m.nom, m.hisob_turi, m.kirim_birligi, m.sarflash_birligi,
           m.koeffitsient, m.sotuv_narx, m.sotuv_valyuta, m.faol,
           g.nom AS guruh_nomi
    FROM material m
    LEFT JOIN almashtirish_guruh g ON g.id = m.almashtirish_guruh_id
    ORDER BY m.faol DESC, m.nom`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Materiallar</h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {qatorlar.length} ta · barcha filial uchun umumiy (Q-26)
          </p>
        </div>
        {yarataOladi && (
          <Link
            href="/material/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
          >
            Material qo&apos;shish
          </Link>
        )}
      </div>

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali material yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomi</th>
                <th className="px-4 py-2.5 font-medium">Hisob turi</th>
                <th className="px-4 py-2.5 font-medium">Guruh</th>
                <th className="px-4 py-2.5 font-medium">Birliklar</th>
                <th className="px-4 py-2.5 text-right font-medium">Sotuv narxi</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((m) => (
                <tr key={m.id} className={m.faol ? '' : 'bg-fon text-matn-kuchsiz'}>
                  <td className="px-4 py-2.5 font-medium">
                    {m.nom}
                    {!m.faol && <span className="ml-2 text-xs">(nofaol)</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {HISOB_TURI_NOMI[m.hisob_turi as HisobTuri] ?? m.hisob_turi}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.guruh_nomi ?? <span className="text-belgi-sariq">— yo&apos;q —</span>}
                  </td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    1 {m.kirim_birligi} = {Number(m.koeffitsient)}{' '}
                    {SARFLASH_BIRLIGI_NOMI[m.sarflash_birligi as SarflashBirligi]}
                  </td>
                  <td className="raqam px-4 py-2.5">
                    {m.sotuv_narx === null ? (
                      <span className="text-matn-kuchsiz">—</span>
                    ) : (
                      <>
                        {m.sotuv_valyuta === 'SOM'
                          ? pulKorsat(som(m.sotuv_narx))
                          : `${m.sotuv_narx} $`}
                        <span className="ml-1 text-xs text-matn-kuchsiz">
                          / {narxBirligi(m.sarflash_birligi)}
                        </span>
                      </>
                    )}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/material/${String(m.id)}`}
                        className="text-matn-ikki hover:text-matn"
                      >
                        Tahrirlash
                      </Link>
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
