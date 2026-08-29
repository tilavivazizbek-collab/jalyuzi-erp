import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { kochirishOl, tanlanadiganBolaklar } from '../malumot';
import { JonatishFormasi } from '../jonat-forma';
import { BekorFormasi, QabulFormasi } from '../qabul-forma';

export const dynamic = 'force-dynamic';

const HOLAT_NOMI: Record<string, string> = {
  SOROV: "so'rov — jo'natish kutilmoqda",
  YOLDA: "yo'lda",
  QABUL: 'qabul qilindi',
  BEKOR: 'bekor qilindi',
};

export default async function KochirishSahifasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await sahifaRuxsati('ombor.qoldiq.kor');

  const kochirishId = Number(id);
  if (!Number.isInteger(kochirishId) || kochirishId <= 0) notFound();

  const h = await kochirishOl(kochirishId);
  if (h === null) notFound();

  // Q-25 — begona filial hujjatini ko'ra olmaydi
  if (h.kimdanFilialId !== f.filialId && h.kimgaFilialId !== f.filialId) notFound();

  const beruvchimiz = h.kimdanFilialId === f.filialId;
  const qabulQiluvchimiz = h.kimgaFilialId === f.filialId;

  const jonataOladi = beruvchimiz && h.holat === 'SOROV' && ruxsatBormi(f, 'ombor.kochirish.jonat');
  const qabulQilaOladi =
    qabulQiluvchimiz && h.holat === 'YOLDA' && ruxsatBormi(f, 'ombor.kochirish.qabul');
  const bekorQilaOladi =
    (h.holat === 'SOROV' || h.holat === 'YOLDA') && ruxsatBormi(f, 'ombor.kochirish.jonat');

  const bolaklar = jonataOladi ? await tanlanadiganBolaklar(f.filialId) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ombor/kochirish" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Ko&apos;chirishlar
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Ko&apos;chirish {h.raqam}
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          {h.kimdanNom} → {h.kimgaNom} · {HOLAT_NOMI[h.holat] ?? h.holat}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Bo&apos;lak</dt>
          <dd className="raqam mt-1 text-lg">{h.qatorlar.length}</dd>
        </div>
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Qarz summasi</dt>
          <dd className="raqam mt-1 text-lg">
            {h.qarzSumma === null ? '—' : pulKorsat(som(h.qarzSumma))}
          </dd>
          {h.qarzQolda && (
            <p className="mt-1 text-xs text-belgi-sariq">
              Qo&apos;lda o&apos;zgartirilgan: {h.qarzSabab}
            </p>
          )}
        </div>
        <div className="rounded-karta border border-chegara bg-sirt px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-matn-kuchsiz">Izoh</dt>
          <dd className="mt-1 text-sm">{h.izoh ?? '—'}</dd>
        </div>
      </dl>

      {h.holat === 'BEKOR' && (
        <p className="rounded-maydon bg-belgi-qizil-fon px-3 py-2.5 text-sm text-belgi-qizil ">
          Bekor qilindi: {h.bekorSabab}
        </p>
      )}

      {h.qatorlar.length > 0 && !qabulQilaOladi && (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Kod</th>
                <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                <th className="px-4 py-2.5 font-medium">O&apos;lcham</th>
                <th className="px-4 py-2.5 font-medium">Qabulda</th>
                <th className="px-4 py-2.5 text-right font-medium">Tannarx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {h.qatorlar.map((q) => (
                <tr key={q.bolakId}>
                  <td className="raqam px-4 py-2.5">{q.kod}</td>
                  <td className="px-4 py-2.5">{q.materialNomi}</td>
                  <td className="raqam px-4 py-2.5">
                    {q.turi === 'DONA'
                      ? (q.miqdor ?? '—')
                      : `${q.eniM ?? '—'} × ${q.boyiM ?? '—'} m`}
                  </td>
                  <td className="raqam px-4 py-2.5">
                    {q.haqiqiyEniM === null && q.haqiqiyBoyiM === null ? (
                      '—'
                    ) : (
                      <span className="text-belgi-sariq">
                        {q.haqiqiyEniM ?? q.eniM} × {q.haqiqiyBoyiM ?? q.boyiM} m
                      </span>
                    )}
                    {q.olchovIzoh !== null && (
                      <div className="text-xs text-matn-kuchsiz">{q.olchovIzoh}</div>
                    )}
                  </td>
                  <td className="raqam px-4 py-2.5 text-right">{pulKorsat(som(q.tannarxSumma))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {jonataOladi && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Bo&apos;laklarni tanlang</h2>
          {bolaklar.length === 0 ? (
            <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
              Omborda bo&apos;sh bo&apos;lak yo&apos;q.
            </p>
          ) : (
            <JonatishFormasi kochirishId={h.id} bolaklar={bolaklar} />
          )}
        </section>
      )}

      {qabulQilaOladi && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Qabul qilish</h2>
          <QabulFormasi kochirishId={h.id} qatorlar={h.qatorlar} />
        </section>
      )}

      {bekorQilaOladi && <BekorFormasi kochirishId={h.id} />}
    </div>
  );
}
