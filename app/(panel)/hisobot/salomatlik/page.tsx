import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { malumotSalomatligi } from '../salomatlik-malumot';

export const dynamic = 'force-dynamic';

/**
 * Ma'lumot salomatligi — hisobotlarni buzadigan muammolar. 2026-10-12.
 *
 * ⚠️ Faqat ko'rsatadi va tuzatish joyiga olib boradi; o'zi hech narsa
 *    o'zgartirmaydi. Moliya huquqi bilan (summalar — pul ma'lumoti).
 */
export default async function MalumotSalomatligi() {
  const f = await sahifaRuxsati('hisobot.moliya.kor');
  const muammolar = await malumotSalomatligi(f.filialId);
  const xavf = muammolar.filter((m) => m.daraja === 'XAVF');
  const ogoh = muammolar.filter((m) => m.daraja === 'OGOH');

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/hisobot" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Hisobotlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Ma&apos;lumot salomatligi
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Hisobot faqat ma&apos;lumot to&apos;g&apos;ri bo&apos;lsa to&apos;g&apos;ri. Bu yerda raqamlarni
          buzadigan muammolar va ularni tuzatish joyi.
        </p>
      </div>

      {muammolar.length === 0 ? (
        <p className="rounded-karta border border-belgi-yashil/30 bg-belgi-yashil-fon px-4 py-6 text-center text-sm text-belgi-yashil">
          ✓ Muammo topilmadi — hisobotlarga ishonsa bo&apos;ladi.
        </p>
      ) : (
        [
          { nom: 'Raqamlarni buzadi', royxat: xavf, rang: 'border-belgi-qizil/30', belgi: 'text-belgi-qizil' },
          { nom: "E'tibor bering", royxat: ogoh, rang: 'border-belgi-sariq/30', belgi: 'text-belgi-sariq' },
        ]
          .filter((g) => g.royxat.length > 0)
          .map((g) => (
            <section key={g.nom} className="flex flex-col gap-2">
              <h2 className={`text-sm font-medium ${g.belgi}`}>
                {g.nom} — {g.royxat.length}
              </h2>
              {g.royxat.map((m) => (
                <div
                  key={m.kod}
                  className={`flex flex-wrap items-start justify-between gap-3 rounded-karta border bg-sirt px-4 py-3 ${g.rang}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-matn">
                      {m.nom}: <span className="raqam">{m.soni}</span>
                      {m.summa !== null && (
                        <span className="raqam ml-2 text-matn-ikki">· {pulKorsat(som(m.summa))} so&apos;m</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-matn-kuchsiz">{m.tasir}</p>
                  </div>
                  <Link
                    href={m.havola}
                    className="shrink-0 rounded-maydon border border-chegara-quyuq px-3 py-1.5 text-[13px] text-matn-ikki hover:bg-fon"
                  >
                    {m.havolaMatni} →
                  </Link>
                </div>
              ))}
            </section>
          ))
      )}
    </div>
  );
}
