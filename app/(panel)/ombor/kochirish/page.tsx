import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kochirishlar } from './malumot';

export const dynamic = 'force-dynamic';

const HOLAT_NOMI: Record<string, string> = {
  SOROV: "so'rov",
  YOLDA: "yo'lda",
  QABUL: 'qabul qilindi',
  BEKOR: 'bekor qilindi',
};

const HOLAT_USLUBI: Record<string, string> = {
  SOROV: 'bg-slate-100 text-slate-700',
  YOLDA: 'bg-amber-100 text-amber-900',
  QABUL: 'bg-emerald-100 text-emerald-900',
  BEKOR: 'bg-red-100 text-red-900',
};

export default async function KochirishRoyxati() {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const royxat = await kochirishlar(f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/ombor" className="text-sm text-slate-500 hover:text-slate-900">
            ← Ombor qoldig&apos;i
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Filiallararo ko&apos;chirish
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bo&apos;lak yo&apos;lda bo&apos;lganda ikkala filial qoldig&apos;ida
            ham turmaydi — umumiy ombor qiymati o&apos;zgarmaydi (20.7.4)
          </p>
        </div>
        <Link
          href="/ombor/kochirish/yangi"
          className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Material so&apos;rash
        </Link>
      </div>

      {royxat.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Hali ko&apos;chirish hujjati yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Raqam</th>
                <th className="px-4 py-2.5 font-medium">Kimdan</th>
                <th className="px-4 py-2.5 font-medium">Kimga</th>
                <th className="px-4 py-2.5 text-right font-medium">Bo&apos;lak</th>
                <th className="px-4 py-2.5 text-right font-medium">Qarz</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {royxat.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/ombor/kochirish/${String(k.id)}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {k.raqam}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {k.sana.toLocaleDateString('uz-UZ')}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">{k.kimdanNom}</td>
                  <td className="px-4 py-2.5">{k.kimgaNom}</td>
                  <td className="raqam px-4 py-2.5 text-right">{k.bolakSoni}</td>
                  <td className="raqam px-4 py-2.5 text-right">
                    {k.qarzSumma === null ? '—' : pulKorsat(som(k.qarzSumma))}
                    {k.qarzQolda && (
                      <span
                        className="ml-1 text-amber-700"
                        title="Summa qo'lda o'zgartirilgan (22.4.1)"
                      >
                        ⚠️
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${HOLAT_USLUBI[k.holat] ?? 'bg-slate-100 text-slate-700'}`}
                    >
                      {HOLAT_NOMI[k.holat] ?? k.holat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
