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
  SOROV: 'bg-fon text-matn-ikki',
  YOLDA: 'bg-belgi-sariq-fon text-belgi-sariq',
  QABUL: 'bg-belgi-yashil-fon text-belgi-yashil',
  BEKOR: 'bg-belgi-qizil-fon text-belgi-qizil',
};

export default async function KochirishRoyxati() {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const royxat = await kochirishlar(f.filialId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/ombor" className="text-sm text-matn-kuchsiz hover:text-matn">
            ← Ombor qoldig&apos;i
          </Link>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Filiallararo ko&apos;chirish
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            Bo&apos;lak yo&apos;lda bo&apos;lganda ikkala filial qoldig&apos;ida ham turmaydi —
            umumiy ombor qiymati o&apos;zgarmaydi (20.7.4)
          </p>
        </div>
        <Link
          href="/ombor/kochirish/yangi"
          className="rounded-maydon bg-amal px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-amal-hover"
        >
          Material so&apos;rash
        </Link>
      </div>

      {royxat.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Hali ko&apos;chirish hujjati yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Raqam</th>
                <th className="px-4 py-2.5 font-medium">Kimdan</th>
                <th className="px-4 py-2.5 font-medium">Kimga</th>
                <th className="px-4 py-2.5 text-right font-medium">Bo&apos;lak</th>
                <th className="px-4 py-2.5 text-right font-medium">Qarz</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara">
              {royxat.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/ombor/kochirish/${String(k.id)}`}
                      className="font-medium text-matn hover:underline"
                    >
                      {k.raqam}
                    </Link>
                    <div className="text-xs text-matn-kuchsiz">
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
                        className="ml-1 text-belgi-sariq"
                        title="Summa qo'lda o'zgartirilgan (22.4.1)"
                      >
                        ⚠️
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${HOLAT_USLUBI[k.holat] ?? 'bg-fon text-matn-ikki'}`}
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
