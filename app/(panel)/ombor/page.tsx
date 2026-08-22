import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi, yigindiQamrov } from '@/lib/ruxsat/tekshir';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import {
  barchaFilialQoldigi,
  filialNomi,
  filialQoldigi,
  type FilialQoldigi,
} from './malumot';

export const dynamic = 'force-dynamic';

/** Q-05 — kv.m faqat KO'RSATISH uchun, sanashda ishlatilmaydi. */
const kvM = (n: number): string => n.toFixed(2);

export default async function OmborQoldigi({
  searchParams,
}: {
  searchParams: Promise<{ filial?: string }>;
}) {
  const f = await sahifaRuxsati('ombor.qoldiq.kor');
  const kirimQilaOladi = ruxsatBormi(f, 'ombor.kirim.yarat');

  /**
   * TZ 20.6.2 — «Bosh filial admini barcha filiallarni bir jadvalda
   * ko'ra oladi.» Qamrov `BARCHA` bo'lmagan odam bu ko'rinishni
   * so'rasa ham o'z filialida qoladi (§9.4 — tekshiruv serverda).
   */
  const barchasiniKoradi = yigindiQamrov(f, 'ombor.qoldiq.kor') === 'BARCHA';
  const { filial } = await searchParams;
  const barchasimi = barchasiniKoradi && filial === 'barcha';

  const nomi = await filialNomi(f.filialId);
  const filiallar = barchasimi ? await barchaFilialQoldigi() : [];

  const qoldiq = barchasimi ? [] : await filialQoldigi(f.filialId);
  const olchamli = qoldiq.filter((q) => q.hisobTuri === 'RULON');
  const donali = qoldiq.filter((q) => q.hisobTuri !== 'RULON');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Ombor qoldig&apos;i</h1>
          <p className="mt-1 text-sm text-slate-500">
            {barchasimi ? 'Barcha filiallar' : nomi} · har filialda o&apos;z
            ombori (Q-25)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {barchasiniKoradi && (
            <Link
              href={barchasimi ? '/ombor' : '/ombor?filial=barcha'}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              {barchasimi ? nomi : 'Barcha filiallar'}
            </Link>
          )}
          <Link
            href="/ombor/kirim"
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Kirim hujjatlari
          </Link>
          {kirimQilaOladi && (
            <Link
              href="/ombor/kirim/yangi"
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Yangi kirim
            </Link>
          )}
        </div>
      </div>

      {barchasimi ? (
        <BarchaFiliallar filiallar={filiallar} />
      ) : qoldiq.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Omborda hali material yo&apos;q. Kirim hujjati bilan boshlanadi.
        </p>
      ) : (
        <>
          {olchamli.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-slate-700">
                Rulon va qoldiq kesma
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Qoldiq <b>eni × bo&apos;yi</b> bilan saqlanadi, kv.m hisoblanadi (Q-05).
                Band — pozitsiyaga biriktirilgan, hali kesilmagan (7.3).
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Material</th>
                      <th className="px-4 py-2.5 text-right font-medium">Jami</th>
                      <th className="px-4 py-2.5 text-right font-medium">Bo&apos;sh</th>
                      <th className="px-4 py-2.5 text-right font-medium">Band</th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        Yo&apos;lda
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">Bo&apos;lak</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {olchamli.map((q) => (
                      <tr key={q.materialId}>
                        <td className="px-4 py-2.5 font-medium">{q.nom}</td>
                        <td className="raqam px-4 py-2.5">{kvM(q.jamiKvM)}</td>
                        <td className="raqam px-4 py-2.5 text-emerald-700">
                          {kvM(q.boshKvM)}
                        </td>
                        <td className="raqam px-4 py-2.5 text-amber-700">
                          {q.bandKvM > 0 ? kvM(q.bandKvM) : <span className="text-slate-300">—</span>}
                        </td>
                        {/* 20.7.4 — jo'natilgan, hali qabul qilinmagan */}
                        <td className="raqam px-4 py-2.5 text-sky-700">
                          {q.yoldaKvM > 0 ? (
                            kvM(q.yoldaKvM)
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="raqam px-4 py-2.5 text-slate-500">{q.bolakSoni}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={`/ombor/${String(q.materialId)}`}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            Kartochka
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-400">Barcha son — kv.m</p>
            </section>
          )}

          {donali.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-slate-700">
                Chiziqli va dona material
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Material</th>
                      <th className="px-4 py-2.5 text-right font-medium">Qoldiq</th>
                      <th className="px-4 py-2.5 font-medium">Birlik</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donali.map((q) => {
                      const birlik = q.sarflashBirligi as SarflashBirligi;
                      // Q-01 — chiziqli material smda saqlanadi, metrda ko'rsatiladi
                      const korinish =
                        birlik === 'SM'
                          ? `${(q.miqdor / 100).toFixed(2)} m`
                          : `${String(q.miqdor)} ${SARFLASH_BIRLIGI_NOMI[birlik]}`;

                      const kamqoldiq =
                        birlik === 'SM' &&
                        q.kamQoldiqChegaraM !== null &&
                        q.miqdor / 100 < q.kamQoldiqChegaraM;

                      return (
                        <tr key={q.materialId}>
                          <td className="px-4 py-2.5 font-medium">{q.nom}</td>
                          <td className="raqam px-4 py-2.5">
                            {korinish}
                            {kamqoldiq && (
                              <span className="ml-2 text-xs text-amber-700">kam qoldiq</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {birlik === 'SM' ? 'smda saqlanadi (Q-01)' : SARFLASH_BIRLIGI_NOMI[birlik]}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Link
                              href={`/ombor/${String(q.materialId)}`}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              Kartochka
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/**
 * TZ 20.6.2 — barcha filiallar bir jadvalda.
 *
 * ⚠️ «Yo'lda» ustuni alohida turadi (20.7.4): u hech qaysi filial
 *    qoldig'ida emas, lekin korxonada bor — yig'indi shundan
 *    to'g'ri chiqadi (2.1-invariant).
 */
function BarchaFiliallar({
  filiallar,
}: {
  filiallar: readonly FilialQoldigi[];
}) {
  const qatorlar = filiallar.flatMap((f) =>
    f.materiallar
      .filter((m) => m.hisobTuri === 'RULON')
      .map((m) => ({ filialNomi: f.filialNomi, material: m })),
  );

  if (qatorlar.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
        Hech bir filialda material yo&apos;q.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Material</th>
            <th className="px-4 py-2.5 font-medium">Filial</th>
            <th className="px-4 py-2.5 text-right font-medium">Jami</th>
            <th className="px-4 py-2.5 text-right font-medium">Bo&apos;sh</th>
            <th className="px-4 py-2.5 text-right font-medium">Band</th>
            <th className="px-4 py-2.5 text-right font-medium">Yo&apos;lda</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {qatorlar.map((q) => (
            <tr key={`${q.filialNomi}-${String(q.material.materialId)}`}>
              <td className="px-4 py-2.5 font-medium">{q.material.nom}</td>
              <td className="px-4 py-2.5 text-slate-600">{q.filialNomi}</td>
              <td className="raqam px-4 py-2.5">{kvM(q.material.jamiKvM)}</td>
              <td className="raqam px-4 py-2.5 text-emerald-700">
                {kvM(q.material.boshKvM)}
              </td>
              <td className="raqam px-4 py-2.5 text-amber-700">
                {q.material.bandKvM > 0 ? (
                  kvM(q.material.bandKvM)
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="raqam px-4 py-2.5 text-sky-700">
                {q.material.yoldaKvM > 0 ? (
                  kvM(q.material.yoldaKvM)
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
