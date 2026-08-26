import Link from 'next/link';
import { sahifaRuxsati } from '@/lib/kirish/joriy';
import { ruxsatBormi } from '@/lib/ruxsat/tekshir';
import { pulKorsat, som } from '@/lib/domain/pul';
import { adminKassalari, faolFiliallar, filialHarakatRoyxati, filialHisobi } from '../malumot';
import { TolovFormasi, TuzatishFormasi } from '../hisob-forma';

export const dynamic = 'force-dynamic';

const TUR_NOMI: Record<string, string> = {
  TAYYOR_MAHSULOT: 'Tayyor mahsulot',
  MATERIAL_KOCHIRISH: "Material ko'chirish",
  PUL_TOPSHIRISH: 'Pul topshirish',
  TOLOV: "To'lov",
  QAYTARISH: 'Qaytarish',
  QOLDA_TUZATISH: "Qo'lda tuzatish",
};

export default async function FilialHisobi() {
  const f = await sahifaRuxsati('filial.hisob');

  const [hisob, harakatlar] = await Promise.all([
    filialHisobi(f.filialId),
    filialHarakatRoyxati(f.filialId),
  ]);

  const tolayOladi = ruxsatBormi(f, 'filial.tolov');
  const tuzataOladi = ruxsatBormi(f, 'filial.tuzatish');

  const kassalar = tolayOladi ? await adminKassalari() : [];
  const filiallar = tuzataOladi ? await faolFiliallar() : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/kassa" className="text-sm text-matn-kuchsiz hover:text-matn">
          ← Kassa
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-matn">
          Filiallararo hisob-kitob
        </h1>
        <p className="mt-1 text-sm text-matn-kuchsiz">
          Manfiy — biz qarzdormiz, musbat — bizga qarzdor (22.6.1)
        </p>
      </div>

      {hisob.juftlar.length === 0 ? (
        <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-10 text-center text-sm text-matn-kuchsiz">
          Boshqa filiallar bilan hisob-kitob yo&apos;q.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
          <table className="w-full text-sm">
            <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
              <tr>
                <th className="px-4 py-2.5 font-medium">Filial</th>
                <th className="px-4 py-2.5 text-right font-medium">Balans</th>
                <th className="px-4 py-2.5 font-medium">Kim qarzdor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
              {hisob.juftlar.map((j) => (
                <tr key={j.filialId}>
                  <td className="px-4 py-2.5">{j.nom}</td>
                  <td
                    className={`raqam px-4 py-2.5 text-right ${
                      Number(j.balans) < 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                    }`}
                  >
                    {pulKorsat(som(j.balans))}
                  </td>
                  <td className="px-4 py-2.5 text-matn-kuchsiz">
                    {Number(j.balans) === 0
                      ? '—'
                      : Number(j.balans) < 0
                        ? 'biz qarzdormiz'
                        : 'bizga qarzdor'}
                  </td>
                </tr>
              ))}
              <tr className="bg-fon font-medium">
                <td className="px-4 py-2.5">Sof balans</td>
                <td
                  className={`raqam px-4 py-2.5 text-right ${
                    Number(hisob.sof) < 0 ? 'text-belgi-qizil' : 'text-belgi-yashil'
                  }`}
                >
                  {pulKorsat(som(hisob.sof))}
                </td>
                <td className="px-4 py-2.5" />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tolayOladi && kassalar.length >= 2 && <TolovFormasi kassalar={kassalar} />}
        {tuzataOladi && filiallar.length >= 2 && <TuzatishFormasi filiallar={filiallar} />}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Harakatlar (22.7.2)</h2>

        {harakatlar.length === 0 ? (
          <p className="rounded-karta border border-dashed border-chegara-quyuq px-4 py-8 text-center text-sm text-matn-kuchsiz">
            Hali harakat yo&apos;q.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-karta border border-chegara bg-sirt">
            <table className="w-full text-sm">
              <thead className="border-b border-chegara bg-fon text-left text-xs uppercase tracking-wide text-matn-kuchsiz">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Sabab</th>
                  <th className="px-4 py-2.5 font-medium">Yo&apos;nalish</th>
                  <th className="px-4 py-2.5 text-right font-medium">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chegara [&>tr:nth-child(even)]:bg-fon/50">
                {harakatlar.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5">{h.sana.toLocaleDateString('uz-UZ')}</td>
                    <td className="px-4 py-2.5">
                      {TUR_NOMI[h.turi] ?? h.turi}
                      {h.qoldaOzgartirildi && (
                        <span className="ml-1 text-belgi-sariq" title="Qo'lda">
                          ⚠️
                        </span>
                      )}
                      {h.izoh !== null && <div className="text-xs text-matn-kuchsiz">{h.izoh}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-matn-ikki">
                      {h.kimdanNom} → {h.kimgaNom}
                    </td>
                    <td className="raqam px-4 py-2.5 text-right">{pulKorsat(som(h.summa))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-matn-kuchsiz">
          Filiallararo qarz foyda-zararga tegmaydi — bu korxona ichidagi harakat (22.7.3).
        </p>
      </section>
    </div>
  );
}
