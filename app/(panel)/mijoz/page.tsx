import Link from 'next/link';
import { ulanishOl } from '@/lib/db';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { telefonKorsat } from '@/lib/domain/telefon';
import { pulKorsat, som } from '@/lib/domain/pul';
import { OFFSET_TURI_NOMI, type OffsetTuri } from '@/lib/sxema/mijoz';

export const dynamic = 'force-dynamic';

interface Qator {
  readonly id: number;
  readonly ism: string;
  readonly telefon: string | null;
  readonly telegram_id: number | null;
  readonly shaxs_turi: string;
  readonly offset_turi: string | null;
  readonly offset_qiymat: string | null;
  readonly qarz_limiti: string | null;
  readonly faol: boolean;
}

export default async function MijozRoyxati() {
  const f = await sahifaRuxsati('mijoz.kor');
  const yarataOladi = ruxsatBormi(f, 'mijoz.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'mijoz.ozgartir');

  const qatorlar = await ulanishOl()<Qator[]>`
    SELECT id, ism, telefon, telegram_id, shaxs_turi,
           offset_turi, offset_qiymat, qarz_limiti, faol
    FROM mijoz ORDER BY faol DESC, ism`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Mijozlar</h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {qatorlar.length} ta · barcha filial uchun umumiy, qarzi ham (Q-26)
          </p>
        </div>
        {yarataOladi && (
          <Link
            href="/mijoz/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
          >
            Mijoz qo&apos;shish
          </Link>
        )}
      </div>

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali mijoz yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ismi</th>
                <th className="px-4 py-2.5 font-medium">Telefon</th>
                <th className="px-4 py-2.5 font-medium">Turi</th>
                <th className="px-4 py-2.5 font-medium">Offset</th>
                <th className="px-4 py-2.5 text-right font-medium">Qarz limiti</th>
                {ozgartiraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((m) => (
                <tr key={m.id} className={m.faol ? '' : 'bg-fon text-matn-kuchsiz'}>
                  <td className="px-4 py-2.5 font-medium">
                    {m.ism}
                    {!m.faol && <span className="ml-2 text-xs">(nofaol)</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.telefon === null ? (
                      <span className="text-matn-kuchsiz">—</span>
                    ) : (
                      telefonKorsat(m.telefon)
                    )}
                    {/* TZ 6.11 — telegram yo'q bo'lsa xabar yuborib bo'lmaydi */}
                    {m.telegram_id === null && (
                      <span className="ml-2 text-xs text-belgi-sariq" title="Botga ulanmagan">
                        qo&apos;ng&apos;iroq qiling
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.shaxs_turi === 'YURIDIK' ? 'Yuridik' : 'Jismoniy'}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.offset_turi === null || m.offset_qiymat === null ? (
                      <span className="text-matn-kuchsiz">—</span>
                    ) : (
                      `${String(Number(m.offset_qiymat))} · ${OFFSET_TURI_NOMI[m.offset_turi as OffsetTuri]}`
                    )}
                  </td>
                  <td className="raqam px-4 py-2.5">
                    {m.qarz_limiti === null ? (
                      <span className="text-matn-kuchsiz">—</span>
                    ) : (
                      pulKorsat(som(m.qarz_limiti))
                    )}
                  </td>
                  {ozgartiraOladi && (
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/mijoz/${String(m.id)}`}
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
