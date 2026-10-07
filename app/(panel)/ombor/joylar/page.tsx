import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { filialNomi } from '../malumot';
import { filialJoylari } from '../joy-malumot';
import { JoyOchirTugmasi, JoyQoshFormasi } from '../joy-forma';

export const dynamic = 'force-dynamic';

/**
 * Saqlash joylari — stellaj / qator / polka (0062). Ombor auditi 2026-10-07.
 *
 * ⚠️ Har filialda o'z ro'yxati (Q-25). Nomlar bo'sh katak: egasi o'z
 *    omboriga qarab yozadi (CLAUDE.md §14a — raqam so'ralmaydi).
 */
export default async function OmborJoylari() {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const boshqaraOladi = ruxsatBormi(f, 'ombor.kirim.yarat');
  const [joylar, filial] = await Promise.all([filialJoylari(f.filialId), filialNomi(f.filialId)]);

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div>
        <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Ombor qoldig&apos;i
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Saqlash joylari
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {filial} · stellaj, qator yoki polka. Rulon joyga qo&apos;yilsa, usta va omborchi uni
          darhol topadi; QR yorliq skanerlanganda ham joyi ko&apos;rinadi.
        </p>
      </div>

      {boshqaraOladi && <JoyQoshFormasi />}

      {joylar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali joy yo&apos;q. Omboringizdagi stellajlarni yozib chiqing — masalan «A-1», «A-2»,
          «B-1».
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Joy</th>
                <th className="px-4 py-2.5 font-medium">Izoh</th>
                <th className="px-4 py-2.5 text-right font-medium">Bo&apos;lak</th>
                {boshqaraOladi && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {joylar.map((j) => (
                <tr key={j.id}>
                  <td className="px-4 py-2.5 font-medium">{j.nom}</td>
                  <td className="px-4 py-2.5 text-matn-ikki">{j.izoh ?? '—'}</td>
                  <td className="raqam px-4 py-2.5 text-right">
                    {j.bolakSoni === 0 ? (
                      <span className="text-matn-kuchsiz">bo&apos;sh</span>
                    ) : (
                      j.bolakSoni
                    )}
                  </td>
                  {boshqaraOladi && (
                    <td className="px-4 py-2.5">
                      <JoyOchirTugmasi joyId={j.id} bosh={j.bolakSoni === 0} />
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
