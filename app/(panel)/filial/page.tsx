import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { REJIM_NOMI, rejim } from '@/lib/domain/filial';
import { filialOchirilganSoni, filialRoyxati } from './malumot';
import { OchirTugma } from '../ochir-tugma';
import { OchirilganlarHavolasi, QaytarTugma } from '../ochirilganlar';

export const dynamic = 'force-dynamic';

export default async function FilialRoyxati({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('filial.kor');
  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI */
  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';

  const [royxat, ochirilganSoni] = await Promise.all([
    filialRoyxati(ochirilganlar),
    filialOchirilganSoni(),
  ]);

  const yarataOladi = ruxsatBormi(f, 'filial.yarat');
  const ozgartiraOladi = ruxsatBormi(f, 'filial.ozgartir');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">Filiallar</h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            Rejim «Sotadi» va «Ishlab chiqaradi» bayroqlaridan kelib chiqadi (20.2.1)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/filial/hisob"
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
          >
            Hisob-kitob
          </Link>
          <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />

          {yarataOladi && (
            <Link
              href="/filial/yangi"
              className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
            >
              Yangi filial
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
        <table className="w-full text-sm">
          <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nomi</th>
              <th className="px-4 py-2.5 font-medium">Rejim</th>
              <th className="px-4 py-2.5 font-medium">Tikuvchi filial</th>
              <th className="px-4 py-2.5 font-medium">Kassa yopiladi</th>
              <th className="px-4 py-2.5 font-medium">Holat</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
            {royxat.map((q) => (
              <tr key={q.id} className={q.faol ? '' : 'text-matn-kuchsiz'}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/filial/${String(q.id)}`}
                    className="font-medium text-matn hover:underline"
                  >
                    {q.nom}
                  </Link>
                  {q.bosh && (
                    <span className="ml-2 rounded-full bg-brend px-2 py-0.5 text-xs text-white">
                      bosh
                    </span>
                  )}
                  {q.manzil !== null && <div className="text-xs text-matn-kuchsiz">{q.manzil}</div>}
                </td>
                <td className="px-4 py-2.5">
                  {REJIM_NOMI[rejim({ sotadi: q.sotadi, ishlabChiqaradi: q.ishlabChiqaradi })]}
                </td>
                <td className="px-4 py-2.5 text-matn-ikki">
                  {q.ishlabChiqaradi ? (
                    <span className="text-matn-kuchsiz">o&apos;zi</span>
                  ) : (
                    (q.standartNomi ?? <span className="text-belgi-qizil">belgilanmagan</span>)
                  )}
                </td>
                <td className="raqam px-4 py-2.5">{q.kassaYopilishSoati.slice(0, 5)}</td>
                <td className="px-4 py-2.5">
                  {q.faol ? (
                    <span className="text-belgi-yashil">faol</span>
                  ) : (
                    <span className="text-matn-kuchsiz">nofaol</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {/*
                    ⚠️ Bosh filial, qoldig'i yoki xodimi bor filial
                       o'chirilmaydi — sabab ko'rsatiladi.
                  */}
                  {ozgartiraOladi &&
                    (q.faol ? (
                      <OchirTugma tur="filial" id={q.id} nom={q.nom} ixcham />
                    ) : (
                      <QaytarTugma tur="filial" id={q.id} nom={q.nom} />
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
