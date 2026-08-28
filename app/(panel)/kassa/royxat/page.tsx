import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { KASSA_TURI_NOMI, type KassaTuri } from '@/lib/sxema/kassa-yarat';
import { OchirTugma } from '../../ochir-tugma';
import { kassaBoshqaruvRoyxati, kassaOchirilganSoni } from '../malumot';
import { OchirilganlarHavolasi, QaytarTugma } from '../../ochirilganlar';

export const dynamic = 'force-dynamic';

/**
 * TZ 12.2 — kassalarni boshqarish.
 *
 * ⚠️ `/kassa` dan ALOHIDA: u yerda kunlik ish (qoldiq, kitob,
 *    topshiriq). Bu yerda ro'yxat boshqariladi va o'chirilganlari
 *    ham ko'rinadi.
 */
export default async function KassaRoyxati({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = await sahifaRuxsati('kassa.barcha.kor');
  const boshqaraOladi = ruxsatBormi(f, 'kassa.yarat');

  /** ⚠️ O'chirilgan yozuv ro'yxatda KO'RINMAYDI */
  const sp = await searchParams;
  const ochirilganlar = sp['ochirilgan'] === '1';

  const [qatorlar, ochirilganSoni] = await Promise.all([
    kassaBoshqaruvRoyxati(ochirilganlar),
    kassaOchirilganSoni(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/kassa" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Kassa
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Kassalar
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <OchirilganlarHavolasi soni={ochirilganSoni} korsatilmoqda={ochirilganlar} />

          {boshqaraOladi && (
            <Link
              href="/kassa/yangi"
            className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-brend-quyuq active:scale-[0.98]"
          >
              + Yangi kassa
            </Link>
          )}
        </div>
      </div>

      {qatorlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
          Hali kassa ochilmagan. To&apos;lov qabul qilish uchun kamida bitta kassa kerak.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomi</th>
                <th className="px-4 py-2.5 font-medium">Turi</th>
                <th className="px-4 py-2.5 font-medium">Filial</th>
                <th className="px-4 py-2.5 font-medium">Kimniki</th>
                <th className="px-4 py-2.5 text-right font-medium">Qoldiq</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
                {boshqaraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {qatorlar.map((k) => (
                <tr key={k.id} className={k.faol ? '' : 'text-matn-kuchsiz'}>
                  <td className="px-4 py-2.5 font-medium">{k.nom}</td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    {KASSA_TURI_NOMI[k.turi as KassaTuri]} ·{' '}
                    {k.valyuta === 'USD' ? 'dollar' : "so'm"}
                  </td>
                  <td className="px-4 py-2.5 text-matn-ikki">{k.filialNomi}</td>
                  <td className="px-4 py-2.5 text-matn-ikki">
                    {k.xodimIsmi ?? <span className="text-matn-kuchsiz">admin</span>}
                  </td>
                  <td className="raqam px-4 py-2.5 text-right font-medium">{k.qoldiq}</td>
                  <td className="px-4 py-2.5">
                    {k.faol ? (
                      <span className="text-belgi-yashil">faol</span>
                    ) : (
                      <span className="text-matn-kuchsiz">o&apos;chirilgan</span>
                    )}
                  </td>
                  {boshqaraOladi && (
                    <td className="px-4 py-2.5 text-right">
                      {/*
                        ⚠️ Ichida puli bor kassa o'chirilmaydi —
                           sabab ko'rsatiladi.
                      */}
                      {k.faol ? (
                        <OchirTugma tur="kassa" id={k.id} nom={k.nom} ixcham />
                      ) : (
                        <QaytarTugma tur="kassa" id={k.id} nom={k.nom} />
                      )}
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
