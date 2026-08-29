import Link from 'next/link';
import { kamQoldiqmi } from '@/lib/domain/birlik-tanlovi';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi, yigindiQamrov } from '@/lib/ruxsat/tekshir';
import { SARFLASH_BIRLIGI_NOMI, type SarflashBirligi } from '@/lib/sxema/material';
import { barchaFilialQoldigi, filialNomi, filialQoldigi, type FilialQoldigi } from './malumot';

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
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-matn">
            Ombor qoldig&apos;i
          </h1>
          <p className="mt-1 text-sm text-matn-kuchsiz">
            {barchasimi ? 'Barcha filiallar' : nomi} · har filialda o&apos;z ombori (Q-25)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {barchasiniKoradi && (
            <Link
              href={barchasimi ? '/ombor' : '/ombor?filial=barcha'}
              className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
            >
              {barchasimi ? nomi : 'Barcha filiallar'}
            </Link>
          )}
          <Link
            href="/ombor/kirim"
            className="rounded-maydon border border-chegara-quyuq px-3.5 py-2 text-sm font-medium text-matn-ikki transition-all active:scale-[0.98] hover:bg-fon"
          >
            Kirim hujjatlari
          </Link>
          {kirimQilaOladi && (
            <Link
              href="/ombor/kirim/yangi"
              className="rounded-maydon bg-brend px-3.5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-brend-quyuq"
            >
              Yangi kirim
            </Link>
          )}
        </div>
      </div>

      {barchasimi ? (
        <BarchaFiliallar filiallar={filiallar} />
      ) : qoldiq.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Omborda hali material yo&apos;q. Kirim hujjati bilan boshlanadi.
        </p>
      ) : (
        <>
          {olchamli.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-matn-ikki">Rulon va qoldiq kesma</h2>
              <p className="mb-3 text-xs text-matn-kuchsiz">
                Qoldiq <b>eni × bo&apos;yi</b> bilan saqlanadi, kv.m hisoblanadi (Q-05). Band —
                pozitsiyaga biriktirilgan, hali kesilmagan (7.3).
              </p>

              <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                <table className="w-full text-sm">
                  <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                      <th className="px-4 py-2.5 text-right font-medium">Jami</th>
                      <th className="px-4 py-2.5 text-right font-medium">Bo&apos;sh</th>
                      <th className="px-4 py-2.5 text-right font-medium">Band</th>
                      <th className="px-4 py-2.5 text-right font-medium">Yo&apos;lda</th>
                      <th className="px-4 py-2.5 text-right font-medium">Bo&apos;lak</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                    {olchamli.map((q) => (
                      <tr key={q.materialId}>
                        <td className="px-4 py-2.5 font-medium">{q.nom}</td>
                        <td className="raqam px-4 py-2.5">{kvM(q.jamiKvM)}</td>
                        <td className="raqam px-4 py-2.5 text-belgi-yashil">{kvM(q.boshKvM)}</td>
                        <td className="raqam px-4 py-2.5 text-belgi-sariq">
                          {q.bandKvM > 0 ? (
                            kvM(q.bandKvM)
                          ) : (
                            <span className="text-matn-kuchsiz">—</span>
                          )}
                        </td>
                        {/* 20.7.4 — jo'natilgan, hali qabul qilinmagan */}
                        <td className="raqam px-4 py-2.5 text-brend">
                          {q.yoldaKvM > 0 ? (
                            kvM(q.yoldaKvM)
                          ) : (
                            <span className="text-matn-kuchsiz">—</span>
                          )}
                        </td>
                        <td className="raqam px-4 py-2.5 text-matn-kuchsiz">{q.bolakSoni}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={`/ombor/${String(q.materialId)}`}
                            className="text-matn-ikki hover:text-matn"
                          >
                            Kartochka
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-matn-kuchsiz">Barcha son — kv.m</p>
            </section>
          )}

          {donali.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-matn-ikki">Chiziqli va dona mahsulot</h2>
              <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
                <table className="w-full text-sm">
                  <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Mahsulot</th>
                      <th className="px-4 py-2.5 text-right font-medium">Qoldiq</th>
                      <th className="px-4 py-2.5 font-medium">Birlik</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                    {donali.map((q) => {
                      const birlik = q.sarflashBirligi as SarflashBirligi;
                      // Q-01 — chiziqli material smda saqlanadi, metrda ko'rsatiladi
                      const korinish =
                        birlik === 'SM'
                          ? `${(q.miqdor / 100).toFixed(2)} m`
                          : `${String(q.miqdor)} ${SARFLASH_BIRLIGI_NOMI[birlik]}`;

                      /** Q-10 — hisob bitta joyda: dona mahsulotda ham ishlaydi */
                      const kamqoldiq = kamQoldiqmi(birlik, q.miqdor, q.kamQoldiqChegaraM);

                      return (
                        <tr key={q.materialId}>
                          <td className="px-4 py-2.5 font-medium">{q.nom}</td>
                          <td className="raqam px-4 py-2.5">
                            {korinish}
                            {kamqoldiq && (
                              <span className="ml-2 text-xs text-belgi-sariq">kam qoldiq</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-matn-kuchsiz">
                            {birlik === 'SM'
                              ? 'smda saqlanadi (Q-01)'
                              : SARFLASH_BIRLIGI_NOMI[birlik]}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Link
                              href={`/ombor/${String(q.materialId)}`}
                              className="text-matn-ikki hover:text-matn"
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
function BarchaFiliallar({ filiallar }: { filiallar: readonly FilialQoldigi[] }) {
  const qatorlar = filiallar.flatMap((f) =>
    f.materiallar
      .filter((m) => m.hisobTuri === 'RULON')
      .map((m) => ({ filialNomi: f.filialNomi, material: m })),
  );

  if (qatorlar.length === 0) {
    return (
      <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
        Hech bir filialda material yo&apos;q.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
      <table className="w-full text-sm">
        <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
          <tr>
            <th className="px-4 py-2.5 font-medium">Mahsulot</th>
            <th className="px-4 py-2.5 font-medium">Filial</th>
            <th className="px-4 py-2.5 text-right font-medium">Jami</th>
            <th className="px-4 py-2.5 text-right font-medium">Bo&apos;sh</th>
            <th className="px-4 py-2.5 text-right font-medium">Band</th>
            <th className="px-4 py-2.5 text-right font-medium">Yo&apos;lda</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
          {qatorlar.map((q) => (
            <tr key={`${q.filialNomi}-${String(q.material.materialId)}`}>
              <td className="px-4 py-2.5 font-medium">{q.material.nom}</td>
              <td className="px-4 py-2.5 text-matn-ikki">{q.filialNomi}</td>
              <td className="raqam px-4 py-2.5">{kvM(q.material.jamiKvM)}</td>
              <td className="raqam px-4 py-2.5 text-belgi-yashil">{kvM(q.material.boshKvM)}</td>
              <td className="raqam px-4 py-2.5 text-belgi-sariq">
                {q.material.bandKvM > 0 ? (
                  kvM(q.material.bandKvM)
                ) : (
                  <span className="text-matn-kuchsiz">—</span>
                )}
              </td>
              <td className="raqam px-4 py-2.5 text-brend">
                {q.material.yoldaKvM > 0 ? (
                  kvM(q.material.yoldaKvM)
                ) : (
                  <span className="text-matn-kuchsiz">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
