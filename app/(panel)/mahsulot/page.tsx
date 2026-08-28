import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { OchirTugma } from '../ochir-tugma';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly nom: string;
  readonly xizmat_haqi: string | null;
  readonly oynada_korinadi: boolean;
  readonly botda_korinadi: boolean;
  readonly faol: boolean;
  readonly slot_soni: number;
  readonly guruhsiz_slot: number;
  readonly aksessuar_soni: number;
}

export default async function MahsulotRoyxati() {
  const f = await sahifaRuxsati('mahsulot.kor');
  const yarataOladi = ruxsatBormi(f, 'mahsulot.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'mahsulot.ozgartir');

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT t.id, t.nom, t.xizmat_haqi, t.oynada_korinadi, t.botda_korinadi, t.faol,
           COUNT(s.id) FILTER (WHERE s.faol)::int AS slot_soni,
           COUNT(s.id) FILTER (WHERE s.faol AND s.almashtirish_guruh_id IS NULL)::int
             AS guruhsiz_slot,
           (SELECT COUNT(*)::int FROM mahsulot_aksessuar a
            WHERE a.mahsulot_tur_id = t.id AND a.faol) AS aksessuar_soni
    FROM mahsulot_tur t
    LEFT JOIN mahsulot_slot s ON s.mahsulot_tur_id = t.id
    GROUP BY t.id
    ORDER BY t.faol DESC, t.tartib, t.nom`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Mahsulot turlari
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {qatorlar.length} ta · dasturchisiz yaratiladi (4.1)
          </p>
        </div>
        {yarataOladi && (
          <Link
            href="/mahsulot/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
          >
            Mahsulot turi yaratish
          </Link>
        )}
      </div>

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali mahsulot turi yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomi</th>
                <th className="px-4 py-2.5 font-medium">Slotlar</th>
                <th className="px-4 py-2.5 font-medium">Aksessuar</th>
                <th className="px-4 py-2.5 text-right font-medium">Xizmat haqi</th>
                <th className="px-4 py-2.5 font-medium">Ko&apos;rinadi</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((t) => (
                <tr key={t.id} className={t.faol ? '' : 'bg-fon text-matn-kuchsiz'}>
                  <td className="px-4 py-2.5 font-medium">
                    {t.nom}
                    {!t.faol && <span className="ml-2 text-xs">(nofaol)</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {t.slot_soni} ta
                    {/* TZ 5.6 — guruhsiz slot sotuvda bo'sh ro'yxat beradi */}
                    {t.guruhsiz_slot > 0 && (
                      <span className="ml-2 text-xs text-belgi-sariq">
                        {t.guruhsiz_slot} tasida guruh yo&apos;q
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{t.aksessuar_soni} ta</td>
                  <td className="raqam px-4 py-2.5">
                    {t.xizmat_haqi === null || Number(t.xizmat_haqi) === 0 ? (
                      <span className="text-matn-kuchsiz">—</span>
                    ) : (
                      pulKorsat(som(t.xizmat_haqi))
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-matn-ikki">
                    {t.oynada_korinadi ? 'sayt' : ''}
                    {t.oynada_korinadi && t.botda_korinadi ? ' · ' : ''}
                    {t.botda_korinadi ? 'bot' : ''}
                    {!t.oynada_korinadi && !t.botda_korinadi ? '—' : ''}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/mahsulot/${String(t.id)}`}
                          className="text-matn-ikki hover:text-matn"
                        >
                          Tahrirlash
                        </Link>
                        {/* O'chirish = nofaol qilish; ishlatilayotgani to'siladi */}
                        <OchirTugma tur="mahsulot" id={t.id} nom={t.nom} ixcham />
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
